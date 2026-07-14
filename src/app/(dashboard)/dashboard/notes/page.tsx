"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignLeft, CheckSquare2, ChevronLeft, Code2, FileText, GripVertical,
  Heading1, Heading2, Loader2, MessageSquareQuote, MoreHorizontal,
  MousePointer2, NotebookPen, Palette, Plus, Save, Search, StickyNote,
  Trash2, Type,
} from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";
import { useNotes, type Note } from "@/hooks/useNotes";
import { SkeletonNoteItem } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const AUTOSAVE_DELAY = 1200;
const CANVAS_SIZE = 2400;

type CanvasElement = {
  id: string;
  type: "sticky" | "text" | "task";
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: "yellow" | "pink" | "blue" | "mint" | "lavender";
};

const canvasColors: Record<CanvasElement["color"], string> = {
  yellow: "#fff3a6",
  pink: "#ffd8e8",
  blue: "#cfe9ff",
  mint: "#cef7df",
  lavender: "#e6ddff",
};

function emptyCanvas(): CanvasElement[] {
  return [
    { id: crypto.randomUUID(), type: "sticky", x: 260, y: 220, width: 260, height: 180, text: "Start with an idea…", color: "yellow" },
    { id: crypto.randomUUID(), type: "text", x: 610, y: 300, width: 300, height: 170, text: "Use the toolbar to add cards, then drag them anywhere.", color: "blue" },
  ];
}

