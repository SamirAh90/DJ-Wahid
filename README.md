# DJ Wahid website

Netlify is a customer-facing static preview. It uses the committed public snapshot
in `database/netlify-content.json` and exported files in `public/site-media`.
The admin footer link is hidden in that build; direct `/admin` navigation explains
that administration belongs to the STRATO deployment. The PHP/MySQL architecture
and admin remain available in the normal STRATO build. Accounts, private uploads
that are not published, and server configuration are never exported.
To refresh the snapshot from a running local preview, run
`node scripts/export-preview.mjs`, then commit the public snapshot and assets.
Verify a Netlify build with `SITE_BUILD_TARGET=netlify npm run build` and
`node scripts/test-netlify.mjs`. On PowerShell set the environment variable first.

The navigation provides EN/SV language buttons. Swedish presentation strings live
in `src/data/swedish.ts`; the shared language store is in `src/lib/language.tsx`.
The optional `dj-language` local-storage setting remembers the visitor's selection.
Switching languages preserves component state and media playback. English remains
the initial default. The admin editor can disable either language and change the
default for new visitors. The privacy pages are `/integritet/index.html` (English) and
`/integritet/sv.html` (Swedish), with language controls on both pages.
Run `node scripts/test-language.mjs` against the local preview to verify language
switching, saved preferences, dialogs, admin login and both privacy pages.

The admin portal is a dashboard with a left-hand menu for each website section,
image and video/audio libraries, social links, languages, SEO and privacy. Section
pages show their own English/Swedish text and media together. The overview shows
current content previews. Drafts survive switching sections and use shared Save,
Preview and Discard controls. Events and gallery management are accessible from
their matching section pages. The editor manages section visibility, rental prices,
image/video/audio uploads and visual library selection, links and policy content.
Draft preview opens a separate tab without publishing. Save changes persists
settings in the existing `site_settings` table as a versioned JSON document split
into bounded rows; no schema migration is needed. Conflicting saves return 409.
Uploaded videos and audio have database library records stored in bounded rows of
the existing settings table. They can be previewed, renamed, replaced and deleted.
Existing optimized news videos and background music can be imported into this
library. Used media cannot be deleted until its section uses a replacement.
Current section texts and defaults can be materialized in the database through
the authenticated initialize-website action; existing edits are preserved.
Uploaded site media stays private until referenced by saved website settings.
Published media URLs support range requests for audio/video playback. Private
gallery links retain signature checks. Save/error notifications appear in the UI.
The hero and navigation booking buttons open the same contact panel as Biography.

DJ Wahid's existing music, events, gallery and booking website, prepared for
STRATO Webbhotell Basic. The approved React components, CSS, colours, typography,
content, animations and responsive layouts are retained.

Production serves compiled frontend assets and PHP. It does not require Node.js,
an application server, a cloud database subscription or a platform hosting account.

Netlify builds a static frontend snapshot from `public/images` and the optional
event snapshot in `database/content.json` so the
homepage and client-side routes remain available there. Netlify does not run this
project's PHP/MySQL backend; sign-in, admin changes and live database updates
require the STRATO deployment.

## Technology and architecture

- React 19, TypeScript, Vite 8 and Tailwind CSS 4.
- TanStack Router for `/` and `/admin`; TanStack Query for content and mutations.
- Existing shadcn/Radix component sources and their open-source dependencies.
- PHP 8.3+ with PDO MySQL, fileinfo, DOM, JSON, hash and filter extensions.
- MySQL 8 or MariaDB 10.6+ with InnoDB and utf8mb4.
- Local images and locally served DM Sans/Montserrat font files with OFL licenses.

