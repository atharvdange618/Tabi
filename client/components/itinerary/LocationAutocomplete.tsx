"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Search for a place…",
  className,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en", "User-Agent": "Tabi/1.0" },
      });
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 400);
  }

  function handleSelect(result: NominatimResult) {
    const parts = result.display_name.split(",");
    const neat = parts.slice(0, 2).join(",").trim();
    onChange(neat);
    setSuggestions([]);
    setOpen(false);
  }

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="border-2 border-[#1A1A1A] rounded-lg pr-8"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 size={14} className="animate-spin text-[#9CA3AF]" />
          ) : (
            <MapPin size={14} className="text-[#9CA3AF]" />
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A] overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((result) => (
            <li key={result.place_id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(result);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-cream transition-colors flex items-start gap-2"
              >
                <MapPin size={13} className="mt-0.5 shrink-0 text-[#9CA3AF]" />
                <span className="truncate">{result.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
