'use client';

import * as React from 'react';

import type { User } from '@/types/user';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { checkSessionApi } from '@/lib/auth/authApi';

export interface UserContextValue {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  checkSession?: () => Promise<void>;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [state, setState] = React.useState<{ user: User | null; error: string | null; isLoading: boolean }>({
    user: null,
    error: null,
    isLoading: true,
  });

  const checkSession = React.useCallback(async (): Promise<void> => {
    try {
      const data = await checkSessionApi();
      setState((prev) => ({ ...prev, user: data ?? null, error: null, isLoading: false }));
    } catch (err: any) {
      // Si el error es 401 (no autenticado), no mostrarlo en consola
      if (err?.response?.status === 401) {
        setState((prev) => ({ ...prev, user: null, error: null, isLoading: false }));
      } else {
        console.error('[UserContext] checkSession: error', err);
        logger.error(err);
        setState((prev) => ({ ...prev, user: null, error: 'Something went wrong', isLoading: false }));
      }
    }
  }, []);

  React.useEffect(() => {
    checkSession().catch((err) => {
      // Solo mostrar en consola si el error NO es 401
      if (!(err?.response?.status === 401)) {
        console.error('[UserContext] useEffect: error en checkSession', err);
        logger.error(err);
      }
      // noop
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, []);

  return <UserContext.Provider value={{ ...state, checkSession }}>{children}</UserContext.Provider>;
}

export const UserConsumer = UserContext.Consumer;
