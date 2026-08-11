/**
 * React Bits–style ambient aurora background: slow, blurred gradient orbs
 * drifting behind the whole app. Purely decorative, aria-hidden.
 */
export function Aurora() {
  return (
    <div aria-hidden className="aurora">
      <div className="aurora__orb aurora__orb--a" />
      <div className="aurora__orb aurora__orb--b" />
      <div className="aurora__orb aurora__orb--c" />
      <div className="aurora__vignette" />
    </div>
  );
}
