'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { searchProducts, getCategories } from '@/services/inventory.service';
import type { ProductResponse, CategoryResponse } from '@/services/inventory.service';
import { Navbar } from '@/components/Navbar';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function RatingStars({ rating }: { rating: number }) {
  return (
      <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
          <svg
              key={star}
              className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
      ))}
        <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
    </span>
  );
}

function ProductCard({ product }: { product: ProductResponse }) {
  const p = product as any;
  const productId = p.productId || p.product_id;
  const serviceFee = p.serviceFee ?? p.service_fee ?? 0;
  const avgRating = p.stats?.avgRating ?? p.stats?.avg_rating ?? 0;
  const jastiperUsername = p.jastiper?.username ?? p.jastiper?.user_id;

  return (
      <Link
          href={`/catalog/${productId}`}
          className="group relative rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden block"
      >
        {p.mode === 'FLASH_SALE' && (
            <span className="absolute top-2 right-2 z-10 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
          ⚡ Flash Sale
        </span>
        )}
        {p.mode === 'PRE_ORDER' && (
            <span className="absolute top-2 right-2 z-10 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
          📦 Pre-Order
        </span>
        )}

        <div className="aspect-square bg-gray-100 overflow-hidden">
          {p.images && p.images[0] ? (
              <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
          ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-300">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{p.name}</p>
          <p className="text-sm font-bold text-primary-dark">{formatRupiah(p.price)}</p>
          {serviceFee > 0 && (
              <p className="text-xs text-gray-400">+ {formatRupiah(serviceFee)} jasa</p>
          )}
          {avgRating > 0 && (
              <div className="mt-1.5">
                <RatingStars rating={avgRating} />
              </div>
          )}
          {p.status === 'OUT_OF_STOCK' && (
              <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            Stok Habis
          </span>
          )}
          {jastiperUsername && (
              <p className="mt-1 text-xs text-gray-400 truncate">
                oleh {jastiperUsername}
              </p>
          )}
        </div>
      </Link>
  );
}

function ProductCardSkeleton() {
  return (
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200" />
        <div className="p-3 space-y-2">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-100" />
        </div>
      </div>
  );
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [qInput, setQInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'purchase_date' | 'rating'>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  const LIMIT = 20;

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    const currentCategoryId = searchParams.get('categoryId') ?? '';
    const currentMinPrice = searchParams.get('minPrice') ?? '';
    const currentMaxPrice = searchParams.get('maxPrice') ?? '';
    const currentOrigin = searchParams.get('origin_country') ?? '';
    const currentFrom = searchParams.get('purchase_date_from') ?? '';
    const currentTo = searchParams.get('purchase_date_to') ?? '';
    const currentSortBy = (searchParams.get('sortBy') as any) ?? 'created_at';
    const currentOrder = (searchParams.get('order') as any) ?? 'desc';
    const currentPage = Number(searchParams.get('page') ?? '1');

    setQInput(currentQ);
    setCategoryId(currentCategoryId);
    setMinPrice(currentMinPrice);
    setMaxPrice(currentMaxPrice);
    setOriginCountry(currentOrigin);
    setDateFrom(currentFrom);
    setDateTo(currentTo);
    setSortBy(currentSortBy);
    setOrder(currentOrder);
    setPage(currentPage);

    let cancelled = false;
    setLoading(true);
    setError('');

    searchProducts({
      q: currentQ || undefined,
      categoryId: currentCategoryId ? Number(currentCategoryId) : undefined,
      minPrice: currentMinPrice ? Number(currentMinPrice) : undefined,
      maxPrice: currentMaxPrice ? Number(currentMaxPrice) : undefined,
      origin_country: currentOrigin || undefined,
      purchase_date_from: currentFrom || undefined,
      purchase_date_to: currentTo || undefined,
      sortBy: currentSortBy,
      order: currentOrder,
      page: currentPage,
      limit: LIMIT,
    })
        .then((data) => {
          if (cancelled) return;
          setProducts(data.data || []);
          setTotalItems(data.pagination?.total || 0);
          setTotalPages(data.pagination?.total_pages || 1);
        })
        .catch(() => {
          if (!cancelled) setError('Gagal memuat produk. Coba lagi.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    return () => { cancelled = true; };
  }, [searchParams]);

  function applyFilters() {
    const sp = new URLSearchParams();
    if (qInput.trim()) sp.set('q', qInput.trim());
    if (categoryId) sp.set('categoryId', categoryId);
    if (minPrice) sp.set('minPrice', minPrice);
    if (maxPrice) sp.set('maxPrice', maxPrice);
    if (originCountry.trim()) sp.set('origin_country', originCountry.trim());
    if (dateFrom) sp.set('purchase_date_from', dateFrom);
    if (dateTo) sp.set('purchase_date_to', dateTo);
    sp.set('sortBy', sortBy);
    sp.set('order', order);
    sp.set('page', '1');

    router.push(`/catalog?${sp.toString()}`);
  }

  function resetFilters() {
    setQInput(''); setCategoryId(''); setMinPrice(''); setMaxPrice('');
    setOriginCountry(''); setDateFrom(''); setDateTo('');
    setSortBy('created_at'); setOrder('desc');
    router.push('/catalog');
  }

  function changePage(newPage: number) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('page', String(newPage));
    router.push(`/catalog?${sp.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary bg-white';

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Katalog Produk</h1>

          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="w-full lg:w-64 shrink-0">
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5 sticky top-20">
                <h2 className="font-semibold text-gray-800">Filter</h2>

                {/* Keyword */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Kata Kunci</label>
                  <div className="relative">
                    <input
                        type="text"
                        value={qInput}
                        onChange={(e) => setQInput(e.target.value)}
                        placeholder="Cari produk..."
                        className={`${inputClass} pl-8`}
                    />
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Kategori</label>
                  <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className={inputClass}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                        <option key={c.category_id} value={String(c.category_id)}>
                          {c.name} ({c.product_count})
                        </option>
                    ))}
                  </select>
                </div>

                {/* Batas Harga */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Harga (IDR)</label>
                  <div className="flex gap-2">
                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" min={0} className={inputClass} />
                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" min={0} className={inputClass} />
                  </div>
                </div>

                {/* Negara */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Negara Asal</label>
                  <input type="text" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} placeholder="Contoh: Japan" className={inputClass} />
                </div>

                {/* Jangka Waktu Pembelian */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal Pembelian</label>
                  <div className="space-y-2">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Urutkan</label>
                  <select
                      value={`${sortBy}:${order}`}
                      onChange={(e) => {
                        const [s, o] = e.target.value.split(':');
                        setSortBy(s as any);
                        setOrder(o as any);
                      }}
                      className={inputClass}
                  >
                    <option value="created_at:desc">Terbaru</option>
                    <option value="rating:desc">Rating Tertinggi</option>
                    <option value="purchase_date:desc">Tanggal Beli Terbaru</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button onClick={applyFilters} className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark transition cursor-pointer">
                    Terapkan Filter
                  </button>
                  <button onClick={resetFilters} className="w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                    Reset Filter
                  </button>
                </div>
              </div>
            </aside>

            <main className="flex-1 min-w-0">
              {!loading && !error && (
                  <p className="mb-4 text-sm text-gray-500">
                    Menampilkan <span className="font-medium text-gray-700">{totalItems}</span> produk
                  </p>
              )}

              {error && (
                  <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={applyFilters} className="underline ml-2 cursor-pointer">Coba lagi</button>
                  </div>
              )}

              {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                  </div>
              ) : products.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-gray-500 mb-4">Tidak ada produk yang sesuai dengan kriteria filter Anda.</p>
                    <button onClick={resetFilters} className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark cursor-pointer">
                      Reset Filter
                    </button>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((p, index) => (<ProductCard key={p.productId || index} product={p} />))}
                  </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Halaman {page} dari {totalPages}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => changePage(1)} disabled={page <= 1} className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">«</button>
                      <button onClick={() => changePage(page - 1)} disabled={page <= 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">← Sebelumnya</button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                        return start + i;
                      }).map((p) => (
                          <button key={p} onClick={() => changePage(p)} className={`rounded-lg border px-3 py-1.5 text-sm cursor-pointer ${p === page ? 'border-primary bg-primary text-white font-semibold' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{p}</button>
                      ))}
                      <button onClick={() => changePage(page + 1)} disabled={page >= totalPages} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">Berikutnya →</button>
                      <button onClick={() => changePage(totalPages)} disabled={page >= totalPages} className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">»</button>
                    </div>
                  </div>
              )}
            </main>
          </div>
        </div>
      </div>
  );
}

export default function CatalogPage() {
  return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        <CatalogContent />
      </Suspense>
  );
}