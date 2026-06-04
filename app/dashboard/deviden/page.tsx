"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// =========================================================================
// SILAKAN SESUAIKAN URL & ANON KEY DENGAN KONFIGURASI SUPABASE PROJECT ANDA
// =========================================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uuryuuxyfevhuwiaufvr.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Investor {
  nama: string;
  persen_saham: number;
  block_id: string;
}

interface BlokLahan {
  block_id: string;
  // Tambahkan property lain dari master_blok jika diperlukan, misal nama_blok: string;
}

interface DividenForm {
  deviden_id: string;
  tanggal: string;
  penjelasan_manual: string;
  jenis: 'Pohon Alpukat' | 'Pohon Lainnya';
  keterangan: string;
  block_id: string;
  nominal_total: number;
}

interface MasterDevidenData {
  deviden_id: string;
  tanggal: string;
  penjelasan: string;
  nominal: number;
  jenis: string;
  keterangan: string;
  block_id: string;
  created_at?: string;
}

export default function MasterDevidenPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [blocks, setBlocks] = useState<BlokLahan[]>([]); // State dinamis untuk menampung data master_blok
  const [masterDevidenList, setMasterDevidenList] = useState<MasterDevidenData[]>([]); 
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0); 
  
  // State Utama Formulir
  const [formData, setFormData] = useState<DividenForm>({
    deviden_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    penjelasan_manual: '',
    jenis: 'Pohon Alpukat',
    keterangan: 'Hass',
    block_id: '', // Diisi otomatis setelah data master_blok berhasil dimuat
    nominal_total: 0
  });

  // State pencatat nominal otomatis per investor
  const [distribusiNominal, setDistribusiNominal] = useState<{[key: string]: number}>({});

  // 1. Ambil data dari master_blok untuk sinkronisasi dropdown pilihan blok
  useEffect(() => {
    async function fetchBlocks() {
      const { data, error } = await supabase
        .from('master_blok')
        .select('block_id')
        .order('block_id', { ascending: true });
      
      if (!error && data && data.length > 0) {
        setBlocks(data);
        // Set block_id default ke item pertama dari master_blok
        setFormData(prev => ({ ...prev, block_id: data[0].block_id }));
      } else {
        // Fallback data default jika tabel master_blok kosong/error
        const fallbackBlocks = [{ block_id: 'BLK001' }, { block_id: 'BLK002' }];
        setBlocks(fallbackBlocks);
        setFormData(prev => ({ ...prev, block_id: fallbackBlocks[0].block_id }));
      }
    }
    fetchBlocks();
  }, []);

  // 2. Tarik data investor aktif dari database master_investor
  useEffect(() => {
    async function fetchInvestors() {
      const { data, error } = await supabase
        .from('master_investor')
        .select('nama, persen_saham, block_id');
      
      if (!error && data && data.length > 0) {
        setInvestors(data);
      } else {
        // Fallback data default dari master_investor jika database kosong
        setInvestors([
          { nama: 'Pihak Pertama', persen_saham: 90, block_id: 'BLK001' },
          { nama: 'Pihak Kedua', persen_saham: 10, block_id: 'BLK001' }
        ]);
      }
    }
    fetchInvestors();
  }, []);

  // 3. Tarik data dari tabel master_deviden untuk ditampilkan di tabel riwayat log
  useEffect(() => {
    async function fetchMasterDeviden() {
      const { data, error } = await supabase
        .from('master_deviden')
        .select('*')
        .order('tanggal', { ascending: false }); 
      
      if (!error && data) {
        setMasterDevidenList(data);
      }
    }
    if (formData.block_id) {
      fetchMasterDeviden();
    }
  }, [refreshTrigger, formData.block_id]); 

  // Filter investor & data list berdasarkan block_id yang dipilih
  const filteredInvestors = investors.filter(inv => (inv.block_id || 'BLK001') === formData.block_id);
  const filteredDevidenList = masterDevidenList.filter(d => (d.block_id || 'BLK001') === formData.block_id);

  // 4. Kalkulasi otomatis pembagian dana proporsional sesuai porsi saham (%)
  useEffect(() => {
    const hasilBagi: {[key: string]: number} = {};
    filteredInvestors.forEach(inv => {
      hasilBagi[inv.nama] = (Number(formData.nominal_total || 0) * Number(inv.persen_saham)) / 100;
    });
    setDistribusiNominal(hasilBagi);
  }, [formData.nominal_total, formData.block_id, investors]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'jenis') {
        updated.keterangan = value === 'Pohon Alpukat' ? 'Hass' : '';
      }
      return updated;
    });
  };

  // 5. FUNGSI UTAMA: MEMASUKKAN DATA KE MASTER DEVIDEN SUPABASE
  const handleSimpanKeSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deviden_id) return alert("Mohon isi ID Deviden terlebih dahulu!");

    setLoading(true);

    try {
      const formatPenjelasanDividen = Object.entries(distribusiNominal)
        .map(([nama, nominal]) => `${nama} = Rp ${nominal.toLocaleString('id-ID')}`)
        .join(', ');

      const penjelasanFinal = formData.penjelasan_manual 
        ? `${formData.penjelasan_manual} | ${formatPenjelasanDividen}`
        : formatPenjelasanDividen;

      const totalNominalAkhir = Object.values(distribusiNominal).reduce((sum, val) => sum + val, 0);

      const payloadData = {
        deviden_id: formData.deviden_id,
        tanggal: formData.tanggal,
        penjelasan: penjelasanFinal,
        nominal: totalNominalAkhir, 
        jenis: formData.jenis,
        keterangan: formData.keterangan,
        block_id: formData.block_id
      };

      const { error } = await supabase
        .from('master_deviden')
        .insert([payloadData]);

      if (error) throw error;

      alert(`Sukses! Data dividen ${formData.deviden_id} berhasil disimpan.`);
      
      setFormData(prev => ({ ...prev, deviden_id: '', nominal_total: 0, penjelasan_manual: '' }));
      setRefreshTrigger(prev => prev + 1);

    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan data ke Supabase: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. FUNGSI BARU: MENGHAPUS DATA DARI MASTER DEVIDEN SUPABASE
  const handleHapusDeviden = async (devidenId: string) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus data transaksi dengan ID: ${devidenId}?`);
    if (!konfirmasi) return;

    try {
      const { error } = await supabase
        .from('master_deviden')
        .delete()
        .eq('deviden_id', devidenId);

      if (error) throw error;

      alert(`Sukses! Transaksi ${devidenId} berhasil dihapus dari database.`);
      setRefreshTrigger(prev => prev + 1); // Segarkan tabel riwayat log halaman secara real-time

    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus data dari Supabase: " + err.message);
    }
  };

  // 7. FUNGSI PRINT: CETAK INVOICE DARI RIWAYAT TABEL
  const handleCetakInvoiceDariTabel = (item: MasterDevidenData) => {
    const cetakWindow = window.open('', '_blank');
    if (!cetakWindow) return;

    cetakWindow.document.write(`
      <html>
        <head>
          <title>Invoice Deviden - ${item.deviden_id}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 30px; color: #222; line-height: 1.5; }
            .border-line { border-bottom: 2px dashed #000; margin: 15px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td, th { padding: 8px 4px; text-align: left; vertical-align: top; }
            th { border-bottom: 1px solid #000; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h3>🥑 GK AVOCADO CORE MANAGEMENT 🥑</h3>
            <p style="font-size: 13px; margin: 2px 0;">Kuitansi Distribusi Deviden Konsorsium Lahan</p>
            <p style="font-size: 11px; color:#555;">ID Jurnal: <strong>${item.deviden_id}</strong> | Blok: <strong>${item.block_id}</strong></p>
          </div>
          <div class="border-line"></div>
          
          <table>
            <tr><td style="width: 140px;">Tanggal Buku</td><td>: ${item.tanggal}</td></tr>
            <tr><td>Komoditas / Jenis</td><td>: ${item.jenis} (${item.keterangan})</td></tr>
            <tr><td>Total Dana Dibagi</td><td>: <strong>Rp ${Number(item.nominal).toLocaleString('id-ID')}</strong></td></tr>
          </table>
          
          <div class="border-line"></div>
          <p style="font-size: 12px; margin-bottom: 5px;"><strong>Rincian Penjelasan Distribusi Penerima:</strong></p>
          <div style="background-color: #f9f9f9; padding: 10px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
            ${item.penjelasan}
          </div>
          
          <div class="border-line"></div>
          <div class="text-right" style="font-size: 16px; font-weight: bold;">
            TOTAL REALISASI KAS: Rp ${Number(item.nominal).toLocaleString('id-ID')}
          </div>
          
          <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px;">
            <div class="text-center" style="width: 180px;">Verifikasi Internal<br/><br/><br/><br/>( ____________________ )</div>
            <div class="text-center" style="width: 180px;">Manajemen Keuangan<br/><br/><br/><br/>( Fadhilah Rizky )</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    cetakWindow.document.close();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-700 space-y-6">
      
      {/* 1. SEKTOR INPUT FORM UTAMA */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-6">
          <span className="text-xl">📊</span>
          <h2 className="text-base font-bold text-slate-800">Form Jurnal Transaksi Master Deviden</h2>
        </div>

        <form onSubmit={handleSimpanKeSupabase} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ID DEVIDEN</label>
              <input 
                type="text" name="deviden_id" placeholder="Contoh: DVD001" required
                value={formData.deviden_id} onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">TANGGAL TRANSAKSI</label>
              <input 
                type="date" name="tanggal" required
                value={formData.tanggal} onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">BLOK AREA LAHAN</label>
              <select 
                name="block_id" value={formData.block_id} onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none"
              >
                {/* Menampilkan Opsi Blok yang disinkronkan langsung dari tabel master_blok */}
                {blocks.map(blk => (
                  <option key={blk.block_id} value={blk.block_id}>{blk.block_id}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">JENIS TANAMAN</label>
              <select 
                name="jenis" value={formData.jenis} onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none"
              >
                <option value="Pohon Alpukat">Pohon Alpukat</option>
                <option value="Pohon Lainnya">Pohon Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">KETERANGAN / VARIETAS</label>
              {formData.jenis === 'Pohon Alpukat' ? (
                <select 
                  name="keterangan" value={formData.keterangan} onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                >
                  <option value="Hass">Hass</option>
                  <option value="Mentega">Mentega</option>
                  <option value="Muria">Muria</option>
                  <option value="Aligator">Aligator</option>
                </select>
              ) : (
                <input 
                  type="text" name="keterangan" placeholder="Isi tanaman manual (Semangka/Jeruk)" required
                  value={formData.keterangan} onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">TOTAL DANA BAGI HASIL (RP)</label>
              <input 
                type="number" name="nominal_total" placeholder="Masukkan Nominal Bersih" required
                value={formData.nominal_total || ''} onChange={handleInputChange}
                className="w-full border border-emerald-200 bg-emerald-50/30 font-bold text-emerald-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">PENJELASAN TAMBAHAN (OPSIONAL)</label>
            <input 
              type="text" name="penjelasan_manual" placeholder="Catatan opsional sebelum rincian otomatis nama investor..."
              value={formData.penjelasan_manual} onChange={handleInputChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* Preview Pembagian Ke Investor */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 tracking-wider">👥 Preview Distribusi Sesuai Porsi Lahan Aktif</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredInvestors.map((investor, idx) => {
                const nominalMitra = distribusiNominal[investor.nama] || 0;
                return (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700">{investor.nama} ({investor.persen_saham}%)</span>
                    <span className="font-mono text-emerald-700 font-bold">Rp {nominalMitra.toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-sm disabled:bg-slate-400"
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi Ke Tabel Master Deviden'}
          </button>
        </form>
      </div>

      {/* 2. SEKTOR TABEL PENAMPIL DATA */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📋</span>
            <h2 className="text-base font-bold text-slate-800">Data Riwayat Log Tabel Master Deviden ({formData.block_id})</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Total Terjurnal: {filteredDevidenList.length} Baris</span>
        </div>

        {filteredDevidenList.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada data distribusi dividen tersimpan untuk lahan {formData.block_id}.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200">
                  <th className="p-3">ID DEVIDEN</th>
                  <th className="p-3">TANGGAL</th>
                  <th className="p-3">KOMODITAS (VARIETAS)</th>
                  <th className="p-3">NOMINAL OPERASIONAL</th>
                  <th className="p-3">PENJELASAN ALOKASI MITRA SAHAM</th>
                  <th className="p-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDevidenList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{item.deviden_id}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{item.tanggal}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium">
                        {item.jenis === 'Pohon Alpukat' ? `${item.jenis} (${item.keterangan})` : `${item.jenis} (${item.keterangan})`}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-800 font-mono whitespace-nowrap">
                      Rp {Number(item.nominal).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate" title={item.penjelasan}>
                      {item.penjelasan}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCetakInvoiceDariTabel(item)}
                          className="bg-sky-50 text-sky-700 font-bold px-3 py-1.5 rounded-lg border border-sky-200/50 hover:bg-sky-100 transition shadow-xs whitespace-nowrap"
                        >
                          🖨️ Invoice Keluar
                        </button>
                        
                        {/* AKSI BARU: Tombol Hapus Baris Data */}
                        <button
                          type="button"
                          onClick={() => handleHapusDeviden(item.deviden_id)}
                          className="bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-lg border border-rose-200/50 hover:bg-rose-100 transition shadow-xs"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}