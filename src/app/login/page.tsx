'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { isApiError } from '@/lib/api/client';
import { login, type LoginErrorResponse } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { setAccessToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setErrorMessage('');

    const submittedEmail = String(formData.get('email') ?? '');
    const submittedPassword = String(formData.get('password') ?? '');

    setIsSubmitting(true);

    try {
      const data = await login(submittedEmail, submittedPassword);
      setAccessToken(data.access_token);
      router.push('/');
      return;
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 401 || error.status === 403) {
          const body = error.body as LoginErrorResponse | null;
          setErrorMessage(body?.message ?? 'Login gagal.');
          return;
        }

        const body = error.body as LoginErrorResponse | null;
        setErrorMessage(body?.message ?? 'Terjadi kesalahan. Silakan coba lagi.');
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[color:var(--color-primary-dark)] to-[color:var(--color-primary)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-8 shadow-lg backdrop-blur">
        <h1 className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-[color:var(--color-primary-dark)] to-[color:var(--color-primary)] bg-clip-text text-transparent">
          Login
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

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-[color:var(--color-primary-dark)] to-[color:var(--color-primary)] px-4 py-2 text-white font-semibold shadow-sm hover:from-[color:var(--color-primary)] hover:to-[color:var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Memuat...' : 'Login'}
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-600">
          Belum punya akun?{' '}
          <Link href="/register" className="text-[#237227] hover:underline font-medium">
            Daftar di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
