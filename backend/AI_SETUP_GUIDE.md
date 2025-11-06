# AI Provider Setup Guide

This guide explains how to set up AI providers for Cognitest's test plan generation.

## 🎯 Quick Start (Recommended: Google Gemini - FREE)

### Why Gemini?
- ✅ **FREE tier** with generous limits (15 requests/minute, 1M tokens/day)
- ✅ **75% cheaper** than OpenAI on paid tier
- ✅ **Similar quality** to GPT-3.5/GPT-4
- ✅ **Easy setup** - get API key in 2 minutes

---

## 🚀 Option 1: Google Gemini (Recommended)

### Step 1: Get Your FREE API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Get API Key"**
3. Sign in with your Google account
4. Click **"Create API Key in new project"**
5. Copy your API key (starts with `AIza...`)

**FREE Tier Limits:**
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute
- Perfect for development and testing!

### Step 2: Configure Cognitest

1. Open your `.env` file in the backend directory
2. Add or update these lines:

```bash
# AI Provider - Use Gemini (free!)
AI_PROVIDER=gemini

# Google Gemini API Key
GOOGLE_API_KEY=AIzaSyD...your-actual-key-here
GEMINI_MODEL=models/gemini-2.5-flash
```

### Step 3: Install Dependencies

```bash
cd backend
pip install google-generativeai==0.3.2
```

### Step 4: Test It!

```bash
# Start the backend
uvicorn app.main:app --reload

# The AI generation will now use Gemini!
```

---

## 💰 Option 2: OpenAI (Paid Only)

### When to Use OpenAI?
- You need GPT-4 level quality for complex test plans
- You're already using OpenAI in production
- Cost is not a concern

### Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create account
3. Click **"Create new secret key"**
4. Copy your API key (starts with `sk-...`)
5. **Add payment method** (required for usage)

**Pricing:**
- GPT-4 Turbo: ~$0.30 per test plan
- GPT-3.5 Turbo: ~$0.03 per test plan

### Step 2: Configure Cognitest

```bash
# AI Provider - Use OpenAI
AI_PROVIDER=openai

# OpenAI API Key
OPENAI_API_KEY=sk-...your-actual-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

---

## 🔄 Switching Between Providers

You can easily switch between providers by changing one line in `.env`:

### Switch to Gemini (FREE):
```bash
AI_PROVIDER=gemini
```

### Switch to OpenAI (PAID):
```bash
AI_PROVIDER=openai
```

**No code changes needed!** The system automatically uses the configured provider.

---

## 📊 Provider Comparison

| Feature | Gemini 1.5 Flash | OpenAI GPT-4 Turbo |
|---------|------------------|---------------------|
| **Free Tier** | ✅ Yes (15 req/min) | ❌ No |
| **Paid Cost** | $0.07 per 1M tokens | $10-30 per 1M tokens |
| **Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Speed** | ⚡⚡⚡⚡⚡ Fast | ⚡⚡⚡⚡ Fast |
| **Setup** | Easy (2 mins) | Easy (5 mins) |
| **Best For** | Development, Testing, Production | Enterprise, Critical apps |

---

## 🧪 Testing Your Setup

### Test Gemini:

```bash
# In Python console
from app.services.gemini_service import get_gemini_service

service = get_gemini_service()
result = await service.generate_completion(
    messages=[{"role": "user", "content": "Say hello!"}],
    temperature=0.7
)
print(result)
```

### Test via API:

```bash
# Make sure backend is running
curl -X POST "http://localhost:8000/api/v1/test-plans/generate-comprehensive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "your-project-id",
    "project_type": "web-app",
    "description": "Test application",
    "features": ["Login", "Dashboard"],
    "platforms": ["Web"],
    "priority": "medium",
    "complexity": "medium",
    "timeframe": "2 weeks"
  }'
```

---

## 🔧 Troubleshooting

### "Google API key not configured"

**Solution:** Make sure you set `GOOGLE_API_KEY` in your `.env` file:
```bash
GOOGLE_API_KEY=AIzaSyD...your-key-here
```

### "OpenAI API key not configured"

**Solution:** If using OpenAI, set `OPENAI_API_KEY`:
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...your-key-here
```

### "Quota exceeded" (Gemini free tier)

**Solution:** You've hit the free tier limit. Options:
1. Wait for rate limit to reset (1 minute)
2. Upgrade to paid tier
3. Switch to OpenAI temporarily

### Import Error for google.generativeai

**Solution:** Install the library:
```bash
pip install google-generativeai==0.3.2
```

---

## 💡 Best Practices

### For Development:
```bash
AI_PROVIDER=gemini  # Use free tier
GEMINI_MODEL=models/gemini-2.5-flash  # Latest fast model
```

### For Production (Small Scale):
```bash
AI_PROVIDER=gemini
GEMINI_MODEL=models/gemini-2.5-pro  # Better quality
# Paid tier: ~$1-5 per month
```

### For Production (Large Scale):
```bash
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4-turbo-preview
# Higher cost but best quality
```

---

## 📈 Cost Estimation

### Gemini (Free Tier):
- **Test Plans/Day:** ~100-200 (within limits)
- **Cost:** $0/month
- **Perfect for:** Development, testing, small teams

### Gemini (Paid Tier):
- **Test Plans/Month:** Unlimited
- **Estimated Cost:** $5-50/month
- **Perfect for:** Production, growing teams

### OpenAI:
- **Test Plans/Month:** Unlimited
- **Estimated Cost:** $50-500/month
- **Perfect for:** Enterprise, critical applications

---

## 🆘 Support

### Need Help?

1. **Check logs:** `tail -f backend/logs/app.log`
2. **Verify .env:** Make sure API keys are set correctly
3. **Test provider:** Use the test scripts above
4. **Switch provider:** Try the other provider if one fails

### Common Issues:

| Error | Solution |
|-------|----------|
| "API key not configured" | Add key to `.env` file |
| "Quota exceeded" | Wait or upgrade to paid tier |
| "Invalid API key" | Regenerate key from provider |
| "Import error" | Install required package |

---

## ✅ Summary

**For 99% of users, we recommend:**

```bash
AI_PROVIDER=gemini
GOOGLE_API_KEY=your-free-api-key
```

**This gives you:**
- ✅ Free tier (no credit card needed)
- ✅ Great quality test plans
- ✅ Fast generation
- ✅ Easy to upgrade later
- ✅ Can switch to OpenAI anytime

**Get started in 2 minutes:** [Get your free Gemini API key](https://makersuite.google.com/app/apikey)

---

## 🎉 That's It!

Your AI-powered test plan generation is now ready to use!

Generate comprehensive IEEE 829 test plans with:
- 5-7 test suites
- 30-70 test cases
- Entry/exit criteria
- Risk assessments
- Resource planning
- Milestones & schedules

All powered by AI - for FREE! 🚀
