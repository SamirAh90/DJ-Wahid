# DJ Wahid

Static React and TypeScript portfolio. Vite builds the website and its local media into files that can be served by an ordinary web host. Navigation links target sections on the home page.

## Development

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

Edit artist information, services, gallery entries, confirmed dates and authorized mixes in `src/content.ts`. The preview uses phone and social contact links. Add confirmed events and licensed audio or official links before publishing those listings. The previous database-backed admin portal and authenticated content are outside this static preview.

## Netlify customer preview

Import `SamirAh90/DJ-Wahid` from GitHub, select `main`, and leave the base directory empty. The repository configuration builds with `npm run build`, publishes `dist`, and sets `X-Robots-Tag: noindex, nofollow` on Netlify responses. No environment variables are required. If uploading `dist` manually instead of importing the repository, the root TOML is not part of the upload, so configure the same header separately.

## STRATO production

Copy `.env.example` to `.env.strato` and set `SITE_URL` to the approved HTTPS domain origin. The production build uses it to set the canonical URL, absolute social sharing image and sitemap.

```sh
npm ci
npm run build:strato
```

After the customer approves the site, upload the **contents** of `dist-strato/`, including the hidden `.htaccess`, to the domain’s document root via SFTP. Verify HTTPS, media playback, anchor navigation and booking links on the production domain. The Netlify indexing header is specific to the Netlify configuration.
