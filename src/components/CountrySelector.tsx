"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { COUNTRIES, Country } from '@/lib/constants/countries';

interface CountrySelectorProps {
  value: string; // Dial code (e.g., '+977')
  onChange: (dialCode: string) => void;
  className?: string;
  disabled?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ 
  value, 
  onChange, 
  className = '',
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.dial_code === value) || COUNTRIES[0];

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.dial_code.includes(search)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: Country) => {
    onChange(country.dial_code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 outline-none w-full h-full min-h-[44px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
            alt={selectedCountry.name}
            className="w-5 h-auto rounded-sm shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/40x30/6366f1/ffffff?text=${selectedCountry.code}`;
            }}
          />
          <span className="text-sm font-bold text-slate-700">{selectedCountry.dial_code}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[100] mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                autoFocus
                placeholder="Search country or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={`${country.code}-${country.dial_code}`}
                  onClick={() => handleSelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left ${value === country.dial_code ? 'bg-indigo-50/50' : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                    alt={country.name}
                    className="w-5 h-auto rounded-sm shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-wider">{country.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{country.dial_code}</p>
                  </div>
                  {value === country.dial_code && (
                    <Check size={14} className="text-indigo-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 bg-white">
                <Search size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No results</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
