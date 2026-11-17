/**
 * The `Stable<T>` brand: a compile-time-only marker for values whose identity
 * does not change from one render to the next.
 *
 * Nothing in this file exists at runtime except `stable()` and
 * `unsafeStable()`, which are both the identity function.
 */

declare const stableIdentity: unique symbol;

/**
 * The marker carried by every stable non-primitive value.
 *
 * `_Hint` is not used by the type itself, so every `StableIdentity<...>` is
 * interchangeable with every other. It exists because TypeScript prints it:
 * when an unstable value is passed where a stable one is required, the error
 * names this interface, hint included, and the hint says how to fix it.
 */
export interface StableIdentity<_Hint extends string = string> {
  readonly [stableIdentity]: true;
}

type StableHint =
  "This value must keep its identity between renders, but it can be recreated on every render. Create it with useMemo (objects, arrays) or useCallback (functions) and pass that; state, refs and stable() module constants are already stable.";

type ContextHint =
  "A context value must keep its identity between renders, otherwise every consumer of the context re-renders whenever the provider does. Create it with useMemo, e.g. useMemo(() => ({ user, logout }), [user, logout]).";

/** Compared by value, so always safe to depend on. */
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/** A non-primitive `T` that is known to be stable. Use `Stable<T>` instead. */
export type StableValue<T> = T & StableIdentity<StableHint>;

/**
 * `T`, known to keep the same identity across renders.
 *
 * Primitives are left alone (they are compared by value), and the brand
 * distributes over unions, so `Stable<User | null>` is `Stable<User> | null`.
 * A `Stable<T>` is still a `T`: it can be passed anywhere a `T` is expected.
 *
 * Use it in a props type when a component depends on an object or function
 * prop: `{ user: Stable<User> }` makes the parent pass a stable value.
 */
export type Stable<T> = T extends Primitive ? T : StableValue<T>;

/** A non-primitive context value. Use `StableContextValue<T>` instead. */
export type ContextValue<T> = T & StableIdentity<ContextHint>;

/**
 * What a context holds: the same as `Stable<T>`, with an error hint written
 * for the place where it is provided.
 */
export type StableContextValue<T> = T extends Primitive ? T : ContextValue<T>;

/** What a dependency array accepts: a primitive or a stable value. */
export type Dep = Primitive | StableIdentity;

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

type Reason<R extends string> = R extends "" ? "Say why this value is stable." : R;

/**
 * The escape hatch: asserts that a value Fusion cannot see into is stable,
 * and records why. For values from code that is not typed with `Stable`,
 * typically a third-party hook that documents a stable return value.
 *
 * ```ts
 * const navigate = unsafeStable(useNavigate(), "react-router keeps navigate stable");
 * ```
 *
 * Fusion takes your word for it. If the claim is wrong, the effect, memo or
 * context it feeds re-runs every render, which is the bug Fusion exists to
 * prevent, so do not use this on a value you could memoise instead.
 */
export function unsafeStable<T, const R extends string>(value: T, reason: Reason<R>): Stable<T> {
  void reason;
  return value as Stable<T>;
}
