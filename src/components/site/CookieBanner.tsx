import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "wn_cookie_consent_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(KEY, "accepted");
    setVisible(false);
  };
  const decline = () => {
    localStorage.setItem(KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-ink/10 bg-card p-4 shadow-2xl md:bottom-5">
      <div className="flex flex-col items-start gap-3 text-sm text-ink/70 md:flex-row md:items-center md:gap-4">
        <p className="flex-1">
          We use cookies to improve your experience and analyze site traffic. By clicking
          “Accept”, you agree to our use of cookies.
        </p>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <button
            onClick={decline}
            className="flex-1 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink hover:bg-ink/5 md:flex-none"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-ink-foreground hover:opacity-90 md:flex-none"
          >
            Accept
          </button>
          <button
            onClick={decline}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink/50 hover:bg-ink/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
