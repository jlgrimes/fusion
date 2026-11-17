import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const tsc = resolve(dirname(createRequire(import.meta.url).resolve("typescript/package.json")), "bin/tsc");

// --- Rule 1: an unstable value in a dependency array --------------------------

const EFFECT = "this effect can re-run every render";
const MEMO = "this value is not reliably memoised";
const CALLBACK = "this callback is not reliably memoised";
const HANDLE = "this handle can be recreated every render";
const FIX_VALUE = "Wrap it in useMemo/useCallback, or depend on a primitive (e.g. user.id) instead.";
const FIX_FUNCTION = "Wrap it in useCallback, or move it out of the component and wrap it in stable().";
const ELSEWHERE =
  "If it is a prop, type the prop as Stable<T>. If a library keeps it stable, use unsafeStable(value, reason).";

const dependency = (type: string, consequence: string, fix: string) =>
  `Type '${type}' is not assignable to type '"Dependency is not stable: it can change identity every render, ` +
  `so ${consequence}. ${fix} ${ELSEWHERE}"'.`;

// --- an unstable value where Stable<T> is required: a prop or a context -------

const STABLE_HINT =
  "This value must keep its identity between renders, but it can be recreated on every render. " +
  "Create it with useMemo (objects, arrays) or useCallback (functions) and pass that; " +
  "state, refs and stable() module constants are already stable.";
const CONTEXT_HINT =
  "A context value must keep its identity between renders, otherwise every consumer of the context re-renders " +
  "whenever the provider does. Create it with useMemo, e.g. useMemo(() => ({ user, logout }), [user, logout]).";

const missingBrand = (type: string, required: string, hint: string) =>
  `Type '${type}' is not assignable to type '${required}'. ` +
  `Property '[stableIdentity]' is missing in type '${type}' but required in type 'StableIdentity<"${hint}">'.`;

/** Compiles the fixture and returns one "line:column message" string per error. */
function compileViolations(): string[] {
  const result = spawnSync(process.execPath, [tsc, "--noEmit", "--pretty", "false", "-p", resolve(here, "../messages")], {
    encoding: "utf8",
  });
  const errors: string[] = [];
  for (const line of result.stdout.split("\n")) {
    const start = /^.*violations\.tsx\((\d+),(\d+)\): error TS\d+: (.*)$/.exec(line);
    if (start) errors.push(`${start[1]}:${start[2]} ${start[3]}`);
    else if (line.trim() !== "" && errors.length > 0) errors[errors.length - 1] += ` ${line.trim()}`;
  }
  return errors;
}

test("each violation reports a message that says what is wrong and how to fix it", () => {
  const errors = compileViolations();

  // TypeScript cuts printed types off at 320 characters; a truncated message has lost its fix.
  for (const error of errors) expect(error).not.toContain("...");

  expect(errors).toEqual([
    `24:24 ${dependency("{ id: number; }", EFFECT, FIX_VALUE)}`,
    `25:24 ${dependency("() => void", EFFECT, FIX_FUNCTION)}`,
    `26:24 ${dependency("number[]", EFFECT, FIX_VALUE)}`,
    `27:22 ${dependency("{ id: number; }", MEMO, FIX_VALUE)}`,
    `28:26 ${dependency("{ id: number; }", CALLBACK, FIX_VALUE)}`,
    `29:53 ${dependency("{ id: number; }", HANDLE, FIX_VALUE)}`,
    // Only the offending element is flagged; `id` (30:24) is fine.
    `30:28 ${dependency("number[]", EFFECT, FIX_VALUE)}`,
    // A prop: the message says how to declare it.
    `31:24 ${dependency("User", EFFECT, FIX_VALUE)}`,
    // Rule 2: a fresh object as a context value.
    `33:27 ${missingBrand("{ id: string; }", "ContextValue<User>", CONTEXT_HINT)}`,
    // A fresh object and a fresh function passed to Stable<T> props.
    `34:14 ${missingBrand("{ id: string; }", "StableValue<User>", STABLE_HINT)}`,
    `35:52 Type '() => void' is not assignable to type 'StableValue<() => void>'. ` +
      `Type '() => void' is not assignable to type 'StableIdentity<"${STABLE_HINT}">'.`,
  ]);
}, 60_000);
