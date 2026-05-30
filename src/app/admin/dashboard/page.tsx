'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Navbar } from '@/components/Navbar';

export default function AdminDashboardPage() {
    const { user } = useAuth();

    const adminModules = [
        {
            title: 'Verifikasi KYC',
            description: 'Review dokumen KTP dan pengajuan akun Jastiper baru.',
            link: '/admin/kyc',
            icon: (
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
        {
            title: 'Kelola Pengguna',
            description: 'Lihat daftar user, detail profil, aktivitas, serta blokir akun.',
            link: '/admin/users',
            icon: (
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            title: 'Kelola Katalog',
            description: 'Pantau seluruh produk jastip, flash sale, dan pre-order sistem.',
            link: '/admin/catalog',
            icon: (
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            title: 'Ringkasan Dompet',
            description: 'Pantau perputaran uang keuangan, saldo escrow, dan log transaksi.',
            link: '/admin/wallet/summary',
            icon: (
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
                {/* Welcome Section */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Selamat Datang di Admin Panel, {user?.username || 'Administrator'}! 👋
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Pantau matrik bisnis, verifikasi dokumen KYC, dan kelola kelancaran operasional platform JSON.
                        </p>
                    </div>
                    <div className="shrink-0">
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              Role: SYSTEM ADMIN
            </span>
                    </div>
                </div>

                {/* Quick Access Modules Grid */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Modul Administrasi Utama</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {adminModules.map((mod, idx) => (
                            <Link
                                key={idx}
                                href={mod.link}
                                className="group rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition hover:border-primary hover:shadow-md flex flex-col justify-between"
                            >
                                <div>
                                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 transition group-hover:bg-primary/10">
                                        {mod.icon}
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800 group-hover:text-primary-dark transition">
                                        {mod.title}
                                    </h3>
                                    <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                                        {mod.description}
                                    </p>
                                </div>
                                <div className="mt-5 flex items-center text-xs font-semibold text-primary group-hover:text-primary-dark transition">
                                    <span>Buka Modul</span>
                                    <svg className="ml-1 h-3.5 w-3.5 transition duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System Information Banner */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 leading-relaxed flex gap-3">
                    <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <span className="font-semibold block mb-0.5">Catatan Keamanan Sistem:</span>
                        Seluruh aksi mutasi data (seperti persetujuan KYC atau pemblokiran user) dicatat secara ketat di sistem log audit backend. Pastikan melakukan pemeriksaan data pendukung secara saksama sebelum mengambil keputusan tindakan aksi.
                    </div>
                </div>
            </main>
        </div>
    );
}