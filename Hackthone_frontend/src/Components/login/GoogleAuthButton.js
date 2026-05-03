import React from "react";
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "../../services/authApi";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let googleScriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${GOOGLE_SCRIPT_SRC}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load Google sign-in.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Google sign-in."));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}

export default function GoogleAuthButton({
  label = "Continue with Google",
  onSuccess,
  onError,
}) {
  const buttonContainerRef = React.useRef(null);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    let isCancelled = false;

    if (!GOOGLE_CLIENT_ID || /^your_/i.test(GOOGLE_CLIENT_ID)) {
      setMessage("Google sign-in is not configured yet.");
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (isCancelled || !window.google?.accounts?.id || !buttonContainerRef.current) {
          return;
        }

        setMessage("");
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (onSuccess) {
              onSuccess(response.credential);
            }
          },
        });

        buttonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: Math.min(buttonContainerRef.current.offsetWidth || 360, 360),
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        const nextMessage =
          error instanceof Error ? error.message : "Google sign-in failed.";
        setMessage(nextMessage);
        onError?.(error);
      });

    return () => {
      isCancelled = true;
    };
  }, [onError]);

  return (
    <div className="space-y-3">
      <div className="liquid-glass-chip flex w-full items-center justify-center rounded-2xl px-4 py-3">
        <div
          ref={buttonContainerRef}
          className="flex min-h-[44px] w-full items-center justify-center"
          aria-label={label}
        />
      </div>
      {message ? (
        <p className="text-center text-sm text-red-200">{message}</p>
      ) : null}
    </div>
  );
}
