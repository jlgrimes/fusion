// Open question 1, decided: a component that depends on an object or function
// prop declares it as `Stable<T>`. That moves the requirement to the parent,
// where the value is created and where it can be fixed.

import { unsafeStable, useCallback, useEffect, useMemo, useState, type ReactNode, type Stable } from "react";

interface User {
  id: string;
  name: string;
}

// --- the child --------------------------------------------------------------

export function LooseProps(props: { user: User; onSelect: (id: string) => void; children?: ReactNode }) {
  const { user, onSelect, children } = props;

  // @ts-expect-error an object prop is not known to be stable
  useEffect(() => {}, [user]);

  // @ts-expect-error neither is a function prop
  useEffect(() => {}, [onSelect]);

  // @ts-expect-error nor children
  useEffect(() => {}, [children]);

  // @ts-expect-error nor the props object itself
  useEffect(() => {}, [props]);

  // Primitive fields of a prop are always fine.
  useEffect(() => {}, [user.id, user.name]);
  return null;
}

export function StableProps({ user, onSelect }: { user: Stable<User>; onSelect: Stable<(id: string) => void> }) {
  useEffect(() => onSelect(user.id), [user, onSelect]);
  const label = useMemo(() => user.name.toUpperCase(), [user]);
  return <p>{label}</p>;
}

/** Optional and nullable props: the brand distributes over the union. */
export function OptionalStableProps({ user, onSelect }: { user?: Stable<User | null>; onSelect?: Stable<() => void> }) {
  useEffect(() => onSelect?.(), [user, onSelect]);
  return null;
}

// --- the parent -------------------------------------------------------------

declare const plainUser: User;
declare function useNavigate(): (to: string) => void;

export function GoodParent() {
  const [user] = useState<User>({ id: "1", name: "Ada" });
  const [maybeUser] = useState<User | null>(null);
  const onSelect = useCallback((id: string) => console.log(id), []);
  const derived = useMemo(() => ({ ...user, name: user.name.trim() }), [user]);

  return (
    <>
      <StableProps user={user} onSelect={onSelect} />
      <StableProps user={derived} onSelect={onSelect} />
      <OptionalStableProps />
      <OptionalStableProps user={maybeUser} />
      <OptionalStableProps user={null} onSelect={undefined} />
    </>
  );
}

export function BadParent() {
  return (
    <>
      {/* @ts-expect-error inline object for a Stable prop */}
      <StableProps user={{ id: "1", name: "Ada" }} onSelect={useCallback(() => {}, [])} />

      {/* @ts-expect-error inline function for a Stable prop */}
      <StableProps user={useMemo(() => plainUser, [])} onSelect={(id) => console.log(id)} />

      {/* @ts-expect-error unbranded value from elsewhere */}
      <StableProps user={plainUser} onSelect={useCallback(() => {}, [])} />
    </>
  );
}

// --- the escape hatch ---------------------------------------------------------

export function EscapeHatch() {
  // A third-party hook Fusion cannot see into, with the reason on record.
  const navigate = unsafeStable(useNavigate(), "react-router keeps navigate stable between renders");
  useEffect(() => navigate("/"), [navigate]);

  const user = unsafeStable(plainUser, "module-level fixture");
  const count: number = unsafeStable(1, "primitives pass through unchanged");

  // @ts-expect-error without it, the library value is rejected
  useEffect(() => {}, [useNavigate()]);

  // @ts-expect-error a reason is required
  unsafeStable(useNavigate());

  // @ts-expect-error and it cannot be empty
  unsafeStable(useNavigate(), "");

  return <StableProps user={user} onSelect={navigate} />;
}
