// Rule 2, "must fail" cases: a context provider only accepts a stable value.

import React, { createContext, useState, type Context } from "react";

interface User {
  id: string;
  name: string;
}

interface Auth {
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<Auth | null>(null);
const ListContext = createContext<string[]>([]);
const CallbackContext = createContext<() => void>(() => {});
const Annotated: Context<Auth | null> = createContext<Auth | null>(null);

declare const plainAuth: Auth;

export function SpecCase() {
  const [user, setUser] = useState<User | null>(null);
  const logout = () => setUser(null);

  return (
    // @ts-expect-error the case from the spec: a fresh object every render
    <AuthContext.Provider value={{ user, logout }}>
      <p />
    </AuthContext.Provider>
  );
}

export function EveryWayOfProviding() {
  const [user] = useState<User | null>(null);
  const logout = () => {};
  const value = { user, logout };

  return (
    <>
      {/* @ts-expect-error React 19 style: the context itself as the provider */}
      <AuthContext value={{ user, logout }} />

      {/* @ts-expect-error object built in render, then referenced by name */}
      <AuthContext.Provider value={value} />

      {/* @ts-expect-error unbranded object from elsewhere */}
      <AuthContext.Provider value={plainAuth} />

      {/* @ts-expect-error inline array */}
      <ListContext.Provider value={[user?.name ?? ""]} />

      {/* @ts-expect-error inline function */}
      <CallbackContext.Provider value={() => {}} />

      {/* @ts-expect-error a context annotated as React.Context<T> is checked too */}
      <Annotated.Provider value={{ user, logout }} />

      {/* @ts-expect-error createElement is checked like JSX */}
      {React.createElement(AuthContext.Provider, { value: { user, logout } })}
    </>
  );
}
