"""
PostgreSQL Integration
Execute SQL queries and database operations
"""
import asyncpg
from typing import Dict, Any, Optional, List
from .base import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry
)


@IntegrationRegistry.register("postgresql")
class PostgreSQLIntegration(BaseIntegration):
    """
    PostgreSQL integration for database operations.
    Supports queries, inserts, updates, and transactions.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="postgresql",
            name="PostgreSQL",
            description="Execute SQL queries on PostgreSQL databases",
            category=IntegrationCategory.DATABASE,
            icon="database",
            color="#336791",
            auth_type="custom",
            config_schema={
                "type": "object",
                "required": ["action"],
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["execute_query", "insert", "update", "delete"],
                        "default": "execute_query",
                        "title": "Action"
                    },
                    "query": {
                        "type": "string",
                        "title": "SQL Query",
                        "description": "SQL query to execute"
                    },
                    "table": {
                        "type": "string",
                        "title": "Table Name",
                        "description": "Table for insert/update/delete operations"
                    },
                    "columns": {
                        "type": "string",
                        "title": "Columns (JSON)",
                        "description": "Column-value pairs as JSON object for insert/update"
                    },
                    "where": {
                        "type": "string",
                        "title": "WHERE Clause",
                        "description": "WHERE condition for update/delete (without 'WHERE' keyword)"
                    },
                    "parameters": {
                        "type": "string",
                        "title": "Query Parameters (JSON)",
                        "description": "Parameterized query values as JSON array"
                    },
                    "limit": {
                        "type": "integer",
                        "title": "Limit",
                        "description": "Maximum rows to return",
                        "default": 100
                    },
                    "return_rows": {
                        "type": "boolean",
                        "title": "Return Rows",
                        "description": "Return query results",
                        "default": True
                    }
                }
            },
            credential_fields=[
                {"name": "host", "type": "text", "required": True, "title": "Host"},
                {"name": "port", "type": "number", "required": True, "title": "Port", "default": 5432},
                {"name": "database", "type": "text", "required": True, "title": "Database"},
                {"name": "user", "type": "text", "required": True, "title": "Username"},
                {"name": "password", "type": "password", "required": True, "title": "Password"},
                {"name": "ssl", "type": "boolean", "required": False, "title": "Use SSL"},
            ]
        )
    
    async def _get_connection(self, credentials: Dict[str, Any]) -> asyncpg.Connection:
        """Create a database connection"""
        ssl = "require" if credentials.get("ssl", False) else None
        return await asyncpg.connect(
            host=credentials.get("host"),
            port=int(credentials.get("port", 5432)),
            database=credentials.get("database"),
            user=credentials.get("user"),
            password=credentials.get("password"),
            ssl=ssl
        )
    
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        result = IntegrationResult(success=False)
        result.add_log("info", "Starting PostgreSQL integration")
        
        if not credentials:
            result.error = "Database credentials are required"
            result.error_type = "missing_credentials"
            return result
        
        action = node_config.get("action", "execute_query")
        
        if action == "execute_query":
            return await self._execute_query(node_config, input_data, credentials, result)
        elif action == "insert":
            return await self._insert(node_config, input_data, credentials, result)
        elif action == "update":
            return await self._update(node_config, input_data, credentials, result)
        elif action == "delete":
            return await self._delete(node_config, input_data, credentials, result)
        else:
            result.error = f"Unknown action: {action}"
            result.error_type = "invalid_action"
            return result
    
    async def _execute_query(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        query = self.interpolate_variables(node_config.get("query", ""), input_data)
        if not query:
            result.error = "SQL query is required"
            result.error_type = "missing_config"
            return result
        
        # Parse parameters
        params = None
        if node_config.get("parameters"):
            try:
                import json
                params_str = self.interpolate_variables(node_config["parameters"], input_data)
                params = json.loads(params_str)
            except Exception as e:
                result.add_log("warn", f"Failed to parse parameters: {e}")
        
        limit = node_config.get("limit", 100)
        return_rows = node_config.get("return_rows", True)
        
        result.add_log("info", f"Executing query: {query[:100]}...")
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            
            # Execute query
            if return_rows:
                if params:
                    rows = await conn.fetch(query, *params)
                else:
                    rows = await conn.fetch(query)
                
                # Convert to list of dicts
                data = [dict(row) for row in rows[:limit]]
                
                # Convert non-JSON-serializable types
                for row in data:
                    for key, value in row.items():
                        if hasattr(value, 'isoformat'):
                            row[key] = value.isoformat()
                        elif isinstance(value, bytes):
                            row[key] = value.hex()
                
                result.success = True
                result.data = {
                    "rows": data,
                    "row_count": len(data),
                    "truncated": len(rows) > limit
                }
                result.add_log("info", f"Query returned {len(data)} rows")
            else:
                if params:
                    status = await conn.execute(query, *params)
                else:
                    status = await conn.execute(query)
                
                result.success = True
                result.data = {"status": status}
                result.add_log("info", f"Query executed: {status}")
        
        except asyncpg.exceptions.PostgresError as e:
            result.error = f"PostgreSQL error: {str(e)}"
            result.error_type = "database_error"
            result.add_log("error", result.error)
        except Exception as e:
            result.error = f"Failed to execute query: {str(e)}"
            result.error_type = "connection_error"
            result.add_log("error", result.error)
        finally:
            if conn:
                await conn.close()
        
        return result
    
    async def _insert(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        table = node_config.get("table")
        if not table:
            result.error = "Table name is required"
            result.error_type = "missing_config"
            return result
        
        # Parse columns
        if not node_config.get("columns"):
            result.error = "Columns are required for insert"
            result.error_type = "missing_config"
            return result
        
        try:
            import json
            columns_str = self.interpolate_variables(node_config["columns"], input_data)
            columns = json.loads(columns_str)
        except Exception as e:
            result.error = f"Failed to parse columns: {e}"
            result.error_type = "invalid_config"
            return result
        
        # Build INSERT query
        col_names = ", ".join(columns.keys())
        placeholders = ", ".join(f"${i+1}" for i in range(len(columns)))
        values = list(columns.values())
        
        query = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) RETURNING *"
        
        result.add_log("info", f"Inserting into {table}")
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            row = await conn.fetchrow(query, *values)
            
            result.success = True
            result.data = {"inserted": dict(row) if row else None}
            result.add_log("info", "Row inserted successfully")
        
        except asyncpg.exceptions.PostgresError as e:
            result.error = f"Insert failed: {str(e)}"
            result.error_type = "database_error"
        except Exception as e:
            result.error = f"Failed to insert: {str(e)}"
            result.error_type = "connection_error"
        finally:
            if conn:
                await conn.close()
        
        return result
    
    async def _update(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        table = node_config.get("table")
        where_clause = self.interpolate_variables(node_config.get("where", ""), input_data)
        
        if not table:
            result.error = "Table name is required"
            result.error_type = "missing_config"
            return result
        
        if not where_clause:
            result.error = "WHERE clause is required for update (safety check)"
            result.error_type = "missing_config"
            return result
        
        # Parse columns
        if not node_config.get("columns"):
            result.error = "Columns are required for update"
            result.error_type = "missing_config"
            return result
        
        try:
            import json
            columns_str = self.interpolate_variables(node_config["columns"], input_data)
            columns = json.loads(columns_str)
        except Exception as e:
            result.error = f"Failed to parse columns: {e}"
            result.error_type = "invalid_config"
            return result
        
        # Build UPDATE query
        set_clauses = ", ".join(f"{col} = ${i+1}" for i, col in enumerate(columns.keys()))
        values = list(columns.values())
        
        query = f"UPDATE {table} SET {set_clauses} WHERE {where_clause}"
        
        result.add_log("info", f"Updating {table} WHERE {where_clause}")
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            status = await conn.execute(query, *values)
            
            # Parse affected rows from status (e.g., "UPDATE 5")
            affected = 0
            if status and "UPDATE" in status:
                try:
                    affected = int(status.split()[-1])
                except ValueError:
                    pass
            
            result.success = True
            result.data = {"status": status, "affected_rows": affected}
            result.add_log("info", f"Updated {affected} rows")
        
        except asyncpg.exceptions.PostgresError as e:
            result.error = f"Update failed: {str(e)}"
            result.error_type = "database_error"
        except Exception as e:
            result.error = f"Failed to update: {str(e)}"
            result.error_type = "connection_error"
        finally:
            if conn:
                await conn.close()
        
        return result
    
    async def _delete(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        table = node_config.get("table")
        where_clause = self.interpolate_variables(node_config.get("where", ""), input_data)
        
        if not table:
            result.error = "Table name is required"
            result.error_type = "missing_config"
            return result
        
        if not where_clause:
            result.error = "WHERE clause is required for delete (safety check)"
            result.error_type = "missing_config"
            return result
        
        query = f"DELETE FROM {table} WHERE {where_clause}"
        
        result.add_log("info", f"Deleting from {table} WHERE {where_clause}")
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            status = await conn.execute(query)
            
            # Parse affected rows
            affected = 0
            if status and "DELETE" in status:
                try:
                    affected = int(status.split()[-1])
                except ValueError:
                    pass
            
            result.success = True
            result.data = {"status": status, "affected_rows": affected}
            result.add_log("info", f"Deleted {affected} rows")
        
        except asyncpg.exceptions.PostgresError as e:
            result.error = f"Delete failed: {str(e)}"
            result.error_type = "database_error"
        except Exception as e:
            result.error = f"Failed to delete: {str(e)}"
            result.error_type = "connection_error"
        finally:
            if conn:
                await conn.close()
        
        return result
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        result = IntegrationResult(success=False)
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            version = await conn.fetchval("SELECT version()")
            
            result.success = True
            result.data = {
                "connected": True,
                "version": version,
                "database": credentials.get("database")
            }
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        finally:
            if conn:
                await conn.close()
        
        return result
