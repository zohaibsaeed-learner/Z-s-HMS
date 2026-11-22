export async function get(path) {
  try {
    const r = await fetch(path, { cache: "no-store" });
    return await r.json();
  } catch {
    return [];
  }
}

export async function post(path, data = {}) {
  try {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data),
    });
    return await r.json();
  } catch {
    return { ok: false, message: "Cannot reach the C++ server. Is hms_server.exe running?" };
  }
}