"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, SearchX } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { SearchBar } from "@/components/discover/SearchBar";
import { FilterPanel } from "@/components/discover/FilterPanel";
import { DiscoverTripCard } from "@/components/trips/DiscoverTripCard";
import { useDiscoverTrips } from "@/hooks/useTrips";

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [destination, setDestination] = useState(
    searchParams.get("destination") || "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || [],
  );
  const [minDuration, setMinDuration] = useState<number | undefined>(
    searchParams.get("minDuration")
      ? Number(searchParams.get("minDuration"))
      : undefined,
  );
  const [maxDuration, setMaxDuration] = useState<number | undefined>(
    searchParams.get("maxDuration")
      ? Number(searchParams.get("maxDuration"))
      : undefined,
  );

  const updateUrlParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(window.location.search);

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });

      const paramsString = newParams.toString();
      const newUrl = paramsString ? `/discover?${paramsString}` : "/discover";
      if (newUrl !== window.location.pathname + window.location.search) {
        router.replace(newUrl, { scroll: false });
      }
    },
    [router],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateUrlParams({ search: value || undefined });
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    updateUrlParams({ destination: value || undefined });
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    updateUrlParams({ tags: tags.length > 0 ? tags.join(",") : undefined });
  };

  const handleDurationChange = (min?: number, max?: number) => {
    setMinDuration(min);
    setMaxDuration(max);
    updateUrlParams({
      minDuration: min?.toString(),
      maxDuration: max?.toString(),
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setDestination("");
    setSelectedTags([]);
    setMinDuration(undefined);
    setMaxDuration(undefined);
    router.replace("/discover");
  };

  const filters = useMemo(
    () => ({
      search: search || undefined,
      destination: destination || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      minDuration,
      maxDuration,
    }),
    [search, destination, selectedTags, minDuration, maxDuration],
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useDiscoverTrips(filters);

  const trips = data?.pages.flatMap((page) => page?.trips ?? []) ?? [];
  const isEmpty = !isLoading && trips.length === 0;

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b-2 border-[#1A1A1A] bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5">
          <h1 className="font-display font-bold text-2xl text-[#111] mb-0.5">
            Discover Trips
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Browse public trips from travelers around the world for inspiration
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 lg:shrink-0">
            <div className="lg:sticky lg:top-20">
              <FilterPanel
                destination={destination}
                tags={selectedTags}
                minDuration={minDuration}
                maxDuration={maxDuration}
                onDestinationChange={handleDestinationChange}
                onTagsChange={handleTagsChange}
                onDurationChange={handleDurationChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <SearchBar
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by destination or title..."
              />
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={40} className="animate-spin text-brand-blue" />
              </div>
            )}

            {isEmpty && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <SearchX size={64} className="text-zinc-300 mb-4" />
                <h3 className="text-xl font-bold text-[#111] mb-2">
                  No trips found
                </h3>
                <p className="text-zinc-600 mb-4">
                  Try adjusting your search or filters to find what you&apos;re
                  looking for
                </p>
              </div>
            )}

            {!isLoading && !isEmpty && (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
                  {trips.map((trip, index) => (
                    <DiscoverTripCard
                      key={trip._id}
                      trip={trip}
                      index={index}
                    />
                  ))}
                </div>

                {hasNextPage && (
                  <div
                    ref={inViewRef}
                    className="mt-8 flex justify-center py-4"
                  >
                    <Loader2
                      size={32}
                      className="animate-spin text-brand-blue"
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
