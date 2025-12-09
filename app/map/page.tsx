'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import PlaceSheet from '@/components/PlaceSheet';
import { Place } from '@/types';
import { Locate, ArrowLeft } from 'lucide-react';
import { MapRef } from '@/components/MapComponent';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
});

import { useSearchParams } from 'next/navigation';
// ... other imports

function MapContent() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<MapRef>(null);
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city');

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const res = await fetch('/api/places');
        const data = await res.json();
        const allPlaces: Place[] = data.data;

        // Filter by city if param exists
        const filteredByCity = cityParam
          ? allPlaces.filter(p => (p.city || '上海市') === cityParam)
          : allPlaces;

        setPlaces(filteredByCity);
      } catch (error) {
        console.error('Failed to fetch places:', error);
      }
    }
    fetchPlaces();
  }, [cityParam]);

  const filteredPlaces = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return places.filter(
      (place) =>
        place.name.toLowerCase().includes(lowerQuery) ||
        place.address.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, places]);

  const handleResetLocation = () => {
    if (mapRef.current) {
      mapRef.current.resetLocation();
    }
  };

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden">
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-3 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto w-12 h-12 bg-white/80 backdrop-blur-md rounded-card shadow-soft-1 flex items-center justify-center text-gray-600 hover:text-apricot transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1 pointer-events-auto">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      <MapComponent
        ref={mapRef}
        places={filteredPlaces}
        onMarkerClick={setSelectedPlace}
        selectedPlaceId={selectedPlace?.id}
        targetCity={cityParam || undefined}
      />

      <button
        onClick={handleResetLocation}
        className="absolute bottom-24 right-4 z-10 p-4 bg-white/90 backdrop-blur-md rounded-full shadow-soft-1 hover:shadow-soft-2 hover:scale-105 transition-all duration-300 active:scale-95"
        aria-label="重置位置"
      >
        <Locate className="w-6 h-6 text-blue-600" />
      </button>

      <PlaceSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-gray-100 flex items-center justify-center">Loading...</div>}>
      <MapContent />
    </Suspense>
  );
}
