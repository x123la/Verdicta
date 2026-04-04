import type { NoteRecord, NotesRepository } from "@verdicta/db";

export class NotesService {
  constructor(private readonly notesRepository: NotesRepository) {}

  list(workspaceId: string) {
    return this.notesRepository.list(workspaceId);
  }

  upsert(input: Omit<NoteRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
    return this.notesRepository.upsert(input);
  }
}
