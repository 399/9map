import { useState, useEffect, useRef } from 'react';
import { Place } from '@/types';
import { X, ClockCountdown, MapPinArea, CaretUp, CaretDown, Quotes, ForkKnife, Coffee, Hamburger, Storefront, CalendarPlus, LetterCircleP, Armchair, FinnTheHuman, Sparkle, MapPin, HandsClapping, ThumbsDown, Eyes } from '@phosphor-icons/react';

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
    const dragStartTime = useRef(0);
    const initialHeight = useRef(0);
    const currentDelta = useRef(0);
    const collapsedHeight = useRef(0);

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

    const handleCollapse = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsExpanded(false);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    // Get icon for category
    const getCategoryIcon = () => {
        const category = place.category;

        // Custom icon for "Restaurant"
        if (category === 'restaurant') {
            return (
                <img
                    src="/icon/noodles.png"
                    alt="餐厅"
                    className="w-16 h-16 object-contain"
                />
            );
        }

        // Default for other categories
        // Default for other categories
        switch (category) {
            case 'drink': return <Coffee size={24} className="text-gray-600" weight="bold" />;
            case 'snack': return <Hamburger size={24} className="text-gray-600" weight="bold" />;
            default: return <ForkKnife size={24} className="text-gray-600" weight="bold" />;
        }
    };
    const getCategoryLabel = () => {
        let label = '其他';
        if (place.category === 'restaurant') label = '餐厅';
        if (place.category === 'drink') label = '饮品甜点';
        if (place.category === 'snack') label = '快餐小吃';

        if (place.sub_category) {
            return `${label} · ${place.sub_category}`;
        }
        return label;
    };

    const getCategoryColor = () => {
        if (place.category === 'restaurant') return 'bg-orange-100 text-orange-800';
        if (place.category === 'drink') return 'bg-blue-100 text-blue-800';
        if (place.category === 'snack') return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getTagIcon = (tag: string) => {
        const TAG_ICONS: Record<string, React.ReactNode> = {
            '连锁': <Storefront size={14} className="text-gray-600" weight="bold" />,
            '可预定': <CalendarPlus size={14} className="text-gray-600" weight="bold" />,
            '可停车': <LetterCircleP size={14} className="text-gray-600" weight="bold" />,
            '有包间': <Armchair size={14} className="text-gray-600" weight="bold" />,
        };

        for (const key in TAG_ICONS) {
            if (tag.includes(key)) {
                return TAG_ICONS[key];
            }
        }
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
        dragStartTime.current = Date.now();

        if (sheetRef.current) {
            initialHeight.current = sheetRef.current.offsetHeight;

            // Capture collapsed height if we are starting from collapsed
            if (!isExpanded) {
                collapsedHeight.current = sheetRef.current.offsetHeight;
            }

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
            if (deltaY > 0) {
                // Dragging UP - Expand logic
                // Calculate progress (0 to 1)
                // 0 = start, 1 = fully docked (but not necessarily full height)
                const progress = Math.min(Math.abs(deltaY) / DOCK_DISTANCE, 1);
                const easeProgress = progress; // Linear for now

                // Interpolate styles
                const currentBottom = INITIAL_BOTTOM * (1 - easeProgress);
                const currentMargin = INITIAL_MARGIN * (1 - easeProgress);

                const newHeight = initialHeight.current + deltaY + (INITIAL_BOTTOM - currentBottom);

                sheetRef.current.style.bottom = `${currentBottom}px`;
                sheetRef.current.style.left = `${currentMargin}px`;
                sheetRef.current.style.right = `${currentMargin}px`;

                const topRadius = 20 + (4 * easeProgress); // 20 -> 24
                const bottomRadius = 20 * (1 - easeProgress); // 20 -> 0
                sheetRef.current.style.borderRadius = `${topRadius}px ${topRadius}px ${bottomRadius}px ${bottomRadius}px`;
                sheetRef.current.style.height = `${newHeight}px`;
                sheetRef.current.style.maxHeight = '95vh';
            } else {
                // Dragging DOWN - Close logic (deltaY is negative)
                const newBottom = INITIAL_BOTTOM + deltaY;
                sheetRef.current.style.bottom = `${newBottom}px`;
                // Keep other styles stable
                sheetRef.current.style.height = `${initialHeight.current}px`;
            }

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

        const currentY = e.changedTouches[0].clientY;
        const dragDuration = Date.now() - dragStartTime.current;
        const velocity = Math.abs(currentDelta.current) / dragDuration;

        const threshold = 100;
        let shouldExpand = isExpanded;
        let shouldClose = false;

        // Determine intended state
        if (!isExpanded) {
            if (currentDelta.current > threshold) {
                shouldExpand = true;
            } else {
                // Dragged DOWN (negative delta)
                const isLongDrag = currentDelta.current < -150; // Dragged down more than 150px
                const isFastFlick = currentDelta.current < -50 && velocity > 0.5; // Short fast flick

                if (isLongDrag || isFastFlick) {
                    shouldClose = true;
                }
            }
        } else {
            if (currentDelta.current < -threshold) {
                shouldExpand = false;
            }
        }

        // 1. Force Browser Reflow to ensure current position is acknowledged
        // This prevents the browser from jumping if it hasn't painted the last move frame
        void sheetRef.current.offsetHeight;

        // 2. Apply transition manually
        // Use a slightly longer curve for silky feel
        let duration = 500;
        const easing = 'cubic-bezier(0.32, 0.72, 0, 1)';

        // Slower duration for closing to ensure visibility
        if (shouldClose) {
            duration = 800; // Slower for visible exit
        }

        sheetRef.current.style.transition = `all ${duration}ms ${easing}`;

        // 3. Set Target Styles immediately
        if (shouldClose) {
            // Animate OFF SCREEN
            sheetRef.current.style.bottom = '-100vh'; // Move way down

            // Trigger onClose AFTER animation
            setTimeout(() => {
                onClose();
            }, duration);

            // Skip React State update and Cleanup as we are unmounting
            return;

        } else if (shouldExpand) {
            sheetRef.current.style.bottom = '0px';
            sheetRef.current.style.left = '0px';
            sheetRef.current.style.right = '0px';
            sheetRef.current.style.height = '95vh';
            sheetRef.current.style.maxHeight = '95vh';
            sheetRef.current.style.borderRadius = '24px 24px 0px 0px';
        } else {
            // Normal collapse state
            sheetRef.current.style.bottom = '24px';
            sheetRef.current.style.left = '16px';
            sheetRef.current.style.right = '16px';

            const targetH = collapsedHeight.current || 200;
            sheetRef.current.style.height = `${targetH}px`;
            sheetRef.current.style.maxHeight = '40vh';
            sheetRef.current.style.borderRadius = '38px';
        }

        // 4. Defer React State update to next frame to avoid jank during transition start
        requestAnimationFrame(() => {
            setIsExpanded(shouldExpand);
        });

        // 5. Cleanup after animation
        setTimeout(() => {
            if (sheetRef.current) {
                // Prevent transition from triggering when switching from inline styles to classes
                sheetRef.current.style.transition = 'none';

                // Force reflow to apply 'none'
                void sheetRef.current.offsetHeight;

                // Clear inline styles to let CSS classes take over
                sheetRef.current.style.bottom = '';
                sheetRef.current.style.left = '';
                sheetRef.current.style.right = '';
                sheetRef.current.style.height = '';
                sheetRef.current.style.maxHeight = '';
                sheetRef.current.style.borderRadius = '';

                // Restore transition after a tick (optional, if we want hover effects later)
                // But for now just clearing 'none' allows class-defined or default behavior
                setTimeout(() => {
                    if (sheetRef.current) {
                        sheetRef.current.style.transition = '';
                    }
                }, 10);
            }
        }, duration + 50); // slight buffer

        currentDelta.current = 0;
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
                className={`fixed z-[2000] shadow-soft-1 overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${isExpanded
                        ? 'inset-x-0 bottom-0 h-[95vh] rounded-t-2xl bg-[#ffffff85] backdrop-blur-md border-t border-white/50'
                        : 'left-4 right-4 bottom-6 rounded-card-lg max-h-[40vh] bg-[#ffffff85] backdrop-blur-md border border-white/50'
                    }`}
                // onClick={!isExpanded ? handleExpand : undefined} // Removed click-to-expand
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header / Handle */}
                <div className="relative p-4 pb-2 flex-shrink-0 drag-handle-area">

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
                        {isExpanded ? <CaretDown size={24} /> : <CaretUp size={24} />}
                    </div>

                    {/* Close Button (Absolute Top Right) */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100/50 transition-colors z-30"
                    >
                        <X size={24} className="text-gray-400" weight="bold" />
                    </button>

                    {/* Title Row */}
                    <div className="flex items-start mt-7 md:mt-2">
                        <h2 className={`text-[22px] font-bold text-gray-900 leading-tight pr-8 ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {place.name}
                        </h2>
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
                    {/* Featured Box (Redesigned: Silver Quality, Left/Right Split) */}
                    {/* Featured Box (Refined: Silver Layout) */}
                    {/* Featured Box (Refined: Unified Style with Left/Right Split) */}
                    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white/40">
                        {/* Removed Silver Glass Background div */}

                        <div className="relative flex h-full min-h-[140px]">
                            {/* Left Side (Auto width, min 35% - Category) */}
                            <div className="min-w-[35%] w-auto flex-shrink-0 flex flex-col items-center justify-center py-6 px-2 gap-3">
                                {/* Icon: No background/border as requested */}
                                <div className="flex items-center justify-center text-gray-700">
                                    {getCategoryIcon()}
                                </div>
                                {/* Label: Silver/White transition texture */}
                                <span className="px-3 py-1 text-[12px] font-medium rounded-full bg-gradient-to-br from-gray-100 via-white to-gray-200 border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-600 whitespace-nowrap">
                                    {getCategoryLabel()}
                                </span>
                            </div>

                            {/* Vertical Divider (Gradient + White Highlight) */}
                            <div className="w-px my-6 bg-gradient-to-b from-transparent via-gray-300/50 to-transparent shadow-[1px_0_0_0_rgba(255,255,255,0.7)]" />

                            {/* Right Side (Approx 65% - Content) */}
                            <div className="flex-1 p-5 flex flex-col">
                                {/* Eyes Icon (Phosphor) */}
                                <Eyes className="text-gray-800 w-5 h-5 mb-2" weight="fill" />

                                {/* Content Text: Matches Recommended Dishes CSS (text-gray-600 leading-6) */}
                                <p className="text-gray-600 text-[14px] leading-6 font-normal line-clamp-4">
                                    {place.note || place.recommended_dishes || '暂无特别推荐'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className={`px-4 pb-8 overflow-y-auto flex-1 overscroll-contain ${isExpanded ? 'pt-2' : ''}`}>

                    {/* Expanded Content */}
                    <div className={`space-y-6 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>

                        {/* Note Block removed (moved to header) */}

                        {/* Logic: If Featured Box is showing 'recommended_dishes' (because note is missing), don't show it again here */}
                        {/* Only show Recommended Dishes block if:
                            1. It has content
                            2. AND (Featured Box is showing 'note' OR (Featured Box is showing fallback text AND Place has recommended dishes))
                            Actually simpler: If place.note exists, Featured Box shows Note. Then we show Recommended here.
                            If place.note is missing, Featured Box shows Recommended. Then we hide this block.
                         */}
                        {place.recommended_dishes && place.note && (
                            <div className="relative p-5 rounded-2xl border bg-green-50/50 border-green-100/50 flex gap-4 overflow-hidden">
                                {/* Decor Icon - Absolute positioned "Sticker" feel */}
                                {/* Green HandsClapping */}
                                <div className="absolute top-[-6px] left-[-6px] opacity-20 transform -rotate-12">
                                    <HandsClapping size={64} weight="fill" className="text-green-600" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex gap-3 w-full">
                                    <HandsClapping size={24} weight="fill" className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="text-green-800 font-bold mb-1 text-[15px]">值得一试</div>
                                        <p className="text-green-700/80 text-[14px] leading-6 font-medium">
                                            {place.recommended_dishes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tags / Amenities */}

                        {/* Avoid Dishes */}
                        {place.avoid_dishes && (
                            <div className="relative p-5 rounded-2xl border bg-red-50/50 border-red-100/50 flex gap-4 overflow-hidden">
                                {/* Decor Icon - Left side now, matched style */}
                                <div className="absolute top-[-6px] left-[-6px] opacity-10 transform -rotate-12">
                                    <ThumbsDown size={80} weight="fill" className="text-red-600" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex gap-3 w-full">
                                    <ThumbsDown size={24} weight="fill" className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="text-red-800 font-bold mb-1 text-[15px]">谨慎选择</div>
                                        <p className="text-red-700/80 text-[14px] leading-6 font-medium">
                                            {place.avoid_dishes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info Block */}
                        <div className="p-4 bg-white/40 border border-gray-100 rounded-xl space-y-4">
                            {/* Tags / Amenities */}


                            {/* Average Price */}
                            {/* Average Price */}
                            {place.average_price && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <FinnTheHuman size={18} className="text-gray-600" weight="bold" />
                                    <span className="text-[14px]">人均 {place.average_price}</span>
                                </div>
                            )}

                            {/* Opening Hours */}
                            <div className="flex items-center gap-3 text-gray-600">
                                <ClockCountdown size={18} weight="bold" />
                                <span className="text-[14px]">{place.opening_hours || '暂无营业时间'}</span>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-3 text-gray-600">
                                <MapPinArea size={18} className="mt-0.5 flex-shrink-0" weight="bold" />
                                <span className="text-[14px] leading-snug">{place.address}</span>
                            </div>

                            {/* Spacer for bottom safe area */}
                        </div>

                        {/* Collapsed View Content - Removed Address Display */}
                    </div>
                </div>
            </div>
        </>
    );
}
