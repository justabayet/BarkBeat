import React from 'react';


interface PillProps {
    label: string;
    selected: boolean;
    onClick: () => void;
    className?: string;
    color?: string; // tailwind color name, e.g. 'purple', 'blue', 'green', etc.
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
            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-${color}-400 shadow-sm 
        ${selected ? `${c.bgSelected} ${c.textSelected} ${c.borderSelected}` : `${c.bg} ${c.text} ${c.border} hover:${c.bgSelected}`} 
        ${className || ''}`}
        >
            {label}
        </button>
    );
};

export default Pill;
