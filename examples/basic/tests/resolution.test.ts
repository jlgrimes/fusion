// Proves the claims the example rests on:
//   1. for Vite, "react" in application code resolves to the Fusion shim;
//   2. everything else (subpaths, node_modules) still gets real React;
//   3. the production bundle contains exactly one copy of React.

import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, createServer, type Rolldown, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const real = (id: string) => realpathSync(id.split("?")[0]!);

const shim = real(resolve(dirname(require.resolve("fusion/package.json")), "src/react.ts"));
const reactDir = dirname(real(require.resolve("react/package.json")));
const appFile = resolve(root, "src/App.tsx");
const reactDomFile = real(require.resolve("react-dom"));

describe("dev server resolution", () => {
  let server: ViteDevServer;
  const resolveFrom = async (source: string, importer: string) =>
    (await server.environments.client.pluginContainer.resolveId(source, importer))?.id;

  beforeAll(async () => {
    server = await createServer({ root, logLevel: "silent", server: { middlewareMode: true, ws: false } });
  });
  afterAll(() => server.close());

  test('application code importing "react" gets the Fusion shim', async () => {
    expect(real((await resolveFrom("react", appFile))!)).toBe(shim);
  });

  test("subpaths of react are left alone", async () => {
    const id = (await resolveFrom("react/jsx-runtime", appFile))!;
    expect(id).not.toContain("fusion/src");
    expect(id).toMatch(/react[_/]jsx-runtime/);
  });

  test("packages in node_modules import real React directly", async () => {
    const id = (await resolveFrom("react", reactDomFile))!;
    expect(id).not.toContain("fusion/src");
  });

  test("the private specifier cannot be imported from application code", async () => {
    await expect(resolveFrom("fusion-react-original", appFile)).rejects.toThrow(/private to Fusion/);
  });
});

describe("production bundle", () => {
  let moduleIds: string[] = [];

  beforeAll(async () => {
    const result = (await build({ root, logLevel: "silent", build: { write: false } })) as Rolldown.RolldownOutput;
    moduleIds = result.output
      .flatMap((chunk) => (chunk.type === "chunk" ? chunk.moduleIds : []))
      .filter((id) => !id.startsWith("\0")) // virtual modules have no file
      .map(real);
  }, 60_000);

  test("includes the Fusion shim", () => {
    expect(moduleIds).toContain(shim);
  });

  test("includes exactly one copy of React", () => {
    const implementations = moduleIds.filter((id) => /[\\/]node_modules[\\/]react[\\/]cjs[\\/]react\.[a-z]+\.js$/.test(id));
    // Which build (development or production) depends on NODE_ENV; there must be one.
    expect(implementations).toHaveLength(1);
    expect(dirname(implementations[0]!)).toBe(resolve(reactDir, "cjs"));

    const entryPoints = moduleIds.filter((id) => /[\\/]node_modules[\\/]react[\\/]index\.js$/.test(id));
    expect(entryPoints).toEqual([resolve(reactDir, "index.js")]);
  });
});
