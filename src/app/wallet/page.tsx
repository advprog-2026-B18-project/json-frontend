// Dummy Data 
const dummyWallet = {
  saldo: 1250000,
  riwayat: [
    { id: 1, tipe: 'Kredit', nominal: 1500000, status: 'Success', keterangan: 'Top-Up via Bank Transfer', timestamp: '2026-02-18 10:00' },
    { id: 2, tipe: 'Debit', nominal: 250000, status: 'Success', keterangan: 'Pembayaran Order #INV-001', timestamp: '2026-02-19 14:30' },
  ]
};

export default function WalletPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dompet JSON Saya</h1>
      
      {/* Kartu Saldo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-8 shadow-lg">
        <p className="text-sm opacity-80 mb-1">Total Saldo Aktif</p>
        <h2 className="text-4xl font-bold mb-6">Rp {dummyWallet.saldo.toLocaleString('id-ID')}</h2>
        <div className="flex gap-4">
          <button className="bg-white text-blue-700 px-6 py-2 rounded-full font-semibold hover:bg-gray-100">
            + Top-Up
          </button>
          <button className="border border-white text-white px-6 py-2 rounded-full font-semibold hover:bg-white/10">
            Tarik Dana (Withdraw)
          </button>
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <h3 className="text-xl font-semibold mb-4">Riwayat Transaksi</h3>
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 text-sm font-semibold text-gray-600">Waktu</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Keterangan</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {dummyWallet.riwayat.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-500">{tx.timestamp}</td>
                <td className="p-4 text-sm">{tx.keterangan}</td>
                <td className="p-4 text-sm">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    {tx.status}
                  </span>
                </td>
                <td className={`p-4 text-sm font-semibold text-right ${tx.tipe === 'Kredit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.tipe === 'Kredit' ? '+' : '-'} Rp {tx.nominal.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}