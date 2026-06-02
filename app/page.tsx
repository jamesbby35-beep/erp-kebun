'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [listPohon, setListPohon] = useState<any[]>([])
  const [pesanError, setPesanError] = useState('')
  const [sedangMemuat, setSedangMemuat] = useState(true)

  // STATE UNTUK FILTER (PILIHAN 2)
  const [kataKunci, setKataKunci] = useState('')
  const [blokTerpilih, setBlokTerpilih] = useState('Semua')

  // STATE UNTUK FORM TAMBAH DATA (PILIHAN 3)
  const [inputTreeId, setInputTreeId] = useState('')
  const [inputBlockId, setInputBlockId] = useState('')
  const [inputVarietas, setInputVarietas] = useState('Muria')
  const [inputTanggal, setInputTanggal] = useState('')
  const [inputStatus, setInputStatus] = useState('Hidup')
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false)
  const [notifikasiForm, setNotifikasiForm] = useState({ tipe: '', pesan: '' })

  const apiKey = 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X'

  // Fungsi untuk mengambil data terbaru dari Supabase
  async function ambilData() {
    try {
      const response = await fetch(
        'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_pohon?select=*',
        {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
          }
        }
      )

      if (!response.ok) {
        const textError = await response.text()
        throw new Error(`Server Supabase Menolak: ${textError}`)
      }

      const data = await response.json()
      setListPohon(data)
    } catch (err: any) {
      setPesanError(err.message)
    } finally {
      setSedangMemuat(false)
    }
  }

  useEffect(() => {
    ambilData()
  }, [])

  // FUNGSI UNTUK MENGIRIM DATA BARU KE SUPABASE (PILIHAN 3)
  async function handleTambahPohon(e: React.FormEvent) {
    e.preventDefault()
    
    // Validasi sederhana agar input tidak kosong
    if (!inputTreeId || !inputBlockId || !inputTanggal) {
      setNotifikasiForm({ tipe: 'error', pesan: 'Mohon isi semua kolom formulir!' })
      return
    }

    setSedangMenyimpan(true)
    setNotifikasiForm({ tipe: '', pesan: '' })

    try {
      const response = await fetch(
        'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_pohon',
        {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation' // Meminta Supabase mengembalikan data yang sukses disimpan
          },
          body: JSON.stringify({
            tree_id: inputTreeId,
            block_id: inputBlockId,
            varietas: inputVarietas,
            tanggal_tanam: inputTanggal,
            status: inputStatus
          })
        }
      )

      if (!response.ok) {
        const textError = await response.text()
        throw new Error(textError || 'Gagal menyimpan data ke database.')
      }

      // Jika sukses, munculkan pesan berhasil dan kosongkan form input
      setNotifikasiForm({ tipe: 'sukses', pesan: `Pohon ${inputTreeId} berhasil disimpan!` })
      setInputTreeId('')
      setInputBlockId('')
      setInputTanggal('')
      
      // Ambil ulang data agar dashboard & tabel langsung ter-update otomatis
      await ambilData()

    } catch (err: any) {
      setNotifikasiForm({ 
        tipe: 'error', 
        pesan: err.message.includes('duplicate') 
          ? 'ID Pohon sudah terdaftar! Gunakan ID lain.' 
          : err.message 
      })
    } finally {
      setSedangMenyimpan(false)
    }
  }

  // PROSES MENYARING DATA BERDASARKAN FILTER
  const dataTersaring = listPohon.filter((pohon) => {
    const cocokKataKunci = 
      pohon.tree_id?.toLowerCase().includes(kataKunci.toLowerCase()) ||
      pohon.varietas?.toLowerCase().includes(kataKunci.toLowerCase())

    const cocokBlok = blokTerpilih === 'Semua' || pohon.block_id === blokTerpilih

    return cocokKataKunci && cocokBlok
  })

  // PERHITUNGAN STATISTIK DYNAMIC
  const totalPohon = dataTersaring.length
  const totalHidup = dataTersaring.filter((p) => p.status?.toLowerCase() === 'hidup').length
  const totalMati = dataTersaring.filter((p) => p.status?.toLowerCase() === 'mati').length
  const daftarSemuaBlok = Array.from(new Set(listPohon.map((p) => p.block_id))).filter(Boolean).sort()

  if (sedangMemuat) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Memuat sistem GK Avocado ERP...</p>
        </div>
      </div>
    )
  }

  if (pesanError) {
    return (
      <div className="p-10 text-red-500 font-mono font-bold bg-red-50 min-h-screen">
        <h1 className="text-xl mb-2">Koneksi Gagal</h1>
        <p>Detail Error: {pesanError}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12 text-slate-800 font-sans">
      <header className="mb-8 border-b border-slate-200 pb-4 max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-emerald-700">🥑 GK AVOCADO Village</h1>
        <p className="text-sm text-slate-500 mt-1">Sistem Pemantauan Data Lahan &amp; Pohon Alpukat</p>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        
        {/* KOTAK STATISTIK DYNAMIC */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pohon</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{totalPohon}</p>
            <p className="text-xs text-slate-500 mt-1">Sesuai filter</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Kondisi Hidup</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{totalHidup}</p>
            <p className="text-xs text-emerald-500 mt-1">Status Normal</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Kondisi Mati</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{totalMati}</p>
            <p className="text-xs text-amber-500 mt-1">Butuh perhatian</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Filter Lahan</p>
            <p className="text-2xl font-black text-indigo-600 mt-1 truncate">{blokTerpilih}</p>
            <p className="text-xs text-indigo-500 mt-1">Lokasi aktif</p>
          </div>
        </div>

        {/* STRUKTUR TATA LETAK: KIRI FORM INPUT, KANAN TABEL DATA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ================= BARU: FORMULIR TAMBAH POHON (PILIHAN 3) ================= */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
            <h3 className="text-base font-black text-slate-700 border-b border-slate-100 pb-2 mb-4 flex items-center gap-1">
              ➕ Tambah Pohon Baru
            </h3>

            <form onSubmit={handleTambahPohon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID Pohon</label>
                <input 
                  type="text" 
                  placeholder="Contoh: TR1081" 
                  value={inputTreeId}
                  onChange={(e) => setInputTreeId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID Blok Lahan</label>
                <input 
                  type="text" 
                  placeholder="Contoh: BLK001" 
                  value={inputBlockId}
                  onChange={(e) => setInputBlockId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Varietas Alpukat</label>
                <select 
                  value={inputVarietas}
                  onChange={(e) => setInputVarietas(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Muria">Muria</option>
                  <option value="Aligator">Aligator</option>
                  <option value="Mentega">Mentega</option>
                  <option value="Hass">Hass</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Tanam</label>
                <input 
                  type="date" 
                  value={inputTanggal}
                  onChange={(e) => setInputTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Awal</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="status" value="Hidup" checked={inputStatus === 'Hidup'} onChange={() => setInputStatus('Hidup')} className="text-emerald-600 focus:ring-emerald-500" />
                    Hidup
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="status" value="Mati" checked={inputStatus === 'Mati'} onChange={() => setInputStatus('Mati')} className="text-amber-600 focus:ring-amber-500" />
                    Mati
                  </label>
                </div>
              </div>

              {/* Notifikasi Sukses/Gagal Form */}
              {notifikasiForm.pesan && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  notifikasiForm.tipe === 'sukses' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {notifikasiForm.pesan}
                </div>
              )}

              <button 
                type="submit" 
                disabled={sedangMenyimpan}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-sm disabled:bg-emerald-400"
              >
                {sedangMenyimpan ? 'Menyimpan...' : '💾 Simpan ke Database'}
              </button>
            </form>
          </div>
          {/* ========================================================================= */}

          {/* SISI KANAN: PANEL FILTER & TABEL DATA */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* PANEL KONTROL FILTER (PILIHAN 2) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cari ID Pohon / Varietas</label>
                <input 
                  type="text"
                  placeholder="Ketik misal: TR0012 atau Muria..."
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Blok Lahan</label>
                <select
                  value={blokTerpilih}
                  onChange={(e) => setBlokTerpilih(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Semua">🌳 Semua Blok Lahan</option>
                  {daftarSemuaBlok.map((idBlok) => (
                    <option key={idBlok} value={idBlok}>📦 Blok {idBlok}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TABEL DATA POHON */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-700">Detail Semua Pohon Kebun</h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  Menampilkan {dataTersaring.length} baris
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[420px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 font-bold text-slate-700 text-left sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="p-4 bg-slate-50">ID Pohon</th>
                      <th className="p-4 bg-slate-50">ID Blok</th>
                      <th className="p-4 bg-slate-50">Varietas</th>
                      <th className="p-4 bg-slate-50">Tanggal Tanam</th>
                      <th className="p-4 bg-slate-50">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {dataTersaring.length > 0 ? (
                      dataTersaring.map((pohon: any, index: number) => (
                        <tr key={pohon.tree_id || index} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-mono font-bold text-emerald-700">{pohon.tree_id}</td>
                          <td className="p-4 font-medium text-slate-900">{pohon.block_id}</td>
                          <td className="p-4 text-slate-600">{pohon.varietas}</td>
                          <td className="p-4 text-slate-500">{pohon.tanggal_tanam}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              pohon.status?.toLowerCase() === 'hidup' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pohon.status || 'Hidup'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                          Tidak ada data pohon yang cocok dengan filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  )
}