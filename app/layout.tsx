import "./globals.css"; // Impor CSS global Anda jika ada

export const metadata = {
  title: "GK Avocado ERP",
  description: "Sistem Manajemen Inti Perkebunan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}