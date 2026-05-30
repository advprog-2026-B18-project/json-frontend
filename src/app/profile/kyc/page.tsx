'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { Navbar } from '@/components/Navbar'; // FIX: Impor komponen Navbar global resmi
import {
  getMyKycStatus,
  submitKyc,
  isApiError,
  type KycStatus,
  type KycStatusResponse,
  type KycSocialMediaLink,
} from '@/services/auth.service';

// ---------------------------------------------------------------------------
// KYC status banner
// ---------------------------------------------------------------------------
function KycStatusBanner({
                           status,
                           rejectionReason,
                         }: {
  status: KycStatus;
  rejectionReason?: string | null;
}) {
  if (status === 'APPROVED') {
    return (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800 animate-in fade-in duration-200">
          <p className="font-bold text-green-900">✓ KYC Anda telah disetujui</p>
          <p className="mt-1 text-green-700">Selamat! Akun Anda kini telah resmi terverifikasi sebagai Jastiper platform JSON.</p>
        </div>
    );
  }
  if (status === 'PENDING_VERIFICATION') {
    return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm text-yellow-800 animate-in fade-in duration-200">
          <p className="font-bold text-yellow-900">⏳ KYC Anda sedang ditinjau oleh admin</p>
          <p className="mt-1 text-yellow-700">Proses verifikasi dokumen internal biasanya memakan waktu 1–3 hari kerja.</p>
        </div>
    );
  }
  if (status === 'REJECTED') {
    return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 animate-in fade-in duration-200">
          <p className="font-bold text-red-900">✗ KYC Anda ditolak</p>
          {rejectionReason && (
              <p className="mt-1 text-red-700 font-medium">Alasan Penolakan: {rejectionReason}</p>
          )}
          <p className="mt-2 text-red-600 text-xs">Silakan periksa kembali kecocokan berkas data Anda, lakukan perbaikan, dan ajukan kembali.</p>
        </div>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function KycPage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();

  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Form fields
  const [fullNameKtp, setFullNameKtp] = useState('');
  const [ktpNumber, setKtpNumber] = useState('');
  const [ktpPhotoUrl, setKtpPhotoUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<KycSocialMediaLink[]>([
    { platform: '', url: '' },
  ]);

  // Validation
  const [ktpError, setKtpError] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.push('/login');
    }
  }, [authLoading, accessToken, router]);

  // Fetch current KYC status
  useEffect(() => {
    if (authLoading || !accessToken) return;

    let cancelled = false;
    setLoadingStatus(true);

    getMyKycStatus(accessToken)
        .then((data) => {
          if (!cancelled) setKycStatus(data);
        })
        .catch((err) => {
          // 404 = no KYC submitted yet — that's fine, show the form
          if (isApiError(err) && err.status === 404) {
            if (!cancelled) setKycStatus(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingStatus(false);
        });

    return () => { cancelled = true; };
  }, [authLoading, accessToken]);

  // Social links helpers
  function addSocialLink() {
    setSocialLinks((prev) => [...prev, { platform: '', url: '' }]);
  }

  function removeSocialLink(index: number) {
    if (socialLinks.length <= 1) return;
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSocialLink(index: number, field: keyof KycSocialMediaLink, value: string) {
    setSocialLinks((prev) =>
        prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  }

  // KTP number validation
  function handleKtpChange(val: string) {
    const digits = val.replace(/\D/g, '');
    setKtpNumber(digits);
    if (digits.length > 0 && digits.length !== 16) {
      setKtpError('Nomor KTP harus tepat 16 digit');
    } else {
      setKtpError('');
    }
  }

  // Submit process handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    if (ktpNumber.length !== 16) {
      setKtpError('Nomor KTP harus tepat 16 digit');
      return;
    }

    const validLinks = socialLinks.filter((l) => l.platform.trim() && l.url.trim());
    if (validLinks.length === 0) {
      setSubmitError('Minimal satu tautan media sosial aktif wajib dilampirkan.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await submitKyc(accessToken, {
        full_name_ktp: fullNameKtp.trim(),
        ktp_number: ktpNumber,
        ktp_photo_url: ktpPhotoUrl.trim(),
        selfie_with_ktp_url: selfieUrl.trim(),
        social_media_links: validLinks,
        bio: bio.trim() || undefined,
      });

      setSubmitSuccess(true);
      setKycStatus({
        kyc_id: '',
        status: 'PENDING_VERIFICATION',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        rejection_reason: null,
      });
    } catch (err) {
      if (isApiError(err)) {
        setSubmitError(err.message || 'Gagal mengirim berkas pengajuan KYC.');
      } else {
        setSubmitError('Tidak dapat terhubung ke server internal.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // FIX: Bersihkan token warna bracket v4 murni ke format kelas utilitas murni
  const inputClass =
      'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:opacity-70 bg-white';

  // FIX: Integrasi Navbar global pada Loading State Layout
  if (authLoading || loadingStatus) {
    return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="mx-auto max-w-xl px-4 py-12">
            <div className="w-full rounded-2xl bg-white p-8 shadow-sm animate-pulse space-y-4 border border-gray-100">
              <div className="h-6 w-48 rounded bg-gray-200" />
              <div className="h-10 rounded bg-gray-100" />
              <div className="h-10 rounded bg-gray-100" />
              <div className="h-10 rounded bg-gray-100" />
              <div className="h-10 rounded bg-gray-100" />
            </div>
          </main>
        </div>
    );
  }

  // FIX: Integrasi Navbar global pada Approved State Layout (Show banner only)
  if (kycStatus?.status === 'APPROVED') {
    return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="mx-auto w-full max-w-lg px-4 py-12">
            <div className="rounded-2xl bg-white p-8 shadow-sm space-y-4 border border-gray-100">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Verifikasi Identitas (KYC)</h1>
              <KycStatusBanner status="APPROVED" />
            </div>
          </main>
        </div>
    );
  }

  const isPending = kycStatus?.status === 'PENDING_VERIFICATION' && !submitSuccess;
  const isRejected = kycStatus?.status === 'REJECTED';
  const showForm = !isPending;

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="px-4 py-12">
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
              <h1 className="mb-5 text-xl font-bold text-gray-900 tracking-tight">
                Verifikasi Identitas (KYC)
              </h1>

              {/* Status banner indicator */}
              {(kycStatus || submitSuccess) && (
                  <div className="mb-6">
                    <KycStatusBanner
                        status={submitSuccess ? 'PENDING_VERIFICATION' : kycStatus!.status}
                        rejectionReason={kycStatus?.rejection_reason}
                    />
                  </div>
              )}

              {/* Pending State Content — Read Only Banner Info */}
              {isPending && (
                  <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                    Pengajuan berkas KYC Anda saat ini sedang masuk dalam antrian moderasi tim administrator. Notifikasi status hak akses role akun Anda akan diperbarui secara otomatis setelah proses peninjauan selesai.
                  </p>
              )}

              {/* Interactive KYC Form Input Fields Module */}
              {showForm && !submitSuccess && (
                  <>
                    {isRejected && (
                        <p className="mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                          Perhatian: Harap sesuaikan ulang berkas data Anda di bawah ini berdasarkan alasan penolakan tim admin, lalu kirim ulang permohonan verifikasi.
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Full name KTP */}
                      <div>
                        <label htmlFor="full_name_ktp" className="mb-1 block text-sm font-medium text-gray-700">
                          Nama Lengkap (sesuai KTP) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="full_name_ktp"
                            type="text"
                            required
                            value={fullNameKtp}
                            onChange={(e) => setFullNameKtp(e.target.value)}
                            disabled={isSubmitting}
                            className={inputClass}
                            placeholder="Nama Lengkap"
                        />
                      </div>

                      {/* KTP number */}
                      <div>
                        <label htmlFor="ktp_number" className="mb-1 block text-sm font-medium text-gray-700">
                          Nomor KTP (NIK) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="ktp_number"
                            type="text"
                            inputMode="numeric"
                            required
                            maxLength={16}
                            value={ktpNumber}
                            onChange={(e) => handleKtpChange(e.target.value)}
                            disabled={isSubmitting}
                            className={`${inputClass} ${ktpError ? 'border-red-400 focus:ring-red-400' : ''} font-mono tracking-widest`}
                            placeholder="16 digit NIK"
                        />
                        {ktpError ? (
                            <p role="alert" className="mt-1 text-xs text-red-600 font-medium">{ktpError}</p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-400">
                              {ktpNumber.length}/16 digit terisi
                            </p>
                        )}
                      </div>

                      {/* KTP photo URL */}
                      <div>
                        <label htmlFor="ktp_photo_url" className="mb-1 block text-sm font-medium text-gray-700">
                          URL Foto KTP <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="ktp_photo_url"
                            type="url"
                            required
                            value={ktpPhotoUrl}
                            onChange={(e) => setKtpPhotoUrl(e.target.value)}
                            disabled={isSubmitting}
                            className={inputClass}
                            placeholder="https://..."
                        />
                        <p className="mt-1 text-[11px] text-gray-400 leading-normal">
                          Pastikan tulisan teks pada dokumen KTP terbaca dengan jelas (tidak buram/terpotong pencahayaan).
                        </p>
                      </div>

                      {/* Selfie with KTP URL */}
                      <div>
                        <label htmlFor="selfie_url" className="mb-1 block text-sm font-medium text-gray-700">
                          URL Selfie memegang KTP <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="selfie_url"
                            type="url"
                            required
                            value={selfieUrl}
                            onChange={(e) => setSelfieUrl(e.target.value)}
                            disabled={isSubmitting}
                            className={inputClass}
                            placeholder="https://..."
                        />
                      </div>

                      {/* Social media links grid array module */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Tautan Media Sosial <span className="text-red-500">*</span>
                          </label>
                          {/* FIX: Bersihkan token warna hover text kurung v4 */}
                          <button
                              type="button"
                              onClick={addSocialLink}
                              disabled={isSubmitting}
                              className="text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-50 cursor-pointer"
                          >
                            + Tambah Tautan
                          </button>
                        </div>
                        <div className="space-y-2">
                          {socialLinks.map((link, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={link.platform}
                                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                                    placeholder="Platform (Contoh: Instagram)"
                                    required
                                />
                                <input
                                    type="url"
                                    value={link.url}
                                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                                    placeholder="https://instagram.com/username"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSocialLink(index)}
                                    disabled={isSubmitting || socialLinks.length <= 1}
                                    className="flex items-center justify-center rounded-lg border border-gray-200 px-2 text-gray-400 hover:border-red-300 hover:text-red-500 disabled:opacity-30 cursor-pointer transition"
                                    aria-label="Hapus tautan media sosial"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                          ))}
                        </div>
                        <p className="mt-1.5 text-[11px] text-gray-400">Minimal wajib menyertakan 1 tautan profil media sosial aktif untuk tracking validasi otentikasi identitas jastiper.</p>
                      </div>

                      {/* Bio descriptions info */}
                      <div>
                        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700">
                          Bio Pengguna <span className="text-gray-400 font-normal text-xs">(opsional)</span>
                        </label>
                        <textarea
                            id="bio"
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            disabled={isSubmitting}
                            className={inputClass + " resize-none"}
                            placeholder="Tulis ringkasan singkat profil Anda..."
                        />
                      </div>

                      {/* Submission error feedback box indicator */}
                      {submitError && (
                          <div role="alert" className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600 font-medium animate-in fade-in duration-150">
                            {submitError}
                          </div>
                      )}

                      {/* Submit operational trigger mutation call button */}
                      <button
                          type="submit"
                          disabled={isSubmitting || !!ktpError}
                          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer text-center"
                      >
                        {isSubmitting ? 'Mengirim Berkas Pengajuan...' : 'Kirim Berkas KYC'}
                      </button>
                    </form>
                  </>
              )}
            </div>
          </div>
        </main>
      </div>
  );
}