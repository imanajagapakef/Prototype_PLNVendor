import { redirect } from "next/navigation";
import { Info, PlugZap } from "lucide-react";
import { getViewer } from "@/lib/supabase/server";
import { signIn } from "./actions";
import { LoginSubmitButton } from "./submit-button";

const OPERATIONAL_STAGES = [
  "Kontrak",
  "Dokumen",
  "Persetujuan",
  "Material",
  "Work Order",
  "Pelaksanaan",
  "Inspeksi",
  "Serah Terima",
  "Pembayaran",
];

const inputClass =
  "mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await getViewer();
  if (viewer) redirect("/");
  const { error } = await searchParams;
  const hasError = Boolean(error);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid w-full items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <section aria-label="Tentang NEXORA" className="rounded-lg bg-pln-blue p-6 sm:p-8 text-white max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pln-yellow">
            Connected Operations Platform
          </p>
          <p className="mt-3 flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            <PlugZap className="size-8 text-pln-yellow sm:size-9" aria-hidden />
            NEXORA
          </p>
          <p className="mt-4 max-w-md text-xl font-medium tracking-tight text-white">
            Dari kontrak sampai penyelesaian.
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
            Satu alur operasional untuk kontrak, dokumen, persetujuan,
            material, work order, pelaksanaan, inspeksi, dan pembayaran.
          </p>

          <div aria-hidden="true" className="mt-10 hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Alur NEXORA
            </p>
            <div className="mt-4 border-l border-pln-yellow/40 pl-5">
              {OPERATIONAL_STAGES.map((stage, index) => (
                <div key={stage} className="py-0.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    {stage}
                  </p>
                  {index < OPERATIONAL_STAGES.length - 1 && (
                    <span className="my-0.5 block h-2 w-px bg-pln-yellow" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="login-title"
          className="w-full max-w-[440px] justify-self-start border-t border-line pt-10 lg:justify-self-end lg:border-l lg:border-t-0 lg:pl-16 lg:pt-2"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-warn-bg px-2.5 py-1 text-xs font-medium text-warn">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-warn" />
            DEMO · PEMETAAN AWAL
          </p>
          <div aria-hidden="true" className="mt-5 h-1 w-12 bg-accent" />
          <h1
            id="login-title"
            className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Masuk ke NEXORA
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Gunakan akun demo yang sudah disiapkan untuk masuk ke alur
            operasional.
          </p>

          <form action={signIn} className="mt-6 space-y-4">
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
                aria-describedby={hasError ? "login-error" : undefined}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-xs font-medium text-muted"
              >
                KATA SANDI
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                aria-describedby={hasError ? "login-error" : undefined}
                className={inputClass}
              />
            </div>
            {hasError && (
              <p
                id="login-error"
                role="alert"
                className="rounded-md border border-bad/30 bg-bad-bg px-3 py-2 text-sm text-bad"
              >
                Email atau kata sandi salah.
              </p>
            )}
            <LoginSubmitButton />
          </form>

          <p className="mt-8 text-xs leading-relaxed text-muted lg:hidden">
            <span className="font-semibold text-ink">Konteks operasional:</span>{" "}
            Kontrak · Dokumen · Persetujuan · Material · Work order ·
            Pelaksanaan · Inspeksi · Serah terima · Pembayaran
          </p>

          <div className="mt-6 rounded-md border border-line border-l-2 border-l-warn bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-warn">
              <Info className="size-4" aria-hidden />
              Demo environment
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Data kontrak, vendor, dan dokumen bersifat fiktif. Tidak
              terhubung ke sistem produksi PLN.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
