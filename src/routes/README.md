# Routes

TanStack Router uses file-based routing. The Vite router plugin generates
`src/routeTree.gen.ts`; do not edit that file manually.

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `admin.tsx` | `/admin` |
| `__root.tsx` | Shared providers, metadata and error/404 components |

`src/main.tsx` mounts the browser router. The build also renders the approved React
components into HTML templates. `server/index.php` serves those templates with the
current published database records before JavaScript loads. Apache sends page
requests to this PHP entry point; API and static asset requests are excluded.
