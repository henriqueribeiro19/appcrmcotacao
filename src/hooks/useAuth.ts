import { useCallback } from 'react';
import { authService } from '@/services/authService';
import { useAuthContext } from '@/context/AuthContext';

export function useAuth() {
  const { user, userProfile, loading, isAdmin } = useAuthContext();

  const login = useCallback(async (email: string, password: string) => {
    return authService.login(email, password);
  }, []);

  const logout = useCallback(async () => {
    return authService.logout();
  }, []);

  return {
    user,
    userProfile,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
