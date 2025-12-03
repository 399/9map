export type PlaceCategory = 'food' | 'sight';

export interface Place {
    id: string;
    name: string;
    category: PlaceCategory;
    location: [number, number]; // [lng, lat]
    address: string;
    note?: string;
}

export interface PlacesResponse {
    data: Place[];
}
