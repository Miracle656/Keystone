export type Mode = "simulate" | "run-once" | "cron";

/** Parses `--key=value` style args from process.argv, falling back to env vars. */
export function parseArg(name: string, envVar?: string): string | undefined {
  const flag = `--${name}=`;
  const fromArgv = process.argv.find((a) => a.startsWith(flag))?.slice(flag.length);
  if (fromArgv) return fromArgv;
  return envVar ? process.env[envVar] : undefined;
}

export function parseMode(defaultMode: Mode = "run-once"): Mode {
  const mode = parseArg("mode", "ENGINE_MODE") ?? defaultMode;
  if (mode !== "simulate" && mode !== "run-once" && mode !== "cron") {
    throw new Error(`Invalid --mode: ${mode} (expected simulate | run-once | cron)`);
  }
  return mode;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
