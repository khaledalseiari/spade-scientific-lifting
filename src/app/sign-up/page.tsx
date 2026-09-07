import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-16">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-brand-ink">Create your account</h1>
          <p className="mb-6 text-sm text-gray-600">
            We&apos;ll set up your training and nutrition targets next.
          </p>
          <SignUpForm />
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-brand-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
