// Libraries and apps extend React's types with `declare module "react"`.
// Those augmentations must keep landing on the real declarations even though
// "react" now resolves to the shim.

import type { CSSProperties } from "react";

declare module "react" {
  interface CSSProperties {
    "--accent"?: string;
  }
}

export const style: CSSProperties = { "--accent": "red" };
export const element = <div style={{ "--accent": "red" }} />;
