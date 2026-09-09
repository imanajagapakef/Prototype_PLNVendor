import { redirect } from "next/navigation";
import { PlugZap } from "lucide-react";
import { getViewer } from "@/lib/supabase/server";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await getViewer();
  if (viewer) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <div className="rounded-lg border border-line bg-surface p-6">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <PlugZap className="size-4 text-accent" aria-hidden />
          Vendor Operations Portal
        </p>
        <h1 className="mt-3 text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-xs text-muted">
          DEMO WORKFLOW · use a seeded demo account
        </p>
        <form action={signIn} className="mt-4 space-y-3">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-muted">
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="direksi@demo.pln"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium text-muted">
              PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-bad">
              Wrong email or password.
            </p>
          )}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
