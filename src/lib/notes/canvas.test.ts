import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's direct TypeScript test runner requires the extension.
import { resolveCanvasElements } from "./canvas.ts";

test("uses the fallback canvas when no canvas state exists", () => {
  assert.deepEqual(resolveCanvasElements(null, undefined, []), []);
});
