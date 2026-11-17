import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const tsc = resolve(dirname(createRequire(import.meta.url).resolve("typescript/package.json")), "bin/tsc");

const EFFECT = "this effect will re-run every render";
const MEMO = "this value will be recomputed every render and is not actually memoised";
const CALLBACK = "this callback will be recreated every render and is not actually memoised";
const HANDLE = "this imperative handle will be recreated every render";
const FIX_VALUE = "Wrap it in useMemo/useCallback, or depend on a primitive (e.g. user.id) instead.";
const FIX_FUNCTION = "Wrap it in useCallback, or move it outside the component and wrap it in stable().";

const message = (consequence: string, fix: string) =>
  `"Dependency is not stable: it's recreated every render, so ${consequence}. ${fix}"`;

test("each violation reports a message that says what is wrong and how to fix it", () => {
  const result = spawnSync(process.execPath, [tsc, "--noEmit", "--pretty", "false", "-p", resolve(here, "../messages")], {
    encoding: "utf8",
  });
  const errors = result.stdout
    .split("\n")
    .filter((line) => line.includes("error TS"))
    .map((line) => line.replace(/^.*violations\.tsx\((\d+),(\d+)\): error TS\d+: /, "$1:$2 "));

  expect(errors).toEqual([
    `14:24 Type '{ id: number; }' is not assignable to type '${message(EFFECT, FIX_VALUE)}'.`,
    `15:24 Type '() => void' is not assignable to type '${message(EFFECT, FIX_FUNCTION)}'.`,
    `16:24 Type 'number[]' is not assignable to type '${message(EFFECT, FIX_VALUE)}'.`,
    `17:22 Type '{ id: number; }' is not assignable to type '${message(MEMO, FIX_VALUE)}'.`,
    `18:26 Type '{ id: number; }' is not assignable to type '${message(CALLBACK, FIX_VALUE)}'.`,
    `19:53 Type '{ id: number; }' is not assignable to type '${message(HANDLE, FIX_VALUE)}'.`,
    // Only the offending element is flagged; `id` (20:24) is fine.
    `20:28 Type 'number[]' is not assignable to type '${message(EFFECT, FIX_VALUE)}'.`,
  ]);
}, 60_000);
