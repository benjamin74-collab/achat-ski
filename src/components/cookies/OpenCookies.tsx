"use client";

export default function OpenCookies() {
  return (
    <button
      type="button"
      className="text-sm underline underline-offset-4 hover:opacity-80"
      onClick={() => window.dispatchEvent(new Event("cookie-consent-open"))}
      title="Gestion des cookies"
    >
      Cookies
    </button>
  );
}