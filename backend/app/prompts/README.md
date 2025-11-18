# Cognitest AI Prompt Management System

## Overview

This directory contains a professional prompt management system for AI-powered test generation in Cognitest. The system uses **Jinja2 templates** for prompts, making them easy to edit, version, and maintain without code changes.

## Architecture

```
app/prompts/
├── __init__.py                          # Package initialization
├── prompt_manager.py                     # Core PromptManager service
├── README.md                             # This file
├── templates/                            # Jinja2 prompt templates
│   ├── test_plan_generation.j2          # Test plan generation prompt
│   ├── test_suite_generation.j2         # Test suite generation prompt
│   └── test_case_generation.j2          # Test case generation prompt
└── versions/                             # Version control for prompts (future use)
```

## Key Features

✅ **Template-Based Prompts**: Prompts are stored as Jinja2 templates, not hardcoded in Python
✅ **Variable Substitution**: Easy variable injection using `{{ variable }}` syntax
✅ **Validation**: Built-in validation for required variables
✅ **Normalization**: Automatic normalization of list/string inputs
✅ **Caching**: Optional caching for performance optimization
✅ **Version Control Ready**: Structure supports prompt versioning
✅ **No Code Changes**: Edit prompts directly in template files

## Quick Start

### 1. Using PromptManager in Your Service

```python
from app.prompts import get_prompt_manager

# Get the singleton instance
prompt_manager = get_prompt_manager()

# Load test plan prompt
variables = {
    'projectType': 'web-app',
    'description': 'E-commerce platform with payment processing',
    'platforms': ['Web', 'Mobile'],
    'features': ['User Auth', 'Product Catalog', 'Shopping Cart'],
    'priority': 'high',
    'complexity': 'medium',
    'timeframe': '8 weeks'
}

prompt = prompt_manager.load_test_plan_prompt(variables)

# Use prompt with AI service
response = await ai_service.generate_completion(
    messages=[
        {"role": "user", "content": prompt}
    ],
    temperature=0.7,
    max_tokens=50000,
    json_mode=True
)
```

### 2. Loading Test Suite Prompt

```python
variables = {
    'testPlanName': 'E-commerce Test Plan',
    'description': 'Comprehensive testing for e-commerce features',
    'projectType': 'web-app',
    'platforms': 'Web, Mobile',
    'features': 'User Auth, Product Catalog, Shopping Cart, Payment',
    'objectives': 'Validate transactions, Ensure security, Test performance',
    'scope': json.dumps(scope_dict),
    'priority': 'high',
    'testCategories': 'Functional, Security, Performance, Integration, UI'
}

prompt = prompt_manager.load_test_suite_prompt(variables)
```

### 3. Loading Test Case Prompt

```python
variables = {
    'feature': 'User Login',
    'description': 'Users should be able to log in using email and password',
    'userStory': 'As a user, I want to log in to access my account',
    'acceptanceCriteria': ['Valid credentials grant access', 'Invalid credentials show error', 'Account locked after 5 failed attempts'],
    'testType': 'Functional',
    'priority': 'high',
    'complexity': 'medium',
    'platform': ['Web', 'Mobile'],
    'numberOfTestCases': 5,
    'projectType': 'e-commerce'
}

prompt = prompt_manager.load_test_case_prompt(variables)
```

## Prompt Template Structure

Each prompt template includes:

1. **Role and Expertise**: Defines the AI's persona and expertise level
2. **Context and Project Details**: Template variables for project-specific information
3. **Reasoning Framework**: Step-by-step thinking process for the AI
4. **Few-Shot Examples**: 2-3 examples showing input→output mapping
5. **Generation Instructions**: Detailed requirements for each section
6. **Output Format**: JSON schema specification
7. **Validation Rules**: Quality checks and constraints
8. **Quality Standards**: Specificity, completeness, consistency guidelines

## Variable Naming Conventions

### Test Plan Variables
- `projectType`: Type of project (web-app, mobile-app, api, etc.)
- `description`: Project description
- `platforms`: List of platforms or comma-separated string
- `features`: List of features or comma-separated string
- `priority`: Priority level (low, medium, high, critical)
- `complexity`: Complexity level (low, medium, high)
- `timeframe`: Expected timeframe (e.g., "8 weeks", "2-4 months")

### Test Suite Variables
- `testPlanName`: Name of the test plan
- `description`: Test plan description
- `projectType`: Type of project
- `platforms`: Platforms (string or list)
- `features`: Features (string or list)
- `objectives`: Test objectives (string or list)
- `scope`: JSON string of scope dict
- `priority`: Priority level
- `testCategories`: Test categories (string or list)

### Test Case Variables
- `feature`: Feature name
- `description`: Feature description
- `userStory`: User story (optional, defaults to "Not provided")
- `acceptanceCriteria`: List of criteria or string (optional)
- `testType`: Type of test (functional, security, performance, ui)
- `priority`: Priority level
- `complexity`: Complexity level
- `platform`: Platform(s) (string or list)
- `numberOfTestCases`: Number of test cases to generate (default: 5)
- `projectType`: Type of project (optional)

## Variable Normalization

PromptManager automatically normalizes variables:

- **Lists → Strings**: `['Web', 'Mobile']` → `"Web, Mobile"`
- **None → "N/A"**: Missing optional fields get placeholder text
- **Dicts → JSON**: Scope dicts are converted to formatted JSON strings
- **Acceptance Criteria**: Lists joined with semicolons

