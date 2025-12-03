import { NextResponse } from 'next/server';
import { Place } from '@/types';

const MOCK_PLACES: Place[] = [
    {
        id: '1',
        name: '外滩',
        category: 'sight',
        location: [121.4905, 31.2325],
        address: '上海市黄浦区中山东一路',
        note: '欣赏黄浦江对岸陆家嘴天际线的最佳位置。',
    },
    {
        id: '2',
        name: '东方明珠',
        category: 'sight',
        location: [121.4998, 31.2397],
        address: '上海市浦东新区世纪大道1号',
        note: '上海的地标性建筑，可以俯瞰全城。',
    },
    {
        id: '3',
        name: '豫园',
        category: 'sight',
        location: [121.4920, 31.2270],
        address: '上海市黄浦区福佑路168号',
        note: '典型的江南园林，旁边就是城隍庙。',
    },
    {
        id: '4',
        name: '武康路',
        category: 'sight',
        location: [121.4385, 31.2065],
        address: '上海市徐汇区武康路',
        note: '网红打卡地，有很多历史建筑和咖啡馆。',
    },
    {
        id: '5',
        name: '佳家汤包',
        category: 'food',
        location: [121.4750, 31.2330],
        address: '上海市黄浦区黄河路90号',
        note: '必吃的上海小笼包，蟹粉鲜肉味道一绝。',
    },
    {
        id: '6',
        name: '小杨生煎',
        category: 'food',
        location: [121.4600, 31.2300],
        address: '上海市静安区吴江路269号',
        note: '皮薄底脆，汤汁浓郁的生煎包。',
    },
];

export async function GET() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ data: MOCK_PLACES });
}
