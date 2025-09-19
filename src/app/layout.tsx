
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
        {/* Header will be rendered by page/component, not here */}
        <div className="max-w-md mx-auto w-full min-h-screen flex flex-col md:max-w-2xl lg:max-w-4xl p-0">
          <main className="flex-1 flex flex-col gap-4 w-full">{children}</main>
          <footer className="py-3 text-xs text-center text-slate-400 mt-4 w-full">
            &copy; {new Date().getFullYear()} BarkBeat
          </footer>
        </div>
      </body>
    </html>
  )
}