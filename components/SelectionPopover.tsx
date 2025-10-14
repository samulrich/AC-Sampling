import React, { useRef, useLayoutEffect, useEffect } from 'react';

interface Option {
    uuid: string;
    name: string;
}
interface SelectionPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    targetRect: DOMRect | null;
    options: Option[];
    onSelect: (option: Option) => void;
    title: string;
}

const SelectionPopover: React.FC<SelectionPopoverProps> = ({ isOpen, onClose, targetRect, options, onSelect, title }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    // Effect to position the popover
    useLayoutEffect(() => {
        if (isOpen && targetRect && popoverRef.current) {
            const popover = popoverRef.current;
            const { innerWidth, innerHeight } = window;
            const margin = 8;
            
            // Default position: below and left-aligned
            let top = targetRect.bottom + 4;
            let left = targetRect.left;

            // Adjust if it overflows the viewport
            if (top + popover.offsetHeight > innerHeight - margin) {
                // Position above if not enough space below
                top = targetRect.top - popover.offsetHeight - 4;
            }
            if (left + popover.offsetWidth > innerWidth - margin) {
                // Align to the right edge if not enough space on the right
                left = innerWidth - popover.offsetWidth - margin;
            }
            if (left < margin) {
                // Ensure it doesn't go off the left side
                left = margin;
            }
            if (top < margin) {
                // Ensure it doesn't go off the top side
                top = margin;
            }

            popover.style.top = `${top}px`;
            popover.style.left = `${left}px`;
            popover.style.opacity = '1';
        }
    }, [isOpen, targetRect]);

    // Effect to handle clicks outside to close the popover
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            ref={popoverRef} 
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 min-w-[180px] opacity-0 transition-opacity duration-150"
            role="dialog"
            aria-labelledby="popover-title"
        >
            <div className="p-2">
                <h3 id="popover-title" className="px-2 py-1 text-sm font-bold text-slate-700">{title}</h3>
                <div className="mt-1 max-h-48 overflow-y-auto">
                    {options.length > 0 ? options.map(option => (
                        <button
                            key={option.uuid}
                            onClick={() => onSelect(option)}
                            className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-800 transition-colors"
                        >
                            {option.name}
                        </button>
                    )) : <p className="text-sm text-slate-500 px-2 py-1">No options available.</p>}
                </div>
            </div>
        </div>
    );
};

export default SelectionPopover;
