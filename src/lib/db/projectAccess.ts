import { getDocumentById } from "@/lib/db/database";

export async function assertProjectOwner(projectId: string, userId: string) {
  const project = await getDocumentById("projects", projectId);
  if (!project || project.ownerId !== userId) {
    return null;
  }
  return project;
}
