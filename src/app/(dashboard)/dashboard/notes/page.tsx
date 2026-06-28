"use client";

import { useEffect, useRef, useState } from "react";
import { NotebookPen, Plus, Search, Trash2, Save, Loader2 } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";
import { useNotes, type Note } from "@/hooks/useNotes";
import { SkeletonNoteItem } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const AUTOSAVE_DELAY = 1500; // ms

export default function NotesPage() {
  const { notes, isLoading, mutate } = useNotes();
  const { success, error: toastError } = useToast();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When notes load and none is selected yet, pick the first
  useEffect(() => {
    if (!activeNote && notes.length > 0) setActiveNote(notes[0]);
  }, [notes, activeNote]);

  // Auto-save after typing stops
  const scheduleAutoSave = (note: Note) => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    setIsDirty(true);
    autoSaveRef.current = setTimeout(() => saveNote(note), AUTOSAVE_DELAY);
  };

  const saveNote = async (note: Note) => {
    if (!note.id.startsWith("tmp-")) {
      setIsSaving(true);
      try {
        await fetch(`/api/notes/${note.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: note.title, content: note.content }),
        });
        mutate(notes.map((n) => n.id === note.id ? note : n), false);
        setIsDirty(false);
      } catch { toastError("Failed to save note"); }
      setIsSaving(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Note", content: "", type: "text" }),
      });
      if (res.ok) {
        const newNote = await res.json();
        mutate([newNote, ...notes], false);
        setActiveNote(newNote);
        success("Note created");
      }
    } catch { toastError("Failed to create note"); }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const title = String(result.title || "Voice Note").trim();
    const content = String(result.content || "").trim();
    try {
      const res = await fetch("/api/notes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type: "text" }),
      });
      if (res.ok) {
        const newNote = await res.json();
        mutate([newNote, ...notes], false);
        setActiveNote(newNote);
        success("Note created via voice");
      }
    } catch { toastError("Failed to create note"); }
  };

  const handleDeleteNote = async (id: string) => {
    mutate(notes.filter((n) => n.id !== id), false);
    if (activeNote?.id === id) setActiveNote(notes.find((n) => n.id !== id) ?? null);
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      success("Note deleted");
    } catch { toastError("Failed to delete note"); mutate(); }
  };

  const updateActiveNote = (field: "title" | "content", value: string) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    scheduleAutoSave(updated);
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex justify-between items-end mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Notes</h1>
          <p className="text-foreground/60">Capture your thoughts.</p>
        </div>
        <div className="flex items-center gap-3">
          <VoiceInput schema={VOICE_SCHEMAS.note} onResult={handleVoiceResult} label="Creating note…" />
          <button onClick={handleCreateNote}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 md:gap-6 min-h-0">
        {/* Notes List */}
        <div className="w-64 md:w-80 flex flex-col bg-white rounded-xl border-2 border-foreground/10 p-3 md:p-4 shrink-0">
          <div className="relative mb-3 md:mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input type="text" placeholder="Search notes..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-foreground/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple/50" />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <SkeletonNoteItem key={i} />)}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-sm font-bold text-foreground/50">No notes found.</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredNotes.map((note) => (
                <div key={note.id} onClick={() => setActiveNote(note)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    activeNote?.id === note.id ? "bg-[#fff9db] border-[#ffe066]" : "bg-white border-foreground/10 hover:border-foreground/30"
                  } group relative`}>
                  <h3 className="font-bold text-sm mb-1 pr-6 truncate">{note.title || "Untitled"}</h3>
                  <p className="text-xs text-foreground/40 font-mono">{new Date(note.updatedAt).toLocaleDateString()}</p>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    className="absolute top-3 right-3 text-foreground/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        {activeNote ? (
          <div className="flex-1 bg-[#fff9db] rounded-xl border-2 border-[#ffe066] p-5 md:p-8 flex flex-col">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <input type="text" value={activeNote.title}
                onChange={(e) => updateActiveNote("title", e.target.value)}
                className="flex-1 bg-transparent text-2xl md:text-3xl font-bold outline-none text-foreground placeholder:text-foreground/30 mr-3"
                placeholder="Note Title" />
              <div className="flex items-center gap-2 shrink-0">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin text-[#b37400]" />}
                {isDirty && !isSaving && (
                  <button onClick={() => saveNote(activeNote)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffe066] text-[#b37400] hover:bg-[#f59f00] hover:text-white rounded-lg font-bold text-sm transition-colors">
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                )}
                {!isDirty && !isSaving && (
                  <span className="text-xs text-[#b37400]/60 font-medium">Saved</span>
                )}
              </div>
            </div>
            <textarea value={activeNote.content}
              onChange={(e) => updateActiveNote("content", e.target.value)}
              className="flex-1 bg-transparent outline-none resize-none text-foreground/80 leading-relaxed font-mono text-sm"
              placeholder="Start typing…" />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-foreground/10 p-8">
            <div className="text-center text-foreground/40">
              <NotebookPen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-bold">Select a note or create a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
