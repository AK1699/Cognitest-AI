# Comprehensive AI Self-Learning: Documents + Feedback + Outputs

## Complete System Overview

Your Cognitest AI now learns from **EVERYTHING**:

```
User Input (All Types)
    ├─ Text Descriptions
    ├─ Document Uploads (PDF, DOCX, etc.)
    ├─ File Uploads (CSV, JSON, YAML, etc.)
    ├─ Structured Data
    └─ Test Specifications
         ↓
    INGESTION SERVICE
         ↓
    Document Chunking & Processing
         ↓
    Embedding Creation
         ↓
    Vector DB Storage (Qdrant)
         ↓
    RETRIEVAL FOR CONTEXT
         ↓
    Agents Use Documents as Context
         ↓
    Generate Better Outputs
         ↓
    User Feedback Collected
         ↓
    LEARNING LOOP (Continuous Improvement)
         ↓
    Performance Tracked & Analyzed
```

## What Gets Stored & Learned

### 1. **Text Input** - Descriptions, Requirements, Specifications
```
User Input: "Create test plan for payment processing with PCI compliance"
                    ↓
            Stored in Vector DB
                    ↓
        Used as Context for Future Tasks
                    ↓
        Agent: "Based on your past requirements about payment processing..."
```

### 2. **File Uploads** - Any Document Type
```
Supported:
├─ PDF Documents
├─ Word Documents (.docx, .doc)
├─ Spreadsheets (.xlsx, .csv)
├─ Code Files (.py, .js, .java, etc.)
├─ Data Files (.json, .yaml)
├─ Text Files (.txt, .md)
└─ Markup Files (.html, .xml)

All Extracted → Chunks → Embeddings → Learned
```

### 3. **Structured Data** - JSON, Metadata, Specifications
```
Example:
{
  "test_requirements": [
    {"area": "security", "priority": "critical"},
    {"area": "performance", "priority": "high"}
  ]
}
                    ↓
        Converted to Text → Stored → Learned
```

### 4. **Generated Outputs** - Every Test Plan, Test Case, etc.
```
Agent generates test plan → Stored in Vector DB → Used as Context Next Time
```

### 5. **User Feedback** - Acceptance, Ratings, Modifications
```
User: "👍 Accept" + 5 stars → Learned as successful pattern
User: "👎 Reject" + suggestions → Learned as improvement area
```

## System Architecture

### Components Added

```
Services (3):
├─ DocumentIngestionService
│  ├─ ingest_text_input()
│  ├─ ingest_file()
│  ├─ ingest_structured_data()
│  └─ ingest_batch_inputs()
│
├─ DocumentKnowledgeService
│  ├─ store_document_chunks()
│  ├─ retrieve_document_context()
│  ├─ search_documents()
│  └─ update_document_usage()
│
└─ (Existing Services)
   ├─ QdrantService
   ├─ KnowledgeService
   └─ AIService

Models (3):
├─ DocumentKnowledge (stores documents)
├─ DocumentChunk (stores chunks with usage tracking)
└─ DocumentUsageLog (tracks when documents help)

API Endpoints (6):
├─ POST /documents/upload-text
├─ POST /documents/upload-file
├─ POST /documents/upload-structured
├─ GET /documents/project/{id}
├─ GET /documents/{id}
└─ DELETE /documents/{id}
```

## Integration Points

### Agent Integration

Before: Agent generates from scratch
```python
async def execute(self, requirements: str, **kwargs):
    response = await self.generate_response(requirements)
    return response
```

After: Agent uses document context
```python
async def execute(self, requirements: str, **kwargs):
    project_id = kwargs.get("project_id")

    # 1. Get document context
    doc_service = await get_document_knowledge_service()
    relevant_docs = await doc_service.retrieve_document_context(
        project_id=project_id,
        query=requirements,
        limit=5
    )

    # 2. Build enhanced prompt with documents
    prompt = f"""
    Project Documents:
    {self._format_documents(relevant_docs)}

    User Requirement:
    {requirements}
    """

    # 3. Generate with better context
    response = await self.generate_response(prompt)

    # 4. Store for future learning
    await self.store_knowledge(
        collection_name=f"project_{project_id}_outputs",
        text=response,
        metadata={"type": "generated_output"}
    )

    return response
```

## API Usage Examples

### 1. Upload Text Input
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload-text \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "project_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "content=Test authentication with 2FA, email verification, password reset" \
  -F "document_type=requirement" \
  -F "document_name=Auth Requirements"
