import { Place } from '@/types';
import { X } from 'lucide-react';

interface PlaceSheetProps {
    place: Place | null;
    onClose: () => void;
}

export default function PlaceSheet({ place, onClose }: PlaceSheetProps) {
    if (!place) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 bg-white/90 backdrop-blur-xl rounded-card-lg shadow-soft-1 transform transition-transform duration-300 ease-in-out p-6 pb-8 max-h-[50vh] overflow-y-auto border border-white/50">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                        {place.category === 'restaurant' ? (
                            <img src="/icon/餐厅.png" className="w-8 h-8 object-contain" alt="餐厅" />
                        ) : place.category === 'drink' ? (
                            <img src="/icon/饮品甜点.png" className="w-8 h-8 object-contain" alt="饮品" />
                        ) : place.category === 'snack' ? (
                            <img src="/icon/快餐小吃.png" className="w-8 h-8 object-contain" alt="小吃" />
                        ) : (
                            <span className="text-2xl">📍</span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-bold">{place.name}</h2>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${place.category === 'restaurant' ? 'bg-orange-100 text-orange-800' :
                            place.category === 'drink' ? 'bg-blue-100 text-blue-800' :
                                place.category === 'snack' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {
                                place.category === 'restaurant' ? '餐厅' :
                                    place.category === 'drink' ? '饮品甜点' :
                                        place.category === 'snack' ? '快餐小吃' :
                                            '其他'
                            }
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500">地址</h3>
                    <p>{place.address}</p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-500">推荐菜</h3>
                    <p className="text-gray-700 dark:text-gray-300">{place.recommended_dishes || '暂无'}</p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-500">避雷菜</h3>
                    <p className="text-gray-700 dark:text-gray-300">{place.avoid_dishes || '暂无'}</p>
                </div>

                {place.note && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500">备注</h3>
                        <p className="text-gray-700 dark:text-gray-300">{place.note}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
