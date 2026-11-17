// The shim must be a drop-in: everything Fusion does not redefine has to
// behave exactly as it does with plain @types/react.

import React, {
  Children,
  Component,
  Fragment,
  StrictMode,
  Suspense,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  use,
  useContext,
  useDebugValue,
  useDeferredValue,
  useId,
  useSyncExternalStore,
  version,
  type CSSProperties,
  type ComponentProps,
  type FC,
  type JSX,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import * as ReactNamespace from "react";
import type Original from "fusion-react-original";
import { createRoot } from "react-dom/client";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
declare function expectTrue<T extends true>(): T;

// Pass-through types are the very same types, not copies.
expectTrue<Equal<ReactNode, Original.ReactNode>>();
expectTrue<Equal<FC<{ a: 1 }>, Original.FC<{ a: 1 }>>>();
expectTrue<Equal<React.CSSProperties, Original.CSSProperties>>();
expectTrue<Equal<React.JSX.Element, Original.JSX.Element>>();
expectTrue<Equal<typeof createElement, typeof Original.createElement>>();
expectTrue<Equal<typeof React.Component, typeof Original.Component>>();
expectTrue<Equal<typeof ReactNamespace.useContext, typeof Original.useContext>>();

// Redefined hooks really are redefined, however they are reached.
expectTrue<Equal<typeof React.useEffect, typeof ReactNamespace.useEffect>>();
expectTrue<Equal<typeof React.useEffect extends typeof Original.useEffect ? true : false, false>>();

const Theme = createContext<"light" | "dark">("light");

const Title: FC<PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => {
  const theme = useContext(Theme);
  const id = useId();
  const deferred = useDeferredValue(theme);
  useDebugValue(deferred);
  return (
    <h1 id={id} style={style} className={theme}>
      {children}
    </h1>
  );
};

const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>((props, ref) => <input ref={ref} {...props} />);
const Memoised = memo(Title);
const Lazy = lazy(async () => ({ default: Title }));

class Legacy extends Component<{ label: string }, { clicks: number }> {
  override state = { clicks: 0 };
  override render(): ReactNode {
    return <button onClick={() => this.setState({ clicks: this.state.clicks + 1 })}>{this.props.label}</button>;
  }
}

function Data({ promise }: { promise: Promise<string> }): JSX.Element {
  const width = useSyncExternalStore(
    (notify) => {
      window.addEventListener("resize", notify);
      return () => window.removeEventListener("resize", notify);
    },
    () => window.innerWidth,
  );
  return (
    <>
      {use(promise)} {width}
    </>
  );
}

export function App(): ReactElement {
  const count = Children.count(null);
  return (
    <StrictMode>
      <Theme value="dark">
        <Suspense fallback={<Fragment>Loading {version}</Fragment>}>
          <Memoised>{isValidElement(count) ? null : count}</Memoised>
          <Lazy />
          <Input type="text" />
          <Legacy label="go" />
          <Data promise={Promise.resolve("done")} />
        </Suspense>
      </Theme>
    </StrictMode>
  );
}

// react-dom's types import "react" too; they must agree with the shim's.
createRoot(document.body).render(<App />);
createRoot(document.body).render(createElement(App));
