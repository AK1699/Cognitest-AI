# Multimodal Test Plan Generation Feature

## Overview

This feature enables users to generate comprehensive test plans using both **text descriptions** and **screenshots/images**. The system uses AI Vision to analyze images and stores all inputs in **organization memory** for self-evolving AI suggestions.

## Key Features

### 1. **Multimodal Input**
- ✅ Accept text descriptions
- ✅ Support screenshot paste (Ctrl/Cmd+V)
- ✅ Drag & drop image upload
- ✅ Process up to 5 images per request

### 2. **Vision AI Analysis**
- Extract UI elements from screenshots
- Identify user workflows
- Recognize features and functionality
- Generate comprehensive analysis

### 3. **Organization Memory**
- Store all inputs at organization level
- Enable cross-project learning
- Build contextual knowledge base
- Track usage and effectiveness

### 4. **AI-Powered Suggestions**
- Provide suggestions based on historical data
- Suggest features from similar projects
- Recommend UI elements and workflows
- Generate test scenarios automatically

### 5. **Self-Evolving System**
- Learn from every input
- Improve suggestions over time
- Track what works best
- Adapt to organization patterns

## Architecture

### Backend Components

#### 1. **Database Models** (`app/models/organisation_memory.py`)
- `OrganisationMemory`: Stores text + image metadata
- `OrganisationMemoryImage`: Stores individual images
- `MemoryUsageLog`: Tracks how memory is used

#### 2. **Vision AI Service** (`app/services/vision_ai_service.py`)
- Analyzes screenshots using GPT-4 Vision
- Extracts structured information
- Supports multiple analysis types:
  - Comprehensive
  - UI elements
  - Workflows
  - Requirements

#### 3. **Organisation Memory Service** (`app/services/organisation_memory_service.py`)
- Manages memory storage and retrieval
- Provides AI suggestions
- Handles vector DB integration
- Logs memory usage

#### 4. **API Endpoints**

**Organisation Memory** (`app/api/v1/endpoints/organisation_memory.py`):
- `POST /api/v1/organisation-memory/store` - Store memory with images
- `GET /api/v1/organisation-memory/organisation/{id}` - List memories
- `POST /api/v1/organisation-memory/suggestions` - Get AI suggestions
- `GET /api/v1/organisation-memory/{id}` - Get memory detail
- `DELETE /api/v1/organisation-memory/{id}` - Delete memory

**Multimodal Test Plan Generation** (`app/api/v1/endpoints/test_plans_multimodal.py`):
- `POST /api/v1/test-plans-multimodal/generate` - Generate test plan with text + images
- `POST /api/v1/test-plans-multimodal/preview-suggestions` - Preview AI suggestions

### Frontend Components

#### 1. **Multimodal Description Input** (`components/test-management/MultimodalDescriptionInput.tsx`)
- Text area with paste support
- Drag & drop zone
- Image preview grid
- Upload button

#### 2. **API Client** (`lib/api/organisation-memory.ts`)
- `organisationMemoryAPI` - Memory management
- `testPlanMultimodalAPI` - Test plan generation

## Usage

### Backend Setup

1. **Run Database Migration**
```bash
cd backend
alembic upgrade head
```

2. **Set Environment Variables**
```bash
# Add to .env
OPENAI_API_KEY=your_openai_api_key
UPLOAD_DIR=./uploads
```

3. **Create Upload Directory**
```bash
mkdir -p uploads/org_memory
```

### Frontend Integration

#### Example: Using Multimodal Input Component

```tsx
import MultimodalDescriptionInput from '@/components/test-management/MultimodalDescriptionInput'
import { testPlanMultimodalAPI } from '@/lib/api/organisation-memory'

function TestPlanGenerator() {
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])

  const handleGenerate = async () => {
    const result = await testPlanMultimodalAPI.generateTestPlan({
      organisation_id: orgId,
      project_id: projectId,
      description,
      images,
      use_org_memory: true,
    }, token)

    console.log('Generated:', result)
  }

  return (
    <div>
      <MultimodalDescriptionInput
        value={description}
        onChange={setDescription}
        onImagesChange={setImages}
        showImagePaste={true}
        maxImages={5}
      />
      <button onClick={handleGenerate}>Generate Test Plan</button>
    </div>
  )
}
```

### API Usage Examples

#### 1. Store Memory with Images

