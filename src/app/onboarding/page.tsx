import type { Metadata } from "next";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Set up your profile" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand-ink">Let&apos;s set your baseline</h1>
        <p className="mb-6 text-sm text-gray-600">
          This seeds your calorie and macro targets — you can update it anytime in Settings.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
