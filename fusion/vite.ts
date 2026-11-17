import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/** The private specifier Fusion's own source uses to reach real React. */
const ORIGINAL = "fusion-react-original";

const fusionRoot = dirname(fileURLToPath(import.meta.url));
const shim = join(fusionRoot, "src/react.ts");

const normalize = (id: string) => id.split("?")[0]!.replaceAll("\\", "/");
const isFusionSource = (id: string) => normalize(id).startsWith(`${normalize(fusionRoot)}/src/`);
const isThirdParty = (id: string) => normalize(id).includes("/node_modules/") && !isFusionSource(id);

/**
 * Makes `import ... from "react"` in application code resolve to the Fusion
 * shim, which re-exports real React.
 *
 * - Only the exact specifier `react` is redirected. `react/jsx-runtime`,
 *   `react-dom` and other subpaths resolve to real React as usual.
 * - Only application code is redirected. Packages in `node_modules` keep
 *   importing real React directly, so they are unaffected by the shim.
 * - The shim and those packages share one copy of React: the shim's own
 *   import of React resolves, from the project root, to the same module.
 */
export default function fusion(): Plugin {
  let root = process.cwd();

  return {
    name: "fusion",
    enforce: "pre",

    config() {
      return {
        resolve: { dedupe: ["react", "react-dom"] },
        // The dev server only discovers React through the shim's private
        // specifier; name it explicitly so it is pre-bundled as `react`.
        optimizeDeps: { include: ["react"] },
      };
    },

    configResolved(config) {
      root = config.root;
    },

    async resolveId(source, importer, options) {
      if (source === ORIGINAL) {
        if (!importer || !isFusionSource(importer)) {
          this.error(
            `"${ORIGINAL}" is private to Fusion and cannot be imported from ${importer ?? "an entry point"}. ` +
              `Import from "react" instead.`,
          );
        }
        return this.resolve("react", join(root, "index.html"), { ...options, skipSelf: true });
      }
      if (source === "react" && importer && !isThirdParty(importer)) return shim;
      return null;
    },
  };
}
