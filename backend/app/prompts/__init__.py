"""
Prompt management package for AI-powered test generation.

This package provides:
- Jinja2 template-based prompts for test plan, suite, and case generation
- PromptManager service for loading and rendering templates
- Version control and caching for prompts
"""

from .prompt_manager import PromptManager, get_prompt_manager

__all__ = ['PromptManager', 'get_prompt_manager']
