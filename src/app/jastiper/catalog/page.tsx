'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  getMyProducts,
  updateProduct,
  deleteProduct,
  isApiError,
} from '@/services/inventory.service';
import type { ProductResponse, ProductStatus } from '@/services/inventory.service';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Navbar } from '@/components/Navbar';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { label: string; cls: string }> = {
    ACTIVE: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
    OUT_OF_STOCK: { label: 'Stok Habis', cls: 'bg-orange-100 text-orange-700' },
    HIDDEN: { label: 'Disembunyikan', cls: 'bg-yellow-100 text-yellow-700' },
    REMOVED_BY_ADMIN: { label: 'Dihapus Admin', cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

type ToastType = 'success' | 'error';
function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
      <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-white transition ${
              type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
      >
        <span>{message}</span>
        <button onClick={onClose} aria-label="Tutup notifikasi" className="ml-1 opacity-80 hover:opacity-100">✕</button>
      </div>
  );
}

function ConfirmModal({
                        title, message, confirmLabel, onConfirm, onCancel, loading,
                      }: {
  title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading} className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Batal</button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition">{loading ? 'Memproses...' : confirmLabel}</button>
          </div>
        </div>
      </div>
  );
}

function ProductRowSkeleton() {
  return (
      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 animate-pulse">
        <div className="h-16 w-16 rounded-lg bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>
        <div className="h-6 w-20 rounded-full bg-gray-200" />
      </div>
  );
}

const STATUS_TABS: { label: string; value: ProductStatus | '' }[] = [
  { label: 'Semua', value: '' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Stok Habis', value: 'OUT_OF_STOCK' },
  { label: 'Disembunyikan', value: 'HIDDEN' },
  { label: 'Dihapus Admin', value: 'REMOVED_BY_ADMIN' },
];

export default function JastiperCatalogPage() {
  const router = useRouter();
  const { accessToken, user, isLoading: authLoading } = useAuth();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [page, setPage] = useState(0);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.replace('/login?redirectedFrom=/jastiper/catalog');
    }
  }, [authLoading, accessToken, router]);

  const fetchProducts = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    setError('');

    getMyProducts(accessToken, {
      search: search || undefined,
      status: statusFilter || undefined,
      page,
      size: PAGE_SIZE,
      sort: 'createdAt,desc',
    })
        .then((data) => {
          setProducts(data.data);
          setTotalItems(data.pagination.total);
          setTotalPages(data.pagination.total_pages);
        })
        .catch(() => setError('Gagal memuat katalog. Coba lagi.'))
        .finally(() => setLoading(false));
  }, [accessToken, search, statusFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function toggleVisibility(product: ProductResponse) {
    if (!accessToken) return;
    const p = product as any;
    const currentId = p.productId || p.product_id;
    const currentStatus = p.status;
    const newStatus: 'ACTIVE' | 'HIDDEN' = currentStatus === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN';
    setActionLoading(currentId);
    try {
      const updated = await updateProduct(accessToken, currentId, { status: newStatus });
      const updatedId = updated.productId || (updated as any).product_id;
      setProducts((prev) => prev.map((item) => (item.productId || (item as any).product_id) === updatedId ? updated : item));
      setToast({
        message: newStatus === 'HIDDEN' ? 'Produk berhasil disembunyikan' : 'Produk berhasil ditampilkan',
        type: 'success',
      });
    } catch {
      setToast({ message: 'Gagal mengubah status produk', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmDelete() {
    if (!accessToken || !deleteTarget) return;
    const p = deleteTarget as any;
    const currentId = p.productId || p.product_id;
    setDeleteLoading(true);
    try {
      await deleteProduct(accessToken, currentId);
      setDeleteTarget(null);
      setToast({ message: 'Produk berhasil dihapus', type: 'success' });
      fetchProducts();
    } catch (err) {
      setDeleteTarget(null);
      if (isApiError(err) && err.status === 409) {
        setToast({ message: 'Produk tidak dapat dihapus karena memiliki pesanan aktif', type: 'error' });
      } else {
        setToast({ message: 'Gagal menghapus produk', type: 'error' });
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  if (authLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }

  if (!accessToken) return null;

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Katalog Saya</h1>
              {!loading && <p className="mt-1 text-sm text-gray-500">{totalItems} produk</p>}
            </div>
            <Link
                href="/jastiper/catalog/new"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Produk
            </Link>
          </div>

          {/* Status filter tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => { setStatusFilter(tab.value); setPage(0); }}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        statusFilter === tab.value ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {tab.label}
                </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="mb-5 relative">
            <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari produk..."
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Error */}
          {error && (
              <div role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={fetchProducts} className="underline ml-2">Coba lagi</button>
              </div>
          )}

          {/* Product list */}
          {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <ProductRowSkeleton key={i} />)}
              </div>
          ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-500 mb-4">Tidak ada produk yang sesuai dengan kriteria.</p>
              </div>
          ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const p = product as any;
                  const currentId = p.productId || p.product_id;
                  return (
                      <ProductRow
                          key={currentId}
                          product={product}
                          actionLoading={actionLoading === currentId}
                          onEdit={() => router.push(`/jastiper/catalog/${currentId}/edit`)}
                          onToggleVisibility={() => toggleVisibility(product)}
                          onDelete={() => setDeleteTarget(product)}
                      />
                  );
                })}
              </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-gray-500">Halaman {page + 1} dari {totalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(0)} disabled={page <= 0} className="rounded-lg border px-2 py-1 disabled:opacity-30">«</button>
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0} className="rounded-lg border px-3 py-1 disabled:opacity-30">←</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-lg border px-3 py-1 disabled:opacity-30">→</button>
                  <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="rounded-lg border px-2 py-1 disabled:opacity-30">»</button>
                </div>
              </div>
          )}
        </div>

        {deleteTarget && (
            <ConfirmModal
                title="Hapus Produk"
                message={`Apakah Anda yakin ingin menghapus "${deleteTarget.name}"?`}
                confirmLabel="Hapus"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteLoading}
            />
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
  );
}

function ProductRow({
                      product, actionLoading, onEdit, onToggleVisibility, onDelete,
                    }: {
  product: ProductResponse; actionLoading: boolean; onEdit: () => void; onToggleVisibility: () => void; onDelete: () => void;
}) {
  const p = product as any;
  const isRemovedByAdmin = p.status === 'REMOVED_BY_ADMIN';

  return (
      <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border bg-white p-4 transition ${isRemovedByAdmin ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {p.images && p.images[0] && <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-medium text-gray-800 truncate">{p.name}</p>
            <StatusBadge status={p.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm text-gray-500">
            <span className="font-semibold text-primary-dark">{formatRupiah(p.price)}</span>
            <span>Stok: {p.stock}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onEdit} disabled={isRemovedByAdmin} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Edit</button>
          {!isRemovedByAdmin && (
              <button onClick={onToggleVisibility} disabled={actionLoading} className="rounded-lg border px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50">
                {p.status === 'HIDDEN' ? 'Tampilkan' : 'Sembunyikan'}
              </button>
          )}
          <button onClick={onDelete} disabled={isRemovedByAdmin} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-40">Hapus</button>
        </div>
      </div>
  );
}