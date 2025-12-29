"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Authentication Error</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {error || "There was an error verifying your email link. The link may have expired or has already been used."}
        </p>
        <div className="space-y-4">
          <Link href="/login">
            <Button className="w-full">Try Logging In Again</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">Go to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
