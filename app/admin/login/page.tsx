import { LoginForm } from "@/components/admin/login-form";
import { getAdminSession } from "@/lib/admin/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  /* Zaten girmişse giriş ekranını göstermenin anlamı yok. */
  const { isAuth } = await getAdminSession();
  if (isAuth) redirect("/admin");

  const { next } = await props.searchParams;
  const nextPath = typeof next === "string" ? next : "/admin";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
      <div className="border border-line bg-shell p-8 sm:p-10">
        <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">
          Restricted
        </p>
        <h1 className="mt-2 font-display text-2xl text-sea-deep">
          Admin sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-70">
          This area manages live listings and site content.
        </p>

        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
