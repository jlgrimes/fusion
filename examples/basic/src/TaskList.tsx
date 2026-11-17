import { memo } from "react";
import type { Task } from "./tasks";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}

export const TaskList = memo(function TaskList({ tasks, onToggle, onRemove }: TaskListProps) {
  if (tasks.length === 0) return <p>Nothing here.</p>;
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <label>
            <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
            {task.title}
          </label>
          <button onClick={() => onRemove(task.id)} aria-label={`Remove ${task.title}`}>
            ×
          </button>
        </li>
      ))}
    </ul>
  );
});
