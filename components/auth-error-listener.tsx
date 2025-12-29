"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function AuthErrorListener() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check query params
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");
    
    if (error && error_description) {
      // Delay slightly to ensure Toaster is ready
      setTimeout(() => {
        toast.error(error_description, {
          action: {
            label: "Try Again",
            onClick: () => router.push("/login"),
          },
          duration: 8000, // Show for longer
        });
      }, 0);
    }

    // Also check hash fragment if needed (though Next.js useSearchParams usually handles query)
    // Supabase sometimes puts errors in the hash.
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const hashError = params.get("error");
      const hashErrorDesc = params.get("error_description");

      if (hashError && hashErrorDesc) {
         setTimeout(() => {
          toast.error(hashErrorDesc.replace(/\+/g, " "), {
            action: {
              label: "Try Again",
              onClick: () => router.push("/login"),
            },
            duration: 8000,
          });
        }, 0);
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);

  }, [searchParams]);

  return null;
}
