// The shim must behave exactly like React at runtime: the redefined hooks are
// the real hooks, everything else is passed through, and there is one React.

import * as Shim from "react";
import React, {
  createContext,
  stable,
  unsafeStable,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRequire } from "node:module";
import { afterEach, expect, test } from "vitest";

// Real React, loaded without going through Vite (and therefore the shim).
const Real = createRequire(import.meta.url)("react") as Record<string, unknown>;

afterEach(cleanup);

test('"react" resolves to the Fusion shim', () => {
  expect(Shim.stable).toBeTypeOf("function");
  expect(React.stable).toBe(Shim.stable);
});

test("every export of real React is passed through unchanged", () => {
  const shim = Shim as unknown as Record<string, unknown>;
  for (const name of Object.keys(Real)) {
    expect(shim[name], `named export ${name}`).toBe(Real[name]);
    expect((React as unknown as Record<string, unknown>)[name], `default export .${name}`).toBe(Real[name]);
  }
  expect(Object.keys(shim).filter((name) => !(name in Real)).sort()).toEqual(["default", "stable", "unsafeStable"]);
});

test("stable() and unsafeStable() are the identity function", () => {
  const value = { a: 1 };
  expect(stable(value)).toBe(value);
  expect(unsafeStable(value, "test fixture")).toBe(value);
});

test("hooks run against the same React that react-dom renders with", () => {
  const log: string[] = [];

  function Counter({ step }: { step: number }) {
    const [count, setCount] = useState(0);
    const [history, record] = useReducer((items: number[], item: number) => [...items, item], []);
    const renders = useRef(0);
    renders.current += 1;
    const doubled = useMemo(() => count * 2, [count]);
    const increment = useCallback(() => setCount((value) => value + step), [step]);

    useEffect(() => {
      log.push(`effect ${count}`);
      record(count);
      return () => {
        log.push(`cleanup ${count}`);
      };
    }, [count]);

    return (
      <button onClick={increment}>
        {count} {doubled} [{history.join(",")}]
      </button>
    );
  }

  const view = render(<Counter step={2} />);
  expect(screen.getByRole("button").textContent).toBe("0 0 [0]");

  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByRole("button").textContent).toBe("2 4 [0,2]");

  // Re-rendering with unchanged deps must not re-run the effect.
  view.rerender(<Counter step={2} />);
  expect(log).toEqual(["effect 0", "cleanup 0", "effect 2"]);

  act(() => view.unmount());
  expect(log).toEqual(["effect 0", "cleanup 0", "effect 2", "cleanup 2"]);
});

test("memoised values keep their identity while their deps are unchanged", () => {
  const seen = new Set<unknown>();

  function Probe({ id }: { id: number }) {
    seen.add(useMemo(() => ({ id }), [id]));
    seen.add(useCallback(() => id, [id]));
    return null;
  }

  const view = render(<Probe id={1} />);
  view.rerender(<Probe id={1} />);
  expect(seen.size).toBe(2);
  view.rerender(<Probe id={2} />);
  expect(seen.size).toBe(4);
});

test("a Fusion context is a real React context", () => {
  const Theme = createContext("light");
  const Auth = createContext<{ name: string } | null>(null);
  const renders: string[] = [];

  function Reader() {
    const text = `${useContext(Theme)} ${useContext(Auth)?.name ?? "guest"}`;
    renders.push(text);
    return <p>{text}</p>;
  }
  const Tree = React.memo(() => <Reader />);

  function App({ name }: { name: string }) {
    const auth = useMemo(() => ({ name }), [name]);
    return (
      <Theme value="dark">
        <Auth.Provider value={auth}>
          <Tree />
        </Auth.Provider>
      </Theme>
    );
  }

  const view = render(<App name="Ada" />);
  expect(screen.getByText("dark Ada")).toBeTruthy();

  // A memoised value keeps its identity, so consumers do not re-render.
  view.rerender(<App name="Ada" />);
  expect(renders).toEqual(["dark Ada"]);

  view.rerender(<App name="Grace" />);
  expect(renders).toEqual(["dark Ada", "dark Grace"]);
});
