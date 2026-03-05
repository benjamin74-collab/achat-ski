"use client";

export default function OpenCookiePreferences() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("cookie-consent-open"))}
      className="text-sm underline underline-offset-4 hover:opacity-80"
      title="Gestion des cookies"
    >
      Cookies
    </button>
  );
}