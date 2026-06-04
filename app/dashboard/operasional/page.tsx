'use client'

import React, { useEffect, useState } from 'react'

export default function ModulOperasional() {
  const [operasionals, setOperasionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- SINKRONISASI DROPDOWN MASTER BLOK LAHAN ---
  const [daftarBlok, setDaftarBlok] = useState<any[]>([]) 

  // State Form Input Operasional (Sesuai 100% Kolom Supabase Anda)
  const [operasionalId, setOperasionalId] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [blockId, setBlockId] = useState('')
  const [kegiatan, setKegiatan] = useState('') // Kolom 'kegiatan' (Isi Sendiri)
  const [biaya, setBiaya] = useState('')       // Kolom 'biaya'
  const [keterangan, setKeterangan] = useState('') // Kolom 'keterangan' (Isi Sendiri)
  const [submitting, setSubmitting] = useState(false)

  // State Mode Perbaikan/Edit Data
  const [isEditing, setIsEditing] = useState(false)
  const [oldOperasionalId, setOldOperasionalId] = useState('')

  const BASE_URL = 'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1'
  const HEADERS = {
    'apikey': 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Authorization': 'Bearer sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // 1. Ambil Data dari master_operasional
  const fetchDataOperasional = () => {
    fetch(`${BASE_URL}/master_operasional?select=*`, { headers: HEADERS })
      .then(res => res.json())
      .then(data => { 
        setOperasionals(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Gagal memuat data master_operasional:", err)
        setLoading(false)
      })
  }

  // 2. Ambil Data dari master_blok untuk Dropdown Relasi Lahan
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
    fetchDataOperasional()
    fetchMasterBlok()
  }, [])

  // Helper konversi ID Blok ke Nama Asli Lahan Blok
  const dapatkanNamaBlok = (idBlok: string) => {
    const blokDitemukan = daftarBlok.find(b => (b.block_id === idBlok || b.id === idBlok))
    return blokDitemukan ? (blokDitemukan.nama_blok || blokDitemukan.nama || idBlok) : idBlok
  }

  // Simpan / Edit Data ke master_operasional di Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!operasionalId || !tanggal || !blockId || !kegiatan.trim()) {
      return alert('Kolom ID, Tanggal, Blok Lahan, dan Jenis Kegiatan wajib diisi!')
    }

    setSubmitting(true)

    let tanggalFormatted = tanggal
    if (tanggal && tanggal.includes('-')) {
      const [yyyy, mm, dd] = tanggal.split('-')
      tanggalFormatted = `${dd}/${mm}/${yyyy}`
    }

    try {
      // PAYLOAD DISESUAIKAN TEPAT DENGAN SCREENSHOT TABEL SUPABASE ANDA
      const payload = {
        operasional_id: operasionalId.trim(), 
        tanggal: tanggalFormatted,
        block_id: blockId,
        kegiatan: kegiatan.trim(),
        biaya: biaya ? Number(biaya) : 0,
        keterangan: keterangan.trim()
      }

      let res;
      if (isEditing) {
        res = await fetch(`${BASE_URL}/master_operasional?operasional_id=eq.${oldOperasionalId}`, {
          method: 'PATCH',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${BASE_URL}/master_operasional`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        alert(isEditing ? 'Data Kegiatan Operasional Berhasil Diperbarui!' : 'Aktivitas Perawatan Lapangan Berhasil Disimpan!')
        resetForm()
        fetchDataOperasional()
      } else {
        const errData = await res.json()
        alert('Gagal menyimpan data: ' + (errData.message || 'Periksa duplikasi ID atau aturan RLS.'))
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan sistem.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (p: any) => {
    setIsEditing(true)
    setOldOperasionalId(p.operasional_id)
    setOperasionalId(p.operasional_id || '')
    
    let inputTgl = p.tanggal || ''
    if (inputTgl && inputTgl.includes('/')) {
      const [dd, mm, yyyy] = inputTgl.split('/')
      inputTgl = `${yyyy}-${mm}-${dd}`
    }
    setTanggal(inputTgl)
    
    setBlockId(p.block_id || '')
    setKegiatan(p.kegiatan || '')
    setBiaya(p.biaya || '')
    setKeterangan(p.keterangan || '')
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data kegiatan operasional ${id}?`)) return

    try {
      const res = await fetch(`${BASE_URL}/master_operasional?operasional_id=eq.${id}`, {
        method: 'DELETE',
        headers: HEADERS
      })

      if (res.ok) {
        alert('Data logbook aktivitas berhasil dihapus!')
        fetchDataOperasional()
        if (isEditing && oldOperasionalId === id) resetForm()
      } else {
        alert('Gagal menghapus data dari Supabase.')
      }
    } catch (err) {
      alert('Error jaringan saat mencoba menghapus data.')
    }
  }

  // Jendela Cetak Bukti Lembar Tugas Kegiatan Operasional (Print Preview)
  const handleCetakInvoice = (p: any) => {
    const nilaiBiaya = Number(p.biaya || 0)
    
    const windowCetak = window.open('', '_blank', 'width=850,height=650')
    if (windowCetak) {
      windowCetak.document.write(`
        <html>
          <head>
            <title>Log Kerja Agronomis - ${p.operasional_id}</title>
            <style>
              body { font-family: 'sans-serif'; color: #334155; padding: 40px; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
              .title { font-size: 20px; font-weight: bold; text-align: right; color: #1e293b; }
              .details { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; background: #f8fafc; padding: 16px; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 25px; }
              th { background-color: #1e3a8a; color: white; padding: 12px; text-align: left; font-size: 14px; }
              td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
              .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 25px; color: #1e3a8a; }
              .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🥑 GK AVOCADO CORE MANAGEMENT</div>
              <div class="title">LEMBAR OPERASIONAL LAPANGAN</div>
            </div>
            <div class="details">
              <div><strong>ID Operasional:</strong> ${p.operasional_id}</div>
              <div><strong>Tanggal Pelaksanaan:</strong> ${p.tanggal}</div>
              <div><strong>Lokasi Lahan Kelola:</strong> ${dapatkanNamaBlok(p.block_id)} (${p.block_id || 'Umum'})</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Aktivitas Perawatan / Kegiatan Agronomis</th>
                  <th>Keterangan Rinci Lapangan</th>
                  <th>Alokasi Beban Biaya</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${p.kegiatan}</strong></td>
                  <td>${p.keterangan || '-'}</td>
                  <td><strong>Rp ${nilaiBiaya.toLocaleString('id-ID')}</strong></td>
                </tr>
              </tbody>
            </table>
            <div class="total">Total Pembiayaan Aktivitas: Rp ${nilaiBiaya.toLocaleString('id-ID')}</div>
            <div class="footer">Dicetak sah melalui Sistem Manajemen Operasional GK Avocado Digital Ecosystem. Terima kasih.</div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      windowCetak.document.close()
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setOldOperasionalId('')
    setOperasionalId('')
    const hariIni = new Date().toISOString().split('T')[0]
    setTanggal(hariIni)
    setKegiatan('')
    setBiaya('')
    setKeterangan('')
    setBlockId(daftarBlok.length > 0 ? (daftarBlok[0].block_id || daftarBlok[0].id) : '')
  }

  // --- LOGIKA PENGELOMPOKAN RIWAYAT AKTIVITAS OPERASIONAL PER BLOK LAHAN ---
  const operasionalPerBlok: { [key: string]: any[] } = {}
  if (Array.isArray(operasionals)) {
    operasionals.forEach(p => {
      const idBlokGrup = p.block_id || 'Tanpa Blok / Umum'
      if (!operasionalPerBlok[idBlokGrup]) {
        operasionalPerBlok[idBlokGrup] = []
      }
      operasionalPerBlok[idBlokGrup].push(p)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif', padding: '10px' }}>
      
      {/* FORM ENTRI LOGBOOK KEGIATAN AGRONOMIS */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#14532d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isEditing ? '📝 Perbarui Logbook Kegiatan Lapangan' : '➕ Catat Kegiatan Agronomis Baru'}
        </h4>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="ID (Misal: OPS003)" value={operasionalId} onChange={e => setOperasionalId(e.target.value)} disabled={isEditing} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: isEditing ? '#f1f5f9' : '#ffffff' }} />
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }} />
          
          {/* DROPDOWN RELASI DATA MASTER BLOK */}
          <select value={blockId} onChange={e => setBlockId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155' }}>
            {daftarBlok.length === 0 ? (
              <option value="">Memuat Pilihan Blok...</option>
            ) : (
              daftarBlok.map((blok, index) => {
                const idBlok = blok.block_id || blok.id
                const namaBlok = blok.nama_blok || idBlok
                return <option key={index} value={idBlok}>{namaBlok}</option>
              })
            )}
          </select>

          {/* INPUT BEBAS ISI SENDIRI UNTUK JENIS KEGIATAN */}
          <input type="text" placeholder="Deskripsi Kegiatan (Contoh: Pemupukan NPK)" value={kegiatan} onChange={e => setKegiatan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '280px' }} />
          
          {/* INPUT NOMINAL BEBAN BIAYA */}
          <input type="number" placeholder="Beban Biaya (Rp) - Opsional" value={biaya} onChange={e => setBiaya(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />

          {/* INPUT BEBAS ISI SENDIRI UNTUK KETERANGAN RINCI */}
          <input type="text" placeholder="Keterangan Rinci (Contoh: NPK Mutiara / Fungisida)" value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '250px' }} />

          <button type="submit" disabled={submitting} style={{ backgroundColor: '#14532d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            {isEditing ? 'Simpan Perubahan' : 'Save'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Batal
            </button>
          )}
        </form>
      </div>

      {/* REKAMAN HISTORI LOGBOOK OPERASIONAL PER KELOMPOK BLOK LAHAN */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontWeight: 'bold' }}>📋 Logbook Perawatan Lapangan</h4>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b' }}>Daftar aktivitas maintenance tanaman dan lahan terpisah berdasarkan blok kelolaan.</p>
        
        {loading ? (
          <p style={{ color: '#64748b', fontSize: '14px' }}>Menyinkronkan data aktivitas perkebunan...</p>
        ) : Object.keys(operasionalPerBlok).length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '14px' }}>Belum ada rekaman riwayat data operasional lapangan.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.entries(operasionalPerBlok).map(([idBlokGrup, listData]) => {
              
              // Akumulasi total biaya per kelompok blok
              const totalBiayaBlok = listData.reduce((sum, item) => sum + (Number(item.biaya) || 0), 0)
              const teksNamaBlok = dapatkanNamaBlok(idBlokGrup)

              return (
                <div key={idBlokGrup} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Sub Header Pembatas Lahan Area Kelompok */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: '700', color: '#14532d', fontSize: '14px' }}>📍 Area Lahan: {teksNamaBlok} ({idBlokGrup})</span>
                    <span style={{ color: '#b91c1c', fontSize: '13px', fontWeight: 'bold' }}>
                      Total Biaya Blok: Rp {totalBiayaBlok.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Wrapper Card Indikator List Bar (Meniru Gaya Desain Mockup) */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#ffffff' }}>
                    {listData.map((p, index) => {
                      const nilaiBiaya = Number(p.biaya || 0)

                      return (
                        <div key={index} style={{ borderLeft: '4px solid #14532d', backgroundColor: '#f0fdf4', padding: '14px 20px', borderRadius: '0 8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                              📅 {p.tanggal} — <span style={{ fontWeight: 'bold', color: '#334155' }}>ID: {p.operasional_id}</span>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>
                              {p.kegiatan}
                            </div>
                            {p.keterangan && (
                              <div style={{ fontSize: '13px', color: '#15803d', fontStyle: 'italic', marginTop: '2px' }}>
                                Ket: {p.keterangan}
                              </div>
                            )}
                          </div>

                          {/* Fitur Interaksi Tombol Pengelolaan Lengkap */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {nilaiBiaya > 0 ? (
                              <strong style={{ color: '#b91c1c', fontSize: '15px', marginRight: '5px' }}>
                                Rp {nilaiBiaya.toLocaleString('id-ID')}
                              </strong>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', marginRight: '5px' }}>Tanpa Biaya</span>
                            )}
                            
                            <button onClick={() => handleCetakInvoice(p)} style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                              🖨️ Cetak
                            </button>
                            <button onClick={() => handleEdit(p)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 'bold' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(p.operasional_id)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>
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