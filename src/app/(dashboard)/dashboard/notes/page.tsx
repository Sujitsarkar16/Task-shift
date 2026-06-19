"use client";

import { useState, useEffect } from "react";
import { NotebookPen, Plus, Search, Trash2, Save } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0 && !activeNote) {
          setActiveNote(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Note",
          content: "",
          type: "text"
        })
      });
      if (res.ok) {
        const newNote = await res.json();
        setActiveNote(newNote);
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const title = String(result.title || "Voice Note").trim();
    const content = String(result.content || "").trim();

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          type: "text",
        }),
      });
      if (res.ok) {
        const newNote = await res.json();
        setActiveNote(newNote);
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNote = async () => {
    if (!activeNote) return;
    try {
      await fetch(`/api/notes/${activeNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeNote.title,
          content: activeNote.content
        })
      });
      fetchNotes();
      alert("Note saved!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (activeNote?.id === id) {
        setActiveNote(null);
      }
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full h-[calc(100vh-theme(spacing.12))] flex flex-col">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Notes</h1>
            <p className="text-foreground/60 text-lg">Capture your thoughts.</p>
          </div>
          <div className="flex items-center gap-3">
            <VoiceInput
              schema={VOICE_SCHEMAS.note}
              onResult={handleVoiceResult}
              label="Creating note…"
            />
            <button 
              onClick={handleCreateNote}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Notes List */}
          <div className="w-80 flex flex-col bg-white rounded-xl border-2 border-foreground/10 p-4">
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-foreground/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple/50" 
              />
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm font-bold text-foreground/50">Loading...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-4 text-center text-sm font-bold text-foreground/50">No notes found.</div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {filteredNotes.map((note) => (
                  <div 
                    key={note.id} 
                    onClick={() => setActiveNote(note)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${activeNote?.id === note.id ? 'bg-[#fff9db] border-[#ffe066]' : 'bg-white border-foreground/10'} group relative`}
                  >
                    <h3 className="font-bold text-sm mb-2 pr-6 truncate">{note.title || "Untitled"}</h3>
                    <p className="text-xs text-foreground/50 font-mono truncate">{new Date(note.updatedAt).toLocaleDateString()}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }} 
                      className="absolute top-4 right-4 text-foreground/30 hover:text-light-red opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor Area */}
          {activeNote ? (
            <div className="flex-1 bg-[#fff9db] rounded-xl border-2 border-[#ffe066] p-8 flex flex-col relative">
              <div className="flex justify-between items-start mb-6">
                <input 
                  type="text" 
                  value={activeNote.title}
                  onChange={(e) => setActiveNote({...activeNote, title: e.target.value})}
                  className="flex-1 bg-transparent text-3xl font-bold outline-none text-foreground placeholder:text-foreground/30 mr-4" 
                  placeholder="Note Title"
                />
                <button 
                  onClick={handleUpdateNote}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffe066] text-[#b37400] hover:bg-[#f59f00] hover:text-white rounded-lg font-bold transition-colors"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
              <textarea 
                value={activeNote.content}
                onChange={(e) => setActiveNote({...activeNote, content: e.target.value})}
                className="flex-1 bg-transparent outline-none resize-none text-foreground/80 leading-relaxed font-mono text-sm"
                placeholder="Start typing..."
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border-2 border-foreground/10 p-8">
              <div className="text-center text-foreground/40">
                <NotebookPen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold">Select a note or create a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
