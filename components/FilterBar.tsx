import React from 'react';
import { Coffee, ForkKnife, Stack } from '@phosphor-icons/react';

interface FilterBarProps {
    activeFilter: 'all' | 'restaurant' | 'drink';
    onFilterChange: (filter: 'all' | 'restaurant' | 'drink') => void;
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
    const filters: { id: 'all' | 'restaurant' | 'drink'; label: string; icon: React.ReactNode }[] = [
        { id: 'all', label: '全部', icon: <Stack size={16} weight="bold" /> },
        { id: 'restaurant', label: '美食', icon: <ForkKnife size={16} weight="bold" /> },
        { id: 'drink', label: '饮品', icon: <Coffee size={16} weight="bold" /> },
    ];

    return (
        <div className="absolute bottom-[140px] left-0 right-0 flex justify-center gap-3 z-[1500] pointer-events-none">
            {/* Adjusted to clear the ResultListSheet (approx 100-110px tall collapsed) */}
            <div className="flex bg-white/80 backdrop-blur-md rounded-full p-1.5 shadow-soft-1 pointer-events-auto border border-white/50">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    return (
                        <button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            className={`
                                flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300
                                ${isActive
                                    ? 'bg-gray-900 text-white shadow-md scale-105'
                                    : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
                                }
                            `}
                        >
                            {filter.icon}
                            {filter.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
