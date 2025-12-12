import { useState, useEffect, useRef } from 'react';
import { Place } from '@/types';
import { X, Clock, MapPin, ChevronUp, ChevronDown, Quote, Utensils, Coffee, Sandwich, Store, CalendarPlus, CircleParking, Sofa } from 'lucide-react';

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
        onClose();
    };

    // Category helper
    const getCategoryIcon = () => {
        if (place.category === 'restaurant') return <Utensils className="w-8 h-8 text-orange-500" />;
        if (place.category === 'drink') return <Coffee className="w-8 h-8 text-blue-500" />;
        if (place.category === 'snack') return <Sandwich className="w-8 h-8 text-yellow-500" />;
        return <MapPin className="w-8 h-8 text-gray-500" />;
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

    const getTagIcon = (tag: string) => {
        if (tag.includes('连锁')) return <Store size={12} className="mr-1" />;
        if (tag.includes('预定')) return <CalendarPlus size={12} className="mr-1" />;
        if (tag.includes('停车')) return <CircleParking size={12} className="mr-1" />;
        if (tag.includes('包间')) return <Sofa size={12} className="mr-1" />;
        return null;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
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
        e.stopPropagation();
        if (!isDragging || !sheetRef.current) return;

        const currentY = e.touches[0].clientY;
        const deltaY = dragStartY.current - currentY;
        currentDelta.current = deltaY;

        // Constants for layout
        const INITIAL_BOTTOM = 24; // bottom-6
        const INITIAL_MARGIN = 16; // left-4 right-4
        const DOCK_DISTANCE = 200; // Distance to fully dock to edges

        // Logic for dragging UP (expanding) from collapsed state
        if (!isExpanded) {
            if (deltaY <= 0) return; // Ignore dragging down when collapsed

            // Calculate progress (0 to 1)
            // 0 = start, 1 = fully docked (but not necessarily full height)
            const progress = Math.min(Math.abs(deltaY) / DOCK_DISTANCE, 1);
            const easeProgress = progress; // Linear for now, or use easeOutQuad: 1 - (1 - progress) * (1 - progress)

            // Interpolate styles
            const currentBottom = INITIAL_BOTTOM * (1 - easeProgress);
            const currentMargin = INITIAL_MARGIN * (1 - easeProgress);

            // Calculate height to keep top under finger
            // newHeight = initialHeight + dragDist + (change in bottom)
            // We want the top edge to move exactly with deltaY
            // Top = ScreenH - Bottom - Height
            // DeltaTop = - DeltaBottom - DeltaHeight
            // We want DeltaTop = -deltaY (since deltaY is positive for up, top moves up/decreases)
            // -deltaY = - (Bottom_new - Bottom_init) - (Height_new - Height_init)
            // Height_new = Height_init + deltaY - (Bottom_new - Bottom_init)
            // Height_new = Height_init + deltaY + (Bottom_init - Bottom_new)
            const newHeight = initialHeight.current + deltaY + (INITIAL_BOTTOM - currentBottom);

            sheetRef.current.style.bottom = `${currentBottom}px`;
            sheetRef.current.style.left = `${currentMargin}px`;
            sheetRef.current.style.right = `${currentMargin}px`;

            // Border radius transition: 16px (all) -> 16px (top) 0px (bottom)
            // Actually initial is rounded-card-lg (usually 16px or 20px). Let's assume 20px.
            // Target is rounded-t-2xl (24px) and 0 bottom.
            // Let's smooth it:
            const topRadius = 20 + (4 * easeProgress); // 20 -> 24
            const bottomRadius = 20 * (1 - easeProgress); // 20 -> 0
            sheetRef.current.style.borderRadius = `${topRadius}px ${topRadius}px ${bottomRadius}px ${bottomRadius}px`;

            sheetRef.current.style.height = `${newHeight}px`;
            sheetRef.current.style.maxHeight = '95vh';

        } else {
            // Logic for dragging DOWN (collapsing) from expanded state
            if (deltaY > 0) return; // Ignore dragging up further

            // We are dragging down, deltaY is negative
            // Just shrink height for now, simple and effective
            const newHeight = initialHeight.current + deltaY;
            if (newHeight > 200) {
                sheetRef.current.style.height = `${newHeight}px`;
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
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

    const getTransitionStyle = () => {
        const ease = 'cubic-bezier(0.32, 0.72, 0, 1)';
        const duration = '400ms'; // Slightly slower for better visibility

        if (isExpanded) {
            // Expand: Width/Position first, Height second
            return `left ${duration} ${ease}, right ${duration} ${ease}, bottom ${duration} ${ease}, border-radius ${duration} ${ease}, height ${duration} ${ease} ${duration}, max-height ${duration} ${ease} ${duration}`;
        } else {
            // Collapse: Height first, Width/Position second
            return `height ${duration} ${ease}, max-height ${duration} ${ease}, left ${duration} ${ease} ${duration}, right ${duration} ${ease} ${duration}, bottom ${duration} ${ease} ${duration}, border-radius ${duration} ${ease} ${duration}`;
        }
    };

    return (
        <>
            {/* Backdrop for expanded state */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-500"
                    onClick={onClose}
                />
            )}

            <div

                ref={sheetRef}
                className={`fixed z-[2000] shadow-soft-1 overflow-hidden flex flex-col
                    ${isExpanded
                        ? 'inset-x-0 bottom-0 h-[95vh] rounded-t-2xl bg-[#ffffff85] backdrop-blur-md border-t border-white/50'
                        : 'left-4 right-4 bottom-6 rounded-card-lg max-h-[40vh] bg-[#ffffff85] backdrop-blur-md border border-white/50'
                    }`}
                style={{ transition: getTransitionStyle() }}
                // onClick={!isExpanded ? handleExpand : undefined} // Removed click-to-expand
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header / Handle */}
                <div className="relative p-6 pb-2 flex-shrink-0 drag-handle-area">

                    {/* Mobile Handle Bar */}
                    <div
                        className="absolute top-3 left-1/2 transform -translate-x-1/2 md:hidden p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-gray-400/50 rounded-full" />
                    </div>

                    {/* Desktop Arrow (Hidden on Mobile) */}
                    <div
                        className="hidden md:flex absolute top-2 left-0 right-0 justify-center text-gray-500 cursor-pointer z-20 hover:text-gray-700 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                    </div>

                    {/* Title Row */}
                    <div className="flex justify-between items-start mt-4 md:mt-2">
                        <h2 className={`text-[22px] font-bold text-gray-900 leading-tight pr-8 ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {place.name}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 -mr-2 -mt-2 rounded-full hover:bg-black/5 flex-shrink-0 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2 mt-3 mb-4">
                        {place.tags && place.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 text-[12px] font-medium rounded-full bg-white/60 text-gray-700 flex items-center border border-gray-200/50 backdrop-blur-sm">
                                {getTagIcon(tag)}
                                {tag}
                            </span>
                        ))}
                        {/* Fallback if no tags */}
                        {(!place.tags || place.tags.length === 0) && (
                            <span className="px-3 py-1 text-[12px] font-medium rounded-full bg-white/60 text-gray-500 border border-gray-200/50 backdrop-blur-sm">
                                暂无标签
                            </span>
                        )}
                    </div>

                    {/* Featured Box (Icon + Quote) */}
                    <div className="border border-gray-200 bg-white/40 rounded-xl p-4 flex gap-5 items-stretch">
                        {/* Left: Icon & Category */}
                        <div className="flex flex-col items-center justify-center gap-2 min-w-[60px]">
                            <div className="w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                                {getCategoryIcon()}
                            </div>
                            <span className={`px-3 py-1 text-[12px] font-medium rounded-md ${getCategoryColor()}`}>
                                {getCategoryLabel()}
                            </span>
                        </div>

                        {/* Right: Featured Text (Note/Recommendation) */}
                        <div className="flex-1 relative pl-2 flex flex-col justify-center">
                            <Quote className="text-gray-400 w-5 h-5 mb-1 transform -scale-x-100" />
                            <p className="text-gray-700 text-[14px] leading-relaxed line-clamp-3">
                                {place.note || place.recommended_dishes || '暂无详细介绍'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className={`px-6 pb-8 overflow-y-auto flex-1 ${isExpanded ? 'pt-2' : ''}`}>

                    {/* Expanded Content */}
                    <div className={`space-y-6 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>

                        {/* Note Block removed (moved to header) */}

                        {/* Recommended Dishes */}
                        <div className="p-0 border-0">
                            <h3 className="text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-400 rounded-full"></span>
                                推荐菜
                            </h3>
                            <p className="text-gray-600 text-[14px] leading-6 bg-white/40 p-4 rounded-xl border border-gray-100">
                                {place.recommended_dishes || '暂无推荐'}
                            </p>
                        </div>

                        {/* Avoid Dishes */}
                        <div className="p-0 border-0">
                            <h3 className="text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-gray-400 rounded-full"></span>
                                避雷菜
                            </h3>
                            <p className="text-gray-600 text-[14px] leading-6 bg-white/40 p-4 rounded-xl border border-gray-100">
                                {place.avoid_dishes || '暂无避雷'}
                            </p>
                        </div>

                        {/* Info Block */}
                        <div className="p-4 bg-white/40 border border-gray-100 rounded-xl space-y-4">
                            {/* Tags / Amenities */}
                            {place.tags && place.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {place.tags.map((tag, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white/60 text-gray-700 rounded-full text-[12px] border border-gray-200/50 backdrop-blur-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Average Price */}
                            {place.average_price && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <span className="text-lg font-bold text-orange-500">¥</span>
                                    <span className="text-[14px]">人均 {place.average_price}</span>
                                </div>
                            )}

                            {/* Opening Hours */}
                            <div className="flex items-center gap-3 text-gray-600">
                                <Clock size={16} />
                                <span className="text-[14px]">{place.opening_hours || '暂无营业时间'}</span>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-3 text-gray-600">
                                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                <span className="text-[14px] leading-snug">{place.address}</span>
                            </div>
                        </div>

                        {/* Spacer for bottom safe area */}
                        <div className="h-12" />
                    </div>

                    {/* Collapsed View Content - Removed Address Display */}
                </div>
            </div>
        </>
    );
}
