'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { renderToStaticMarkup } from 'react-dom/server';
import { ForkKnife, Hamburger, Coffee, MapPin } from '@phosphor-icons/react';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userLocation, setUserLocation] = useState<any>(null);
    const [locationFailed, setLocationFailed] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geolocationRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        resetLocation: () => {
            if (geolocationRef.current) {
                geolocationRef.current.getCurrentPosition();
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

                // Geolocation Logic with Fallback
                const initGeolocation = (useHighAccuracy: boolean) => {
                    map.plugin('AMap.Geolocation', function () {
                        // Cleanup previous instance if any (though we usually only have one active)
                        if (geolocationRef.current) {
                            map.removeControl(geolocationRef.current);
                        }

                        const geolocation = new AMap.Geolocation({
                            enableHighAccuracy: useHighAccuracy,
                            timeout: 10000,
                            position: 'RB',
                            offset: [10, 20],
                            zoomToAccuracy: false, // Handle zoom manually
                            showButton: false, // Hide default button
                        });

                        geolocation.on('complete', (result: any) => {
                            console.log(`📍 Geolocation Success (${useHighAccuracy ? 'High' : 'Low'} Accuracy):`, result);
                            setUserLocation(result);
                        });

                        geolocation.on('error', (err: any) => {
                            if (useHighAccuracy) {
                                console.warn('⚠️ High accuracy failed, falling back to low accuracy...', err);
                                initGeolocation(false);
                            } else {
                                console.warn('📍 Geolocation failed completely. Defaulting to map view.', err);
                                setLocationFailed(true);
                            }
                        });

                        map.addControl(geolocation);
                        geolocationRef.current = geolocation;
                        geolocation.getCurrentPosition();
                    });
                };

                // Start with high accuracy
                initGeolocation(true);
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
    const getMarkerContent = (place: Place, isSelected: boolean, clusterCount: number = 1) => {
        let IconComponent = MapPin;
        let iconColor = '#6b7280'; // gray-500

        if (place.category === 'restaurant') {
            IconComponent = ForkKnife;
            iconColor = '#374151'; // gray-700
        } else if (place.category === 'drink') {
            IconComponent = Coffee;
            iconColor = '#374151'; // gray-700
        } else if (place.category === 'snack') {
            IconComponent = Hamburger;
            iconColor = '#374151'; // gray-700
        }

        // Generate static HTML for the icon
        const iconHtml = renderToStaticMarkup(
            <IconComponent
                size={20}
                weight="bold"
                color={iconColor}
                style={{ display: 'block' }}
            />
        );

        const selectedShadow = '0 8px 20px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,165,0,0.6)';
        const normalShadow = '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)';

        const scale = isSelected ? 1.25 : 1;
        const shadow = isSelected ? selectedShadow : normalShadow;
        const zIndex = isSelected ? 999 : 1;

        // Container
        const container = document.createElement('div');
        container.className = 'marker-container';
        container.style.cssText = `
            transform: translateY(-50%) scale(${scale});
            z-index: ${zIndex};
            pointer-events: none; /* Pass through clicks on transparent area */
            width: 48px;
            height: 48px;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            transform-origin: center center;
            transition: transform 0.2s, z-index 0.2s; /* Add transition */
        `;

        // Icon Wrapper
        const iconDiv = document.createElement('div');
        iconDiv.className = 'marker-icon';
        iconDiv.style.cssText = `
            box-shadow: ${shadow};
            background-color: white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(0,0,0,0.05);
            position: relative;
            pointer-events: auto; /* Catch clicks on icon */
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        iconDiv.innerHTML = iconHtml;

        // Badge
        if (clusterCount > 1) {
            const badge = document.createElement('div');
            badge.style.cssText = `
                 position: absolute;
                 top: -6px;
                 right: -6px;
                 background-color: #EF4444;
                 color: white;
                 border-radius: 99px;
                 padding: 0 5px;
                 font-size: 11px;
                 font-weight: bold;
                 border: 1.5px solid white;
                 box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                 min-width: 18px;
                 height: 18px;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 z-index: 10;
             `;
            badge.textContent = `+${clusterCount - 1}`;
            iconDiv.appendChild(badge);
        }

        // Label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'marker-label';
        labelDiv.style.cssText = `
            opacity: ${isSelected ? 1 : 0.9};
            pointer-events: none;
            position: absolute;
            top: 110%;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            font-size: 14px;
            font-weight: 700;
            color: #000;
            text-shadow: -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 2px 4px rgba(0,0,0,0.3);
            transition: opacity 0.2s;
        `;
        labelDiv.innerText = place.name;

        container.appendChild(iconDiv);
        container.appendChild(labelDiv);

        // Events
        container.onmouseover = () => {
            container.style.transform = 'translateY(-50%) scale(1.25)';
            container.style.zIndex = '999';
            iconDiv.style.boxShadow = selectedShadow;
        };
        container.onmouseout = () => {
            container.style.transform = `translateY(-50%) scale(${scale})`;
            container.style.zIndex = `${zIndex}`;
            iconDiv.style.boxShadow = shadow;
        };

        // Click Handler (Directly on Icon)
        iconDiv.onclick = (e) => {
            e.stopPropagation(); // Stop bubbling (though AMap clickable:false should handle it)
            if (mapInstance.current) {
                const map = mapInstance.current;
                // Pan to location
                map.panTo(new (window as any).AMap.LngLat(place.location[0], place.location[1]));
                if (map.getZoom() < 17) map.setZoom(17);
            }
            onMarkerClick(place);
        };

        return container;
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
            if (zoom < 11) zoomLevel = 'low';
            else if (zoom < 16) zoomLevel = 'medium';

            mapContainer.current.setAttribute('data-zoom', zoomLevel);
        }

        // Keep track of markers that should remain (using representative Place IDs)
        const clustersToRender = new Map<string, { place: Place, count: number }>();
        const processedPlaceIds = new Set<string>();

        // Sort places: Selected place first (to ensure it becomes cluster head), then by latitude
        const sortedPlaces = [...places].sort((a, b) => {
            if (a.id === selectedPlaceId) return -1;
            if (b.id === selectedPlaceId) return 1;
            return b.location[1] - a.location[1]; // Stable deterministic sort
        });

        // Clustering Logic
        sortedPlaces.forEach(place => {
            if (processedPlaceIds.has(place.id)) return;

            const [lng, lat] = place.location;
            if (!bounds.contains(new AMap.LngLat(lng, lat))) return; // Skip invisible

            const pixel = map.lngLatToContainer(new AMap.LngLat(lng, lat));

            // Start a new cluster with this place as head
            let clusterCount = 1;
            processedPlaceIds.add(place.id);

            // Find neighbors
            sortedPlaces.forEach(neighbor => {
                if (place.id === neighbor.id || processedPlaceIds.has(neighbor.id)) return;

                const [nLng, nLat] = neighbor.location;
                // Basic bounds check first for speed
                if (!bounds.contains(new AMap.LngLat(nLng, nLat))) return;

                const nPixel = map.lngLatToContainer(new AMap.LngLat(nLng, nLat));
                const distance = Math.sqrt(Math.pow(pixel.x - nPixel.x, 2) + Math.pow(pixel.y - nPixel.y, 2));

                if (distance < 60) { // Cluster Threshold: 60px
                    clusterCount++;
                    processedPlaceIds.add(neighbor.id);
                }
            });

            // Add the head place to render list
            clustersToRender.set(place.id, { place, count: clusterCount });
        });

        // Render Clusters
        const activeMarkerIds = new Set<string>();

        clustersToRender.forEach(({ place, count }) => {
            activeMarkerIds.add(place.id);
            const [lng, lat] = place.location;
            let marker = markersRef.current.get(place.id);
            const isSelected = place.id === selectedPlaceId;

            // Check if updates are needed using extData
            const needsUpdate = !marker ||
                (marker.getExtData && marker.getExtData().isSelected !== isSelected) ||
                (marker.getExtData && marker.getExtData().count !== count);

            if (needsUpdate) {
                const content = getMarkerContent(place, isSelected, count);

                if (!marker) {
                    // Create new marker
                    marker = new AMap.Marker({
                        position: new AMap.LngLat(lng, lat),
                        content: content,
                        offset: new AMap.Pixel(0, 0),
                        anchor: 'center',
                        zIndex: isSelected ? 999 : 100,
                        clickable: false, // Critical: Disable AMap internal click handling so our DOM events work
                        extData: { id: place.id, isSelected, count }
                    });

                    marker.setMap(map);
                    markersRef.current.set(place.id, marker);
                } else {
                    // Update existing
                    marker.setContent(content);
                    marker.setExtData({ id: place.id, isSelected, count });

                    // Update Z-Index
                    const targetZIndex = isSelected ? 999 : 100;
                    if (typeof marker.setzIndex === 'function') marker.setzIndex(targetZIndex);
                    else if (typeof marker.setZIndex === 'function') marker.setZIndex(targetZIndex);

                    // Update position
                    marker.setPosition(new AMap.LngLat(lng, lat));
                }
            } else {
                // Just update position if needed (usually stable)
                marker.setPosition(new AMap.LngLat(lng, lat));
            }
        });

        // Cleanup markers that are NOT in the active render list
        markersRef.current.forEach((marker, id) => {
            if (!activeMarkerIds.has(id)) {
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
        if (!isMapReady || !mapInstance.current) return;
        if (!userLocation && !locationFailed) return; // Wait for geolocation result (success or fail)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;
        const map = mapInstance.current;
        const result = userLocation;

        let shouldCenterOnUser = false;

        if (result) {
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
                const userLocationLngLat = result.position; // AMap.LngLat
                const firstPlace = places[0];
                const placeLocation = new AMap.LngLat(firstPlace.location[0], firstPlace.location[1]);

                const distance = userLocationLngLat.distance(placeLocation); // Meters
                console.log('📍 Distance to first place:', distance, 'meters');

                if (distance < 50000) { // 50km threshold
                    shouldCenterOnUser = true;
                    console.log('📍 Within 50km, centering on user.');
                }
            }
        }

        console.log('📍 Should Center on User:', shouldCenterOnUser);

        if (shouldCenterOnUser && result) {
            // User is in the city -> Center on user
            console.log('📍 Centering on User Position:', result.position);
            map.setCenter(result.position);
            map.setZoom(13); // Position Lock Zoom Level
        } else {
            // User is NOT in the city OR Geolocation Failed -> Fit all places
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
            }
        }
    }, [isMapReady, userLocation, locationFailed, places, targetCity]);

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

    return (
        <div className="relative w-full h-full">
            {/* Top Gradient Mask (Smooth 8-point) */}
            <div
                className="absolute top-0 left-0 right-0 h-40 pointer-events-none z-[5]"
                style={{
                    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 10%, rgba(255, 255, 255, 0.85) 20%, rgba(255, 255, 255, 0.65) 35%, rgba(255, 255, 255, 0.35) 60%, rgba(255, 255, 255, 0.15) 80%, rgba(255, 255, 255, 0) 100%)'
                }}
            />

            {/* Bottom Gradient Mask (Smooth 8-point) */}
            <div
                className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-[5]"
                style={{
                    background: 'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 10%, rgba(255, 255, 255, 0.85) 20%, rgba(255, 255, 255, 0.65) 35%, rgba(255, 255, 255, 0.35) 60%, rgba(255, 255, 255, 0.15) 80%, rgba(255, 255, 255, 0) 100%)'
                }}
            />

            {/* City Title Overlay */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[5] pointer-events-none flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900 drop-shadow-sm">{targetCity || '上海'}</span>
            </div>

            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
