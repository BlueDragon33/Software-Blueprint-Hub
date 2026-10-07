import { describe, expect, it } from 'vitest';
import { createStaticStudy, sourceGeometryChanged, type CaeStudyId } from '../src/domain/model';

describe('CAE foundation domain', () => {
  it('marks a study stale when its bound source geometry hash changes', () => {
    const study = createStaticStudy('cae:test' as CaeStudyId, {
      producerApp: 'cad-cam-3d',
      projectId: 'cad:test',
      projectRevision: 'r1',
      contentHash: 'abc',
      unit: 'mm',
      coordinateFrame: 'right-handed-z-up',
    });
    expect(sourceGeometryChanged(study, 'def').state).toBe('stale');
  });
});
