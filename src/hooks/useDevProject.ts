"use client";

import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/lib/dev/types";

export function useDevProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ensureProject = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");

      let projects: Project[] = await res.json();

      if (projects.length === 0) {
        const createRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Sprint Board",
            description: "Main product & engineering workspace",
          }),
        });
        if (!createRes.ok) throw new Error("Failed to create project");
        projects = [await createRes.json()];
      }

      setProject(projects[0]);
      return projects[0];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ensureProject();
  }, [ensureProject]);

  return { project, loading, error, refresh: ensureProject };
}
