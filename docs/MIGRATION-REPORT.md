# Technical migration report

Date: 25 November 2026.

Follow-up requested on 26 November 2026: TikTok now links to `@dj.wahid2`,
WhatsApp replaces Facebook using the existing telephone number, and the email
subscription form and its accompanying text have been removed. The community
heading remains. The migration comparisons below describe the website before
these subsequent user-authorized content changes.

Further update on 26 November 2026: the gallery now reads the current files under
`public/images`, deduplicated by file bytes. The user explicitly approved clearing
all local content and accounts. Events, gallery rows, users, roles, sessions and
rate limits were cleared after a private backup; the schema and internal first-admin
bootstrap lock remain. Default seed files no longer insert demonstration records.
Both PHP and static builds use folder images, while later private uploads still
work. Historical counts and checksums below describe the earlier migration snapshot,
not the user's current public media library or the cleared local database.

## Result and scope

The source has been migrated to an independent React/Vite frontend with a PHP and
MySQL/MariaDB backend for STRATO Webbhotell Basic. Production output is `dist/`.
The local build and deployment checks pass. No persistent Node.js process, cloud
function, external database subscription or platform SDK is required in production.

The approved layout, colours, typography, spacing, animations, text, responsive
breakpoints and public page URLs were retained. The user supplied the missing
images and expressly authorized choosing the hero files. Those three files are
copied without recompression. This authorized asset selection is the only content
selection made during migration; exact identity with the inaccessible original
three PNG assets is not claimed.

**Live STRATO deployment has not been tested.** Account/database setup, SFTP upload,
domain routing, Apache behavior, certificate activation and real email delivery
remain deployment-time checks. Instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Original architecture and audit

- React 19, TypeScript, Tailwind 4 and shadcn/Radix source components.
- TanStack Start SSR and server functions; TanStack Router and Query.
- A platform Vite configuration wrapper, Nitro and Cloudflare-oriented output.
- A Supabase/PostgreSQL backend with public/admin feeds, user roles, email/password
  authentication, private gallery storage and one-hour signed photo links.
- A Bun lockfile/configuration, platform preview authentication and telemetry.
- Seven asset descriptors pointed at a private platform asset proxy; the actual
  images were absent from the supplied source directory.
- Routes: `/`, `/admin`, hash navigation within `/`, and the existing 404 state.
- The booking/newsletter forms were browser-only confirmations; the cart was a
  browser state counter, and audio previews used the Web Audio API. No payment,
  marketing-email, real booking delivery or video-player backend existed.

The audit covered source pages/components, styles, UI-library imports, routing,
configuration, environment variable names, database schema/migration, backend
authorization and storage, asset metadata, tests and documentation. The original
source and a SHA-256 manifest were saved under ignored `.migration-baseline/`
before application changes. This folder did not contain `.git`; no Git history
was rewritten, initialized, pushed or otherwise modified.

The connected backend was inspected read-only. It contained 2 events, 8 gallery
records, 0 users, 0 role assignments and 0 uploaded gallery objects. These counts
were rechecked during final verification. No live records or cloud schema were
changed. Original IDs, text, dates, published flags, likes/comments, ordering and
creation timestamps are preserved in the local export and SQL import. Image
references now point to local assets. Since there were no accounts or uploaded
objects, no password-hash or private-file migration was required for this snapshot.

## Final architecture

- Vite compiles the existing React frontend into HTML templates, CSS and JavaScript.
- TanStack Router retains the existing pages; TanStack Query retains the data cache
  and query keys. The browser API adapter preserves the component-facing function
  inputs and returned content/record structures.
- PHP handles the public/admin feeds, registration, confirmation, sign-in/out,
  events, gallery records, uploads and private image delivery.
- PHP serves initial page HTML with current published database content and the
  original route-specific SEO metadata. React mounts after the initial data is
  ready. Dynamic row templates are derived from the retained React component,
  rather than maintaining a second manually styled PHP view.
- MySQL/MariaDB stores events, photos, users, roles, session-token hashes and rate
  limits. PDO prepared statements bind user data.
- Private configuration and uploaded images live outside the document root.
- Apache rewrites pages to PHP, excludes APIs/assets, protects internal files,
  preserves old asset URLs, redirects HTTP to HTTPS and configures text compression
  and asset caching. Private configuration is not included in `dist/`.
- All seven images and the fonts are included locally. Existing social/telephone
  links remain external destinations; they are not hosting dependencies.