function readCanvas(note: Note): CanvasElement[] {
  try {
    const parsed = JSON.parse(note.whiteboardData || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed : emptyCanvas();
  } catch {
    return emptyCanvas();
  }
}

function notePreview(note: Note) {
  if (note.type === "whiteboard") return "Canvas";
  return note.content.replace(/[#>*_`\-\[\]]/g, " ").replace(/\s+/g, " ").trim() || "Empty note";
}

export default function NotesPage() {
  const { notes, isLoading, mutate } = useNotes();
  const { success, error: toastError } = useToast();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [newNoteMenu, setNewNoteMenu] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canvasState, setCanvasState] = useState<{ noteId: string; elements: CanvasElement[] } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
  }, []);

  // A selected draft wins over the latest SWR list; otherwise open the newest note.
  const currentNote = activeNote ?? notes[0] ?? null;
  const canvasElements = canvasState?.noteId === currentNote?.id
    ? canvasState.elements
    : currentNote?.type === "whiteboard" ? readCanvas(currentNote) : [];

  const saveNote = async (note: Note) => {
    if (note.id.startsWith("tmp-")) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          type: note.type,
          whiteboardData: note.whiteboardData,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      const saved = await response.json();
      mutate(notes.map((item) => item.id === note.id ? saved : item), false);
      setActiveNote((current) => current?.id === note.id ? saved : current);
      setIsDirty(false);
    } catch {
      toastError("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleAutoSave = (note: Note) => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    setIsDirty(true);
    autoSaveRef.current = setTimeout(() => saveNote(note), AUTOSAVE_DELAY);
  };

  const updateActiveNote = (patch: Partial<Note>, save = true) => {
    if (!currentNote) return;
    const updated = { ...currentNote, ...patch };
    setActiveNote(updated);
    if (save) scheduleAutoSave(updated);
  };

  const createNote = async (type: Note["type"]) => {
    setNewNoteMenu(false);
    const isCanvas = type === "whiteboard";
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: isCanvas ? "Untitled canvas" : "Untitled note",
          content: isCanvas ? "" : "# New note\n\nStart writing…",
          type,
          whiteboardData: isCanvas ? JSON.stringify(emptyCanvas()) : undefined,
        }),
      });
      if (!response.ok) throw new Error("Create failed");
      const note = await response.json();
      mutate([note, ...notes], false);
      setActiveNote(note);
      success(isCanvas ? "Canvas created" : "Note created");
    } catch {
      toastError("Failed to create note");
    }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const title = String(result.title || "Voice note").trim();
    const content = String(result.content || "").trim();
    try {
      const response = await fetch("/api/notes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type: "text" }),
      });
      if (!response.ok) throw new Error("Create failed");
      const note = await response.json();
      mutate([note, ...notes], false);
      setActiveNote(note);
      success("Voice note created");
    } catch { toastError("Failed to create voice note"); }
  };

  const handleDeleteNote = async (id: string) => {
    const previous = notes;
    mutate(previous.filter((note) => note.id !== id), false);
    if (currentNote?.id === id) setActiveNote(previous.find((note) => note.id !== id) ?? null);
    try {
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      success("Note deleted");
    } catch {
      toastError("Failed to delete note");
      mutate();
    }
  };

  const insertStructure = (before: string, after = "") => {
    if (!currentNote || currentNote.type !== "text") return;
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? currentNote.content.length;
    const end = textarea?.selectionEnd ?? start;
    const selected = currentNote.content.slice(start, end) || "Write here";
    const content = `${currentNote.content.slice(0, start)}${before}${selected}${after}${currentNote.content.slice(end)}`;
    updateActiveNote({ content });
    requestAnimationFrame(() => textarea?.focus());
  };

  const commitCanvas = (elements: CanvasElement[]) => {
    if (currentNote) setCanvasState({ noteId: currentNote.id, elements });
    updateActiveNote({ whiteboardData: JSON.stringify(elements) });
  };

  const addCanvasElement = (type: CanvasElement["type"]) => {
    if (!canvasViewportRef.current) return;
    const viewport = canvasViewportRef.current;
    const element: CanvasElement = {
      id: crypto.randomUUID(), type,
      x: (viewport.scrollLeft + viewport.clientWidth / 2) / zoom - 130,
      y: (viewport.scrollTop + viewport.clientHeight / 2) / zoom - 90,
      width: type === "text" ? 310 : 260,
      height: type === "task" ? 150 : 180,
      text: type === "sticky" ? "A new thought…" : type === "task" ? "[ ] A next step" : "Add context, decisions, or references…",
      color: type === "sticky" ? "yellow" : type === "task" ? "mint" : "blue",
    };
    commitCanvas([...canvasElements, element]);
  };

  const updateCanvasElement = (id: string, patch: Partial<CanvasElement>, persist = true) => {
    const elements = canvasElements.map((element) => element.id === id ? { ...element, ...patch } : element);
    if (currentNote) setCanvasState({ noteId: currentNote.id, elements });
    if (persist) updateActiveNote({ whiteboardData: JSON.stringify(elements) });
  };

  const onCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !canvasViewportRef.current) return;
    const viewport = canvasViewportRef.current.getBoundingClientRect();
    updateCanvasElement(dragging.id, {
      x: Math.max(0, (event.clientX - viewport.left + canvasViewportRef.current.scrollLeft) / zoom - dragging.offsetX),
      y: Math.max(0, (event.clientY - viewport.top + canvasViewportRef.current.scrollTop) / zoom - dragging.offsetY),
    }, false);
  };

  const onCanvasPointerUp = () => {
    if (!dragging) return;
    setDragging(null);
    if (currentNote) updateActiveNote({ whiteboardData: JSON.stringify(canvasElements) });
  };

  const filteredNotes = notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeCanvas = currentNote?.type === "whiteboard";

  return (
    <div className="h-[calc(100vh-5rem)] w-full px-3 py-3 md:px-5 md:py-5 flex flex-col gap-3 overflow-hidden">
      <header className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setShowLibrary((visible) => !visible)} className="p-2 rounded-lg border border-foreground/10 hover:bg-foreground/5" title="Toggle notes library">
            <ChevronLeft className={`w-4 h-4 transition-transform ${showLibrary ? "" : "rotate-180"}`} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/40"><NotebookPen className="w-3.5 h-3.5" /> Workspace</div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">Notes & canvases</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <VoiceInput schema={VOICE_SCHEMAS.note} onResult={handleVoiceResult} label="Creating note…" />
          <div className="relative">
            <button onClick={() => setNewNoteMenu((open) => !open)} className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background hover:bg-purple hover:text-white transition-colors">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New</span>
            </button>
            {newNoteMenu && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-52 rounded-xl border border-foreground/10 bg-white p-1.5 shadow-xl">
                <button onClick={() => createNote("text")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-foreground/5"><FileText className="w-4 h-4 text-purple" /><span><b>Structured note</b><small className="block text-foreground/45">Text, lists & blocks</small></span></button>
                <button onClick={() => createNote("whiteboard")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-foreground/5"><MousePointer2 className="w-4 h-4 text-yellow-600" /><span><b>Infinite canvas</b><small className="block text-foreground/45">Arrange visual thoughts</small></span></button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3">
        {showLibrary && (
          <aside className="w-72 shrink-0 rounded-xl border border-foreground/10 bg-white p-3 flex flex-col shadow-sm">
            <div className="relative mb-3"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search notes" className="w-full rounded-lg bg-foreground/[.045] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-purple/30" /></div>
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-foreground/45"><span>{filteredNotes.length} notes</span><span>Updated</span></div>
            {isLoading ? <div className="space-y-3">{[1, 2, 3, 4].map((item) => <SkeletonNoteItem key={item} />)}</div> : (
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                {filteredNotes.map((note) => <button key={note.id} onClick={() => setActiveNote(note)} className={`group relative w-full rounded-lg border p-3 text-left transition-all ${currentNote?.id === note.id ? "border-purple/35 bg-purple/5 shadow-sm" : "border-transparent hover:bg-foreground/[.04]"}`}>
                  <div className="flex items-center gap-2 pr-5"><span className={`grid h-6 w-6 place-items-center rounded-md ${note.type === "whiteboard" ? "bg-yellow-100 text-yellow-700" : "bg-purple/10 text-purple"}`}>{note.type === "whiteboard" ? <MousePointer2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}</span><p className="truncate text-sm font-semibold">{note.title || "Untitled"}</p></div>
                  <p className="mt-1.5 truncate text-xs text-foreground/45">{notePreview(note)}</p>
                  <p className="mt-2 text-[11px] text-foreground/35">{new Date(note.updatedAt).toLocaleDateString()}</p>
                  <span role="button" aria-label="Delete note" onClick={(event) => { event.stopPropagation(); handleDeleteNote(note.id); }} className="absolute right-2 top-3 rounded p-1 text-foreground/25 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></span>
                </button>)}
                {!filteredNotes.length && <div className="px-3 py-10 text-center text-sm text-foreground/40">No notes found.</div>}
              </div>
            )}
          </aside>
        )}

        {!currentNote ? <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-foreground/15 bg-white"><div className="text-center text-foreground/40"><NotebookPen className="mx-auto mb-3 h-10 w-10" /><p className="font-semibold">Choose a note or create a fresh canvas.</p></div></div> : activeCanvas ? (
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-foreground/10 bg-white shadow-sm">
            <EditorHeader note={currentNote} isSaving={isSaving} isDirty={isDirty} onTitle={(title) => updateActiveNote({ title })} onSave={() => saveNote(currentNote)} />
            <div className="flex items-center justify-between gap-3 border-y border-foreground/8 bg-white px-3 py-2 shrink-0">
              <div className="flex items-center gap-1"><CanvasButton icon={<StickyNote />} label="Sticky" onClick={() => addCanvasElement("sticky")} /><CanvasButton icon={<Type />} label="Text" onClick={() => addCanvasElement("text")} /><CanvasButton icon={<CheckSquare2 />} label="Task" onClick={() => addCanvasElement("task")} /></div>
              <div className="flex items-center gap-2 text-xs text-foreground/50"><span className="hidden sm:inline">Drag cards · Scroll to explore</span><button onClick={() => setZoom((value) => Math.max(.6, Number((value - .1).toFixed(1))))} className="rounded border border-foreground/10 px-2 py-1">−</button><span className="w-8 text-center">{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.4, Number((value + .1).toFixed(1))))} className="rounded border border-foreground/10 px-2 py-1">+</button></div>
            </div>
            <div ref={canvasViewportRef} onPointerMove={onCanvasPointerMove} onPointerUp={onCanvasPointerUp} onPointerLeave={onCanvasPointerUp} className="min-h-0 flex-1 overflow-auto bg-[#fbfaf7] touch-none">
              <div className="relative" style={{ width: CANVAS_SIZE * zoom, height: CANVAS_SIZE * zoom, backgroundImage: "radial-gradient(#d8d4c8 1px, transparent 1px)", backgroundSize: `${20 * zoom}px ${20 * zoom}px` }}>
                {canvasElements.map((element) => <CanvasCard key={element.id} element={element} zoom={zoom} dragging={dragging?.id === element.id} onPointerDown={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setDragging({ id: element.id, offsetX: (event.clientX - rect.left) / zoom, offsetY: (event.clientY - rect.top) / zoom }); }} onChange={(text) => updateCanvasElement(element.id, { text })} onColor={(color) => updateCanvasElement(element.id, { color })} onDelete={() => commitCanvas(canvasElements.filter((item) => item.id !== element.id))} />)}
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-foreground/10 bg-white shadow-sm">
            <EditorHeader note={currentNote} isSaving={isSaving} isDirty={isDirty} onTitle={(title) => updateActiveNote({ title })} onSave={() => saveNote(currentNote)} />
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-y border-foreground/8 bg-[#fcfbff] px-3 py-2"><CanvasButton icon={<Heading1 />} label="Heading" onClick={() => insertStructure("# ")} /><CanvasButton icon={<Heading2 />} label="Section" onClick={() => insertStructure("## ")} /><CanvasButton icon={<AlignLeft />} label="List" onClick={() => insertStructure("- ")} /><CanvasButton icon={<CheckSquare2 />} label="To-do" onClick={() => insertStructure("- [ ] ")} /><CanvasButton icon={<MessageSquareQuote />} label="Quote" onClick={() => insertStructure("> ")} /><CanvasButton icon={<Code2 />} label="Code" onClick={() => insertStructure("\n```\n", "\n```\n")} /><CanvasButton icon={<MoreHorizontal />} label="Divider" onClick={() => insertStructure("\n---\n")} /></div>
            <div className="flex min-h-0 flex-1"><textarea ref={contentRef} value={currentNote.content} onChange={(event) => updateActiveNote({ content: event.target.value })} className="min-h-0 flex-1 resize-none bg-white px-5 py-6 font-mono text-sm leading-7 text-foreground/85 outline-none md:px-8 md:py-8" placeholder="Start writing…" spellCheck /><aside className="hidden w-52 shrink-0 border-l border-foreground/8 bg-[#fcfbff] p-4 lg:block"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/40">Block tools</p><p className="text-xs leading-5 text-foreground/55">Use headings to structure ideas, checkboxes for next steps, and code blocks for technical details.</p><div className="mt-6 rounded-lg border border-purple/15 bg-purple/5 p-3 text-xs text-purple"><b>Tip</b><br />Switch to a canvas when a note needs spatial thinking.</div><p className="mt-6 text-xs text-foreground/35">{currentNote.content.length.toLocaleString()} characters</p></aside></div>
          </section>
        )}
      </div>
    </div>
  );
}

