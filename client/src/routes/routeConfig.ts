import Home from '../pages/Home';
import Register from '../pages/auth/Register';
import Login from '../pages/auth/Login';
import Profile from '../pages/Profile';
import Dashboard from '../pages/Dashboard';
import Goals from '../components/dashboard/goals/Goals';
import Calendar from '../components/dashboard/main/Calendar';
import Tasks from '../components/dashboard/tasks/Tasks';
import Objectives from '@/components/dashboard/objectives/Objectives';
import NotFound from '../pages/NotFound';
import Settings from '../pages/Settings';

export interface RouteItem {
  path: string;
  component: React.ComponentType;
  protected?: boolean;
  children?: RouteItem[];
}

export const routes: RouteItem[] = [
  // Public Routes
  {
    path: '/',
    component: Home,
  },

  // Auth Routes
  {
    path: '/auth/register',
    component: Register,
  },
  {
    path: '/auth/login',
    component: Login,
  },

  // Protected Routes
  {
    path: '/dashboard',
    component: Dashboard,
    protected: true,
    children: [
      {
        path: '/dashboard/calendar',
        component: Calendar,
        protected: true,
      },
      {
        path: '/dashboard/tasks',
        component: Tasks,
        protected: true,
      },
      {
        path: '/dashboard/goals',
        component: Goals,
        protected: true,
      },
      {
        path: '/dashboard/objectives',
        component: Objectives,
        protected: true,
      },
    ],
  },
  {
    path: '/profile',
    component: Profile,
    protected: true,
  },
  {
    path: '/settings',
    component: Settings,
    protected: true,
  },

  // Catch-all Route
  {
    path: '*',
    component: NotFound,
  },
];
