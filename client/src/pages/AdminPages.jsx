// client/src/pages/AdminPages.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Layout/Navbar';
import AdminDashboard from '../components/Admin/Dashboard';
import UserManagement from '../components/Admin/UserManagement';
import BusManagement from '../components/Admin/BusManagement';
import LiveMonitor from '../components/Admin/LiveMonitor';

const AdminPages = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // If not admin, redirect to appropriate dashboard
  if (user?.role !== 'admin') {
    return <Navigate to={`/${user?.role || ''}/dashboard`} />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: 'fas fa-tachometer-alt' },
    { name: 'Users', href: '/admin/users', icon: 'fas fa-users' },
    { name: 'Buses', href: '/admin/buses', icon: 'fas fa-bus' },
    { name: 'Live Monitor', href: '/admin/monitor', icon: 'fas fa-map-marked-alt' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white"></i>
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                  <p className="text-xs text-gray-500">Bus Tracking System</p>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <i className={`${item.icon} mr-3 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}></i>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* User Profile */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="buses" element={<BusManagement />} />
                  <Route path="monitor" element={<LiveMonitor />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPages;