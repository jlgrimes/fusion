// Fusion replaces the types of these hooks, so it must notice when upstream
// changes them. Each assertion pins the @types/react signature that
// src/hooks.ts was written against. If one fails after a React upgrade,
// update the matching interface in src/hooks.ts, then update the pin here.

import type Original from "fusion-react-original";
import type {
  ActionDispatch,
  AnyActionArg,
  DependencyList,
  Dispatch,
  EffectCallback,
  Ref,
  RefObject,
  SetStateAction,
  TransitionStartFunction,
} from "fusion-react-original";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
declare function expectTrue<T extends true>(): T;

type Effect = (effect: EffectCallback, deps?: DependencyList) => void;

expectTrue<Equal<DependencyList, readonly unknown[]>>();
expectTrue<Equal<typeof Original.useEffect, Effect>>();
expectTrue<Equal<typeof Original.useLayoutEffect, Effect>>();
expectTrue<Equal<typeof Original.useInsertionEffect, Effect>>();

expectTrue<
  Equal<
    typeof Original.useImperativeHandle,
    <T, R extends T>(ref: Ref<T> | undefined, init: () => R, deps?: DependencyList) => void
  >
>();

expectTrue<Equal<typeof Original.useMemo, <T>(factory: () => T, deps: DependencyList) => T>>();
expectTrue<Equal<typeof Original.useCallback, <T extends Function>(callback: T, deps: DependencyList) => T>>();

expectTrue<
  Equal<
    typeof Original.useState,
    {
      <S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
      <S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
    }
  >
>();

expectTrue<
  Equal<
    typeof Original.useReducer,
    {
      <S, A extends AnyActionArg>(reducer: (prevState: S, ...args: A) => S, initialState: S): [S, ActionDispatch<A>];
      <S, I, A extends AnyActionArg>(
        reducer: (prevState: S, ...args: A) => S,
        initialArg: I,
        init: (i: I) => S,
      ): [S, ActionDispatch<A>];
    }
  >
>();

expectTrue<
  Equal<
    typeof Original.useRef,
    {
      <T>(initialValue: T): RefObject<T>;
      <T>(initialValue: T | null): RefObject<T | null>;
      <T>(initialValue: T | undefined): RefObject<T | undefined>;
    }
  >
>();

expectTrue<Equal<typeof Original.useTransition, () => [boolean, TransitionStartFunction]>>();
