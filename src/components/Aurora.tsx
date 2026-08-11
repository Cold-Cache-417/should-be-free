import { useEffect } from "react";

/**
 * Ambient aurora background: large pre-blurred gradient orbs drifting on
 * the compositor (transform-only, no filter/blend so it stays GPU-cheap).
 * Pauses when the tab is hidden to save battery.
 */
export function Aurora() {
  useEffect(() => {
    const setPaused = (paused: boolean) => {
      document
        .querySelectorAll<HTMLElement>(".aurora__orb")
        .forEach((orb) => orb.style.setProperty("animation-play-state", paused ? "paused" : "running"));
    };
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div aria-hidden className="aurora">
      <div className="aurora__orb aurora__orb--a" />
      <div className="aurora__orb aurora__orb--b" />
      <div className="aurora__orb aurora__orb--c" />
      <div className="aurora__vignette" />
    </div>
  );
}
