'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getPublicProfile,
  isApiError,
  type PublicProfileResponse,
  type AccountStatus,
} from '@/services/auth.service';
import { Navbar } from '@/components/Navbar';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const map: Record<AccountStatus, { label: string; cls: string }> = {
    ACTIVE: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
    BANNED: { label: 'Dinonaktifkan', cls: 'bg-red-100 text-red-700' },
    PENDING_VERIFICATION: { label: 'Menunggu Verifikasi', cls: 'bg-yellow-100 text-yellow-700' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${starSize} ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params.username ?? '');

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    getPublicProfile(username)
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((err) => {
        if (cancelled) return;
        if (isApiError(err) && err.status === 404) {
          setError('not_found');
        } else {
          setError('error');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-12 animate-pulse space-y-6">
          <div className="flex gap-6 items-center">
            <div className="h-20 w-20 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-40 rounded bg-gray-200" />
              <div className="h-4 w-60 rounded bg-gray-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex flex-col items-center justify-center px-4 py-32 text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">Profil tidak ditemukan</p>
          <p className="text-gray-500 mb-6">Pengguna dengan nama akun &quot;{username}&quot; tidak terdaftar di platform JSON.</p>
          <Link href="/catalog" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition">
            Kembali ke Katalog
          </Link>
        </main>
      </div>
    );
  }

  if (error === 'error' || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex flex-col items-center justify-center px-4 py-32 text-center">
          <p className="text-xl font-bold text-gray-800 mb-2">Gagal memuat profil</p>
          <p className="text-gray-500 mb-6">Terjadi kesalahan saat memuat profil. Coba lagi nanti.</p>
          <Link href="/catalog" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition">
            Kembali ke Katalog
          </Link>
        </main>
      </div>
    );
  }

  const isJastiper = profile.role === 'JASTIPER';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <div className="shrink-0">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.username}
                  className="h-20 w-20 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{profile.username}</h1>
                <StatusBadge status={profile.status} />
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {profile.role === 'JASTIPER' ? 'Jastiper' : 'Titipers'}
                </span>
              </div>
              {profile.full_name && (
                <p className="text-gray-600 font-medium">{profile.full_name}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Bergabung sejak {formatDate(profile.member_since)}
              </p>
            </div>
          </div>

          {profile.status === 'BANNED' && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Perhatian: Akun ini telah ditangguhkan oleh platform.
            </div>
          )}

          {isJastiper && profile.stats && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Statistik Jastiper</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">{profile.stats.total_orders}</p>
                  <p className="text-xs text-gray-400">Total Transaksi</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {(profile.stats.success_rate * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-400">Selesai Berhasil</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="flex items-center justify-center h-7">
                    <RatingStars rating={profile.stats.avg_rating} size="md" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Reputasi Penjual</p>
                </div>
              </div>
            </div>
          )}

          {profile.badges && profile.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {profile.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full bg-secondary-light px-2.5 py-0.5 text-xs font-semibold text-gray-800"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {isJastiper && (
            <div className="mt-5">
              <Link
                href={`/jastiper/${profile.username}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Lihat katalog produk &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
