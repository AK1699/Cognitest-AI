"""
MySQL Integration
Execute SQL queries on MySQL databases
"""
import aiomysql
from typing import Dict, Any, Optional, List
from .base import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry
)


@IntegrationRegistry.register("mysql")
class MySQLIntegration(BaseIntegration):
    """
    MySQL integration for database operations.
    Supports queries, inserts, updates, and deletes.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="mysql",
            name="MySQL",
            description="Execute SQL queries on MySQL databases",
            category=IntegrationCategory.DATABASE,
            icon="database",
            color="#4479A1",
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
                        "title": "SQL Query"
                    },
                    "table": {
                        "type": "string",
                        "title": "Table Name"
                    },
                    "columns": {
                        "type": "string",
                        "title": "Columns (JSON)"
                    },
                    "where": {
                        "type": "string",
                        "title": "WHERE Clause"
                    },
                    "parameters": {
                        "type": "string",
                        "title": "Query Parameters (JSON array)"
                    },
                    "limit": {
                        "type": "integer",
                        "default": 100,
                        "title": "Limit"
                    }
                }
            },
            credential_fields=[
                {"name": "host", "type": "text", "required": True, "title": "Host"},
                {"name": "port", "type": "number", "required": True, "title": "Port", "default": 3306},
                {"name": "database", "type": "text", "required": True, "title": "Database"},
                {"name": "user", "type": "text", "required": True, "title": "Username"},
                {"name": "password", "type": "password", "required": True, "title": "Password"},
                {"name": "charset", "type": "text", "required": False, "title": "Charset", "default": "utf8mb4"},
            ]
        )
    
    async def _get_connection(self, credentials: Dict[str, Any]):
        """Create a MySQL connection"""
        return await aiomysql.connect(
            host=credentials.get("host"),
            port=int(credentials.get("port", 3306)),
            user=credentials.get("user"),
            password=credentials.get("password"),
            db=credentials.get("database"),
            charset=credentials.get("charset", "utf8mb4")
        )
    
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        result = IntegrationResult(success=False)
        result.add_log("info", "Starting MySQL integration")
        
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
        
        params = None
        if node_config.get("parameters"):
            try:
                import json
                params_str = self.interpolate_variables(node_config["parameters"], input_data)
                params = json.loads(params_str)
            except Exception:
                pass
        
        limit = node_config.get("limit", 100)
        
        result.add_log("info", f"Executing query: {query[:100]}...")
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                if params:
                    await cursor.execute(query, params)
                else:
                    await cursor.execute(query)
                
                # Check if it's a SELECT query
                if query.strip().upper().startswith("SELECT"):
                    rows = await cursor.fetchmany(limit)
                    
                    # Convert dates to strings
                    data = []
                    for row in rows:
                        row_dict = dict(row)
                        for key, value in row_dict.items():
                            if hasattr(value, 'isoformat'):
                                row_dict[key] = value.isoformat()
                            elif isinstance(value, bytes):
                                row_dict[key] = value.hex()
                        data.append(row_dict)
                    
                    result.success = True
                    result.data = {
                        "rows": data,
                        "row_count": len(data)
                    }
                else:
                    await conn.commit()
                    result.success = True
                    result.data = {
                        "affected_rows": cursor.rowcount,
                        "last_id": cursor.lastrowid
                    }
                
                result.add_log("info", "Query executed successfully")
        
        except aiomysql.Error as e:
            result.error = f"MySQL error: {str(e)}"
            result.error_type = "database_error"
        except Exception as e:
            result.error = f"Failed to execute query: {str(e)}"
            result.error_type = "connection_error"
        finally:
            if conn:
                conn.close()
        
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
        
        col_names = ", ".join(f"`{k}`" for k in columns.keys())
        placeholders = ", ".join(["%s"] * len(columns))
        values = list(columns.values())
        
        query = f"INSERT INTO `{table}` ({col_names}) VALUES ({placeholders})"
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            
            async with conn.cursor() as cursor:
                await cursor.execute(query, values)
                await conn.commit()
                
                result.success = True
                result.data = {
                    "last_id": cursor.lastrowid,
                    "affected_rows": cursor.rowcount
                }
                result.add_log("info", f"Row inserted with ID {cursor.lastrowid}")
        
        except aiomysql.Error as e:
            result.error = f"Insert failed: {str(e)}"
            result.error_type = "database_error"
        except Exception as e:
            result.error = f"Failed to insert: {str(e)}"
            result.error_type = "connection_error"
        finally:
            if conn:
                conn.close()
        
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
            result.error = "WHERE clause is required"
            result.error_type = "missing_config"
            return result
        
        if not node_config.get("columns"):
            result.error = "Columns are required"
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
        
        set_clauses = ", ".join(f"`{k}` = %s" for k in columns.keys())
        values = list(columns.values())
        
        query = f"UPDATE `{table}` SET {set_clauses} WHERE {where_clause}"
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            
            async with conn.cursor() as cursor:
                await cursor.execute(query, values)
                await conn.commit()
                
                result.success = True
                result.data = {"affected_rows": cursor.rowcount}
                result.add_log("info", f"Updated {cursor.rowcount} rows")
        
        except aiomysql.Error as e:
            result.error = f"Update failed: {str(e)}"
            result.error_type = "database_error"
        except Exception as e:
            result.error = f"Failed to update: {str(e)}"
            result.error_type = "connection_error"
        finally:
            if conn:
                conn.close()
        
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
            result.error = "WHERE clause is required"
            result.error_type = "missing_config"
            return result
        
        query = f"DELETE FROM `{table}` WHERE {where_clause}"
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            
            async with conn.cursor() as cursor:
                await cursor.execute(query)
                await conn.commit()
                
                result.success = True
                result.data = {"affected_rows": cursor.rowcount}
                result.add_log("info", f"Deleted {cursor.rowcount} rows")
        
        except aiomysql.Error as e:
            result.error = f"Delete failed: {str(e)}"
            result.error_type = "database_error"
        except Exception as e:
            result.error = f"Failed to delete: {str(e)}"
            result.error_type = "connection_error"
        finally:
            if conn:
                conn.close()
        
        return result
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        result = IntegrationResult(success=False)
        
        conn = None
        try:
            conn = await self._get_connection(credentials)
            
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT VERSION()")
                version = await cursor.fetchone()
            
            result.success = True
            result.data = {
                "connected": True,
                "version": version[0] if version else "Unknown",
                "database": credentials.get("database")
            }
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        finally:
            if conn:
                conn.close()
        
        return result
