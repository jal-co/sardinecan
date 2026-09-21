import assert from "node:assert/strict"
import test from "node:test"
import { uploadLabel } from "../src/lib/images.ts"

test("uploads reject oversized and unsupported files before decoding", async () => {
  await assert.rejects(
    uploadLabel(new File([new Uint8Array(12 * 1024 * 1024 + 1)], "large.png")),
    /smaller than 12 MB/,
  )
  await assert.rejects(
    uploadLabel(new File(["not an image"], "label.html")),
    /PNG, JPG, WebP, or SVG/,
  )
})
