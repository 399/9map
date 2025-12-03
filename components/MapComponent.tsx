'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Place } from '@/types';

interface MapComponentProps {
    places: Place[];
    onMarkerClick: (place: Place) => void;
}

export interface MapRef {
    resetLocation: () => void;
}

const MapComponent = forwardRef<MapRef, MapComponentProps>(({ places, onMarkerClick }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstance = useRef<any>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markersRef = useRef<any[]>([]);

    useImperativeHandle(ref, () => ({
        resetLocation: () => {
            if (mapInstance.current) {
                mapInstance.current.plugin('AMap.Geolocation', function () {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const geolocation = new (window as any).AMap.Geolocation({
                        enableHighAccuracy: true,
                        timeout: 10000,
                        zoomToAccuracy: true,
                    });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    geolocation.getCurrentPosition((status: string, result: any) => {
                        if (status === 'complete') {
                            mapInstance.current.setCenter(result.position);
                            mapInstance.current.setZoom(15);
                        }
                    });
                });
            }
        },
    }));

    useEffect(() => {
        if (!mapContainer.current) return;

        // AMap Security Configuration
        (window as any)._AMapSecurityConfig = {
            securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE,
        };

        AMapLoader.load({
            key: process.env.NEXT_PUBLIC_AMAP_KEY || '',
            version: '2.0',
            plugins: ['AMap.Geolocation', 'AMap.Scale', 'AMap.ToolBar'],
        })
            .then((AMap) => {
                const map = new AMap.Map(mapContainer.current, {
                    viewMode: '3D',
                    zoom: 11,
                    center: [121.4737, 31.2304], // Default Shanghai
                });

                mapInstance.current = map;
                setIsMapReady(true);

                // Geolocation on load
                map.plugin('AMap.Geolocation', function () {
                    const geolocation = new AMap.Geolocation({
                        enableHighAccuracy: true,
                        timeout: 10000,
                        zoomToAccuracy: true,
                        position: 'RB',
                    });
                    map.addControl(geolocation);
                    geolocation.getCurrentPosition();
                });
            })
            .catch((e) => {
                console.error('Map loading failed', e);
            });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.destroy();
            }
        };
    }, []);

    // Update markers when places change
    useEffect(() => {
        if (!isMapReady || !mapInstance.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        places.forEach((place) => {
            const marker = new AMap.Marker({
                position: new AMap.LngLat(place.location[0], place.location[1]),
                title: place.name,
            });

            marker.on('click', () => {
                onMarkerClick(place);
            });

            marker.setMap(mapInstance.current);
            markersRef.current.push(marker);
        });
    }, [places, isMapReady, onMarkerClick]);

    return <div ref={mapContainer} className="w-full h-full" />;
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
