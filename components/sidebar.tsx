'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  // State untuk kontrol buka-tutup khusus pada layar mobile/HP
  const [isOpen, setIsOpen] = useState(false)

  // Struktur Menu Navigasi ERP GK Avocado
  const menus = [
    { name: 'Dashboard Utama', path: '/dashboard', icon: '📊' },
    { name: 'Modul 1: Sensus Pohon Alpukat', path: '/dashboard/pohon', icon: '🌳' },
    { name: 'Modul 2: Blok Lahan', path: '/dashboard/blok', icon: '🗺️' },
    { name: 'Modul 3: Porsi Saham', path: '/dashboard/investor', icon: '💰' },
    { name: 'Modul 4: Operasional', path: '/dashboard/operasional', icon: '📝' },
    { name: 'Modul 5: Hasil Panen', path: '/dashboard/panen', icon: '🧺' },
    { name: 'Modul 6: Pemasukan', path: '/dashboard/keuangan/pemasukan', icon: '📈' },
    { name: 'Modul 7: Pengeluaran', path: '/dashboard/keuangan/pengeluaran', icon: '📉' },
    { name: 'Modul 8: Deviden', path: '/dashboard/deviden', icon: '📉' },
  ]

  return (
    <>
      {/* 1. TOMBOL TRIGGER BURGER MENU (Hanya Muncul di Layar HP/Mobile) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1100,
          backgroundColor: '#0b251a',
          color: '#ffffff',
          border: '2px solid #143e2b',
          borderRadius: '10px',
          padding: '10px 12px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px'
        }}
        className="block lg:hidden" // Utilitas penanda jika menggunakan Tailwind global, atau diatur via CSS di bawah
      >
        {isOpen ? '✕ Tutup' : '☰ Menu'}
      </button>

      {/* 2. BACKGROUND BLUR OVERLAY (Menutup Konten Belakang Saat Sidebar Terbuka di HP) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
          }}
        />
      )}

      {/* 3. KOMPONEN UTAMA ASIDE SIDEBAR */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#0b251a',
          color: '#ffffff',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          height: '100vh',
          boxSizing: 'border-box',
          position: 'fixed', // Posisi tetap agar layout terkunci
          top: 0,
          left: 0,
          zIndex: 1000,
          transition: 'transform 0.3s ease-in-out',
          // Deteksi CSS Media Query manual lewat transform inline:
          transform: typeof window !== 'undefined' && window.innerWidth < 1024 
            ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') 
            : 'translateX(0)'
        }}
        // Menyisipkan style CSS global langsung ke elemen agar tombol burger hilang di layar PC/Laptop besar
        ref={(el) => {
          if (el) {
            const style = document.createElement('style');
            style.innerHTML = `
              @media (max-width: 1023px) {
                aside { transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important; }
              }
              @media (min-width: 1024px) {
                aside { transform: translateX(0) !important; position: sticky !important; }
                button { display: none !important; }
              }
            `;
            el.appendChild(style);
          }
        }}
      >
        
        {/* Branding Logo Perusahaan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', marginTop: typeof window !== 'undefined' && window.innerWidth < 1024 ? '40px' : '0px' }}>
          <span style={{ fontSize: '32px' }}>🥑</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>GK AVOCADO</h2>
            <span style={{ fontSize: '11px', color: '#52b788', fontWeight: '600' }}>CORE MANAGEMENT</span>
          </div>
        </div>

        {/* Rentetan Tombol Navigasi */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          {menus.map((menu, idx) => {
            const isActive = pathname === menu.path

            return (
              <a
                key={idx}
                href={menu.path}
                onClick={() => setIsOpen(false)} // Otomatis menutup sidebar setelah menu di klik di HP
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? '#1e4d38' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>{menu.icon}</span>
                <span>{menu.name}</span>
              </a>
            )
          })}
        </nav>

        {/* Profil Singkat Pengguna Admin */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '14px', 
          backgroundColor: '#143e2b', 
          borderRadius: '14px' 
        }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            backgroundColor: '#52b788', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#0b251a'
          }}>
            FR
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>Fadhilah Rizky</h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Super Admin</span>
          </div>
        </div>

      </aside>
    </>
  )
}