function EditorHeader({ note, isSaving, isDirty, onTitle, onSave }: { note: Note; isSaving: boolean; isDirty: boolean; onTitle: (title: string) => void; onSave: () => void }) {
  return <div className="flex items-center gap-3 px-4 py-3 md:px-5 shrink-0"><span className={`grid h-8 w-8 place-items-center rounded-lg ${note.type === "whiteboard" ? "bg-yellow-100 text-yellow-700" : "bg-purple/10 text-purple"}`}>{note.type === "whiteboard" ? <MousePointer2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}</span><input value={note.title} onChange={(event) => onTitle(event.target.value)} placeholder="Untitled" className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none md:text-xl" /><div className="flex shrink-0 items-center gap-2">{isSaving ? <Loader2 className="h-4 w-4 animate-spin text-purple" /> : isDirty ? <button onClick={onSave} className="flex items-center gap-1 rounded-md bg-purple px-2.5 py-1.5 text-xs font-semibold text-white"><Save className="w-3.5 h-3.5" /> Save</button> : <span className="text-xs text-foreground/40">Saved</span>}</div></div>;
}

function CanvasButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} title={label} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground/65 hover:bg-foreground/[.06] hover:text-foreground">{icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}<span className="hidden sm:inline">{label}</span></button>;
}

