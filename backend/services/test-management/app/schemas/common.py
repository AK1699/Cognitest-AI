from pydantic import BaseModel
from typing import List, Generic, TypeVar

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema."""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int = 0
    
    def model_post_init(self, __context):
        """Calculate pages after initialization."""
        if self.size > 0:
            object.__setattr__(self, 'pages', (self.total + self.size - 1) // self.size)
