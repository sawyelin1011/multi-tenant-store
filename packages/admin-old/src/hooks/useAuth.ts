import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = localStorage.getItem('api_key');
    setApiKey(key);
    setIsAuthenticated(!!key);
    setLoading(false);
  }, []);

  const login = (key: string) => {
    localStorage.setItem('api_key', key);
    setApiKey(key);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('api_key');
    setApiKey(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    apiKey,
    loading,
    login,
    logout,
  };
}
