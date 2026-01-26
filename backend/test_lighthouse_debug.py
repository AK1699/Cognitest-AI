
import asyncio
import json
import os
import subprocess

async def test_lighthouse_desktop():
    url = "https://cognitest.ai"
    strategy = "desktop"
    
    cmd = [
        "npx",
        "lighthouse",
        url,
        "--output=json",
        "--quiet",
        "--chrome-flags=--headless=new",
    ]
    
    if strategy.lower() == "desktop":
        cmd.append("--preset=desktop")
    
    print(f"Running command: {' '.join(cmd)}")
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        print(f"Error: {stderr.decode()}")
        return
    
    result = json.loads(stdout.decode())
    config_settings = result.get("configSettings", {})
    emulated_form_factor = config_settings.get("emulatedFormFactor")
    
    print(f"Emulated Form Factor: {emulated_form_factor}")
    
    # Check if there's any mention of mobile in the user agent or settings
    ua = result.get("userAgent")
    print(f"User Agent: {ua}")
    
    # Save a snippet of the result to a file for inspection
    with open("lighthouse_test_output.json", "w") as f:
        json.dump({
            "configSettings": config_settings,
            "userAgent": ua,
            "lighthouseVersion": result.get("lighthouseVersion")
        }, f, indent=2)

if __name__ == "__main__":
    asyncio.run(test_lighthouse_desktop())
