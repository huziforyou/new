import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../Context/UserContext';

const PermissionWrapper = ({ children, required }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to everything
  const hasAccess = user.role === 'admin' || (user.permissions && user.permissions.includes(required));

  if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
    if (user.role === 'admin') return <Navigate to="/dashboard/Overviews" replace />;

    // Redirect to the first available permission that is a sub-page
    const subPages = ['Overviews', 'Images', 'MyInfo', 'Requests', 'ImagesByEmails', 'Mail-Management'];
    const firstAllowed = subPages.find(p => user.permissions?.includes(p));

    if (firstAllowed) {
      // Mapping some permission names to their actual routes if they differ
      const routeMap = {
        'Requests': 'Requests/Permissions-Users',
        'ImagesByEmails': 'ImagesByEmails/1st-Email'
      };
      return <Navigate to={`/dashboard/${routeMap[firstAllowed] || firstAllowed}`} replace />;
    }

    return <Navigate to="/home" replace />;
  }

  return hasAccess ? children : <Navigate to="/home" replace />;
};

export default PermissionWrapper;
