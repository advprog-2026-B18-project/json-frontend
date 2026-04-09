'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { isApiError } from '@/lib/api/client';
import {
  register,
  type RegisterErrorListResponse,
  type RegisterMessageResponse,
  type RegisterRole,
} from '@/lib/api/auth';

const SUCCESS_REDIRECT_DELAY = 2500;

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [passwordConfirmationError, setPasswordConfirmationError] = useState('');
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!showSuccessModal) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push('/login');
    }, SUCCESS_REDIRECT_DELAY);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, showSuccessModal]);

  const handleSubmit = async (formData: FormData) => {
    setPasswordConfirmationError('');
    setApiErrors([]);

    const submittedEmail = String(formData.get('email') ?? '');
    const submittedPassword = String(formData.get('password') ?? '');
    const submittedPasswordConfirmation = String(formData.get('password_confirmation') ?? '');
    const submittedRole: RegisterRole = 'TITIPERS';

    if (submittedPassword !== submittedPasswordConfirmation) {
      setPasswordConfirmationError('Password dan konfirmasi password harus sama.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: submittedEmail,
        password: submittedPassword,
        password_confirmation: submittedPasswordConfirmation,
        role: submittedRole,
      });
      setShowSuccessModal(true);
      return;
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 400 || error.status === 422) {
          const data = error.body as RegisterErrorListResponse | null;
          const messages = (data?.errors ?? [])
            .map((item) => item.message)
            .filter((message) => Boolean(message));

          setApiErrors(messages.length > 0 ? messages : ['Registrasi gagal.']);
          return;
        }

        if (error.status === 409) {
          const data = error.body as RegisterMessageResponse | null;
          setApiErrors([data?.message ?? 'Email already registered']);
          return;
        }

        const fallbackData = error.body as RegisterMessageResponse | null;
        setApiErrors([fallbackData?.message ?? 'Terjadi kesalahan. Silakan coba lagi.']);
        return;
      }

      setApiErrors([error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-[color:var(--color-primary-dark)] to-[color:var(--color-primary)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-8 shadow-lg backdrop-blur">
          <h1 className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-[color:var(--color-primary-dark)] to-[color:var(--color-primary)] bg-clip-text text-transparent">
            Register
          </h1>

          <form className="mt-6 space-y-4" action={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-[#519A66]/30 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#519A66]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[#519A66]/30 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#519A66]"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                required
                value={passwordConfirmation}
                onChange={(event) => {
                  setPasswordConfirmation(event.target.value);
                  if (passwordConfirmationError) {
                    setPasswordConfirmationError('');
                  }
                }}
                className="w-full rounded-lg border border-[#519A66]/30 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#519A66]"
                placeholder="••••••••"
              />
              {passwordConfirmationError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {passwordConfirmationError}
                </p>
              )}
            </div>

            {apiErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
                <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                  {apiErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gradient-to-r from-[color:var(--color-primary-dark)] to-[color:var(--color-primary)] px-4 py-2 text-white font-semibold shadow-sm hover:from-[color:var(--color-primary)] hover:to-[color:var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Memuat...' : 'Register'}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-[#237227] hover:underline font-medium">
              Masuk di sini
            </Link>
          </p>
        </div>
      </main>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-lg">
            <p className="text-base font-medium text-gray-900">Registrasi berhasil. Silahkan login.</p>
          </div>
        </div>
      )}
    </>
  );
}
