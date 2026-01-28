import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  icon?: React.ElementType;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  options, 
  value, 
  onChange, 
  icon: Icon, 
  className, 
  buttonClassName, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value || placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 rounded-xl transition-all font-medium shadow-sm active:scale-95 duration-200 outline-none focus:ring-1 focus:ring-primary/50 relative z-10 ${buttonClassName || 'bg-bg-input border border-white/5 hover:border-white/10 text-gray-200 px-4 py-3 text-sm'}`}
      >
        <div className="flex items-center gap-2 truncate">
           {Icon && <Icon size={16} className="text-gray-400 shrink-0" />}
           <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] z-[100] overflow-hidden animate-fade-in"
        >
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${value === option.value ? 'bg-primary/20 text-primary-light font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                {option.label}
                {value === option.value && <Check size={14} className="text-primary-light"/>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};