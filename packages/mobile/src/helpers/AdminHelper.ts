// Static mock data and type definitions for admin dashboard stats and live alert cards.
// Provides seed values for shuttle counts, rider totals, parking occupancy, and alert messages.

export interface AdminStat {
  id: string;
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: any;
}

export const SHUTTLE_STATS: AdminStat[] = [
  {
    id: 'active',
    title: 'Active Shuttles',
    value: 8,
    trend: 'neutral',
  },
  {
    id: 'riders',
    title: 'Total Riders',
    value: 1245,
    trend: 'up',
    trendValue: '+12%',
  },
  {
    id: 'delayed',
    title: 'Delayed',
    value: 1,
    trend: 'down',
    trendValue: 'Alert',
  },
];

export const PARKING_STATS: AdminStat[] = [
  {
    id: 'occupancy',
    title: 'Occupancy',
    value: '84%',
    trend: 'up',
    trendValue: '+2%',
  },
  {
    id: 'open',
    title: 'Open Spots',
    value: 142,
    trend: 'down',
  },
];

export const LIVE_ALERTS_MOCK = [
  {
    id: '1',
    type: 'shuttle',
    message: 'Shuttle A delayed by 10 mins due to traffic.',
    time: '2 mins ago',
    severity: 'medium',
  },
  {
    id: '2',
    type: 'parking',
    message: 'Deer Creek Sublot B is full.',
    time: '15 mins ago',
    severity: 'high',
  },
];
