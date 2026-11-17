/**
 * Rule 2: a context only holds stable values.
 *
 * A context created by Fusion's `createContext<T>` is a real React context
 * whose value type is the stable form of `T`. Everything follows from that
 * with React's own types: the provider's `value` must be stable, and
 * `useContext` / `use` return a value that can be used as a dependency.
 */

import Original from "fusion-react-original";
import type { Context as OriginalContext } from "fusion-react-original";
import type { StableContextValue } from "./stable";

/** A React context of `T` whose provider only accepts a stable value. */
export type Context<T> = OriginalContext<StableContextValue<T>>;

/**
 * The default value is created once, when the module loads, so it does not
 * need to be marked stable.
 */
export const createContext = Original.createContext as <T>(defaultValue: T) => Context<T>;
