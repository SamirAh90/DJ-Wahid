# Project maintenance

This is the independent DJ Wahid website targeting STRATO shared hosting.

- Preserve the approved appearance, content, responsive layouts and existing URLs.
- Build with npm ci and npm run build; deploy only dist/ to the domain document root.
- Production uses PHP 8.3+ and MySQL/MariaDB; Node.js is a local build tool only.
- Keep credentials and uploaded images in the private sibling directory, outside the document root.
- Database installation scripts are in database/. Back up data before applying changes.
- Do not edit src/routeTree.gen.ts manually; the router plugin regenerates it.
- Preserve Git history; never force-push or overwrite other people's work.
- Run typecheck, tests, PHP checks and deployment checks for technical migrations.
