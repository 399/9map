import { useState, useEffect, useRef } from 'react';
import { Place } from '@/types';
import { X, Clock, MapPin, ChevronUp, ChevronDown, Quote } from 'lucide-react';

interface PlaceSheetProps {
    place: Place | null;
    onClose: () => void;
}

export default function PlaceSheet({ place, onClose }: PlaceSheetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    // Touch handling state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const initialHeight = useRef(0);
    const currentDelta = useRef(0);

    // Reset expanded state when place changes
    useEffect(() => {
        if (place) {
            setIsExpanded(false);
        }
    }, [place]);

    if (!place) return null;

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isExpanded) {
            setIsExpanded(false);
        } else {
            onClose();
        }
    };

    // Category helper
    const getCategoryIcon = () => {
        if (place.category === 'restaurant') return <img src="/icon/餐厅.png" className="w-8 h-8 object-contain" alt="餐厅" />;
        if (place.category === 'drink') return <img src="/icon/饮品甜点.png" className="w-8 h-8 object-contain" alt="饮品" />;
        if (place.category === 'snack') return <img src="/icon/快餐小吃.png" className="w-8 h-8 object-contain" alt="小吃" />;
        return <span className="text-2xl">📍</span>;
    };

    const getCategoryLabel = () => {
        if (place.category === 'restaurant') return '餐厅';
        if (place.category === 'drink') return '饮品甜点';
        if (place.category === 'snack') return '快餐小吃';
        return '其他';
    };

    const getCategoryColor = () => {
        if (place.category === 'restaurant') return 'bg-orange-100 text-orange-800';
        if (place.category === 'drink') return 'bg-blue-100 text-blue-800';
        if (place.category === 'snack') return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only enable drag on mobile (check width or user agent if needed, but here we rely on touch events)
        // Also ensure we are not dragging inner scrollable content if it's already expanded and scrolled
        // For simplicity, we enable drag on the header/handle area primarily, or the whole sheet if collapsed

        // If expanded, only allow drag on the handle area to avoid conflict with scrolling
        if (isExpanded) {
            const target = e.target as HTMLElement;
            if (!target.closest('.drag-handle-area')) return;
        }

        setIsDragging(true);
        dragStartY.current = e.touches[0].clientY;
        if (sheetRef.current) {
            initialHeight.current = sheetRef.current.offsetHeight;
            // Disable transition during drag
            sheetRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !sheetRef.current) return;

        const currentY = e.touches[0].clientY;
        const deltaY = dragStartY.current - currentY;
        currentDelta.current = deltaY;

        // Logic for dragging UP (expanding) from collapsed state
        if (!isExpanded) {
            // Phase 1: Expand Width & Stick to Bottom (0 -> 24px delta)
            // 24px is roughly 1.5rem (bottom-6)
            const phase1Threshold = 24;

            if (deltaY <= 0) {
                // Dragging down from collapsed - resistance or ignore
                return;
            }

            if (deltaY < phase1Threshold) {
                const progress = deltaY / phase1Threshold; // 0 -> 1

                // Interpolate styles
                // bottom: 1.5rem (24px) -> 0
                // left/right: 1rem (16px) -> 0
                const bottom = 24 - (24 * progress);
                const marginX = 16 - (16 * progress);

                sheetRef.current.style.bottom = `${bottom}px`;
                sheetRef.current.style.left = `${marginX}px`;
                sheetRef.current.style.right = `${marginX}px`;
                sheetRef.current.style.borderRadius = `${16 + (8 * progress)}px ${16 + (8 * progress)}px ${16 * (1 - progress)}px ${16 * (1 - progress)}px`; // Round top more, bottom less
            } else {
                // Phase 2: Expand Height (delta > 24px)
                // Fixed at bottom and full width
                sheetRef.current.style.bottom = '0px';
                sheetRef.current.style.left = '0px';
                sheetRef.current.style.right = '0px';
                sheetRef.current.style.borderRadius = '16px 16px 0 0';

                // Height growth
                // We want to reach 95vh eventually. 
                // Let's say we map the drag directly to height increase
                const newHeight = initialHeight.current + (deltaY - phase1Threshold);
                sheetRef.current.style.height = `${newHeight}px`;
                sheetRef.current.style.maxHeight = '95vh';
            }
        } else {
            // Logic for dragging DOWN (collapsing) from expanded state
            if (deltaY > 0) return; // Ignore dragging up further

            // We are dragging down, deltaY is negative
            // We want to shrink height first, then detach from edges

            // For simplicity in this direction, let's just shrink height until threshold
            const newHeight = initialHeight.current + deltaY; // deltaY is negative
            if (newHeight > 200) { // Min height
                sheetRef.current.style.height = `${newHeight}px`;
            }
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging || !sheetRef.current) return;
        setIsDragging(false);

        // Re-enable transition
        sheetRef.current.style.transition = '';

        // Clear inline styles so React state takes over
        sheetRef.current.style.bottom = '';
        sheetRef.current.style.left = '';
        sheetRef.current.style.right = '';
        sheetRef.current.style.height = '';
        sheetRef.current.style.maxHeight = '';
        sheetRef.current.style.borderRadius = '';

        // Determine snap
        const threshold = 100; // px
        if (!isExpanded) {
            // Expanding
            if (currentDelta.current > threshold) {
                setIsExpanded(true);
            }
        } else {
            // Collapsing
            if (currentDelta.current < -threshold) {
                setIsExpanded(false);
            }
        }
        currentDelta.current = 0;
    };

    return (
        <>
            {/* Backdrop for expanded state */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-500"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div
                ref={sheetRef}
                className={`fixed z-50 bg-white shadow-soft-1 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) overflow-hidden flex flex-col
                    ${isExpanded
                        ? 'inset-x-0 bottom-0 h-[95vh] rounded-t-2xl'
                        : 'left-4 right-4 bottom-6 rounded-card-lg max-h-[40vh] border border-white/50 bg-white/90 backdrop-blur-xl'
                    }`}
                onClick={!isExpanded ? handleExpand : undefined}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header / Handle */}
                <div className="relative p-6 pb-4 flex-shrink-0 drag-handle-area">

                    {/* Mobile Handle Bar */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 md:hidden">
                        <div className="w-10 h-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* Desktop Arrow (Hidden on Mobile) */}
                    <div
                        className="hidden md:flex absolute top-2 left-0 right-0 justify-center text-gray-400 cursor-pointer z-20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                    </div>

                    {/* Close Button */}
                    <div className="absolute top-6 right-6 z-10">
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Basic Info Header */}
                    <div className="flex items-start gap-4 pr-20 pt-2 md:pt-0">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                            {getCategoryIcon()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{place.name}</h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor()}`}>
                                    {getCategoryLabel()}
                                </span>
                                {place.tags && place.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className={`px-6 pb-8 overflow-y-auto flex-1 ${isExpanded ? 'pt-2' : ''}`}>

                    {/* Expanded Content */}
                    <div className={`space-y-6 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>

                        {/* Note Block (Quote Style) */}
                        {place.note && (
                            <div className="relative p-6 bg-gray-50 rounded-xl border border-gray-100">
                                <Quote className="absolute top-4 left-4 text-gray-300 w-6 h-6 transform -scale-x-100" />
                                <p className="text-gray-700 leading-relaxed pt-2 pl-4">
                                    {place.note}
                                </p>
                            </div>
                        )}

                        {/* Recommended Dishes */}
                        <div className="p-4 border border-gray-200 rounded-xl">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">推荐菜</h3>
                            <p className="text-gray-600">
                                {place.recommended_dishes || '暂无推荐'}
                            </p>
                        </div>

                        {/* Avoid Dishes */}
                        <div className="p-4 border border-gray-200 rounded-xl">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">避雷菜</h3>
                            <p className="text-gray-600">
                                {place.avoid_dishes || '暂无避雷'}
                            </p>
                        </div>

                        {/* Info Block */}
                        <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                            {/* Tags / Amenities */}
                            {place.tags && place.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {place.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Average Price */}
                            {place.average_price && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <span className="text-lg font-bold text-orange-500">¥</span>
                                    <span className="text-sm">人均 {place.average_price}</span>
                                </div>
                            )}

                            {/* Opening Hours */}
                            <div className="flex items-center gap-3 text-gray-600">
                                <Clock size={18} />
                                <span className="text-sm">{place.opening_hours || '暂无营业时间'}</span>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-3 text-gray-600">
                                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{place.address}</span>
                            </div>
                        </div>

                        {/* Spacer for bottom safe area */}
                        <div className="h-12" />
                    </div>

                    {/* Collapsed View Content */}
                    {!isExpanded && (
                        <div className="mt-4 flex flex-col gap-3">
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <MapPin size={16} />
                                <span className="truncate">{place.address}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
