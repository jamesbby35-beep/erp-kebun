'use client'

import React, { useEffect, useState } from 'react'

export default function ModulPemasukan() {
  const [penjualans, setPenjualans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- SINKRONISASI DATA DROPDOWN MASTER BLOK ---
  const [daftarBlok, setDaftarBlok] = useState<any[]>([]) 

  // State Form Input Penjualan (Sesuai kolom Supabase)
  const [penjualanId, setPenjualanId] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [namaPembeli, setNamaPembeli] = useState('')
  const [qtyKg, setQtyKg] = useState('')
  const [hargaKg, setHargaKg] = useState('')
  const [blockId, setBlockId] = useState('')
  const [jenis, setJenis] = useState('Pohon Alpukat')
  const [keterangan, setKeterangan] = useState('Aligator')
  const [submitting, setSubmitting] = useState(false)

  // State Mode Edit
  const [isEditing, setIsEditing] = useState(false)
  const [oldPenjualanId, setOldPenjualanId] = useState('')

  const BASE_URL = 'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1'
  const HEADERS = {
    'apikey': 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Authorization': 'Bearer sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // 1. Ambil Data Real-time dari master_penjualan
  const fetchDataPenjualan = () => {
    fetch(`${BASE_URL}/master_penjualan?select=*`, { headers: HEADERS })
      .then(res => res.json())
      .then(data => { 
        setPenjualans(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Gagal memuat data penjualan:", err)
        setLoading(false)
      })
  }

  // 2. Ambil Data Real-time dari master_blok untuk Dropdown Lahan
  const fetchMasterBlok = async () => {
    try {
      const resBlok = await fetch(`${BASE_URL}/master_blok?select=*`, { headers: HEADERS })
      const dataBlok = await resBlok.json()
      if (Array.isArray(dataBlok) && dataBlok.length > 0) {
        setDaftarBlok(dataBlok)
        const awalBlokId = dataBlok[0].block_id || dataBlok[0].id || ''
        setBlockId(awalBlokId) 
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data master blok:", err)
    }
  }

  useEffect(() => {
    const hariIni = new Date().toISOString().split('T')[0]
    setTanggal(hariIni)
    fetchDataPenjualan()
    fetchMasterBlok()
  }, [])

  // Helper konversi ID Blok ke Nama Asli Blok
  const dapatkanNamaBlok = (idBlok: string) => {
    const blokDitemukan = daftarBlok.find(b => (b.block_id === idBlok || b.id === idBlok))
    return blokDitemukan ? (blokDitemukan.nama_blok || blokDitemukan.nama || idBlok) : idBlok
  }

  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedJenis = e.target.value
    setJenis(selectedJenis)
    if (selectedJenis === 'Pohon Alpukat') {
      setKeterangan('Aligator') 
    } else {
      setKeterangan('') 
    }
  }

  // Simpan / Edit Data Pemasukan ke master_penjualan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!penjualanId || !tanggal || !namaPembeli || !qtyKg || !hargaKg || !blockId) {
      return alert('Semua kolom data transaksi wajib diisi!')
    }
    if (!keterangan.trim()) {
      return alert('Varietas atau Keterangan tanaman wajib diisi/dipilih!')
    }

    setSubmitting(true)

    let tanggalFormatted = tanggal
    if (tanggal && tanggal.includes('-')) {
      const [yyyy, mm, dd] = tanggal.split('-')
      tanggalFormatted = `${dd}/${mm}/${yyyy}`
    }

    try {
      // PAYLOAD DISESUAIKAN 100% DENGAN SCHEMA SCREENSHOT SUPABASE ANDA
      const payload = {
        penjualan_id: penjualanId, 
        tanggal: tanggalFormatted,
        pembeli: namaPembeli.trim(),
        qty_kg: Number(qtyKg),
        harga_kg: Number(hargaKg),
        total: Number(qtyKg) * Number(hargaKg), // kolom 'total' di database Anda
        block_id: blockId,
        jenis,
        keterangan: keterangan.trim()
      }

      let res;
      if (isEditing) {
        res = await fetch(`${BASE_URL}/master_penjualan?penjualan_id=eq.${oldPenjualanId}`, {
          method: 'PATCH',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${BASE_URL}/master_penjualan`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        alert(isEditing ? 'Data Transaksi Berhasil Diperbarui!' : 'Nota Penjualan Berhasil Disimpan!')
        resetForm()
        fetchDataPenjualan()
      } else {
        const errData = await res.json()
        alert('Gagal menyimpan transaksi: ' + (errData.message || 'Periksa koneksi RLS Supabase.'))
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (p: any) => {
    setIsEditing(true)
    setOldPenjualanId(p.penjualan_id)
    setPenjualanId(p.penjualan_id)
    
    let inputTgl = p.tanggal || ''
    if (inputTgl && inputTgl.includes('/')) {
      const [dd, mm, yyyy] = inputTgl.split('/')
      inputTgl = `${yyyy}-${mm}-${dd}`
    }
    setTanggal(inputTgl)
    
    setNamaPembeli(p.pembeli || '')
    setQtyKg(p.qty_kg || '')
    setHargaKg(p.harga_kg || '')
    setBlockId(p.block_id || '')
    setJenis(p.jenis || 'Pohon Alpukat')
    setKeterangan(p.keterangan || '')
    
    // Auto scroll ke atas menuju form input saat tombol edit diklik
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus nota penjualan ${id}?`)) return

    try {
      const res = await fetch(`${BASE_URL}/master_penjualan?penjualan_id=eq.${id}`, {
        method: 'DELETE',
        headers: HEADERS
      })

      if (res.ok) {
        alert('Nota Penjualan berhasil dihapus!')
        fetchDataPenjualan()
        if (isEditing && oldPenjualanId === id) resetForm()
      } else {
        alert('Gagal menghapus data nota.')
      }
    } catch (err) {
      alert('Error jaringan saat menghapus data.')
    }
  }

  // Jendela Print Preview Invoice Komplit
  const handleCetakInvoice = (p: any) => {
    const volume = Number(p.qty_kg || 0)
    const hargaSatuan = Number(p.harga_kg || 0)
    const totalOmset = p.total || (volume * hargaSatuan)
    
    const windowCetak = window.open('', '_blank', 'width=850,height=700')
    if (windowCetak) {
      windowCetak.document.write(`
        <html>
          <head>
            <title>Invoice Resmi - ${p.penjualan_id}</title>
            <style>
              body { font-family: 'sans-serif'; color: #334155; padding: 40px; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px solid #16a34a; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #16a34a; display: flex; align-items: center; gap: 8px; }
              .title { font-size: 20px; font-weight: bold; text-align: right; color: #1e293b; }
              .details { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; background: #f8fafc; padding: 16px; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 25px; }
              th { background-color: #16a34a; color: white; padding: 12px; text-align: left; font-size: 14px; }
              td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
              .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 25px; color: #16a34a; }
              .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🥑 GK AVOCADO CORE MANAGEMENT</div>
              <div class="title">INVOICE PENJUALAN RESMI</div>
            </div>
            <div class="details">
              <div><strong>Nomor Nota:</strong> ${p.penjualan_id}</div>
              <div><strong>Tanggal Transaksi:</strong> ${p.tanggal}</div>
              <div><strong>Pihak Pembeli / Vendor:</strong> ${p.pembeli || '-'}</div>
              <div><strong>Lokasi Lahan Kelola:</strong> ${dapatkanNamaBlok(p.block_id)} (${p.block_id || 'Tanpa Blok'})</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Kategori Komoditas</th>
                  <th>Varietas / Keterangan</th>
                  <th>Volume Penjualan</th>
                  <th>Harga Per Kg</th>
                  <th>Subtotal Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${p.jenis || 'Pohon Alpukat'}</strong></td>
                  <td>${p.keterangan || '-'}</td>
                  <td>${volume.toLocaleString('id-ID')} Kg</td>
                  <td>Rp ${hargaSatuan.toLocaleString('id-ID')}</td>
                  <td><strong>Rp ${totalOmset.toLocaleString('id-ID')}</strong></td>
                </tr>
              </tbody>
            </table>
            <div class="total">Total Penerimaan Kas: Rp ${totalOmset.toLocaleString('id-ID')}</div>
            <div class="footer">Nota komersial sah dicetak melalui GK Avocado Digital Ecosystem Management. Terima kasih.</div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      windowCetak.document.close()
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setOldPenjualanId('')
    setPenjualanId('')
    const hariIni = new Date().toISOString().split('T')[0]
    setTanggal(hariIni)
    setNamaPembeli('')
    setQtyKg('')
    setHargaKg('')
    setBlockId(daftarBlok.length > 0 ? (daftarBlok[0].block_id || daftarBlok[0].id) : '')
    setJenis('Pohon Alpukat')
    setKeterangan('Aligator')
  }

  // --- LOGIKA PENGELOMPOKAN RIWAYAT PER BLOK LAHAN ---
  const penjualanPerBlok: { [key: string]: any[] } = {}
  if (Array.isArray(penjualans)) {
    penjualans.forEach(p => {
      const idBlok = p.block_id || 'Belum Ditentukan'
      if (!penjualanPerBlok[idBlok]) {
        penjualanPerBlok[idBlok] = []
      }
      penjualanPerBlok[idBlok].push(p)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif', padding: '10px' }}>
      
      {/* FORM ENTRI ARUS MASUK */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isEditing ? '📝 Perbarui Nota Transaksi Penjualan' : '➕ Catat Nota Penjualan Hasil Panen'}
        </h4>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="ID Penjualan (Misal: J002)" value={penjualanId} onChange={e => setPenjualanId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }} />
          <input type="text" placeholder="Nama Pembeli / Vendor" value={namaPembeli} onChange={e => setNamaPembeli(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '200px' }} />
          <input type="number" placeholder="Kuantitas (qty_kg)" value={qtyKg} onChange={e => setQtyKg(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input type="number" placeholder="Harga per Kg (harga_kg)" value={hargaKg} onChange={e => setHargaKg(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />

          {/* DROPDOWN RELASI BLOK */}
          <select value={blockId} onChange={e => setBlockId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155' }}>
            {daftarBlok.length === 0 ? (
              <option value="">Memuat Blok...</option>
            ) : (
              daftarBlok.map((blok, index) => {
                const idBlok = blok.block_id || blok.id
                const namaBlok = blok.nama_blok || idBlok
                return <option key={index} value={idBlok}>{namaBlok}</option>
              })
            )}
          </select>

          {/* SELEKTOR PILIHAN JENIS UTAMA */}
          <select value={jenis} onChange={handleJenisChange} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155' }}>
            <option value="Pohon Alpukat">Pohon Alpukat</option>
            <option value="Pohon Lainnya">Pohon Lainnya</option>
          </select>

          {/* INPUT VARIETAS DINAMIS */}
          {jenis === 'Pohon Alpukat' ? (
            <select value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155' }}>
              <option value="Aligator">Aligator</option>
              <option value="Muria">Muria</option>
              <option value="Has">Has</option>
              <option value="Mentega">Mentega</option>
            </select>
          ) : (
            <input type="text" placeholder="Keterangan pohon lainnya" value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }} />
          )}

          <button type="submit" disabled={submitting} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            {isEditing ? 'Simpan Perubahan' : 'Simpan Nota'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Batal
            </button>
          )}
        </form>
      </div>

      {/* REKAMAN HISTORI PER KELOMPOK BLOK LAHAN */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontWeight: 'bold' }}>📝 Modul 6: Arus Kas Pemasukan & Penjualan</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b' }}>Log pendapatan dari hasil niaga komoditas alpukat kemitraan terpisah per blok lahan.</p>
        
        {loading ? (
          <p style={{ color: '#64748b', fontSize: '14px' }}>Sinkronisasi data transaksi perkebunan...</p>
        ) : Object.keys(penjualanPerBlok).length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '14px' }}>Belum ada rekaman riwayat data transaksi masuk.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.entries(penjualanPerBlok).map(([idBlokGrup, listData]) => {
              
              // Akumulasi total pemasukan nominal per grup blok
              const akumulasiOmsetBlok = listData.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
              const teksNamaBlok = dapatkanNamaBlok(idBlokGrup)

              return (
                <div key={idBlokGrup} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Sub Header Pembatas Lahan Area */}
                  <div style={{ backgroundColor: '#f1f5f9', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: '700', color: '#334155', fontSize: '14px' }}>📍 Blok Area: {teksNamaBlok} ({idBlokGrup})</span>
                    <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: '800' }}>
                      Subtotal Omset: Rp {akumulasiOmsetBlok.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Wrapper Card Hijau Sesuai Mockup UI Desain */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#ffffff' }}>
                    {listData.map((p, index) => {
                      const volume = Number(p.qty_kg || 0)
                      const hargaSatuan = Number(p.harga_kg || 0)
                      const subTotalAkhir = p.total || (volume * hargaSatuan)

                      return (
                        <div key={index} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ color: '#16a34a', fontSize: '16px' }}>💰</span>
                              <strong style={{ color: '#14532d', fontSize: '15px' }}>{p.pembeli || 'Pembeli Umum'}</strong>
                              <span style={{ fontSize: '11px', backgroundColor: '#bbf7d0', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                {p.penjualan_id}
                              </span>
                              <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontStyle: 'italic' }}>
                                {p.jenis || 'Pohon Alpukat'} ({p.keterangan || '-'})
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#166534', marginLeft: '24px' }}>
                              {volume.toLocaleString('id-ID')} Kg × Rp {hargaSatuan.toLocaleString('id-ID')} | <span style={{ color: '#64748b' }}>Tanggal: {p.tanggal}</span>
                            </div>
                          </div>

                          {/* Fitur Tombol Aksi Lengkap */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <strong style={{ color: '#16a34a', fontSize: '16px', marginRight: '10px' }}>
                              + Rp {subTotalAkhir.toLocaleString('id-ID')}
                            </strong>
                            <button onClick={() => handleCetakInvoice(p)} style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                              🖨️ Invoice
                            </button>
                            <button onClick={() => handleEdit(p)} style={{ cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(p.penjualan_id)} style={{ cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                              Hapus
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}