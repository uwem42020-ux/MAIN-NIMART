// src/components/search/SortDropdown.tsx
import { ArrowUpDown } from 'lucide-react';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm">
      <ArrowUpDown className="h-4 w-4 text-gray-400 hidden sm:block" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none outline-none bg-transparent text-xs sm:text-sm font-medium text-gray-700 cursor-pointer w-full"
      >
        <option value="distance">Nearest first</option>
        <option value="rating">Highest rated</option>
        <option value="availability">Available now</option>
      </select>
    </div>
  );
}