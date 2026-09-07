import { Spinner } from "@/components/ui/Spinner";

export default function ClientLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8 text-brand-primary" />
    </div>
  );
}
