import { describe, expect, it } from 'vitest';
import { createEmptyEcadProject, type EcadProjectId } from '../src/domain/model';

describe('ECAD foundation domain', () => {
  it('creates one versioned canonical project envelope', () => {
    const project = createEmptyEcadProject('ecad:test' as EcadProjectId);
    expect(project.schemaVersion).toBe(1);
    expect(project.sheets).toEqual([]);
    expect(project.pcb).toBeNull();
  });
});
