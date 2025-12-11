'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Place } from '@/types';

interface MapComponentProps {
    places: Place[];
    onMarkerClick: (place: Place) => void;
    selectedPlaceId?: string;
    targetCity?: string;
}

export interface MapRef {
    resetLocation: () => void;
}

const MapComponent = forwardRef<MapRef, MapComponentProps>(({ places, onMarkerClick, selectedPlaceId, targetCity }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstance = useRef<any>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markersRef = useRef<Map<string, any>>(new Map());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maskRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const borderRef = useRef<any>(null);

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
            plugins: ['AMap.Geolocation', 'AMap.Scale', 'AMap.ToolBar', 'AMap.DistrictSearch'],
        })
            .then((AMap) => {
                const map = new AMap.Map(mapContainer.current, {
                    viewMode: '3D',
                    zoom: 11,
                    center: [121.4737, 31.2304], // Default Shanghai
                    mapStyle: 'amap://styles/light',
                });

                // Set features to show only background and roads (hide buildings and points)
                map.setFeatures(['bg', 'road']);

                // Explicitly set style again to be sure
                map.setMapStyle('amap://styles/light');

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
                    // map.addControl(geolocation);
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

    // Helper to generate marker content
    const getMarkerContent = (place: Place, isSelected: boolean) => {
        let iconContent = '';

        // Increased icon size to 32px (from 28px)
        if (place.category === 'restaurant') {
            iconContent = `<img src="/icon/餐厅.png" style="width: 32px; height: 32px; object-fit: contain;" />`;
        } else if (place.category === 'drink') {
            iconContent = `<img src="/icon/饮品甜点.png" style="width: 32px; height: 32px; object-fit: contain;" />`;
        } else if (place.category === 'snack') {
            iconContent = `<img src="/icon/快餐小吃.png" style="width: 32px; height: 32px; object-fit: contain;" />`;
        } else {
            iconContent = '<div style="font-size: 28px;">📍</div>';
        }

        const selectedShadow = '0 8px 20px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,165,0,0.6)';
        const normalShadow = '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)';

        const scale = isSelected ? 1.25 : 1;
        const shadow = isSelected ? selectedShadow : normalShadow;
        const zIndex = isSelected ? 999 : 1;

        return `
        <div class="marker-container" style="
          transform: translateY(-50%) scale(${scale});
          z-index: ${zIndex};
        " 
        onmouseover="
          this.style.transform='translateY(-50%) scale(1.25)';
          this.style.zIndex='999';
          this.firstElementChild.style.boxShadow='${selectedShadow}';
        " 
        onmouseout="
          this.style.transform='translateY(-50%) scale(${scale})';
          this.style.zIndex='${zIndex}';
          this.firstElementChild.style.boxShadow='${shadow}';
        ">
          <div class="marker-icon" style="
            box-shadow: ${shadow};
          ">
            ${iconContent}
          </div>
          <div class="marker-label" style="
            opacity: ${isSelected ? 1 : 0.9};
          ">${place.name}</div>
        </div>
      `;
    };

    // Debounce function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const debounce = (func: any, wait: number) => {
        let timeout: NodeJS.Timeout;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    // Update visible markers based on viewport
    const updateVisibleMarkers = useCallback(() => {
        if (!mapInstance.current || places.length === 0) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;
        const map = mapInstance.current;
        const bounds = map.getBounds();
        const zoom = map.getZoom();

        // Update zoom level attribute for CSS styling
        if (mapContainer.current) {
            let zoomLevel = 'high';
            if (zoom < 14) zoomLevel = 'low';
            else if (zoom < 16) zoomLevel = 'medium';

            mapContainer.current.setAttribute('data-zoom', zoomLevel);
        }

        // Keep track of markers that should remain
        const markersToKeep = new Set<string>();

        places.forEach((place) => {
            const [lng, lat] = place.location;
            const isVisible = bounds.contains(new AMap.LngLat(lng, lat));

            let marker = markersRef.current.get(place.id);

            if (isVisible) {
                markersToKeep.add(place.id);
                if (!marker) {
                    // Create marker if it doesn't exist
                    const isSelected = place.id === selectedPlaceId;
                    const content = getMarkerContent(place, isSelected);

                    marker = new AMap.Marker({
                        position: new AMap.LngLat(lng, lat),
                        content: content,
                        offset: new AMap.Pixel(0, 0), // Adjusted to match getMarkerContent's translateY(-50%)
                        anchor: 'center',
                        zIndex: isSelected ? 999 : 100,
                        extData: { id: place.id }
                    });

                    marker.on('click', () => {
                        map.panTo(new AMap.LngLat(lng, lat));
                        if (map.getZoom() < 17) map.setZoom(17);
                        onMarkerClick(place);
                    });

                    marker.setMap(map);
                    markersRef.current.set(place.id, marker);
                } else {
                    // Update existing marker if its content needs to change (e.g., selection state)
                    const isSelected = place.id === selectedPlaceId;
                    const currentContent = marker.getContent();
                    const newContent = getMarkerContent(place, isSelected);
                    if (currentContent !== newContent) {
                        marker.setContent(newContent);
                    }
                    // Update zIndex if selection state changed
                    const currentZIndex = typeof marker.getzIndex === 'function' ? marker.getzIndex() : marker.getZIndex();
                    const targetZIndex = isSelected ? 999 : 100;
                    if (currentZIndex !== targetZIndex) {
                        if (typeof marker.setzIndex === 'function') {
                            marker.setzIndex(targetZIndex);
                        } else if (typeof marker.setZIndex === 'function') {
                            marker.setZIndex(targetZIndex);
                        }
                    }
                }
            }
        });

        // Remove markers that are no longer visible or no longer in the places array
        markersRef.current.forEach((marker, id) => {
            if (!markersToKeep.has(id)) {
                marker.setMap(null);
                markersRef.current.delete(id);
            }
        });
    }, [places, onMarkerClick, selectedPlaceId, getMarkerContent]);

    // Debounced version of updateVisibleMarkers
    const debouncedUpdate = useCallback(debounce(updateVisibleMarkers, 100), [updateVisibleMarkers]);

    useEffect(() => {
        if (!isMapReady || !mapInstance.current) return;
        const map = mapInstance.current;

        // Initial update
        updateVisibleMarkers();

        // Listen to moveend and zoomend
        map.on('moveend', debouncedUpdate);
        map.on('zoomend', debouncedUpdate);

        return () => {
            map.off('moveend', debouncedUpdate);
            map.off('zoomend', debouncedUpdate);

            // Cleanup all markers when unmounting or places change significantly
            // So we need to handle "removed places" too.

            // Simple cleanup for safety:
            if (places.length === 0) {
                markersRef.current.forEach((marker) => marker.setMap(null));
                markersRef.current.clear();
            }
        };
    }, [places, isMapReady, selectedPlaceId, onMarkerClick]); // Re-run if these change

    // Efficiently update selected state without re-creating markers
    useEffect(() => {
        if (!isMapReady) return;

        markersRef.current.forEach((marker, id) => {
            const place = places.find(p => p.id === id);
            if (place) {
                const isSelected = id === selectedPlaceId;
                const content = getMarkerContent(place, isSelected);
                marker.setContent(content);

                // Safe zIndex setting (API v2 might use setzIndex or setTop)
                if (typeof marker.setzIndex === 'function') {
                    marker.setzIndex(isSelected ? 999 : 100);
                } else if (typeof marker.setZIndex === 'function') {
                    marker.setZIndex(isSelected ? 999 : 100);
                } else if (typeof marker.setTop === 'function') {
                    marker.setTop(isSelected);
                }
            }
        });
    }, [selectedPlaceId, isMapReady, places]);

    // Smart Location Centering
    useEffect(() => {
        if (!isMapReady || !mapInstance.current || places.length === 0) return;

        const map = mapInstance.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;

        map.plugin('AMap.Geolocation', function () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geolocation = new (window as any).AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 5000,
                zoomToAccuracy: false, // We handle zoom manually
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            geolocation.getCurrentPosition((status: string, result: any) => {
                console.log('📍 Geolocation Status:', status);
                console.log('📍 Geolocation Result:', result);

                let shouldCenterOnUser = false;

                if (status === 'complete' && result) {
                    // Strategy 1: Check City Name (Best for explicit city matching)
                    if (result.addressComponent) {
                        const userCity = result.addressComponent.city || result.addressComponent.province;
                        const target = targetCity || '上海市';

                        console.log('📍 User City:', userCity);
                        console.log('📍 Target City:', target);

                        if (userCity && target && (userCity.includes(target) || target.includes(userCity))) {
                            shouldCenterOnUser = true;
                        }
                    }

                    // Strategy 2: Distance Check (Fallback if city name fails or is blocked)
                    // If user is within 50km of the first place, assume they are in the same city.
                    if (!shouldCenterOnUser && result.position && places.length > 0) {
                        const userLocation = result.position; // AMap.LngLat
                        const firstPlace = places[0];
                        const placeLocation = new AMap.LngLat(firstPlace.location[0], firstPlace.location[1]);

                        const distance = userLocation.distance(placeLocation); // Meters
                        console.log('📍 Distance to first place:', distance, 'meters');

                        if (distance < 50000) { // 50km threshold
                            shouldCenterOnUser = true;
                            console.log('📍 Within 50km, centering on user.');
                        }
                    }
                }

                console.log('📍 Should Center on User:', shouldCenterOnUser);

                if (shouldCenterOnUser) {
                    // User is in the city -> Center on user
                    console.log('📍 Centering on User Position:', result.position);
                    map.setCenter(result.position);
                    map.setZoom(15);
                } else {
                    // User is NOT in the city (or geo failed) -> Fit all places
                    // Since we use viewport filtering, markers might not exist.
                    // We calculate bounds from data.
                    if (places.length > 0) {
                        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
                        places.forEach(p => {
                            const [lng, lat] = p.location;
                            if (lng < minLng) minLng = lng;
                            if (lng > maxLng) maxLng = lng;
                            if (lat < minLat) minLat = lat;
                            if (lat > maxLat) maxLat = lat;
                        });

                        const bounds = new AMap.Bounds(
                            new AMap.LngLat(minLng, minLat),
                            new AMap.LngLat(maxLng, maxLat)
                        );
                        map.setBounds(bounds);
                        // Adjust zoom slightly to ensure padding
                        // map.setFitView() usually does this, setBounds might be tight.
                        // But it's good enough for now.
                    }
                }
            });
        });
    }, [isMapReady, places, targetCity]); // Re-run when city changes

    // City Boundary Masking
    useEffect(() => {
        if (!isMapReady || !mapInstance.current) return;

        const map = mapInstance.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;
        const target = targetCity || '上海市';

        map.plugin('AMap.DistrictSearch', function () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const districtSearch = new (window as any).AMap.DistrictSearch({
                extensions: 'all', // Get detailed boundary
                level: 'city',     // Search by city level
                subdistrict: 0,    // No need for sub-districts
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            districtSearch.search(target, function (status: string, result: any) {
                if (status === 'complete' && result.districtList.length > 0) {
                    // Cleanup previous
                    if (maskRef.current) maskRef.current.setMap(null);
                    if (borderRef.current) borderRef.current.setMap(null);

                    const district = result.districtList[0];
                    const boundaries = district.boundaries;

                    if (boundaries) {
                        // Create "World with Hole" path
                        // Outer ring covers the whole world
                        const outer = [
                            new AMap.LngLat(-180, 90),
                            new AMap.LngLat(180, 90),
                            new AMap.LngLat(180, -90),
                            new AMap.LngLat(-180, -90),
                        ];

                        // AMap Polygon path structure: [outerRing, hole1, hole2, ...]
                        // Note: AMap v2 might treat multi-dimensional arrays differently.
                        // Usually it's [outer, hole] for a single polygon with holes.
                        // But boundaries can be multiple polygons (e.g. islands).

                        // We need to create a mask for EACH polygon if the city is disjointed, 
                        // OR create one massive polygon with multiple holes.
                        // Let's try creating one polygon with the outer ring and ALL boundaries as holes.

                        const pathArray = [outer];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        boundaries.forEach((boundary: any) => {
                            pathArray.push(boundary);
                        });

                        // Remove existing mask if any (we should track it in a ref, but for now just add new one)
                        // Ideally we should clear previous masks. 
                        // Let's use a specific ID or property if possible, or just clear all polygons? 
                        // No, that clears markers too if they are polygons.
                        // Better to store it in a ref.

                        // (Assuming we add a ref for the mask later, for now let's just draw it)

                        const mask = new AMap.Polygon({
                            path: pathArray,
                            strokeColor: 'none', // No border for the mask itself usually, or maybe a city border?
                            strokeWeight: 0,
                            fillColor: '#000',
                            fillOpacity: 0.3, // Darken outside areas
                            zIndex: 10, // Above base map, below markers (markers are usually 100+)
                            bubble: true, // Allow events to pass through? No, usually we want to block interaction? 
                            // Actually we want to highlight the city.
                        });

                        mask.setMap(map);
                        maskRef.current = mask;

                        // Also fit view to the city?
                        // map.setFitView([mask]); // This would fit the WORLD. Bad.

                        // We should fit view to the city boundary only.
                        // Create a polygon just for the city to fit view (invisible)
                        // const cityPolygon = new AMap.Polygon({ path: boundaries, visible: false });
                        // map.setFitView([cityPolygon]);

                        // Actually, let's just draw a border for the city too
                        const border = new AMap.Polygon({
                            path: boundaries,
                            strokeColor: '#3b82f6', // Blue-500
                            strokeWeight: 2,
                            strokeOpacity: 0.8,
                            fillOpacity: 0,
                            zIndex: 11,
                            bubble: true,
                        });
                        border.setMap(map);
                        borderRef.current = border;
                    }
                }
            });
        });
    }, [isMapReady, targetCity]);

    return <div ref={mapContainer} className="w-full h-full" />;
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
