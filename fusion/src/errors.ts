/**
 * Type-level error messages.
 *
 * When a rule is violated, the offending expression is checked against one of
 * these string-literal types, so the message itself shows up in the compiler
 * error: `Type '{ id: number; }' is not assignable to type '"Dependency is not
 * stable: ..."'`. The message is the documentation, so each one says what is
 * wrong and what to write instead.
 */

import type { Dep } from "./stable";

interface Consequence {
  effect: "this effect will re-run every render";
  memo: "this value will be recomputed every render and is not actually memoised";
  callback: "this callback will be recreated every render and is not actually memoised";
  handle: "this imperative handle will be recreated every render";
}

/** Which kind of hook the dependency array belongs to. */
export type DepsKind = keyof Consequence;

type Fix<T> = [T] extends [(...args: never[]) => unknown]
  ? "Wrap it in useCallback, or move it outside the component and wrap it in stable()."
  : "Wrap it in useMemo/useCallback, or depend on a primitive (e.g. user.id) instead.";

/** The error shown for a dependency of type `T` that is not stable. */
export type UnstableDependency<K extends DepsKind, T = unknown> =
  `Dependency is not stable: it's recreated every render, so ${Consequence[K]}. ${Fix<T>}`;

/**
 * Checks a dependency list element by element. Stable elements pass through
 * unchanged; anything else is replaced by the error message, which makes the
 * compiler report it on that exact element.
 */
export type StableDeps<D extends readonly unknown[], K extends DepsKind> = {
  readonly [I in keyof D]: [D[I]] extends [Dep] ? D[I] : UnstableDependency<K, D[I]>;
};
