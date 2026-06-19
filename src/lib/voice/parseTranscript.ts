type ParseSchema = Record<string, unknown>;

export type VoiceSchema = { properties?: ParseSchema } | ParseSchema;

const PRIORITY_WORDS: Record<string, "low" | "medium" | "high" | "urgent"> = {
  urgent: "urgent",
  asap: "urgent",
  critical: "urgent",
  emergency: "urgent",
  high: "high",
  important: "high",
  medium: "medium",
  normal: "medium",
  low: "low",
  minor: "low",
};

const BILLING_CYCLE_WORDS: Record<string, "weekly" | "monthly" | "quarterly" | "yearly"> = {
  weekly: "weekly",
  month: "monthly",
  monthly: "monthly",
  quarter: "quarterly",
  quarterly: "quarterly",
  year: "yearly",
  yearly: "yearly",
  annual: "yearly",
  annually: "yearly",
};

const CATEGORY_WORDS: Record<string, "streaming" | "software" | "utilities" | "gaming" | "other"> = {
  streaming: "streaming",
  netflix: "streaming",
  spotify: "streaming",
  software: "software",
  saas: "software",
  utilities: "utilities",
  utility: "utilities",
  gaming: "gaming",
  game: "gaming",
  other: "other",
};

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function toIsoDateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function extractDeadline(text: string): string | undefined {
  const lower = text.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (/\btoday\b/.test(lower)) return toIsoDateOnly(today);
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toIsoDateOnly(d);
  }
  if (/\bday after tomorrow\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return toIsoDateOnly(d);
  }

  const inDays = lower.match(/\bin (\d+)\s*(day|days|week|weeks)\b/);
  if (inDays) {
    const n = parseInt(inDays[1], 10);
    const multiplier = inDays[2].startsWith("week") ? 7 : 1;
    const d = new Date(today);
    d.setDate(d.getDate() + n * multiplier);
    return toIsoDateOnly(d);
  }

  if (/\bnext week\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return toIsoDateOnly(d);
  }

  const weekdayMatch = lower.match(
    /\b(?:on |next |this )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (weekdayMatch) {
    const targetIndex = WEEKDAYS.indexOf(weekdayMatch[1]);
    const currentIndex = today.getDay();
    let diff = targetIndex - currentIndex;
    if (diff <= 0) diff += 7;
    if (/\bnext\b/.test(lower) && diff < 7) diff += 7;
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    return toIsoDateOnly(d);
  }

  const isoMatch = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const d = new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
    if (!Number.isNaN(d.getTime())) return toIsoDateOnly(d);
  }

  return undefined;
}

function extractPriority(text: string) {
  const lower = text.toLowerCase();
  for (const [keyword, value] of Object.entries(PRIORITY_WORDS)) {
    if (new RegExp(`\\b${keyword}\\b`).test(lower)) return value;
  }
  return undefined;
}

function extractCategory(text: string) {
  const match = text.match(/\bcategory(?: is)?\s+([\w-]+)/i);
  if (match) return match[1];

  const lower = text.toLowerCase();
  for (const [keyword, value] of Object.entries(CATEGORY_WORDS)) {
    if (new RegExp(`\\b${keyword}\\b`).test(lower)) return value;
  }
  return undefined;
}

function extractReminderDays(text: string) {
  const lower = text.toLowerCase();
  const match = lower.match(
    /\bremind(?:er)?\s+(?:me\s+)?(\d+)\s*days?\s*(?:before|prior)?\b/,
  );
  if (match) return parseInt(match[1], 10);
  if (/\bone day before\b|\b1 day before\b/.test(lower)) return 1;
  if (/\btwo days before\b|\b2 days before\b/.test(lower)) return 2;
  if (/\bweek before\b/.test(lower)) return 7;
  return undefined;
}

function extractAmount(text: string) {
  const dollarMatch = text.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (dollarMatch) return parseFloat(dollarMatch[1]);

  const lower = text.toLowerCase();
  const numMatch = lower.match(/\b(\d+(?:\.\d{1,2})?)\s*(?:dollars?|usd|bucks?)\b/);
  if (numMatch) return parseFloat(numMatch[1]);

  const perMatch = lower.match(/\bfor\s+(\d+(?:\.\d{1,2})?)\b/);
  if (perMatch) return parseFloat(perMatch[1]);

  return undefined;
}

function extractBillingCycle(text: string) {
  const lower = text.toLowerCase();
  if (/\bweekly\b|\bper week\b|\bevery week\b/.test(lower)) return "weekly";
  if (/\bquarterly\b|\bper quarter\b|\bevery quarter\b/.test(lower)) return "quarterly";
  if (/\byearly\b|\bannual\b|\bper year\b|\bevery year\b|\bannually\b/.test(lower)) {
    return "yearly";
  }
  if (/\bmonthly\b|\bper month\b|\bevery month\b/.test(lower)) return "monthly";

  for (const [keyword, value] of Object.entries(BILLING_CYCLE_WORDS)) {
    if (new RegExp(`\\b${keyword}\\b`).test(lower)) return value;
  }
  return undefined;
}

function deriveTitle(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  return firstSentence.slice(0, 240);
}

function extractSubscriptionName(text: string) {
  const patterns = [
    /(?:add|track|create|new)\s+(?:a\s+)?(?:subscription\s+(?:for|to)\s+)?(.+?)(?:\s+(?:for|at|@)\s+|\s+\$|\s+\d|\s+monthly|\s+weekly|\s+yearly|\s+quarterly|$)/i,
    /(?:subscribe\s+to)\s+(.+?)(?:\s+(?:for|at)\s+|\s+\$|\s+\d|$)/i,
    /^(.+?)\s+subscription/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim().slice(0, 160);
    }
  }

  return deriveTitle(text);
}

function getSchemaProperties(schema: VoiceSchema | undefined): Set<string> {
  if (!schema) return new Set();
  const properties = (schema as { properties?: ParseSchema }).properties ?? schema;
  if (typeof properties !== "object" || !properties) return new Set();
  return new Set(Object.keys(properties));
}

export function parseTranscript(transcript: string, schema?: VoiceSchema) {
  const properties = getSchemaProperties(schema);
  const result: Record<string, unknown> = {};
  const want = (key: string) => properties.size === 0 || properties.has(key);

  if (want("title")) result.title = deriveTitle(transcript);
  if (want("name")) result.name = extractSubscriptionName(transcript);
  if (want("description")) result.description = transcript.trim();
  if (want("content")) result.content = transcript.trim();
  if (want("notes")) result.notes = transcript.trim();

  if (want("priority")) {
    const value = extractPriority(transcript);
    if (value) result.priority = value;
  }
  if (want("deadline")) {
    const value = extractDeadline(transcript);
    if (value) result.deadline = value;
  }
  if (want("dueDate")) {
    const value = extractDeadline(transcript);
    if (value) result.dueDate = value;
  }
  if (want("renewalDate")) {
    const value = extractDeadline(transcript);
    if (value) result.renewalDate = value;
  }
  if (want("category")) {
    const value = extractCategory(transcript);
    if (value) result.category = value;
  }
  if (want("reminderDays")) {
    const value = extractReminderDays(transcript);
    if (value !== undefined) result.reminderDays = value;
  }
  if (want("emailNotification")) {
    if (/\bemail (notification|me|reminder)\b/i.test(transcript)) {
      result.emailNotification = true;
    }
  }
  if (want("amount")) {
    const value = extractAmount(transcript);
    if (value !== undefined) result.amount = value;
  }
  if (want("billingCycle")) {
    const value = extractBillingCycle(transcript);
    if (value) result.billingCycle = value;
  }

  return result;
}
