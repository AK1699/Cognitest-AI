"""
Entropy Analyzer for Advanced Secret Detection
Uses Shannon entropy to detect high-entropy strings that may be secrets
"""
import math
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SecretType(str, Enum):
    """Types of secrets that can be detected"""
    API_KEY = "api_key"
    PASSWORD = "password"
    PRIVATE_KEY = "private_key"
    TOKEN = "token"
    AWS_KEY = "aws_key"
    GOOGLE_KEY = "google_key"
    GITHUB_TOKEN = "github_token"
    JWT = "jwt"
    GENERIC_SECRET = "generic_secret"


@dataclass
class SecretFinding:
    """Represents a detected secret"""
    secret_type: SecretType
    value_masked: str  # First 4 and last 4 chars visible
    line_number: int
    file_path: Optional[str]
    entropy: float
    confidence: float  # 0.0 - 1.0
    context: str  # Surrounding code context
    is_false_positive: bool = False
    reason: Optional[str] = None


class EntropyAnalyzer:
    """
    Advanced secret detection using Shannon entropy analysis
    
    High-entropy strings are more likely to be secrets/random data.
    Typical entropy values:
    - English text: 3.5-4.5 bits/char
    - Base64 encoded: 5.5-6.0 bits/char
    - Hex encoded: 3.5-4.0 bits/char
    - Random strings: 4.5-5.5 bits/char
    - API keys/secrets: 4.5-6.0 bits/char
    """
    
    # Entropy thresholds
    MIN_ENTROPY_HEX = 3.0  # Lower threshold for hex strings
    MIN_ENTROPY_BASE64 = 4.2  # Threshold for base64 strings
    MIN_ENTROPY_GENERIC = 4.5  # Threshold for generic high-entropy strings
    
    # Minimum and maximum string lengths to analyze
    MIN_STRING_LENGTH = 8
    MAX_STRING_LENGTH = 500
    
    # Known secret patterns with confidence scores
    SECRET_PATTERNS = {
        SecretType.AWS_KEY: {
            "patterns": [
                (r'AKIA[0-9A-Z]{16}', 0.95),  # AWS Access Key ID
                (r'(?:aws|AWS).{0,20}[\'"][0-9a-zA-Z/+]{40}[\'"]', 0.90),  # AWS Secret Key
            ],
            "min_entropy": 3.5
        },
        SecretType.GOOGLE_KEY: {
            "patterns": [
                (r'AIza[0-9A-Za-z\-_]{35}', 0.95),  # Google API Key
            ],
            "min_entropy": 4.0
        },
        SecretType.GITHUB_TOKEN: {
            "patterns": [
                (r'ghp_[0-9a-zA-Z]{36}', 0.98),  # GitHub Personal Access Token
                (r'gho_[0-9a-zA-Z]{36}', 0.98),  # GitHub OAuth Token
                (r'ghu_[0-9a-zA-Z]{36}', 0.98),  # GitHub User-to-server Token
                (r'ghs_[0-9a-zA-Z]{36}', 0.98),  # GitHub Server-to-server Token
                (r'ghr_[0-9a-zA-Z]{36}', 0.98),  # GitHub Refresh Token
            ],
            "min_entropy": 4.5
        },
        SecretType.JWT: {
            "patterns": [
                (r'eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+', 0.85),  # JWT Token
            ],
            "min_entropy": 4.0
        },
        SecretType.PRIVATE_KEY: {
            "patterns": [
                (r'-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----', 0.99),
                (r'-----BEGIN PGP PRIVATE KEY BLOCK-----', 0.99),
            ],
            "min_entropy": 4.0
        },
        SecretType.PASSWORD: {
            "patterns": [
                (r'(?:password|passwd|pwd)\s*[=:]\s*[\'"]([^\'"]{8,})[\'"]', 0.75),
                (r'(?:password|passwd|pwd)\s*[=:]\s*([^\s\'";]{8,})', 0.70),
            ],
            "min_entropy": 3.0
        },
        SecretType.TOKEN: {
            "patterns": [
                (r'(?:token|api_key|apikey|secret)\s*[=:]\s*[\'"]([^\'"]{16,})[\'"]', 0.80),
                (r'Bearer\s+([A-Za-z0-9\-_]{20,})', 0.85),
            ],
            "min_entropy": 4.0
        },
        SecretType.API_KEY: {
            "patterns": [
                (r'sk-[0-9a-zA-Z]{32,}', 0.95),  # OpenAI style
                (r'xox[pboa]-[0-9a-zA-Z-]{10,}', 0.95),  # Slack tokens
                (r'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}', 0.95),  # SendGrid
            ],
            "min_entropy": 4.0
        }
    }
    
    # Context patterns that indicate false positives
    FALSE_POSITIVE_CONTEXTS = [
        r'example',
        r'placeholder',
        r'your[_-]?(?:api[_-]?)?key',
        r'xxx+',
        r'test[_-]?(?:key|token|secret)',
        r'dummy',
        r'fake',
        r'sample',
        r'demo',
        r'\*{3,}',  # Masked values like ****
        r'CHANGE[_-]?ME',
        r'TODO',
        r'INSERT[_-]?HERE',
    ]
    
    # File patterns to skip
    SKIP_FILE_PATTERNS = [
        r'\.min\.js$',
        r'\.min\.css$',
        r'node_modules',
        r'vendor/',
        r'\.lock$',
        r'package-lock\.json$',
        r'yarn\.lock$',
        r'\.md$',  # Documentation
        r'\.txt$',
        r'test_.*\.py$',  # Test files
        r'.*_test\.py$',
    ]
    
    def __init__(self, strict_mode: bool = False):
        """
        Initialize entropy analyzer
        
        Args:
            strict_mode: If True, reduce false positive filtering (more results but more noise)
        """
        self.strict_mode = strict_mode
        self._compiled_patterns: Dict[SecretType, List[Tuple[re.Pattern, float]]] = {}
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Pre-compile regex patterns for performance"""
        for secret_type, config in self.SECRET_PATTERNS.items():
            self._compiled_patterns[secret_type] = [
                (re.compile(pattern, re.IGNORECASE), confidence)
                for pattern, confidence in config["patterns"]
            ]
        
        self._false_positive_pattern = re.compile(
            '|'.join(self.FALSE_POSITIVE_CONTEXTS),
            re.IGNORECASE
        )
    
    @staticmethod
    def calculate_shannon_entropy(text: str) -> float:
        """
        Calculate Shannon entropy of a string
        
        Returns bits per character (higher = more random)
        """
        if not text:
            return 0.0
        
        # Calculate frequency of each character
        freq = {}
        for char in text:
            freq[char] = freq.get(char, 0) + 1
        
        # Calculate entropy
        entropy = 0.0
        length = len(text)
        for count in freq.values():
            probability = count / length
            entropy -= probability * math.log2(probability)
        
        return entropy
    
    def is_base64(self, text: str) -> bool:
        """Check if string is likely base64 encoded"""
        base64_pattern = re.compile(r'^[A-Za-z0-9+/]+={0,2}$')
        return bool(base64_pattern.match(text)) and len(text) % 4 == 0
    
    def is_hex(self, text: str) -> bool:
        """Check if string is hex encoded"""
        hex_pattern = re.compile(r'^[0-9a-fA-F]+$')
        return bool(hex_pattern.match(text)) and len(text) % 2 == 0
    
    def is_likely_false_positive(self, value: str, context: str = "") -> Tuple[bool, str]:
        """
        Check if a potential secret is likely a false positive
        
        Returns (is_false_positive, reason)
        """
        if self.strict_mode:
            return False, ""
        
        combined = f"{value} {context}"
        
        # Check for false positive context patterns
        if self._false_positive_pattern.search(combined):
            return True, "Contains placeholder/example text"
        
        # Check for repeated characters (low entropy masquerading as secrets)
        if len(set(value)) < len(value) * 0.3:
            return True, "Too many repeated characters"
        
        # Check for common word patterns
        words = re.findall(r'[a-zA-Z]{4,}', value)
        if len(words) > 2:
            return True, "Contains too many dictionary words"
        
        # Check if it's a UUID (common false positive)
        if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', value, re.IGNORECASE):
            return True, "UUID pattern detected"
        
        # Check for file path patterns
        if re.match(r'^(/[a-zA-Z0-9._-]+)+$|^[A-Z]:\\', value):
            return True, "File path pattern detected"
        
        return False, ""
    
    def should_skip_file(self, file_path: str) -> bool:
        """Check if file should be skipped based on patterns"""
        for pattern in self.SKIP_FILE_PATTERNS:
            if re.search(pattern, file_path, re.IGNORECASE):
                return True
        return False
    
    def detect_secrets_by_pattern(self, content: str, file_path: str = "") -> List[SecretFinding]:
        """Detect secrets using known patterns"""
        findings = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            for secret_type, compiled_patterns in self._compiled_patterns.items():
                for pattern, confidence in compiled_patterns:
                    matches = pattern.finditer(line)
                    for match in matches:
                        value = match.group(0)
                        
                        # Check if this is a false positive
                        is_fp, reason = self.is_likely_false_positive(value, line)
                        
                        # Calculate entropy
                        entropy = self.calculate_shannon_entropy(value)
                        
                        # Create masked value
                        if len(value) > 8:
                            masked = f"{value[:4]}...{value[-4:]}"
                        else:
                            masked = "*" * len(value)
                        
                        findings.append(SecretFinding(
                            secret_type=secret_type,
                            value_masked=masked,
                            line_number=line_num,
                            file_path=file_path,
                            entropy=entropy,
                            confidence=confidence * (0.5 if is_fp else 1.0),
                            context=line.strip()[:100],
                            is_false_positive=is_fp,
                            reason=reason if is_fp else None
                        ))
        
        return findings
    
    def detect_high_entropy_strings(self, content: str, file_path: str = "") -> List[SecretFinding]:
        """Detect high-entropy strings that may be secrets"""
        findings = []
        lines = content.split('\n')
        
        # Pattern to extract strings (quoted and unquoted)
        string_pattern = re.compile(
            r'''['"]([\x20-\x7E]{''' + str(self.MIN_STRING_LENGTH) + r''',''' + str(self.MAX_STRING_LENGTH) + r'''})['""]'''
            r'''|=\s*([A-Za-z0-9+/\-_]{''' + str(self.MIN_STRING_LENGTH) + r''',})'''
        )
        
        for line_num, line in enumerate(lines, 1):
            # Skip comments
            stripped = line.strip()
            if stripped.startswith(('#', '//', '/*', '*', '"""', "'''")):
                continue
            
            matches = string_pattern.finditer(line)
            for match in matches:
                value = match.group(1) or match.group(2)
                if not value:
                    continue
                
                # Calculate entropy
                entropy = self.calculate_shannon_entropy(value)
                
                # Determine threshold based on encoding
                if self.is_base64(value):
                    threshold = self.MIN_ENTROPY_BASE64
                elif self.is_hex(value):
                    threshold = self.MIN_ENTROPY_HEX
                else:
                    threshold = self.MIN_ENTROPY_GENERIC
                
                # Check if entropy exceeds threshold
                if entropy < threshold:
                    continue
                
                # Check for false positives
                is_fp, reason = self.is_likely_false_positive(value, line)
                if is_fp and not self.strict_mode:
                    continue
                
                # Calculate confidence based on entropy
                confidence = min(0.9, (entropy - threshold) / 2 + 0.5)
                
                # Create masked value
                if len(value) > 8:
                    masked = f"{value[:4]}...{value[-4:]}"
                else:
                    masked = "*" * len(value)
                
                findings.append(SecretFinding(
                    secret_type=SecretType.GENERIC_SECRET,
                    value_masked=masked,
                    line_number=line_num,
                    file_path=file_path,
                    entropy=entropy,
                    confidence=confidence,
                    context=line.strip()[:100],
                    is_false_positive=is_fp,
                    reason=reason if is_fp else None
                ))
        
        return findings
    
    def analyze(self, content: str, file_path: str = "") -> List[SecretFinding]:
        """
        Analyze content for secrets using both patterns and entropy analysis
        
        Args:
            content: Text content to analyze
            file_path: Optional file path for context
            
        Returns:
            List of SecretFinding objects
        """
        # Skip certain file types
        if file_path and self.should_skip_file(file_path):
            return []
        
        findings = []
        
        # Run pattern-based detection
        pattern_findings = self.detect_secrets_by_pattern(content, file_path)
        findings.extend(pattern_findings)
        
        # Run entropy-based detection
        entropy_findings = self.detect_high_entropy_strings(content, file_path)
        
        # Deduplicate (prefer pattern findings over entropy findings)
        pattern_lines = {f.line_number for f in pattern_findings}
        for finding in entropy_findings:
            if finding.line_number not in pattern_lines:
                findings.append(finding)
        
        # Sort by confidence (highest first)
        findings.sort(key=lambda f: f.confidence, reverse=True)
        
        # Filter out low confidence findings unless in strict mode
        if not self.strict_mode:
            findings = [f for f in findings if f.confidence >= 0.5]
        
        return findings
    
    def analyze_file(self, file_path: str) -> List[SecretFinding]:
        """Analyze a file for secrets"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return self.analyze(content, file_path)
        except Exception as e:
            logger.error(f"Error analyzing file {file_path}: {e}")
            return []
    
    def get_summary(self, findings: List[SecretFinding]) -> Dict[str, Any]:
        """Get summary statistics for findings"""
        if not findings:
            return {
                "total_findings": 0,
                "confirmed_secrets": 0,
                "potential_false_positives": 0,
                "by_type": {},
                "by_severity": {}
            }
        
        confirmed = [f for f in findings if not f.is_false_positive]
        false_positives = [f for f in findings if f.is_false_positive]
        
        by_type = {}
        for f in confirmed:
            by_type[f.secret_type.value] = by_type.get(f.secret_type.value, 0) + 1
        
        # Map confidence to severity
        by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for f in confirmed:
            if f.confidence >= 0.9:
                by_severity["critical"] += 1
            elif f.confidence >= 0.75:
                by_severity["high"] += 1
            elif f.confidence >= 0.5:
                by_severity["medium"] += 1
            else:
                by_severity["low"] += 1
        
        return {
            "total_findings": len(findings),
            "confirmed_secrets": len(confirmed),
            "potential_false_positives": len(false_positives),
            "by_type": by_type,
            "by_severity": by_severity
        }


# Export all
__all__ = [
    "SecretType",
    "SecretFinding",
    "EntropyAnalyzer"
]
