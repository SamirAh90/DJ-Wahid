import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();
await router.load();
const root = document.getElementById("root")!;
const application = <RouterProvider router={router} />;
// PHP supplies readable initial HTML. Mount the client router after its initial
// data is ready; its Suspense boundaries do not share an SSR router runtime.
createRoot(root).render(application);
