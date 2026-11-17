// Rule 1, "must fail" cases. Every `@ts-expect-error` below must be needed:
// if Fusion stops rejecting one of these, tsc reports an unused directive.

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  type Ref,
} from "react";
import * as ReactNamespace from "react";

interface User {
  id: string;
  name: string;
}

declare function load(): void;
declare const id: number;
declare const items: number[];
declare const user: User;
declare const maybeUser: User | null;
declare const keep: (n: number) => boolean;
declare const ref: Ref<{ focus(): void }>;

export function SpecCases() {
  // --- the three cases from the spec ---

  // @ts-expect-error inline object
  useEffect(() => {}, [{ id }]);

  // @ts-expect-error inline function
  useEffect(() => {}, [() => load()]);

  // @ts-expect-error derived array
  useEffect(() => {}, [items.filter(keep)]);
}

export function OtherUnstableValues() {
  // @ts-expect-error inline array
  useEffect(() => {}, [[id]]);

  // @ts-expect-error object created during render
  useEffect(() => {}, [new Date()]);

  // @ts-expect-error unbranded object
  useEffect(() => {}, [user]);

  // @ts-expect-error unbranded object in a union with a primitive
  useEffect(() => {}, [maybeUser]);

  // @ts-expect-error unbranded function
  useEffect(() => {}, [load]);

  // @ts-expect-error one bad dependency among good ones
  useEffect(() => {}, [id, user.id, { id }]);

  const local = { id };
  // @ts-expect-error object built in render, then referenced by name
  useEffect(() => {}, [local]);

  const handler = () => load();
  // @ts-expect-error function built in render, then referenced by name
  useEffect(() => {}, [handler]);

  const deps = [id, items];
  // @ts-expect-error a dependency list held in a variable is still checked
  useEffect(() => {}, deps);
}

export function EveryWayOfReachingTheHook() {
  // @ts-expect-error default import
  React.useEffect(() => {}, [{ id }]);

  // @ts-expect-error namespace import
  ReactNamespace.useEffect(() => {}, [{ id }]);

  // @ts-expect-error useLayoutEffect
  useLayoutEffect(() => {}, [{ id }]);

  // @ts-expect-error useInsertionEffect
  useInsertionEffect(() => {}, [{ id }]);

  // @ts-expect-error useImperativeHandle
  useImperativeHandle(ref, () => ({ focus() {} }), [{ id }]);
}

export function MemoisationIsOnlyStableIfItsOwnDepsAre() {
  // @ts-expect-error useMemo
  useMemo(() => id * 2, [{ id }]);

  // @ts-expect-error useCallback
  useCallback(() => load(), [() => load()]);

  // @ts-expect-error still checked when type arguments are explicit
  useMemo<number[]>(() => [id], [items]);

  // @ts-expect-error still checked when type arguments are explicit
  useCallback<() => void>(() => load(), [user]);
}
