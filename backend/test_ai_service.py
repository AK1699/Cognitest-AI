#!/usr/bin/env python3
"""
Test script to verify AI service is using Gemini correctly
"""
import asyncio
from app.services.ai_service import get_ai_service

async def test_ai_service():
    """Test AI service with Gemini."""
    print("🧪 Testing AI Service with Gemini...\n")

    ai_service = get_ai_service()

    print(f"✅ Provider: {ai_service.provider}")
    print(f"✅ Model: {ai_service._gemini_service.model_name if ai_service._gemini_service else 'N/A'}\n")

    # Test simple completion
    print("🚀 Testing text generation...")
    try:
        messages = [
            {"role": "system", "content": "You are a helpful testing assistant."},
            {"role": "user", "content": "Generate a simple test case title for a login feature."}
        ]

        response = await ai_service.generate_completion(messages, temperature=0.7)

        print("✅ Generation successful!\n")
        print("📝 Response:")
        print("-" * 50)
        print(response)
        print("-" * 50)
        print()

        print("=" * 50)
        print("🎉 SUCCESS! AI Service is working with Gemini!")
        print("=" * 50)
        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_ai_service())
    exit(0 if success else 1)
