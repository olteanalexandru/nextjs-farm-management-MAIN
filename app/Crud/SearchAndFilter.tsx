"use client";

import { useState, useCallback } from 'react';
import { Form } from 'react-bootstrap';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter?: (filter: string) => void;
  filterOptions?: { value: string; label: string }[];
  placeholder?: string;
}

export default function SearchAndFilter({ 
  onSearch, 
  onFilter, 
  filterOptions,
  placeholder = "Search..." 
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => onSearch(query), 300),
    [onSearch]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  return (
    <div className="flex gap-4 mb-6">
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearch}
        className="max-w-md"
      />
      {filterOptions && onFilter && (
        <Form.Select 
          onChange={(e) => onFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All</option>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      )}
    </div>
  );
}