The Photos tab provides a database-backed image library with thumbnails, multi-file
uploads, replacement, captions, gallery visibility and deletion. Existing public
images can be imported once with **Import existing website images**. Import copies
their files into private storage and creates database records without changing the
source assets. Images used by the hero and biography are connected to library IDs.
Once imported, the public gallery reads database records; hidden or deleted images
are not automatically re-added from the public folder. Website image fields offer
a visual library picker. In-use images must be replaced before deletion.
The database starts without demo events, photos or accounts. The admin portal
supports account registration, sign-in/out, event management, image uploads,
publishing/hiding photos and deletion. Private uploads stay outside the domain's
document root and are served through signed links valid for one hour.

PHP also serves initial HTML containing current published records and the existing
SEO metadata. The local build derives its HTML row templates from the approved
React components. After the initial data is ready, the browser mounts the React
router over this initial HTML. No JavaScript server runs in production.

The booking form retains its original browser-only confirmation behavior. It does
not send email, save submissions or charge customers. The subscription form was
removed at the user's request. The cart
retains its session-local counter, and podcast previews retain their Web Audio
generator. Instagram, TikTok (`@dj.wahid2`) and WhatsApp provide the social links;
Facebook was removed at the user's request. There was no video player in the
original website. Media placed under `public`, including `public/Vedios` when
present, is copied into the deployment output without adding a video player.

The service buttons open a contact panel with phone, Instagram, WhatsApp and
TikTok links. The footer identifies the phone number with a Swedish flag.
`public/mp3/Bijan Mortazavi.mp3` supplies looping background music with a compact
pink/cyan equalizer centred near the bottom of the hero, without a player box or
track label. Its only control is mute/unmute. Each page visit starts with sound enabled;
the mute choice applies to the current visit. Browsers that block audible autoplay start playback after a visitor's
first interaction. Background music continues while other media plays, until the visitor mutes it. Reduced-motion preferences
disable the visualizer animation.

The user manages images directly in `public/images`. The stable names
`hero-dj-1.webp`, `hero-dj-2.webp`, `hero-dj-3.webp` and `dj-portrait-1.jpg` are
required by the hero/biography components and listed in `config/assets.json`.
These files can be replaced without changing pinned checksums. Earlier migration
choices are recorded historically in `config/asset-provenance.json`; those records
do not override the current public files. Original hero PNG URLs continue to
resolve through local rewrite rules.

## Project layout

| Location | Purpose |
| --- | --- |
| `src/` | Existing React pages, components, data, styles and browser API client |
| `public/` | Images, fonts, favicon, robots.txt and Apache configuration |
| `api/` | PHP API, authentication, validation and database access |
| `server/` | PHP page entry point and private configuration example |
| `database/` | Schema and empty initial content files |
| `scripts/` | Build, local server, database and verification tools |
| `docs/` | Deployment instructions and migration report |
| `dist/` | Generated public deployment files; ignored by Git |
| `private/` | Local/private server configuration and uploads; ignored by Git |

## Local installation

Install Node.js 22.12+ (or a newer supported LTS), npm, PHP 8.3+, and MySQL/MariaDB.
Enable the PHP extensions listed above. On Windows, configure the appropriate
`extension_dir`, `extension=pdo_mysql` and `extension=fileinfo` in the PHP CLI's
`php.ini` if they are not already enabled.

```sh
npm ci
npm run build
```

Copy `server/config.example.php` to `private/config.php`, edit its database
settings and set `origin` to `http://127.0.0.1:5173`. Set your own
`bootstrap_admin_email`; that email must create the first account. Generate the
media signing key locally:

