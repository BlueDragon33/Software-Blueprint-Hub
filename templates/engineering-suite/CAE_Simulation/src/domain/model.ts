export type CaeStudyId = string & { readonly __brand: 'CaeStudyId' };

export type GeometrySource = {
  producerApp: 'cad-cam-3d';
  projectId: string;
  projectRevision: string;
  contentHash: string;
  unit: 'mm';
  coordinateFrame: 'right-handed-z-up';
};

export type CaeStudy = {
  schemaVersion: 1;
  id: CaeStudyId;
  name: string;
  analysis: 'static-linear';
  geometry: GeometrySource;
  state: 'draft' | 'ready' | 'stale' | 'solved' | 'invalid';
};

export function createStaticStudy(
  id: CaeStudyId,
  geometry: GeometrySource,
  name = 'Static Structural Study',
): CaeStudy {
  return { schemaVersion: 1, id, name, analysis: 'static-linear', geometry, state: 'draft' };
}

export function sourceGeometryChanged(study: CaeStudy, nextHash: string): CaeStudy {
  return nextHash === study.geometry.contentHash ? study : { ...study, state: 'stale' };
}
