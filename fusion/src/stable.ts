/**
 * The `Stable<T>` brand: a compile-time-only marker for values whose identity
 * does not change from one render to the next.
 *
 * Nothing in this file exists at runtime except `stable()`, which is the
 * identity function.
 */

declare const stableBrand: unique symbol;

/** The marker carried by every stable non-primitive value. */
export interface StableBrand {
  readonly [stableBrand]: true;
}

/** Compared by value, so always safe to depend on. */
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * `T`, known to keep the same identity across renders.
 *
 * Primitives are left alone (they are compared by value), and the brand
 * distributes over unions, so `Stable<User | null>` is `Stable<User> | null`.
 * A `Stable<T>` is still a `T`: it can be passed anywhere a `T` is expected.
 */
export type Stable<T> = T extends Primitive ? T : T & StableBrand;

/** What a dependency array accepts: a primitive or a `Stable` value. */
export type Dep = Primitive | StableBrand;

/**
 * Marks a value as stable. Only for values created **outside render**:
 * module-level constants and functions, or singletons created once at startup.
 *
 * ```ts
 * const DEFAULT_FILTERS = stable({ status: "open" });
 * ```
 *
 * Never call this inside a component or hook body: the value would still be
 * recreated every render, and Fusion could no longer tell. Inside render, use
 * `useMemo` / `useCallback`.
 */
export function stable<T>(value: T): Stable<T> {
  return value as Stable<T>;
}
