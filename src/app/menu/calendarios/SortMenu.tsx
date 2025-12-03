import React, { useState } from 'react';
import { useI18n } from '@/app/i18n-provider';

type SortOption = {
  label: string;
  value: string;
};

type SortMenuProps = {
  options: SortOption[];
  currentSort: { sortBy: string; sortOrder: 'asc' | 'desc' };
  onSortChange: (sort: { sortBy: string; sortOrder: 'asc' | 'desc' }) => void;
};

export default function SortMenu({ options, currentSort, onSortChange }: SortMenuProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleSortChange = (sortBy: string) => {
    let newSortOrder: 'asc' | 'desc' = 'asc';
    if (currentSort.sortBy === sortBy) {
      newSortOrder = currentSort.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    onSortChange({ sortBy, sortOrder: newSortOrder });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label={t('manageContributions.ariaLabels.openSortMenu')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75M3 18H12" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {option.label}
              {currentSort.sortBy === option.value && (
                <span>{currentSort.sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
