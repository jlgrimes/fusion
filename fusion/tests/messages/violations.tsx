// Deliberately broken code. tests/runtime/messages.test.ts compiles this file
// and checks the exact text of every error, because for Fusion the error
// message is the documentation. This directory is not part of `pnpm typecheck`.

import { useCallback, useEffect, useImperativeHandle, useMemo, type Ref } from "react";

declare function load(): void;
declare const id: number;
declare const items: number[];
declare const keep: (n: number) => boolean;
declare const ref: Ref<{ focus(): void }>;

export function Violations() {
  useEffect(() => {}, [{ id }]); // line 14
  useEffect(() => {}, [() => load()]); // line 15
  useEffect(() => {}, [items.filter(keep)]); // line 16
  useMemo(() => id, [{ id }]); // line 17
  useCallback(() => {}, [{ id }]); // line 18
  useImperativeHandle(ref, () => ({ focus() {} }), [{ id }]); // line 19
  useEffect(() => {}, [id, items]); // line 20
}
