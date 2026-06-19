"use client";

import { useCallback, useEffect, useState } from "react";
import { Beaker, FlaskConical, Plus, Trash2 } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";
import { useDevProject } from "@/hooks/useDevProject";

type TestCase = {
  id: string;
  title: string;
  status: string;
  steps: string;
  expectedResult: string;
};

export default function TestLabPage() {
  const { project } = useDevProject();
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");

  const fetchCases = useCallback(async () => {
    if (!project?.id) return;
    try {
      const res = await fetch(`/api/test-cases?projectId=${project.id}`);
      if (res.ok) setCases(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !title.trim()) return;
    const res = await fetch("/api/test-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        title: title.trim(),
        steps: "1. Navigate to the feature\n2. Perform the action\n3. Verify the result",
        expectedResult: "Feature behaves as specified",
        status: "draft",
      }),
    });
    if (res.ok) {
      setTitle("");
      setShowForm(false);
      fetchCases();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/test-cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchCases();
  };

  const deleteCase = async (id: string) => {
    if (!confirm("Delete this test case?")) return;
    await fetch(`/api/test-cases/${id}`, { method: "DELETE" });
    fetchCases();
  };

  return (
    <DevPageShell>
      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <FlaskConical className="w-8 h-8 text-purple" />
                Test Lab
              </h1>
              <p className="text-foreground/60 text-lg">
                Define and track test cases for cross-browser QA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              New test case
            </button>
          </div>

          {showForm && (
            <form
             
              onSubmit={handleCreate}
              className="mb-6 bg-white p-6 rounded-xl border-2 border-purple flex gap-4"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Test case title"
                className="flex-1 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                required
              />
              <button type="submit" className="px-6 py-2 bg-purple text-white rounded-lg font-bold">
                Create
              </button>
            </form>
          )}

          <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-foreground/5 border-b-2 border-foreground/10 text-xs font-bold uppercase tracking-widest text-foreground/50">
              <div className="col-span-6">Test case</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            {cases.length === 0 ? (
              <p className="p-8 text-center text-foreground/50 font-medium">No test cases yet.</p>
            ) : (
              cases.map((test) => (
                <div
                  key={test.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-foreground/5 last:border-0 hover:bg-[#faf9f8] items-center group"
                >
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <Beaker className="w-4 h-4 text-purple shrink-0" />
                    <span className="font-medium text-sm truncate">{test.title}</span>
                  </div>
                  <div className="col-span-3">
                    <select
                      value={test.status}
                      onChange={(e) => updateStatus(test.id, e.target.value)}
                      className="text-xs border-2 border-foreground/10 rounded-lg px-2 py-1 outline-none focus:border-purple capitalize"
                    >
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteCase(test.id)}
                      className="text-foreground/30 hover:text-light-red opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DevPageShell>
  );
}
