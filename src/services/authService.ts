
import { User } from '../types';

// Key for our "Mock Database" in the browser
const DB_USERS_KEY = 'bloodconnect_db_users';

/**
 * Retrieves all registered users from our mock DB
 */
const getRegisteredUsers = (): any[] => {
  const usersJson = localStorage.getItem(DB_USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

/**
 * Saves a new user to our mock DB
 */
const saveUserToDB = (user: any) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
};

export const mockLogin = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getRegisteredUsers();
      // Find user by email AND password
      const userMatch = users.find(u => u.email === email && u.password === password);
      
      if (userMatch) {
        // Return user object without password for security simulation
        const { password, confirmPassword, ...userWithoutSensitiveData } = userMatch;
        resolve(userWithoutSensitiveData as User);
      } else {
        reject(new Error("Invalid email or password"));
      }
    }, 1000);
  });
};

export const mockSignup = async (userData: any): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getRegisteredUsers();
      
      // Check if email already exists
      if (users.some(u => u.email === userData.email)) {
        reject(new Error("Email already registered"));
        return;
      }

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        points: 0,
        isAvailable: true,
        role: 'DONOR',
        location: { lat: 23.8103, lng: 90.4125 } // Default to center of Dhaka
      };

      saveUserToDB(newUser);
      
      // Return user object without sensitive data
      const { password, confirmPassword, ...userWithoutSensitiveData } = newUser;
      resolve(userWithoutSensitiveData as User);
    }, 1000);
  });
};
