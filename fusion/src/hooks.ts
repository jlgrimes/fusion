/**
 * The hooks Fusion redefines. Each one *is* the real React hook at runtime
 * (same function object, zero overhead); only the type is replaced.
 */

import Original from "fusion-react-original";
import type {
  ActionDispatch,
  AnyActionArg,
  Dispatch,
  EffectCallback,
  Ref,
  RefObject,
  SetStateAction,
  TransitionStartFunction,
} from "fusion-react-original";
import type { StableDeps } from "./errors";
import type { Dep, Stable } from "./stable";

type Deps = readonly unknown[];

/**
 * Used when the dependency tuple cannot be inferred because the caller passed
 * explicit type arguments, e.g. `useMemo<User[]>(() => ..., [id])`. The rule
 * still applies; only the tailored error message is lost.
 */
type AnyStableDeps = readonly Dep[];

// --- Rule 1: dependency arrays only accept stable values -------------------

interface UseEffect {
  <const D extends Deps>(effect: EffectCallback, deps?: StableDeps<D, "effect">): void;
}

interface UseImperativeHandle {
  <T, R extends T, const D extends Deps = AnyStableDeps>(
    ref: Ref<T> | undefined,
    init: () => R,
    deps?: StableDeps<D, "handle">,
  ): void;
}

interface UseMemo {
  <T, const D extends Deps = AnyStableDeps>(factory: () => T, deps: StableDeps<D, "memo">): Stable<T>;
}

interface UseCallback {
  <T extends Function, const D extends Deps = AnyStableDeps>(
    callback: T,
    deps: StableDeps<D, "callback">,
  ): Stable<T>;
}

export const useEffect = Original.useEffect as UseEffect;
export const useLayoutEffect = Original.useLayoutEffect as UseEffect;
export const useInsertionEffect = Original.useInsertionEffect as UseEffect;
export const useImperativeHandle = Original.useImperativeHandle as UseImperativeHandle;
export const useMemo = Original.useMemo as UseMemo;
export const useCallback = Original.useCallback as UseCallback;

// --- Blessed sources of stable values --------------------------------------

interface UseState {
  <S>(initialState: S | (() => S)): [Stable<S>, Stable<Dispatch<SetStateAction<S>>>];
  <S = undefined>(): [Stable<S | undefined>, Stable<Dispatch<SetStateAction<S | undefined>>>];
}

interface UseReducer {
  <S, A extends AnyActionArg>(
    reducer: (prevState: S, ...args: A) => S,
    initialState: S,
  ): [Stable<S>, Stable<ActionDispatch<A>>];
  <S, I, A extends AnyActionArg>(
    reducer: (prevState: S, ...args: A) => S,
    initialArg: I,
    init: (i: I) => S,
  ): [Stable<S>, Stable<ActionDispatch<A>>];
}

interface UseRef {
  <T>(initialValue: T): Stable<RefObject<T>>;
  <T>(initialValue: T | null): Stable<RefObject<T | null>>;
  <T>(initialValue: T | undefined): Stable<RefObject<T | undefined>>;
}

interface UseTransition {
  (): [boolean, Stable<TransitionStartFunction>];
}

export const useState = Original.useState as UseState;
export const useReducer = Original.useReducer as UseReducer;
export const useRef = Original.useRef as UseRef;
export const useTransition = Original.useTransition as UseTransition;
