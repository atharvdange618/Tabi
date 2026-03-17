#!/usr/bin/env bun
/* eslint-disable no-console */
/**
 * Tabi Server Log Analyzer
 *
 * Usage:
 *   bun scripts/analyze-logs.ts [options]
 *
 * Options:
 *   --date YYYY-MM-DD   Analyze only this specific date's logs
 *   --days N            Analyze the last N calendar days (default: all)
 *   --errors-only       Print only the Errors and Recent-Errors sections
 *   --no-color          Disable ANSI color output
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";

interface LogEntry {
  level?: string;
  message?: string;
  timestamp?: string;
  context?: string;
  name?: string;
  statusCode?: number;
  stack?: string;
  url?: string;
  clerkReason?: string;
  clerkStatus?: string;
  hasAuthHeader?: boolean;
  tripId?: string;
  userId?: string;
  clerkId?: string;
  count?: number;
  to?: string;
  subject?: string;
  err?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ErrorGroup {
  count: number;
  first: string;
  last: string;
  name?: string;
  statusCode?: number;
  context?: string;
  stack?: string;
}

interface WarnGroup {
  count: number;
  name?: string;
  statusCode?: number;
  message: string;
  first: string;
}

interface AuthFailure {
  total: number;
  byUrl: Map<string, number>;
  byReason: Map<string, number>;
}

interface AggregatedData {
  totalLines: number;
  filesAnalyzed: string[];
  dateRange: { first: string; last: string };
  levelCounts: Record<string, number>;
  restarts: string[];
  errorGroups: Map<string, ErrorGroup>;
  warnGroups: Map<string, WarnGroup>;
  authFailures: AuthFailure;
  domainEvents: Map<string, number>;
  recentErrors: LogEntry[];
}

let useColor = true;

const c = {
  reset: () => (useColor ? "\x1b[0m" : ""),
  bold: (s: string) => (useColor ? `\x1b[1m${s}\x1b[0m` : s),
  dim: (s: string) => (useColor ? `\x1b[2m${s}\x1b[0m` : s),
  red: (s: string) => (useColor ? `\x1b[31m${s}\x1b[0m` : s),
  boldRed: (s: string) => (useColor ? `\x1b[1;31m${s}\x1b[0m` : s),
  yellow: (s: string) => (useColor ? `\x1b[33m${s}\x1b[0m` : s),
  boldYellow: (s: string) => (useColor ? `\x1b[1;33m${s}\x1b[0m` : s),
  green: (s: string) => (useColor ? `\x1b[32m${s}\x1b[0m` : s),
  boldGreen: (s: string) => (useColor ? `\x1b[1;32m${s}\x1b[0m` : s),
  cyan: (s: string) => (useColor ? `\x1b[36m${s}\x1b[0m` : s),
  boldCyan: (s: string) => (useColor ? `\x1b[1;36m${s}\x1b[0m` : s),
  magenta: (s: string) => (useColor ? `\x1b[35m${s}\x1b[0m` : s),
  blue: (s: string) => (useColor ? `\x1b[34m${s}\x1b[0m` : s),
  white: (s: string) => (useColor ? `\x1b[37m${s}\x1b[0m` : s),
};

interface CliArgs {
  date?: string;
  days?: number;
  errorsOnly: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { errorsOnly: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--date" && argv[i + 1]) {
      args.date = argv[++i] as string;
    } else if (arg === "--days" && argv[i + 1]) {
      const n = parseInt(argv[++i] as string, 10);
      if (!isNaN(n) && n > 0) {
        args.days = n;
      }
    } else if (arg === "--errors-only") {
      args.errorsOnly = true;
    } else if (arg === "--no-color") {
      useColor = false;
    }
  }
  return args;
}

const LOGS_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../logs",
);

function extractDateFromFilename(filename: string): string | null {
  const match = /(\d{4}-\d{2}-\d{2})/.exec(filename);
  return match?.[1] ?? null;
}

function getLogFiles(args: CliArgs): string[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(LOGS_DIR);
  } catch {
    console.error(c.red(`Could not read logs directory: ${LOGS_DIR}`));
    process.exit(1);
  }

  let logFiles = entries.filter(
    (f) =>
      !f.startsWith(".") &&
      (f.endsWith(".log") || f.endsWith(".log.gz")) &&
      /\d{4}-\d{2}-\d{2}/.exec(f),
  );

  if (args.date) {
    const { date } = args;
    logFiles = logFiles.filter((f) => f.includes(date));
  } else if (args.days !== undefined) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - args.days + 1);
    cutoff.setHours(0, 0, 0, 0);
    logFiles = logFiles.filter((f) => {
      const d = extractDateFromFilename(f);
      if (!d) {
        return false;
      }
      return new Date(d) >= cutoff;
    });
  }

  const typeOrder: Record<string, number> = {
    combined: 0,
    error: 1,
    exceptions: 2,
    rejections: 3,
  };
  logFiles.sort((a, b) => {
    const dateA = extractDateFromFilename(a) ?? "";
    const dateB = extractDateFromFilename(b) ?? "";
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const typeA = Object.keys(typeOrder).find((t) => a.startsWith(t)) ?? "z";
    const typeB = Object.keys(typeOrder).find((t) => b.startsWith(t)) ?? "z";
    return (typeOrder[typeA] ?? 9) - (typeOrder[typeB] ?? 9);
  });

  return logFiles.map((f) => path.join(LOGS_DIR, f));
}

function readLogFileSync(filePath: string): string {
  if (filePath.endsWith(".gz")) {
    const compressed = fs.readFileSync(filePath);
    return zlib.gunzipSync(compressed).toString("utf8");
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseNdjson(content: string): LogEntry[] {
  const entries: LogEntry[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      entries.push(JSON.parse(trimmed) as LogEntry);
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

const DOMAIN_EVENT_PATTERNS: [RegExp, string][] = [
  [/Expense added notifications created/i, "Expense added"],
  [/Poll created notifications sent/i, "Poll created"],
  [/Ownership transferred successfully/i, "Ownership transferred"],
  [
    /Ownership transfer notifications created/i,
    "Ownership transfer notifications",
  ],
  [/Invite email sent/i, "Invite email sent"],
  [/Member left trip successfully/i, "Member left trip"],
  [
    /resolveDbUser - JIT sync: user created from Clerk/i,
    "User JIT-created (Clerk sync)",
  ],
  [
    /Activity.*notifications? (created|sent)/i,
    "Activity updated notifications",
  ],
  [
    /Member invited notifications? (created|sent)/i,
    "Member invited notifications",
  ],
  [/Role changed notifications? (created|sent)/i, "Role changed notifications"],
  [/Comment created notifications? (created|sent)/i, "Comment notifications"],
  [/Reservation.*notifications? (created|sent)/i, "Reservation notifications"],
  [/Trip updated notifications? (created|sent)/i, "Trip updated notifications"],
  [/Failed to start server/i, "Server start failures"],
  [
    /Notification event listeners registered/i,
    "Notification listeners registered",
  ],
  [/Connected to MongoDB/i, "MongoDB connects"],
  [/Server running/i, "Server up events"],
];

function matchDomainEvent(message: string): string | null {
  for (const [pattern, label] of DOMAIN_EVENT_PATTERNS) {
    if (pattern.test(message)) {
      return label;
    }
  }
  return null;
}

const RESTART_MESSAGE = "Connected to MongoDB";
const RECENT_ERRORS_BUFFER = 10;

function aggregate(
  allEntries: LogEntry[],
  filesAnalyzed: string[],
): AggregatedData {
  const data: AggregatedData = {
    totalLines: allEntries.length,
    filesAnalyzed,
    dateRange: { first: "", last: "" },
    levelCounts: { info: 0, warn: 0, error: 0, other: 0 },
    restarts: [],
    errorGroups: new Map(),
    warnGroups: new Map(),
    authFailures: { total: 0, byUrl: new Map(), byReason: new Map() },
    domainEvents: new Map(),
    recentErrors: [],
  };

  for (const entry of allEntries) {
    const level = entry.level?.toLowerCase() ?? "other";
    const msg = entry.message ?? "(no message)";
    const ts = entry.timestamp ?? "";

    if (ts) {
      if (!data.dateRange.first || ts < data.dateRange.first) {
        data.dateRange.first = ts;
      }
      if (!data.dateRange.last || ts > data.dateRange.last) {
        data.dateRange.last = ts;
      }
    }

    if (level === "info" || level === "warn" || level === "error") {
      data.levelCounts[level] = (data.levelCounts[level] ?? 0) + 1;
    } else {
      data.levelCounts.other = (data.levelCounts.other ?? 0) + 1;
    }

    if (msg === RESTART_MESSAGE) {
      data.restarts.push(ts);
    }

    if (level === "error") {
      const key = msg;
      const existing = data.errorGroups.get(key);
      if (existing) {
        existing.count++;
        if (ts > existing.last) {
          existing.last = ts;
        }
        if (ts < existing.first) {
          existing.first = ts;
        }
      } else {
        data.errorGroups.set(key, {
          count: 1,
          first: ts,
          last: ts,
          name: entry.name,
          statusCode: entry.statusCode,
          context: entry.context,
          stack:
            entry.stack ?? (entry.err as { stack?: string } | undefined)?.stack,
        });
      }
      data.recentErrors.push(entry);
      if (data.recentErrors.length > RECENT_ERRORS_BUFFER) {
        data.recentErrors.shift();
      }
    }

    if (
      level === "warn" &&
      !msg.toLowerCase().includes("authentication failed")
    ) {
      const key = `${entry.name ?? ""}:${entry.statusCode ?? ""}:${msg}`;
      const existing = data.warnGroups.get(key);
      if (existing) {
        existing.count++;
      } else {
        data.warnGroups.set(key, {
          count: 1,
          name: entry.name,
          statusCode: entry.statusCode,
          message: msg,
          first: ts,
        });
      }
    }

    if (msg.toLowerCase().includes("authentication failed")) {
      data.authFailures.total++;
      if (entry.url) {
        const urlKey = normalizeUrl(entry.url);
        data.authFailures.byUrl.set(
          urlKey,
          (data.authFailures.byUrl.get(urlKey) ?? 0) + 1,
        );
      }
      const reason = entry.clerkReason ?? "unknown";
      data.authFailures.byReason.set(
        reason,
        (data.authFailures.byReason.get(reason) ?? 0) + 1,
      );
    }

    const eventLabel = matchDomainEvent(msg);
    if (eventLabel) {
      data.domainEvents.set(
        eventLabel,
        (data.domainEvents.get(eventLabel) ?? 0) + 1,
      );
    }
  }

  return data;
}

function normalizeUrl(url: string): string {
  return url
    .replace(/\/[a-f0-9]{24}(?=\/|$)/gi, "/:id")
    .replace(/\/[a-f0-9]{64}(?=\/|$)/gi, "/:token");
}

function fmtTs(ts: string): string {
  if (!ts) {
    return c.dim("—");
  }
  try {
    const d = new Date(ts);
    return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return ts;
  }
}

function header(title: string): string {
  const line = "═".repeat(60);
  return `\n${c.boldCyan(line)}\n${c.boldCyan(`  ${title}`)}\n${c.boldCyan(line)}`;
}

function padEnd(str: string, len: number): string {
  // eslint-disable-next-line no-control-regex
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "");
  return `${str}${" ".repeat(Math.max(0, len - stripped.length))}`;
}

function padStart(str: string, len: number): string {
  // eslint-disable-next-line no-control-regex
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "");
  return `${" ".repeat(Math.max(0, len - stripped.length))}${str}`;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) {
    return str;
  }
  return `${str.slice(0, max - 1)}…`;
}

function renderOverview(data: AggregatedData, args: CliArgs): void {
  console.log(header("OVERVIEW"));
  console.log();

  const { levelCounts, filesAnalyzed, totalLines, dateRange } = data;

  const filesByType: Record<string, number> = {};
  for (const f of filesAnalyzed) {
    const base = path.basename(f).replace(/-\d{4}-\d{2}-\d{2}.*/, "");
    filesByType[base] = (filesByType[base] ?? 0) + 1;
  }

  console.log(
    `  ${c.bold("Files analyzed:")}  ${c.boldGreen(String(filesAnalyzed.length))}`,
  );
  for (const [type, n] of Object.entries(filesByType)) {
    console.log(
      `    ${c.dim("•")} ${padEnd(c.dim(type), 16)} ${c.dim(String(n))} files`,
    );
  }
  if (args.date) {
    console.log(`  ${c.bold("Filter:")}          date = ${c.cyan(args.date)}`);
  } else if (args.days) {
    console.log(
      `  ${c.bold("Filter:")}          last ${c.cyan(String(args.days))} days`,
    );
  }
  console.log(
    `  ${c.bold("Date range:")}      ${c.cyan(fmtTs(dateRange.first))} ${c.dim("→")} ${c.cyan(fmtTs(dateRange.last))}`,
  );
  console.log(
    `  ${c.bold("Total entries:")}   ${c.boldGreen(totalLines.toLocaleString())}`,
  );
  console.log();
  console.log(`  ${c.bold("Log levels:")}`);
  console.log(
    `    ${c.boldGreen(padStart(String(levelCounts.info), 6))} ${c.green("info")}`,
  );
  console.log(
    `    ${c.boldYellow(padStart(String(levelCounts.warn), 6))} ${c.yellow("warn")}`,
  );
  console.log(
    `    ${c.boldRed(padStart(String(levelCounts.error), 6))} ${c.red("error")}`,
  );
  if ((levelCounts.other ?? 0) > 0) {
    console.log(
      `    ${c.dim(padStart(String(levelCounts.other ?? 0), 6))} ${c.dim("other")}`,
    );
  }
}

