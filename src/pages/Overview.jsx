import axios from "axios";
import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { IoMdImages } from "react-icons/io";
import { FaGoogleDrive, FaUsers, FaMapMarkedAlt, FaHistory } from "react-icons/fa";
import { useUser } from "../Context/UserContext";

// Lazy load charts for performance
const LineChart = lazy(() => import("recharts").then(module => ({ default: module.LineChart })));
const BarChart = lazy(() => import("recharts").then(module => ({ default: module.BarChart })));
const Line = lazy(() => import("recharts").then(module => ({ default: module.Line })));
const Bar = lazy(() => import("recharts").then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import("recharts").then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import("recharts").then(module => ({ default: module.YAxis })));
const Tooltip = lazy(() => import("recharts").then(module => ({ default: module.Tooltip })));
const CartesianGrid = lazy(() => import("recharts").then(module => ({ default: module.CartesianGrid })));
const ResponsiveContainer = lazy(() => import("recharts").then(module => ({ default: module.ResponsiveContainer })));
const Cell = lazy(() => import("recharts").then(module => ({ default: module.Cell })));

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Overview = () => {
  const { token } = useUser();
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const [statsRes, monthlyRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/photos/overview-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-image-by-month`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setStats(statsRes.data);

        // Process monthly aggregate for chart
        const rawMonthly = monthlyRes.data?.stats || [];
        const groupedByMonth = rawMonthly.reduce((acc, curr) => {
          const month = curr.month;
          if (!acc[month]) acc[month] = { month, count: 0 };
          acc[month].count += curr.count;
          return acc;
        }, {});
        setMonthlyData(Object.values(groupedByMonth).sort((a, b) => a.month.localeCompare(b.month)));

      } catch (err) {
        console.error("Failed to fetch overview data:", err);
        setError("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [token]);

  const statCards = useMemo(() => [
    { label: "Total Images", value: stats?.totalImages || 0, icon: <IoMdImages className="text-blue-500" />, color: "bg-blue-500/10" },
    { label: "Map Coverage", value: `${stats?.coverage || 0}%`, icon: <FaMapMarkedAlt className="text-green-500" />, color: "bg-green-500/10" },
    { label: "Active Sources", value: stats?.totalSources || 0, icon: <FaGoogleDrive className="text-amber-500" />, color: "bg-amber-500/10" },
    { label: "Contributing Users", value: stats?.activeUsersCount || 0, icon: <FaUsers className="text-purple-500" />, color: "bg-purple-500/10" },
  ], [stats]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-gray-400">Loading project overview...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Overview</h1>
          <p className="text-gray-500 dark:text-gray-400">Track image synchronization and geographical data.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/home" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
            View Interactive Map
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${card.color}`}>
              {React.cloneElement(card.icon, { size: 24 })}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* District Distribution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top District Distribution</h3>
          <div className="h-[300px]">
            <Suspense fallback={<div>Loading Chart...</div>}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topDistricts || []} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="district" type="category" width={100} axisLine={false} tickLine={false} fontSize={12} stroke="currentColor" />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {(stats?.topDistricts || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </div>

        {/* Upload History Trend */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Synchronization Trend</h3>
          <div className="h-[300px]">
            <Suspense fallback={<div>Loading Chart...</div>}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </div>
      </div>

      {/* Latest Synced Images */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaHistory className="text-gray-400" /> Recent Activities
          </h3>
          <Link to="/dashboard/Images" className="text-blue-500 hover:underline text-sm font-medium">View All Gallery</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">Image Name</th>
                <th className="px-6 py-4">Uploaded By</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
              {stats?.recentPhotos?.map((photo) => (
                <tr key={photo._id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{photo.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{photo.uploadedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {photo.district ? `${photo.district}, ${photo.village || ''}` : 'No GPS data'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!stats?.recentPhotos || stats.recentPhotos.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
