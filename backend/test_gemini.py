#!/usr/bin/env python3
"""
Quick test script to verify Gemini API configuration
"""
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_gemini():
    """Test Gemini API connection and generation."""

    print("🧪 Testing Gemini API Configuration...\n")

    # Check if API key is set
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ ERROR: GOOGLE_API_KEY not found in .env file")
        return False

    print(f"✅ API Key found: {api_key[:20]}...{api_key[-4:]}")
    print(f"✅ AI Provider: {os.getenv('AI_PROVIDER', 'not set')}")
    print(f"✅ Model: {os.getenv('GEMINI_MODEL', 'not set')}\n")

    # Try to import and use Gemini
    try:
        import google.generativeai as genai
        print("✅ google.generativeai library imported successfully\n")
    except ImportError as e:
        print(f"❌ ERROR: Failed to import google.generativeai: {e}")
        print("Run: pip install google-generativeai==0.3.2")
        return False

    # Configure Gemini
    try:
        genai.configure(api_key=api_key)
        print("✅ Gemini API configured\n")
    except Exception as e:
        print(f"❌ ERROR: Failed to configure Gemini: {e}")
        return False

    # Test generation
    try:
        print("🚀 Testing text generation...")
        model_to_try = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")
        print(f"   Using model: {model_to_try}")
        model = genai.GenerativeModel(model_to_try)
        response = model.generate_content("Say 'Hello from Gemini!' and confirm you're working.")

        print(f"✅ Generation successful!\n")
        print("📝 Response:")
        print("-" * 50)
        print(response.text)
        print("-" * 50)
        print()

    except Exception as e:
        print(f"❌ ERROR: Generation failed: {e}")
        return False

    # Test embedding
    try:
        print("🚀 Testing embeddings...")
        result = genai.embed_content(
            model="models/embedding-001",
            content="Test embedding",
            task_type="retrieval_document"
        )
        embedding_length = len(result['embedding'])
        print(f"✅ Embedding created successfully! (vector size: {embedding_length})\n")

    except Exception as e:
        print(f"⚠️  WARNING: Embedding test failed: {e}")
        print("(This is optional - text generation is what matters)\n")

    print("=" * 50)
    print("🎉 SUCCESS! Gemini API is working correctly!")
    print("=" * 50)
    print()
    print("✨ You can now generate AI-powered test plans!")
    print("📚 Your FREE tier limits:")
    print("   • 15 requests per minute")
    print("   • 1 million tokens per day")
    print("   • Perfect for development and testing!")
    print()

    return True

if __name__ == "__main__":
    success = asyncio.run(test_gemini())
    exit(0 if success else 1)
