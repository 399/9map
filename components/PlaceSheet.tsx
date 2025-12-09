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
                <div>
                    <h2 className="text-xl font-bold">{place.name}</h2>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${place.category === 'food' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {place.category === 'food' ? '美食' : '景点'}
                    </span>
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
