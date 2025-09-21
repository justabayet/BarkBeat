import { Play, Search, Users, Music, LogOut, UserIcon, Plus } from "lucide-react";
import { ActiveTab } from "./Dashboard";


interface NavigationProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
    return (
        <>
            {/* Desktop top nav */}
            <nav className="hidden md:block bg-gradient-to-r from-gray-900/80 via-gray-950/80 to-black/80 backdrop-blur-md mt-4 rounded-xl border border-gray-800/70 shadow-lg sticky top-0 z-30">
                <div className="max-w-2xl mx-auto flex gap-4 justify-center py-2 px-2">
                    {[
                        { id: 'search', label: 'Search', icon: Search },
                        { id: 'global', label: 'Add', icon: Plus },
                        // { id: 'sessions', label: 'Sessions', icon: Users },
                        // { id: 'library', label: 'My Library', icon: Music },
                        { id: 'user', label: 'User', icon: LogOut },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as ActiveTab)}
                            className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${activeTab === id
                                ? 'bg-gray-800/70 text-purple-200 font-bold shadow'
                                : 'text-gray-300 hover:text-purple-200 hover:bg-gray-800/40'
                                }`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
            {/* Mobile bottom nav */}
            <nav className="
                fixed
                bottom-0
                left-0
                right-0
                z-30
                bg-gradient-to-r
                from-gray-900/90
                via-gray-950/90
                to-black/90
                backdrop-blur-md
                border-t
                border-gray-800/80
                flex
                md:hidden
                justify-around
                py-1
                shadow-t-xl"
            >
                {[
                    { id: 'search', label: 'Search', icon: Search },
                    { id: 'global', label: 'Add', icon: Plus },
                    // { id: 'sessions', label: 'Sessions', icon: Users },
                    // { id: 'library', label: 'Library', icon: Music },
                    { id: 'user', label: 'User', icon: UserIcon },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as ActiveTab)}
                        className={`flex flex-col flex-1 items-center px-2 py-2 m-2 text-xs transition-colors rounded-lg ${activeTab === id
                            ? 'text-purple-300 font-bold bg-gray-800/60 shadow'
                            : 'text-gray-400 hover:text-purple-200 hover:bg-gray-800/40'
                            }`}
                        aria-label={label}
                    >
                        <Icon size={22} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </>
    )
}