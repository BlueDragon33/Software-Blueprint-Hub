import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

async function exists(path: string) {
  await access(resolve(root, path));
  return true;
}

describe('engineering suite foundation', () => {
  it('reserves independent CAD, ECAD and CAE ownership under Constitution 1.2', async () => {
    const raw = await readFile(resolve(root, '.blueprint/engineering-suite-manifest.json'), 'utf8');
    const manifest = JSON.parse(raw) as {
      constitution: { policyVersion: string };
      members: Array<{ id: string; repository: string; status: string; managementDeviceNamespace: string }>;
      sharedCorePolicy: { repositoryAllowedNow: boolean };
      controlPlane: { mayOwnEngineeringArtifacts: boolean };
    };

    expect(manifest.constitution.policyVersion).toBe('1.2.0');
    expect(manifest.members.map((member) => member.id)).toEqual([
      'cad-cam-3d',
      'ecad-design',
      'cae-simulation',
    ]);
    expect(manifest.members.find((member) => member.id === 'ecad-design')?.repository).toBe('BlueDragon33/ECAD_Design');
    expect(manifest.members.find((member) => member.id === 'cae-simulation')?.repository).toBe('BlueDragon33/CAE_Simulation');
    expect(manifest.members.map((member) => member.managementDeviceNamespace)).toEqual(['CAD-', 'ECAD-', 'CAE-']);
    expect(manifest.sharedCorePolicy.repositoryAllowedNow).toBe(false);
    expect(manifest.controlPlane.mayOwnEngineeringArtifacts).toBe(false);
  });

  it('keeps the suite-wide canonical contracts and bootstrap standard present', async () => {
    await expect(exists('docs/ENGINEERING-SUITE-CANONICAL-BLUEPRINT.md')).resolves.toBe(true);
    await expect(exists('docs/ENGINEERING-SUITE-INTEROP-CONTRACT.v1.md')).resolves.toBe(true);
    await expect(exists('docs/ENGINEERING-SUITE-REPOSITORY-BOOTSTRAP-STANDARD.md')).resolves.toBe(true);
  });

  for (const product of ['ECAD_Design', 'CAE_Simulation']) {
    it(product + ' template contains governance, canonical blueprint, typed domain seed and CI', async () => {
      const base = 'templates/engineering-suite/' + product;
      const required = [
        '.blueprint/constitution-adoption.json',
        'README.md',
        'AGENTS.md',
        'docs/ARCHITECTURE.md',
        'docs/DEPENDENCY_BUDGET.md',
        'package.json',
        'tsconfig.json',
        'src/domain/model.ts',
        'tests/foundation.test.ts',
        '.github/workflows/ci.yml',
      ];
      for (const path of required) {
        await expect(exists(base + '/' + path)).resolves.toBe(true);
      }
    });
  }
});
