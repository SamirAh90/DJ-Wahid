# DJ Wahid website

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

The public gallery reads the files currently in `public/images`, displaying
duplicate file contents only once. Names with spaces and Swedish letters are
supported. No gallery database rows are needed for these images. The database
starts without demo events, photos or accounts; later admin-created events and
private uploads are stored normally. The admin portal
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
pink/cyan animated player. Play/pause and mute preferences are remembered locally.
Browsers that block audible autoplay start playback after a visitor's first
interaction or a press of Play. Starting a podcast preview pauses background music,
and starting background music stops a podcast preview. Reduced-motion preferences
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
play/pause/mute preferences, podcast switching and the mobile contact panel.
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
