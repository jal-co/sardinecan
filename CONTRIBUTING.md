# Contributing to Sardine Can

## Setup

Use Node.js 22.18 or newer.

```sh
git clone https://github.com/jal-co/sardinecan.git
cd sardinecan
npm ci
npm run dev
```

## Making changes

1. Branch from `main` and keep changes scoped.
2. Follow the existing React, Tailwind, and shared UI component patterns.
3. Run `npm test` and `npm run build`.
4. For renderer or artwork changes, check the browser preview, template selection, uploads, print scaling, pull-tab placement, and PNG/SVG exports. Check mobile layouts when changing the interface.
5. Use Conventional Commits (`feat: ...`, `fix: ...`) and open a pull request against `main`.

The app runs entirely in the browser. Do not commit credentials or user-uploaded artwork. Include new bundled artwork only when you have permission to distribute it.

## Deployment

Cloudflare setup is documented in [README.md](README.md#cloudflare). Publishing source code does not deploy the app or configure its domain.

## License

Contributions are licensed under the [MIT license](LICENSE), as in StampStudio.
