'use client'

import React, { useEffect, useState } from 'react'

export default function ModulPanen() {
  const [panens, setPanens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- STATE SINKRONISASI DATA MASTER BLOK ---
  const [daftarBlok, setDaftarBlok] = useState<any[]>([]) 

  // State Form
  const [panenId, setPanenId] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [blockId, setBlockId] = useState('')
  const [berat, setBerat] = useState('')
  const [kualitas, setKualitas] = useState('A')
  const [jenis, setJenis] = useState('Pohon Alpukat') 
  const [keterangan, setKeterangan] = useState('Aligator') 
  const [petugas, setPetugas] = useState('') 
  const [submitting, setSubmitting] = useState(false)

  // State mode Edit
  const [isEditing, setIsEditing] = useState(false)
  const [oldPanenId, setOldPanenId] = useState('')

  const BASE_URL = 'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1'
  const HEADERS = {
    'apikey': 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Authorization': 'Bearer sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // 1. Ambil Data Riwayat Panen dari Supabase
  const fetchDataPanen = () => {
    fetch(`${BASE_URL}/master_panen?select=*`, { headers: HEADERS })
      .then(res => res.json())
      .then(data => { 
        setPanens(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Gagal memuat data panen:", err)
        setLoading(false)
      })
  }

  // 2. Mengambil Data Real-time dari Master Blok (Otomatis Terintegrasi jika ada blok baru)
  const fetchMasterBlok = async () => {
    try {
      const resBlok = await fetch(`${BASE_URL}/master_blok?select=*`, { headers: HEADERS })
      const dataBlok = await resBlok.json()
      if (Array.isArray(dataBlok) && dataBlok.length > 0) {
        setDaftarBlok(dataBlok)
        
        // Cari field ID yang digunakan di tabel master_blok Anda (biasanya block_id atau id)
        const awalBlokId = dataBlok[0].block_id || dataBlok[0].id || ''
        setBlockId(awalBlokId) // Otomatis memilih blok pertama agar dropdown tidak kosong
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data master blok:", err)
    }
  }

  useEffect(() => {
    // Set default tanggal input kalender ke hari ini
    const hariIni = new Date().toISOString().split('T')[0]
    setTanggal(hariIni)

    fetchDataPanen()
    fetchMasterBlok() // Memuat data blok langsung dari database
  }, [])

  // Fungsi helper untuk mencari Nama Blok berdasarkan block_id
  const dapatkanNamaBlok = (idBlok: string) => {
    const blokDitemukan = daftarBlok.find(b => (b.block_id === idBlok || b.id === idBlok))
    // Jika di master_blok ada kolom nama_blok gunakan itu, jika tidak ada tampilkan ID-nya saja
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!panenId || !berat || !tanggal || !blockId || !jenis) {
      return alert('ID Panen, Tanggal, Blok Lahan, Jenis Pohon, dan Berat Wajib Diisi!')
    }
    if (!keterangan.trim()) {
      return alert('Keterangan atau Varietas Pohon wajib diisi/dipilih!')
    }
    
    setSubmitting(true)

    let tanggalFormatted = tanggal
    if (tanggal && tanggal.includes('-')) {
      const [yyyy, mm, dd] = tanggal.split('-')
      tanggalFormatted = `${dd}/${mm}/${yyyy}`
    }

    try {
      const payload = { 
        panen_id: panenId, 
        tanggal: tanggalFormatted, 
        block_id: blockId, 
        berat_kg: Number(berat), 
        kualitas,
        jenis, 
        keterangan: keterangan.trim(), 
        petugas: petugas.trim() || null
      }

      let res;
      if (isEditing) {
        res = await fetch(`${BASE_URL}/master_panen?panen_id=eq.${oldPanenId}`, {
          method: 'PATCH',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${BASE_URL}/master_panen`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        alert(isEditing ? 'Data Panen Berhasil Diperbarui!' : 'Produksi Panen Berhasil Dicatat!')
        resetForm()
        fetchDataPanen()
      } else {
        const errData = await res.json()
        alert('Gagal menyimpan ke Supabase: ' + (errData.message || 'Periksa kesesuaian kolom.'))
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (p: any) => {
    setIsEditing(true)
    setOldPanenId(p.panen_id)
    setPanenId(p.panen_id)
    
    let inputTgl = p.tanggal || ''
    if (inputTgl && inputTgl.includes('/')) {
      const [dd, mm, yyyy] = inputTgl.split('/')
      inputTgl = `${yyyy}-${mm}-${dd}`
    }
    setTanggal(inputTgl)
    
    setBlockId(p.block_id || '')
    setBerat(p.berat_kg || '')
    setKualitas(p.kualitas || 'A')
    setJenis(p.jenis || 'Pohon Alpukat')
    setKeterangan(p.keterangan || '')
    setPetugas(p.petugas || '')
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data panen ${id}?`)) return

    try {
      const res = await fetch(`${BASE_URL}/master_panen?panen_id=eq.${id}`, {
        method: 'DELETE',
        headers: HEADERS
      })

      if (res.ok) {
        alert('Data berhasil dihapus!')
        fetchDataPanen()
        if (isEditing && oldPanenId === id) resetForm()
      } else {
        alert('Gagal menghapus data.')
      }
    } catch (err) {
      alert('Error saat menghapus data.')
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setOldPanenId('')
    setPanenId('')
    const hariIni = new Date().toISOString().split('T')[0]
    setTanggal(hariIni)
    setBlockId(daftarBlok.length > 0 ? (daftarBlok[0].block_id || daftarBlok[0].id) : '')
    setBerat('')
    setKualitas('A')
    setJenis('Pohon Alpukat')
    setKeterangan('Aligator')
    setPetugas('')
  }

  // --- LOGIKA HITUNG BERAT TOTAL KOTAK DASHBOARD ---
  let totalAlpukat = 0
  const kelompokLainnya: { [key: string]: number } = {}

  if (Array.isArray(panens)) {
    panens.forEach(p => {
      const beratItem = Number(p.berat_kg) || 0
      const jenisItem = p.jenis || 'Pohon Alpukat'
      const ketItem = p.keterangan || ''

      if (jenisItem === 'Pohon Alpukat') {
        totalAlpukat += beratItem
      } else {
        const keyNormalized = ketItem.trim() || 'Lainnya'
        kelompokLainnya[keyNormalized] = (kelompokLainnya[keyNormalized] || 0) + beratItem
      }
    })
  }

  // --- LOGIKA PEMISAHAN DATA RIWAYAT PER BLOK LAHAN ---
  const panenPerBlok: { [key: string]: any[] } = {}
  if (Array.isArray(panens)) {
    panens.forEach(p => {
      const idBlok = p.block_id || 'Tanpa Blok'
      if (!panenPerBlok[idBlok]) {
        panenPerBlok[idBlok] = []
      }
      panenPerBlok[idBlok].push(p)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif' }}>
      
      {/* FORM INPUT / EDIT */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#1b4332', fontWeight: 'bold' }}>
          {isEditing ? '📝 Edit Timbangan Produksi Hasil Panen' : '➕ Input Timbangan Produksi Hasil Panen'}
        </h4>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="ID Panen" value={panenId} onChange={e => setPanenId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }} />
          
          {/* Dropdown Blok Lahan (Real-time Terintegrasi API database master_blok) */}
          <select value={blockId} onChange={e => setBlockId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
            {daftarBlok.length === 0 ? (
              <option value="">Memuat Blok...</option>
            ) : (
              daftarBlok.map((blok, index) => {
                const idBlok = blok.block_id || blok.id;
                const namaBlok = blok.nama_blok || idBlok; // Menampilkan Nama Blok yang ramah dibaca
                return <option key={index} value={idBlok}>{namaBlok}</option>
              })
            )}
          </select>

          <input type="number" placeholder="Berat Bersih (Kg)" value={berat} onChange={e => setBerat(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input type="text" placeholder="Nama Petugas / Tim" value={petugas} onChange={e => setPetugas(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />

          <select value={jenis} onChange={handleJenisChange} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
            <option value="Pohon Alpukat">Pohon Alpukat</option>
            <option value="Pohon Lainnya">Pohon Lainnya</option>
          </select>

          {/* Kondisional Keterangan Varietas */}
          {jenis === 'Pohon Alpukat' ? (
            <select value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
              <option value="Aligator">Aligator</option>
              <option value="Muria">Muria</option>
              <option value="Has">Has</option>
              <option value="Mentega">Mentega</option>
            </select>
          ) : (
            <input type="text" placeholder="Ketik nama pohon lainnya (cth: Semangka)" value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }} />
          )}

          <select value={kualitas} onChange={e => setKualitas(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="A">Grade A Super</option>
            <option value="B">Grade B Ekspor</option>
            <option value="C">Grade C Lokal</option>
          </select>

          <button type="submit" disabled={submitting} style={{ backgroundColor: '#1b4332', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            {isEditing ? 'Perbarui' : 'Simpan'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Batal
            </button>
          )}
        </form>
      </div>

      {/* DASHBOARD BOX */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '14px', color: '#166534', fontWeight: '600' }}>🥑 Total Panen Pohon Alpukat</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#14532d' }}>{totalAlpukat.toLocaleString('id-ID')} Kg</h2>
        </div>
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '14px', color: '#92400e', fontWeight: '600' }}>🌳 Total Panen Pohon Lainnya (Detail)</span>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.keys(kelompokLainnya).length === 0 ? (
              <span style={{ fontSize: '13px', color: '#78350f', fontStyle: 'italic' }}>Belum ada data pohon lainnya</span>
            ) : (
              Object.entries(kelompokLainnya).map(([ket, total], index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#78350f', borderBottom: '1px dashed #fcd34d', paddingBottom: '2px' }}>
                  <span>• <strong>{ket}</strong></span>
                  <strong>{total.toLocaleString('id-ID')} Kg</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* TABEL DATA YANG SUDAH DIPISAH PER BLOK LAHAN */}
      <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>🧺 Riwayat Tonase Panen (Dipisah Per Blok Lahan)</h3>
        {loading ? (
          <p>Memuat data dari database...</p>
        ) : Object.keys(panenPerBlok).length === 0 ? (
          <p>Belum ada riwayat data panen.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Object.entries(panenPerBlok).map(([idBlokLahan, listPanen]) => {
              const subTotalBerat = listPanen.reduce((sum, item) => sum + (Number(item.berat_kg) || 0), 0)
              const namaBlokTeks = dapatkanNamaBlok(idBlokLahan) // Konversi kode ID ke nama asli blok

              return (
                <div key={idBlokLahan} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Header Judul Card Per Blok */}
                  <div style={{ backgroundColor: '#1b4332', color: '#ffffff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>📍 {namaBlokTeks} ({idBlokLahan})</span>
                    <span style={{ backgroundColor: '#ffffff', color: '#1b4332', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                      Sub-total: {subTotalBerat.toLocaleString('id-ID')} Kg
                    </span>
                  </div>

                  {/* Tabel Riwayat */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '12px' }}>ID Panen</th>
                          <th style={{ padding: '12px' }}>Tanggal</th>
                          <th style={{ padding: '12px' }}>Petugas</th>
                          <th style={{ padding: '12px' }}>Jenis</th>
                          <th style={{ padding: '12px' }}>Varietas / Keterangan</th>
                          <th style={{ padding: '12px' }}>Berat Bersih</th>
                          <th style={{ padding: '12px' }}>Kualitas Gred</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listPanen.map((p, i) => {
                          const itemJenis = p.jenis || 'Pohon Alpukat'
                          const itemKet = p.keterangan || '-'
                          const itemPetugas = p.petugas || '-'
                          
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isEditing && oldPanenId === p.panen_id ? '#f0fdf4' : 'transparent' }}>
                              <td style={{ padding: '12px', fontWeight: '700' }}>{p.panen_id}</td>
                              <td style={{ padding: '12px' }}>{p.tanggal}</td>
                              <td style={{ padding: '12px' }}>{itemPetugas}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ 
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  fontSize: '12px',
                                  backgroundColor: itemJenis === 'Pohon Alpukat' ? '#e0f2fe' : '#fef3c7',
                                  color: itemJenis === 'Pohon Alpukat' ? '#0369a1' : '#b45309'
                                }}>
                                  {itemJenis}
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontWeight: '500' }}>{itemKet}</td>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#16a34a' }}>{(p.berat_kg || 0).toLocaleString('id-ID')} Kg</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                                  Grade {p.kualitas}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 'bold', marginRight: '12px' }}>
                                  📝 Edit
                                </button>
                                <button onClick={() => handleDelete(p.panen_id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>
                                  🗑️ Hapus
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
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