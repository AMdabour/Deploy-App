import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import DashboardHeader from '@/components/dashboard/main/DashboardHeader';
import DashboardContent from '@/components/dashboard/main/DashboardContent';
import AIAgent from '@/components/dashboard/agent/AIAgent';

const Dashboard = () => {
  const location = useLocation();
  const isDashboardRoot = location.pathname === '/dashboard';

  return (
    <div>
      <DashboardHeader />
      {isDashboardRoot ? <DashboardContent /> : <Outlet />}

      <AIAgent />
    </div>
  );
};

export default Dashboard;
