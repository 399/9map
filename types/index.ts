export type PlaceCategory = 'restaurant' | 'drink' | 'snack' | 'other';

export interface Place {
    id: string;
    name: string;
    category: PlaceCategory;
    location: [number, number]; // [lng, lat]
    address: string;
    city?: string;
    note?: string;
    recommended_dishes?: string;
    avoid_dishes?: string;
}

export interface PlacesResponse {
    data: Place[];
}
