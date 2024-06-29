import { cookies } from "next/headers";
import { handle$GetTemplates } from "wehere-frontend/src/app/api/get-templates/handle";

type Preset = "cookie:theme" | "/api/get-templates";

export class FallbackBuilder {
  private entries: Map<string, unknown> = new Map();

  push(name: string, value: unknown) {
    this.entries.set(name, value);
    return this;
  }

  pushPreset(name: Preset) {
    try {
      switch (name) {
        case "cookie:theme": {
          this.entries.set(name, cookies().get("theme")?.value);
          break;
        }
        case "/api/get-templates": {
          this.entries.set(name, handle$GetTemplates());
          break;
        }
      }
    } catch {
      void undefined;
    }
    return this;
  }

  async build(): Promise<Record<string, unknown>> {
    const fallback: Record<string, unknown> = {};
    const promises: Promise<void>[] = [];
    this.entries.forEach((value, key) => {
      promises.push(
        Promise.resolve(typeof value === "function" ? value() : value)
          .then((resolvedValue) => {
            if (resolvedValue !== undefined) {
              fallback[key] = resolvedValue;
            }
          })
          .catch(() => void undefined)
      );
    });
    await Promise.allSettled(promises);
    return fallback;
  }
}
