# Fusion — Spec v0.1

> A typed drop-in layer over React that makes agent-written React production-grade.
> Agents write completely normal React. Fusion makes the wrong things fail to compile.

---

## 1. Thesis: the semantic gap

The further the text of the code is from what actually happens at runtime, the worse an AI agent is at writing it.

- **Code says exactly what it does** → agents are excellent.
- **Code hints at what it does** → agents are okay.
- **Code can't tell you what it does** → agents pattern-match instead of reasoning, and fail.

React's hardest production problems all live in that gap. A `useEffect` dependency array doesn't say *when* something runs; the real behaviour depends on referential equality, render order and Strict Mode. Memoisation, context re-renders and data fetching work the same way. The knowledge that makes React "production" lives in senior engineers' heads, not in the code.

**Fusion's job is to close the gap by moving those heuristics into the type system,** so the compiler enforces them and the error message teaches the agent.

## 2. Design principles

1. **Identical names, identical imports. Non-negotiable.** Agents keep writing `import { useEffect } from "react"`. No `useSyncEffect`, no `fusion/hooks`. LLMs are trained on millions of React files; any renamed API throws that away.
2. **Types over comments.** Rules are enforced by TypeScript, not by comment conventions or custom DSLs. Type errors are precise and agents already know how to fix them.
3. **Errors are the documentation.** Agents don't read the library upfront; they write React, hit an error and fix it. Every rule must produce an error message that says what's wrong *and* what to do instead.
4. **Pass everything else through.** Only redefine what Fusion enforces. Everything else re-exports real React untouched, which keeps React upgrades cheap.
5. **Zero runtime cost where possible.** Most enforcement is type-level. Runtime wrappers should be thin pass-throughs to real React.

## 3. Non-goals (for now)

- Not a new language, compiler or renderer.
- Not a replacement for React or its reconciler.
- Not a lint-rule-first project. ESLint is only used for guard rails around the shim itself.

## 4. Architecture: the `react` shim

Fusion ships a shim module that the project resolves *as* `"react"`.

```
fusion/
  src/
    react.ts          # the shim: re-exports real React, overrides selected hooks
    stable.ts         # Stable<T> brand + helpers
    errors.ts         # readable type-level error messages
  types/
    react.d.ts        # public types for the shim
```

### 4.1 Resolution

The shim must be reachable as `"react"` while itself importing *real* React without looping back. Suggested approach (Claude Code: verify and adjust):

- Real React is reachable via a private specifier, e.g. `fusion-react-original`.
- **TypeScript (`tsconfig.json`)**
  ```jsonc
  "paths": {
    "react": ["./fusion/types/react.d.ts"],
    "fusion-react-original": ["./node_modules/@types/react/index.d.ts"]
  }
  ```
- **Bundler (Vite example)**
  ```ts
  resolve: {
    alias: [
      { find: /^react$/, replacement: path.resolve("fusion/src/react.ts") },
      { find: "fusion-react-original", replacement: require.resolve("react") },
    ],
  }
  ```
- Use an **exact-match** alias (`/^react$/`) so `react/jsx-runtime`, `react-dom` and other subpaths keep resolving to real React.
- Real React must still be a **single copy** in the bundle (aliasing to `require.resolve("react")` should guarantee this). Add a test that fails on duplicate React.

### 4.2 Shim contents

```ts
// fusion/src/react.ts
export * from "fusion-react-original";
export { default } from "fusion-react-original";
export { useEffect, useLayoutEffect, useMemo, useCallback, useContext, createContext } from "./hooks";
```

Overridden hooks are thin wrappers that call the real implementation; the value is in their **types**.

### 4.3 Guard rail (only lint rule needed initially)

- Forbid importing `fusion-react-original` anywhere outside `fusion/src/`. This stops agents from bypassing the shim after seeing it in an error.

Because `"react"` itself resolves to the shim, there's no need to ban `useEffect` imports.

## 5. Rule 1: stable effect dependencies (MVP)

**Problem:** agents put inline objects, arrays and functions in dependency arrays, causing effects to re-run every render and infinite loops.

**Rule:** `useEffect` / `useLayoutEffect` dependency arrays only accept **stable** values.

```ts
declare const stableBrand: unique symbol;
export type Stable<T> = T & { readonly [stableBrand]: true };

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
export type Dep = Primitive | Stable<unknown>;

export function useEffect(effect: EffectCallback, deps?: readonly Dep[]): void;
```

