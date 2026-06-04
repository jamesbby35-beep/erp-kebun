'use client'

import React, { useEffect, useState } from 'react'

export default function SensusPohonPremium() {
  // 1. State Form Input Registrasi
  const [treeId, setTreeId] = useState('')
  const [blockId, setBlockId] = useState('')
  const [tanggalTanam, setTanggalTanam] = useState('')
  const [status, setStatus] = useState('Hidup')
  const [jenis, setJenis] = useState('Pohon Alpukat')
  const [keterangan, setKeterangan] = useState('Aligator')

  // 2. State Pencarian & Filter Tabel
  const [searchTerm, setSearchTerm] = useState('')
  const [filterJenis, setFilterJenis] = useState('Semua')

  // 3. State Data Utama & Interface
  const [listPohon, setListPohon] = useState<any[]>([])
  const [listBlok, setListBlok] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // State khusus inline-editing
  const [editingTreeId, setEditingTreeId] = useState<string | null>(null)
  const [treeIdEditValue, setTreeIdEditValue] = useState('')
  const [statusEditValue, setStatusEditValue] = useState('')

  const headers = {
    'apikey': 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Authorization': 'Bearer sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  // Ambil Data Sensus & Blok dari Supabase
  const fetchAllData = () => {
    setLoading(true)
    Promise.all([
      fetch('https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_pohon?select=*', { headers }).then(res => res.json()),
      fetch('https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_blok?select=*', { headers }).then(res => res.json())
    ])
    .then(([pohonData, blokData]) => {
      if (Array.isArray(pohonData)) setListPohon(pohonData)
      if (Array.isArray(blokData)) {
        setListBlok(blokData)
        if (blokData.length > 0 && !blockId) {
          const firstBlokId = blokData[0].block_id || blokData[0].id_blok || blokData[0].id || '';
          setBlockId(firstBlokId)
        }
      }
    })
    .catch(err => {
      console.error("Gagal sinkronisasi data:", err)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleJenisChange = (val: string) => {
    setJenis(val)
    if (val === 'Pohon Alpukat') {
      setKeterangan('Aligator')
    } else {
      setKeterangan('Petai')
    }
  }

  // Aksi Menyimpan Registrasi Pohon Baru
  const handleSimpanTanaman = (e: React.FormEvent) => {
    e.preventDefault()
    if (!treeId || !blockId || !tanggalTanam || !keterangan) {
      alert('Mohon lengkapi seluruh field sebelum menyimpan data!')
      return
    }

    setSubmitting(true)
    const payload = { tree_id: treeId, block_id: blockId, tanggal_tanam: tanggalTanam, status, jenis, keterangan }

    fetch('https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_pohon', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error()
      return res.json()
    })
    .then(() => {
      alert('🎉 Registrasi tanaman baru berhasil disimpan!')
      setTreeId('')
      setTanggalTanam('')
      handleJenisChange('Pohon Alpukat')
      fetchAllData()
    })
    .catch(() => alert('Gagal menyimpan. Periksa apakah TREE ID sudah digunakan.'))
    .finally(() => setSubmitting(false))
  }

  // Aksi Update Status + Edit Tree ID Baru 
  const handleUpdateStatusAndId = () => {
    if (!editingTreeId) {
      alert('⚠️ Gagal memproses: ID Pohon lama tidak terdeteksi.');
      return;
    }

    if (!treeIdEditValue.trim()) {
      alert('⚠️ Tree ID baru tidak boleh kosong!');
      return;
    }

    fetch(`https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_pohon?tree_id=eq.${encodeURIComponent(editingTreeId)}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ 
        tree_id: treeIdEditValue, 
        status: statusEditValue    
      })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Respon server bermasalah.')
      }
      return res.json()
    })
    .then(() => {
      alert(`⚡ Sukses memperbarui data pohon!`)
      setEditingTreeId(null)
      fetchAllData()
    })
    .catch((err) => {
      alert(`Gagal memperbarui: ${err.message}. Pastikan Tree ID baru belum digunakan pohon lain.`)
    })
  }

  // Aksi Hapus Data Pohon
  const handleHapusPohon = (itemData: any) => {
    const targetTreeId = itemData.tree_id || itemData.Tree_id || itemData.id;

    if (!targetTreeId) {
      alert('⚠️ Gagal memproses: ID Pohon tidak valid.');
      return;
    }

    const konfirmasi = confirm(`Apakah Anda yakin ingin MENGHAPUS pohon dengan ID [${targetTreeId}]?\n\nData yang dihapus tidak bisa dikembalikan.`);
    if (!konfirmasi) return;

    fetch(`https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1/master_pohon?tree_id=eq.${encodeURIComponent(targetTreeId)}`, {
      method: 'DELETE',
      headers: headers
    })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Gagal menghapus dari database.')
      }
      alert(`🗑️ Sukses! Data pohon [${targetTreeId}] telah dihapus.`);
      fetchAllData();
    })
    .catch((err) => {
      alert(`Gagal menghapus pohon: ${err.message}`);
    });
  }

  // --- LOGIKA PERHITUNGAN BARU (KETERANGAN TETAP ADA & STATUS DISATUKAN) ---
  const totalAlpukat = listPohon.filter(p => (p.jenis || p.Jenis) === 'Pohon Alpukat').length
  const totalLainnya = listPohon.filter(p => (p.jenis || p.Jenis) === 'Pohon Lainnya').length

  // Hitung status kondisi pohon
  const pohonSehat = listPohon.filter(p => {
    const s = (p.status || p.Status || '').toLowerCase();
    return s === 'hidup' || s === 'produktif';
  }).length

  const pohonSakitMati = listPohon.filter(p => {
    const s = (p.status || p.Status || '').toLowerCase();
    return s === 'mati' || s === 'sakit';
  }).length

  // Breakdown varietas Pohon Lainnya (Tidak Hilang)
  const breakdownLainnya: { [key: string]: number } = {}
  listPohon.forEach(p => {
    const currentJenis = p.jenis || p.Jenis;
    const currentKeterangan = p.keterangan || p.Keterangan;
    if (currentJenis === 'Pohon Lainnya' && currentKeterangan) {
      const namaPohon = currentKeterangan.trim()
      breakdownLainnya[namaPohon] = (breakdownLainnya[namaPohon] || 0) + 1
    }
  })

  const filteredData = listPohon.filter(item => {
    const currentTreeId = item.tree_id || item.Tree_id || '';
    const currentBlockId = item.block_id || item.Block_id || '';
    const currentKeterangan = item.keterangan || item.Keterangan || '';
    const currentJenis = item.jenis || item.Jenis || 'Pohon Alpukat';

    const matchSearch = currentTreeId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        currentBlockId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        currentKeterangan.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterJenis === 'Semua') return matchSearch
    return currentJenis === filterJenis && matchSearch
  })

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', padding: '16px', boxSizing: 'border-box' }}>
      
      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Modul 1: Sensus & Inventaris Komoditas</h1>
          <p style={{ margin: '0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Sistem pemantauan riwayat pertumbuhan tanaman utama dan tanaman pendukung ekosistem.</p>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#2e7d32', borderRadius: '50%', display: 'inline-block' }}></span> Live Database Connected
        </div>
      </div>

      {/* METRIKS RINGKASAN DATA (SUDAH DISATUKAN MENJADI 3 CARD SAJA) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        
        {/* Card 1: Kuantitas Jenis Pohon */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🥑</div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Pohon Alpukat</span>
              <h3 style={{ margin: '0', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{totalAlpukat} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>Batang</span></h3>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🌱</div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Pohon Lainnya</span>
              <h3 style={{ margin: '0', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{totalLainnya} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>Batang</span></h3>
            </div>
          </div>
        </div>

        {/* 🔥 Card 2: Perhitungan Kondisi Status (Disatukan ke Dalam 1 Border) */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Analisis Kondisi Tanaman</span>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '10px 14px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#16a34a', fontSize: '16px' }}>🟢</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>Sehat / Produktif</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#14532d' }}>{pohonSehat} <span style={{ fontSize: '12px', fontWeight: '500' }}>Btg</span></span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff1f2', padding: '10px 14px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#e11d48', fontSize: '16px' }}>🔴</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#e11d48' }}>Sakit / Mati</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#4c0519' }}>{pohonSakitMati} <span style={{ fontSize: '12px', fontWeight: '500' }}>Btg</span></span>
          </div>
        </div>

        {/* Card 3: Rincian Keterangan Pohon Lainnya (Tetap Ada, Tidak Dihilangkan) */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', flexGrow: 2 }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rincian Varietas Pendukung</span>
          {Object.keys(breakdownLainnya).length === 0 ? (
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada tanaman pendukung ekosistem terdaftar.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '100px', overflowY: 'auto' }}>
              {Object.entries(breakdownLainnya).map(([nama, jumlah]) => (
                <div key={nama} style={{ padding: '6px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>{nama}:</span>
                  <span style={{ fontWeight: '800', color: '#0f172a' }}>{jumlah} Btg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FORM REGISTRASI POHON BARU */}
      <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <span style={{ fontSize: '20px' }}>➕</span>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Registrasi Pohon & Komoditas Baru</h2>
        </div>
        
        <form onSubmit={handleSimpanTanaman} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>TREE ID</label>
            <input type="text" placeholder="Contoh: TR0012" value={treeId} onChange={e => setTreeId(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>BLOCK ID (DATA LAHAN)</label>
            <select value={blockId} onChange={e => setBlockId(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', boxSizing: 'border-box', cursor: 'pointer', outline: 'none' }}>
              {listBlok.length === 0 ? (
                <option value="">-- Tidak ada Blok Tersedia --</option>
              ) : (
                listBlok.map((blok, i) => {
                  const valBlok = blok.block_id || blok.id_blok || blok.id;
                  const namaBlok = blok.nama_blok || blok.nama || valBlok;
                  return <option key={i} value={valBlok}>📍 {namaBlok}</option>
                })
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>JENIS UTAMA</label>
            <select value={jenis} onChange={e => handleJenisChange(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', boxSizing: 'border-box', outline: 'none' }}>
              <option value="Pohon Alpukat">🥑 Pohon Alpukat</option>
              <option value="Pohon Lainnya">🌱 Pohon Lainnya</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>KETERANGAN VARIETAS</label>
            {jenis === 'Pohon Alpukat' ? (
              <select value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', boxSizing: 'border-box', outline: 'none' }}>
                <option value="Aligator">Aligator</option>
                <option value="Muria">Muria</option>
                <option value="Has">Has</option>
                <option value="Mentega">Mentega</option>
              </select>
            ) : (
              <input type="text" placeholder="Misal: Petai, Sengon, Jeruk" value={keterangan} onChange={e => setKeterangan(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>TANGGAL TANAM</label>
            <input type="date" value={tanggalTanam} onChange={e => setTanggalTanam(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>STATUS KONDISI AWAL</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', boxSizing: 'border-box', outline: 'none' }}>
              <option value="Hidup">Hidup</option>
              <option value="Mati">Mati</option>
              <option value="Sakit">Sakit</option>
              <option value="Produktif">Produktif</option>
            </select>
          </div>

          <button type="submit" disabled={submitting} style={{ padding: '13px 20px', backgroundColor: '#0b251a', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', width: '100%', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(11, 37, 26, 0.15)' }}>
            {submitting ? 'Memproses...' : 'Simpan ke Database'}
          </button>
        </form>
      </div>

      {/* FILTER, PENCARIAN & DATA TABEL */}
      <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Tabel Inventaris & Sensus Lahan</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', outline: 'none' }}>
              <option value="Semua">Semua Kategori Tanaman</option>
              <option value="Pohon Alpukat">Khusus Pohon Alpukat</option>
              <option value="Pohon Lainnya">Khusus Pohon Lainnya</option>
            </select>
            <input type="text" placeholder="Cari ID, Lahan Blok, atau Varietas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: '280px', outline: 'none' }} />
          </div>
        </div>

        {/* TABEL INVENTARIS */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '16px 20px', fontWeight: '700' }}>TREE ID</th>
                <th style={{ padding: '16px 20px', fontWeight: '700' }}>BLOCK ID</th>
                <th style={{ padding: '16px 20px', fontWeight: '700' }}>KATEGORI KOMODITAS</th>
                <th style={{ padding: '16px 20px', fontWeight: '700' }}>NAMA VARIETAS</th>
                <th style={{ padding: '16px 20px', fontWeight: '700' }}>TANGGAL TANAM</th>
                <th style={{ padding: '16px 20px', fontWeight: '700' }}>STATUS KONDISI</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>Menghubungkan & menyelaraskan data sensus...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>Tidak ada data pohon yang sesuai dengan kriteria pencarian.</td></tr>
              ) : (
                filteredData.map((item, idx) => {
                  const currentTreeId = item.tree_id || item.Tree_id || item.id;
                  const currentBlockId = item.block_id || item.Block_id || '-';
                  const currentJenis = item.jenis || item.Jenis || 'Pohon Alpukat';
                  const currentKeterangan = item.keterangan || item.Keterangan || '-';
                  const currentTanggal = item.tanggal_tanam || item.Tanggal_tanam || '-';
                  const currentStatus = item.status || item.Status || 'Hidup';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155', backgroundColor: editingTreeId === currentTreeId ? '#f8fafc' : 'transparent' }}>
                      
                      {/* EDITABLE TREE ID */}
                      <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f172a' }}>
                        {editingTreeId === currentTreeId ? (
                          <input 
                            type="text" 
                            value={treeIdEditValue} 
                            onChange={e => setTreeIdEditValue(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', width: '110px', outline: 'none' }}
                          />
                        ) : (
                          currentTreeId
                        )}
                      </td>

                      <td style={{ padding: '18px 20px', color: '#475569', fontWeight: '500' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>{currentBlockId}</span>
                      </td>
                      <td style={{ padding: '18px 20px' }}>
                        <span style={{ padding: '5px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700', backgroundColor: currentJenis === 'Pohon Alpukat' ? '#e8f5e9' : '#e3f2fd', color: currentJenis === 'Pohon Alpukat' ? '#2e7d32' : '#1565c0' }}>
                          {currentJenis}
                        </span>
                      </td>
                      <td style={{ padding: '18px 20px', fontWeight: '700', color: '#0f172a' }}>{currentKeterangan}</td>
                      <td style={{ padding: '18px 20px', color: '#64748b' }}>{currentTanggal}</td>
                      
                      {/* EDITABLE STATUS KONDISI */}
                      <td style={{ padding: '18px 20px' }}>
                        {editingTreeId === currentTreeId ? (
                          <select value={statusEditValue} onChange={e => setStatusEditValue(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' }}>
                            <option value="Hidup">Hidup</option>
                            <option value="Mati">Mati</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Produktif">Produktif</option>
                          </select>
                        ) : (
                          <span style={{ 
                            padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '800', display: 'inline-block',
                            backgroundColor: currentStatus === 'Produktif' ? '#e8f5e9' : currentStatus === 'Hidup' ? '#f1f8e9' : currentStatus === 'Sakit' ? '#fff8e1' : '#ffebee',
                            color: currentStatus === 'Produktif' ? '#2e7d32' : currentStatus === 'Hidup' ? '#33691e' : currentStatus === 'Sakit' ? '#f57f17' : '#c62828',
                          }}>
                            ● {currentStatus}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                        {editingTreeId === currentTreeId ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={handleUpdateStatusAndId} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Simpan</button>
                            <button onClick={() => setEditingTreeId(null)} style={{ padding: '6px 12px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Batal</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => { 
                              setEditingTreeId(currentTreeId); 
                              setTreeIdEditValue(currentTreeId); 
                              setStatusEditValue(currentStatus); 
                            }} style={{ padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                              ✏️ Edit Data
                            </button>
                            <button onClick={() => handleHapusPohon(item)} style={{ padding: '6px 12px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#e11d48' }}>
                              🗑️ Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}