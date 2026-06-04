'use client'

import React, { useEffect, useState } from 'react'

export default function ModulPengeluaran() {
  const [pengeluarans, setPengeluarans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- STATE SINKRONISASI DROPDOWN MASTER BLOK ---
  const [daftarBlok, setDaftarBlok] = useState<any[]>([]) 

  // State Form Input Pengeluaran
  const [pengeluaranId, setPengeluaranId] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [kategori, setKategori] = useState('') // Isi sendiri
  const [nominal, setNominal] = useState('')
  const [keterangan, setKeterangan] = useState('') // Isi sendiri
  const [blockId, setBlockId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // State Mode Edit
  const [isEditing, setIsEditing] = useState(false)
  const [oldPengeluaranId, setOldPengeluaranId] = useState('')

  const BASE_URL = 'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1'
  const HEADERS = {
    'apikey': 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Authorization': 'Bearer sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // 1. Ambil Data dari master_pengeluaran
  const fetchDataPengeluaran = () => {
    fetch(`${BASE_URL}/master_pengeluaran?select=*`, { headers: HEADERS })
      .then(res => res.json())
      .then(data => { 
        setPengeluarans(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Gagal memuat data pengeluaran:", err)
        setLoading(false)
      })
  }

  // 2. Ambil Data dari master_blok untuk pilihan Lahan
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
    fetchDataPengeluaran()
    fetchMasterBlok()
  }, [])

  // Helper konversi ID Blok ke Nama Asli Blok
  const dapatkanNamaBlok = (idBlok: string) => {
    const blokDitemukan = daftarBlok.find(b => (b.block_id === idBlok || b.id === idBlok))
    return blokDitemukan ? (blokDitemukan.nama_blok || blokDitemukan.nama || idBlok) : idBlok
  }

  // Simpan / Edit Data ke master_pengeluaran
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pengeluaranId || !tanggal || !kategori || !nominal || !blockId) {
      return alert('Semua kolom data transaksi pengeluaran wajib diisi!')
    }

    setSubmitting(true)

    let tanggalFormatted = tanggal
    if (tanggal && tanggal.includes('-')) {
      const [yyyy, mm, dd] = tanggal.split('-')
      tanggalFormatted = `${dd}/${mm}/${yyyy}`
    }

    try {
      // Sesuaikan nama field di bawah ini jika nama kolom di Supabase Anda berbeda
      const payload = {
        pengeluaran_id: pengeluaranId, 
        tanggal: tanggalFormatted,
        kategori: kategori.trim(),
        nominal: Number(nominal),
        block_id: blockId,
        keterangan: keterangan.trim()
      }

      let res;
      if (isEditing) {
        res = await fetch(`${BASE_URL}/master_pengeluaran?pengeluaran_id=eq.${oldPengeluaranId}`, {
          method: 'PATCH',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${BASE_URL}/master_pengeluaran`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        alert(isEditing ? 'Data Pengeluaran Berhasil Diperbarui!' : 'Log Pengeluaran Berhasil Disimpan!')
        resetForm()
        fetchDataPengeluaran()
      } else {
        const errData = await res.json()
        alert('Gagal menyimpan transaksi: ' + (errData.message || 'Periksa struktur database.'))
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (p: any) => {
    setIsEditing(true)
    setOldPengeluaranId(p.pengeluaran_id || p.id)
    setPengeluaranId(p.pengeluaran_id || p.id)
    
    let inputTgl = p.tanggal || ''
    if (inputTgl && inputTgl.includes('/')) {
      const [dd, mm, yyyy] = inputTgl.split('/')
      inputTgl = `${yyyy}-${mm}-${dd}`
    }
    setTanggal(inputTgl)
    
    setKategori(p.kategori || '')
    setNominal(p.nominal || '')
    setBlockId(p.block_id || '')
    setKeterangan(p.keterangan || '')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pengeluaran ${id}?`)) return

    try {
      const res = await fetch(`${BASE_URL}/master_pengeluaran?pengeluaran_id=eq.${id}`, {
        method: 'DELETE',
        headers: HEADERS
      })

      if (res.ok) {
        alert('Data Pengeluaran berhasil dihapus!')
        fetchDataPengeluaran()
        if (isEditing && oldPengeluaranId === id) resetForm()
      } else {
        alert('Gagal menghapus data.')
      }
    } catch (err) {
      alert('Error jaringan saat menghapus data.')
    }
  }

  // Jendela Cetak Bukti Pengeluaran Kas (Invoice/Kuitansi)
  const handleCetakInvoice = (p: any) => {
    const danaNominal = Number(p.nominal || 0)
    
    const windowCetak = window.open('', '_blank', 'width=800,height=600')
    if (windowCetak) {
      windowCetak.document.write(`
        <html>
          <head>
            <title>Kuitansi Pengeluaran - ${p.pengeluaran_id || 'Nota'}</title>
            <style>
              body { font-family: 'sans-serif'; color: #333; padding: 40px; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px solid #dc2626; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #dc2626; }
              .title { font-size: 20px; font-weight: bold; text-align: right; }
              .details { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #dc2626; color: white; padding: 10px; text-align: left; }
              td { padding: 12px 10px; border-bottom: 1px solid #ddd; }
              .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; color: #dc2626; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🥑 GK AVOCADO MANAGEMENT</div>
              <div class="title">KUITANSI / BUKTI PENGELUARAN KAS</div>
            </div>
            <div class="details">
              <div><strong>ID Pengeluaran:</strong> ${p.pengeluaran_id || p.id}</div>
              <div><strong>Tanggal Operasional:</strong> ${p.tanggal}</div>
              <div><strong>Alokasi Blok Lahan:</strong> ${dapatkanNamaBlok(p.block_id)} (${p.block_id || '-'})</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Kategori Pengeluaran</th>
                  <th>Keterangan Rinci</th>
                  <th>Total Dana Diambil</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${p.kategori}</strong></td>
                  <td>${p.keterangan || '-'}</td>
                  <td>Rp ${danaNominal.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
            <div class="total">Total Arus Kas Keluar: Rp ${danaNominal.toLocaleString('id-ID')}</div>
            <div class="footer">Bukti Pengeluaran Sah Sistem Manajemen GK Avocado.</div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      windowCetak.document.close()
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setOldPengeluaranId('')
    setPengeluaranId('')
    const hariIni = new Date().toISOString().split('T')[0]
    setTanggal(hariIni)
    setKategori('')
    setNominal('')
    setKeterangan('')
    setBlockId(daftarBlok.length > 0 ? (daftarBlok[0].block_id || daftarBlok[0].id) : '')
  }

  // --- LOGIKA PEMISAHAN DATA ARUS KAS KELUAR PER BLOK LAHAN ---
  const pengeluaranPerBlok: { [key: string]: any[] } = {}
  if (Array.isArray(pengeluarans)) {
    pengeluarans.forEach(p => {
      const idBlok = p.block_id || 'Lain-lain / Tanpa Blok'
      if (!pengeluaranPerBlok[idBlok]) {
        pengeluaranPerBlok[idBlok] = []
      }
      pengeluaranPerBlok[idBlok].push(p)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif' }}>
      
      {/* FORM INPUT / EDIT TRANSAKSI PENGELUARAN */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#dc2626', fontWeight: 'bold' }}>
          {isEditing ? '📝 Edit Catatan Pengeluaran Kas' : '➕ Catat Pengeluaran Baru'}
        </h4>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="ID (Contoh: EXP003)" value={pengeluaranId} onChange={e => setPengeluaranId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }} />
          
          {/* INPUT KATEGORI - BEBAS ISI SENDIRI */}
          <input type="text" placeholder="Belanja Pupuk / Upak dll" value={kategori} onChange={e => setKategori(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '180px' }} />
          
          <input type="number" placeholder="Nominal Dana (Rp)" value={nominal} onChange={e => setNominal(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />

          {/* SINKRONISASI DROPDOWN BLOK LAHAN */}
          <select value={blockId} onChange={e => setBlockId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
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

          {/* INPUT KETERANGAN RINCI - BEBAS ISI SENDIRI */}
          <input type="text" placeholder="Keterangan Rinci" value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '220px' }} />

          <button type="submit" disabled={submitting} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            {isEditing ? 'Perbarui Data' : 'Simpan Pengeluaran Kas'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Batal
            </button>
          )}
        </form>
      </div>

      {/* TAMPILAN RIWAYAT JURNAL PENGELUARAN PER BLOK LAHAN (TEMA MERAH) */}
      <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>📋 Modul 7: Pengeluaran Kas</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>Log Jurnal pengeluaran dana operasional terpisah berdasarkan kelompok blok lahan.</p>
        
        {loading ? (
          <p>Memuat jurnal pengeluaran...</p>
        ) : Object.keys(pengeluaranPerBlok).length === 0 ? (
          <p>Belum ada rekaman data pengeluaran kas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Object.entries(pengeluaranPerBlok).map(([idBlokLahan, listPengeluaran]) => {
              // Menghitung akumulasi dana keluar per grup blok
              const totalPengeluaranBlok = listPengeluaran.reduce((sum, item) => sum + Number(item.nominal || 0), 0)
              const namaBlokTeks = dapatkanNamaBlok(idBlokLahan)

              return (
                <div key={idBlokLahan} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Container Header Kelompok Blok */}
                  <div style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>📍 Area Lahan: {namaBlokTeks} ({idBlokLahan})</span>
                    <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', marginLeft: 'auto' }}>
                      Total Keluar: - Rp {totalPengeluaranBlok.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Panel List Transaksi Card Item Merah */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
                    {listPengeluaran.map((p, i) => {
                      const nominalDana = Number(p.nominal || 0)

                      return (
                        <div key={i} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <strong style={{ color: '#991b1b', fontSize: '16px' }}>{p.kategori}</strong>
                              <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#991b1b' }}>
                                {p.pengeluaran_id || p.id}
                              </span>
                            </div>
                            <span style={{ fontSize: '13px', color: '#7f1d1d' }}>
                              {p.keterangan || '-'} | <span style={{ fontStyle: 'italic', color: '#64748b' }}>Tanggal: {p.tanggal}</span>
                            </span>
                          </div>

                          {/* Tombol Aksi Lengkap */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '18px', marginRight: '10px' }}>
                              - Rp {nominalDana.toLocaleString('id-ID')}
                            </span>
                            <button onClick={() => handleCetakInvoice(p)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                              🖨️ Cetak
                            </button>
                            <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                              📝 Edit
                            </button>
                            <button onClick={() => handleDelete(p.pengeluaran_id || p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                              🗑️ Hapus
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