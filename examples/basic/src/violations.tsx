// What Fusion rejects. This file is type-checked with the rest of the example,
// and every `@ts-expect-error` here is required: if "react" stopped resolving
// to Fusion for tsc, these directives would be unused and `pnpm typecheck`
// would fail. Delete a directive to see the error message an agent would get.

import { useEffect, useState } from "react";
import type { Task } from "./tasks";

declare function track(event: string, payload?: unknown): void;

export function Violations({ ownerId }: { ownerId: number }) {
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
