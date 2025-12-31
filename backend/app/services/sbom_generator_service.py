"""
SBOM Generator Service
Generate Software Bill of Materials in CycloneDX and SPDX formats
"""
import json
import os
import re
import hashlib
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime
from dataclasses import dataclass, field
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.security_advanced_models import (
    SBOM, SBOMComponent, SBOMFormat, LicenseRisk
)

logger = logging.getLogger(__name__)


# License risk mapping
HIGH_RISK = {"GPL-3.0", "GPL-2.0", "AGPL-3.0", "SSPL-1.0"}
MEDIUM_RISK = {"LGPL-3.0", "LGPL-2.1", "MPL-2.0", "EPL-2.0"}
LOW_RISK = {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Unlicense"}


@dataclass
class ParsedComponent:
    """Parsed dependency component"""
    name: str
    version: str
    ecosystem: str
    component_type: str = "library"
    license_id: Optional[str] = None
    license_name: Optional[str] = None
    purl: Optional[str] = None
    is_direct: bool = True
    hashes: Dict[str, str] = field(default_factory=dict)


class SBOMGeneratorService:
    """Generate SBOMs in CycloneDX and SPDX formats"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_sbom(
        self,
        project_id: UUID,
        organisation_id: UUID,
        name: str,
        source_path: str,
        format: SBOMFormat = SBOMFormat.CYCLONEDX_JSON,
        created_by: UUID = None
    ) -> SBOM:
        """Generate SBOM from project source"""
        
        human_id = await self._generate_human_id()
        
        # Parse components from manifest files
        components = await self._parse_project(source_path)
        
        # Generate raw content
        if format in [SBOMFormat.CYCLONEDX_JSON, SBOMFormat.CYCLONEDX_XML]:
            raw_content = self._generate_cyclonedx(name, components)
        else:
            raw_content = self._generate_spdx(name, components)
        
        # Count stats
        direct = sum(1 for c in components if c.is_direct)
        high_risk = sum(1 for c in components if self._get_license_risk(c.license_id) == LicenseRisk.HIGH)
        
        sbom = SBOM(
            project_id=project_id,
            organisation_id=organisation_id,
            human_id=human_id,
            name=name,
            format=format,
            spec_version="1.4" if "cyclonedx" in format.value else "2.3",
            source_type="repository",
            source_path=source_path,
            total_components=len(components),
            direct_dependencies=direct,
            transitive_dependencies=len(components) - direct,
            licenses_identified=sum(1 for c in components if c.license_id),
            high_risk_licenses=high_risk,
            raw_content=raw_content,
            created_by=created_by
        )
        
        self.db.add(sbom)
        await self.db.commit()
        await self.db.refresh(sbom)
        
        # Save components
        for comp in components:
            await self._save_component(sbom.id, comp)
        
        return sbom

    async def _parse_project(self, source_path: str) -> List[ParsedComponent]:
        """Parse all manifest files in project"""
        components = []
        
        for root, _, files in os.walk(source_path):
            if "node_modules" in root or "venv" in root or ".git" in root:
                continue
            
            for filename in files:
                filepath = os.path.join(root, filename)
                
                if filename == "package.json":
                    components.extend(await self._parse_package_json(filepath))
                elif filename == "requirements.txt":
                    components.extend(await self._parse_requirements(filepath))
                elif filename == "go.mod":
                    components.extend(await self._parse_go_mod(filepath))
        
        return components

    async def _parse_package_json(self, filepath: str) -> List[ParsedComponent]:
        """Parse package.json"""
        components = []
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            for name, version in data.get("dependencies", {}).items():
                clean_version = re.sub(r'^[\^~>=<]+', '', version)
                components.append(ParsedComponent(
                    name=name, version=clean_version, ecosystem="npm",
                    purl=f"pkg:npm/{name}@{clean_version}", is_direct=True
                ))
            
            for name, version in data.get("devDependencies", {}).items():
                clean_version = re.sub(r'^[\^~>=<]+', '', version)
                components.append(ParsedComponent(
                    name=name, version=clean_version, ecosystem="npm",
                    purl=f"pkg:npm/{name}@{clean_version}", is_direct=True
                ))
        except Exception as e:
            logger.warning(f"Failed to parse {filepath}: {e}")
        return components

    async def _parse_requirements(self, filepath: str) -> List[ParsedComponent]:
        """Parse requirements.txt"""
        components = []
        try:
            with open(filepath, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#') or line.startswith('-'):
                        continue
                    match = re.match(r'^([a-zA-Z0-9._-]+)([=<>!~]+)?(.+)?$', line)
                    if match:
                        name, _, version = match.groups()
                        version = version or "*"
                        components.append(ParsedComponent(
                            name=name, version=version, ecosystem="pypi",
                            purl=f"pkg:pypi/{name}@{version}", is_direct=True
                        ))
        except Exception as e:
            logger.warning(f"Failed to parse {filepath}: {e}")
        return components

    async def _parse_go_mod(self, filepath: str) -> List[ParsedComponent]:
        """Parse go.mod"""
        components = []
        try:
            with open(filepath, 'r') as f:
                for line in f:
                    if line.strip().startswith("require"):
                        continue
                    match = re.match(r'\s+(.+)\s+v(.+)$', line)
                    if match:
                        name, version = match.groups()
                        components.append(ParsedComponent(
                            name=name.strip(), version=version.strip(), ecosystem="go",
                            purl=f"pkg:golang/{name.strip()}@v{version.strip()}", is_direct=True
                        ))
        except Exception as e:
            logger.warning(f"Failed to parse {filepath}: {e}")
        return components

    def _generate_cyclonedx(self, name: str, components: List[ParsedComponent]) -> str:
        """Generate CycloneDX JSON"""
        sbom = {
            "bomFormat": "CycloneDX",
            "specVersion": "1.4",
            "version": 1,
            "metadata": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "tools": [{"vendor": "Cognitest", "name": "Security Module", "version": "1.0.0"}],
                "component": {"type": "application", "name": name}
            },
            "components": []
        }
        
        for comp in components:
            c = {
                "type": comp.component_type,
                "name": comp.name,
                "version": comp.version,
                "purl": comp.purl
            }
            if comp.license_id:
                c["licenses"] = [{"license": {"id": comp.license_id}}]
            sbom["components"].append(c)
        
        return json.dumps(sbom, indent=2)

    def _generate_spdx(self, name: str, components: List[ParsedComponent]) -> str:
        """Generate SPDX JSON"""
        doc_id = f"SPDXRef-DOCUMENT-{uuid4().hex[:8]}"
        sbom = {
            "spdxVersion": "SPDX-2.3",
            "dataLicense": "CC0-1.0",
            "SPDXID": doc_id,
            "name": name,
            "creationInfo": {
                "created": datetime.utcnow().isoformat() + "Z",
                "creators": ["Tool: Cognitest Security Module"]
            },
            "packages": []
        }
        
        for i, comp in enumerate(components):
            pkg = {
                "SPDXID": f"SPDXRef-Package-{i}",
                "name": comp.name,
                "versionInfo": comp.version,
                "downloadLocation": "NOASSERTION",
                "filesAnalyzed": False
            }
            if comp.license_id:
                pkg["licenseConcluded"] = comp.license_id
            sbom["packages"].append(pkg)
        
        return json.dumps(sbom, indent=2)

    def _get_license_risk(self, license_id: str) -> LicenseRisk:
        if not license_id:
            return LicenseRisk.UNKNOWN
        upper = license_id.upper()
        if any(h.upper() in upper for h in HIGH_RISK):
            return LicenseRisk.HIGH
        if any(m.upper() in upper for m in MEDIUM_RISK):
            return LicenseRisk.MEDIUM
        if any(l.upper() in upper for l in LOW_RISK):
            return LicenseRisk.LOW
        return LicenseRisk.UNKNOWN

    async def _generate_human_id(self) -> str:
        result = await self.db.execute(select(func.count()).select_from(SBOM))
        count = result.scalar() or 0
        return f"SBOM-{count + 1:05d}"

    async def _save_component(self, sbom_id: UUID, comp: ParsedComponent) -> SBOMComponent:
        db_comp = SBOMComponent(
            sbom_id=sbom_id,
            component_type=comp.component_type,
            name=comp.name,
            version=comp.version,
            purl=comp.purl,
            ecosystem=comp.ecosystem,
            license_id=comp.license_id,
            license_name=comp.license_name,
            license_risk=self._get_license_risk(comp.license_id),
            is_direct=comp.is_direct,
            hashes=comp.hashes
        )
        self.db.add(db_comp)
        await self.db.commit()
        return db_comp

    async def get_sbom(self, sbom_id: UUID) -> Optional[SBOM]:
        result = await self.db.execute(select(SBOM).where(SBOM.id == sbom_id))
        return result.scalar_one_or_none()

    async def export_sbom(self, sbom_id: UUID, format: str = "json") -> str:
        sbom = await self.get_sbom(sbom_id)
        if not sbom:
            raise ValueError(f"SBOM {sbom_id} not found")
        return sbom.raw_content or ""

    async def get_components(self, sbom_id: UUID) -> List[SBOMComponent]:
        result = await self.db.execute(
            select(SBOMComponent).where(SBOMComponent.sbom_id == sbom_id)
        )
        return result.scalars().all()
