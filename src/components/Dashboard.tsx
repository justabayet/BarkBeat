
'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import SongSearch from './SongSearch'
import SessionManager from './SessionManager'
import GlobalSearch from './GlobalSearch'
import Navigation from './Navigation'
import Library from './Library'
import UserPage from './UserPage'

interface DashboardProps {
  user: User
}

export type ActiveTab = 'search' | 'sessions' | 'library' | 'global' | 'user'

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search')

  return (
    <>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="text-gray-100 bg-transparent w-full sm:px-4 md:px-8">
        <main className="max-w-2xl mx-auto w-full px-0 sm:px-2 pb-20 md:pb-6">
          {activeTab === 'search' && <SongSearch user={user} />}
          {activeTab === 'global' && <GlobalSearch user={user} />}
          {activeTab === 'sessions' && <SessionManager user={user} />}
          {activeTab === 'library' && <Library user={user} />}
          {activeTab === 'user' && <UserPage user={user} />}
        </main>
      </div>
    </>
  )
}
