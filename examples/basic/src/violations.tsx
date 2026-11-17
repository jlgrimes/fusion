// What Fusion rejects. This file is type-checked with the rest of the example,
// and every `@ts-expect-error` here is required: if "react" stopped resolving
// to Fusion for tsc, these directives would be unused and `pnpm typecheck`
// would fail. Delete a directive to see the error message an agent would get.

import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskActionsContext } from "./TaskActions";
import type { Task } from "./tasks";

declare function track(event: string, payload?: unknown): void;

// --- Rule 1: dependency arrays only accept stable values ----------------------

export function UnstableDependencies({ ownerId }: { ownerId: number }) {
  const [tasks] = useState<Task[]>([]);

  // @ts-expect-error inline object: a new one every render
  useEffect(() => track("owner", { ownerId }), [{ ownerId }]);

  // @ts-expect-error inline function: a new one every render
  useEffect(() => track("mount"), [() => track("mount")]);

  // @ts-expect-error derived array: a new one every render
  useEffect(() => track("done", tasks), [tasks.filter((task) => task.done)]);

  // The fixes: depend on the primitive, or on the state itself.
  useEffect(() => track("owner", { ownerId }), [ownerId]);
  useEffect(() => track("done", tasks), [tasks]);

  return null;
}

// --- Rule 2: a context provider only accepts a stable value --------------------

export function UnstableContextValue() {
  const toggle = useCallback((id: number) => track("toggle", id), []);
  const remove = useCallback((id: number) => track("remove", id), []);

  return (
    <>
      {/* @ts-expect-error a new object every render re-renders every consumer */}
      <TaskActionsContext value={{ toggle, remove }} />

      {/* The fix: memoise it. */}
      <TaskActionsContext value={useMemo(() => ({ toggle, remove }), [toggle, remove])} />
    </>
  );
}
