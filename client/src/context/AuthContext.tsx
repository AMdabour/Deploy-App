import { logoutUser } from '@/utils/api';
import { createContext, useEffect, useReducer } from 'react';
import Cookies from 'js-cookie';

type User = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  timezone?: string;
  preferences?: {
    energyLevels?: {
      evening: string;
      morning: string;
      afternoon: string;
    };
    workingHours?: {
      end: string;
      start: string;
    };
    preferredTaskDuration?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

type AuthAction =
  | {
      type: 'login';
      payload: { user: User; accessToken: string; refreshToken: string };
    }
  | { type: 'logout' }
  | { type: 'setLoading'; payload: boolean }
  | {
      type: 'restoreAuth';
      payload: { user: User; accessToken: string; refreshToken: string };
    }
  | { type: 'updateUser'; payload: Partial<User> }
  | {
      type: 'updateTokens';
      payload: { accessToken: string; refreshToken: string };
    };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,
};

type AuthContextType = AuthState & {
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const reducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'login':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'logout':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'setLoading':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'restoreAuth':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'updateUser':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'updateTokens':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    default:
      return state;
  }
};

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [
    { user, isAuthenticated, isLoading, accessToken, refreshToken },
    dispatch,
  ] = useReducer(reducer, initialState);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    // Save user data to localStorage
    localStorage.setItem('user', JSON.stringify(userData));

    // Save tokens to cookies with security options
    Cookies.set('accessToken', accessToken, {
      expires: 1, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false, // Set to true if your backend can handle httpOnly cookies
    });

    Cookies.set('refreshToken', refreshToken, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false, // Set to true if your backend can handle httpOnly cookies
    });

    dispatch({
      type: 'login',
      payload: { user: userData, accessToken, refreshToken },
    });
  };

  const logout = async () => {
    try {
      // Call backend logout
      await logoutUser();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage and cookies regardless of backend response
      localStorage.removeItem('user');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      dispatch({ type: 'logout' });
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'updateUser', payload: userData });
    }
  };

  const updateTokens = (accessToken: string, refreshToken: string) => {
    // Update tokens in cookies
    Cookies.set('accessToken', accessToken, {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false,
    });

    Cookies.set('refreshToken', refreshToken, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false,
    });

    dispatch({
      type: 'updateTokens',
      payload: { accessToken, refreshToken },
    });
  };

  const getAccessToken = (): string | null => {
    return Cookies.get('accessToken') || null;
  };

  const getRefreshToken = (): string | null => {
    return Cookies.get('refreshToken') || null;
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = Cookies.get('accessToken');
        const storedRefreshToken = Cookies.get('refreshToken');

        if (storedUser && storedAccessToken && storedRefreshToken) {
          const userData: User = JSON.parse(storedUser);
          dispatch({
            type: 'restoreAuth',
            payload: {
              user: userData,
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
            },
          });
        } else {
          console.log('No stored auth data found');
          // Clean up any partial data
          if (storedUser) localStorage.removeItem('user');
          if (storedAccessToken) Cookies.remove('accessToken');
          if (storedRefreshToken) Cookies.remove('refreshToken');
          dispatch({ type: 'setLoading', payload: false });
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        // Clean up corrupted data
        localStorage.removeItem('user');
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        dispatch({ type: 'setLoading', payload: false });
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    refreshToken,
    login,
    logout,
    updateUser,
    updateTokens,
    getAccessToken,
    getRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider, AuthContext };
