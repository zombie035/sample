// client/src/components/Admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { busService } from '../../services/busService';
import StatCard from '../UI/StatCard';
import RecentActivity from '../UI/RecentActivity';
import ChartComponent from '../UI/ChartComponent';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalDrivers: 0,
    totalAdmins: 0,
    totalBuses: 0,
    activeBuses: 0,
    inactiveBuses: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBuses, setRecentBuses] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users and buses
      const [usersResponse, busesResponse] = await Promise.all([
        userService.getAllUsers(),
        busService.getAllBuses()
      ]);

      const users = usersResponse?.users || [];
      const buses = busesResponse || [];

      // Calculate stats
      const totalUsers = users.length;
      const totalStudents = users.filter(u => u.role === 'student').length;
      const totalDrivers = users.filter(u => u.role === 'driver').length;
      const totalAdmins = users.filter(u => u.role === 'admin').length;
      const totalBuses = buses.length;
      
      // Active buses (updated in last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const activeBuses = buses.filter(bus => 
        new Date(bus.updatedAt) >= tenMinutesAgo
      ).length;

      // Recent users (last 5)
      const recentUsers = users
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(user => ({
          ...user,
          date: new Date(user.createdAt).toLocaleDateString()
        }));

      // Recent buses (last 5)
      const recentBuses = buses
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map(bus => ({
          ...bus,
          date: new Date(bus.updatedAt).toLocaleDateString()
        }));

      // Prepare chart data (mock data for now)
      const mockChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Active Users',
            data: [65, 59, 80, 81, 56, 55, 40],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            tension: 0.4
          },
          {
            label: 'Bus Updates',
            data: [28, 48, 40, 19, 86, 27, 90],
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgb(16, 185, 129)',
            tension: 0.4
          }
        ]
      };

      setStats({
        totalUsers,
        totalStudents,
        totalDrivers,
        totalAdmins,
        totalBuses,
        activeBuses,
        inactiveBuses: totalBuses - activeBuses
      });
      setRecentUsers(recentUsers);
      setRecentBuses(recentBuses);
      setChartData(mockChartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your bus tracking system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="fas fa-users"
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Students"
          value={stats.totalStudents}
          icon="fas fa-user-graduate"
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Drivers"
          value={stats.totalDrivers}
          icon="fas fa-user-tie"
          color="orange"
          trend="+5%"
        />
        <StatCard
          title="Buses"
          value={stats.totalBuses}
          icon="fas fa-bus"
          color="purple"
          trend="+15%"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Weekly Activity</h2>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              Week
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              Month
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg">
              Year
            </button>
          </div>
        </div>
        <div className="h-80">
          <ChartComponent data={chartData} type="line" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity
          title="Recent Users"
          items={recentUsers}
          type="users"
          emptyMessage="No recent users"
          onViewAll={() => window.location.href = '/admin/users'}
        />
        <RecentActivity
          title="Recent Buses"
          items={recentBuses}
          type="buses"
          emptyMessage="No recent buses"
          onViewAll={() => window.location.href = '/admin/buses'}
        />
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Buses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeBuses}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <i className="fas fa-bus text-green-600 text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-info-circle mr-2"></i>
              <span>Updated in last 10 minutes</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactive Buses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.inactiveBuses}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <i className="fas fa-bus-slash text-red-600 text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <span>Not updated in 10+ minutes</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAdmins}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fas fa-shield-alt text-blue-600 text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-user-shield mr-2"></i>
              <span>System administrators</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;