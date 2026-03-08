#!/usr/bin/env python3
"""
Docker Setup Script
Verifies Docker installation, builds browser image, and tests setup
"""
import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd: list, description: str) -> bool:
    """Run a command and return success status"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(cmd, capture_output=True, timeout=60)
        if result.returncode == 0:
            print(f"✅ {description} succeeded")
            return True
        else:
            error = result.stderr.decode() if result.stderr else result.stdout.decode()
            print(f"❌ {description} failed: {error}")
            return False
    except subprocess.TimeoutExpired:
        print(f"❌ {description} timed out")
        return False
    except Exception as e:
        print(f"❌ {description} error: {e}")
        return False


def check_docker() -> bool:
    """Check if Docker is installed and running"""
    print("\n📦 Checking Docker installation...")
    return run_command(["docker", "info"], "Docker check")


def build_browser_image() -> bool:
    """Build the browser streaming Docker image"""
    print("\n🏗️  Building browser streaming image...")

    # Check if Dockerfile exists
    dockerfile_path = Path("docker/browser-streaming/Dockerfile")
    if not dockerfile_path.exists():
        print(f"❌ Dockerfile not found at {dockerfile_path}")
        return False

    return run_command(
        [
            "docker",
            "build",
            "-t",
            "cognitest-browser-streaming:latest",
            "-f",
            str(dockerfile_path),
            "docker/browser-streaming",
        ],
        "Build browser image",
    )


def create_docker_network() -> bool:
    """Create Docker network for WebRTC services"""
    print("\n🌐 Setting up Docker network...")

    # Check if network exists
    result = subprocess.run(
        ["docker", "network", "ls", "--filter", "name=webrtc-network", "-q"],
        capture_output=True,
    )

    if result.stdout.decode().strip():
        print("✅ Docker network 'webrtc-network' already exists")
        return True

    return run_command(
        ["docker", "network", "create", "webrtc-network"],
        "Create docker network",
    )


def test_image() -> bool:
    """Test if the browser image can be instantiated"""
    print("\n🧪 Testing browser image...")

    # Run a quick test container
    result = subprocess.run(
        [
            "docker",
            "run",
            "--rm",
            "-t",
            "cognitest-browser-streaming:latest",
            "bash",
            "-c",
            "echo 'Image test' && which Xvfb && which ffmpeg",
        ],
        capture_output=True,
        timeout=30,
    )

    if result.returncode == 0:
        print("✅ Browser image test passed")
        print(f"   Output: {result.stdout.decode()}")
        return True
    else:
        error = result.stderr.decode() if result.stderr else ""
        print(f"❌ Browser image test failed: {error}")
        return False


def setup_docker_compose() -> bool:
    """Set up docker-compose environment"""
    print("\n⚙️  Setting up docker-compose environment...")

    compose_file = Path("docker-compose.webrtc.yml")
    if not compose_file.exists():
        print(f"❌ docker-compose.webrtc.yml not found")
        return False

    print("✅ docker-compose.webrtc.yml exists")

    # Try to validate compose file
    return run_command(
        ["docker-compose", "-f", str(compose_file), "config"],
        "Validate docker-compose",
    )


def main():
    """Main setup routine"""
    print("=" * 60)
    print("🚀 Cognitest Docker Setup")
    print("=" * 60)

    checks = [
        ("Docker", check_docker),
        ("Docker Network", create_docker_network),
        ("Build Browser Image", build_browser_image),
        ("Test Browser Image", test_image),
        ("Docker Compose", setup_docker_compose),
    ]

    results = {}
    for name, check_func in checks:
        results[name] = check_func()

    print("\n" + "=" * 60)
    print("📊 Setup Summary")
    print("=" * 60)

    all_passed = True
    for name, passed in results.items():
        status = "✅" if passed else "❌"
        print(f"{status} {name}")
        if not passed:
            all_passed = False

    print("=" * 60)

    if all_passed:
        print("\n✅ All checks passed! Docker setup is ready.")
        print("\nNext steps:")
        print("1. Start backend: cd backend && uvicorn app.main:app --reload")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Test WebRTC endpoint: curl http://localhost:8000/api/v1/webrtc/health")
        print("4. Open http://localhost:3000 in your browser")
        return 0
    else:
        print("\n❌ Some checks failed. Please review the errors above.")
        print("\nTroubleshooting:")
        print("- Ensure Docker daemon is running: docker info")
        print("- Check Docker permissions: sudo usermod -aG docker $USER")
        print("- Rebuild image: docker build -t cognitest-browser-streaming:latest docker/browser-streaming/")
        return 1


if __name__ == "__main__":
    sys.exit(main())
