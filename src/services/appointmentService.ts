import { BloodGroup } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Appointment {
  _id: string;
  donor: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: BloodGroup;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  bloodGroup: BloodGroup;
  appointmentDate: string;
  appointmentTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string;
  reminderSent: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateAppointmentData {
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  bloodGroup: BloodGroup;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

/**
 * Create a new appointment
 */
export const createAppointment = async (data: CreateAppointmentData): Promise<Appointment> => {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to create appointment');
  }

  return result.appointment;
};

/**
 * Get current user's appointments
 */
export const getMyAppointments = async (): Promise<Appointment[]> => {
  const token = localStorage.getItem('jwt_token');
  
  try {
    const response = await fetch(`${API_URL}/appointments/my-appointments`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }

    return response.json();
  } catch (error) {
    console.error('Get appointments error:', error);
    return [];
  }
};

/**
 * Get single appointment by ID
 */
export const getAppointment = async (id: string): Promise<Appointment> => {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch appointment');
  }

  return response.json();
};

/**
 * Complete an appointment (after donation)
 */
export const completeAppointment = async (id: string): Promise<{ message: string; pointsEarned: number }> => {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`${API_URL}/appointments/${id}/complete`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to complete appointment');
  }

  return result;
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (id: string): Promise<void> => {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`${API_URL}/appointments/${id}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel appointment');
  }
};

/**
 * Update an appointment
 */
export const updateAppointment = async (
  id: string, 
  data: { appointmentDate?: string; appointmentTime?: string; notes?: string }
): Promise<Appointment> => {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update appointment');
  }

  return result.appointment;
};