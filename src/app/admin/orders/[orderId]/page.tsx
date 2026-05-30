'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import {
  adminGetOrder,
  adminForceCancel,
  type Order,
} from '@/services/order.service';
import { getPublicProfileById, type PublicProfileResponse } from '@/services/auth.service';
import { isApiError } from '@/services/api-client';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const TIMELINE_STEPS = ['PENDING', 'PAID', 'PURCHASED', 'SHIPPED', 'COMPLETED'];

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId as string;
  const { accessToken, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [jastiperProfile, setJastiperProfile] = useState<PublicProfileResponse | null>(null);
  const [titipersProfile, setTitipersProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken || !orderId) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminGetOrder(accessToken, orderId);
      setOrder(data);
      const [jastiper, titipers] = await Promise.all([
        getPublicProfileById(data.jastiper_id).catch(() => null),
        getPublicProfileById(data.titipers_id).catch(() => null),
      ]);
      setJastiperProfile(jastiper);
      setTitipersProfile(titipers);
    } catch (err) {
      if (isApiError(err) && err.status === 404) {
        setError('Pesanan tidak ditemukan');
      } else {
        setError(isApiError(err) ? err.message : 'Gagal memuat pesanan');
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, orderId]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  async function handleForceCancel() {
    if (!accessToken || !orderId || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await adminForceCancel(accessToken, orderId, cancelReason);
      showToast('Pesanan berhasil dibatalkan', 'success');
      setCancelModal(false);
      setCancelReason('');
      fetchData();
    } catch (err) {
      showToast(isApiError(err) ? err.message : 'Gagal membatalkan pesanan', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  const currentStepIndex = order ? TIMELINE_STEPS.indexOf(order.status) : -1;

  if (authLoading || !accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/orders" className="hover:text-(--color-primary)">Pesanan</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate">{orderId}</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonLoader key={i} variant="card" />)}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="rounded-lg bg-(--color-primary) px-4 py-2 text-sm text-white hover:bg-(--color-primary-dark) transition"
            >
              Coba lagi
            </button>
          </div>
        ) : order ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detail Pesanan</h1>
                <p className="text-sm text-gray-500 mt-1">ID: {orderId}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Timeline */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Pesanan</h2>
              <div className="flex items-center gap-1">
                {TIMELINE_STEPS.map((step, idx) => {
                  const done = idx <= currentStepIndex;
                  const isLast = idx === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${
                        done ? 'bg-(--color-primary) text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {done ? '✓' : idx + 1}
                      </div>
                      {!isLast && (
                        <div className={`flex-1 h-1 mx-1 rounded ${done ? 'bg-(--color-primary)' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                {TIMELINE_STEPS.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Informasi Produk</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nama Produk</span>
                    <Link href={`/catalog/${order.product_id}`} className="text-(--color-primary) hover:underline font-medium text-right">
                      {order.product_snapshot?.name}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kuantitas</span>
                    <span className="text-gray-800">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Harga Satuan</span>
                    <span className="text-gray-800">{formatRupiah(order.unit_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biaya Jasa</span>
                    <span className="text-gray-800">{formatRupiah(order.service_fee)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="font-bold text-(--color-primary-dark)">
                      {formatRupiah(order.total_price)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Informasi Pengiriman</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Alamat</span>
                    <span className="text-gray-800 text-right max-w-[200px]">
                      {order.shipping_address?.street}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kota</span>
                    <span className="text-gray-800">{order.shipping_address?.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kode Pos</span>
                    <span className="text-gray-800">{order.shipping_address?.postal_code}</span>
                  </div>
                  {order.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resi</span>
                      <span className="text-gray-800">{order.tracking_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Pembeli (TITIPERS)</h2>
                <div className="flex items-center gap-3">
                  {titipersProfile?.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={titipersProfile.profile_picture_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-(--color-primary)/10 flex items-center justify-center text-(--color-primary) font-semibold text-sm">
                      {(titipersProfile?.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {titipersProfile?.full_name || titipersProfile?.username || order.titipers_id.slice(0, 8) + '...'}
                    </p>
                    {titipersProfile?.username && (
                      <p className="text-xs text-gray-500">@{titipersProfile.username}</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!jastiperProfile) return;
                  router.push(`/jastiper/${jastiperProfile.username}`);
                }}
                className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition text-left w-full"
              >
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Penjual (JASTIPER)</h2>
                <div className="flex items-center gap-3">
                  {jastiperProfile?.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={jastiperProfile.profile_picture_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-(--color-primary)/10 flex items-center justify-center text-(--color-primary) font-semibold text-sm">
                      {(jastiperProfile?.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {jastiperProfile?.full_name || jastiperProfile?.username || order.jastiper_id.slice(0, 8) + '...'}
                    </p>
                    {jastiperProfile?.username && (
                      <p className="text-xs text-gray-500">@{jastiperProfile.username}</p>
                    )}
                  </div>
                  <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Timestamps */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Waktu</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dibuat</span>
                  <span className="text-gray-800">{formatDate(order.created_at)}</span>
                </div>
                {order.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Diperbarui</span>
                    <span className="text-gray-800">{formatDate(order.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-5">
                <h2 className="text-sm font-semibold text-red-800 mb-3">Tindakan Admin</h2>
                <button
                  onClick={() => setCancelModal(true)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition"
                >
                  Force Cancel Pesanan
                </button>
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Cancel modal */}
      <ConfirmModal
        isOpen={cancelModal}
        onClose={() => { setCancelModal(false); setCancelReason(''); }}
        onConfirm={handleForceCancel}
        title="Force Cancel Pesanan"
        message="Apakah Anda yakin ingin memaksa membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Force Cancel"
        isLoading={actionLoading}
      >
        <div>
          <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Alasan Pembatalan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Jelaskan alasan pembatalan"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{cancelReason.length}/500</p>
        </div>
      </ConfirmModal>
    </div>
  );
}