function renderRestarts(data: AggregatedData): void {
  const { restarts } = data;
  console.log(header(`SERVER RESTARTS  (${restarts.length} total)`));
  console.log();
  if (restarts.length === 0) {
    console.log(c.dim("  No restart events found."));
    return;
  }

  const byDay = new Map<string, string[]>();
  for (const ts of restarts) {
    const day = ts ? ts.slice(0, 10) : "unknown";
    const group = byDay.get(day) ?? [];
    group.push(ts);
    byDay.set(day, group);
  }

  console.log(
    `  ${padEnd(c.dim("DATE"), 14)}${padEnd(c.dim("RESTARTS"), 12)}${c.dim("FIRST")}${c.dim("  →  ")}${c.dim("LAST")}`,
  );
  console.log(`  ${c.dim("─".repeat(58))}`);

  for (const [day, timestamps] of byDay) {
    const count = padEnd(c.boldCyan(String(timestamps.length)), 12);
    const first = fmtTs(timestamps[0] ?? "");
    const last = fmtTs(timestamps[timestamps.length - 1] ?? "");
    const sameTime = first === last;
    const timeRange = sameTime
      ? c.dim(first)
      : `${c.dim(first)} ${c.dim("→")} ${c.dim(last)}`;
    console.log(`  ${padEnd(c.cyan(day), 14)}${count}${timeRange}`);
  }
}

