import { createContext, useContext } from "react";

export interface TaskActions {
  toggle: (id: number) => void;
  remove: (id: number) => void;
}

export const TaskActionsContext = createContext<TaskActions | null>(null);

export function useTaskActions(): TaskActions {
  const actions = useContext(TaskActionsContext);
  if (actions === null) throw new Error("useTaskActions must be used inside <TaskActionsContext>.");
  return actions;
}
