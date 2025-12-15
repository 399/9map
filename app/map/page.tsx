'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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

  const handleResetLocation = () => {
    if (mapRef.current) {
      mapRef.current.resetLocation();
    }
  };

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden">
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 right-4 z-10 flex gap-3 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto w-12 h-12 bg-white/60 backdrop-blur-md rounded-full border border-white/50 flex items-center justify-center text-gray-700 hover:bg-white/80 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
      </div>

      <MapComponent
        ref={mapRef}
        places={places}
        onMarkerClick={setSelectedPlace}
        selectedPlaceId={selectedPlace?.id}
        targetCity={cityParam || undefined}
      />

      <button
        onClick={handleResetLocation}
        className="absolute bottom-24 right-4 z-10 p-3 bg-white/60 backdrop-blur-md rounded-full border border-white/50 hover:bg-white/80 transition-all duration-300 active:scale-95"
        aria-label="重置位置"
      >
        <Locate className="w-6 h-6 text-gray-700" />
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
