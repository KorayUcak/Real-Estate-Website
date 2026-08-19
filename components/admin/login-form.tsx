"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/app/admin/login/actions";

const INITIAL: LoginState = { error: null };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(login, INITIAL);

  return (
    <form action={formAction} className="mt-7 space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      <div>
        <label
          htmlFor="password"
          className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-40"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          /* Parola yöneticileri doğru alanı tanısın diye. */
          autoComplete="current-password"
          autoFocus
          aria-describedby={state.error ? "login-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          className="mt-2 w-full rounded-sm border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-sea"
        />
      </div>

      {state.error ? (
        /* `role="alert"`: ekran okuyucu hatayı odak değişmeden duyurur. */
        <p id="login-error" role="alert" className="text-sm text-gold-deep">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

/**
 * Ayrı bileşen olmak ZORUNDA: `useFormStatus` yalnızca gönderilen
 * <form>'un ALTINDAKİ bir bileşenden okunabilir, formu render eden
 * bileşenden değil.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-sea-deep px-5 py-3 font-sans text-xs font-bold uppercase tracking-widest text-shell transition-colors hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Checking…" : "Sign in"}
    </button>
  );
}
