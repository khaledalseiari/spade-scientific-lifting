import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-16">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-brand-ink">Welcome back</h1>
          <p className="mb-6 text-sm text-gray-600">Sign in to your coaching dashboard.</p>
          <Suspense>
            <SignInForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-gray-600">
            Need an account?{" "}
            <Link href="/sign-up" className="font-medium text-brand-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
