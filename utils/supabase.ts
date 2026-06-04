export const SUPABASE_CONFIG = {
  apiKey: 'sb_publishable_KImrVBJYtwP9C4QH4jz-Rw_Y1P30q7X',
  baseUrl: 'https://uuryuuxyfevhuwiaufvr.supabase.co/rest/v1'
}

export async function ambilDataSupabase(namaTabel: string) {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.baseUrl}/${namaTabel}?select=*`, {
      headers: {
        'apikey': SUPABASE_CONFIG.apiKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.apiKey}`
      }
    })
    return await res.json()
  } catch (err) {
    console.error(`Gagal melakukan singkronisasi tabel ${namaTabel}:`, err)
    return []
  }
}