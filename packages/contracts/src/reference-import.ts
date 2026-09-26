export type ReferenceImportClassification =
  | "already-supported"
  | "pattern-candidate"
  | "project-specific-extension"
  | "product-gap"
  | "core-gap";

export interface ReferenceImportSource {
  readonly repository: string;
  readonly ref: string;
  readonly pullRequestNumber: number;
  readonly pullRequestTitle: string;
  readonly revision: string;
  readonly manifestRevision: string;
  readonly importedOn: string;
}

export interface ReferenceImportLocalFiles {
  readonly manifestPath: string;
  readonly referenceDocument: string;
  readonly mappingDocument: string;
  readonly gapAnalysisDocument: string;
}

export interface ReferenceImportSourceArtifact {
  readonly path: string;
  readonly role:
    | "architecture-source"
    | "source-manifest"
    | "review-checklist"
    | "adr-template";
  readonly classifications: readonly ReferenceImportClassification[];
}

export interface ReferenceImportConceptMapping {
  readonly sourceConcept: string;
  readonly classification: ReferenceImportClassification;
  readonly namespace: string;
  readonly blueprintConcept?: string;
  readonly disposition: string;
}

export interface ReferenceImportManifest {
  readonly schema: "REFERENCE_IMPORT_MANIFEST_V1";
  readonly schemaVersion: "1.0.0";
  readonly id: `reference-import:${string}:v${number}`;
  readonly caseId: string;
  readonly referenceCaseId: `knowledge:reference-case:${string}`;
  readonly title: string;
  readonly source: ReferenceImportSource;
  readonly local: ReferenceImportLocalFiles;
  readonly sourceArtifacts: readonly ReferenceImportSourceArtifact[];
  readonly conceptMappings: readonly ReferenceImportConceptMapping[];
  readonly authority: {
    readonly canonicalProjectState: false;
    readonly qualityGateEvidence: false;
    readonly releaseAuthority: false;
    readonly accessAuthority: false;
  };
  readonly driftPolicy: {
    readonly snapshotMode: "frozen";
    readonly networkRequiredForCanonicalRead: false;
    readonly updateMode: "new-observation";
    readonly currentnessClaimRequiresSourceCheck: true;
  };
  readonly compatibility: {
    readonly strategy: "additive-first";
    readonly unknownFields: "reject";
    readonly breakingChangeRequires: readonly (
      | "ADR"
      | "migration-plan"
      | "compatibility-statement"
    )[];
  };
}
