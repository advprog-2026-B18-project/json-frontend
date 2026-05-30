'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useAuthorizedFetch } from '@/lib/api/useAuthorizedFetch';
import type { WalletResponse } from '@/services/payment.service';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user, isLoading: authLoading, clearAuth } = useAuth();
  const { authorizedFetch } = useAuthorizedFetch();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const fetchBalance = useCallback(async () => {
    if (!accessToken) return;
    setBalanceLoading(true);
    try {
      const data = await authorizedFetch<WalletResponse>('payment', '/wallets/me');
      setWalletBalance(data.balance);
    } catch {
      // Fail silently
    } finally {
      setBalanceLoading(false);
    }
  }, [accessToken, authorizedFetch]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Continue locally
    }
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  if (authLoading) {
    return (
        <header className="sticky top-0 z-40 bg-primary-dark shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-extrabold text-white">JSON</Link>
            <div className="h-6 w-20 rounded bg-white/20 animate-pulse" />
          </div>
        </header>
    );
  }

  const getLinkClass = (targetPath: string) => {
    const isActive = pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath));
    return `text-sm transition px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
        isActive
            ? 'bg-white/15 font-semibold text-white shadow-xs'
            : 'text-white/80 hover:bg-white/5 hover:text-white'
    }`;
  };

  const getMobileLinkClass = (targetPath: string) => {
    const isActive = pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath));
    return `block text-sm py-2 px-3 rounded-lg transition font-medium ${
        isActive
            ? 'bg-white/20 font-semibold text-white'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`;
  };

  return (
      <header className="sticky top-0 z-40 bg-primary-dark shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

          {/* Kolom Kiri: Brand Logo Container */}
          <div className="flex-1 flex justify-start">
            <Link
                href={accessToken ? (user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'JASTIPER' ? '/jastiper/dashboard' : '/dashboard') : '/'}
                className="text-xl font-extrabold text-white tracking-tight"
            >
              JSON
            </Link>
          </div>

          {/* Kolom Tengah: Nav Links Sempurna di Dead-Center (md+) */}
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
            {accessToken && user ? (
                <>
                  {/* NAVIGATION DECK: ROLE ADMIN */}
                  {user.role === 'ADMIN' && (
                      <>
                        <Link href="/admin/dashboard" className={getLinkClass('/admin/dashboard')}>Dashboard</Link>
                        <Link href="/admin/users" className={getLinkClass('/admin/users')}>Pengguna</Link>
                        <Link href="/admin/kyc" className={getLinkClass('/admin/kyc')}>KYC</Link>
                        <Link href="/admin/catalog" className={getLinkClass('/admin/catalog')}>Produk</Link>
                        <Link href="/admin/orders" className={getLinkClass('/admin/orders')}>Pesanan</Link>
                        <Link href="/admin/wallet/summary" className={getLinkClass('/admin/wallet/summary')}>Keuangan</Link>
                      </>
                  )}

                  {/* NAVIGATION DECK: ROLE JASTIPER */}
                  {user.role === 'JASTIPER' && (
                      <>
                        <Link href="/jastiper/dashboard" className={getLinkClass('/jastiper/dashboard')}>Dashboard</Link>
                        <Link href="/jastiper/catalog" className={getLinkClass('/jastiper/catalog')}>Katalog Saya</Link>
                        <Link href="/jastiper/orders" className={getLinkClass('/jastiper/orders')}>Kelola Pesanan</Link>
                        <Link href="/jastiper/wallet" className={getLinkClass('/jastiper/wallet')}>Dompet</Link>
                      </>
                  )}

                  {/* NAVIGATION DECK: ROLE TITIPERS (PEMBELI) */}
                  {user.role === 'TITIPERS' && (
                      <>
                        <Link href="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
                        <Link href="/catalog" className={getLinkClass('/catalog')}>Katalog</Link>
                        <Link href="/orders" className={getLinkClass('/orders')}>Pesanan Saya</Link>
                        <Link href="/wallet" className={getLinkClass('/wallet')}>Dompet</Link>
                      </>
                  )}
                </>
            ) : (
                /* NAVIGATION DECK: GUEST VIEW (BELUM LOGIN) */
                <Link href="/catalog" className={getLinkClass('/catalog')}>Katalog Publik</Link>
            )}
          </nav>

          {/* Kolom Kanan: Wallet Balance + Dropdown Actions */}
          <div className="flex-1 flex items-center justify-end gap-3">
            {accessToken && user ? (
                <>
                  {/* Wallet Balance Widget (Sembunyikan untuk Admin) */}
                  {user.role !== 'ADMIN' && (
                      <button
                          onClick={fetchBalance}
                          className="hidden sm:flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition cursor-pointer"
                      >
                        {balanceLoading ? (
                            <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                        ) : walletBalance !== null ? (
                            formatRupiah(walletBalance)
                        ) : (
                            'Cek Saldo'
                        )}
                      </button>
                  )}

                  {/* User Account Dropdown Selector */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown((prev) => !prev)}
                        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition cursor-pointer"
                    >
                      <span>{user.username || 'User'}</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                          <Link
                              href="/profile"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setShowDropdown(false)}
                          >
                            Profil Saya
                          </Link>
                          <Link
                              href={user.role === 'JASTIPER' ? '/jastiper/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setShowDropdown(false)}
                          >
                            Dashboard
                          </Link>
                          <hr className="my-1 border-gray-100" />
                          <button
                              onClick={() => { setShowDropdown(false); handleLogout(); }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            Keluar
                          </button>
                        </div>
                    )}
                  </div>
                </>
            ) : (
                /* Tombol Masuk/Daftar untuk Guest */
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/login" className="text-sm text-white/80 hover:text-white transition">
                    Masuk
                  </Link>
                  <Link href="/register" className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-primary-dark hover:bg-gray-100 transition">
                    Daftar
                  </Link>
                </div>
            )}

            {/* Mobile Menu Hamburger Toggle Trigger Button */}
            <button
                onClick={() => setShowMobileMenu((prev) => !prev)}
                className="rounded-lg p-1 text-white md:hidden hover:bg-white/10 cursor-pointer"
                aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile View Dropdown Menu Sheet Container Container */}
        {showMobileMenu && (
            <div className="border-t border-white/10 bg-primary-dark px-4 py-3 md:hidden space-y-1 animate-in slide-in-from-top duration-200">
              {accessToken && user ? (
                  <>
                    {/* MOBILE DECK LINKS: ADMIN */}
                    {user.role === 'ADMIN' && (
                        <>
                          <Link href="/admin/dashboard" className={getMobileLinkClass('/admin/dashboard')} onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                          <Link href="/admin/users" className={getMobileLinkClass('/admin/users')} onClick={() => setShowMobileMenu(false)}>Pengguna</Link>
                          <Link href="/admin/kyc" className={getMobileLinkClass('/admin/kyc')} onClick={() => setShowMobileMenu(false)}>KYC</Link>
                          <Link href="/admin/catalog" className={getMobileLinkClass('/admin/catalog')} onClick={() => setShowMobileMenu(false)}>Produk</Link>
                          <Link href="/admin/orders" className={getMobileLinkClass('/admin/orders')} onClick={() => setShowMobileMenu(false)}>Pesanan</Link>
                          <Link href="/admin/wallet/summary" className={getMobileLinkClass('/admin/wallet/summary')} onClick={() => setShowMobileMenu(false)}>Keuangan</Link>
                        </>
                    )}

                    {/* MOBILE DECK LINKS: JASTIPER */}
                    {user.role === 'JASTIPER' && (
                        <>
                          <Link href="/jastiper/dashboard" className={getMobileLinkClass('/jastiper/dashboard')} onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                          <Link href="/jastiper/catalog" className={getMobileLinkClass('/jastiper/catalog')} onClick={() => setShowMobileMenu(false)}>Katalog Saya</Link>
                          <Link href="/jastiper/orders" className={getMobileLinkClass('/jastiper/orders')} onClick={() => setShowMobileMenu(false)}>Kelola Pesanan</Link>
                          <Link href="/jastiper/wallet" className={getMobileLinkClass('/jastiper/wallet')} onClick={() => setShowMobileMenu(false)}>Dompet</Link>
                        </>
                    )}

                    {/* MOBILE DECK LINKS: TITIPERS */}
                    {user.role === 'TITIPERS' && (
                        <>
                          <Link href="/dashboard" className={getMobileLinkClass('/dashboard')} onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                          <Link href="/catalog" className={getMobileLinkClass('/catalog')} onClick={() => setShowMobileMenu(false)}>Katalog</Link>
                          <Link href="/orders" className={getMobileLinkClass('/orders')} onClick={() => setShowMobileMenu(false)}>Pesanan Saya</Link>
                          <Link href="/wallet" className={getMobileLinkClass('/wallet')} onClick={() => setShowMobileMenu(false)}>Dompet</Link>
                        </>
                    )}

                    <button
                        onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                        className="block w-full text-left text-sm text-red-400 py-2 px-3 hover:bg-white/10 rounded-lg font-medium cursor-pointer"
                    >
                      Keluar
                    </button>
                  </>
              ) : (
                  /* Mobile view links pembeli dan jastiper unauthenticated */
                  <div className="pt-1 flex flex-col gap-2">
                    <Link href="/catalog" className="block text-sm text-white/80 py-2 px-3 hover:bg-white/10 rounded-lg" onClick={() => setShowMobileMenu(false)}>
                      Katalog Publik
                    </Link>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <Link href="/login" className="block text-center text-sm text-white py-2 rounded-lg bg-white/5" onClick={() => setShowMobileMenu(false)}>
                        Masuk
                      </Link>
                      <Link href="/register" className="block text-center text-sm font-semibold text-primary-dark bg-white py-2 rounded-lg" onClick={() => setShowMobileMenu(false)}>
                        Daftar
                      </Link>
                    </div>
                  </div>
              )}
            </div>
        )}
      </header>
  );
}