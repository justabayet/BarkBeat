import { supabase } from "@/lib/supabase"
import { Profile } from "@/lib/typesInfered"
import { User } from "@supabase/supabase-js"
import { LogOut } from "lucide-react"
import { useEffect, useState } from "react"

interface UserProps {
    user: User
}

export default function UserPage({ user }: UserProps) {
    const [profile, setProfile] = useState<Profile | null>(null)

    useEffect(() => {
        const loadProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(data)
        }

        loadProfile()
    }, [user.id])

    const signOut = async () => {
        await supabase.auth.signOut()
    }
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="bg-gradient-to-r from-purple-700/80 to-purple-900/80 rounded-2xl p-6 shadow-lg w-full max-w-xs flex flex-col items-center">
                <div className="text-3xl mb-2">👤</div>
                <div className="font-bold text-lg mb-1">{profile?.name || user.email}</div>
                <div className="text-xs text-gray-300 mb-4">{user.email}</div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded-xl text-sm font-semibold transition-colors shadow-sm border border-red-800/60"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    )
}