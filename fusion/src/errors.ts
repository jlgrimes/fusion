/**
 * Type-level error messages.
 *
 * When a rule is violated, the offending expression is checked against one of
 * these string-literal types, so the message itself shows up in the compiler
 * error: `Type '{ id: number; }' is not assignable to type '"Dependency is not
 * stable: ..."'`. The message is the documentation, so each one says what is
 * wrong and what to write instead.
 *
 * TypeScript truncates a printed type at 320 characters, so every complete
 * message has to stay under that. tests/runtime/messages.test.ts checks the
 * exact text the compiler prints, and fails if a message is cut off.
 */

import type { Dep } from "./stable";

interface Consequence {
  effect: "this effect can re-run every render";
  memo: "this value is not reliably memoised";
  callback: "this callback is not reliably memoised";
  handle: "this handle can be recreated every render";
}

/** Which kind of hook the dependency array belongs to. */
export type DepsKind = keyof Consequence;

type Fix<T> = [T] extends [(...args: never[]) => unknown]
  ? "Wrap it in useCallback, or move it out of the component and wrap it in stable()."
  : "Wrap it in useMemo/useCallback, or depend on a primitive (e.g. user.id) instead.";

type Elsewhere =
  "If it is a prop, type the prop as Stable<T>. If a library keeps it stable, use unsafeStable(value, reason).";

/** The error shown for a dependency of type `T` that is not stable. */
export type UnstableDependency<K extends DepsKind, T = unknown> =
  `Dependency is not stable: it can change identity every render, so ${Consequence[K]}. ${Fix<T>} ${Elsewhere}`;

/**
 * Checks a dependency list element by element. Stable elements pass through
 * unchanged; anything else is replaced by the error message, which makes the
 * compiler report it on that exact element.
 */
export type StableDeps<D extends readonly unknown[], K extends DepsKind> = {
  readonly [I in keyof D]: [D[I]] extends [Dep] ? D[I] : UnstableDependency<K, D[I]>;
};