```sh
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

Create a new empty local database. In each terminal using PHP, point PHP to the
private config file. PowerShell:

```powershell
$env:SITE_CONFIG_PATH = Join-Path (Get-Location) 'private/config.php'
$env:SITE_PUBLIC_IMAGES_PATH = Join-Path (Get-Location) 'public/images'
php scripts/database.php install
php scripts/database.php import
php scripts/database.php verify
```

POSIX shell equivalents: `export SITE_CONFIG_PATH="$PWD/private/config.php"` and
`export SITE_PUBLIC_IMAGES_PATH="$PWD/public/images"`. The image-path variable is
for local development/preview so image additions, replacements and removals appear
on refresh without rebuilding. Production defaults to its deployed `images/` folder.

Run the PHP backend in one terminal and Vite in another:

```sh
npm run dev:api
```

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to local PHP on port 8081.
Rebuild after changing PHP files so `dist/api/` stays current. There are no required
frontend environment variables. `.env.example` documents this; never add private
credentials to a `VITE_` variable.

Email confirmation is enabled in the example configuration. Production needs a
working PHP `mail()` setup and an actual sender address on your STRATO domain.
For disposable local testing, `confirm_email=false` signs new accounts in directly;
do not change the production setting without deciding your account policy.

## Build, preview and verification

```sh
npm run typecheck
npm test
npm run build
npm run check:deploy
```

`npm run build` compiles the frontend, discovers public gallery images, renders page templates locally, copies PHP
and static assets into `dist/`, and verifies the deployment files. It fails
if required hero/biography images are missing or empty. Gallery images belong in
`public/images/`; no database import is needed. `npm run assets:import -- <folder>`
can copy the required named hero/biography files from another folder. The admin
Photos panel manages private uploads; folder images are managed in the filesystem.

Netlify reads `netlify.toml` and builds a static-only `dist/` without PHP source.
The static homepage uses the current public image folder and optional event snapshot; API requests return an explicit
503 because the PHP backend is unavailable on Netlify.

To preview the actual PHP production output, set `origin` in the local private
config to `http://127.0.0.1:8080`, keep `SITE_CONFIG_PATH` set, then run:

```sh
npm run preview
```

The local PHP router approximates Apache paths. It cannot validate Apache
`.htaccess`, HTTPS termination, STRATO's mail service or the live account.

`npm run test:api` writes only to a disposable loopback database whose name ends
in `_test`, with email confirmation disabled. Start the PHP preview first and use
the same private test configuration in both processes. It checks authentication,
authorization, validation, content changes, signed private media and deletion,
then removes its records. Never run it against the production database.

Browser checks can be repeated with `npx playwright install chromium` followed by
`npm run test:browser`. `npm run test:music` verifies both autoplay policies,
continuous playback, mute preferences, podcast switching and the mobile contact panel.
To use an installed Edge browser on Windows, set
`$env:BROWSER_CHANNEL='msedge'` in PowerShell first. Capture both pages with
`npm run capture -- http://127.0.0.1:8080 artifacts/after`, then compare against a
baseline directory with `npm run compare -- artifacts/before artifacts/after`.
Capture uses the page's current gallery count; `EXPECTED_GALLERY_COUNT` can override
it. `npm run test:gallery` checks PHP/static-build gallery parity, duplicate handling
and filename encoding. Exact pixel comparisons return
a failure when any pixels differ, so inspect rasterization differences as well
as structural changes before interpreting the result.

## Deployment and maintenance

Follow [the complete STRATO deployment guide](docs/DEPLOYMENT.md). Upload only the
**contents of `dist/`**, including its hidden `.htaccess`, to the domain document
root. Configure the database and sibling private directory separately. Do not
upload the repository, `.env`, database exports or `node_modules` to that root.

Keep `package-lock.json` committed. Use `npm ci` on new checkouts, review dependency
updates, run the checks above, and compare the two pages at desktop, laptop, tablet
and mobile sizes after updates. Rebuild after changing component markup: the PHP
row templates are generated from those components. Font refreshes can use
`python scripts/vendor-fonts.py`; review visual differences before shipping them.

Use GitHub normally: commit reviewed source changes without rewriting published
history. This supplied folder initially had no `.git` directory. To retain history,
apply these files to a normal clone of the existing repository instead of creating
an unrelated replacement history.

Back up the database, `private/config.php`, `private/uploads/`, and a known-good
production build before each deployment. Restore them together when rolling back;
restoring static files alone does not restore database changes. More details,
troubleshooting and the hosting smoke test are in the deployment guide.

See [the technical migration report](docs/MIGRATION-REPORT.md) for the precise
verification results, file inventory and remaining limitations.
