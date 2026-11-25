# STRATO Webbhotell Basic deployment

## Hosting assumptions

The application targets Apache-compatible shared hosting with PHP 8.3+ and
MySQL/MariaDB. Node.js is used only on the build machine. No VPS, containers,
serverless platform or additional paid application hosting is needed.

Official references checked on 25 November 2026:

- [STRATO Webbhotell plans](https://www.strato.se/webbhotell/)
- [PHP selection in the customer account](https://www.strato.se/faq/webbhotell/hur-ser-jag-mina-php-instaellningar-i-mitt-webbhotellspaket/)
- [Available PHP modules, including PDO MySQL and fileinfo](https://www.strato.se/faq/webbhotell/med-vilka-moduler-aer-PHP-tillgaengligt-hos-strato/)
- [STRATO database administration](https://www.strato.se/faq/webbhotell/hur-du-anvaender-vaar-databas/)
- [Apache compression on STRATO](https://www.strato.se/faq/webbhotell/foerbaettra-prestandan-paa-din-webbplats-med-hjaelp-av-instaellningar-i-htaccess-filen/)

The actual account, domain, certificate, database version and Apache modules must
be checked during deployment. No live STRATO deployment is claimed by this project.

## Netlify static deployment

`netlify.toml` configures a static-only build so Git-connected Netlify deploys
have an `index.html` and can serve the client-side routes. Its homepage uses
published seed content from `database/content.json`. Netlify does not execute the
PHP/MySQL backend: admin sign-in and database changes are unavailable there, and
API requests return 503. Use the STRATO deployment below for the complete site.

## 1. Prepare the release locally

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:deploy
```

The exact local public deployment directory is:

```text
C:\Users\saah1009\Downloads\DJ\DJ-code\dist\
```

It contains `index.php`, `.htaccess`, `api/`, `templates/`, compiled `assets/`,
`images/`, `fonts/`, `favicon.ico` and `robots.txt`. `templates/` is denied direct
HTTP access and included by PHP. The HTML and fonts are local; PHP source is
required on the server and must be executed, never served as plain text.

Do not deploy a build whose deployment check fails.

## 2. Create the hosting directories

Using SFTP, create this layout in your webspace. These names are a suggested
concrete layout; use the equivalent paths in your account:

```text
/dj-wahid/
  private/
    .htaccess
    config.php
    uploads/
  public/
    index.php
    .htaccess
    api/
    templates/
    assets/
    images/
    fonts/
    favicon.ico
    robots.txt
```

In the domain administration, set the domain's **internal destination/document
root** to `/dj-wahid/public/`. Keep the site at the root of that domain, as before.
The application deliberately preserves root-relative URLs and does not introduce
a new `/dj-wahid/` prefix to public URLs. No domain should expose `/dj-wahid/` or
the private directory as its document root.

By default PHP loads `/dj-wahid/private/config.php`, calculated relative to the
deployed API files. No server environment variable is needed on STRATO. If using
a different private location, an actual PHP process environment variable
`SITE_CONFIG_PATH` can override the path; do not put a secret-bearing config in
the public directory.

## 3. Configure PHP and the database

1. Select a currently supported PHP version, at least 8.3, in your STRATO account's
   PHP settings. Use the account setting rather than hard-coded PHP handlers in
   `.htaccess`. Do not enable a paid legacy PHP support option for this application.
2. Create a new, empty MySQL/MariaDB database in the STRATO control panel. Record
   its exact host, database name, username and password privately. Do not assume
   that the host is `localhost`.
3. Open the account's database administration/phpMyAdmin. Import
   `database/schema.sql`, then `database/content.sql`. Import each once into the
   empty database; these scripts never drop existing data.
4. Verify there are 2 events, 8 gallery rows and 0 users before creating the admin.
   Compare their IDs and fields with `database/content.json`. That export was
   taken from the existing backend and preserves timestamps and content.
5. Copy `server/config.example.php` to the private `config.php` on the server. Enter
   the database settings, the exact public HTTPS origin (scheme and hostname,
   no trailing path), your owner email, a real sender address, and a random signing
   key. Keep `storage_path` at `__DIR__ . '/uploads'`.
6. Upload `server/private.htaccess` as `private/.htaccess` as additional protection.
   Set private directories to owner-only access where supported (0700) and the
   private configuration to 0600. PHP must be able to read them as your hosting
   account user and write uploads. Never use world-writable 0777 permissions.
7. Keep `confirm_email=true` for the documented confirmation flow. Configure a real
   domain mailbox and confirm PHP `mail()` can send to it. Test delivery, spam
   handling and the return link before opening registration to visitors.
8. Set PHP's `upload_max_filesize` to at least `15M` and `post_max_size` above that
   (for example `16M`) if the account permits these values. The old bucket allowed
   15 MiB images. The PHP application retains that limit and validates image data.

The server needs PDO/pdo_mysql, fileinfo, DOM, JSON, hash and filter. The official
STRATO module list includes them. Do not leave `phpinfo()` or installation endpoints
in the public directory. Set PHP `display_errors=Off` and enable private error
logging so connection details and file paths do not appear in responses.

For an environment with PHP command-line access, the equivalent installation is
`php scripts/database.php install`, `import`, then `verify`, with the private
config path set. Shared-hosting deployment does not depend on SSH or shell access;
the SQL/phpMyAdmin route is sufficient. Never upload `scripts/` into the public root.

## 4. Upload over SFTP and enable the domain

1. Obtain the SFTP server, username, port and account credentials from your STRATO
   account. Use SFTP (SSH file transfer) in a client such as the one you already use;
   verify its host key against the provider's account information.
2. Select every file **inside** `dist/`, including hidden `.htaccess` files, and
   upload them into `/dj-wahid/public/`. Upload the contents, not a nested `dist/`
   directory. Keep all file and directory names case-sensitive.
3. Connect the domain to the internal destination described above. For a domain
   registered elsewhere, use the DNS values supplied by your STRATO account;
   do not guess IP addresses. Preserve MX and other email records.
4. Assign and enable the domain's SSL certificate in STRATO. The supplied rewrite
   sends HTTP to HTTPS after the certificate is ready. It does not force a new
   `www` hostname or otherwise change existing URLs. Set `origin` to the hostname
   visitors actually use; additional aliases need a canonical redirect at the
   domain level so account writes use the configured origin.
5. Visit the HTTPS homepage, then `/admin` directly and after refreshing. Create
   the first account with the configured owner email and confirm its email link.
   The bootstrap email restriction prevents an unrelated visitor claiming the
   first admin account. Subsequent registrations do not receive admin privileges.

PHP's `HTTPS` server variable must reflect the live TLS connection. The rewrite
does not trust client-supplied `X-Forwarded-Proto`. If the host uses a proxy that
does not set `HTTPS`, use STRATO's domain-level HTTPS redirect and remove only the
corresponding rewrite stanza after confirming the provider's configuration.

## 5. Mandatory live hosting smoke test

- `/` returns 200 and contains current published events/gallery in the HTML source.
- `/admin` returns the original sign-in screen and `noindex, nofollow` metadata.
- Refreshing `/admin` works, and an unknown page returns the existing React 404
  with HTTP 404. Navigation anchors reach their original sections.
- All seven images, local fonts, favicon, scripts and styles return 200. Original
  `/__l5e/assets-v1/.../<filename>` image URLs resolve through the compatibility
  rewrite without depending on an external asset service.
- `/api/index.php?action=content` returns JSON. An unknown API path returns 404,
  and a missing `.js`/image file does not return the SPA's HTML.
- `/templates/home.html`, `/api/bootstrap.php`, `/.env`, and private configuration
  requests are denied; directory listing is disabled.
- HTTP redirects once to working HTTPS. HTTPS does not loop. Admin session cookies
  use Secure, HttpOnly and SameSite=Lax; modifying requests require CSRF and Origin.
- First account confirmation, sign-in/out and normal non-admin denial work. Add,
  edit, hide, republish and delete temporary events/photos, then remove test data.
  Uploaded images remain private on disk and signed image links work for one hour.
- Booking, ticket/service dialogs, newsletter confirmation, cart counter, hero
  slider, mobile menu and audio previews retain their original behavior.
- Check browser console/network and PHP logs, then compare both pages at
  1920×1080, 1440×900, 768×1024 and 390×844 with the same browser settings.
- Confirm gzip/deflate for text files and sensible caching for assets in the
  browser network panel. `.htaccess` is authoritative only when tested on Apache.

## Backups, releases and restoration

Before changes, export a consistent database backup through phpMyAdmin and download
`private/config.php`, the entire `private/uploads/` directory and a known-good
public release. Keep backups encrypted/private outside every domain document root.
Do not put database exports or real credentials in GitHub.

For subsequent releases, upload the build to `/dj-wahid/public-next/`, validate it
through an appropriate temporary domain if available, then switch the internal
domain destination. This sibling layout preserves the same private config path.
Keep the previous public directory until the new release is confirmed. Never
replace or delete the private upload directory as part of a frontend deployment.

To restore, switch back to the previous public directory and, if data changed,
restore the matching database and uploads from the same backup point. Restore the
matching private config/signing key. Existing sessions remain valid only if their
database rows and cookies are still valid; changing the signing key invalidates
existing photo links until a new page/feed request issues fresh links.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Build reports missing/wrong image | Restore the exact required files to `public/images/`; do not substitute unrelated images |
| 500 immediately after upload | Hidden `.htaccess` transferred correctly; inspect Apache/PHP error logs and supported directives |
| 503 / empty event or gallery feed | Private config path, exact database host, credentials, PDO MySQL and imported tables |
| `/admin` refresh returns 404 | Domain root, mod_rewrite and uploaded root `.htaccess` |
| Admin writes return 403 | Configured origin matches the browser's scheme/hostname/port; refresh to obtain a CSRF cookie |
| First signup rejected | Use `bootstrap_admin_email` from the private configuration |
| Confirmation email missing | Real sender address, PHP mail setup, spam folder and delivery logs; a failed mail call rolls back account creation |
| Confirmation link expired | Tokens last 24 hours; reset the pending account/token through private database administration rather than exposing a public setup tool |
| Upload rejected | Image validity, original 15 MiB limit, PHP upload/post limits and writable private storage |
| Image link expired | Refresh the page/admin feed to receive a new signed URL |
| Fonts differ | Local `fonts/` directory uploaded completely and font-license files retained |
| Stale frontend after release | Upload the complete build, including new hashed asset filenames; refresh/revalidate the HTML |
| HTTPS redirect loop | SSL enabled and host `HTTPS` variable; use provider-level TLS redirect as described above |

Application server errors are logged privately; responses deliberately do not
include SQL errors, credentials or stack traces. There is no public installer,
password-reset page, payment processor or email-marketing integration in this site.