```

Response:
```json
{
  "document_id": "abc123",
  "document_name": "Auth Requirements",
  "source": "text_input",
  "total_chunks": 2,
  "content_length": 67,
  "message": "Document uploaded and indexed for AI learning"
}
```

### 2. Upload File (PDF, DOCX, CSV, JSON, etc.)
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload-file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "project_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "file=@requirements.pdf" \
  -F "document_type=specification"
```

### 3. Upload Structured Data
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload-structured \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
      "test_coverage": {"unit": 80, "integration": 60, "e2e": 40},
      "priority_areas": ["security", "performance", "usability"],
      "regulatory": ["GDPR", "PCI-DSS"]
    },
    "data_type": "test_specification"
  }'
```

### 4. List Project Documents
```bash
curl -X GET http://localhost:8000/api/v1/documents/project/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
[
  {
    "document_id": "abc123",
    "document_name": "Auth Requirements",
    "document_type": "requirement",
    "source": "text_input",
    "total_chunks": 2,
    "content_length": 67,
    "times_used": 5,
    "created_at": "2025-01-02T10:30:00Z"
  },
  {
    "document_id": "def456",
    "document_name": "requirements.pdf",
    "document_type": "specification",
    "source": "file_upload",
    "total_chunks": 45,
    "content_length": 12500,
    "times_used": 0,
    "created_at": "2025-01-02T11:00:00Z"
  }
]
```

### 5. Get Document Details
```bash
curl -X GET http://localhost:8000/api/v1/documents/abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get Documents Summary
```bash
curl -X GET http://localhost:8000/api/v1/documents/project/550e8400-e29b-41d4-a716-446655440000/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_documents": 15,
  "total_chunks": 250,
  "total_content_length": 125000,
  "by_type": {
    "requirement": 5,
    "specification": 3,
    "document": 4,
    "data": 3
  },
  "by_source": {
    "text_input": 8,
    "file_upload": 5,
    "structured_data": 2
  },
  "total_usage_count": 145
}
```

## Data Flow - Complete Learning Cycle

### 1. User Uploads Requirements Document
```
POST /documents/upload-text
├─ Extract text
├─ Chunk into pieces
├─ Create embeddings
├─ Store in Qdrant
├─ Store metadata in PostgreSQL
└─ Ready for AI context
```

### 2. Agent Generates Test Plan
```
POST /test-plans/generate
├─ Retrieve relevant documents
│  └─ Qdrant semantic search with requirements
├─ Build enhanced prompt
│  └─ Include matched documents
├─ Generate test plan
│  └─ Now informed by documents
├─ Store output
│  └─ For future learning
└─ Return to user
```

### 3. User Provides Feedback
```
POST /ai/feedback/submit
├─ Store feedback in PostgreSQL
├─ Store in Qdrant as learning data
├─ Update document usage stats
│  └─ Track which documents helped
├─ Update performance metrics
└─ Next generation uses this learning
```

### 4. Next Generation (Better Output)
```
POST /test-plans/generate
├─ Retrieve documents
├─ Retrieve feedback patterns
│  └─ "This document worked before"
├─ Retrieve similar outputs
│  └─ "Previous outputs with this document were accepted"
├─ Generate
│  └─ Informed by all previous learning
└─ Better quality output
```

## Supported Document Types

### Text Documents
- `.txt` - Plain text files
- `.md` - Markdown files
- `.rst` - ReStructuredText

### Office Documents
- `.pdf` - PDF files (text extraction)
- `.docx` - Word documents
- `.doc` - Legacy Word documents
- `.xlsx` - Excel spreadsheets
- `.xls` - Legacy Excel

### Data Files
- `.json` - JSON data
- `.csv` - CSV spreadsheets
- `.yaml` - YAML configuration
- `.yml` - YAML configuration

### Code Files
- `.py` - Python code
- `.js` - JavaScript
- `.java` - Java code
- `.cpp` - C++ code
- `.sql` - SQL scripts

### Markup Files
- `.html` - HTML documents
- `.xml` - XML files

## Document Chunking Strategy

```
Large Document (10,000 chars)
    ↓
Chunk Size: 500 characters
Overlap: 50 characters (for context continuity)
    ↓
Chunks:
├─ Chunk 1: chars 0-500
├─ Chunk 2: chars 450-950 (50 char overlap)
├─ Chunk 3: chars 900-1400
└─ ... (20 chunks total)
    ↓
Each Chunk → Embedding → Qdrant
    ↓
Retrieval finds most relevant chunks
```

## Usage Tracking & Learning Metrics

