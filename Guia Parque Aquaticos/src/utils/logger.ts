import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type LogContext = Record<string, unknown>;

const DEBUG = process.env.DEBUG?.toLowerCase() === "true";
const LOGS_DIR = "logs";

// Cores ANSI para terminal
const Colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  info: "\x1b[36m", // cyan
  success: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
  debug: "\x1b[35m", // magenta
};

let logFile: string | null = null;

function initLogFile(): void {
  if (logFile) return;

  try {
    mkdirSync(LOGS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    logFile = join(LOGS_DIR, `run-${timestamp}.log`);
  } catch (e) {
    console.warn("Não foi possível criar diretório de logs");
  }
}

function stamp(): string {
  return new Date().toISOString();
}

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return "";
  }
  return ` | ${JSON.stringify(context)}`;
}

function writeToFile(level: string, message: string, context?: LogContext): void {
  if (!logFile) {
    initLogFile();
  }
  if (!logFile) return;

  const logMessage = `[${stamp()}] [${level}] ${message}${formatContext(context)}\n`;
  try {
    appendFileSync(logFile, logMessage, "utf-8");
  } catch (e) {
    // Silenciosamente falha se não conseguir escrever
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    const formatted = `${Colors.info}[${stamp()}] INFO ${Colors.reset} ${message}${formatContext(context)}`;
    console.log(formatted);
    writeToFile("INFO", message, context);
  },

  success(message: string, context?: LogContext) {
    const formatted = `${Colors.success}${Colors.bright}[${stamp()}] ✓ ${Colors.reset} ${message}${formatContext(context)}`;
    console.log(formatted);
    writeToFile("SUCCESS", message, context);
  },

  warn(message: string, context?: LogContext) {
    const formatted = `${Colors.warn}[${stamp()}] WARN ${Colors.reset} ${message}${formatContext(context)}`;
    console.warn(formatted);
    writeToFile("WARN", message, context);
  },

  error(message: string, context?: LogContext) {
    const formatted = `${Colors.error}[${stamp()}] ERROR${Colors.reset} ${message}${formatContext(context)}`;
    console.error(formatted);
    writeToFile("ERROR", message, context);
  },

  debug(message: string, context?: LogContext) {
    if (!DEBUG) return;
    const formatted = `${Colors.debug}[${stamp()}] DEBUG${Colors.reset} ${message}${formatContext(context)}`;
    console.log(formatted);
    writeToFile("DEBUG", message, context);
  },

  getLogFile(): string | null {
    if (!logFile) {
      initLogFile();
    }
    return logFile;
  },
};
