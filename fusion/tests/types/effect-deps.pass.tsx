// Rule 1, "must pass" cases: ordinary, correct React that Fusion must accept
// unchanged. Any error in this file is a false positive.

import React, {
  stable,
  useCallback,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type Ref,
  type Stable,
} from "react";
import * as ReactNamespace from "react";

interface User {
  id: string;
  name: string;
}

enum Status {
  Open,
  Closed,
}

type Action = { type: "add"; item: string } | { type: "clear" };

declare function load(id: string): Promise<User>;
declare function subscribe(id: string, onChange: () => void): () => void;
declare const sym: unique symbol;

// Module-level constants are created once, so `stable()` may bless them.
const DEFAULT_FILTERS = stable({ status: Status.Open });
const log = stable((message: string) => console.log(message));

export function NoDepsAndEmptyDeps() {
  useEffect(() => {});
  useEffect(() => {}, []);
  useEffect(() => {}, undefined);
  useLayoutEffect(() => {}, []);
  useInsertionEffect(() => {}, []);
}

export function Primitives(props: { id: string; count: number; enabled: boolean; user: User }) {
  const { id, count, enabled, user } = props;
  const big = 10n;
  const status: Status = Status.Open;
  const label = `${id}:${count}` as const;
  const maybe: string | null | undefined = enabled ? id : null;

  useEffect(() => {}, [id, count, enabled, big, sym, status, label, maybe, null, undefined]);
  // Depending on a primitive field of an unstable object is the recommended fix.
  useEffect(() => {}, [user.id, user.name.length]);
  useEffect(() => {}, [props.id]);
}

export function BlessedSources({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [lazy] = useState(() => ({ created: Date.now() }));
  const [maybe, setMaybe] = useState<User>();
  const [state, dispatch] = useReducer((items: string[], action: Action) => {
    return action.type === "add" ? [...items, action.item] : [];
  }, []);
  const [isPending, startTransition] = useTransition();
  const element = useRef<HTMLDivElement>(null);
  const latest = useRef(count);

  const doubled = useMemo(() => count * 2, [count]);
  const options = useMemo(() => ({ userId, tags }), [userId, tags]);
  const refresh = useCallback(() => load(userId).then(setUser), [userId]);
  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setTags([event.target.value]), []);

  // State and its setter, reducer state and dispatch, refs, memoised values.
  useEffect(() => {}, [count, setCount, user, setUser, tags, setTags, lazy, maybe, setMaybe]);
  useEffect(() => {}, [state, dispatch, isPending, startTransition, element, latest]);
  useEffect(() => {}, [doubled, options, refresh, onChange]);
  // Module-level values blessed with stable().
  useEffect(() => {}, [DEFAULT_FILTERS, log]);

  // Stable values feed other memoised values.
  const summary = useMemo(() => `${options.userId}: ${state.length}`, [options, state]);
  const reset = useCallback(() => dispatch({ type: "clear" }), [dispatch]);

  return (
    <div ref={element} onClick={reset}>
      <input onChange={onChange} />
      {summary}
    </div>
  );
}

export function RealisticEffects({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    load(userId).then((loaded) => {
      if (!cancelled) setUser(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => subscribe(userId, () => setUser(null)), [userId]);

  useLayoutEffect(() => {
    document.title = user?.name ?? "Loading";
  }, [user]);

  return <p>{user?.name}</p>;
}

export function EveryWayOfReachingTheHook({ id }: { id: string }) {
  React.useEffect(() => {}, [id]);
  ReactNamespace.useEffect(() => {}, [id]);
  const value = React.useMemo(() => ({ id }), [id]);
  ReactNamespace.useLayoutEffect(() => {}, [value]);
}

export function ExplicitTypeArguments({ id }: { id: string }) {
  const list = useMemo<string[]>(() => [id], [id]);
  const callback = useCallback<(n: number) => string>((n) => `${id}${n}`, [id]);
  const count = useRef<number>(0);
  useEffect(() => {}, [list, callback, count]);
}

export function ImperativeHandle({ ref, id }: { ref: Ref<{ focus(): void }>; id: string }) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }), [id, input]);
  useImperativeHandle(ref, () => ({ focus() {} }));
  return <input ref={input} />;
}

// --- Stable<T> is still a T ---------------------------------------------------

declare function takesUser(user: User): void;
declare function takesList(list: string[]): void;
declare function takesCallback(callback: () => void): void;

export function StableValuesAreOrdinaryValues() {
  const [user, setUser] = useState<User>({ id: "1", name: "Ada" });
  const [tags, setTags] = useState<string[]>([]);
  const doubled: number = useMemo(() => 2, []);
  const label: string = useMemo(() => "label", []);
  const save = useCallback(() => {}, []);

  takesUser(user);
  takesList(tags);
  takesCallback(save);
  setUser({ ...user, name: "Grace" });
  setUser((previous) => ({ ...previous, name: "Grace" }));
  setTags([...tags, "new"]);
  tags.push("mutation is not Fusion's business");

  const plainUser: User = user;
  const plainTags: string[] = tags.map((tag) => tag.toUpperCase());
  return [doubled, label, plainUser, plainTags];
}

// --- custom hooks ----------------------------------------------------------------

/** A custom hook passes stability on by saying so in its return type. */
function useUser(id: string): Stable<User | null> {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    load(id).then(setUser);
  }, [id]);
  return user;
}

/** Inferred return types carry the brand without any annotation. */
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((value) => !value), []);
  return [on, toggle] as const;
}

/** Generic hooks work too: Stable<T> is assignable to T. */
function useLatest<T>(value: T) {
  const [current, setCurrent] = useState(value);
  const plain: T = current;
  return { current, plain, setCurrent };
}

export function CustomHooks({ id }: { id: string }) {
  const user = useUser(id);
  const [on, toggle] = useToggle();
  const { current, setCurrent } = useLatest({ id });
  useEffect(() => {}, [user, on, toggle, current, setCurrent]);
}

// --- stable deps accept stable props -----------------------------------------------

export function StableProps({ user, onSelect }: { user: Stable<User>; onSelect: Stable<(id: string) => void> }) {
  useEffect(() => onSelect(user.id), [user, onSelect]);
  return null;
}

export function Parent() {
  const [user] = useState<User>({ id: "1", name: "Ada" });
  const onSelect = useCallback((id: string) => console.log(id), []);
  return <StableProps user={user} onSelect={onSelect} />;
}
