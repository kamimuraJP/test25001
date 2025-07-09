import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, LoginData } from '@shared/schema';

// Token management
const getToken = () => localStorage.getItem('auth_token');
const setToken = (token: string) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        return null;
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.status === 401) {
        removeToken(); // Remove invalid token
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }

      return res.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        setToken(data.token);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (token) {
        const res = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        return res.json();
      }
    },
    onSuccess: () => {
      removeToken();
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    loginPending: loginMutation.isPending,
    logoutPending: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}