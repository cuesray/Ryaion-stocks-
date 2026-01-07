
import { Stock } from './types';

export const INDIAN_STOCKS: Stock[] = [
  {
    id: '1',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    price: 2950.45,
    change: 12.30,
    changePercent: 0.42,
    sector: 'Conglomerate',
    marketCap: '₹19.8L Cr',
    dayHigh: 2980.00,
    dayLow: 2935.00,
    yearHigh: 3024.90,
    yearLow: 2210.00,
    volume: '2.4M',
    peRatio: 28.4,
    description: 'Reliance Industries is India\'s largest private sector company. It has evolved from being a textiles and polyester company into an integrated player across energy, materials, retail, entertainment and digital services.',
    history: [
      { time: '10:00', value: 2940 },
      { time: '11:00', value: 2945 },
      { time: '12:00', value: 2960 },
      { time: '13:00', value: 2955 },
      { time: '14:00', value: 2950.45 }
    ]
  },
  {
    id: '2',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 3820.10,
    change: -45.20,
    changePercent: -1.17,
    sector: 'IT Services',
    marketCap: '₹14.2L Cr',
    dayHigh: 3870.00,
    dayLow: 3810.00,
    yearHigh: 4254.75,
    yearLow: 3070.30,
    volume: '1.8M',
    peRatio: 31.2,
    description: 'TCS is an IT services, consulting and business solutions organization that has been partnering with many of the world\'s largest businesses in their transformation journeys for over 50 years.',
    history: [
      { time: '10:00', value: 3865 },
      { time: '11:00', value: 3850 },
      { time: '12:00', value: 3840 },
      { time: '13:00', value: 3825 },
      { time: '14:00', value: 3820.10 }
    ]
  },
  {
    id: '3',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    price: 1645.75,
    change: 8.50,
    changePercent: 0.52,
    sector: 'Banking',
    marketCap: '₹12.4L Cr',
    dayHigh: 1655.00,
    dayLow: 1630.00,
    yearHigh: 1757.50,
    yearLow: 1363.55,
    volume: '15.2M',
    peRatio: 18.5,
    description: 'HDFC Bank is one of India\'s leading private banks and was among the first to receive an \'in principle\' approval from the Reserve Bank of India (RBI) to set up a bank in the private sector.',
    history: [
      { time: '10:00', value: 1635 },
      { time: '11:00', value: 1640 },
      { time: '12:00', value: 1638 },
      { time: '13:00', value: 1642 },
      { time: '14:00', value: 1645.75 }
    ]
  },
  {
    id: '4',
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    price: 1512.20,
    change: 22.40,
    changePercent: 1.50,
    sector: 'IT Services',
    marketCap: '₹6.3L Cr',
    dayHigh: 1525.00,
    dayLow: 1485.00,
    yearHigh: 1733.00,
    yearLow: 1185.30,
    volume: '5.1M',
    peRatio: 24.8,
    description: 'Infosys is a global leader in next-generation digital services and consulting. We enable clients in more than 50 countries to navigate their digital transformation.',
    history: [
      { time: '10:00', value: 1490 },
      { time: '11:00', value: 1495 },
      { time: '12:00', value: 1505 },
      { time: '13:00', value: 1510 },
      { time: '14:00', value: 1512.20 }
    ]
  },
  {
    id: '5',
    symbol: 'ZOMATO',
    name: 'Zomato Ltd.',
    price: 184.30,
    change: 5.20,
    changePercent: 2.90,
    sector: 'E-commerce',
    marketCap: '₹1.6L Cr',
    dayHigh: 188.00,
    dayLow: 178.00,
    yearHigh: 191.90,
    yearLow: 49.00,
    volume: '45.8M',
    peRatio: 112.5,
    description: 'Launched in 2010, Zomato is a technology platform that connects customers, restaurant partners and delivery partners, serving their multiple needs.',
    history: [
      { time: '10:00', value: 179 },
      { time: '11:00', value: 180 },
      { time: '12:00', value: 182 },
      { time: '13:00', value: 183 },
      { time: '14:00', value: 184.30 }
    ]
  }
];

export const EDUCATION_MODULES = [
  {
    id: 'e1',
    title: 'Chart Basics 101',
    description: 'Learn to read candles, lines, and patterns like a pro.',
    videoUrl: 'https://picsum.photos/seed/chart/800/450',
    tags: ['Beginner', 'Charts']
  },
  {
    id: 'e2',
    title: 'The Psychology of Investing',
    description: 'Why Gen Z needs to think differently about long-term wealth.',
    videoUrl: 'https://picsum.photos/seed/psy/800/450',
    tags: ['Mindset', 'Growth']
  },
  {
    id: 'e3',
    title: 'Indian Market Ecosystem',
    description: 'NSE, BSE, SEBI - Understanding the players.',
    videoUrl: 'https://picsum.photos/seed/market/800/450',
    tags: ['Knowledge', 'India']
  }
];
