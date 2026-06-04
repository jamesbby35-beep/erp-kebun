'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

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
    <aside style={{ 
      width: '280px', 
      backgroundColor: '#0b251a', 
      color: '#ffffff', 
      padding: '24px 16px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      
      {/* Branding Logo Perusahaan */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
        <span style={{ fontSize: '32px' }}>🥑</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>GK AVOCADO</h2>
          <span style={{ fontSize: '11px', color: '#52b788', fontWeight: '600' }}>CORE MANAGEMENT</span>
        </div>
      </div>

      {/* Rentetan Tombol Navigasi */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menus.map((menu, idx) => {
          const isActive = pathname === menu.path

          return (
            <a
              key={idx}
              href={menu.path}
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
  )
}