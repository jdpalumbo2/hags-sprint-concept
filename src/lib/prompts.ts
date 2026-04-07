import { promises as fs } from "fs";
import path from "path";

const cache = new Map<string, string>();

export async function loadPrompt(name: string, fresh = false): Promise<string> {
  if (!fresh && cache.has(name)) {
    return cache.get(name)!;
  }
  const filePath = path.join(process.cwd(), "prompts", `${name}.md`);
  const content = await fs.readFile(filePath, "utf-8");
  cache.set(name, content);
  return content;
}
