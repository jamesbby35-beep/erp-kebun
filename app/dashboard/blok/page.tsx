'use client'

import React, { useEffect, useState } from 'react'

export default function ModulBlokLahan() {
  // 1. State Form Input Blok Baru
  const [blockId, setBlockId] = useState('')
  const [namaBlok, setNamaBlok] = useState('')
  const [kapasitas, setKapasitas] = useState('')
  const [luas, setLuas] = useState('')
  const [lokasiState, setLokasiState] = useState('')

  // 2. State Data Utama (Blok & Pohon)
  const [listBlok, setListBlok] = useState<any[]>([])
  const [listPohon, setListPohon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 3. State Inline-Editing Semua Kolom
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [editNamaBlok, setEditNamaBlok] = useState('')
  const [editKapasitas, setEditKapasitas] = useState('')
  const [editLuas, setEditLuas] = useState('')
  const [editLokasi, setEditLokasi] = useState('')

  const headers = {
    'apikey': 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Authorization': 'Bearer sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // Ambil Data Sesuai Struktur Kolom Supabase
  const fetchDataBlokDanPohon = () => {
    setLoading(true)
    Promise.all([
      fetch('https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_blok?select=*', { headers }).then(res => res.json()),
      fetch('https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_pohon?select=*', { headers }).then(res => res.json())
    ])
    .then(([blokData, pohonData]) => {
      if (Array.isArray(blokData)) setListBlok(blokData)
      if (Array.isArray(pohonData)) setListPohon(pohonData)
    })
    .catch(err => {
      console.error("Gagal memuat data relasi lahan:", err)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchDataBlokDanPohon()
  }, [])

  // Aksi 1: Tambah Pemetaan Blok Lahan Baru (Menyesuaikan tabel Supabase)
  const handleTambahBlok = (e: React.FormEvent) => {
    e.preventDefault()
    if (!blockId || !namaBlok || !kapasitas || !luas) {
      alert('Mohon lengkapi data ID Blok, Nama Sektor, Kapasitas, dan Luas Area!')
      return
    }

    setSubmitting(true)
    const payload = {
      block_id: blockId,
      nama_blok: namaBlok,
      jumlah_pohon: parseInt(kapasitas) || 0, // disesuaikan kolom jumlah_pohon
      luas_m2: parseInt(luas) || 0,           // disesuaikan kolom luas_m2
      lokasi: lokasiState                     // disesuaikan kolom lokasi
    }

    fetch('https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_blok', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error()
      return res.json()
    })
    .then(() => {
      alert('🎉 Sukses memetakan sektor blok lahan baru!')
      setBlockId('')
      setNamaBlok('')
      setKapasitas('')
      setLuas('')
      setLokasiState('')
      fetchDataBlokDanPohon()
    })
    .catch(() => alert('Gagal menyimpan blok baru. Pastikan ID Blok belum digunakan.'))
    .finally(() => setSubmitting(false))
  }

  // Aksi 2: Simpan Pembaruan Edit Semua Kolom Blok Lahan
  const handleSimpanPembaruanBlok = (targetId: string) => {
    if (!editNamaBlok.trim() || !editKapasitas || !editLuas) {
      alert('Nama Sektor, Kapasitas, dan Luas Area tidak boleh kosong!')
      return
    }

    fetch(`https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_blok?block_id=eq.${encodeURIComponent(targetId)}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({
        nama_blok: editNamaBlok,
        jumlah_pohon: parseInt(editKapasitas) || 0,
        luas_m2: parseInt(editLuas) || 0,
        lokasi: editLokasi
      })
    })
    .then(res => {
      if (!res.ok) throw new Error()
      alert('⚡ Sukses memperbarui data seluruh kolom blok lahan!');
      setEditingBlockId(null)
      fetchDataBlokDanPohon()
    })
    .catch(() => {
      alert('Gagal memperbarui data blok.')
    })
  }

  // Aksi 3: Hapus Blok Lahan
  const handleHapusBlokLahan = (targetId: string) => {
    const totalPohonTerkait = listPohon.filter(p => (p.block_id || p.Block_id) === targetId).length

    if (totalPohonTerkait > 0) {
      alert(`⚠️ Gagal menghapus! Blok [${targetId}] masih memiliki ${totalPohonTerkait} pohon terikat di tabel sensus.`);
      return
    }

    const konfirmasi = confirm(`Apakah Anda yakin ingin MENGHAPUS Blok [${targetId}]?`);
    if (!konfirmasi) return

    fetch(`https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_blok?block_id=eq.${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
      headers: headers
    })
    .then(res => {
      if (!res.ok) throw new Error()
      alert(`🗑️ Blok [${targetId}] berhasil dihapus.`);
      fetchDataBlokDanPohon()
    })
    .catch(() => {
      alert('Gagal menghapus data blok.')
    })
  }

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', padding: '20px', boxSizing: 'border-box', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* FORM INPUT TAMBAH BLOK */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#0f172a' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>➕</span>
          <h2 style={{ margin: '0', fontSize: '16px', fontWeight: '700' }}>Tambah Pemetaan Blok Baru</h2>
        </div>

        <form onSubmit={handleTambahBlok} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <input type="text" placeholder="ID Blok (Contoh: BLK04)" value={blockId} onChange={e => setBlockId(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            <input type="text" placeholder="Nama Sektor Blok" value={namaBlok} onChange={e => setNamaBlok(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            <input type="number" placeholder="Kapasitas/Jumlah Pohon" value={kapasitas} onChange={e => setKapasitas(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            <input type="number" placeholder="Luas Area (m2)" value={luas} onChange={e => setLuas(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Keterangan Geografis Lokasi" value={lokasiState} onChange={e => setLokasiState(e.target.value)} style={{ flex: 1, minWidth: '260px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            <button type="submit" disabled={submitting} style={{ padding: '12px 32px', backgroundColor: '#133e2b', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              {submitting ? 'Memproses...' : 'Petakan Blok'}
            </button>
          </div>
        </form>
      </div>

      {/* VIEW DATA KLUSTER SEKTOR LAHAN */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#0f172a' }}>
          <span style={{ fontSize: '18px' }}>🗺️</span>
          <h2 style={{ margin: '0', fontSize: '16px', fontWeight: '700' }}>Kluster Sektor Lahan</h2>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', padding: '20px 0' }}>Sinkronisasi kolom Supabase...</div>
        ) : listBlok.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '20px 0' }}>Belum ada data blok lahan terdaftar.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(48%, 1fr))', gap: '20px' }}>
            {listBlok.map((blok, index) => {
              const currentIdBlok = blok.block_id || '';
              const currentNamaBlok = blok.nama_blok || '';
              
              // 🔍 MEMBACA FIX KOLOM SESUAI DATABASE SUPABASE ANDA
              const currentKapasitas = blok.jumlah_pohon !== undefined ? blok.jumlah_pohon : 0;
              const currentLuas = blok.luas_m2 !== undefined ? blok.luas_m2 : 0;
              const currentLokasi = blok.lokasi || '';

              // Filter Sensus Tanaman
              const semuaPohonDiBlok = listPohon.filter(p => (p.block_id || p.Block_id) === currentIdBlok)
              const totalAlpukat = semuaPohonDiBlok.filter(p => (p.jenis || p.Jenis) === 'Pohon Alpukat').length
              const listPohonLainnya = semuaPohonDiBlok.filter(p => (p.jenis || p.Jenis) === 'Pohon Lainnya')

              const breakdownPohonLainnya: { [key: string]: number } = {}
              listPohonLainnya.forEach(p => {
                const namaVarietas = (p.keterangan || p.Keterangan || 'Tanpa Nama').trim()
                breakdownPohonLainnya[namaVarietas] = (breakdownPohonLainnya[namaVarietas] || 0) + 1
              })

              const isEditing = editingBlockId === currentIdBlok

              return (
                <div key={index} style={{ backgroundColor: isEditing ? '#f8fafc' : '#ffffff', border: isEditing ? '2px dashed #133e2b' : '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isEditing ? '10px' : '4px' }}>
                      
                      {isEditing ? (
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>NAMA SEKTOR BLOK</label>
                          <input type="text" value={editNamaBlok} onChange={e => setEditNamaBlok(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', outline: 'none' }} />
                        </div>
                      ) : (
                        <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                          {currentIdBlok} - {currentNamaBlok}
                        </h3>
                      )}

                      {isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>KAPASITAS (POHON)</label>
                            <input type="number" value={editKapasitas} onChange={e => setEditKapasitas(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>LUAS (M²)</label>
                            <input type="number" value={editLuas} onChange={e => setEditLuas(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>GEOGRAFIS LOKASI</label>
                            <input type="text" value={editLokasi} onChange={e => setEditLokasi(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                          Kapasitas: {currentKapasitas} Pohon | Luas: {currentLuas} m² | Lokasi: {currentLokasi || '-'}
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', backgroundColor: '#e8f5e9', padding: '5px 12px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        {semuaPohonDiBlok.length} Batang Hidup
                      </span>
                    )}
                  </div>

                  {/* BREAKDOWN JENIS POHON */}
                  {!isEditing && (
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                        <span>🥑 Kategori Utama (Alpukat):</span>
                        <strong style={{ color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{totalAlpukat} Batang</strong>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <div>
                          <span>🌱 Kategori Pendukung ({listPohonLainnya.length} Batang):</span>
                        </div>
                        {listPohonLainnya.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada komoditas pendukung di blok ini.</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Object.entries(breakdownPohonLainnya).map(([namaTanaman, jumlah]) => (
                              <span key={namaTanaman} style={{ fontSize: '11px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', color: '#1e293b', fontWeight: '700' }}>
                                {namaTanaman}: {jumlah} btg
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BUTTON ACTION */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSimpanPembaruanBlok(currentIdBlok)} style={{ padding: '6px 14px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          💾 Simpan Perubahan
                        </button>
                        <button onClick={() => setEditingBlockId(null)} style={{ padding: '6px 14px', backgroundColor: '#64748b', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingBlockId(currentIdBlok); setEditNamaBlok(currentNamaBlok); setEditKapasitas(String(currentKapasitas)); setEditLuas(String(currentLuas)); setEditLokasi(currentLokasi); }} style={{ padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                          ✏️ Edit Semua Kolom
                        </button>
                        <button onClick={() => handleHapusBlokLahan(currentIdBlok)} style={{ padding: '6px 12px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#e11d48', cursor: 'pointer' }}>
                          🗑️ Hapus Blok
                        </button>
                      </>
                    )}
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