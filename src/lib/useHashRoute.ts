import { useEffect, useState } from "react";

function normalize(hash: string): string {
  const path = hash.replace(/^#/, "").split("?")[0];
  if (path === "") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/** Minimal hash router: "#/calculator" → "/calculator". Works on any static host. */
export function useHashRoute(): string {
  const [route, setRoute] = useState<string>(() => normalize(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(normalize(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export function navigate(to: string) {
  if (normalize(window.location.hash) === to) return;
  window.location.hash = to;
}