```bash
curl -X POST "http://localhost:8000/api/v1/organisation-memory/store" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "organisation_id=YOUR_ORG_ID" \
  -F "description=Login page with email and password fields" \
  -F "images=@screenshot1.png" \
  -F "images=@screenshot2.png"
```

#### 2. Get AI Suggestions

```bash
curl -X POST "http://localhost:8000/api/v1/organisation-memory/suggestions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organisation_id": "YOUR_ORG_ID",
    "user_input": "Testing login functionality"
  }'
```

#### 3. Generate Test Plan with Images

```bash
curl -X POST "http://localhost:8000/api/v1/test-plans-multimodal/generate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "organisation_id=YOUR_ORG_ID" \
  -F "project_id=YOUR_PROJECT_ID" \
  -F "description=User authentication system" \
  -F "use_org_memory=true" \
  -F "images=@login_screen.png"
```

## Data Flow

1. **User Input**
   - User types description
   - User pastes/uploads screenshots
   - User clicks "Generate"

2. **Storage**
   - Images saved to disk
   - Vision AI analyzes each image
   - Memory record created in database
   - Searchable content generated

3. **AI Suggestions**
   - Query organization memory
   - Find similar past inputs
   - Extract relevant patterns
   - Generate suggestions

4. **Test Plan Generation**
   - Combine text + image analysis
   - Add AI suggestions
   - Generate comprehensive test plan
   - Link to memory record

5. **Learning**
   - Log memory usage
   - Track effectiveness
   - Update reference counts
   - Improve future suggestions

## Benefits

### For Users
- **Faster Test Planning**: Generate plans from screenshots
- **Consistency**: AI learns organization patterns
- **Knowledge Reuse**: Leverage past projects
- **Better Coverage**: AI suggests edge cases

### For Organizations
- **Knowledge Base**: Build organizational memory
- **Standardization**: Consistent test plans across teams
- **Onboarding**: New members benefit from historical data
- **Continuous Improvement**: System evolves with usage

## Configuration

### Vision AI Models

The system supports multiple vision models:
- GPT-4 Vision (default)
- GPT-4o
- Claude Vision (future)

To change the model:
```python
vision_service = await get_vision_ai_service(model="gpt-4o")
```

### Storage Options

Images can be stored in:
- Local file system (default)
- S3/MinIO (configurable)

To use S3:
```python
# Update config.py
S3_BUCKET = "cognitest-memory"
S3_REGION = "us-east-1"
```

### Vector Database

For semantic search, configure Qdrant:
```bash
# Add to .env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_api_key
```

## Limitations

- **Image Limit**: Max 5 images per request
- **File Size**: Max 50MB per file
- **Supported Formats**: PNG, JPG, JPEG, GIF
- **Vision API**: Requires OpenAI API key

## Future Enhancements

- [ ] Video input support
- [ ] Real-time collaboration
- [ ] Voice description
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Export memory as knowledge base
- [ ] Multi-language support
- [ ] Custom vision models

## Troubleshooting

### Images Not Processing

**Issue**: Images uploaded but not analyzed

**Solution**:
1. Check OpenAI API key is set
2. Verify upload directory exists
3. Check file permissions
4. Review logs: `tail -f logs/app.log`

### AI Suggestions Not Working

**Issue**: No suggestions returned

**Solution**:
1. Ensure organization has memory records
2. Check memory is marked as active
3. Verify project_id is correct
4. Review memory count: Query `organisation_memory` table

### Memory Storage Failed

**Issue**: Error storing memory

**Solution**:
1. Check database connection
2. Verify migrations are applied
3. Ensure upload directory exists
4. Check disk space

## Performance Considerations

- **Vision API Calls**: Cached for 15 minutes
- **Memory Retrieval**: Indexed by org_id, project_id
- **Image Storage**: Organized by org/memory hierarchy
- **Vector Search**: Batch processing for multiple memories

## Security

- **Access Control**: User must belong to organization
- **Image Privacy**: Stored per organization
- **API Authentication**: Required for all endpoints
- **Data Encryption**: In transit (HTTPS) and at rest (configurable)

## Monitoring

Track key metrics:
- Memory storage rate
- Vision AI success rate
- Suggestion accuracy
- User satisfaction scores
- Storage usage

## Support

For issues or questions:
- GitHub Issues: [cognitest-ai/issues](https://github.com/your-org/cognitest-ai/issues)
- Email: support@cognitest.ai
- Docs: [docs.cognitest.ai](https://docs.cognitest.ai)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-13
**Author**: Cognitest AI Team
