import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

export interface UsageSnapshot {
  limit: number;
  used: number;
  remaining: number;
}

export interface FreeUsageStore {
  get(clientId: string): UsageSnapshot;
  reserve(clientId: string): UsageSnapshot | null;
  release(clientId: string): UsageSnapshot;
}

export class MemoryFreeUsageStore implements FreeUsageStore {
  private readonly usage = new Map<string, number>();

  constructor(private readonly limit = 10) {}

  get(clientId: string): UsageSnapshot {
    const used = Math.min(this.usage.get(clientId) || 0, this.limit);
    return {
      limit: this.limit,
      used,
      remaining: Math.max(this.limit - used, 0),
    };
  }

  reserve(clientId: string): UsageSnapshot | null {
    const current = this.get(clientId);
    if (current.remaining === 0) return null;

    this.usage.set(clientId, current.used + 1);
    return this.get(clientId);
  }

  release(clientId: string): UsageSnapshot {
    const current = this.get(clientId);
    this.usage.set(clientId, Math.max(current.used - 1, 0));
    return this.get(clientId);
  }
}

export class FileFreeUsageStore implements FreeUsageStore {
  private readonly usage = new Map<string, number>();

  constructor(
    private readonly filePath = process.env.QUIP_USAGE_FILE ||
      resolve(process.cwd(), ".data/quip-usage.json"),
    private readonly limit = parsePositiveInteger(
      process.env.FREE_REQUEST_LIMIT,
      10,
    ),
  ) {
    this.load();
  }

  get(clientId: string): UsageSnapshot {
    const used = Math.min(this.usage.get(clientId) || 0, this.limit);
    return {
      limit: this.limit,
      used,
      remaining: Math.max(this.limit - used, 0),
    };
  }

  reserve(clientId: string): UsageSnapshot | null {
    const current = this.get(clientId);
    if (current.remaining === 0) return null;

    this.usage.set(clientId, current.used + 1);
    this.persist();
    return this.get(clientId);
  }

  release(clientId: string): UsageSnapshot {
    const current = this.get(clientId);
    this.usage.set(clientId, Math.max(current.used - 1, 0));
    this.persist();
    return this.get(clientId);
  }

  private load(): void {
    if (!existsSync(this.filePath)) return;

    try {
      const stored = JSON.parse(readFileSync(this.filePath, "utf8")) as Record<
        string,
        number
      >;
      for (const [clientId, used] of Object.entries(stored)) {
        if (Number.isInteger(used) && used >= 0) {
          this.usage.set(clientId, used);
        }
      }
    } catch {
      // Start with an empty quota file if the existing file is unreadable.
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    writeFileSync(
      temporaryPath,
      JSON.stringify(Object.fromEntries(this.usage), null, 2),
      "utf8",
    );
    renameSync(temporaryPath, this.filePath);
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