### Document Metrics
```
For each document we track:
├─ times_used_in_generation
│  └─ How many times used as context
├─ relevance_score
│  └─ Average similarity when retrieved
├─ learning_contribution
│  └─ How much it improved outputs (0-1)
└─ last_used_at
   └─ When last used
```

### Document Usage Log
```
For each time document is used:
├─ project_id
├─ document_id
├─ chunk_id
├─ agent_name
├─ query (what matched)
├─ similarity_score
├─ was_useful (did user accept output)
└─ user_feedback
```

This enables tracking which documents are actually helping!

## Example Workflow

### 1. Project Setup
```
User creates project:
"Build test suite for fintech app"
    ↓
Upload documents:
├─ Upload regulatory requirements (PDF)
├─ Upload API specifications (JSON)
├─ Upload security guidelines (text)
└─ Upload test data templates (CSV)
```

### 2. First Test Plan Generation
```
User requests: "Create test plan for payment processing"
    ↓
Agent searches documents:
├─ Finds regulatory requirements PDF
├─ Finds payment API spec JSON
├─ Finds security guidelines
└─ Matches on "payment" keyword
    ↓
Agent generates:
"Based on your regulatory requirements and API specs...
 Payment Test Plan:
 1. PCI-DSS compliance tests (from regulatory doc)
 2. API endpoint coverage (from API spec)
 3. Security tests (from security guidelines)
 ..."
    ↓
User: "Perfect! ⭐⭐⭐⭐⭐"
    ↓
System learns:
- These documents are useful for payment testing
- This generation approach works
- Regulatory doc has 0.95 relevance
```

### 3. Second Test Plan Generation
```
User requests: "Create test plan for transaction refunds"
    ↓
Agent searches documents:
├─ Finds same regulatory requirements (learned useful)
├─ Finds payment API spec (learned useful)
├─ Also retrieves previous payment test plan
├─ Matches with high relevance
    ↓
Agent generates improved plan:
"Based on regulatory requirements, API specifications, and
 your previous payment test plan...
 Refund Test Plan:
 ..."
    ↓
Quality improved because of learned context!
```

## Configuration & Setup

### 1. Enable Document Services
Update `app/main.py`:
```python
from app.api.v1.endpoints import documents

app.include_router(documents.router)
```

### 2. Create Database Tables
```bash
alembic revision --autogenerate -m "Add document knowledge tables"
alembic upgrade head
```

### 3. Optional: Install PDF Support
```bash
pip install PyPDF2
pip install python-docx
pip install pyyaml
```

## Best Practices

### 1. **Organize Documents**
- Use meaningful names
- Add tags for categorization
- Group by type (requirements, specs, guidelines)

### 2. **Keep Documents Updated**
- When requirements change, upload new version
- Old documents get lower relevance scores
- System automatically uses fresher documents

### 3. **Monitor Usage**
- Check document summary regularly
- See which documents help most
- Remove unused documents

### 4. **Mix Input Types**
- Text for quick notes
- Files for detailed specs
- Data for test requirements
- Outputs for examples

### 5. **Provide Feedback**
- Accept/reject generated outputs
- This teaches which documents are actually useful
- Improves document scoring

## Metrics to Track

1. **Document Coverage**: How many docs vs. how many used
2. **Relevance Trend**: Are old docs still relevant?
3. **Learning Contribution**: Which docs improve outputs most?
4. **Usage Patterns**: Which docs used together?
5. **Quality Impact**: Do outputs improve when more docs available?

## Advanced Features (Future)

- **Automatic Summarization**: Summary of each document
- **Document Relationships**: Linking related documents
- **Version Control**: Track document changes
- **Collaborative Editing**: Team updates to documents
- **Smart Suggestions**: "Upload PDF for better results"

## Troubleshooting

### Q: File not recognized
**A**: Ensure file format is supported. Check MIME type.

### Q: Documents not used in generation
**A**: Check if they match the query. Try broader content.

### Q: Chunks seem too small/large
**A**: Adjust chunk_size (default 500) and overlap (default 50)

### Q: Too many chunks
**A**: Larger chunks = fewer vectors = faster search but less granular

## Summary

Your Cognitest AI now:

✅ **Learns from ANY input** - Text, files, data
✅ **Stores everything** - Chunked and vectorized
✅ **Uses context** - Retrieving relevant docs for generation
✅ **Tracks effectiveness** - Metrics on document usefulness
✅ **Improves over time** - Better outputs from learned patterns
✅ **Provides visibility** - See what documents help

**Result**: AI that understands your project, learns from experience, and improves continuously.

---

**Next Step**: Start uploading documents and watch your AI improve! 🚀
