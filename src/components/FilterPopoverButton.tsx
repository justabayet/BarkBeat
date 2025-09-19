import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterPopoverButtonProps {
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
}

const FilterPopoverButton: React.FC<FilterPopoverButtonProps> = ({ onClick, className }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1 px-2 py-1 rounded-full border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs font-semibold shadow ${className || ''}`}
        aria-label="Show filters"
    >
        <ChevronDown size={24} />
    </button>
);

export default FilterPopoverButton;
