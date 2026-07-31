// src/components/common/LocationDropdown.tsx
'use client';

import { useState, useEffect, useRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
} from '@floating-ui/react';
import { MapPin, X, ChevronRight, Search } from 'lucide-react';

interface State {
  state_id: number;
  state_name: string;
}

interface LGA {
  lga_id: number;
  lga_name: string;
}

interface LocationDropdownProps {
  onSelectState: (stateId: string, stateName: string) => void;
  onSelectLga: (lgaId: string, lgaName: string) => void;
  onClear: () => void;
  onClose: () => void;
  preloadedStates: State[];
  preloadedLgas: Record<string, LGA[]>;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function LocationDropdown({
  onSelectState,
  onSelectLga,
  onClear,
  onClose,
  preloadedStates,
  preloadedLgas,
  triggerRef,
}: LocationDropdownProps) {
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [showLgas, setShowLgas] = useState(false);
  const [lgaSearch, setLgaSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Ensure portal target exists (only on client)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Floating UI — handles positioning, flipping, viewport awareness
  const {
    refs,
    floatingStyles,
    context,
  } = useFloating({
    elements: {
      reference: triggerRef?.current ?? null,
    },
    placement: 'bottom-start',
    middleware: [
      offset(6),
      flip({ padding: 8, fallbackPlacements: ['top-start', 'bottom-end'] }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          // Constrain dropdown height to available viewport space
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(200, availableHeight)}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate, // Auto-updates on scroll/resize
    open: true,
  });

  // Close on scroll outside the dropdown
  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (
        refs.floating.current &&
        refs.floating.current.contains(e.target as Node)
      ) {
        return;
      }
      onClose();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [onClose, refs.floating]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset LGA search when state changes
  useEffect(() => {
    setLgaSearch('');
  }, [selectedStateId]);

  const handleStateClick = (stateId: string) => {
    setSelectedStateId(stateId);
    setShowLgas(true);
  };

  const handleLgaClick = (lgaId: string, lgaName: string) => {
    onSelectLga(lgaId, lgaName);
    onClose();
  };

  const handleBack = () => {
    setShowLgas(false);
    setSelectedStateId('');
  };

  const handleSelectEntireState = () => {
    const state = preloadedStates.find(
      (s) => s.state_id.toString() === selectedStateId
    );
    if (state) {
      onSelectState(selectedStateId, state.state_name);
      onClose();
    }
  };

  const handleSelectAllNigeria = () => {
    onClear();
    onClose();
  };

  const currentLgas = preloadedLgas[selectedStateId] || [];

  const filteredLgas = lgaSearch
    ? currentLgas.filter((lga) =>
        lga.lga_name.toLowerCase().includes(lgaSearch.toLowerCase())
      )
    : currentLgas;

  if (!mounted) return null;

  const dropdown = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[99998]" onClick={onClose} />

      {/* Dropdown panel */}
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="z-[99999] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-[288px] max-w-[calc(100vw-2rem)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">
            {showLgas ? 'Select LGA' : 'Select Location'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div ref={listRef} className="overflow-y-auto">
          {!showLgas ? (
            /* ── States List ── */
            <div>
              <button
                onClick={handleSelectAllNigeria}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-green-50/80 transition-colors"
              >
                <MapPin className="h-4 w-4 text-primary-600" />
                <span className="font-medium text-gray-900">All Nigeria</span>
              </button>
              {preloadedStates.map((state) => (
                <button
                  key={state.state_id}
                  onClick={() =>
                    handleStateClick(state.state_id.toString())
                  }
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50/80 transition-colors flex items-center justify-between"
                >
                  {state.state_name}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          ) : (
            /* ── LGAs List ── */
            <div>
              <button
                onClick={handleBack}
                className="w-full text-left px-4 py-2.5 text-sm text-primary-600 hover:bg-green-50/80 font-medium flex items-center gap-1 border-b border-gray-100"
              >
                ← Back to States
              </button>
              <button
                onClick={handleSelectEntireState}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50/80 font-medium border-b border-gray-100"
              >
                Entire{' '}
                {
                  preloadedStates.find(
                    (s) => s.state_id.toString() === selectedStateId
                  )?.state_name
                }
              </button>

              {/* LGA Search (only shows when > 10 LGAs) */}
              {currentLgas.length > 10 && (
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={lgaSearch}
                      onChange={(e) => setLgaSearch(e.target.value)}
                      placeholder="Search LGA..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {filteredLgas.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-500 text-center">
                  {lgaSearch
                    ? 'No LGAs match your search'
                    : 'No LGAs found'}
                </p>
              ) : (
                filteredLgas.map((lga) => (
                  <button
                    key={lga.lga_id}
                    onClick={() =>
                      handleLgaClick(lga.lga_id.toString(), lga.lga_name)
                    }
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50/80 transition-colors"
                  >
                    {lga.lga_name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(dropdown, document.body);
}