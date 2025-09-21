
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BarkBeat',
  description: 'Personalized karaoke experience with group recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} bg-gradient-to-b from-gray-900 via-gray-950 to-black min-h-screen text-gray-100 font-sans antialiased`}>

        <div className="max-w-md mx-auto w-full min-h-screen flex flex-col md:max-w-2xl lg:max-w-4xl p-0">
          <main className="flex-1 flex flex-col gap-4 w-full">{children}</main>
          <footer className="py-3 text-xs text-center text-slate-500 mt-4 w-full">
            &copy; {new Date().getFullYear()} BarkBeat
          </footer>
        </div>
      </body>
    </html>
  )
}