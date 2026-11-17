// Completely ordinary React, imported from "react". Nothing in this file
// mentions Fusion; the project's tsconfig and Vite config route "react"
// through the Fusion shim.

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { TaskActionsContext } from "./TaskActions";
import { TaskList } from "./TaskList";
import { type Filter, type Task, FILTERS } from "./tasks";

const STORAGE_KEY = "fusion-basic-tasks";

function loadTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Task[];
  } catch {
    return [];
  }
}

export function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const nextId = useRef(tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1);

  const visible = useMemo(
    () => tasks.filter((task) => filter === "all" || (filter === "done") === task.done),
    [tasks, filter],
  );
  const remaining = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);

  const toggle = useCallback((id: number) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }, []);

  const remove = useCallback((id: number) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  // A context value has to keep its identity, or every consumer re-renders.
  const actions = useMemo(() => ({ toggle, remove }), [toggle, remove]);

  // `tasks` is state, so it only changes identity when it is set.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Depends on a primitive derived from state.
  useEffect(() => {
    document.title = remaining === 0 ? "All done" : `${remaining} to do`;
  }, [remaining]);

  useEffect(() => {
    input.current?.focus();
  }, []);

  function add(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (title === "") return;
    setTasks((current) => [...current, { id: nextId.current++, title, done: false }]);
    setDraft("");
  }

  return (
    <main>
      <h1>Tasks</h1>
      <form onSubmit={add}>
        <input
          ref={input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What needs doing?"
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>
      <nav aria-label="Filter">
        {FILTERS.map((name) => (
          <button key={name} onClick={() => setFilter(name)} aria-pressed={filter === name}>
            {name}
          </button>
        ))}
      </nav>
      <TaskActionsContext value={actions}>
        <TaskList tasks={visible} />
      </TaskActionsContext>
      <p data-testid="remaining">{remaining} remaining</p>
    </main>
  );
}
