'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Place } from '@/types';

interface CityMap {
    id: string;
    title: string; // Chinese title
    englishTitle: string; // English title for background
    description: string;
    image: string;
    link: string;
    count: number;
    skyColor: string; // Background color for the "sky" behind text
}

export default function Gallery() {
    const [cities, setCities] = useState<CityMap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCities() {
            try {
                const res = await fetch('/api/places');
                const data = await res.json();
                const places: Place[] = data.data;

                // Group by city
                const cityGroups = places.reduce((acc, place) => {
                    const city = place.city || '上海市'; // Default fallback
                    if (!acc[city]) {
                        acc[city] = 0;
                    }
                    acc[city]++;
                    return acc;
                }, {} as Record<string, number>);

                // Convert to card format
                const cityCards: CityMap[] = Object.entries(cityGroups).map(([city, count]) => {
                    let displayTitle = city;
                    let englishTitle = 'CITY';
                    let imagePath = '/city/上海.jpg'; // Default fallback
                    let skyColor = 'bg-blue-200'; // Default sky

                    // Mapping logic
                    if (city.includes('上海')) {
                        displayTitle = '上海';
                        englishTitle = 'SHANGHAI';
                        imagePath = '/city/上海.jpg';
                        skyColor = 'bg-[#87CEEB]'; // Sky blue
                    } else if (city.includes('杭州')) {
                        displayTitle = '杭州';
                        englishTitle = 'HANGZHOU';
                        imagePath = '/city/杭州.png';
                        skyColor = 'bg-[#ADD8E6]';
                    } else if (city.includes('北京')) {
                        displayTitle = '北京';
                        englishTitle = 'BEIJING';
                    } else if (city.includes('深圳')) {
                        displayTitle = '深圳';
                        englishTitle = 'SHENZHEN';
                    } else if (city.includes('广州')) {
                        displayTitle = '广州';
                        englishTitle = 'GUANGZHOU';
                    } else if (city.includes('成都')) {
                        displayTitle = '成都';
                        englishTitle = 'CHENGDU';
                    }

                    return {
                        id: city,
                        title: displayTitle,
                        englishTitle,
                        description: `${count} 个好去处`,
                        image: imagePath,
                        link: `/map?city=${encodeURIComponent(city)}`,
                        count,
                        skyColor,
                    };
                });

                setCities(cityCards);
            } catch (error) {
                console.error('Failed to fetch cities:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchCities();
    }, []);

    return (
        <main className="min-h-screen bg-cream p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        9Map <span className="text-apricot">Gallery</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl">
                        发现城市的角落。选择一个地图开始探索。
                    </p>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[320px] bg-white/50 rounded-[32px] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cities.map((map) => (
                            <Link
                                key={map.id}
                                href={map.link}
                                className={`group relative block h-[320px] rounded-[32px] overflow-hidden shadow-soft-1 transition-all duration-500 ease-out hover:shadow-soft-2 hover:-translate-y-1 ${map.skyColor}`}
                            >
                                {/* 1. Text Layer (Behind Image) */}
                                <div className="absolute inset-x-0 top-12 text-center z-0">
                                    <h2 className="text-6xl font-black text-white tracking-widest font-sans select-none"
                                        style={{ fontFamily: 'Impact, sans-serif' }}>
                                        {map.englishTitle}
                                    </h2>
                                </div>

                                {/* 2. Image Layer (Foreground) */}
                                {/* Ensure your PNG has a transparent background for the text to show through! */}
                                <div className="absolute inset-0 z-10 pointer-events-none">
                                    <NextImage
                                        src={map.image}
                                        alt={map.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="transition-transform duration-700 group-hover:scale-105 object-cover"
                                        style={{
                                            bottom: '-40%',
                                            left: 0,
                                            objectPosition: 'center bottom', // Ensure alignment
                                        }}
                                        priority={cities.indexOf(map) < 3} // Prioritize first few images
                                    />
                                </div>

                                {/* 3. Info Overlay (Top Layer) */}
                                <div className="absolute inset-x-0 bottom-0 z-20 p-6 backdrop-blur-md bg-white/10 border-t border-white/20 rounded-b-[32px]">
                                    <div className="text-white">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl font-bold tracking-wide drop-shadow-md">{map.title}</span>
                                        </div>
                                        <p className="text-white/90 text-sm font-medium inline-block">
                                            {map.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Coming Soon Card */}
                        <div className="group relative block h-[320px] rounded-[32px] bg-gray-100 overflow-hidden shadow-soft-1 opacity-80 cursor-not-allowed border-2 border-dashed border-gray-300">
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                <div className="text-4xl mb-4">🚀</div>
                                <h2 className="text-xl font-bold">Coming Soon</h2>
                                <p className="text-sm">更多城市敬请期待...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
