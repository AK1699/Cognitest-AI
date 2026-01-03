# Integration Guide: Migrating to the New Prompt System

This guide shows how to refactor existing services to use the new template-based prompt system.

## Overview of Changes

**Before**: Prompts were hardcoded as Python f-strings in service methods
**After**: Prompts are loaded from Jinja2 templates via PromptManager

**Benefits**:
- ✅ Edit prompts without code changes
- ✅ Better prompt version control
- ✅ Easier A/B testing
- ✅ Cleaner, more maintainable code
- ✅ Proper separation of concerns

---

## Migration Steps

### Step 1: Import PromptManager

Add this import at the top of your service file:

```python
from app.prompts import get_prompt_manager
```

### Step 2: Initialize PromptManager

In your service's `__init__` method:

```python
class ComprehensiveTestPlanService:
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        self.prompt_manager = get_prompt_manager()  # Add this line
```

### Step 3: Replace Hardcoded Prompts

Replace the old `_build_comprehensive_prompt()` method with a call to `PromptManager`.

---

## Example 1: ComprehensiveTestPlanService

### BEFORE (app/services/comprehensive_test_plan_service.py)

```python
def _get_ieee_system_prompt(self) -> str:
    """Get system prompt for IEEE 829 standard test plan generation."""
    return """You are a senior QA manager and test strategist with 15+ years of experience creating comprehensive, industry-standard test plans.

Generate a complete test plan following IEEE 829 and industry best practices.

Your test plans should be:
1. Comprehensive and detailed
2. Following IEEE 829 standard structure
3. Industry best practices compliant
4. Actionable and realistic
5. Risk-aware and quality-focused

Format your response as valid JSON only, no additional text or markdown."""

def _build_comprehensive_prompt(self, requirements: Dict[str, Any]) -> str:
    """Build comprehensive prompt for test plan generation."""
    project_type = requirements.get("project_type", "web-app")
    description = requirements.get("description", "")
    features = requirements.get("features", [])
    platforms = requirements.get("platforms", ["web"])
    priority = requirements.get("priority", "medium")
    complexity = requirements.get("complexity", "medium")
    timeframe = requirements.get("timeframe", "2-4 weeks")

    prompt = f"""
Generate a comprehensive test plan following IEEE 829 standard.

**Project Details:**
- Type: {project_type}
- Description: {description}
- Target Platforms: {", ".join(platforms)}
- Key Features: {", ".join(features)}
- Priority Level: {priority}
- Complexity: {complexity}
- Timeframe: {timeframe}

**Generate a comprehensive test plan with ALL industry-standard sections:**
...
"""
    return prompt
```

### AFTER (Refactored)

```python
def _build_comprehensive_prompt(self, requirements: Dict[str, Any]) -> str:
    """Build comprehensive prompt for test plan generation using PromptManager."""
    # Prepare variables for template
    variables = {
        'projectType': requirements.get("project_type", "web-app"),
        'description': requirements.get("description", ""),
        'platforms': requirements.get("platforms", ["web"]),  # Can be list or string
        'features': requirements.get("features", []),  # Can be list or string
        'priority': requirements.get("priority", "medium"),
        'complexity': requirements.get("complexity", "medium"),
        'timeframe': requirements.get("timeframe", "2-4 weeks"),
    }

    # Validate variables (optional but recommended)
    is_valid, missing = self.prompt_manager.validate_prompt_variables(
        'test_plan', variables
    )
    if not is_valid:
        logger.warning(f"Missing prompt variables: {missing}. Using defaults.")

    # Load and render template
    return self.prompt_manager.load_test_plan_prompt(variables)

# Remove the _get_ieee_system_prompt method - it's now in the template!
```

**Changes Made**:
1. Removed hardcoded prompt strings
2. Removed `_get_ieee_system_prompt()` method (now in template)
3. Created variables dictionary with proper naming convention
4. Added optional validation
5. Delegated prompt loading to PromptManager

**Code Reduction**: ~500 lines → ~20 lines!

---

## Example 2: TestPlanService (Test Suite Generation)

### BEFORE

```python
def _get_test_suite_system_prompt(self) -> str:
    """Get system prompt for test suite generation."""
    return """You are an expert QA engineer. Create organized test suites that group related test cases.
For each test suite, provide:
1. Suite Name - descriptive name
2. Description - what this suite tests
3. Suggested Test Cases - list of test cases that should be in this suite
4. Tags - categorization tags
5. Preconditions - setup needed to run tests
6. Exit Criteria - conditions for suite completion

Format your response as structured JSON."""

def _build_test_suite_generation_prompt(
    self,
    requirements: str,
    test_scenarios: Optional[List[str]] = None,
) -> str:
    """Build prompt for test suite generation."""
    prompt = f"""Requirements:
{requirements}

"""

    if test_scenarios:
        prompt += "Test Scenarios to Cover:\n"
        for scenario in test_scenarios:
            prompt += f"- {scenario}\n"
        prompt += "\n"

    prompt += """Create test suites that logically group test cases. For each suite, provide:
1. Suite name and description
2. List of test cases that should be in this suite
3. Preconditions and setup requirements
4. Exit criteria for suite completion
5. Tags for organization

Provide as structured JSON with arrays of test cases."""

    return prompt
```

