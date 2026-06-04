'use client'

import React, { useEffect, useState } from 'react'

// Konfigurasi API Supabase
const BASE_URL = 'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1'
const HEADERS = {
  'apikey': 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
  'Authorization': 'Bearer sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
  'Content-Type': 'application/json'
}

export default function DashboardAgrikulturSiohioma() {
  const [loading, setLoading] = useState(true)
  
  // State Data Master
  const [pohons, setPohons] = useState<any[]>([])
  const [bloks, setBloks] = useState<any[]>([])
  const [penjualans, setPenjualans] = useState<any[]>([])
  const [pengeluarans, setPengeluarans] = useState<any[]>([])
  const [panens, setPanens] = useState<any[]>([])
  const [investors, setInvestors] = useState<any[]>([])
  const [operasionals, setOperasionals] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/master_pohon?select=*`, { headers: HEADERS }).then(res => res.json()),
      fetch(`${BASE_URL}/master_blok?select=*`, { headers: HEADERS }).then(res => res.json()),
      fetch(`${BASE_URL}/master_penjualan?select=*&order=tanggal.desc`, { headers: HEADERS }).then(res => res.json()),
      fetch(`${BASE_URL}/master_pengeluaran?select=*&order=tanggal.desc`, { headers: HEADERS }).then(res => res.json()),
      fetch(`${BASE_URL}/master_panen?select=*`, { headers: HEADERS }).then(res => res.json()),
      fetch(`${BASE_URL}/master_investor?select=*`, { headers: HEADERS }).then(res => res.json()),
      fetch(`${BASE_URL}/master_operasional?select=*`, { headers: HEADERS }).then(res => res.json())
    ])
      .then(([dPohon, dBlok, dJual, dKeluar, dPanen, dInv, dOp]) => {
        setPohons(Array.isArray(dPohon) ? dPohon : [])
        setBloks(Array.isArray(dBlok) ? dBlok : [])
        setPenjualans(Array.isArray(dJual) ? dJual : [])
        setPengeluarans(Array.isArray(dKeluar) ? dKeluar : [])
        setPanens(Array.isArray(dPanen) ? dPanen : [])
        setInvestors(Array.isArray(dInv) ? dInv : [])
        setOperasionals(Array.isArray(dOp) ? dOp : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Gagal memuat data:", err)
        setLoading(false)
      })
  }, [])

  // ==================== ENGINE PEMROSESAN DATA ====================

  // 1. Perhitungan Finansial
  let totalPenjualan = 0
  let labaAlpukat = 0
  let labaLainnya = 0

  penjualans.forEach(j => {
    const nominal = Number(j.total) || (Number(j.qty_kg || 0) * Number(j.harga_kg || 0))
    totalPenjualan += nominal
    const jenisText = (j.jenis || '').toLowerCase()
    const ketText = (j.keterangan || '').toLowerCase()

    if (jenisText.includes('alpukat') || ketText.includes('alpukat')) {
      labaAlpukat += nominal
    } else {
      labaLainnya += nominal
    }
  })

  const totalPengeluaran = pengeluarans.reduce((sum, item) => sum + Number(item.nominal || 0), 0)
  const totalOperasional = operasionals.reduce((sum, item) => sum + Number(item.beban_biaya || item.nominal || item.biaya || 0), 0)
  
  const totalOutflow = totalPengeluaran + totalOperasional
  const labaBersihKonsolidasi = totalPenjualan - totalOutflow

  // Kalkulasi Persentase untuk Grafik Setengah Lingkaran
  const grandTotalKomponen = totalPenjualan + totalPengeluaran + totalOperasional || 1
  const pctPenjualan = (totalPenjualan / grandTotalKomponen) * 100
  const pctPengeluaran = (totalPengeluaran / grandTotalKomponen) * 100
  const pctOperasional = (totalOperasional / grandTotalKomponen) * 100

  const kelilingSetengah = 157.08
  const strokePenjualan = (pctPenjualan / 100) * kelilingSetengah
  const strokePengeluaran = (pctPengeluaran / 100) * kelilingSetengah
  const strokeOperasional = (pctOperasional / 100) * kelilingSetengah

  // 2. Produksi: Volume Hasil Panen
  let panenAlpukatKg = 0
  let panenLainnyaKg = 0
  panens.forEach(p => {
    const berat = Number(p.berat_kg) || 0
    const jenisText = (p.jenis || '').toLowerCase()
    if (jenisText.includes('alpukat')) {
      panenAlpukatKg += berat
    } else {
      panenLainnyaKg += berat
    }
  })

  // 3. Sensus Pohon Terdata
  let pohonAlpukatBtg = 0
  let pohonLainnyaBtg = 0
  pohons.forEach(p => {
    const jenisText = (p.jenis || p.nama_pohon || '').toLowerCase()
    if (jenisText.includes('alpukat')) {
      pohonAlpukatBtg++
    } else {
      pohonLainnyaBtg++
    }
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 font-sans">
        <p className="text-slate-500 text-base font-bold animate-pulse">Sinkronisasi Database Core...</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-900 w-full box-border">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="m-0 text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
            GK AVOCADO CORE EXECUTIVE
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Sistem Integrasi Agrikultur – Lahan, Finansial & Distribusi Aset Investor
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-bold border border-green-200 shadow-sm self-start sm:self-auto">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span> LIVE CORE CONNECTED
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* BARIS 1: LABA BERSIH & RINCIAN LABA KOMODITAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Box Laba Bersih (Mengambil 2 kolom di layar besar) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-8 border-3 border-emerald-500 shadow-sm">
            <span className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">
              Konsolidasi Laba Bersih (Netto)
            </span>
            <h2 className="my-3 text-3xl md:text-4xl font-black text-emerald-500 tracking-tight break-words">
              Rp {labaBersihKonsolidasi.toLocaleString('id-ID')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t-2 border-slate-100 text-xs md:text-sm">
              <div>
                <span className="text-slate-400 font-semibold">Total Pendapatan:</span> 
                <strong className="block text-slate-900 text-sm md:text-base mt-1">
                  Rp {totalPenjualan.toLocaleString('id-ID')}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Total Beban Operasional + Kas:</span> 
                <strong className="block text-rose-500 text-sm md:text-base mt-1">
                  Rp {totalOutflow.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>
          </div>

          {/* Box Rincian Laba Komoditas */}
          <div className="bg-white rounded-2xl p-5 md:p-8 border-3 border-slate-200 shadow-sm">
            <span className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">
              Rincian Laba Komoditas
            </span>
            <div className="flex flex-col gap-3.5 mt-4.5">
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-sm font-bold text-slate-700">🥑 Penjualan Alpukat</span>
                <strong className="text-slate-900 text-sm md:text-base">Rp {labaAlpukat.toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-sm font-bold text-slate-700">🍊 Komoditas Lainnya</span>
                <strong className="text-slate-900 text-sm md:text-base">Rp {labaLainnya.toLocaleString('id-ID')}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* BARIS 2: VOLUME PANEN & SENSUS POHON (KIRI) | GRAFIK & ZONASI (KANAN) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Kolom Kiri Gabungan (Volume Hasil Panen & Sensus Pohon) */}
          <div className="flex flex-col gap-6 xl:col-span-2">
            
            {/* Volume Hasil Panen */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border-2.5 border-slate-200 shadow-xs">
              <span className="text-xs uppercase text-slate-400 font-extrabold">Volume Hasil Panen (Real)</span>
              <div className="flex flex-wrap items-baseline gap-2 my-3">
                <h3 className="m-0 text-2xl md:text-3xl font-black text-emerald-500">
                  {(panenAlpukatKg + panenLainnyaKg).toLocaleString('id-ID')}
                </h3>
                <span className="text-xs md:text-sm font-bold text-slate-400">Kg Terakumulasi Nyata</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm mt-2">
                <div className="border-l-4 border-emerald-500 pl-3">
                  <span className="text-slate-400 font-semibold">Varietas Alpukat:</span>
                  <strong className="block text-sm md:text-base mt-0.5">{panenAlpukatKg.toLocaleString('id-ID')} Kg</strong>
                </div>
                <div className="border-l-4 border-amber-500 pl-3">
                  <span className="text-slate-400 font-semibold">Lainnya (Semangka/Jeruk):</span>
                  <strong className="block text-sm md:text-base mt-0.5">{panenLainnyaKg.toLocaleString('id-ID')} Kg</strong>
                </div>
              </div>
            </div>

            {/* Sensus Pohon Terdata */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border-2.5 border-slate-200 shadow-xs">
              <span className="text-xs uppercase text-slate-400 font-extrabold">Aset Sensus Pohon Terdata</span>
              <div className="flex flex-wrap items-baseline gap-2 my-3">
                <h3 className="m-0 text-2xl md:text-3xl font-black text-slate-800">
                  {(pohonAlpukatBtg + pohonLainnyaBtg).toLocaleString('id-ID')}
                </h3>
                <span className="text-xs md:text-sm font-bold text-slate-400">Batang Tegakan Hidup</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm mt-2">
                <div className="border-l-4 border-green-500 pl-3">
                  <span className="text-slate-400 font-semibold">Pohon Alpukat Produktif:</span>
                  <strong className="block text-sm md:text-base text-green-600 mt-0.5">{pohonAlpukatBtg} Btg</strong>
                </div>
                <div className="border-l-4 border-slate-400 pl-3">
                  <span className="text-slate-400 font-semibold">Pohon Pendukung Lahan:</span>
                  <strong className="block text-sm md:text-base mt-0.5">{pohonLainnyaBtg} Btg</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Kolom Kanan Gabungan (Grafik Setengah Lingkaran & Zonasi) */}
          <div className="flex flex-col gap-6">
            
            {/* Grafik Struktur Keuangan Kebun */}
            <div className="bg-white rounded-2xl p-5 border-2.5 border-slate-200 flex flex-col items-center justify-center">
              <span className="text-xs uppercase text-slate-400 font-extrabold align-self-start w-full text-left mb-3">
                Struktur Keuangan Kebun
              </span>
              
              <div className="relative w-[180px] h-[100px] overflow-hidden flex justify-center items-end">
                <svg width="180" height="180" viewBox="0 0 120 120" className="-rotate-180 origin-[60px_60px]">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={`${strokePenjualan} 314.16`} strokeDashoffset="0" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${strokePengeluaran} 314.16`} strokeDashoffset={`-${strokePenjualan}`} />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray={`${strokeOperasional} 314.16`} strokeDashoffset={`-${strokePenjualan + strokePengeluaran}`} />
                </svg>
                <div className="absolute bottom-0 text-center w-full">
                  <span className="text-[10px] text-slate-400 font-extrabold tracking-wider">PROPORSI POS</span>
                </div>
              </div>

              {/* Indikator Sektor Legenda */}
              <div className="grid grid-cols-3 gap-1.5 w-full mt-4 text-[10px] sm:text-xs font-bold text-center">
                <div className="p-1.5 bg-green-50 rounded-lg text-green-700">● Jual ({Math.round(pctPenjualan)}%)</div>
                <div className="p-1.5 bg-red-50 rounded-lg text-red-700">● Keluar ({Math.round(pctPengeluaran)}%)</div>
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-700">● Ops ({Math.round(pctOperasional)}%)</div>
              </div>
            </div>

            {/* Zonasi Wilayah Lahan Ringkas */}
            <div className="bg-white rounded-2xl p-5 border-2.5 border-slate-200">
              <span className="text-xs uppercase text-slate-400 font-extrabold">Zonasi Wilayah Lahan</span>
              <div className="flex items-center gap-3 my-2.5">
                <span className="text-3xl font-black text-emerald-700">{bloks.length}</span>
                <span className="text-xs md:text-sm font-bold text-slate-500">Total Blok Kategori Aktif</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {bloks.map((b, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-600">
                    {b.nama_blok || b.block_id || b.id}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* BARIS 3: DISTRIBUSI KEPEMILIKAN INVESTOR & JURNAL ARUS MUTASI KAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          
          {/* Distribusi Kepemilikan Investor (Layar besar ambil 2 kolom) */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-5 md:p-6 border-2.5 border-slate-200 shadow-xs">
            <h3 className="m-0 text-base md:text-lg font-black text-slate-800 tracking-tight">
              Distribusi Kepemilikan Investor per Lahan
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-400 font-medium">
              Daftar konsorsium pemegang porsi saham diurutkan berdasarkan kode blok wilayah kebun.
            </p>

            <div className="flex flex-col gap-4 mt-5">
              {bloks.map((b, i) => {
                const idBlok = b.block_id || b.id
                const investorTerikat = investors.filter(inv => inv.block_id === idBlok)

                return (
                  <div key={i} className="border-2 border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b-2 border-slate-100 pb-2.5 mb-3 text-xs md:text-sm font-extrabold text-emerald-800">
                      <span className="flex items-center gap-1">📍 {b.nama_blok || idBlok}</span>
                      <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md text-xs font-bold border border-sky-100 self-start sm:self-auto">
                        Luas Lahan: {b.luas_lahan || b.luas || '0'} m²
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {investorTerikat.length === 0 ? (
                        <span className="text-xs text-slate-400 italic font-medium">Belum ada entitas investor terikat</span>
                      ) : (
                        investorTerikat.map((inv, idx) => {
                          const nilaiSaham = inv.persen_saham !== undefined && inv.persen_saham !== null ? inv.persen_saham : 0;
                          return (
                            <div key={idx} className="text-xs md:text-sm flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200/60 font-semibold">
                              <span className="text-slate-600">👤 {inv.nama || inv.nama_investor}</span>
                              <span className="font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">{nilaiSaham}% Saham</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Jurnal Arus Mutasi Kas */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border-2.5 border-slate-200 shadow-xs">
            <h3 className="m-0 text-base md:text-lg font-black text-slate-800 tracking-tight">
              Jurnal Ringkas Arus Mutasi Kas
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-400 font-medium">
              Log transaksi mutasi modal kas masuk (In) dan keluar (Out) terbaru di lapangan.
            </p>

            <div className="flex flex-col gap-3 mt-5">
              {penjualans.slice(0, 3).map((j, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-green-50/70 rounded-xl border border-green-200 text-xs md:text-sm">
                  <div className="min-w-0 flex-1 pr-2">
                    <strong className="block text-slate-800 truncate">🟢 {j.pembeli || 'Hasil Niaga Lahan'}</strong>
                    <span className="text-[11px] text-slate-400 font-medium">{j.tanggal}</span>
                  </div>
                  <strong className="text-green-600 font-black whitespace-nowrap">+ Rp {(Number(j.total) || 0).toLocaleString('id-ID')}</strong>
                </div>
              ))}
              
              {pengeluarans.slice(0, 2).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-red-50/70 rounded-xl border border-red-200 text-xs md:text-sm">
                  <div className="min-w-0 flex-1 pr-2">
                    <strong className="block text-slate-800 truncate">🔴 {p.keperluan || 'Biaya Logistik Lahan'}</strong>
                    <span className="text-[11px] text-slate-400 font-medium">{p.tanggal}</span>
                  </div>
                  <strong className="text-rose-600 font-black whitespace-nowrap">- Rp {(Number(p.nominal) || 0).toLocaleString('id-ID')}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}