# Sardine Can

A browser-based studio for vintage sardine tin mockups. Intended for [sardinecan.app](https://sardinecan.app).

Choose an image template, upload your own artwork, or use the editable label builder. Rotate the 3D tin, choose gold or silver, adjust print scale and wear, and export a PNG at 1024, 2048, or 4096 pixels. The Transparent backdrop produces a transparent PNG.

The studio has one rounded rectangular tin and four supplied image templates. Each template restores its matching pull-tab position and metal finish. Image-template lettering and colors are baked in; remove the image to use the editable label builder. No accounts, AI generation, analytics, or server-side uploads. Work is kept in memory; download your label before closing or refreshing the page.

## Run

Use Node.js 22.18 or newer.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Edit in Figma, Illustrator, or Photoshop

Open **Design files** in the sidebar.

- **Label SVG** exports the current label. Image templates and uploaded artwork are embedded as raster images, not editable text. Labels made with the built-in builder contain named vector groups and editable Georgia/Arial text.
- **Flat label PNG** exports the current 1600 × 1040 label without lighting or perspective.
- **Guide SVG** includes removable guides for the rounded edge, a 100 px text-safe inset, and the pull tab.
- **Guide PNG** is a raster reference for a separate Photoshop guide layer. It is not a layered PSD.

Keep the canvas at 1600 × 1040. Hide the guides before export. Outline lettering in externally edited SVGs, or export a PNG to preserve fonts. Upload the resulting PNG, JPG, WebP, or self-contained SVG through **Artwork**. Uploads use a centered cover crop and reset print wear to zero and print scale to 100%. Print scale adjusts artwork from 50% to 150% around the lid center without changing the tin, pull tab, or placement guide. Other aspect ratios will be cropped.

The map covers the lid only. The metal body has no wrapping label. This is a mockup template, not a manufacturing dieline or a full-can UV unwrap.

## Cloudflare

`npm run build` produces a static site in `dist`. `wrangler.jsonc` configures Cloudflare Workers Static Assets; no Worker code or secrets are required.

When ready to publish from an authenticated Cloudflare account:

```sh
npm run build
npx wrangler deploy
```

For Cloudflare Git builds, use `npm run build` as the build command and `npx wrangler deploy` as the deploy command. After the first deployment, add `sardinecan.app` under the Worker's **Settings → Domains & Routes → Add → Custom Domain**. The domain's zone must be in the same Cloudflare account.

Cloudflare Pages can also serve the same `dist` directory with build command `npm run build`. Pick either Workers or Pages, not both.

No deployment or DNS changes are performed by the local build.

## Implementation

React, Vite, Tailwind CSS, and Three.js. The editor layout, theme, controls, social links, and Vite setup are adapted from [StampStudio](https://github.com/jal-co/stampstudio), MIT licensed, at `4a44e80`.

- `src/lib/label.ts` generates editable SVG artwork and placement guides in the same coordinate system used by the lid texture.
- `src/lib/can-renderer.ts` builds the tin geometry, handles camera controls and metal materials, and exports PNGs. It renders on changes rather than running a permanent animation loop.
- `src/lib/images.ts` rasterizes uploads locally and handles image downloads.
- `src/lib/settings.ts` contains the four template presets; their artwork and thumbnails live in `public/templates/`.

`npm test` checks template coordinates, text escaping, and upload replacement. Browser verification also needs to cover WebGL rendering, camera controls, downloads, and uploading a downloaded label. The application has no Playwright dependency.

MIT. The reference tweet is inspiration; its branded artwork is not bundled.

## Releases

User-facing changes include a Changeset. The release workflow collects them into a version PR, updates the changelog and package version, and creates a GitHub release after that PR merges. Cloudflare deployments continue on every push to `main`. See [Contributing](CONTRIBUTING.md#releases) for the workflow and required GitHub setting.
