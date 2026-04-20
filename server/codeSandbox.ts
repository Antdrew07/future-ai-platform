/**
 * Future AI Platform — Secure Code Execution Sandbox
 *
 * Replaces the unsafe `child_process.execSync` approach with Docker-based
 * isolated containers. Each code execution runs in a fresh, ephemeral
 * container with:
 *
 *  - No network access (--network none)
 *  - Read-only filesystem (except /tmp)
 *  - Strict resource limits (CPU, memory, PIDs)
 *  - Automatic cleanup after execution
 *  - 30-second hard timeout
 *
 * Supported languages: Python, JavaScript/Node, Bash
 *
 * Fallback: If Docker is not available (e.g., dev environment without Docker),
 * falls back to a restricted child_process execution with a blocklist.
 */

import { execSync, spawnSync } from "child_process";
import { writeFileSync, unlinkSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  sandboxed: boolean; // true = Docker, false = fallback
}

// ─── Docker Availability Check ────────────────────────────────────────────────

let dockerAvailable: boolean | null = null;

function isDockerAvailable(): boolean {
  if (dockerAvailable !== null) return dockerAvailable;
  try {
    execSync("docker info --format '{{.ServerVersion}}'", { timeout: 5000, stdio: "pipe" });
    dockerAvailable = true;
    console.log("[CodeSandbox] Docker available — using isolated containers");
  } catch {
    dockerAvailable = false;
    console.warn("[CodeSandbox] Docker not available — using restricted fallback");
  }
  return dockerAvailable;
}

// ─── Language Config ──────────────────────────────────────────────────────────

interface LangConfig {
  image: string;
  ext: string;
  cmd: (filePath: string) => string[];
}

const LANG_CONFIG: Record<string, LangConfig> = {
  python: {
    image: "python:3.11-slim",
    ext: ".py",
    cmd: (f) => ["python3", f],
  },
  javascript: {
    image: "node:20-alpine",
    ext: ".js",
    cmd: (f) => ["node", f],
  },
  typescript: {
    image: "node:20-alpine",
    ext: ".ts",
    cmd: (f) => ["npx", "--yes", "tsx", f],
  },
  bash: {
    image: "alpine:latest",
    ext: ".sh",
    cmd: (f) => ["sh", f],
  },
};

// ─── Dangerous Command Blocklist (for fallback mode) ─────────────────────────

const DANGEROUS_PATTERNS = [
  /rm\s+-rf?\s+\//i,
  /mkfs/i,
  /dd\s+if=/i,
  /:\s*\(\s*\)\s*\{.*:\|:&\s*\}/,  // fork bomb
  /curl\s+.*\|\s*(bash|sh)/i,
  /wget\s+.*\|\s*(bash|sh)/i,
  /chmod\s+777\s+\//i,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /sudo\s+/i,
  /su\s+-/i,
  /pkill|killall/i,
  /shutdown|reboot|halt/i,
  /iptables/i,
  /nc\s+-l/i,  // netcat listener
];

function containsDangerousCode(code: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(code));
}

// ─── Docker Execution ─────────────────────────────────────────────────────────

