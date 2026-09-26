import type {
  LessonLearned,
  ReleaseRecord
} from "@blueprint-os/contracts";

export interface ReleaseRepository {
  createRelease(value: ReleaseRecord): Promise<ReleaseRecord>;
  findReleaseById(id: string): Promise<ReleaseRecord | null>;
  listReleasesByProject(projectId: string): Promise<readonly ReleaseRecord[]>;
  updateRelease(
    value: ReleaseRecord,
    expectedRecordVersion: number
  ): Promise<ReleaseRecord>;

  createLesson(value: LessonLearned): Promise<LessonLearned>;
  findLessonById(id: string): Promise<LessonLearned | null>;
  listLessonsByProject(projectId: string): Promise<readonly LessonLearned[]>;
  updateLesson(
    value: LessonLearned,
    expectedRecordVersion: number
  ): Promise<LessonLearned>;
}
