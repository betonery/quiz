export function appendCurrentSearchParams(url: string): string {
  if (typeof window === "undefined") {
    return url;
  }

  const currentParams = new URLSearchParams(window.location.search);
  if ([...currentParams.keys()].length === 0) {
    return url;
  }

  try {
    const target = new URL(url);
    currentParams.forEach((value, key) => {
      if (!target.searchParams.has(key)) {
        target.searchParams.set(key, value);
      }
    });
    return target.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${currentParams.toString()}`;
  }
}
