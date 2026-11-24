// A GET that THROWS on network failure or non-2xx, so "offline" is
// distinguishable from "the server returned an empty list".
export async function getJson(path) {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// POST form-urlencoded. Returns the C++ {ok, message} object.
// A network failure is reported as a not-ok result with a clear message.
export async function post(path, data = {}) {
  try {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data),
    });
    return await r.json();
  } catch {
    return { ok: false, message: "Cannot reach the server. Is hms_server.exe running?" };
  }
}
