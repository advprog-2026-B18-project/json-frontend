import Link from 'next/link';

// Dummy Data 
const dummyProducts = [
  {
    id: 1,
    nama: "Tumbler Starbucks Sakura Edition",
    deskripsi: "Tumbler edisi terbatas musim semi dari Jepang.",
    harga: 450000,
    stok: 5,
    negaraAsal: "Jepang",
    tanggalKembali: "2026-03-01",
    jastiper: "BudiTravels"
  },
  {
    id: 2,
    nama: "Tiket Konser Coldplay",
    deskripsi: "Kategori CAT 1, siap war tiket.",
    harga: 3500000,
    stok: 2,
    negaraAsal: "Singapura",
    tanggalKembali: "2026-04-15",
    jastiper: "SiskaJastip"
  }
];

export default function KatalogPage() {
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Katalog JSON (Jasa Titip)</h1>
        <Link href="/wallet" className="bg-blue-600 text-white px-4 py-2 rounded">
          Dompet Saya
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyProducts.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">{product.nama}</h2>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.deskripsi}</p>
            
            <div className="text-sm mb-4 space-y-1">
              <p> Asal: <span className="font-medium">{product.negaraAsal}</span></p>
              <p> Stok: <span className="font-medium">{product.stok} unit</span></p>
              <p> Tiba: <span className="font-medium">{product.tanggalKembali}</span></p>
              <p> Jastiper: <span className="font-medium text-blue-600">@{product.jastiper}</span></p>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-lg font-bold text-green-600">
                Rp {product.harga.toLocaleString('id-ID')}
              </span>
              <button className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800">
                Ikut War / Beli
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}