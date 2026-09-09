import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            // setAll from a Server Component: session refreshes on next action.
          }
        },
      },
    },
  );
}

export interface Viewer {
  id: string;
  email: string;
  role: "pln_pic" | "manager" | "warehouse" | "inspector" | "vendor";
  vendor_id: string | null;
  display_name: string;
}

// Role comes from the protected profiles table, never from the request.
export async function getViewer(): Promise<Viewer | null> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) return null;
  const { data: profile } = await sb
    .from("profiles")
    .select("role,vendor_id,display_name")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return { id: user.id, email: user.email, ...profile } as Viewer;
}
