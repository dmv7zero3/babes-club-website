// src/declarations.d.ts

/**
 * Module Declarations for Asset Imports
 *
 * This file allows TypeScript to recognize and handle imports of non-code modules such as images and SVGs.
 *
 * Usage:
 * - Import assets in your components using the defined aliases (e.g., "@photos/filename.jpg").
 * - Extend the declarations below to support additional file types as needed.
 *
 * Example:
 * ```typescript
 * import Logo from "@photos/logo.png";
 * import { ReactComponent as Icon } from "@photos/icon.svg";
 * ```
 */

declare module "*.mp4" {
  const value: string;
  export default value;
}

declare module "*.webm" {
  const value: string;
  export default value;
}

declare module "*.ogg" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.woff" {
  const value: string;
  export default value;
}

declare module "*.woff2" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module "*.gif" {
  const value: string;
  export default value;
}
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Minimal stubs for curtainsjs since it ships without TypeScript types
declare module "curtainsjs" {
  export class Curtains {
    constructor(options?: any);
    dispose(): void;
    updateScrollValues(x: number, y: number): void;
  }
  export class Plane {
    constructor(curtains: any, el: HTMLElement, params: any);
    onReady(cb: () => void): this;
    onError(cb: (e?: any) => void): this;
    onRender(cb: () => void): this;
    remove(): void;
    getBoundingRect(): { width: number; height: number };
    uniforms: Record<string, { name?: string; type?: string; value: any }>;
  }
  export class ShaderPass {}
}
