import './globals.css'

export const metadata = {
  title: 'Sistema de Asistencia',
  description: 'Control escolar por RFID',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