### AFTER

```python
def _build_test_suite_generation_prompt(
    self,
    test_plan,  # Assuming you have test_plan object
    requirements: str,
    test_scenarios: Optional[List[str]] = None,
) -> str:
    """Build prompt for test suite generation using PromptManager."""
    variables = {
        'testPlanName': test_plan.name,
        'description': test_plan.description or requirements,
        'projectType': getattr(test_plan, 'project_type', 'N/A'),
        'platforms': getattr(test_plan, 'platforms', []),
        'features': getattr(test_plan, 'features', []),
        'objectives': getattr(test_plan, 'objectives', []),
        'scope': getattr(test_plan, 'scope_of_testing', {}),
        'priority': getattr(test_plan, 'priority', 'medium'),
        'testCategories': ['Functional', 'Integration', 'Security', 'Performance', 'UI'],
    }

    return self.prompt_manager.load_test_suite_prompt(variables)

# Remove _get_test_suite_system_prompt() - it's in the template!
```

---

## Example 3: TestPlanService (Test Case Generation)

### BEFORE

```python
def _get_test_case_system_prompt(self) -> str:
    """Get system prompt for test case generation."""
    return """You are an expert test case designer. Create detailed, actionable test cases that include:
1. Test Case ID and Title
2. Description - what is being tested
3. Priority - critical, high, medium, or low
4. Preconditions - setup required
5. Test Steps - numbered, clear action steps
6. Expected Results - what should happen
7. Tags - for organization and filtering

Format each test case clearly with step numbers and expected results. Make steps atomic and testable."""

def _build_test_case_generation_prompt(
    self,
    feature_description: str,
    test_scenarios: Optional[List[str]] = None,
    user_stories: Optional[List[str]] = None,
    count: int = 5,
) -> str:
    """Build prompt for test case generation."""
    prompt = f"""Feature to Test:
{feature_description}

"""

    if user_stories:
        prompt += "User Stories:\n"
        for story in user_stories:
            prompt += f"- {story}\n"
        prompt += "\n"

    if test_scenarios:
        prompt += "Test Scenarios to Cover:\n"
        for scenario in test_scenarios:
            prompt += f"- {scenario}\n"
        prompt += "\n"

    prompt += f"""Generate {count} comprehensive test cases for this feature. For each test case include:
1. Unique ID and descriptive title
2. Description of what is being tested
3. Priority level (critical, high, medium, low)
4. Preconditions and setup
5. Numbered test steps (atomic, testable steps)
6. Expected results for each step
7. Relevant tags

Include both happy path and edge cases. Ensure good coverage of functionality.

Provide response as a JSON array of test case objects."""

    return prompt
```

### AFTER

```python
def _build_test_case_generation_prompt(
    self,
    feature_description: str,
    test_scenarios: Optional[List[str]] = None,
    user_stories: Optional[List[str]] = None,
    count: int = 5,
    feature_name: str = "Feature",
    test_type: str = "functional",
    priority: str = "medium",
    complexity: str = "medium",
    platform: List[str] = None,
    project_type: str = "web-app",
    acceptance_criteria: List[str] = None,
) -> str:
    """Build prompt for test case generation using PromptManager."""
    variables = {
        'feature': feature_name,
        'description': feature_description,
        'userStory': user_stories[0] if user_stories else 'Not provided',
        'acceptanceCriteria': acceptance_criteria if acceptance_criteria else 'Not provided',
        'testType': test_type,
        'priority': priority,
        'complexity': complexity,
        'platform': platform if platform else ['web'],
        'numberOfTestCases': count,
        'projectType': project_type,
    }

    return self.prompt_manager.load_test_case_prompt(variables)

# Remove _get_test_case_system_prompt() - it's in the template!
```

---

## Migration Checklist

Use this checklist when migrating a service:

- [ ] Import `get_prompt_manager` from `app.prompts`
- [ ] Initialize `self.prompt_manager` in `__init__`
- [ ] Identify all hardcoded prompt methods (usually `_get_*_prompt()` and `_build_*_prompt()`)
- [ ] Extract variable requirements from existing prompt strings
- [ ] Create variables dictionary with proper naming (camelCase for template variables)
- [ ] Replace prompt building logic with `prompt_manager.load_*_prompt(variables)`
- [ ] Remove old prompt methods
- [ ] Test with sample data to ensure prompts render correctly
- [ ] Update unit tests to mock PromptManager if needed
- [ ] Commit changes with descriptive message

