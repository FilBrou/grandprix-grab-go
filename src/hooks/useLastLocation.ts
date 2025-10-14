import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'lastLocationId';

export const useLastLocation = () => {
  const [lastLocationId, setLastLocationId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        setLastLocationId(stored);
      }
    } else {
      setLastLocationId(null);
    }
  }, [user]);

  const saveLastLocation = (locationId: string) => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, locationId);
      setLastLocationId(locationId);
    }
  };

  const clearLastLocation = () => {
    if (user) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
      setLastLocationId(null);
    }
  };

  return {
    lastLocationId,
    saveLastLocation,
    clearLastLocation,
  };
};
