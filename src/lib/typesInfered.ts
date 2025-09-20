import { Database } from "./types"


export type Song = Database['public']['Tables']['songs']['Row']
export type UserSong = Database['public']['Tables']['user_songs']['Row']
export type AugmentedSong = Song & { user_songs?: UserSong[] }
export type AugmentedUserSong = UserSong & { songs: Song | null }
export type Profile = Database['public']['Tables']['profiles']['Row']
export type MockProfile = Database['public']['Tables']['mock_profiles']['Row']
export type KaraokeSession = Database['public']['Tables']['karaoke_sessions']['Row']
