export type EcadProjectId = string & { readonly __brand: 'EcadProjectId' };
export type EcadEntityId = string & { readonly __brand: 'EcadEntityId' };

export type EcadProject = {
  schemaVersion: 1;
  id: EcadProjectId;
  name: string;
  sheets: readonly SchematicSheet[];
  pcb: PcbDesign | null;
};

export type SchematicSheet = {
  id: EcadEntityId;
  name: string;
  symbols: readonly SymbolInstance[];
  nets: readonly Net[];
};

export type SymbolInstance = {
  id: EcadEntityId;
  libraryRef: string;
  reference: string;
  value?: string;
};

export type Net = {
  id: EcadEntityId;
  name: string;
  pins: readonly { symbolId: EcadEntityId; pinId: string }[];
};

export type PcbDesign = {
  boardId: EcadEntityId;
  outlineMm: readonly { x: number; y: number }[];
  thicknessMm: number;
};

export function createEmptyEcadProject(id: EcadProjectId, name = 'Untitled ECAD Project'): EcadProject {
  return { schemaVersion: 1, id, name, sheets: [], pcb: null };
}