---

## Testing the Migration

### Unit Test Example

```python
import pytest
from app.prompts import PromptManager

def test_test_plan_prompt_generation():
    """Test that test plan prompt is generated correctly."""
    prompt_manager = PromptManager()

    variables = {
        'projectType': 'web-app',
        'description': 'Test project',
        'platforms': ['Web', 'Mobile'],
        'features': ['Feature A', 'Feature B'],
        'priority': 'high',
        'complexity': 'medium',
        'timeframe': '4 weeks'
    }

    prompt = prompt_manager.load_test_plan_prompt(variables)

    # Verify prompt contains expected content
    assert 'Project Type: web-app' in prompt
    assert 'Priority Level: high' in prompt
    assert 'Feature A' in prompt
    assert 'Feature B' in prompt
    assert 'IEEE 829' in prompt
    assert 'REASONING FRAMEWORK' in prompt
```

### Integration Test Example

```python
import pytest
from app.services.comprehensive_test_plan_service import ComprehensiveTestPlanService
from app.services.ai_service import AIService

@pytest.mark.asyncio
async def test_comprehensive_test_plan_generation_with_new_prompts():
    """Test that test plan generation works with new prompt system."""
    ai_service = AIService()  # Or mock
    service = ComprehensiveTestPlanService(ai_service)

    requirements = {
        'project_type': 'e-commerce',
        'description': 'Online shopping platform',
        'features': ['User Auth', 'Product Catalog', 'Shopping Cart'],
        'platforms': ['web', 'mobile'],
        'priority': 'high',
        'complexity': 'high',
        'timeframe': '8 weeks'
    }

    # This should use the new prompt system internally
    result = await service.generate_comprehensive_test_plan(
        project_id='test-project-id',
        requirements=requirements
    )

    assert result['status'] == 'success'
    assert 'data' in result
    assert result['data']['name']  # Should have generated name
```

---

## Common Issues and Solutions

### Issue 1: Variable Name Mismatch
**Problem**: Template expects `projectType` but you're passing `project_type`
**Solution**: Use correct camelCase naming as documented in README

### Issue 2: List vs String Confusion
**Problem**: Template expects string but you're passing list
**Solution**: PromptManager auto-normalizes! Just pass either format.

### Issue 3: Missing Required Variables
**Problem**: `TemplateError: 'priority' is undefined`
**Solution**: Use `validate_prompt_variables()` before loading:
```python
is_valid, missing = prompt_manager.validate_prompt_variables('test_plan', variables)
if not is_valid:
    # Handle missing variables
    for field in missing:
        variables[field] = 'N/A'  # Or appropriate default
```

### Issue 4: Prompt Output Changed After Migration
**Problem**: AI generates different output with new prompts
**Solution**: Your new prompts have Chain-of-Thought reasoning and few-shot examples - this is expected and should improve quality! If needed, adjust the template.

---

## Performance Considerations

### Before Migration
- Prompt generation: String concatenation (very fast, ~0.001ms)
- But: Prompt changes require code deployment

### After Migration
- Prompt generation: Template rendering (~0.1-0.5ms)
- But: Prompt changes are instant, no deployment needed
- Caching can be added if performance is critical

### Optimization Tips
1. **Reuse PromptManager Instance**: Get singleton with `get_prompt_manager()`
2. **Pre-validate Variables**: Catch errors early
3. **Enable Caching**: (Future feature) Cache rendered prompts by variable hash

---

## Rollback Plan

If you need to rollback:

1. **Temporary**: Keep old methods commented out
2. **Quick Rollback**: Uncomment old methods, comment out new ones
3. **Full Rollback**: Revert git commit

```python
# Keep this during migration period
# def _build_comprehensive_prompt_OLD(self, requirements):
#     """OLD METHOD - Remove after migration is stable"""
#     project_type = requirements.get("project_type", "web-app")
#     prompt = f"Generate test plan for {project_type}..."
#     return prompt
```

---

## Next Steps After Migration

1. **Monitor AI Output Quality**: Compare outputs before/after migration
2. **Gather Feedback**: Ask QA team if prompts need refinement
3. **Iterate on Prompts**: Edit templates directly based on feedback
4. **A/B Test**: Create prompt versions and compare results
5. **Document Changes**: Update templates with version comments

---

**Need Help?**
- Check `app/prompts/README.md` for detailed PromptManager usage
- Review existing template files in `app/prompts/templates/`
- Run tests: `pytest tests/test_prompts.py`
- Create GitHub issue for bugs/suggestions

**Last Updated**: 2025-01-18