Example:
```python
# Input
variables = {
    'platforms': ['Web', 'Mobile', 'API'],
    'features': ['Login', 'Search', 'Cart'],
    'scope': {'inScope': ['Feature A'], 'outOfScope': ['Feature B']}
}

# After normalization (internally)
{
    'platforms': 'Web, Mobile, API',
    'features': 'Login, Search, Cart',
    'scope': '{\n  "inScope": ["Feature A"],\n  "outOfScope": ["Feature B"]\n}'
}
```

## Validation

Validate variables before rendering:

```python
is_valid, missing = prompt_manager.validate_prompt_variables(
    prompt_type='test_plan',
    variables=my_variables
)

if not is_valid:
    print(f"Missing required fields: {missing}")
```

## Template Introspection

```python
# List all available templates
templates = prompt_manager.list_available_templates()
print(templates)  # ['test_case_generation.j2', 'test_plan_generation.j2', 'test_suite_generation.j2']

# Get template metadata
info = prompt_manager.get_template_info('test_plan_generation.j2')
print(info)
# {
#     'exists': True,
#     'path': '/path/to/test_plan_generation.j2',
#     'size_bytes': 24567,
#     'modified': 1705512345.0
# }
```

## Integration with Existing Services

### Before (Hardcoded Prompts)
```python
def _build_comprehensive_prompt(self, requirements: Dict[str, Any]) -> str:
    project_type = requirements.get("project_type", "web-app")
    description = requirements.get("description", "")

    prompt = f"""
Generate a comprehensive test plan following IEEE 829 standard.

**Project Details:**
- Type: {project_type}
- Description: {description}
...
"""
    return prompt
```

### After (Template-Based Prompts)
```python
from app.prompts import get_prompt_manager

def _build_comprehensive_prompt(self, requirements: Dict[str, Any]) -> str:
    prompt_manager = get_prompt_manager()

    variables = {
        'projectType': requirements.get('project_type', 'web-app'),
        'description': requirements.get('description', ''),
        'platforms': requirements.get('platforms', ['web']),
        'features': requirements.get('features', []),
        'priority': requirements.get('priority', 'medium'),
        'complexity': requirements.get('complexity', 'medium'),
        'timeframe': requirements.get('timeframe', '2-4 weeks')
    }

    return prompt_manager.load_test_plan_prompt(variables)
```

## Editing Prompts

### To modify a prompt:

1. Navigate to `app/prompts/templates/`
2. Open the relevant `.j2` file
3. Edit the prompt text directly
4. Save the file
5. **No code changes or restart required** - changes take effect immediately!

### Example Edit:
```jinja2
{# In test_plan_generation.j2 #}

**ROLE AND EXPERTISE:**
You are a Principal QA Architect with {{ years }}+ years of experience...

{# Add new variable #}
**Additional Context:**
Budget: {{ budget }}
Team Size: {{ team_size }}
```

Then use it:
```python
variables = {
    'projectType': 'web-app',
    'years': 25,  # New variable
    'budget': '$50,000',  # New variable
    'team_size': 5,  # New variable
    # ... other variables
}
```

## Best Practices

1. **Use Descriptive Variable Names**: `projectType` not `type`, `acceptanceCriteria` not `ac`
2. **Provide Defaults**: Handle missing optional variables gracefully
3. **Validate Before Rendering**: Use `validate_prompt_variables()` to catch errors early
4. **Keep Prompts DRY**: Use Jinja2 includes/macros for reusable sections
5. **Version Control**: Commit prompt changes with descriptive messages
6. **Test Prompt Changes**: Generate test data and verify AI output quality
7. **Document Variables**: Add comments in templates explaining expected variable formats

## Advanced Features

### Jinja2 Control Structures

```jinja2
{# Conditional sections #}
{% if priority == 'critical' %}
**URGENT**: This is a critical priority test plan.
{% endif %}

{# Loops #}
**Features:**
{% for feature in features %}
- {{ feature }}
{% endfor %}

{# Filters #}
Project Type: {{ projectType|upper }}
Description: {{ description|truncate(100) }}
```

### Template Includes (Future)

```jinja2
{# In test_plan_generation.j2 #}
{% include 'common/role_definition.j2' %}
{% include 'common/reasoning_framework.j2' %}
```

## Troubleshooting

### Error: TemplateNotFound
**Cause**: Template file doesn't exist or path is wrong
**Solution**: Check that `.j2` file exists in `app/prompts/templates/`

### Error: UndefinedError
**Cause**: Required variable missing in template
**Solution**: Ensure all `{{ variable }}` references have corresponding keys in variables dict

### Error: Template rendering produces strange output
**Cause**: Variable types don't match expectations
**Solution**: Use `_normalize_variables()` or convert manually before passing

## Future Enhancements

- [ ] Prompt versioning system
- [ ] A/B testing framework for prompts
- [ ] Prompt analytics and quality metrics
- [ ] Multi-language prompt support
- [ ] Prompt template inheritance
- [ ] Automatic prompt optimization based on AI feedback
- [ ] Database-backed prompt storage

## References

- [Jinja2 Documentation](https://jinja.palletsprojects.com/)
- [IEEE 829 Standard](https://standards.ieee.org/standard/829-2008.html)
- [ISO/IEC/IEEE 29119-3](https://www.iso.org/standard/56736.html)
- [Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903)
- [Few-Shot Learning](https://arxiv.org/abs/2005.14165)

---

**Last Updated**: 2025-01-18
**Maintainer**: Cognitest AI Team
**Contact**: For issues or suggestions, please create a GitHub issue
