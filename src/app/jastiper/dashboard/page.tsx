'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useAuthorizedFetch } from '@/lib/api/useAuthorizedFetch';
import { isApiError } from '@/services/api-client';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';

type KycRequestSummary = {
  submission_id: string;
  user_id: string;
  username: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
};

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const { authorizedFetch } = useAuthorizedFetch();

  const [kycRequests, setKycRequests] = useState<KycRequestSummary[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [systemBalance, setSystemBalance] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.push('/login?redirectedFrom=/admin/dashboard');
    }
  }, [authLoading, accessToken, router]);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const fetchAdminDashboard = useCallback(async () => {
    if (!accessToken) return;
    setDataLoading(true);
    setError('');
    try {
      const [kycData, walletSummaryData] = await Promise.all([
        authorizedFetch<{ data: KycRequestSummary[] }>('auth', '/admin/kyc?page=1&limit=5').catch(() => ({ data: [] })),
        authorizedFetch<{ total_escrow_balance?: number }>('payment', '/admin/wallets/summary').catch(() => ({ total_escrow_balance: 0 })),
      ]);

      setKycRequests(kycData.data || []);
      if (walletSummaryData && typeof walletSummaryData.total_escrow_balance === 'number') {
        setSystemBalance(walletSummaryData.total_escrow_balance);
      } else {
        setSystemBalance(0);
      }
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan memuat data administrasi.');
      }
    } finally {
      setDataLoading(false);
    }
  }, [accessToken, authorizedFetch]);

  useEffect(() => {
    if (!authLoading && accessToken && user?.role === 'ADMIN') {
      fetchAdminDashboard();
    }
  }, [authLoading, accessToken, user, fetchAdminDashboard]);

  const pendingKycCount = kycRequests.filter((r) => r.status === 'PENDING').length;
  const approvedKycCount = kycRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedKycCount = kycRequests.filter((r) => r.status === 'REJECTED').length;

  if (authLoading || !accessToken || (user && user.role !== 'ADMIN')) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-sm text-gray-500 mt-1">
              Selamat datang, {user?.username || 'System Administrator'}
            </p>
          </div>

          {/* System Wallet Summary Section (Style Card Identik) */}
          <div className="rounded-2xl bg-linear-to-br from-slate-700 to-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm text-white/80">Total Dana Escrow Berjalan (Sistem)</p>
            {dataLoading ? (
                <div className="h-8 w-40 rounded bg-white/20 animate-pulse mt-1" />
            ) : systemBalance !== null ? (
                <p className="mt-1 text-3xl font-extrabold">{formatRupiah(systemBalance)}</p>
            ) : (
                <p className="mt-1 text-sm text-white/60">Gagal memuat neraca finansial</p>
            )}
            <div className="mt-4 flex gap-3">
              <Link
                  href="/admin/wallet/summary"
                  className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition text-white"
              >
                Ringkasan Finansial
              </Link>
              <Link
                  href="/admin/wallet/requests"
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-gray-100 transition"
              >
                Tinjau Penarikan
              </Link>
            </div>
          </div>

          {/* Stats Grid (Style Card Identik) */}
          {dataLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 animate-pulse">
                      <div className="h-3 w-20 rounded bg-gray-200" />
                      <div className="h-8 w-12 rounded bg-gray-200 mt-2" />
                    </div>
                ))}
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Antrean KYC Pending" value={pendingKycCount} color="text-amber-600" />
                <StatCard label="KYC Disetujui" value={approvedKycCount} color="text-green-600" />
                <StatCard label="KYC Ditolak" value={rejectedKycCount} color="text-red-600" />
              </div>
          )}

          {/* Recent Activity Table (Style Table Identik dengan Jastiper) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Antrean Verifikasi Jastiper (KYC)</h2>
              <Link href="/admin/kyc" className="text-sm text-primary hover:underline">
                Lihat Semua
              </Link>
            </div>

            {dataLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <SkeletonLoader key={i} variant="row" />)}
                </div>
            ) : error ? (
                <div className="rounded-xl bg-white p-6 text-center shadow-sm">
                  <p className="text-sm text-red-600">{error}</p>
                  <button onClick={fetchAdminDashboard} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark transition">Coba lagi</button>
                </div>
            ) : kycRequests.length === 0 ? (
                <EmptyState title="Antrean KYC bersih" description="Tidak ada dokumen verifikasi akun baru yang perlu ditinjau." action={{ label: 'Kelola Pengguna', href: '/admin/users' }} />
            ) : (
                <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Email Pengguna</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Tanggal Masuk</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {kycRequests.map((req) => (
                        <tr key={req.submission_id} onClick={() => router.push('/admin/kyc')} className="hover:bg-gray-50 transition cursor-pointer">
                          <td className="px-4 py-3 font-medium text-gray-900">{req.username || 'User'}</td>
                          <td className="px-4 py-3 text-gray-500">{req.email}</td>
                          <td className="px-4 py-3"><StatusBadge status={req.status} type="kyc" /></td>
                          <td className="px-4 py-3 text-xs text-gray-400">{formatDate(req.created_at)}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </section>

          {/* Quick Links (Style Quick links Identik) */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/admin/kyc" className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
              <p className="text-sm font-semibold text-gray-900">Modul KYC</p>
              <p className="text-xs text-gray-500 mt-1">Verifikasi KTP</p>
            </Link>
            <Link href="/admin/users" className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
              <p className="text-sm font-semibold text-gray-900">Manajemen User</p>
              <p className="text-xs text-gray-500 mt-1">Kelola data akun</p>
            </Link>
            <Link href="/admin/catalog" className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
              <p className="text-sm font-semibold text-gray-900">Moderasi Produk</p>
              <p className="text-xs text-gray-500 mt-1">Katalog nasional</p>
            </Link>
            <Link href="/admin/wallet/summary" className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
              <p className="text-sm font-semibold text-gray-900">Finansial</p>
              <p className="text-xs text-gray-500 mt-1">Escrow Summary</p>
            </Link>
          </section>
        </main>
      </div>
  );
}