import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { pinoHttp } from "pino-http";
import type { Options as PinoHttpOptions } from "pino-http";
import type { LevelWithSilent } from "pino";
import type { IncomingMessage, ServerResponse } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOGS_DIR = path.resolve(__dirname, "../../logs");

const isDev = env.NODE_ENV !== "production";
const LOG_LEVEL = env.LOG_LEVEL ?? (isDev ? "debug" : "info");

const { combine, timestamp, colorize, printf, json, errors, splat } =
  winston.format;

const devConsoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, stack: errorStack, timestamp: ts, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    const tsStr = String(ts);
    const levelStr = level satisfies string;
    const msgStr = String(message);
    return errorStack
      ? `${tsStr} [${levelStr}] ${msgStr}\n${typeof errorStack === "string" ? errorStack : JSON.stringify(errorStack)}${metaStr}`
      : `${tsStr} [${levelStr}] ${msgStr}${metaStr}`;
  }),
);

const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json(),
);

const combinedFileTransport = new DailyRotateFile({
  dirname: LOGS_DIR,
  filename: "combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  zippedArchive: true,
  format: jsonFormat,
});

const errorFileTransport = new DailyRotateFile({
  dirname: LOGS_DIR,
  filename: "error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "30d",
  level: "error",
  zippedArchive: true,
  format: jsonFormat,
});

const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports: [
    new winston.transports.Console({
      format: isDev ? devConsoleFormat : jsonFormat,
    }),
    combinedFileTransport,
    errorFileTransport,
  ],
  exitOnError: false,
});

logger.exceptions.handle(
  new DailyRotateFile({
    dirname: LOGS_DIR,
    filename: "exceptions-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "30d",
    zippedArchive: true,
    format: jsonFormat,
  }),
);

logger.rejections.handle(
  new DailyRotateFile({
    dirname: LOGS_DIR,
    filename: "rejections-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "30d",
    zippedArchive: true,
    format: jsonFormat,
  }),
);

const pinoHttpOptions: PinoHttpOptions = {
  level: LOG_LEVEL,

  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:mm:ss",
          ignore: "pid,hostname,req,res",
        },
      }
    : undefined,

  serializers: {
    req(req: IncomingMessage) {
      return {
        method: req.method,
        url: req.url,
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    censor: "[redacted]",
  },

  customLogLevel(
    _req: IncomingMessage,
    res: ServerResponse,
    err: Error | undefined,
  ): LevelWithSilent {
    if (err || res.statusCode >= 500) {
      return "error";
    }
    if (res.statusCode >= 400) {
      return "warn";
    }
    return "info";
  },

  customSuccessMessage(
    req: IncomingMessage,
    res: ServerResponse,
    responseTime: number,
  ): string {
    return `${req.method ?? "UNKNOWN"} ${req.url ?? "/"} ${String(res.statusCode)} (${responseTime}ms)`;
  },

  customErrorMessage(
    req: IncomingMessage,
    res: ServerResponse,
    err: Error,
  ): string {
    return `${req.method ?? "UNKNOWN"} ${req.url ?? "/"} ${String(res.statusCode)} — ${err.message}`;
  },

  autoLogging: {
    ignore: (req: IncomingMessage) => req.url === "/api/v1/health",
  },
};

const httpLogger = pinoHttp(pinoHttpOptions);

export { httpLogger };
export default logger;
