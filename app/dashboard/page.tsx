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

  // Kalkulasi Persentase untuk Grafik Setengah Lingkaran (Pembagian 3 Pos)
  const grandTotalKomponen = totalPenjualan + totalPengeluaran + totalOperasional || 1
  const pctPenjualan = (totalPenjualan / grandTotalKomponen) * 100
  const pctPengeluaran = (totalPengeluaran / grandTotalKomponen) * 100
  const pctOperasional = (totalOperasional / grandTotalKomponen) * 100

  // Perhitungan SVG Stroke Dasharray Setengah Lingkaran (Radius 50 -> Keliling Lingkaran = 314.16, Setengah Keliling = 157.08)
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '700' }}>Sinkronisasi Database Core...</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '32px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      
      {/* HEADER DASHBOARD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.02em' }}>GK AVOCADO CORE EXECUTIVE</h1>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Sistem Integrasi Agrikultur – Manajemen Lahan, Finansial & Distribusi Aset Investor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '8px 16px', borderRadius: '24px', fontSize: '13px', fontWeight: '700' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span> LIVE CORE CONNECTED
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* BARIS 1: LABA BERSIH & RINCIAN LABA KOMODITAS (BORDURNYA LEBIH BESAR TETAP) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          
          {/* Box Laba Bersih */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '3px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', letterSpacing: '0.05em' }}>Konsolidasi Laba Bersih (Netto)</span>
            <h2 style={{ margin: '12px 0', fontSize: '42px', fontWeight: '900', color: '#10b981', letterSpacing: '-0.03em' }}>Rp {labaBersihKonsolidasi.toLocaleString('id-ID')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', fontSize: '14px', borderTop: '2px solid #f1f5f9', paddingTop: '16px' }}>
              <div><span style={{ color: '#64748b', fontWeight: '600' }}>Total Pendapatan:</span> <strong style={{ display: 'block', color: '#0f172a', fontSize: '16px', marginTop: '4px' }}>Rp {totalPenjualan.toLocaleString('id-ID')}</strong></div>
              <div><span style={{ color: '#64748b', fontWeight: '600' }}>Total Beban Operasional + Kas:</span> <strong style={{ display: 'block', color: '#ef4444', fontSize: '16px', marginTop: '4px' }}>Rp {totalOutflow.toLocaleString('id-ID')}</strong></div>
            </div>
          </div>

          {/* Box Rincian Laba Komoditas */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '3px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', letterSpacing: '0.05em' }}>Rincian Laba Komoditas</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                <span style={{ fontSize: '15px', fontWeight: '700' }}>🥑 Penjualan Alpukat</span>
                <strong style={{ color: '#0f172a', fontSize: '16px' }}>Rp {labaAlpukat.toLocaleString('id-ID')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                <span style={{ fontSize: '15px', fontWeight: '700' }}>🍊 Komoditas Lainnya</span>
                <strong style={{ color: '#0f172a', fontSize: '16px' }}>Rp {labaLainnya.toLocaleString('id-ID')}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* BARIS 2: VOLUME PANEN & SENSUS POHON (LEBIH LEBAR), DI SAMPINGNYA GRAFIK 1/2 LINGKARAN & ZONASI KECIL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
          
          {/* Kolom Kiri: Volume Hasil Panen & Sensus Pohon Terdata (Lebar & Font Besar) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Volume Hasil Panen */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', border: '2.5px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>Volume Hasil Panen (Real)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '10px 0 18px 0' }}>
                <h3 style={{ margin: 0, fontSize: '36px', fontWeight: '900', color: '#10b981' }}>{(panenAlpukatKg + panenLainnyaKg).toLocaleString('id-ID')}</h3>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#64748b' }}>Kg Terakumulasi Nyata</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Varietas Alpukat:</span>
                  <strong style={{ display: 'block', fontSize: '16px', marginTop: '2px' }}>{panenAlpukatKg.toLocaleString('id-ID')} Kg</strong>
                </div>
                <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Lainnya (Semangka/Muria/Jeruk):</span>
                  <strong style={{ display: 'block', fontSize: '16px', marginTop: '2px' }}>{panenLainnyaKg.toLocaleString('id-ID')} Kg</strong>
                </div>
              </div>
            </div>

            {/* Sensus Pohon Terdata */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', border: '2.5px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>Aset Sensus Pohon Terdata</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '10px 0 18px 0' }}>
                <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>{(pohonAlpukatBtg + pohonLainnyaBtg).toLocaleString('id-ID')}</h3>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#64748b' }}>Batang Tegakan Hidup</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div style={{ borderLeft: '4px solid #22c55e', paddingLeft: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Pohon Alpukat Produktif:</span>
                  <strong style={{ display: 'block', fontSize: '16px', color: '#16a34a', marginTop: '2px' }}>{pohonAlpukatBtg} Btg</strong>
                </div>
                <div style={{ borderLeft: '4px solid #64748b', paddingLeft: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Pohon Pendukung Lahan:</span>
                  <strong style={{ display: 'block', fontSize: '16px', marginTop: '2px' }}>{pohonLainnyaBtg} Btg</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Kolom Kanan: Grafik Setengah Lingkaran (3 Pembagian) & Zonasi Lahan yang Diperkecil */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Grafik Setengah Lingkaran (Struktur Kas) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '2.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', alignSelf: 'flex-start', marginBottom: '12px' }}>Struktur Keuangan Kebun</span>
              
              {/* SVG Gauge Setengah Lingkaran */}
              <div style={{ position: 'relative', width: '220px', height: '120px', overflow: 'hidden' }}>
                <svg width="220" height="220" viewBox="0 0 120 120" style={{ transform: 'rotate(-180deg)', transformOrigin: '60px 60px' }}>
                  {/* Lingkaran Dasar / Background */}
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  
                  {/* Segment 1: Penjualan */}
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="12" 
                    strokeDasharray={`${strokePenjualan} 314.16`} strokeDashoffset="0" />
                  
                  {/* Segment 2: Pengeluaran */}
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="12" 
                    strokeDasharray={`${strokePengeluaran} 314.16`} strokeDashoffset={`-${strokePenjualan}`} />
                  
                  {/* Segment 3: Operasional */}
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#3b82f6" strokeWidth="12" 
                    strokeDasharray={`${strokeOperasional} 314.16`} strokeDashoffset={`-${strokePenjualan + strokePengeluaran}`} />
                </svg>
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>PROPORSI POS</span>
                </div>
              </div>

              {/* Legend Grafik */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }}></span> Jual ({Math.round(pctPenjualan)}%)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span> Keluar ({Math.round(pctPengeluaran)}%)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span> Operasional ({Math.round(pctOperasional)}%)</div>
              </div>
            </div>

            {/* Zonasi Wilayah Lahan (Ukurannya Diperkecil Ringkas) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '2.5px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>Zonasi Wilayah Lahan</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: '#047857' }}>{bloks.length}</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>Total Blok Kategori Aktif</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {bloks.map((b, idx) => (
                  <span key={idx} style={{ fontSize: '12px', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontWeight: '700', color: '#334155' }}>
                    {b.nama_blok || b.block_id || b.id}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* BARIS 3: DISTRIBUSI KEPEMILIKAN INVESTOR (DENGAN LUAS LAHAN MASTER BLOK) & JURNAL ARUS MUTASI */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Distribusi Kepemilikan Investor */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', border: '2.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em' }}>Distribusi Kepemilikan Investor per Lahan</h3>
            <p style={{ margin: '0 0 ' + '18px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Daftar konsorsium pemegang porsi saham diurutkan berdasarkan kode blok wilayah kebun.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {bloks.map((b, i) => {
                const idBlok = b.block_id || b.id
                const investorTerikat = investors.filter(inv => inv.block_id === idBlok)

                return (
                  <div key={i} style={{ border: '2px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', fontSize: '14px', fontWeight: '800', color: '#047857' }}>
                      <span>📍 {b.nama_blok || idBlok}</span>
                      {/* Menampilkan Luas Lahan Sesuai dengan Data yang Ada di Master Blok */}
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                        Luas Lahan: {b.luas_lahan || b.luas || 'Belum Terinput'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {investorTerikat.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '500' }}>Belum ada entitas investor terikat</span>
                      ) : (
                        investorTerikat.map((inv, idx) => {
                          const nilaiSaham = inv.persen_saham !== undefined && inv.persen_saham !== null ? inv.persen_saham : 0;
                          return (
                            <div key={idx} style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #f1f5f9', fontWeight: '600' }}>
                              <span style={{ color: '#475569' }}>• {inv.nama || inv.nama_investor}</span>
                              <span style={{ fontWeight: '800', color: '#0284c7' }}>{nilaiSaham}% Saham</span>
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
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', border: '2.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em' }}>Jurnal Ringkas Arus Mutasi Kas</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Log transaksi mutasi modal kas masuk (In) dan keluar (Out) terbaru di lapangan.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {penjualans.slice(0, 3).map((j, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1.5px solid #bbf7d0' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#14532d' }}>{j.pembeli || 'Hasil Niaga Lahan'}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{j.tanggal}</span>
                  </div>
                  <strong style={{ color: '#16a34a', fontSize: '15px', fontWeight: '800' }}>+ Rp {(Number(j.total) || 0).toLocaleString('id-ID')}</strong>
                </div>
              ))}
              {pengeluarans.slice(0, 2).map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1.5px solid #fecaca' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#7f1d1d' }}>{p.keperluan || 'Biaya Logistik Pupuk'}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{p.tanggal}</span>
                  </div>
                  <strong style={{ color: '#dc2626', fontSize: '15px', fontWeight: '800' }}>- Rp {(Number(p.nominal) || 0).toLocaleString('id-ID')}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}