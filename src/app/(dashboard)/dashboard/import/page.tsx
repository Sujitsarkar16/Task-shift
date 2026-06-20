"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2, Download } from "lucide-react";

type ImportSource = "todoist" | "ticktick" | "generic-tasks" | "generic-subscriptions";

const SOURCE_META: Record<ImportSource, { label: string; hint: string; cols: string }> = {
  todoist: {
    label: "Todoist",
    hint: "Export from Todoist: Settings → Backups → Download CSV",
    cols: "TYPE, CONTENT, PRIORITY, INDENT, AUTHOR, DATE_ADDED, DATE_COMPLETED, SECTION_NAME, ASSIGNED_TO, ASSIGNEE_ID",
  },
  ticktick: {
    label: "TickTick",
    hint: "Export from TickTick: Settings → Data Backup → Export as CSV",
    cols: "Folder Name, List Name, Title, Status, Content, Is Check list, Start Date, Due Date, Reminder, Repeat, Priority, Tags, Item Type, Timezone, Created Time, Completed Time",
  },
  "generic-tasks": {
    label: "Generic Tasks CSV",
    hint: "Use columns: title (required), priority, deadline (YYYY-MM-DD), category, notes",
    cols: "title, priority, deadline, category, notes",
  },
  "generic-subscriptions": {
    label: "Generic Subscriptions CSV",
    hint: "Use columns: name (required), amount, billingCycle (monthly/yearly/weekly), renewalDate (YYYY-MM-DD), category",
    cols: "name, amount, billingCycle, renewalDate, category",
  },
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    // Basic CSV parse (handles quoted fields with commas)
    const values: string[] = [];
    let inQuotes = false;
    let current = "";
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

function mapTodoistRow(row: Record<string, string>) {
  if (row.TYPE !== "task") return null;
  const priority = ["4", "3"].includes(row.PRIORITY) ? "high" : row.PRIORITY === "2" ? "medium" : "low";
  return { title: row.CONTENT, priority, deadline: row.DATE_ADDED?.split(" ")[0] || new Date().toISOString().split("T")[0], isCompleted: !!row.DATE_COMPLETED, reminderDays: 0, reminderSent: false };
}

function mapTickTickRow(row: Record<string, string>) {
  if (!row.Title?.trim()) return null;
  const priority = row.Priority === "High" ? "high" : row.Priority === "Medium" ? "medium" : "low";
  const deadline = row["Due Date"]?.split(" ")[0] || new Date().toISOString().split("T")[0];
  return { title: row.Title, priority, deadline, category: row["List Name"] || row["Folder Name"] || "", isCompleted: row.Status === "2", reminderDays: 0, reminderSent: false };
}

function mapGenericTaskRow(row: Record<string, string>) {
  if (!row.title?.trim()) return null;
  return {
    title: row.title,
    priority: ["urgent", "high", "medium", "low"].includes(row.priority?.toLowerCase()) ? row.priority.toLowerCase() : "medium",
    deadline: row.deadline || new Date().toISOString().split("T")[0],
    category: row.category || "",
    isCompleted: false,
    reminderDays: 0,
    reminderSent: false,
  };
}

function mapGenericSubRow(row: Record<string, string>) {
  if (!row.name?.trim()) return null;
  return {
    name: row.name,
    amount: parseFloat(row.amount) || 0,
    billingCycle: ["weekly", "monthly", "quarterly", "yearly"].includes(row.billingCycle?.toLowerCase()) ? row.billingCycle.toLowerCase() : "monthly",
    renewalDate: row.renewalDate || new Date().toISOString().split("T")[0],
    category: row.category || "other",
    status: "active",
    currency: "USD",
  };
}

export default function ImportPage() {
  const [source, setSource] = useState<ImportSource>("generic-tasks");
  const [preview, setPreview] = useState<any[]>([]);
  const [raw, setRaw] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState({ success: 0, failed: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const isTaskSource = source !== "generic-subscriptions";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      const mapped = rows.map((r) => {
        if (source === "todoist") return mapTodoistRow(r);
        if (source === "ticktick") return mapTickTickRow(r);
        if (source === "generic-tasks") return mapGenericTaskRow(r);
        if (source === "generic-subscriptions") return mapGenericSubRow(r);
        return null;
      }).filter(Boolean);
      setRaw(mapped as any[]);
      setPreview((mapped as any[]).slice(0, 10));
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    const endpoint = isTaskSource ? "/api/todos" : "/api/subscriptions";
    let success = 0;
    let failed = 0;

    for (const item of raw) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setResult({ success, failed });
    setStep("done");
    setImporting(false);
  };

  const reset = () => {
    setStep("upload");
    setPreview([]);
    setRaw([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Import</h1>
        <p className="text-foreground/60 text-lg">Migrate your data from other tools in seconds.</p>
      </div>

      {step === "done" ? (
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-10 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Import complete!</h2>
          <p className="text-foreground/60 mb-2">{result.success} item{result.success !== 1 ? "s" : ""} imported successfully.</p>
          {result.failed > 0 && <p className="text-red-500 text-sm mb-6">{result.failed} item{result.failed !== 1 ? "s" : ""} failed.</p>}
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="px-6 py-2.5 bg-foreground text-background rounded-xl font-semibold hover:bg-purple hover:text-white transition-colors">
              Import more
            </button>
          </div>
        </div>
      ) : step === "preview" ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Preview ({raw.length} rows)</h2>
              <button onClick={reset} className="text-sm text-foreground/40 hover:text-foreground">Cancel</button>
            </div>
            <p className="text-sm text-foreground/50 mb-4">Showing first 10 rows. All {raw.length} will be imported.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground/10">
                    {preview[0] && Object.keys(preview[0]).slice(0, 5).map((k) => (
                      <th key={k} className="text-left p-2 text-xs font-bold uppercase tracking-wider text-foreground/40">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-foreground/5 hover:bg-foreground/2">
                      {Object.values(row).slice(0, 5).map((val: any, j) => (
                        <td key={j} className="p-2 truncate max-w-[180px]">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple text-white rounded-xl font-bold hover:bg-purple/90 disabled:opacity-50 transition-colors"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? `Importing ${raw.length} items…` : `Import ${raw.length} ${isTaskSource ? "task" : "subscription"}${raw.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Source selector */}
          <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
            <h2 className="font-bold mb-4">1. Choose your source</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(SOURCE_META) as ImportSource[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    source === s ? "border-purple bg-purple/5" : "border-foreground/10 hover:border-foreground/30"
                  }`}
                >
                  <p className="font-semibold text-sm">{SOURCE_META[s].label}</p>
                  <p className="text-xs text-foreground/40 mt-1 leading-relaxed">{SOURCE_META[s].hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Expected format */}
          <div className="bg-foreground/3 rounded-xl border-2 border-foreground/10 p-5">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-foreground/50 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold mb-1">Expected columns</p>
                <p className="text-xs font-mono text-foreground/50 leading-relaxed">{SOURCE_META[source].cols}</p>
              </div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white rounded-xl border-2 border-dashed border-foreground/20 p-10 text-center">
            <Upload className="w-10 h-10 mx-auto mb-3 text-foreground/30" />
            <p className="font-semibold mb-1">Drop your CSV here or click to upload</p>
            <p className="text-sm text-foreground/40 mb-6">Only .csv files accepted</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-xl font-semibold cursor-pointer hover:bg-purple hover:text-white transition-colors"
            >
              <Upload className="w-4 h-4" /> Choose file
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
