"""
TLS Cipher Suite Analyzer
Detects weak encryption protocols and cipher suites
"""
import ssl
import socket
from typing import List, Dict, Optional


class TLSAnalyzer:
    """Analyzes TLS configuration for weaknesses"""
    
    # Weak/deprecated cipher suites
    WEAK_CIPHERS = [
        "DES", "3DES", "RC4", "MD5", "NULL", "EXPORT", "anon"
    ]
    
    # Vulnerable TLS versions
    WEAK_PROTOCOLS = [
        ssl.PROTOCOL_SSLv2, ssl.PROTOCOL_SSLv3, ssl.PROTOCOL_TLSv1, ssl.PROTOCOL_TLSv1_1
    ]
    
    def __init__(self):
        self.vulnerabilities = []
    
    async def analyze_tls(self, hostname: str, port: int = 443) -> Dict:
        """
        Analyze TLS configuration for a host
        Returns dict with cipher suites, protocols, and vulnerabilities
        """
        results = {
            "supported_protocols": [],
            "cipher_suites": [],
            "weak_ciphers": [],
            "vulnerabilities": []
        }
        
        try:
            # Test different TLS versions
results["supported_protocols"] = self._test_protocols(hostname, port)
            
            # Get supported cipher suites
            results["cipher_suites"] = self._get_cipher_suites(hostname, port)
            
            # Detect weak ciphers
            for cipher in results["cipher_suites"]:
                cipher_name = cipher.get("name", "")
                for weak in self.WEAK_CIPHERS:
                    if weak in cipher_name.upper():
                        results["weak_ciphers"].append(cipher_name)
                        results["vulnerabilities"].append({
                            "type": "weak_cipher",
                            "cipher": cipher_name,
                            "severity": "high",
                            "description": f"Weak cipher suite detected: {cipher_name}"
                        })
            
            # Check for protocol vulnerabilities
            for protocol in results["supported_protocols"]:
                if protocol in ["SSLv2", "SSLv3"]:
                    results["vulnerabilities"].append({
                        "type": "weak_protocol",
                        "protocol": protocol,
                        "severity": "critical",
                        "description": f"{protocol} is deprecated and vulnerable"
                    })
                elif protocol in ["TLSv1.0", "TLSv1.1"]:
                    results["vulnerabilities"].append({
                        "type": "outdated_protocol",
                        "protocol": protocol,
                        "severity": "medium",
                        "description": f"{protocol} is outdated, upgrade to TLS 1.2+"
                    })
        
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def _test_protocols(self, hostname: str, port: int) -> List[str]:
        """Test which TLS/SSL protocols are supported"""
        supported = []
        
        protocols_to_test = [
            ("SSLv2", ssl.PROTOCOL_SSLv2) if hasattr(ssl, "PROTOCOL_SSLv2") else None,
            ("SSLv3", ssl.PROTOCOL_SSLv3) if hasattr(ssl, "PROTOCOL_SSLv3") else None,
            ("TLSv1.0", ssl.PROTOCOL_TLSv1),
            ("TLSv1.1", ssl.PROTOCOL_TLSv1_1) if hasattr(ssl, "PROTOCOL_TLSv1_1") else None,
            ("TLSv1.2", ssl.PROTOCOL_TLSv1_2) if hasattr(ssl, "PROTOCOL_TLSv1_2") else None,
            ("TLSv1.3", ssl.PROTOCOL_TLS) if hasattr(ssl, "PROTOCOL_TLS") else None,
        ]
        
        for protocol_name, protocol_const in protocols_to_test:
            if protocol_const is None:
                continue
                
            try:
                context = ssl.SSLContext(protocol_const)
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                
                with socket.create_connection((hostname, port), timeout=5) as sock:
                    with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        supported.append(protocol_name)
            except:
                pass
        
        return supported
    
    def _get_cipher_suites(self, hostname: str, port: int) -> List[Dict]:
        """Get list of supported cipher suites"""
        cipher_suites = []
        
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            with socket.create_connection((hostname, port), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cipher = ssock.cipher()
                    if cipher:
                        cipher_suites.append({
                            "name": cipher[0],
                            "version": cipher[1],
                            "bits": cipher[2]
                        })
        except Exception as e:
            pass
        
        return cipher_suites
