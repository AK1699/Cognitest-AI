#!/bin/bash
# Install Playwright and browser binaries

echo "📦 Installing Playwright..."
pip install playwright==1.41.0

echo "🌐 Installing browser binaries..."
playwright install chromium firefox webkit

echo "✅ Playwright installation complete!"
echo ""
echo "Installed browsers:"
echo "  - Chromium"
echo "  - Firefox"
echo "  - WebKit (Safari)"
echo ""
echo "You can now run web automation tests!"