async function executeInDocker(
  code: string,
  language: string,
  timeoutMs = 30000,
): Promise<SandboxResult> {
  const config = LANG_CONFIG[language];
  if (!config) {
    return {
      stdout: "",
      stderr: `Unsupported language: ${language}`,
      exitCode: 1,
      timedOut: false,
      sandboxed: true,
    };
  }

  const runId = randomBytes(8).toString("hex");
  const hostDir = join(tmpdir(), `sandbox-${runId}`);
  const codeFile = `code${config.ext}`;
  const hostCodePath = join(hostDir, codeFile);
  const containerCodePath = `/sandbox/${codeFile}`;

  mkdirSync(hostDir, { recursive: true });
  writeFileSync(hostCodePath, code, "utf8");

  try {
    const dockerArgs = [
      "run",
      "--rm",                          // Auto-remove container after exit
      "--network", "none",             // No network access
      "--memory", "256m",              // 256MB memory limit
      "--memory-swap", "256m",         // No swap
      "--cpus", "0.5",                 // 50% of one CPU core
      "--pids-limit", "64",            // Max 64 processes
      "--read-only",                   // Read-only root filesystem
      "--tmpfs", "/tmp:size=64m",      // Writable /tmp (64MB)
      "--tmpfs", "/sandbox:size=16m",  // Writable /sandbox (16MB)
      "--security-opt", "no-new-privileges:true",
      "--cap-drop", "ALL",             // Drop all Linux capabilities
      "-v", `${hostCodePath}:${containerCodePath}:ro`, // Mount code read-only
      "-w", "/sandbox",
      config.image,
      ...config.cmd(containerCodePath),
    ];

    const result = spawnSync("docker", dockerArgs, {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB output buffer
      encoding: "utf8",
    });

    const timedOut = result.signal === "SIGTERM" || result.error?.message?.includes("ETIMEDOUT");

    return {
      stdout: (result.stdout ?? "").substring(0, 50000),
      stderr: (result.stderr ?? "").substring(0, 10000),
      exitCode: result.status ?? 1,
      timedOut,
      sandboxed: true,
    };
  } finally {
    try { unlinkSync(hostCodePath); } catch { /* ignore */ }
    try { execSync(`rmdir "${hostDir}"`, { stdio: "pipe" }); } catch { /* ignore */ }
  }
}

// ─── Fallback Execution (Restricted) ─────────────────────────────────────────

async function executeRestricted(
  code: string,
  language: string,
  timeoutMs = 30000,
): Promise<SandboxResult> {
  if (containsDangerousCode(code)) {
    return {
      stdout: "",
      stderr: "Execution blocked: code contains potentially dangerous operations.",
      exitCode: 1,
      timedOut: false,
      sandboxed: false,
    };
  }

  const config = LANG_CONFIG[language] ?? LANG_CONFIG.python;
  const tmpFile = join(tmpdir(), `code-${randomBytes(8).toString("hex")}${config.ext}`);
  writeFileSync(tmpFile, code, "utf8");

  try {
    const result = spawnSync(config.cmd(tmpFile)[0], config.cmd(tmpFile).slice(1), {
      timeout: timeoutMs,
      maxBuffer: 5 * 1024 * 1024,
      encoding: "utf8",
      env: {
        // Minimal safe environment
        PATH: "/usr/local/bin:/usr/bin:/bin",
        HOME: tmpdir(),
        TMPDIR: tmpdir(),
      },
    });

    const timedOut = result.signal === "SIGTERM";

    return {
      stdout: (result.stdout ?? "").substring(0, 50000),
      stderr: (result.stderr ?? "").substring(0, 10000),
      exitCode: result.status ?? 1,
      timedOut,
      sandboxed: false,
    };
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Execute code in a secure sandbox.
 * Uses Docker if available, falls back to restricted child_process.
 */
export async function executeCode(
  code: string,
  language: string,
  timeoutMs = 30000,
): Promise<SandboxResult> {
  if (isDockerAvailable()) {
    return executeInDocker(code, language, timeoutMs);
  }
  return executeRestricted(code, language, timeoutMs);
}

/**
 * Format sandbox result for agent consumption.
 */
export function formatSandboxResult(result: SandboxResult): string {
  const lines: string[] = [];

  if (result.timedOut) {
    lines.push("⚠️ **Execution timed out** (30s limit exceeded)");
  }

  if (!result.sandboxed) {
    lines.push("⚠️ *Running in restricted mode (Docker not available)*");
  }

  if (result.stdout.trim()) {
    lines.push("**Output:**");
    lines.push("```");
    lines.push(result.stdout.trim());
    lines.push("```");
  }

  if (result.stderr.trim()) {
    lines.push("**Errors/Warnings:**");
    lines.push("```");
    lines.push(result.stderr.trim());
    lines.push("```");
  }

  if (result.exitCode !== 0 && !result.timedOut) {
    lines.push(`**Exit code:** ${result.exitCode}`);
  }

  if (lines.length === 0) {
    lines.push("*(No output)*");
  }

  return lines.join("\n");
}
