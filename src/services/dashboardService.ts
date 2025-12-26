
import { BloodRequest, BloodGroup } from '../types';



export interface DashboardStats {
  points: number;
  totalDonors: number;
  livesSaved: number;
  recentRequestsCount: number;
}

export interface InventoryStats {
  group: BloodGroup;
  value: number;
}

export interface TrendData {
  month: string;
  count: number;
}

/**
 * Fetches dashboard statistics from the Spring Boot backend.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  } catch (error) {
    console.warn('Using mock data:', error);
    return getMockDashboardData().stats;
  }
};

export const fetchTrends = async (): Promise<TrendData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/trends`);
    if (!response.ok) throw new Error('Failed to fetch trends');
    const data = await response.json();
    return data.length > 0 ? data : getMockDashboardData().trends;
  } catch (error) {
    console.warn('Using mock data:', error);
    return getMockDashboardData().trends;
  }
};

export const fetchInventoryData = async (): Promise<InventoryStats[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/inventory`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    const data = await response.json();
    return data.length > 0 ? data : getMockDashboardData().inventory;
  } catch (error) {
    console.warn('Using mock data:', error);
    return getMockDashboardData().inventory;
  }
};

export const fetchRecentRequests = async (): Promise<BloodRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/requests`);
  if (!response.ok) throw new Error('Failed to fetch requests');
  return response.json();
};


// Mock fallback for development if backend is not yet deployed
// Fix: Added explicit return type to ensure objects match required interfaces.
// Fix: Replaced invalid 'Neg' with a valid BloodGroup 'O-'.
export const getMockDashboardData = (): {
  stats: DashboardStats;
  trends: TrendData[];
  inventory: InventoryStats[];
} => ({
  stats: {
    points: 1250,
    totalDonors: 24500,
    livesSaved: 1204,
    recentRequestsCount: 82
  },
  trends: [
    { month: 'Jan', count: 400 },
    { month: 'Feb', count: 300 },
    { month: 'Mar', count: 600 },
    { month: 'Apr', count: 800 },
    { month: 'May', count: 500 },
    { month: 'Jun', count: 700 },
  ],
  inventory: [
    { group: 'A+', value: 400 },
    { group: 'B+', value: 300 },
    { group: 'O+', value: 500 },
    { group: 'AB+', value: 200 },
    { group: 'O-', value: 100 },
  ]
});
