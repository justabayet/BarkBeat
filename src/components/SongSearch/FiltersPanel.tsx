import { Popover } from "react-tiny-popover"
import FilterPopoverButton from "../FilterPopoverButton"
import Pill, { pillConfig } from "../Pill"
import useClickOutside from "@/hooks/useClickOutside"
import { useRef, useState, useCallback, Dispatch, SetStateAction } from "react"

interface FiltersPanelProps {
    selectedMoodTags: string[]
    setSelectedMoodTags: Dispatch<SetStateAction<string[]>>
    selectedLanguageTags: string[]
    setSelectedLanguageTags: Dispatch<SetStateAction<string[]>>
    difficulty: string | null
    setDifficulty: Dispatch<SetStateAction<string | null>>
    newOnly: boolean
    setNewOnly: Dispatch<SetStateAction<boolean>>
}

export default function FiltersPanel({
    selectedMoodTags,
    setSelectedMoodTags,
    selectedLanguageTags,
    setSelectedLanguageTags,
    difficulty,
    setDifficulty,
    newOnly,
    setNewOnly
}: FiltersPanelProps) {



    const popoverRef = useRef<HTMLDivElement>(null);
    const [isOpen, toggle] = useState(false);

    const close = useCallback(() => toggle(false), []);
    useClickOutside(popoverRef, close);

    return (
        <div className="relative mt-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch', width: '95%' }}>
                <Popover
                    isOpen={isOpen}
                    containerStyle={{
                        zIndex: '1000'
                    }}
                    positions={['bottom', 'right', 'top', 'left']} // preferred positions by priority
                    content={
                        <div ref={popoverRef} className="z-50 m-4 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-wrap gap-6">
                            {/* Mood tags */}
                            <div>
                                <label className="block text-s font-semibold mb-1 text-slate-200">Mood</label>
                                <div className="flex flex-wrap gap-2">
                                    {pillConfig.mood.map(opt => (
                                        <Pill
                                            key={opt.label}
                                            label={opt.label}
                                            color={opt.color}
                                            selected={selectedMoodTags.includes(opt.label)}
                                            onClick={() => setSelectedMoodTags(selectedMoodTags.includes(opt.label)
                                                ? selectedMoodTags.filter(t => t !== opt.label)
                                                : [...selectedMoodTags, opt.label])}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Language tags */}
                            <div>
                                <label className="block text-s font-semibold mb-1 text-slate-200">Language</label>
                                <div className="flex flex-wrap gap-2">
                                    {pillConfig.language.map(opt => (
                                        <Pill
                                            key={opt.label}
                                            label={opt.label}
                                            color={opt.color}
                                            selected={selectedLanguageTags.includes(opt.label)}
                                            onClick={() => setSelectedLanguageTags(selectedLanguageTags.includes(opt.label)
                                                ? selectedLanguageTags.filter(t => t !== opt.label)
                                                : [...selectedLanguageTags, opt.label])}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Difficulty */}
                            <div>
                                <label className="block text-s font-semibold mb-1 text-slate-200">Difficulty</label>
                                <div className="flex flex-wrap gap-2">
                                    {pillConfig.difficulty.map(opt => (
                                        <Pill
                                            key={opt.value}
                                            label={opt.label}
                                            color={opt.color}
                                            selected={difficulty === opt.value}
                                            onClick={() => setDifficulty(difficulty === opt.value ? null : opt.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* New only */}
                            <div>
                                <label className="block text-s font-semibold mb-1 text-slate-200">Miscellanous</label>
                                <div className="flex flex-wrap gap-2">
                                    <Pill
                                        key={pillConfig.newSongs.key}
                                        label={pillConfig.newSongs.label}
                                        color={pillConfig.newSongs.color}
                                        selected={newOnly}
                                        onClick={() => setNewOnly(v => !v)}
                                    />
                                </div>
                            </div>
                        </div>}
                >

                    <div className="left-0 sticky z-10">
                        <FilterPopoverButton onClick={() => {
                            // setFilterOpen(v => !v)
                            toggle((prev) => !prev)
                        }} />
                    </div>
                </Popover>
                {/* Show selected pills in a row */}
                {selectedMoodTags.map(label => {
                    const opt = pillConfig.mood.find(o => o.label === label)
                    return opt ? (
                        <Pill
                            key={label}
                            label={label}
                            color={opt.color}
                            selected
                            onClick={() => setSelectedMoodTags(selectedMoodTags.filter(t => t !== label))}
                        />
                    ) : null
                })}
                {selectedLanguageTags.map(label => {
                    const opt = pillConfig.language.find(o => o.label === label)
                    return opt ? (
                        <Pill
                            key={label}
                            label={label}
                            color={opt.color}
                            selected
                            onClick={() => setSelectedLanguageTags(selectedLanguageTags.filter(t => t !== label))}
                        />
                    ) : null
                })}
                {difficulty && (() => {
                    const opt = pillConfig.difficulty.find(o => o.value === difficulty)
                    return opt ? (
                        <Pill
                            key={opt.value}
                            label={opt.label}
                            color={opt.color}
                            selected
                            onClick={() => setDifficulty(null)}
                        />
                    ) : null
                })()}
                {newOnly && <Pill label={pillConfig.newSongs.label} color={pillConfig.newSongs.color} selected onClick={() => setNewOnly(false)} />}
            </div>
        </div>
    )
}