from typing import Generic, TypeVar, List
from pydantic import BaseModel
from math import ceil

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, size: int):
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=ceil(total / size) if size > 0 else 0
        )
