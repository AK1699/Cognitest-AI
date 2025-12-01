#!/usr/bin/env python3
"""
Web Automation Module - Setup Verification Script
Tests that all components are properly created and can be imported
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 70)
print("Web Automation Module - Setup Verification")
print("=" * 70)
print()

# Track results
tests_passed = 0
tests_failed = 0
errors = []

def test_import(module_name, import_statement):
    """Test if a module can be imported"""
    global tests_passed, tests_failed, errors
    try:
        exec(import_statement)
        print(f"✅ {module_name}")
        tests_passed += 1
        return True
    except Exception as e:
        print(f"❌ {module_name}: {str(e)}")
        tests_failed += 1
        errors.append(f"{module_name}: {str(e)}")
        return False

def test_file_exists(file_path, description):
    """Test if a file exists"""
    global tests_passed, tests_failed, errors
    if os.path.exists(file_path):
        size = os.path.getsize(file_path)
        print(f"✅ {description} ({size} bytes)")
        tests_passed += 1
        return True
    else:
        print(f"❌ {description}: File not found")
        tests_failed += 1
        errors.append(f"{description}: File not found")
        return False

# Test 1: File Structure
print("1. Testing File Structure")
print("-" * 70)
test_file_exists("app/models/web_automation.py", "Models file")
test_file_exists("app/schemas/web_automation.py", "Schemas file")
test_file_exists("app/services/web_automation_service.py", "Services file")
test_file_exists("app/api/v1/web_automation.py", "API endpoints file")
test_file_exists("migrations/versions/add_web_automation_tables.py", "Migration file")
print()

# Test 2: Check if dependencies would be available (syntax check only)
print("2. Testing Python Syntax")
print("-" * 70)

files_to_check = [
    ("app/models/web_automation.py", "Models syntax"),
    ("app/schemas/web_automation.py", "Schemas syntax"),
    ("app/services/web_automation_service.py", "Services syntax"),
    ("app/api/v1/web_automation.py", "API syntax"),
]

for file_path, description in files_to_check:
    try:
        with open(file_path, 'r') as f:
            code = f.read()
            compile(code, file_path, 'exec')
        print(f"✅ {description}")
        tests_passed += 1
    except SyntaxError as e:
        print(f"❌ {description}: Syntax error at line {e.lineno}")
        tests_failed += 1
        errors.append(f"{description}: Syntax error")
    except Exception as e:
        print(f"⚠️  {description}: {str(e)}")

print()

# Test 3: Check model definitions
print("3. Testing Model Definitions")
print("-" * 70)

try:
    with open("app/models/web_automation.py", 'r') as f:
        content = f.read()
        models = ["TestFlow", "ExecutionRun", "StepResult", "HealingEvent", "LocatorAlternative"]
        for model in models:
            if f"class {model}" in content:
                print(f"✅ {model} model defined")
                tests_passed += 1
            else:
                print(f"❌ {model} model not found")
                tests_failed += 1
except Exception as e:
    print(f"❌ Error reading models file: {e}")
    tests_failed += 1

print()

# Test 4: Check API endpoints
print("4. Testing API Endpoints")
print("-" * 70)

try:
    with open("app/api/v1/web_automation.py", 'r') as f:
        content = f.read()
        endpoints = [
            ("@router.post(\"/test-flows\"", "POST /test-flows"),
            ("@router.get(\"/test-flows/{flow_id}\"", "GET /test-flows/{id}"),
            ("@router.put(\"/test-flows/{flow_id}\"", "PUT /test-flows/{id}"),
            ("@router.delete(\"/test-flows/{flow_id}\"", "DELETE /test-flows/{id}"),
            ("@router.post(\"/test-flows/{flow_id}/execute\"", "POST /test-flows/{id}/execute"),
            ("@router.websocket(\"/ws/live-preview/{execution_id}\"", "WS /ws/live-preview/{id}"),
        ]
        for endpoint_pattern, endpoint_name in endpoints:
            if endpoint_pattern in content:
                print(f"✅ Endpoint: {endpoint_name}")
                tests_passed += 1
            else:
                print(f"❌ Endpoint not found: {endpoint_name}")
                tests_failed += 1
except Exception as e:
    print(f"❌ Error reading API file: {e}")
    tests_failed += 1

print()

# Test 5: Check self-healing implementation
print("5. Testing Self-Healing Components")
print("-" * 70)

try:
    with open("app/services/web_automation_service.py", 'r') as f:
        content = f.read()
        components = [
            "class SelfHealingLocator",
            "class SelfHealingAssertion",
            "class WebAutomationExecutor",
            "async def ai_heal",
            "async def execute_test_flow",
        ]
        for component in components:
            if component in content:
                print(f"✅ {component}")
                tests_passed += 1
            else:
                print(f"❌ {component} not found")
                tests_failed += 1
except Exception as e:
    print(f"❌ Error reading services file: {e}")
    tests_failed += 1

print()

# Test 6: Check database migration
print("6. Testing Database Migration")
print("-" * 70)

try:
    with open("migrations/versions/add_web_automation_tables.py", 'r') as f:
        content = f.read()
        tables = ["test_flows", "execution_runs", "step_results", "healing_events", "locator_alternatives"]
        for table in tables:
            if f"create_table('{table}'" in content or f'create_table("{table}"' in content:
                print(f"✅ Table creation: {table}")
                tests_passed += 1
            else:
                print(f"❌ Table creation not found: {table}")
                tests_failed += 1
except Exception as e:
    print(f"❌ Error reading migration file: {e}")
    tests_failed += 1

print()

# Summary
print("=" * 70)
print("Summary")
print("=" * 70)
print(f"Tests Passed: {tests_passed}")
print(f"Tests Failed: {tests_failed}")
print(f"Total Tests: {tests_passed + tests_failed}")
print()

if tests_failed > 0:
    print("⚠️  Some tests failed:")
    for error in errors[:5]:  # Show first 5 errors
        print(f"  - {error}")
    print()

# Test results
if tests_failed == 0:
    print("✅ All verification tests passed!")
    print("📝 Next steps:")
    print("  1. Install dependencies: pip3 install -r requirements.txt")
    print("  2. Install Playwright browsers: playwright install")
    print("  3. Run database migration: alembic upgrade head")
    print("  4. Start the backend: uvicorn app.main:app --reload")
    sys.exit(0)
else:
    print("❌ Some tests failed. Please review the errors above.")
    print("📝 Note: Import errors are expected if dependencies aren't installed yet.")
    sys.exit(1)
