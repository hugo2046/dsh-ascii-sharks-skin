import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const OUT = "lib/client.js";
const NAME = "dsh-sharks-skin";

const result = await build({
  entryPoints: ["src/entry.js"],
  bundle: true,
  external: ["react"],
  platform: "browser",
  format: "cjs",
  target: "es2022",
  write: false,
  jsx: "automatic",
  legalComments: "none",
  sourcemap: false,
  minify: true,
  logLevel: "warning",
});

const bundled = result.outputFiles[0]?.text ?? "";
const indented = bundled.split("\n").map((l) => (l ? "\t\t" + l : l)).join("\n");

const BANNER = `/*!
 * dsh-sharks-skin — MIT
 * 引擎移植自 stackedlol/ascii-sharks (c) 2026 drewdi，经 OGHong/dsh-ascii-sharks 整理。
 */
`;

const wrapped = `${BANNER}window.__ModuleLoader__.load({
\tid: ${JSON.stringify(NAME)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
${indented}
\t\treturn module.exports;
\t}
});
`;

await mkdir("lib", { recursive: true });
await writeFile(OUT, wrapped, "utf8");
console.log(OUT, (Buffer.byteLength(wrapped) / 1024).toFixed(1), "KB");