**Blessed sources of `Stable` values:**

| Source | Why it's stable |
|---|---|
| Primitives | Compared by value |
| `useState` setter | Guaranteed stable by React |
| `useRef` result | Same object every render |
| `useMemo` / `useCallback` return | Fusion types them as `Stable<T>` |
| Module-level constants | Explicit `stable(x)` helper, documented as "defined outside render only" |

**Must fail to compile:**

```ts
useEffect(() => { /* ... */ }, [{ id }]);          // inline object
useEffect(() => { /* ... */ }, [() => load()]);    // inline function
useEffect(() => { /* ... */ }, [items.filter(f)]); // derived array
```

**Error message target** (via branded error types):

> `Dependency is not stable: it's recreated every render, so this effect will re-run every render. Wrap it in useMemo/useCallback, or depend on a primitive (e.g. user.id) instead.`

## 6. Rule 2: stable context values

**Problem:** passing a fresh object to a context Provider re-renders every consumer on every render.

**Rule:** `createContext<T>()` returns a context whose `Provider` `value` must be `Stable<T>` (or a primitive). `useContext` keeps its normal signature and name.

**Must fail:** `<AuthContext.Provider value={{ user, logout }}>`
**Must pass:** `<AuthContext.Provider value={useMemo(() => ({ user, logout }), [user, logout])}>`

## 7. Roadmap

### Phase 1 — MVP (this repo's first milestone)
- [ ] Shim + resolution for TypeScript and Vite
- [ ] `Stable<T>` brand and blessed sources
- [ ] Rule 1 (effect deps) and Rule 2 (context values)
- [ ] Readable error messages for both
- [ ] Guard-rail lint rule
- [ ] Example app in `examples/basic` using plain `import ... from "react"`

### Phase 2 — the "why" in the signature
- Explore requiring an effect *kind* (`"subscribe" | "sync-external" | "dom-measure" | ...`) and enforcing invariants per kind (e.g. `subscribe` must return a cleanup function). Trade-off: this changes the call shape of `useEffect`, which cuts against principle 1. Prototype both an extra argument and a return-type-based approach and compare how often an agent gets it right on the first try.

### Phase 3 — data caching by default
- Agents fetch on every page load unless told otherwise. Make the cached path the default path: raw `fetch` inside components/effects becomes an error pointing to a cached data layer (likely built on TanStack Query, keeping familiar names).

### Phase 4 — deduplication
- Detect duplicated components/logic and push agents toward existing ones. Approach TBD.

## 8. Testing

- **Type tests:** a `tests/types/` directory of fixtures using `// @ts-expect-error` for every "must fail" case and plain code for every "must pass" case. CI runs `tsc --noEmit` on them.
- **Runtime tests:** confirm the shim behaves identically to React (Vitest + React Testing Library), and that only one copy of React is bundled.
- **Agent eval (later):** give a coding agent a set of standard React tasks in a Fusion project vs. a plain project, and measure first-try compile rate, number of fix iterations, and bugs (re-render counts, fetch counts) in the result.

## 9. Open questions

1. **Object props as deps.** A component that receives an object prop and depends on it in an effect won't type-check, because props aren't branded. Options: require object/function props to be typed `Stable<T>` (pushes stability to the parent, arguably correct), or allow props through with a softer rule. Decide in Phase 1.
2. **React Compiler.** The compiler memoises automatically at build time, but the type system can't see that. Does Fusion conflict with it, complement it, or make parts of it redundant?
3. **Other bundlers.** Vite first. Next.js (webpack/Turbopack) aliasing needs its own config and testing.
4. **`@types/react` drift.** Pin a supported React version range and add a CI check that fails loudly when an overridden hook's upstream signature changes.
5. **Escape hatch.** Is there a sanctioned way to opt out for a single line (e.g. `unsafeStable(x)`), and should using it require a reason string?

## 10. First task for Claude Code

1. Scaffold the repo (TypeScript, Vite, Vitest, pnpm workspace with `fusion/` and `examples/basic/`).
2. Implement the shim and resolution from section 4, and prove `import { useEffect } from "react"` in the example resolves to Fusion for both `tsc` and Vite, with a single React copy at runtime.
3. Implement Rule 1 with type tests for every case in section 5.
4. Stop and report back on open question 1 before building Rule 2.
