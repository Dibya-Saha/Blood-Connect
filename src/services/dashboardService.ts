
import { BloodRequest, BloodGroup } from '../types';

const API_BASE_URL = '/api/dashboard';

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
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

/**
 * Fetches recent blood requests.
 */
export const fetchRecentRequests = async (): Promise<BloodRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/requests`);
  if (!response.ok) throw new Error('Failed to fetch requests');
  return response.json();
};

/**
 * Fetches current blood stock inventory.
 */
export const fetchInventoryData = async (): Promise<InventoryStats[]> => {
  const response = await fetch(`${API_BASE_URL}/inventory`);
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
};

/**
 * Fetches monthly donation trends.
 */
export const fetchTrends = async (): Promise<TrendData[]> => {
  const response = await fetch(`${API_BASE_URL}/trends`);
  if (!response.ok) throw new Error('Failed to fetch trends');
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
