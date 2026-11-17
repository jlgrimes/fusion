import { memo } from "react";
import { useTaskActions } from "./TaskActions";
import type { Task } from "./tasks";

export const TaskList = memo(function TaskList({ tasks }: { tasks: Task[] }) {
  const { toggle, remove } = useTaskActions();

  if (tasks.length === 0) return <p>Nothing here.</p>;
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <label>
            <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)} />
            {task.title}
          </label>
          <button onClick={() => remove(task.id)} aria-label={`Remove ${task.title}`}>
            ×
          </button>
        </li>
      ))}
    </ul>
  );
});
