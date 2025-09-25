const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function joinUrl(base: string, path: string): string {
  if (!base) {
    return path;
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return `${base}${path}`;
}

export function resolveApiUrl(path: string): string {
  if (!path) {
    return path;
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  return joinUrl(API_BASE_URL, path);
}
