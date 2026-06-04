"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Client Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uuryuuxyfevhuwiaufvr.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface MasterBlok {
  block_id: string;
  nama_blok?: string;
}

interface Investor {
  id: string;
  nama: string;
  percent_saham?: number; // handle opsional database jika typo kolom
  persen_saham: number;
  modal: number;
  block_id: string;
}

export default function ManajemenSahamSektorBlockPage() {
  // 1. STATE INTEGRASI DATABASE MASTER LAHAN & INVESTOR
  const [availableBlocks, setAvailableBlocks] = useState<MasterBlok[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>(''); 
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState<boolean>(true);
  const [loadingInvestors, setLoadingInvestors] = useState<boolean>(false);

  // 2. STATE INPUT DATA FINANSIAL MANUAL
  const [inputAlpukat, setInputAlpukat] = useState({
    omset: 100000000,         
    pengeluaran: 15000000,    
    risetDeviden: 5000000,    
  });

  const [inputLainnya, setInputLainnya] = useState({
    omset: 50000000,
    pengeluaran: 8000000,
    risetDeviden: 2000000,
  });

  const [detailAlpukat, setDetailAlpukat] = useState("Muria: Rp 70jt, Hass: Rp 30jt");
  const [detailLainnya, setDetailLainnya] = useState("Semangka: Rp 30jt, Jeruk: Rp 20jt");

  // 3. STATE FORM INPUT INVESTOR BARU
  const [newInvestor, setNewInvestor] = useState({
    nama: '',
    persen_saham: 0,
    modal: 0,
  });
  const [metodeKurangSaham, setMetodeKurangSaham] = useState<'kurang_rata' | 'kurang_spesifik'>('kurang_rata');
  const [investorTargetDipotong, setInvestorTargetDipotong] = useState<string>('');

  // 4. STATE KLAUSUL PENGHAPUSAN INVESTOR
  const [klausulHapus, setKlausulHapus] = useState<'bagi_rata' | 'alihkan_pilihan'>('bagi_rata');
  const [investorPilihanDest, setInvestorPilihanDest] = useState<string>('');

  // ==========================================
  // A. FETCH DINAMIS DAFTAR BLOK DARI MASTER_BLOK
  // ==========================================
  useEffect(() => {
    async function loadMasterBlok() {
      try {
        setLoadingBlocks(true);
        const { data, error } = await supabase
          .from('master_blok')
          .select('block_id');

        if (error) throw error;

        if (data && data.length > 0) {
          setAvailableBlocks(data);
          setSelectedBlock(data[0].block_id); 
        }
      } catch (err: any) {
        console.error("Gagal mengambil master_blok lahan:", err.message);
      } finally {
        setLoadingBlocks(false);
      }
    }
    loadMasterBlok();
  }, []);

  // ==========================================
  // B. FETCH INVESTOR SESUAI LAHAN/BLOK AKTIF
  // ==========================================
  const fetchInvestorsByBlock = useCallback(async (block: string) => {
    if (!block) return;
    setLoadingInvestors(true);
    try {
      const { data, error } = await supabase
        .from('master_investor')
        .select('*')
        .eq('block_id', block)
        .order('nama', { ascending: true });

      if (error) throw error;
      setInvestors(data || []);
    } catch (err: any) {
      console.error("Gagal mengambil data investor:", err.message);
    } finally {
      setLoadingInvestors(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBlock) {
      fetchInvestorsByBlock(selectedBlock);
    }
  }, [selectedBlock, fetchInvestorsByBlock]);

  // ==========================================
  // LOGIKA FORMULASI AKUNTANSI LIVE
  // ==========================================
  const labaBersihAlpukat = Math.max(0, inputAlpukat.omset - inputAlpukat.pengeluaran - inputAlpukat.risetDeviden);
  const labaBersihLainnya = Math.max(0, inputLainnya.omset - inputLainnya.pengeluaran - inputLainnya.risetDeviden);
  const totalPersenSahamSaatIni = investors.reduce((sum, inv) => sum + (inv.persen_saham || 0), 0);

  // ==========================================
  // C. AKSI: TAMBAH INVESTOR BARU (KLAUSUL BERSYARAT)
  // ==========================================
  const handleTambahInvestorDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock) return alert("Pilih blok lahan kerja aktif!");
    if (!newInvestor.nama || newInvestor.persen_saham <= 0) return alert("Isi nama dan porsi saham investor baru!");
    if (newInvestor.persen_saham > 100) return alert("Porsi saham tidak boleh melebihi 100%!");

    let listInvestorDiperbarui = [...investors];
    const sisaSlotSaham = 100 - totalPersenSahamSaatIni;

    if (totalPersenSahamSaatIni >= 100) {
      if (metodeKurangSaham === 'kurang_spesifik') {
        if (!investorTargetDipotong) return alert("Saham sudah 100%! Mohon pilih 1 investor lama yang porsi sahamnya ingin dikurangi.");
        
        const targetIdx = listInvestorDiperbarui.findIndex(inv => inv.id === investorTargetDipotong);
        if (targetIdx !== -1) {
          if (listInvestorDiperbarui[targetIdx].persen_saham <= newInvestor.persen_saham) {
            return alert(`Gagal! Saham ${listInvestorDiperbarui[targetIdx].nama} tidak cukup untuk dipotong sebesar ${newInvestor.persen_saham}%.`);
          }
          listInvestorDiperbarui[targetIdx].persen_saham -= newInvestor.persen_saham;
        }
      } else {
        if (listInvestorDiperbarui.length > 0) {
          const potonganPerInvestor = newInvestor.persen_saham / listInvestorDiperbarui.length;
          const adaSahamMinus = listInvestorDiperbarui.some(inv => inv.persen_saham <= potonganPerInvestor);
          
          if (adaSahamMinus) {
            return alert("Gagal! Porsi saham salah satu pihak terlalu kecil jika dipotong merata. Gunakan opsi potong spesifik.");
          }

          listInvestorDiperbarui = listInvestorDiperbarui.map(inv => ({
            ...inv,
            persen_saham: inv.persen_saham - potonganPerInvestor
          }));
        }
      }
    } else {
      if (newInvestor.persen_saham > sisaSlotSaham) {
        return alert(`Porsi saham yang dimasukkan (${newInvestor.persen_saham}%) melebihi sisa kapasitas slot kosong lahan (${sisaSlotSaham}%). Harap sesuaikan angka atau isi ulang setelah saham digenapkan ke 100%.`);
      }
    }

    try {
      if (totalPersenSahamSaatIni >= 100) {
        for (const invLama of listInvestorDiperbarui) {
          await supabase
            .from('master_investor')
            .update({ persen_saham: invLama.persen_saham })
            .eq('id', invLama.id);
        }
      }

      const { error: insertError } = await supabase
        .from('master_investor')
        .insert([{
          nama: newInvestor.nama,
          persen_saham: newInvestor.persen_saham,
          modal: newInvestor.modal,
          block_id: selectedBlock
        }]);

      if (insertError) throw insertError;

      alert(`Berhasil! Investor "${newInvestor.nama}" resmi didapatkan langsung di ${selectedBlock}.`);
      setNewInvestor({ nama: '', persen_saham: 0, modal: 0 });
      setInvestorTargetDipotong('');
      fetchInvestorsByBlock(selectedBlock);
    } catch (err: any) {
      alert("Gagal menyimpan data: " + err.message);
    }
  };

  // ==========================================
  // D. AKSI: HAPUS INVESTOR + KLAUSUL REPOSISI
  // ==========================================
  const handleHapusInvestorDatabase = async (idTarget: string) => {
    const targetInv = investors.find(inv => inv.id === idTarget);
    if (!targetInv) return;

    const konfirmasi = window.confirm(`Hapus ${targetInv.nama} dari ${selectedBlock}? Saham sebesar ${targetInv.persen_saham}% akan diredistribusikan.`);
    if (!konfirmasi) return;

    let sisaInvestor = investors.filter(inv => inv.id !== idTarget);

    if (sisaInvestor.length === 0) {
      try {
        await supabase.from('master_investor').delete().eq('id', idTarget);
        alert("Investor terakhir di blok ini berhasil dihapus.");
        fetchInvestorsByBlock(selectedBlock);
        return;
      } catch (err: any) {
        return alert(err.message);
      }
    }

    if (klausulHapus === 'bagi_rata') {
      const tambahanPerMitra = targetInv.persen_saham / sisaInvestor.length;
      sisaInvestor = sisaInvestor.map(inv => ({
        ...inv,
        persen_saham: inv.persen_saham + tambahanPerMitra
      }));
    } else if (klausulHapus === 'alihkan_pilihan') {
      if (!investorPilihanDest) return alert("Pilih pihak spesifik penampung sisa alokasi saham!");
      sisaInvestor = sisaInvestor.map(inv => {
        if (inv.id === investorPilihanDest) {
          return { ...inv, persen_saham: inv.persen_saham + targetInv.persen_saham };
        }
        return inv;
      });
    }

    try {
      for (const invSisa of sisaInvestor) {
        await supabase
          .from('master_investor')
          .update({ persen_saham: invSisa.persen_saham })
          .eq('id', invSisa.id);
      }

      const { error: deleteError } = await supabase
        .from('master_investor')
        .delete()
        .eq('id', idTarget);

      if (deleteError) throw deleteError;

      alert(`Berhasil menghapus dan menyeimbangkan porsi saham di database.`);
      setInvestorPilihanDest('');
      fetchInvestorsByBlock(selectedBlock);
    } catch (err: any) {
      alert("Gagal memperbarui database: " + err.message);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-700 space-y-6">
      
      {/* SEKTOR TOP BANNER */}
      <div className="bg-emerald-900 text-white p-5 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">🗮 Kalkulator Pembagian Untung Riil & Database Sync</h1>
          <p className="text-xs text-emerald-200 mt-1">
            Data pilihan lahan di bawah dimuat dinamis langsung dari tabel <code className="bg-emerald-950 px-1 rounded text-emerald-300 font-mono">master_blok</code>.
          </p>
        </div>
        
        <div className="bg-emerald-800 p-2 rounded-lg border border-emerald-700 flex items-center space-x-2">
          <span className="text-xs font-bold text-emerald-200">Pilih Lahan Aktif:</span>
          {loadingBlocks ? (
            <span className="text-xs text-emerald-300 animate-pulse font-mono">Memuat database lahan...</span>
          ) : (
            <select 
              value={selectedBlock} 
              onChange={(e) => setSelectedBlock(e.target.value)} 
              className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded border-none outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableBlocks.map((blok, idx) => (
                /* ✅ AMAN: Menghindari crash jika block_id ada yang kembar/null */
                <option key={blok.block_id || `blok-${idx}`} value={blok.block_id}>
                  {blok.block_id}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* INFORMASI SAHAM AKTIF BLOK */}
      <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold flex justify-between items-center">
        <span>Struktur Kepemilikan Lahan: <span className="text-emerald-700 font-bold">{selectedBlock || 'Memuat...'}</span></span>
        <span className={totalPersenSahamSaatIni === 100 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
          Total Saham Terdaftar di Blok Ini: {totalPersenSahamSaatIni}% {totalPersenSahamSaatIni < 100 && `(Sisa Slot Kosong: ${100 - totalPersenSahamSaatIni}%)`}
        </span>
      </div>

      {/* INPUT EDITOR FINANSIAL MANUAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PANEL SEKTOR POHON ALPUKAT */}
        <div className="bg-white p-5 rounded-xl border-t-4 border-emerald-600 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-emerald-950 flex justify-between items-center">
            <span>🥑 Sektor Penjualan Alpukat</span>
            <span className="text-[11px] text-slate-400 font-normal">Nominal Manual</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-500 mb-0.5">Omset Kotor Penjualan Alpukat (Rp)</label>
              <input type="number" value={inputAlpukat.omset} onChange={(e) => setInputAlpukat({...inputAlpukat, omset: Number(e.target.value)})} className="w-full border p-2 rounded-md font-mono font-bold text-slate-800" />
            </div>
            <div>
              <label className="block text-slate-500 mb-0.5">Detail Varietas Sensus Panen</label>
              <input type="text" value={detailAlpukat} onChange={(e) => setDetailAlpukat(e.target.value)} className="w-full border p-2 rounded-md text-slate-600 italic bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-0.5">Pengeluaran / Beban Blok</label>
                <input type="number" value={inputAlpukat.pengeluaran} onChange={(e) => setInputAlpukat({...inputAlpukat, pengeluaran: Number(e.target.value)})} className="w-full border p-2 rounded-md font-mono text-rose-600" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">Riset Pengurang Dana</label>
                <input type="number" value={inputAlpukat.risetDeviden} onChange={(e) => setInputAlpukat({...inputAlpukat, risetDeviden: Number(e.target.value)})} className="w-full border p-2 rounded-md font-mono text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-md flex justify-between items-center text-xs font-bold">
            <span>Laba Bersih Siap Bagi (Alpukat):</span>
            <span className="font-mono">Rp {labaBersihAlpukat.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* PANEL SEKTOR POHON LAINNYA */}
        <div className="bg-white p-5 rounded-xl border-t-4 border-orange-500 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-orange-950 flex justify-between items-center">
            <span>🍊 Sektor Penjualan Pohon Lainnya</span>
            <span className="text-[11px] text-slate-400 font-normal">Nominal Manual</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-500 mb-0.5">Omset Kotor Penjualan Lainnya (Rp)</label>
              <input type="number" value={inputLainnya.omset} onChange={(e) => setInputLainnya({...inputLainnya, omset: Number(e.target.value)})} className="w-full border p-2 rounded-md font-mono font-bold text-slate-800" />
            </div>
            <div>
              <label className="block text-slate-500 mb-0.5">Rincian Jenis Komoditas Lahan</label>
              <input type="text" value={detailLainnya} onChange={(e) => setDetailLainnya(e.target.value)} className="w-full border p-2 rounded-md text-slate-600 italic bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-0.5">Pengeluaran / Beban Blok</label>
                <input type="number" value={inputLainnya.pengeluaran} onChange={(e) => setInputLainnya({...inputLainnya, pengeluaran: Number(e.target.value)})} className="w-full border p-2 rounded-md font-mono text-rose-600" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">Riset Pengurang Dana</label>
                <input type="number" value={inputLainnya.risetDeviden} onChange={(e) => setInputLainnya({...inputLainnya, risetDeviden: Number(e.target.value)})} className="w-full border p-2 rounded-md font-mono text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-orange-50 text-orange-900 p-2.5 rounded-md flex justify-between items-center text-xs font-bold">
            <span>Laba Bersih Siap Bagi (Lainnya):</span>
            <span className="font-mono">Rp {labaBersihLainnya.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* FORM TAMBAH INVESTOR BARU DENGAN LOGIKA BERSYARAT */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span>📝</span> Daftarkan Investor Baru Ke Lahan <span className="text-emerald-700 underline font-extrabold">{selectedBlock || '...'}</span>
        </h2>
        <form onSubmit={handleTambahInvestorDatabase} className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-3">
            <div>
              <label className="block text-slate-500 mb-0.5">Nama Lengkap Investor</label>
              <input type="text" required placeholder="Nama lengkap..." value={newInvestor.nama} onChange={(e) => setNewInvestor({...newInvestor, nama: e.target.value})} className="w-full border p-2 rounded bg-white text-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-0.5">Porsi Saham Ambil (%)</label>
                <input type="number" required max="100" min="1" placeholder="Contoh: 10" value={newInvestor.persen_saham || ''} onChange={(e) => setNewInvestor({...newInvestor, persen_saham: Number(e.target.value)})} className="w-full border p-2 rounded bg-white text-slate-800" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">Nominal Modal Setoran (Rp)</label>
                <input type="number" required placeholder="Rp..." value={newInvestor.modal || ''} onChange={(e) => setNewInvestor({...newInvestor, modal: Number(e.target.value)})} className="w-full border p-2 rounded bg-white text-slate-800" />
              </div>
            </div>
          </div>

          {/* ELEMENT SELEKSI KLAUSUL HANYA AKAN AKTIF SECARA VISUAL JIKA SAHAM SUDAH 100% */}
          <div className={`p-3 rounded-lg border transition ${totalPersenSahamSaatIni >= 100 ? 'bg-amber-50/60 border-amber-200 lg:col-span-2' : 'bg-slate-50 border-slate-200 opacity-60 lg:col-span-2'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-600 block text-[11px] uppercase">
                Metode Penyeimbangan Pengurangan Saham Di Lahan Ini:
              </span>
              {totalPersenSahamSaatIni < 100 ? (
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded">
                  🔓 LOSS INPUT (Saham Belum 100%)
                </span>
              ) : (
                <span className="bg-amber-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded animate-pulse">
                  🔒 KLAUSUL WAJIB AKTIF (Saham 100%)
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" disabled={totalPersenSahamSaatIni < 100} name="kurang_saham_db" checked={metodeKurangSaham === 'kurang_rata'} onChange={() => setMetodeKurangSaham('kurang_rata')} />
                <span className={totalPersenSahamSaatIni < 100 ? 'text-slate-400' : 'text-slate-700'}>Potong porsi secara merata dari seluruh investor aktif di {selectedBlock}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" disabled={totalPersenSahamSaatIni < 100} name="kurang_saham_db" checked={metodeKurangSaham === 'kurang_spesifik'} onChange={() => setMetodeKurangSaham('kurang_spesifik')} />
                <span className={totalPersenSahamSaatIni < 100 ? 'text-slate-400' : 'text-slate-700'}>Potong hanya dari porsi milik 1 investor pilihan berikut</span>
              </label>
            </div>

            {metodeKurangSaham === 'kurang_spesifik' && totalPersenSahamSaatIni >= 100 && (
              <select value={investorTargetDipotong} onChange={(e) => setInvestorTargetDipotong(e.target.value)} className="w-full border p-2 rounded bg-white mt-1 text-[11px]">
                <option value="">-- Pilih Investor Yang Sahamnya Dikurangi --</option>
                {investors.map((inv, idx) => (
                  /* ✅ AMAN: Penguat key cadangan */
                  <option key={inv.id || `target-${idx}`} value={inv.id}>{inv.nama} (Saham Saat Ini: {inv.persen_saham}%)</option>
                ))}
              </select>
            )}

            <div className="pt-2">
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded transition shadow-xs">
                {totalPersenSahamSaatIni >= 100 ? 'Simpan Investor & Mutasikan Saham' : 'Langsung Daftarkan ke Slot Kosong Lahan'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* KLAUSUL ATURAN PELEPASAN SAHAM SAAT HAPUS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
        <h3 className="font-bold text-slate-500 uppercase text-[11px]">⚙️ Aturan Pelepasan Saham (Klausul Penghapusan)</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input type="radio" checked={klausulHapus === 'bagi_rata'} onChange={() => setKlausulHapus('bagi_rata')} className="text-emerald-700" />
            <span>Bagi Rata Sisa Porsi Saham ke Semua Anggota Aktif di {selectedBlock}</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input type="radio" checked={klausulHapus === 'alihkan_pilihan'} onChange={() => setKlausulHapus('alihkan_pilihan')} className="text-emerald-700" />
            <span>Alihkan Penuh Porsi Saham ke 1 Pihak Penerima Spesifik:</span>
          </label>
        </div>

        {klausulHapus === 'alihkan_pilihan' && (
          <div className="pt-1">
            <select value={investorPilihanDest} onChange={(e) => setInvestorPilihanDest(e.target.value)} className="text-xs border p-2 rounded bg-white min-w-[220px]">
              <option value="">-- Pilih Pihak Penampung --</option>
              {investors.map((inv, idx) => (
                /* ✅ AMAN: Penguat key cadangan */
                <option key={inv.id || `dest-${idx}`} value={inv.id}>{inv.nama}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* REKAP OUTPUT TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            📊 Hak Dividen Terbagi per Komoditas Lahan ({selectedBlock || '...'})
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Menampilkan data pemegang saham aktif terikat kode relasi <code className="bg-slate-100 px-1 rounded text-emerald-800 font-mono">block_id</code>.
          </p>
        </div>

        {loadingInvestors ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium animate-pulse">Menghubungkan ke tabel master_investor...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">NAMA MITRA</th>
                  <th className="p-3 text-center">SAHAM (%)</th>
                  <th className="p-3">MODAL</th>
                  <th className="p-3 text-emerald-800">
                    DIVIDEN POHON ALPUKAT <br/>
                    <span className="text-[10px] text-emerald-600 font-mono font-normal">({detailAlpukat})</span>
                  </th>
                  <th className="p-3 text-orange-800">
                    DIVIDEN POHON LAINNYA <br/>
                    <span className="text-[10px] text-orange-600 font-mono font-normal">({detailLainnya})</span>
                  </th>
                  <th className="p-3 font-bold bg-slate-900 text-white text-center">TOTAL NET YANG HARUS DIBAGIKAN</th>
                  <th className="p-3 text-center">AKSI DATABASE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {investors.map((inv, idx) => {
                  const dividenAlpukatPihak = (labaBersihAlpukat * (inv.persen_saham || 0)) / 100;
                  const dividenLainnyaPihak = (labaBersihLainnya * (inv.persen_saham || 0)) / 100;
                  const totalUangDiterima = dividenAlpukatPihak + dividenLainnyaPihak;

                  return (
                    /* ✅ KUNCI PERBAIKAN UTAMA:
                       Menggabungkan inv.id dengan alternatif indeks loop 'inv-' + idx.
                       Jika database menghasilkan id kosong atau null, React akan beralih ke index string ini.
                    */
                    <tr key={inv.id || `inv-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-800">👤 {inv.nama || "Tanpa Nama"}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 font-extrabold font-mono rounded">
                          {inv.persen_saham || 0}%
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">Rp {(inv.modal || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">Rp {dividenAlpukatPihak.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-mono text-orange-700 font-bold">Rp {dividenLainnyaPihak.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-mono font-extrabold text-center text-emerald-950 bg-emerald-50">
                        Rp {totalUangDiterima.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleHapusInvestorDatabase(inv.id)}
                          className="bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white text-rose-700 font-bold px-2.5 py-1 rounded transition text-[11px]"
                        >
                          🗑️ Hapus Pihak
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {investors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      Belum ada investor terdaftar di {selectedBlock || 'lahan terpilih'}. Daftarkan investor baru menggunakan form di atas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}