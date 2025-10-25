'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

type CatalogCardProps = {
  colorClass: string;
  onEdit: () => void;
  onDelete: () => void;
  onCardClick?: () => void;
  children: ReactNode;
};

export default function CatalogCard({ colorClass, onEdit, onDelete, onCardClick, children }: CatalogCardProps) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between border-l-4 ${colorClass}`}>
      <div onClick={onCardClick} className={`flex-grow ${onCardClick ? 'cursor-pointer' : ''}`}>
        {children}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onEdit} className="p-2 rounded-full hover:bg-gray-100">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="p-2 rounded-full hover:bg-gray-100">
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}