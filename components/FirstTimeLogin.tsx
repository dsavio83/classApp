import React, { useState } from 'react';
import * as api from '../services/api';
import { useSession } from '../context/SessionContext';

export const FirstTimeLogin: React.FC = () => {
  const { session, updateProfile } = useSession();
  const user = session.user;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError('User session not found.');
        return;
    }
    
    // Validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 3) {
        setError("Password must be at least 3 characters long.");
        return;
    }
    if (!mobileNumber || mobileNumber.trim().length === 0) {
        setError("Mobile number is required.");
        return;
    }
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
    }
    
    setError(null);
    setIsLoading(true);
    try {
      const updatedUser = await api.updateProfile(user._id, { 
        password: newPassword, 
        mobileNumber: mobileNumber.trim() 
      });
      updateProfile(updatedUser);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const formInputClasses = "mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
        <div className="text-center">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Update Your Profile</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">For security, please update your password and add a mobile number.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={formInputClasses}
                    placeholder="Enter new password"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={formInputClasses}
                    placeholder="Re-enter password"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className={formInputClasses}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                />
            </div>

            {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-transform transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-wait disabled:transform-none"
            >
                {isLoading ? 'Updating...' : 'Update and Continue'}
            </button>
        </form>
      </div>
    </div>
  );
};