function renderErrors(data: AggregatedData): void {
  const { errorGroups } = data;
  const sorted = [...errorGroups.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  );

  console.log(
    header(
      `ERRORS  (${sorted.length} unique, ${[...errorGroups.values()].reduce((s, g) => s + g.count, 0)} total)`,
    ),
  );
  console.log();

  if (sorted.length === 0) {
    console.log(c.boldGreen("  ✓ No errors found!"));
    return;
  }

  console.log(
    `  ${padEnd(c.dim("COUNT"), 8)}${padEnd(c.dim("FIRST SEEN"), 14)}${padEnd(c.dim("CONTEXT"), 14)}${c.dim("MESSAGE")}`,
  );
  console.log(`  ${c.dim("─".repeat(72))}`);

  for (const [msg, group] of sorted) {
    const count = padStart(c.boldRed(String(group.count)), 8);
    const ts = padEnd(c.dim(fmtTs(group.first)), 14);
    const ctx = padEnd(c.dim(group.context ?? "—"), 14);
    const message = c.red(truncate(msg, 56));
    console.log(`  ${count} ${ts} ${ctx} ${message}`);
    if (group.name) {
      console.log(
        `  ${" ".repeat(9)}${c.dim("name: ")}${c.yellow(group.name)}`,
      );
    }
  }
}

