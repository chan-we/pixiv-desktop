import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import router from './router';
import { useAuthStore } from './stores/authStore';
import { useProxyStore } from './stores/proxyStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const initializeAuth = () => {
  const checkAuth = useAuthStore.getState().checkAuth;
  checkAuth();
};

const initializeProxy = () => {
  useProxyStore.getState().initProxy();
};

initializeAuth();
initializeProxy();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
