from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, Any, Optional, List
from uuid import UUID
from datetime import datetime

# --- Proxy Schemas ---
class FormDataField(BaseModel):
    key: str
    value: Optional[str] = ""
    type: str = "text"  # "text" or "file"
    file_data: Optional[str] = None  # Base64 encoded file content
    file_id: Optional[UUID] = None  # Persistent file ID
    file_name: Optional[str] = None
    content_type: Optional[str] = None

class ProxyRequest(BaseModel):
    method: str = Field(..., description="HTTP Method")
    url: str = Field(..., description="Target URL")
    headers: Optional[Dict[str, str]] = Field(default_factory=dict, description="Request Headers")
    body: Optional[Any] = Field(None, description="Request Body")
    form_data: Optional[List[FormDataField]] = Field(None, description="Form data fields for multipart requests")

class ProxyResponse(BaseModel):
    status: int
    statusText: str
    time: float
    size: float
    headers: Dict[str, str]
    body: Any
    cookies: Dict[str, str]

# --- Database Schemas ---

class APIRequestBase(BaseModel):
    name: str
    method: str = "GET"
    protocol: str = "http"
    url: str = ""
    params: List[Dict[str, Any]] = []
    headers: List[Dict[str, Any]] = []
    body: Dict[str, Any] = {"type": "none", "content": ""}
    auth: Dict[str, Any] = {"type": "none"}
    pre_request_script: Optional[str] = None
    test_script: Optional[str] = None
    order: int = 0

class APIRequestCreate(APIRequestBase):
    collection_id: UUID

class APIRequestUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    protocol: Optional[str] = None
    url: Optional[str] = None
    params: Optional[List[Dict[str, Any]]] = None
    headers: Optional[List[Dict[str, Any]]] = None
    body: Optional[Dict[str, Any]] = None
    auth: Optional[Dict[str, Any]] = None
    pre_request_script: Optional[str] = None
    test_script: Optional[str] = None
    order: Optional[int] = None

class APIRequest(APIRequestBase):
    id: UUID
    collection_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class APIFolderOut(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID]
    requests: List[APIRequest] = []
    folders: List['APIFolderOut'] = []

    class Config:
        from_attributes = True

class APICollectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: UUID
    parent_id: Optional[UUID] = None

class APICollectionCreate(APICollectionBase):
    pass

class APICollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class APICollection(APICollectionBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    api_requests: List[APIRequest] = []
    children: List['APICollection'] = []

    class Config:
        from_attributes = True

class APICollectionTree(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID]
    requests: List[APIRequest] = []
    folders: List['APICollectionTree'] = []
    
    class Config:
        from_attributes = True

# --- Environment Schemas ---

class EnvironmentVariableSchema(BaseModel):
    id: Optional[str] = None
    key: str = ""
    value: str = ""
    enabled: bool = True
    secret: bool = False

class EnvironmentBase(BaseModel):
    name: str
    project_id: UUID
    variables: List[EnvironmentVariableSchema] = []
    is_default: bool = False

class EnvironmentCreate(EnvironmentBase):
    pass

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    variables: Optional[List[EnvironmentVariableSchema]] = None
    is_default: Optional[bool] = None

class Environment(BaseModel):
    id: UUID
    name: str
    project_id: UUID
    variables: List[Dict[str, Any]] = []
    is_default: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

