'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useAuthorizedFetch } from '@/lib/api/useAuthorizedFetch';
import { isApiError } from '@/services/api-client';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
    getWallet,
    generateIdempotencyKey,
    type WalletResponse,
    type TopUpPaymentMethod,
} from '@/services/payment.service';

const PAYMENT_METHODS: { value: TopUpPaymentMethod; label: string }[] = [
    { value: 'BANK_TRANSFER', label: 'Transfer Bank' },
    { value: 'VIRTUAL_ACCOUNT', label: 'Virtual Account' },
    { value: 'QRIS', label: 'QRIS' },
    { value: 'EWALLET', label: 'E-Wallet' },
];

const BANK_CODES = ['BCA', 'BNI', 'BRI', 'MANDIRI', 'BSI', 'CIMB', 'PERMATA'];

function formatRupiah(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function JastiperTopUpPage() {
    const router = useRouter();
    const { accessToken, user, isLoading: authLoading } = useAuth();
    const { authorizedFetch } = useAuthorizedFetch();

    const [wallet, setWallet] = useState<WalletResponse | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [balanceError, setBalanceError] = useState('');

    // Form states
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<TopUpPaymentMethod>('BANK_TRANSFER');
    const [bankCode, setBankCode] = useState('BCA');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const needsBankCode = paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'VIRTUAL_ACCOUNT';

    useEffect(() => {
        if (!authLoading && !accessToken) {
            router.push('/login?redirectedFrom=/jastiper/wallet/topup');
        }
    }, [authLoading, accessToken, router]);

    useEffect(() => {
        if (!authLoading && user && user.role !== 'JASTIPER') {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    const fetchCurrentBalance = useCallback(async () => {
        if (!accessToken) return;
        setLoadingBalance(true);
        setBalanceError('');
        try {
            const walletData = await getWallet(accessToken);
            setWallet(walletData);
        } catch (err) {
            if (isApiError(err)) {
                setBalanceError(err.message || 'Gagal memuat saldo terbaru.');
            } else {
                setBalanceError('Tidak dapat terhubung ke server.');
            }
        } finally {
            setLoadingBalance(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (!authLoading && accessToken && user?.role === 'JASTIPER') {
            fetchCurrentBalance();
        }
    }, [authLoading, accessToken, user, fetchCurrentBalance]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        const amountNum = Number(amount);

        if (!amount || isNaN(amountNum) || amountNum <= 0) {
            setFormError('Masukkan nominal top-up yang valid.');
            return;
        }

        if (needsBankCode && !bankCode) {
            setFormError('Silakan pilih kode bank tujuan transfer.');
            return;
        }

        setSubmitting(true);
        try {
            await authorizedFetch<unknown>('payment', '/topups', {
                method: 'POST',
                body: {
                    amount: amountNum,
                    payment_method: paymentMethod,
                    bank_code: needsBankCode ? bankCode : undefined,
                    idempotency_key: generateIdempotencyKey(),
                },
            });

            setSuccessMessage(`Pengajuan top-up sebesar ${formatRupiah(amountNum)} berhasil diajukan! Silakan lakukan pembayaran.`);
            setAmount('');
        } catch (err) {
            if (isApiError(err)) {
                setFormError(err.message || 'Gagal mengajukan top-up.');
            } else {
                setFormError('Terjadi kesalahan koneksi server. Silakan coba lagi.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (authLoading || !accessToken || (user && user.role !== 'JASTIPER')) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const inputCls =
        'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:opacity-70';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
                {/* Breadcrumb / Navigasi Balik */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/jastiper/wallet" className="hover:text-primary transition">Dompet Saya</Link>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">Top-Up Saldo</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Top-Up Saldo Jastiper</h1>

                {/* Info Saldo Saat Ini */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Saldo Saat Ini</p>
                    {loadingBalance ? (
                        <div className="h-8 w-40 rounded bg-gray-100 animate-pulse mt-1" />
                    ) : balanceError ? (
                        <p className="text-sm text-red-600 mt-1">{balanceError}</p>
                    ) : (
                        <p className="text-3xl font-bold text-primary-dark mt-1">
                            {wallet ? formatRupiah(wallet.balance) : '—'}
                        </p>
                    )}
                </div>

                {/* Notifikasi Sukses */}
                {successMessage && (
                    <div role="alert" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        ✓ {successMessage}
                    </div>
                )}

                {/* Form Input Isi Saldo Dana */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* Field Nominal */}
                        <div>
                            <label htmlFor="topup-amount" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Nominal Isi Saldo (IDR) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="topup-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Contoh: 250000"
                                min={1}
                                disabled={submitting}
                                className={inputCls}
                            />
                        </div>

                        {/* Field Metode Pembayaran */}
                        <div>
                            <label htmlFor="topup-method" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Metode Pembayaran <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="topup-method"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as TopUpPaymentMethod)}
                                disabled={submitting}
                                className={inputCls}
                            >
                                {PAYMENT_METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Field Pilihan Kode Bank — Kondisional */}
                        {needsBankCode && (
                            <div>
                                <label htmlFor="topup-bank" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Pilih Bank Tujuan Transfer <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="topup-bank"
                                    value={bankCode}
                                    onChange={(e) => setBankCode(e.target.value)}
                                    disabled={submitting}
                                    className={inputCls}
                                >
                                    {BANK_CODES.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Error Form Feedback */}
                        {formError && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                {formError}
                            </p>
                        )}

                        {/* Tombol Aksi Form */}
                        <div className="flex gap-3 pt-2">
                            <Link
                                href="/jastiper/wallet"
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition block"
                            >
                                Kembali
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition shadow-xs"
                            >
                                {submitting && (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                )}
                                {submitting ? 'Memproses...' : 'Ajukan Top-Up'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}