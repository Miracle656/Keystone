/** Minimal structured logger — avoids adding pino as a dependency just for this package.
 * Same call shape as packages/engine's pino logger (obj first, message second) so log call
 * sites read the same across the monorepo. */
function log(level: string, objOrMsg: unknown, msg?: string) {
  const time = new Date().toISOString();
  if (typeof objOrMsg === "string") {
    console.log(`[${time}] ${level.toUpperCase()}: ${objOrMsg}`);
  } else {
    console.log(`[${time}] ${level.toUpperCase()}: ${msg ?? ""}`, objOrMsg);
  }
}

export const logger = {
  info: (objOrMsg: unknown, msg?: string) => log("info", objOrMsg, msg),
  warn: (objOrMsg: unknown, msg?: string) => log("warn", objOrMsg, msg),
  error: (objOrMsg: unknown, msg?: string) => log("error", objOrMsg, msg),
};