The old server-function transport was replaced with same-origin PHP JSON requests.
Session authentication uses opaque HttpOnly cookies instead of browser-held bearer
tokens. The existing sign-in/signup forms, administrative actions and business
content structures remain. There were no other API consumers in the source.

## Removed dependencies and platform references

Removed direct platform/backend/build dependencies:

- `@lovable.dev/vite-tanstack-config`
- `@supabase/supabase-js`
- `@tanstack/react-start`
- `nitro`, `postgres`, `drizzle-orm`, `drizzle-kit`
- `vite-tsconfig-paths` (the conventional Vite alias replaces it)

Removed unreferenced direct dependencies: `@hookform/resolvers`, `date-fns`, `zod`.
Other libraries remain where retained UI component sources import them. Build-only
router tooling is now a development dependency. There was no separate
`lovable-tagger` dependency to remove; preview tagging came from the removed wrapper.

Removed the platform project directory/identifiers, preview auth broker and cron
helper, generated cloud integration modules, telemetry hooks, platform server
entry/middleware, PostgreSQL migration configuration, obsolete Bun configuration,
old cloud environment file, promotional README and stale roadmap. The deployment
contains none of those dependencies, domains, keys or telemetry globals. The
deployment verifier intentionally contains platform names as detection patterns.

Old `/__l5e/assets-v1/...` paths are retained solely as compatibility rewrites for
existing image URLs. They serve local files and do not contact the original host.
Ignored baseline/cache files retain historical source for review and recovery;
they are excluded from both Git and deployment output.

Third-party library notices are included in `dist/THIRD-PARTY-NOTICES.txt`. The DM
Sans and Montserrat font licenses are retained in `fonts/`. Authorship and Git
history were not rewritten.

## Assets and unchanged presentation

Recovered JPGs:

| Local file | Original supplied source |
| --- | --- |
| `dj-portrait-1.jpg` | `snapgram.io_8myxwhy6e550 (1).jpg` |
| `dj-portrait-2.jpg` | `snapgram.io_6dojya2veb6e (1).jpg` |
| `dj-decks-1.jpg` | `snapgram.io_fqnu9yswax0l.jpg` |
| `dj-decks-2.jpg` | `snapgram.io_pzwl8y900pur.jpg` |

The original project edit record confirms the source filenames; sizes match the
original asset descriptors. The three user-authorized hero selections are:

1. `DJ i vit kostym i neonljus-4.webp` → `hero-dj-1.webp`
2. `Neonupplyst DJ-porträtt-1.webp` → `hero-dj-2.webp`
3. `Stämningsfull DJ i lila scenljus-3.webp` → `hero-dj-3.webp`

`config/assets.json` records required sizes and SHA-256 checksums for all seven
files. `config/asset-provenance.json` records the hero selections. None were
regenerated, retouched or recompressed. The unused source image/video library
remains in its supplied folders and is not uploaded as part of `dist/`.

The following files remain byte-for-byte unchanged: `src/styles.css`, the hero,
navbar, club sections, community/footer, podcast and social-icon components,
`src/data/dj-data.ts`, the audio engine, favicon and robots.txt. The admin JSX and
class names are retained; its authentication/data transport logic was adapted.

## Verification

| Check | Result |
| --- | --- |
| Clean `npm ci` | Passed; lockfile retained in source |
| TypeScript `tsc --noEmit` | Passed |
| Existing Vitest routing test | Passed |
| PHP syntax checks | All PHP source/config/script files passed on PHP 8.3.36 |
| Vite client and local prerender builds | Passed |
| Deployment file/asset/platform checks | Passed; all seven asset sizes/checksums verified |
| Local database installation/import | Passed on isolated MariaDB 11.4.14, through both the CLI installer and the exact deployment SQL files |
| Database integrity | All event/gallery IDs, fields, flags, timestamps and counts match the migrated export |
| PHP API integration | 41 checks passed |
| Desktop/mobile browser interactions | 42 checks passed |
| Final page/asset requests | Both pages return 200 at all four sizes; no missing images or failed requests |
| Production browser errors | No page errors captured |
| Deterministic before/after screenshots | 8 of 8 comparisons: zero differing pixels |
| Live STRATO / Apache / HTTPS / email delivery | Not executed; hosting smoke test documented |

API checks cover anonymous/admin/non-admin access, first-owner protection,
registration/sign-in/sign-out, revoked sessions, CSRF/origin rejection, event CRUD
and visibility, validation and SQL-injection rejection, Unicode/quote round trips,
HTML escaping, private image uploads, invalid-image rejection, signed/forged media
URLs, numeric normalization, photo publishing/hiding and storage deletion.

