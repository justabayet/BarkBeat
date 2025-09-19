import React from 'react';


interface PillProps {
    label: string;
    selected: boolean;
    onClick?: () => void;
    className?: string;
    color?: string; // tailwind color name, e.g. 'purple', 'blue', 'green', etc.
}

export const pillConfig = {
    mood: [
        { label: 'Party', color: 'pink' },
        { label: 'Chill', color: 'blue' },
        { label: 'Romantic', color: 'red' },
        { label: 'Energetic', color: 'orange' }
    ],
    language: [
        { label: 'English', color: 'purple' },
        { label: 'French', color: 'green' },
        { label: 'Spanish', color: 'yellow' },
        { label: 'Japanese', color: 'red' },
        { label: 'Korean', color: 'pink' }
    ],
    difficulty: [
        { label: 'Easy', value: 'easy', color: 'green' },
        { label: 'Intermediate', value: 'intermediate', color: 'yellow' },
        { label: 'Hard', value: 'hard', color: 'red' }
    ],
    newSongs: {
        key: "New Songs", label: "New Songs", color: "blue"
    }
}



export function getDifficulty(label: string): number {
    const key = label as keyof typeof difficultyMap;
    if (key in difficultyMap) {
        return difficultyMap[key];
    }
    return -1;
}
export function getDifficultyString(label: number): string | null {
    const entry = Object.entries(difficultyMap).find(([, value]) => value === label);
    if (entry) {
        return entry[0];
    }
    return null;
}

const difficultyMap = {
    Easy: 0,
    Intermediate: 1,
    Hard: 2
}

const colorMap: Record<string, { base: string; border: string; text: string; bg: string; bgSelected: string; textSelected: string; borderSelected: string }> = {
    purple: {
        base: 'text-purple-400',
        border: 'border-purple-400',
        text: 'text-purple-400',
        bg: 'bg-purple-950',
        bgSelected: 'bg-purple-700',
        textSelected: 'text-white',
        borderSelected: 'border-purple-400',
    },
    blue: {
        base: 'text-blue-400',
        border: 'border-blue-400',
        text: 'text-blue-400',
        bg: 'bg-blue-950',
        bgSelected: 'bg-blue-700',
        textSelected: 'text-white',
        borderSelected: 'border-blue-400',
    },
    green: {
        base: 'text-green-400',
        border: 'border-green-400',
        text: 'text-green-400',
        bg: 'bg-green-950',
        bgSelected: 'bg-green-700',
        textSelected: 'text-white',
        borderSelected: 'border-green-400',
    },
    yellow: {
        base: 'text-yellow-400',
        border: 'border-yellow-400',
        text: 'text-yellow-400',
        bg: 'bg-yellow-950',
        bgSelected: 'bg-yellow-600',
        textSelected: 'text-white',
        borderSelected: 'border-yellow-400',
    },
    red: {
        base: 'text-red-400',
        border: 'border-red-400',
        text: 'text-red-400',
        bg: 'bg-red-950',
        bgSelected: 'bg-red-700',
        textSelected: 'text-white',
        borderSelected: 'border-red-400',
    },
    pink: {
        base: 'text-pink-400',
        border: 'border-pink-400',
        text: 'text-pink-400',
        bg: 'bg-pink-950',
        bgSelected: 'bg-pink-700',
        textSelected: 'text-white',
        borderSelected: 'border-pink-400',
    },
    orange: {
        base: 'text-orange-400',
        border: 'border-orange-400',
        text: 'text-orange-400',
        bg: 'bg-orange-950',
        bgSelected: 'bg-orange-700',
        textSelected: 'text-white',
        borderSelected: 'border-orange-400',
    },
    slate: {
        base: 'text-slate-200',
        border: 'border-slate-400',
        text: 'text-slate-200',
        bg: 'bg-slate-800',
        bgSelected: 'bg-slate-600',
        textSelected: 'text-white',
        borderSelected: 'border-slate-400',
    },
}

const Pill: React.FC<PillProps> = ({ label, selected, onClick, className, color = 'slate' }) => {
    const c = colorMap[color] || colorMap['slate'];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-${color}-400 shadow-sm 
        ${selected ? `${c.bgSelected} ${c.textSelected} ${c.borderSelected}` : `${c.bg} ${c.text} ${c.border} hover:${c.bgSelected}`} 
        ${className || ''}`}
        >
            {label}
        </button>
    );
};

interface PillKnownProps {
    label: string
    category: string
    selected?: boolean
}
export const PillKnown: React.FC<PillKnownProps> = ({ label, category, selected = false }) => {
    if (category in pillConfig) {
        const configEntry = pillConfig[category as keyof typeof pillConfig];
        if (Array.isArray(configEntry)) {
            const found = configEntry.find((item) => item.label === label);
            if (found) {
                return <Pill label={label} selected={selected} color={found.color} />;
            }
        } else if (typeof configEntry === 'object' && configEntry !== null && 'label' in configEntry) {
            if (configEntry.label === label) {
                return <Pill label={label} selected={selected} color={configEntry.color} />;
            }
        }
    }

    return null;
}

export default Pill;
