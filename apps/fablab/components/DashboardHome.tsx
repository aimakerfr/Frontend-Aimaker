import React from 'react';
import { UserProfile } from '../types';
import { Box, FileText, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardHomeProps {
  user: UserProfile;
  onChangeView: (view: any) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, onChangeView }) => {
  const usageData = [
    { name: 'Mon', tokens: 4000 },
    { name: 'Tue', tokens: 3000 },
    { name: 'Wed', tokens: 2000 },
    { name: 'Thu', tokens: 2780 },
    { name: 'Fri', tokens: 1890 },
    { name: 'Sat', tokens: 2390 },
    { name: 'Sun', tokens: 3490 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}!</h2>
        <p className="opacity-90 max-w-2xl">
          Your creative AI studio is ready. You have <strong>{user.stats.projects} active Projets</strong> and your latest documents have been successfully indexed.
        </p>
        <div className="mt-6 flex gap-3">
          <button 
            onClick={() => onChangeView('projects')}
            className="bg-white text-brand-600 px-4 py-2 rounded-lg font-medium hover:bg-brand-50 transition-colors flex items-center gap-2"
          >
            Go to Projets <ArrowRight size={16} />
          </button>
          <button 
             onClick={() => onChangeView('context')}
             className="bg-brand-700/50 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Adjust Context
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <Box size={24} />
            </div>
            <span className="text-xs font-semibold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">+2 this week</span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Projets</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.stats.projects}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
              <FileText size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Indexed Documents</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.stats.documents}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
              <Zap size={24} />
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {Math.round((user.stats.tokensUsed / user.stats.tokenLimit) * 100)}% Used
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Token Usage</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{(user.stats.tokensUsed / 1000).toFixed(1)}k <span className="text-sm font-normal text-gray-400">/ {(user.stats.tokenLimit / 1000).toFixed(0)}k</span></p>
        </div>

         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">AI Level</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.level}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Weekly Activity</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                cursor={{fill: 'transparent'}}
              />
              <Bar dataKey="tokens" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;