
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
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-b from-white via-slate-50 to-slate-100 min-h-screen text-gray-900 font-sans antialiased`}>
        <div className="max-w-md mx-auto w-full min-h-screen flex flex-col px-4 sm:px-6 md:max-w-2xl lg:max-w-4xl">
          <header className="py-4 flex items-center justify-between border-b border-slate-200 mb-2 sticky top-0 bg-white/80 backdrop-blur z-10 rounded-b-xl shadow-sm">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">BarkBeat</h1>
          </header>
          <main className="flex-1 flex flex-col gap-4 py-2">{children}</main>
          <footer className="py-3 text-xs text-center text-slate-400 mt-4">
            &copy; {new Date().getFullYear()} BarkBeat
          </footer>
        </div>
      </body>
    </html>
  )
}