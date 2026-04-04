import type { DraftRecord, DraftsRepository } from "@verdicta/db";

export class DraftService {
  constructor(private readonly draftsRepository: DraftsRepository) {}

  list(workspaceId: string) {
    return this.draftsRepository.list(workspaceId);
  }

  upsert(input: Omit<DraftRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
    return this.draftsRepository.upsert(input);
  }
}
