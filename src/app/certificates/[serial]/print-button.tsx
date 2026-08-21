'use client';

/** Print is a browser capability, so this is the one interactive element on the page. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
