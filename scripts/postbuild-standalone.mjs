import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const copies = [
  [".next/static", ".next/standalone/.next/static"],
  ["public", ".next/standalone/public"],
];

for (const [source, destination] of copies) {
  const from = resolve(root, source);
  const to = resolve(root, destination);

  if (!existsSync(from)) {
    continue;
  }

  cpSync(from, to, { recursive: true, force: true });
}
