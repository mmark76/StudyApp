const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function getSecureTransportUrl(href: string): string | null {
  const url = new URL(href);
  if (url.protocol !== "http:" || LOCAL_DEVELOPMENT_HOSTS.has(url.hostname)) {
    return null;
  }
  url.protocol = "https:";
  return url.href;
}

export function enforceSecureTransport(
  location: Pick<Location, "href" | "replace"> = window.location,
): boolean {
  const secureUrl = getSecureTransportUrl(location.href);
  if (!secureUrl) return false;
  location.replace(secureUrl);
  return true;
}
