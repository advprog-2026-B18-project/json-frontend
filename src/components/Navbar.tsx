'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useAuthorizedFetch } from '@/lib/api/useAuthorizedFetch';
import type { WalletResponse } from '@/services/payment.service';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function Navbar() {
  const router = useRouter();
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
        <header className="sticky top-0 z-40 bg-(--color-primary-dark) shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-extrabold text-white">JSON</Link>
            <div className="h-6 w-20 rounded bg-white/20 animate-pulse" />
          </div>
        </header>
    );
  }

  return (
      <header className="sticky top-0 z-40 bg-(--color-primary-dark) shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href={accessToken ? '/catalog' : '/'} className="text-xl font-extrabold text-white">
            JSON
          </Link>

          {/* Nav links — Desktop (md+) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/catalog" className="text-sm text-white/80 hover:text-white transition">
              Katalog
            </Link>
            {accessToken && user && (
                <>
                  {user.role === 'TITIPERS' && (
                      <Link href="/orders" className="text-sm text-white/80 hover:text-white transition">
                        Pesanan Saya
                      </Link>
                  )}
                  {(user.role === 'JASTIPER' || user.role === 'ADMIN') && (
                      <Link href={`/${user.role.toLowerCase()}/orders`} className="text-sm text-white/80 hover:text-white transition">
                        Kelola Pesanan
                      </Link>
                  )}
                  {(user.role === 'TITIPERS' || user.role === 'JASTIPER') && (
                      <Link
                          href={user.role === 'JASTIPER' ? '/jastiper/wallet' : '/wallet'}
                          className="text-sm text-white/80 hover:text-white transition"
                      >
                        Dompet
                      </Link>
                  )}
                  {user.role === 'ADMIN' && (
                      <Link href="/admin/catalog" className="text-sm text-white/80 hover:text-white transition">
                        Admin Panel {/* FIX: Diubah dari /admin/dashboard (404) ke /admin/catalog sesuai berkas yang tersedia */}
                      </Link>
                  )}
                </>
            )}
          </nav>

          {/* Right section — wallet + user menu & Mobile Hamburger Toggle */}
          <div className="flex items-center gap-3">
            {accessToken && user ? (
                <>
                  {/* Wallet balance */}
                  <button
                      onClick={fetchBalance}
                      className="hidden sm:flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition"
                  >
                    {balanceLoading ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : walletBalance !== null ? (
                        formatRupiah(walletBalance)
                    ) : (
                        'Cek Saldo'
                    )}
                  </button>

                  {/* User dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown((prev) => !prev)}
                        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition"
                    >
                      <span>{user.username || 'User'}</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1 z-50">
                          <Link
                              href="/profile"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setShowDropdown(false)}
                          >
                            Profil Saya
                          </Link>
                          <Link
                              href={user.role === 'JASTIPER' ? '/jastiper/dashboard' : user.role === 'ADMIN' ? '/admin/catalog' : '/dashboard'}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setShowDropdown(false)}
                          >
                            Dashboard
                          </Link>
                          <hr className="my-1 border-gray-100" />
                          <button
                              onClick={() => { setShowDropdown(false); handleLogout(); }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Keluar
                          </button>
                        </div>
                    )}
                  </div>
                </>
            ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/login" className="text-sm text-white/80 hover:text-white transition">
                    Masuk
                  </Link>
                  <Link href="/register" className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-(--color-primary-dark) hover:bg-gray-100 transition">
                    Daftar
                  </Link>
                </div>
            )}

            {/* FIX: Mobile Menu Hamburger Button */}
            <button
                onClick={() => setShowMobileMenu((prev) => !prev)}
                className="rounded-lg p-1 text-white md:hidden hover:bg-white/10"
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

        {/* FIX: Mobile Dropdown Menu Container */}
        {showMobileMenu && (
            <div className="border-t border-white/10 bg-(--color-primary-dark) px-4 py-3 md:hidden space-y-2">
              <Link href="/catalog" className="block text-sm text-white/80 py-1" onClick={() => setShowMobileMenu(false)}>
                Katalog
              </Link>
              {accessToken && user ? (
                  <>
                    {user.role === 'TITIPERS' && (
                        <Link href="/orders" className="block text-sm text-white/80 py-1" onClick={() => setShowMobileMenu(false)}>
                          Pesanan Saya
                        </Link>
                    )}
                    {(user.role === 'JASTIPER' || user.role === 'ADMIN') && (
                        <Link href={`/${user.role.toLowerCase()}/orders`} className="block text-sm text-white/80 py-1" onClick={() => setShowMobileMenu(false)}>
                          Kelola Pesanan
                        </Link>
                    )}
                    {user.role === 'ADMIN' && (
                        <Link href="/admin/catalog" className="block text-sm text-white/80 py-1" onClick={() => setShowMobileMenu(false)}>
                          Admin Panel
                        </Link>
                    )}
                    <button
                        onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                        className="block w-full text-left text-sm text-red-400 py-1"
                    >
                      Keluar
                    </button>
                  </>
              ) : (
                  <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                    <Link href="/login" className="block text-center text-sm text-white py-2 rounded-lg bg-white/5" onClick={() => setShowMobileMenu(false)}>
                      Masuk
                    </Link>
                    <Link href="/register" className="block text-center text-sm font-semibold text-(--color-primary-dark) bg-white py-2 rounded-lg" onClick={() => setShowMobileMenu(false)}>
                      Daftar
                    </Link>
                  </div>
              )}
            </div>
        )}
      </header>
  );
}