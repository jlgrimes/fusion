// Deliberately broken code. tests/runtime/messages.test.ts compiles this file
// and checks the exact text of every error, because for Fusion the error
// message is the documentation. This directory is not part of `pnpm typecheck`.

import { createContext, useCallback, useEffect, useImperativeHandle, useMemo, type Ref, type Stable } from "react";

interface User {
  id: string;
}

declare function load(): void;
declare const id: number;
declare const items: number[];
declare const keep: (n: number) => boolean;
declare const ref: Ref<{ focus(): void }>;

const UserContext = createContext<User | null>(null);

function Child(_props: { user: Stable<User>; onSelect: Stable<() => void> }) {
  return null;
}

export function Violations({ user }: { user: User }) {
  useEffect(() => {}, [{ id }]); // line 24
  useEffect(() => {}, [() => load()]); // line 25
  useEffect(() => {}, [items.filter(keep)]); // line 26
  useMemo(() => id, [{ id }]); // line 27
  useCallback(() => {}, [{ id }]); // line 28
  useImperativeHandle(ref, () => ({ focus() {} }), [{ id }]); // line 29
  useEffect(() => {}, [id, items]); // line 30
  useEffect(() => {}, [user]); // line 31
  return (
    <UserContext.Provider value={{ id: "1" }} /* line 33 */>
      <Child user={{ id: "1" }} /* line 34 */ onSelect={useCallback(() => {}, [])} />
      <Child user={useMemo(() => user, [user.id])} onSelect={() => {}} /* line 35 */ />
    </UserContext.Provider>
  );
}
