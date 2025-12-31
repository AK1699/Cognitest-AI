# Security Testing Module – Business Requirements Document

## Executive Summary
The new Security Testing Module in Cognitest will integrate application security scanning directly into the existing testing platform, bringing enterprise-grade vulnerability detection to developers and security teams. It will consolidate static analysis (SAST), dynamic analysis (DAST), interactive testing (IAST), runtime protection (RASP), and software composition analysis (SCA) into one unified workflow. Embedding security tools into the development lifecycle enables shift-left security, catching flaws early and reducing risk. Integrated dashboards and reporting will provide actionable insights, bridging the gap between AppSec and development teams to speed remediation. This module improves application security posture, streamlines compliance, and accelerates delivery by automating security in CI/CD.

## Scope
### In-Scope
- Static Application Security Testing (SAST)
- Dynamic Application Security Testing (DAST)
- Interactive Application Security Testing (IAST)
- Runtime Application Self-Protection (RASP)
- Software Composition Analysis (SCA)
- Reporting and dashboards
- CI/CD ecosystem integration
- Policy and customization engine
- Issue reporting and workflow integration

### Out-of-Scope
- Manual penetration testing
- Infrastructure and network scanning beyond web applications
- Mobile device security management

## Functional Requirements
### SAST
- Scan code and compiled artifacts
- Detailed file/line reporting
- IDE and SCM integration

### DAST
- Web and API runtime security scanning
- Authenticated and unauthenticated scanning
- Scheduling support

### IAST
- Runtime instrumentation during test execution
- Vulnerability capture in real time

### RASP
- Runtime monitoring and blocking
- Alerts and insights

### SCA
- Dependency scanning
- License and vulnerability mapping
- SBOM generation

### Reporting & Dashboard
- Unified console
- Severity-based reports
- Export + executive dashboards

### CI/CD
- Jenkins, GitHub, GitLab, Azure DevOps
- Shift-left enforcement policies

### Rule Customization
- Override thresholds
- Custom policies
- False positive suppression

## Non-Functional Requirements
- Horizontally scalable
- Highly available
- Secure encryption in transit and rest
- Role-based access control
- Logging and audit trails
- Compliance ready

## Architecture
- Containerized microservices
- API-first framework
- Scalable scan engines
- Independent scaling services
- Cloud, On-Prem, Hybrid deployment

## Integrations
- SAST: SonarQube, CodeQL, Fortify
- DAST: OWASP ZAP, Burp
- SCA: Snyk, Black Duck
- RASP/IAST: Contrast, Hdiv

## Roles & Permissions
- System Admin
- Security Analyst
- Developer
- Auditor
- Guest

## Workflows
- Pipeline automated scan
- Manual scan
- Ticket integration
- Risk governance
- Compliance reporting

## Implementation Timeline
Phase based execution from design to rollout

## Risks & Assumptions
Defined risk framework with mitigations

## Appendices
Glossary + Compliance Notes
