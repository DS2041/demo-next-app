'use client'

import Frame from '@/components/Frame/frame'
import TradingPerformanceData from '@/components/Stats/StatsCard'
import { useRamicoin } from '@/context/trackrecord';
import { useAffiliate } from '@/context/affiliate';
import BlackSpinner from '../Old/Spinners/BlackSpin';
import ApyChart from '@/components/MonthlyChartData/ApyChart';

export default function StatsDataUI() {
    const { totalProfit, totalRoiAllTime, totalRamiBurntFromBusiness, currentTradingBalance, isLoading } = useRamicoin();

    const { state: affiliate } = useAffiliate()
    const totalRaised = affiliate?.totalSales + 144 || 0
    
    // Calculate total circulating supply
    const totalCirculatingSupply = 5000000000 - totalRamiBurntFromBusiness;

    const formatNumberWithCommas = (number: number) => {
        return Math.floor(number).toLocaleString('en-US');
    };

    // Trading performance data
    const tradingPerformance = [
        {
            _id: 't1',
            id: 't1',
            title: isLoading ? <BlackSpinner /> : (totalRaised > 13129 ? `$${formatNumberWithCommas(totalRaised)}` : <BlackSpinner />),
            summary: 'Total trading balance available to trade.',
            categories: ['Trading'],
            theme: '#e4f1e8',
            badgeIcon: '/stats/capital.svg', // Specific badge icon

        },
         {
            _id: 't2',
            id: 't2',
            title: isLoading ? <BlackSpinner /> : `$${formatNumberWithCommas(totalProfit)}`,
            summary: 'Total profits distributed to the investors since the beginning.',
            categories: ['Trading'],
            theme: '#f1e8e4',
            badgeIcon: '/stats/profit.svg', // Specific badge icon
        },
        {
            _id: 't3',
            id: 't3',
            title: <ApyChart />,
            summary: 'Last 6 months trading performance.',
            categories: ['Trading'],
            theme: '#e4e8f1',
            badgeIcon: '/stats/chart.svg', // You might want to add an appropriate icon
        },
        {
            _id: 't4',
            id: 't4',
            title: isLoading ? <BlackSpinner /> : `${(totalRoiAllTime).toFixed(2)}%`,
            summary: 'Total return on investment generated since the beginning.',
            categories: ['Trading'],
            theme: '#e8e4f1',
            badgeIcon: '/stats/roi.svg', // Specific badge icon

        }
    ];

    // Token data
    const tokenData = [
        {
            _id: 'tk1',
            id: 'tk1',
            title: '5,000,000,000',
            summary: 'Total Ramicoin supply of all time that will ever be.',
            categories: ['Token'],
            theme: '#e4e8f1',
            badgeIcon: '/stats/orange/ramicoin.svg', // Specific badge icon

        },
        {
            _id: 'tk2',
            id: 'tk2',
            title: isLoading ? <BlackSpinner /> : formatNumberWithCommas(totalCirculatingSupply),
            summary: 'Circulating supply of Ramicoin.',
            categories: ['Token'],
            theme: '#e4e8f1',
            badgeIcon: '/stats/orange/ramicoin.svg', // Specific badge icon

        },
        {
            _id: 'tk3',
            id: 'tk3',
            title: isLoading ? <BlackSpinner /> : formatNumberWithCommas(totalRamiBurntFromBusiness),
            summary: 'Total Ramicoins burnt so far from the profits - removed from the supply forever.',
            categories: ['Token'],
            theme: '#f1e4e8',
            badgeIcon: '/stats/burn.svg', // Specific badge icon

        },
        {
            _id: 'tk4',
            id: 'tk4',
            title: '20',
            summary: 'Total Ramicoin holders of all time.',
            categories: ['Token'],
            theme: '#e8f1e4',
            badgeIcon: '/stats/orange/profile.svg', // Specific badge icon

        }
    ];

    return (
        <>
            <Frame id="trading-performance">
                <TradingPerformanceData
                    posts={tradingPerformance}
                    title="performance"
                    linkText=""
                    linkHref=""
                    accentColor="text-rio-400"
                    prefix="Investment"
                />
            </Frame>

            <Frame id="token-data">
                <TradingPerformanceData
                    posts={tokenData}
                    title="ramicoin"
                    linkText=""
                    linkHref=""
                    accentColor="text-dandelion-400"
                    prefix="About"
                />
            </Frame>
        </>
    )

}














