// Rule 2, "must pass" cases: correct context code that Fusion must accept
// unchanged, and context values as a blessed source of stable values.

import {
  Component,
  createContext,
  stable,
  use,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Context,
  type ContextType,
  type ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
}

interface Auth {
  user: User | null;
  logout: () => void;
}

type Theme = "light" | "dark";

const AuthContext = createContext<Auth | null>(null);
const ThemeContext = createContext<Theme>("light");
const CountContext = createContext(0);
// The default value is created once, at module level; it needs no marking.
const SettingsContext = createContext({ compact: false, tags: ["default"] });
const DispatchContext = createContext<(action: "reset") => void>(() => {});
const Annotated: Context<Auth | null> = createContext<Auth | null>(null);

const GUEST = stable<Auth>({ user: null, logout() {} });

export function SpecCase({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const logout = useCallback(() => setUser(null), []);

  // The case from the spec.
  return <AuthContext.Provider value={useMemo(() => ({ user, logout }), [user, logout])}>{children}</AuthContext.Provider>;
}

export function EveryWayOfProviding() {
  const [user] = useState<User | null>(null);
  const [theme] = useState<Theme>("dark");
  const [settings] = useState({ compact: true, tags: ["a"] });
  const [count, dispatch] = useReducer((state: number, _action: "reset") => state * 0, 1);
  const logout = useCallback(() => {}, []);
  const auth = useMemo(() => ({ user, logout }), [user, logout]);

  return (
    // React 19 style: the context itself as the provider.
    <AuthContext value={auth}>
      <Annotated.Provider value={auth}>
        {/* Primitives are compared by value. */}
        <ThemeContext.Provider value={theme}>
          <ThemeContext value="light">
            <CountContext.Provider value={count * 2}>
              {/* State, dispatch and stable() constants are already stable. */}
              <SettingsContext.Provider value={settings}>
                <DispatchContext.Provider value={dispatch}>
                  <AuthContext.Provider value={GUEST}>
                    <AuthContext.Provider value={null}>
                      <Consumers />
                    </AuthContext.Provider>
                  </AuthContext.Provider>
                </DispatchContext.Provider>
              </SettingsContext.Provider>
            </CountContext.Provider>
          </ThemeContext>
        </ThemeContext.Provider>
      </Annotated.Provider>
    </AuthContext>
  );
}

declare function takesAuth(auth: Auth | null): void;

function Consumers() {
  // useContext keeps its normal signature and name.
  const auth = useContext(AuthContext);
  const theme: Theme = useContext(ThemeContext);
  const settings = use(SettingsContext);
  const dispatch = useContext(DispatchContext);

  takesAuth(auth);
  const name: string | undefined = auth?.user?.name;
  const tags: string[] = settings.tags;

  // A context value is stable by construction, so it can be depended on.
  useEffect(() => {}, [auth, theme, settings, dispatch]);
  const summary = useMemo(() => `${auth?.user?.id} ${settings.compact}`, [auth, settings]);

  return (
    <AuthContext.Consumer>
      {(value) => (
        <p onClick={() => dispatch("reset")}>
          {value?.user?.name} {name} {tags.length} {summary}
        </p>
      )}
    </AuthContext.Consumer>
  );
}

// Class components and ContextType keep working.
export class Legacy extends Component {
  static override contextType = AuthContext;
  declare context: ContextType<typeof AuthContext>;

  override render() {
    return this.context?.user?.name;
  }
}
