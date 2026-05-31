'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { isApiError } from '@/services/api-client';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
    getWallet,
    requestWithdrawal,
    generateIdempotencyKey,
    type WalletResponse,
} from '@/services/payment.service';

function formatRupiah(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function JastiperWithdrawPage() {
    const router = useRouter();
    const { accessToken, user, isLoading: authLoading } = useAuth();

    const [wallet, setWallet] = useState<WalletResponse | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [balanceError, setBalanceError] = useState('');

    // Form states
    const [amount, setAmount] = useState('');
    const [bankAccountId, setBankAccountId] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !accessToken) {
            router.push('/login?redirectedFrom=/jastiper/wallet/withdraw');
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
            setFormError('Masukkan nominal withdrawal yang valid.');
            return;
        }

        if (wallet && amountNum > wallet.balance) {
            setFormError(`Saldo Anda tidak mencukupi. Maksimal withdrawal adalah ${formatRupiah(wallet.balance)}`);
            return;
        }

        if (!bankAccountId.trim()) {
            setFormError('Masukkan nomor rekening bank tujuan.');
            return;
        }

        if (!notes.trim()) {
            setFormError('Catatan withdrawal wajib diisi (contoh: Nama Bank & Nama Pemilik Rekening).');
            return;
        }

        setSubmitting(true);
        try {
            await requestWithdrawal(accessToken!, {
                amount: amountNum,
                bank_account_id: bankAccountId.trim(),
                notes: notes.trim(),
                idempotency_key: generateIdempotencyKey(),
            });

            setSuccessMessage(`Pengajuan withdrawal sebesar ${formatRupiah(amountNum)} berhasil dikirim! Saldo aktif Anda langsung dikurangi.`);
            setAmount('');
            setBankAccountId('');
            setNotes('');

            fetchCurrentBalance();
        } catch (err) {
            if (isApiError(err)) {
                setFormError(err.message || 'Gagal mengajukan withdrawal dana.');
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
                    <span className="text-gray-800 font-medium">Tarik Saldo</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Tarik Saldo Jastiper</h1>

                {/* Info Saldo Saat Ini */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Saldo Tersedia untuk Ditarik</p>
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

                {/* Form Input withdrawal Dana */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* Field Nominal */}
                        <div>
                            <label htmlFor="withdraw-amount" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Nominal withdrawal (IDR) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="withdraw-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Contoh: 500000"
                                min={1}
                                disabled={submitting}
                                className={inputCls}
                            />
                        </div>

                        {/* Field ID Rekening Bank */}
                        <div>
                            <label htmlFor="withdraw-bank-account" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Nomor Rekening / ID Bank Tujuan <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="withdraw-bank-account"
                                type="text"
                                value={bankAccountId}
                                onChange={(e) => setBankAccountId(e.target.value)}
                                placeholder="Contoh: 7601234567"
                                disabled={submitting}
                                className={inputCls}
                            />
                        </div>

                        {/* Field Catatan Tambahan (Wajib Diisi) */}
                        <div>
                            <label htmlFor="withdraw-notes" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Informasi Pemilik Rekening (Catatan) <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="withdraw-notes"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Tuliskan Nama Bank, Nama Pemilik, & Cabang. Contoh: Bank BCA, A/N Raihana Auni Zakia"
                                disabled={submitting}
                                className={`${inputCls} resize-none`}
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                Catatan ini wajib diisi dengan detail untuk mempercepat verifikasi transfer manual oleh tim administrator.
                            </p>
                        </div>

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
                                {submitting ? 'Memproses...' : 'Konfirmasi withdrawal'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}