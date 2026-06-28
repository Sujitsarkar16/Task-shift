"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Plus, Copy, Check, Trash2, Crown, Edit3, Eye,
  Mail, X, Loader2, CheckSquare2, UserPlus, Settings2,
} from "lucide-react";
import useSWR, { mutate as swrMutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/Toast";
import { useTasks } from "@/hooks/useTasks";

type Workspace = { id: string; name: string; ownerId: string };
type Member = {
  id: string; workspaceId: string; userId: string; email: string;
  displayName: string; role: "owner" | "editor" | "viewer"; status: string;
};
type WorkspaceDetail = { workspace: Workspace; members: Member[]; myRole: string };

const ROLE_ICON = { owner: Crown, editor: Edit3, viewer: Eye };
const ROLE_COLOR = { owner: "text-yellow-600 bg-yellow-50", editor: "text-blue-600 bg-blue-50", viewer: "text-gray-500 bg-gray-50" };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

export default function CollaboratePage() {
  const { success, error: toastError } = useToast();
  const { tasks, mutate: mutateTasks } = useTasks();

  const { data: workspaces = [], mutate: mutateWS } =
    useSWR<Workspace[]>("/api/workspaces", fetcher, { revalidateOnFocus: false });

  const [selectedWS, setSelectedWS] = useState<string | null>(null);
  const [wsDetail, setWsDetail] = useState<WorkspaceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showNewWS, setShowNewWS] = useState(false);
  const [newWSName, setNewWSName] = useState("");
  const [creatingWS, setCreatingWS] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const [showShareTask, setShowShareTask] = useState(false);
  const [sharingTaskId, setSharingTaskId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const loadDetail = useCallback(async (wsId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${wsId}`);
      if (res.ok) setWsDetail(await res.json());
    } catch { /* silent */ }
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (selectedWS) { loadDetail(selectedWS); setInviteLink(""); }
  }, [selectedWS, loadDetail]);

  const { data: wsTasks = [], mutate: mutateWSTasks } =
    useSWR<typeof tasks>(
      selectedWS ? `/api/todos?workspaceId=${selectedWS}` : null,
      fetcher,
      { revalidateOnFocus: false },
    );

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWSName.trim()) return;
    setCreatingWS(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWSName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const ws = await res.json();
      mutateWS();
      setSelectedWS(ws.id);
      setNewWSName(""); setShowNewWS(false);
      success("Workspace created!");
    } catch (err: any) { toastError(err.message || "Failed"); }
    setCreatingWS(false);
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWS || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/workspaces/${selectedWS}/invite`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteLink(data.inviteUrl);
      setInviteEmail("");
      loadDetail(selectedWS);
      success("Invite created!");
    } catch (err: any) { toastError(err.message || "Failed to invite"); }
    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    if (!selectedWS) return;
    try {
      await fetch(`/api/workspaces/${selectedWS}/members/${memberId}`, { method: "DELETE" });
      loadDetail(selectedWS);
      success("Member removed");
    } catch { toastError("Failed"); }
  };

  const toggleTask = async (id: string, current: boolean) => {
    mutateWSTasks(wsTasks.map((t: any) => t.id === id ? { ...t, isCompleted: !current } : t), false);
    await fetch(`/api/todos/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !current }),
    });
    mutateTasks();
  };

  const addSharedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedWS) return;
    setAddingTask(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle, workspaceId: selectedWS,
          priority: "medium", deadline: new Date().toISOString(),
          isCompleted: false, reminderDays: 0, reminderSent: false,
        }),
      });
      if (!res.ok) throw new Error();
      setNewTaskTitle("");
      mutateWSTasks();
      mutateTasks();
      success("Task added to workspace");
    } catch { toastError("Failed to add task"); }
    setAddingTask(false);
  };

  const shareExistingTask = async () => {
    if (!sharingTaskId || !selectedWS) return;
    try {
      const res = await fetch(`/api/todos/${sharingTaskId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: selectedWS }),
      });
      if (!res.ok) throw new Error();
      mutateWSTasks(); mutateTasks();
      setSharingTaskId(""); setShowShareTask(false);
      success("Task shared to workspace!");
    } catch { toastError("Failed to share task"); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 w-full">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple to-indigo-600 p-5 md:p-6 mb-6 text-white shadow-lg shadow-violet-200">
        <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
            <h1 className="text-2xl font-extrabold">Collaborate</h1>
          </div>
          <p className="text-white/75 text-sm">Invite people to shared workspaces and work on tasks together.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Left: Workspace list */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-widest text-foreground/40">Workspaces</h2>
            <button onClick={() => setShowNewWS(v => !v)} className="w-7 h-7 rounded-lg bg-purple/10 text-purple hover:bg-purple/20 flex items-center justify-center transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNewWS && (
            <form onSubmit={createWorkspace} className="bg-white rounded-2xl border border-purple/20 p-3 space-y-2">
              <input autoFocus value={newWSName} onChange={e => setNewWSName(e.target.value)} placeholder="Workspace name" required
                className="w-full px-3 py-2 rounded-xl border border-foreground/10 text-sm focus:outline-none focus:border-purple" />
              <div className="flex gap-2">
                <button type="submit" disabled={creatingWS}
                  className="flex-1 py-2 bg-purple text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {creatingWS ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create"}
                </button>
                <button type="button" onClick={() => setShowNewWS(false)} className="px-3 py-2 text-foreground/40 hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {workspaces.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/40">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No workspaces yet.<br />Create one to start collaborating.
            </div>
          ) : (
            workspaces.map((ws) => (
              <button key={ws.id} onClick={() => setSelectedWS(ws.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                  selectedWS === ws.id
                    ? "bg-purple/5 border-purple/30 shadow-sm"
                    : "bg-white border-foreground/8 hover:border-foreground/20"
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{ws.name}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Workspace detail */}
        <div className="md:col-span-2 space-y-4">
          {!selectedWS ? (
            <div className="bg-white rounded-2xl border border-dashed border-foreground/15 p-10 text-center text-foreground/40">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-25" />
              <p className="font-medium">Select or create a workspace to get started.</p>
            </div>
          ) : detailLoading ? (
            <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-purple mx-auto" />
            </div>
          ) : wsDetail ? (
            <>
              {/* Members card */}
              <div className="bg-white rounded-2xl border border-foreground/8 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-foreground/6 flex items-center justify-between bg-gradient-to-r from-violet-50 to-white">
                  <h3 className="font-bold flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-violet-500" /> Members ({wsDetail.members.length})</h3>
                  {(wsDetail.myRole === "owner" || wsDetail.myRole === "editor") && (
                    <button onClick={() => setShowInvite(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple text-white rounded-xl text-xs font-bold hover:bg-purple/90 transition-colors">
                      <UserPlus className="w-3.5 h-3.5" /> Invite
                    </button>
                  )}
                </div>

                {showInvite && (
                  <div className="px-5 py-4 border-b border-foreground/6 bg-violet-50/40">
                    <form onSubmit={sendInvite} className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                            placeholder="colleague@email.com" required
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-foreground/15 text-sm focus:outline-none focus:border-purple" />
                        </div>
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value as "editor" | "viewer")}
                          className="px-3 py-2 rounded-xl border border-foreground/15 text-sm focus:outline-none focus:border-purple">
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button type="submit" disabled={inviting}
                          className="px-4 py-2 bg-purple text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-purple/90">
                          {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                        </button>
                      </div>
                      {inviteLink && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                          <p className="text-xs text-green-700 flex-1 font-mono truncate">{inviteLink}</p>
                          <CopyButton text={inviteLink} />
                        </div>
                      )}
                    </form>
                  </div>
                )}

                <div className="divide-y divide-foreground/5">
                  {wsDetail.members.map((m) => {
                    const RIcon = ROLE_ICON[m.role] || Edit3;
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-foreground/2 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {(m.displayName || m.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{m.displayName || m.email}</p>
                          {m.displayName && <p className="text-xs text-foreground/40 truncate">{m.email}</p>}
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_COLOR[m.role] || ROLE_COLOR.viewer}`}>
                          <RIcon className="w-3 h-3" /> {m.role}
                        </span>
                        {wsDetail.myRole === "owner" && m.role !== "owner" && (
                          <button onClick={() => removeMember(m.id)}
                            className="text-foreground/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shared Tasks */}
              <div className="bg-white rounded-2xl border border-foreground/8 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-foreground/6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                  <h3 className="font-bold flex items-center gap-2 text-sm"><CheckSquare2 className="w-4 h-4 text-blue-500" /> Shared Tasks ({wsTasks.length})</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowShareTask(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-xs font-semibold transition-colors">
                      <Settings2 className="w-3.5 h-3.5" /> Share existing
                    </button>
                  </div>
                </div>

                {showShareTask && (
                  <div className="px-5 py-3 border-b border-foreground/6 bg-blue-50/30">
                    <div className="flex gap-2">
                      <select value={sharingTaskId} onChange={e => setSharingTaskId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-foreground/15 text-sm focus:outline-none focus:border-blue-400">
                        <option value="">Select a personal task…</option>
                        {tasks.filter((t: any) => !t.workspaceId && !t.isCompleted).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                      <button onClick={shareExistingTask} disabled={!sharingTaskId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-blue-700">Share</button>
                    </div>
                  </div>
                )}

                <form onSubmit={addSharedTask} className="px-5 py-3 border-b border-foreground/6 flex gap-2">
                  <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Add a shared task…"
                    className="flex-1 px-4 py-2 rounded-xl border border-foreground/12 text-sm focus:outline-none focus:border-blue-400" />
                  <button type="submit" disabled={addingTask || !newTaskTitle.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                    {addingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </form>

                {wsTasks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-foreground/40">No shared tasks yet. Add one above or share an existing task.</div>
                ) : (
                  <div className="divide-y divide-foreground/5">
                    {wsTasks.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50/30 group transition-colors">
                        <button onClick={() => toggleTask(t.id, t.isCompleted)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${t.isCompleted ? "bg-blue-600 border-blue-600" : "border-foreground/25 hover:border-blue-400"}`}>
                          {t.isCompleted && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${t.isCompleted ? "line-through text-foreground/35" : ""}`}>{t.title}</p>
                          {t.createdByName && <p className="text-xs text-foreground/40 mt-0.5">Added by {t.createdByName}</p>}
                        </div>
                        <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.priority === "urgent" ? "bg-red-100 text-red-600" :
                          t.priority === "high" ? "bg-orange-100 text-orange-600" :
                          t.priority === "medium" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"
                        }`}>{t.priority}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
