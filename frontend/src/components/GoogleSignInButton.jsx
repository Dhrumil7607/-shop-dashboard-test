/**
 * GoogleSignInButton — renders the official "Sign in with Google" button using
 * Google Identity Services. On success it hands the ID token (credential) to
 * `onCredential`, which should exchange it with our backend (/auth/google).
 *
 * The Client ID is public (REACT_APP_GOOGLE_CLIENT_ID). No secret is used.
 */
import { useEffect, useRef, useCallback } from "react";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

export default function GoogleSignInButton({ onCredential, text = "signin_with" }) {
  const holder = useRef(null);

  const render = useCallback(() => {
    if (!window.google?.accounts?.id || !holder.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => resp?.credential && onCredential(resp.credential),
        ux_mode: "popup",
      });
      holder.current.innerHTML = "";
      window.google.accounts.id.renderButton(holder.current, {
        theme: "outline", size: "large", width: 340, text, shape: "pill", logo_alignment: "center",
      });
    } catch { /* ignore — button just won't render */ }
  }, [onCredential, text]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (window.google?.accounts?.id) { render(); return; }
    let script = document.getElementById("gsi-client");
    if (!script) {
      script = document.createElement("script");
      script.id = "gsi-client";
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => script && script.removeEventListener("load", render);
  }, [render]);

  if (!CLIENT_ID) return null;
  return <div ref={holder} className="flex justify-center min-h-[44px]" aria-label="Sign in with Google" />;
}
