from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_test_cases():
    """
    List all test cases.
    """
    return {"message": "Test cases endpoint - to be implemented"}

@router.post("/")
async def create_test_case():
    """
    Create a new test case.
    """
    return {"message": "Create test case - to be implemented"}
