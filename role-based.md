# CogniTest – Enterprise Role System (Unified Testing Platform)
Version 2025.11 – single-file reference

## A. Role Hierarchy (Tenant → Project)
            ┌──────────────┐
            │   Owner      │  ← platform/vendor
            └──────┬───────┘
                   │
      ┌────────────┴────────────┐
  ┌────▼──────┐           ┌────▼──────┐
  │   Admin   │           │ SecOfficer│  ← SoD split
  └────┬──────┘           └────┬──────┘
       │                       │
 ┌─────┴──────┐           ┌────┴──────┐
 │Auditor(RO) │           │SvcAccount │  ← compliance & CI
 └────────────┘           └───────────┘
         └──────── Project Roles ───────┘
                    (per project)


## B. Organisation-Level Permissions
| Resource / Action | Owner | Admin | SecOfficer | Auditor | SvcAccount |
|-------------------|-------|-------|------------|---------|------------|
| View tenant dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit tenant branding | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete tenant (GDPR) | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Impersonate user | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD teams | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure SSO | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rotate tenant secrets | ✅ | ❌ | ❌ | ❌ | ❌ |
| View invoices | ✅ | ✅ | ❌ | ✅ | ❌ |
| Update payment method | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export cost report | ✅ | ✅ | ❌ | ✅ | ❌ |
| Read audit log | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export audit package | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete audit entries | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD global scan profiles | ✅ | ✅ | ✅ | ❌ | ❌ |
| Triage any vuln | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mark false-positive | ✅ | ❌ | ✅ | ❌ | ❌ |
| Publish marketplace nodes | ✅ | ✅ | ❌ | ❌ | ❌ |

## C. Project-Level Permissions
| Resource / Action | Project Admin | QA Lead | Tester | Auto Eng | Dev (RO) | Viewer |
|-------------------|---------------|---------|--------|-----------|----------|--------|
| CRUD test artefacts | ✅ | ✅ | ✅ | 🟡 U only | ✅ | ✅ |
| Approve test case | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Link requirements | ✅ | ✅ | 🟡 R only | ✅ | ✅ | ❌ |
| Create test cycle | ✅ | ✅ | 🟡 Create | ❌ | ❌ | ❌ |
| Execute manual test | ✅ | ✅ | ✅ | ✅ | 🟡 R only | ❌ |
| Record evidence | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| CRUD automation flow | ✅ | ✅ | 🟡 R+E | ✅ | ✅ | ✅ |
| Execute flow dev/staging | ✅ | ✅ | ✅ | ✅ | 🟡 R only | ❌ |
| Execute flow prod | ✅ | ✅ | 🟡 2FA | ✅ | ❌ | ❌ |
| Accept self-heal | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Start scan staging | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update finding | ✅ | ✅ | 🟡 comment | ✅ | 🟡 R only | ✅ |
| Export SARIF | ✅ | ✅ | 🟡 non-PII | ✅ | ✅ | ✅ |
| CRUD k6 script | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Run load ≤10 k VU | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Run load >10 k VU | ✅ | 🟡 approve | ❌ | 🟡 approve | ❌ | ❌ |
| Create dashboard | ✅ | ✅ | 🟡 personal | ✅ | ✅ | ❌ |
| Export dashboard | ✅ | ✅ | 🟡 non-PII | ✅ | ✅ | ✅ |
| Schedule report | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit env vars | ✅ | 🟡 non-secret | ❌ | ❌ | ❌ | ❌ |
| Rotate project secret | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## D. Service-Account (CI) Limits
- Token auth, IP whitelist, no UI.  
- Allowed: execute flows/scans, post results.  
- Denied: read audit, manage users, billing, export.

## E. Sample ABAC Rules
```rego
deny["prod blocked"] {
  input.action == "Execute"
  input.resource.envId == "prod"
  "prod-access" != input.user.attributes[_]
}