"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, Clock } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";
import { useDevProject } from "@/hooks/useDevProject";

type TempKey = {
  id: string;
  name: string;
  value: string;
  expiresAt: string;
};

export default function VaultPage() {
  const { project, loading: projectLoading } = useDevProject();
  const [keys, setKeys] = useState<TempKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(new Date().getTime());

  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [expiresIn, setExpiresIn] = useState("1h");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchKeys = async () => {
    if (!project?.id) return;
    try {
      const res = await fetch(`/api/temp-keys?projectId=${project.id}`);
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project?.id) fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id || !newName || !newValue) return;

    let ms = 60 * 60 * 1000; // default 1h
    if (expiresIn === "24h") ms = 24 * 60 * 60 * 1000;
    if (expiresIn === "7d") ms = 7 * 24 * 60 * 60 * 1000;
    
    const expiresAt = new Date(Date.now() + ms).toISOString();

    try {
      const res = await fetch("/api/temp-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          name: newName,
          value: newValue,
          expiresAt,
        }),
      });

      if (res.ok) {
        setNewName("");
        setNewValue("");
        setShowModal(false);
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/temp-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied({ ...copied, [id]: true });
    setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys({ ...visibleKeys, [id]: !visibleKeys[id] });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m ${secs}s left`;
  };

  if (projectLoading || loading) {
    return (
      <DevPageShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </DevPageShell>
    );
  }

  // Filter out expired keys just in case TTL index hasn't kicked in yet
  const activeKeys = keys.filter(k => new Date(k.expiresAt).getTime() > now);

  return (
    <DevPageShell>
      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Key className="w-8 h-8 text-purple" />
              Vault
            </h1>
            <p className="text-foreground/60 text-lg">
              Securely store temporary tokens, API keys, and credentials.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-purple text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-dark transition-colors whitespace-nowrap shadow-md shadow-purple/20"
          >
            <Plus className="w-5 h-5" />
            Store New Key
          </button>
        </div>

        {activeKeys.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-foreground/10 border-dashed">
            <Key className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Your vault is empty</h3>
            <p className="text-foreground/50 mb-6">Store temporary tokens and they will self-destruct when they expire.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-purple font-medium hover:underline"
            >
              Add your first key
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeKeys.map((key) => (
              <div key={key.id} className="bg-white p-5 rounded-xl border-2 border-foreground/10 shadow-sm relative group transition-all hover:border-purple/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="pr-8">
                    <h3 className="font-bold text-lg leading-tight truncate">{key.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full mt-2 w-fit border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      {getTimeRemaining(key.expiresAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors absolute top-3 right-3"
                    title="Delete Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative mt-2">
                  <div className="bg-[#fcfbf9] border border-foreground/10 rounded-lg p-3 pr-20 font-mono text-sm break-all">
                    {visibleKeys[key.id] ? key.value : "•".repeat(Math.min(key.value.length, 32))}
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={() => toggleVisibility(key.id)}
                      className="p-1.5 text-foreground/50 hover:text-foreground hover:bg-white rounded transition-colors"
                      title={visibleKeys[key.id] ? "Hide value" : "Reveal value"}
                    >
                      {visibleKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <div className="w-px h-4 bg-foreground/10 mx-0.5"></div>
                    <button
                      onClick={() => handleCopy(key.id, key.value)}
                      className="p-1.5 text-foreground/50 hover:text-purple hover:bg-white rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied[key.id] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border-2 border-foreground/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-foreground/5 shrink-0 bg-foreground/[0.02]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-purple" />
                Store Temporary Key
              </h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-5 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground/70 mb-1.5 uppercase tracking-wider text-[11px]">
                    Name / Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Github Access Token, Staging DB URI"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#fcfbf9] border-2 border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-purple/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-foreground/70 mb-1.5 uppercase tracking-wider text-[11px]">
                    Secret Value
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Paste the token, key, or URL here..."
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full bg-[#fcfbf9] border-2 border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-purple/50 transition-colors resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground/70 mb-1.5 uppercase tracking-wider text-[11px]">
                    Self-Destruct In
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full bg-[#fcfbf9] border-2 border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-purple/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-foreground/60 hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || !newValue.trim()}
                  className="bg-purple text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-dark transition-colors shadow-md shadow-purple/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DevPageShell>
  );
}
