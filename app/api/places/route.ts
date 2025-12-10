import { NextResponse } from 'next/server';
import { Place, PlaceCategory } from '@/types';
import { client, FEISHU_APP_TOKEN, FEISHU_TABLE_ID } from '@/lib/feishu';

export async function GET() {
    try {
        // If Feishu config is missing, return empty or error
        if (!FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) {
            console.warn('Feishu config missing');
            return NextResponse.json({ data: [] });
        }

        const res = await client.bitable.appTableRecord.list({
            path: {
                app_token: FEISHU_APP_TOKEN,
                table_id: FEISHU_TABLE_ID,
            },
            params: {
                page_size: 100,
            },
        });

        if (!res.data?.items) {
            return NextResponse.json({ data: [] });
        }

        const places: Place[] = res.data.items
            .map((item) => {
                const fields = item.fields as any;
                // DEBUG: Log category to check value
                // console.log('Category value:', fields['category']);

                // Parse Feishu "Location" field
                // Expected structure: { location: "lng,lat", address: "...", cityname: "...", ... }
                let lng = 0;
                let lat = 0;
                let address = fields['address'] || '';
                let city = fields['city'] || ''; // Keep manual override if exists

                const locationField = fields['location']; // Field name must be 'location'
                if (locationField && typeof locationField === 'object' && locationField.location) {
                    const [lngStr, latStr] = locationField.location.split(',');
                    lng = Number(lngStr);
                    lat = Number(latStr);

                    // Use address from Location field if explicit address field is empty
                    if (!address && locationField.address) {
                        address = locationField.address;
                    }

                    // Use cityname from Location field if manual city is empty
                    if (!city && locationField.cityname) {
                        city = locationField.cityname;
                    }
                }

                let category: PlaceCategory = 'other';
                const rawCategory = fields['category'];
                if (rawCategory === '餐厅') category = 'restaurant';
                else if (rawCategory === '饮品甜点') category = 'drink';
                else if (rawCategory === '快餐小吃') category = 'snack';

                return {
                    id: item.record_id || '',
                    name: fields['name'] || '',
                    category: category,
                    location: [lng, lat] as [number, number],
                    address: address,
                    city: city || '上海市', // Default to Shanghai (Chinese) if still missing
                    note: fields['note'] || '',
                    recommended_dishes: fields['recommended_dishes'] || '',
                    avoid_dishes: fields['avoid_dishes'] || '',
                };
            })
            .filter((place) => place.name && place.location[0] !== 0); // Filter out empty records

        return NextResponse.json({ data: places });
    } catch (error) {
        console.error('Feishu API Error:', error);
        return NextResponse.json({ data: [], error: 'Failed to fetch data' }, { status: 500 });
    }
}
