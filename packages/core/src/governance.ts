import type {
  ArchitectureDecision,
  Risk,
  TechnicalDebt
} from "@blueprint-os/contracts";

export interface GovernanceRepository {
  createArchitectureDecision(
    value: ArchitectureDecision
  ): Promise<ArchitectureDecision>;
  findArchitectureDecisionById(
    id: string
  ): Promise<ArchitectureDecision | null>;
  listArchitectureDecisionsByProject(
    projectId: string
  ): Promise<readonly ArchitectureDecision[]>;
  updateArchitectureDecision(
    value: ArchitectureDecision,
    expectedRecordVersion: number
  ): Promise<ArchitectureDecision>;

  createRisk(value: Risk): Promise<Risk>;
  findRiskById(id: string): Promise<Risk | null>;
  listRisksByProject(projectId: string): Promise<readonly Risk[]>;
  updateRisk(value: Risk, expectedRecordVersion: number): Promise<Risk>;

  createTechnicalDebt(value: TechnicalDebt): Promise<TechnicalDebt>;
  findTechnicalDebtById(id: string): Promise<TechnicalDebt | null>;
  listTechnicalDebtByProject(
    projectId: string
  ): Promise<readonly TechnicalDebt[]>;
  updateTechnicalDebt(
    value: TechnicalDebt,
    expectedRecordVersion: number
  ): Promise<TechnicalDebt>;
}
