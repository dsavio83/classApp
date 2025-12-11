import React, { useState } from 'react';
import * as api from '../services/api';
import { useSession } from '../context/SessionContext';
import { AnimatedBackground } from './AnimatedBackground';

export const Login: React.FC = () => {
  const { login } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const sessionData = await api.loginUser(username, password);
      login(sessionData);
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Login Form Container */}
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 space-y-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 mx-auto">
        <div className="text-center welcome-text">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Learning Platform
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Please sign in to your account
            </p>
        </div>
        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="edu-symbol">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-base bg-white/90 dark:bg-gray-700/90 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your username"
                    autoComplete="username"
                />
            </div>
            <div className="edu-symbol">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-base bg-white/90 dark:bg-gray-700/90 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 pr-12 backdrop-blur-sm"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                  />
                  <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300 focus:outline-none focus:text-blue-500 transition-all duration-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
            </div>

            {error && (
              <div className="error-message p-3 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full enhanced-button px-4 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 rounded-lg transition-all duration-300 disabled:from-blue-400 disabled:to-blue-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl animated-gradient"
            >
                {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
        </form>
        
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 Learning Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