function renderWarnings(data: AggregatedData): void {
  const { warnGroups } = data;
  const sorted = [...warnGroups.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  );

  const total = sorted.reduce((s, [, g]) => s + g.count, 0);
  console.log(
    header(`WARNINGS BREAKDOWN  (${sorted.length} unique, ${total} total)`),
  );
  console.log();

  if (sorted.length === 0) {
    console.log(c.dim("  No warnings found."));
    return;
  }

  console.log(
    `  ${padEnd(c.dim("COUNT"), 8)}${padEnd(c.dim("STATUS"), 8)}${padEnd(c.dim("TYPE"), 18)}${c.dim("MESSAGE")}`,
  );
  console.log(`  ${c.dim("─".repeat(72))}`);

  for (const [, group] of sorted) {
    const count = padStart(c.boldYellow(String(group.count)), 8);
    const status = padEnd(
      c.dim(group.statusCode ? String(group.statusCode) : "—"),
      8,
    );
    const type = padEnd(c.yellow(group.name ?? "—"), 18);
    const msg = truncate(group.message, 48);
    console.log(`  ${count} ${status} ${type} ${msg}`);
  }
}

function renderAuthFailures(data: AggregatedData): void {
  const { authFailures } = data;
  console.log(header(`AUTH FAILURES  (${authFailures.total} total)`));
  console.log();

  if (authFailures.total === 0) {
    console.log(c.boldGreen("  ✓ No auth failures found!"));
    return;
  }

  console.log(`  ${c.bold("By clerk reason:")}`);
  const reasons = [...authFailures.byReason.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  for (const [reason, count] of reasons) {
    console.log(
      `    ${padStart(c.yellow(String(count)), 6)}  ${c.dim(reason)}`,
    );
  }

  console.log();
  console.log(`  ${c.bold("Top URLs hit (normalized):")}`);
  const urls = [...authFailures.byUrl.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (urls.length === 0) {
    console.log(c.dim("    (no URL data)"));
  } else {
    for (const [url, count] of urls) {
      console.log(
        `    ${padStart(c.yellow(String(count)), 6)}  ${c.cyan(truncate(url, 60))}`,
      );
    }
  }
}

function renderDomainEvents(data: AggregatedData): void {
  console.log(header("DOMAIN EVENTS"));
  console.log();

  const infraEvents = new Set([
    "MongoDB connects",
    "Server up events",
    "Notification listeners registered",
  ]);

  const domainOnly = [...data.domainEvents.entries()]
    .filter(([label]) => !infraEvents.has(label))
    .sort((a, b) => b[1] - a[1]);

  const infraOnly = [...data.domainEvents.entries()]
    .filter(([label]) => infraEvents.has(label))
    .sort((a, b) => b[1] - a[1]);

  if (domainOnly.length === 0 && infraOnly.length === 0) {
    console.log(c.dim("  No domain events found."));
    return;
  }

  if (domainOnly.length > 0) {
    console.log(`  ${c.bold("Business Events:")}`);
    for (const [label, count] of domainOnly) {
      const bar = "█".repeat(Math.min(Math.ceil(count / 2), 20));
      console.log(
        `    ${padEnd(c.green(padStart(String(count), 5)), 10)}  ${padEnd(label, 40)}  ${c.dim(bar)}`,
      );
    }
    console.log();
  }

  if (infraOnly.length > 0) {
    console.log(`  ${c.bold("Infrastructure Events:")}`);
    for (const [label, count] of infraOnly) {
      console.log(
        `    ${padEnd(c.dim(padStart(String(count), 5)), 10)}  ${c.dim(label)}`,
      );
    }
  }
}

function renderRecentErrors(data: AggregatedData): void {
  const { recentErrors } = data;
  const lastN = recentErrors.slice(-5);
  console.log(header(`RECENT ERRORS  (last ${lastN.length})`));
  console.log();

  if (lastN.length === 0) {
    console.log(c.boldGreen("  ✓ No recent errors!"));
    return;
  }

  for (let i = 0; i < lastN.length; i++) {
    const e = lastN[i];
    if (!e) {
      continue;
    }
    console.log(
      `  ${c.boldRed(`[${i + 1}]`)} ${c.dim(fmtTs(e.timestamp ?? ""))}  ${c.red(truncate(e.message ?? "(no message)", 80))}`,
    );
    if (e.name) {
      console.log(`      ${c.dim("type:     ")}${c.yellow(e.name)}`);
    }
    if (e.context) {
      console.log(`      ${c.dim("context:  ")}${c.dim(e.context)}`);
    }
    if (e.stack) {
      const stackLines = e.stack
        .split("\n")
        .filter((l) => !l.includes("node_modules") && l.trim())
        .slice(0, 4);
      if (stackLines.length > 0) {
        console.log(`      ${c.dim("stack:")}`);
        for (const line of stackLines) {
          console.log(`        ${c.dim(truncate(line.trim(), 90))}`);
        }
      }
    }
    if (i < lastN.length - 1) {
      console.log();
    }
  }
}

function main(): void {
  const args = parseArgs(process.argv);

  const filePaths = getLogFiles(args);

  if (filePaths.length === 0) {
    console.error(c.yellow("No log files found matching the given criteria."));
    process.exit(0);
  }

  let allEntries: LogEntry[] = [];
  for (const filePath of filePaths) {
    try {
      const content = readLogFileSync(filePath);
      const entries = parseNdjson(content);
      allEntries = allEntries.concat(entries);
    } catch (err) {
      console.warn(
        c.yellow(
          `  ⚠ Could not read ${path.basename(filePath)}: ${(err as Error).message}`,
        ),
      );
    }
  }

  const fileNames = filePaths.map((f) => path.basename(f));
  const data = aggregate(allEntries, fileNames);

  if (!args.errorsOnly) {
    renderOverview(data, args);
    renderRestarts(data);
    renderDomainEvents(data);
    renderAuthFailures(data);
    renderWarnings(data);
  }
  renderErrors(data);
  renderRecentErrors(data);

  console.log(`\n${c.dim("═".repeat(60))}\n`);
}

main();