Browser checks cover hero navigation, desktop/mobile booking dialogs, ticket and
service dialogs, cart counts, Web Audio play/pause, newsletter confirmation,
existing contact links, direct admin navigation/refresh/signup-mode selection,
admin noindex metadata, and the original 404 state. Tests ran against the PHP
production output with disposable local data; test records were removed afterward.
The local API suite uses `confirm_email=false`; actual email confirmation delivery
must be exercised with the STRATO mail service during deployment.

### Visual comparison method and evidence

Both pages were captured at 1920×1080, 1440×900, 768×1024 and 390×844 using the same
Edge browser, scale 1, locale, timezone and light colour scheme. Captures wait for
fonts/data and freeze animations with the first hero slide selected. Software
rendering and an sRGB profile remove mobile GPU rasterization noise.

The baseline uses the untouched original application source, with missing JPGs
restored and the authorized hero choices supplied to its original image URLs by
the test browser. Thus comparison isolates implementation/layout differences from
the user-authorized image selection. It does not prove that all selected WebPs are
identical to the inaccessible historical PNG files.

Evidence is saved locally under `artifacts/final-before/`, `artifacts/final-after/`
and `artifacts/final-comparison/`. The earlier GPU-rendered run matched seven
screenshots exactly and showed only small rasterization differences on mobile;
the controlled mobile repeat matched exactly, including an unchanged-source repeat.
The final controlled run produced zero differing pixels for all eight screenshots.
Results are recorded in `artifacts/final-comparison/results.json`; the strict
pixel comparator exits successfully. All final page requests returned HTTP 200,
with zero failed resource requests, missing images or browser page errors.

The original application emitted a pre-existing hydration mismatch during its
startup. The migrated production pages have no such page errors. Existing mobile
overflow was retained rather than changing the approved layout: the 390-pixel
viewport can produce a 398-pixel-wide full-page screenshot in both implementations.

## Security and operational considerations

- Credentials, media signing key and upload bytes remain outside the public root.
- Passwords use PHP password hashing; session tokens are random and stored hashed.
- HTTPS cookies are Secure, HttpOnly and SameSite=Lax. Writes require a matching
  CSRF token and the configured Origin. Authentication attempts are rate-limited.
- Administrative role checks protect every read/write/upload endpoint requiring
  admin rights. The configured owner email protects the initial admin bootstrap.
- Uploads retain the original 15 MiB limit, are validated as images, receive random
  filenames and cannot execute as server scripts. Private media is signed for one
  hour and receives restrictive response headers.
- SQL values use prepared statements; server-rendered text and embedded JSON are
  escaped. Internal errors are logged privately and not returned as SQL traces.
- New schema/seed scripts do not drop data and are intended for a new empty
  database. Maintain database, private files and release backups together.

The production mail sender and domain origin must be real deployment values.
`server/config.example.php` contains placeholders only. No private configuration
or setup endpoint is included in the public output. The generated output contains
no source maps, repository metadata, node_modules or frontend source tree.

## Deployment and remaining limitations

Exact deployment directory:

```text
C:\Users\saah1009\Downloads\DJ\DJ-code\dist\
```

1. Build locally with `npm ci` and `npm run build`.
2. Create a STRATO database; import `database/schema.sql`, then `database/content.sql`.
3. Create a private sibling directory and configure its `config.php` from the
   provided example, including owner email and a random signing key.
4. Enable PHP 8.3+ and the domain SSL certificate.
5. Upload the contents of `dist/`, including hidden `.htaccess` files, via SFTP
   into the domain document root. Keep the private directory outside that root.
6. Point the domain's internal destination at that public directory, verify mail
   delivery, create/confirm the first admin account, and run the documented hosting
   smoke test before replacing a live website.

This architecture is compatible with the documented STRATO shared-hosting
capabilities. The local PHP server approximated routing but does not process
Apache `.htaccess`; account-specific rewrite/caching/compression/permission and TLS
behavior therefore remain unverified. Existing browser-only booking/newsletter and
cart behavior remain unchanged and should not be mistaken for new delivery/payment
integrations. The original backend stays intact for rollback. Re-export its data
if it changes after this migration snapshot and before cutover.

See [FILE-CHANGES.md](FILE-CHANGES.md) for the complete modified/deleted/new file
inventory and all retained direct dependencies. The source can be maintained in a
normal GitHub clone; preserve its existing `.git` history when applying these files.