function CanvasCard({ element, zoom, dragging, onPointerDown, onChange, onColor, onDelete }: { element: CanvasElement; zoom: number; dragging: boolean; onPointerDown: (event: React.PointerEvent<HTMLElement>) => void; onChange: (text: string) => void; onColor: (color: CanvasElement["color"]) => void; onDelete: () => void }) {
  return <div onPointerDown={onPointerDown} className={`absolute rounded-xl border border-black/5 p-3 shadow-[0_8px_20px_rgba(50,45,25,.12)] ${dragging ? "z-20 cursor-grabbing shadow-xl" : "z-10 cursor-grab"}`} style={{ left: element.x * zoom, top: element.y * zoom, width: element.width * zoom, height: element.height * zoom, background: canvasColors[element.color] }}>
    <div className="mb-2 flex items-center justify-between" onPointerDown={(event) => event.stopPropagation()}><button onPointerDown={onPointerDown} className="cursor-grab rounded p-0.5 text-black/30 hover:bg-black/10"><GripVertical className="h-4 w-4" /></button><div className="flex items-center gap-1"><div className="group relative"><button className="rounded p-1 text-black/35 hover:bg-black/10"><Palette className="h-3.5 w-3.5" /></button><div className="absolute right-0 top-6 hidden gap-1 rounded-md bg-white p-1 shadow-lg group-hover:flex">{(Object.keys(canvasColors) as CanvasElement["color"][]).map((color) => <button key={color} onClick={() => onColor(color)} className="h-4 w-4 rounded-full border border-black/10" style={{ background: canvasColors[color] }} />)}</div></div><button onClick={onDelete} className="rounded p-1 text-black/30 hover:bg-black/10 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div></div>
    <textarea onPointerDown={(event) => event.stopPropagation()} value={element.text} onChange={(event) => onChange(event.target.value)} className="h-[calc(100%-2rem)] w-full resize-none bg-transparent text-sm leading-5 text-black/75 outline-none" placeholder="Write…" />
  </div>;
}
