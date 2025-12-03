'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import PlaceSheet from '@/components/PlaceSheet';
import { Place } from '@/types';
import { Locate } from 'lucide-react';
import { MapRef } from '@/components/MapComponent';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
});

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const res = await fetch('/api/places');
        const data = await res.json();
        setPlaces(data.data);
      } catch (error) {
        console.error('Failed to fetch places:', error);
      }
    }
    fetchPlaces();
  }, []);
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
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <MapComponent
        ref={mapRef}
        places={filteredPlaces}
        onMarkerClick={setSelectedPlace}
      />

      <button
        onClick={handleResetLocation}
        className="absolute bottom-24 right-4 z-10 p-3 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
