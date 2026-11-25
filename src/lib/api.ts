let csrfToken: string | undefined;
let sessionRequest: Promise<Session> | undefined;
type Session = { user: { id: string; email: string } | null; csrf_token: string };

export async function api<T>(action: string, data?: unknown): Promise<T> {
  if (data !== undefined && !csrfToken) await getSession();
  const isFile = data instanceof FormData;
  const response = await fetch(`/api/index.php?action=${encodeURIComponent(action)}`, {
    method: data === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: data === undefined ? {} : {
      "X-CSRF-Token": csrfToken ?? "",
      ...(isFile ? {} : { "Content-Type": "application/json" }),
    },
    ...(data === undefined ? {} : { body: isFile ? data : JSON.stringify(data) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result as T;
}

export function getSession(): Promise<Session> {
  if (!sessionRequest) {
    sessionRequest = api<Session>("session").then((session) => {
      csrfToken = session.csrf_token;
      return session;
    }).finally(() => { sessionRequest = undefined; });
  }
  return sessionRequest;
}

const authChanged = () => window.dispatchEvent(new Event("site-auth-changed"));
export async function signIn(email: string, password: string) {
  await api("signin", { email, password });
  authChanged();
}
export async function signUp(email: string, password: string) {
  const result = await api<{ session: boolean }>("signup", { email, password });
  if (result.session) authChanged();
  return result;
}
export async function signOut() {
  await api("signout", {});
  authChanged();
}
export async function uploadPhoto(file: File) {
  const form = new FormData();
  form.append("photo", file);
  return api<{ image_url: string }>("upload", form);
}
