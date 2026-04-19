import { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';
import { User } from '../types/auth';
import {
  Check,
  Loader2,
  Shield,
  Users,
  Activity,
  TrendingUp,
  Clock,
  Search,
} from 'lucide-react';
import SubscriptionPlanManager from '../components/admin/SubscriptionPlanManager';

interface Analytics {
  totalUsers: number;
  pendingUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalWatchTimeHours: number;
  mostWatched: Array<{ tmdbId: string; name: string; type: string; _count: { id: number } }>;
  userGrowth?: Array<{ date: string; count: number }>;
}

type TabType = 'overview' | 'users' | 'activity' | 'logs' | 'plans';

export default function EnhancedAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // New UI state for admin enhancements
  const [exportToast, setExportToast] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('');
  const [createdAfter, setCreatedAfter] = useState<string>('');
  const [createdBefore, setCreatedBefore] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('NAME_ASC');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  // Bulk notification UI state
  const [bulkNotifyOpen, setBulkNotifyOpen] = useState<boolean>(false);
  const [bulkNotifyTitle, setBulkNotifyTitle] = useState<string>('');
  const [bulkNotifyMessage, setBulkNotifyMessage] = useState<string>('');
  const [bulkNotifyTarget, setBulkNotifyTarget] = useState<string>('ALL');

  // Small timer for relative time display
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    fetchActivityLogs();
    fetchAdminActions();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const data = await adminService.getActivityLogs();
      setActivityLogs(data.logs ?? []);
    } catch (error) {
      console.error('Failed to fetch activity logs', error);
    }
  };

  const fetchAdminActions = async () => {
    try {
      const data = await adminService.getAdminActions();
      setAdminLogs(data.actions ?? []);
    } catch (error) {
      console.error('Failed to fetch admin actions', error);
    }
  };

  // Auto-refresh analytics every 30 seconds when ON
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchAnalytics().finally(() => setRefreshing(false));
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchAnalytics = async () => {
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
      setLastRefreshed(Date.now());
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      const data = await adminService.getUsers(params);
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let list = [...users] as any[];
    // Role filter
    if (roleFilter) list = list.filter((u) => (u as any).role === roleFilter);
    // Subscription filter
    if (subscriptionFilter) {
      const nowDate = new Date();
      list = list.filter((u) => {
        const ends = (u as any).subscriptionEndsAt ? new Date((u as any).subscriptionEndsAt) : null;
        if (subscriptionFilter === 'ACTIVE') return ends && ends > nowDate;
        if (subscriptionFilter === 'EXPIRED') return ends && ends <= nowDate;
        if (subscriptionFilter === 'NONE') return !ends;
        return true;
      });
    }
    // Created date range
    if (createdAfter) list = list.filter((u) => new Date((u as any).createdAt) >= new Date(createdAfter));
    if (createdBefore) list = list.filter((u) => new Date((u as any).createdAt) <= new Date(createdBefore));
    // Sorting
    switch (sortOption) {
      case 'NAME_ASC':
        list = list.sort((a, b) => (a.name ?? '').localeCompare((b.name ?? '')));
        break;
      case 'NEWEST_FIRST':
        list = list.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
        break;
      case 'LAST_LOGIN':
        list = list.sort((a, b) => {
          const ta = (a as any).lastLoginAt ? new Date((a as any).lastLoginAt).getTime() : 0;
          const tb = (b as any).lastLoginAt ? new Date((b as any).lastLoginAt).getTime() : 0;
          return tb - ta;
        });
        break;
    }
    return list as User[];
  }, [users, roleFilter, subscriptionFilter, createdAfter, createdBefore, sortOption]);

  const toggleSelection = (id: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkNotify = async () => {
    if (!bulkNotifyTitle || !bulkNotifyMessage) {
      alert('Please provide title and message for the notification');
      return;
    }
    try {
      const ids = Array.from(selectedUserIds);
      await adminService.bulkNotify(bulkNotifyTitle, bulkNotifyMessage, bulkNotifyTarget, ids);
      // Reset fields after success
      setBulkNotifyTitle('');
      setBulkNotifyMessage('');
      setBulkNotifyTarget('ALL');
      setSelectedUserIds(new Set());
      alert('Bulk notification sent successfully');
    } catch (e) {
      console.error('Bulk notify failed', e);
      alert('Failed to send bulk notification');
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setLastRefreshed(Date.now());
    setRefreshing(false);
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastRefreshed) return 'Never';
    const diff = Math.floor((now - lastRefreshed) / 1000);
    return `${diff}s ago`;
  }, [now, lastRefreshed]);

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'logs', label: 'Logs', icon: Clock },
    { id: 'plans', label: 'Plans', icon: TrendingUp },
  ];

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2" size={48} /> Loading Dashboard...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 px-4 md:px-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Shield size={32} className="text-primary-500" />
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="ml-auto flex items-center gap-3 text-sm text-gray-300">
            <span className="whitespace-nowrap">Last updated: {lastUpdatedLabel}</span>
            {refreshing && <Loader2 className="animate-spin text-gray-300" size={16} />}
            <label className="inline-flex items-center cursor-pointer select-none">
              <span className="text-xs mr-2">Auto-refresh</span>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="form-checkbox h-4 w-4 text-primary-500 border border-white/20 rounded"
              />
            </label>
            <button onClick={handleManualRefresh} className="px-3 py-1 rounded bg-white/5 border border-white/20 text-white hover:bg-white/10">
              Refresh Now
            </button>
          </div>
        </div>

        {/* Pending users banner (clickable to filter to pending) */}
        {analytics?.pendingUsers && analytics.pendingUsers > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/40 text-yellow-100 rounded-lg cursor-pointer mb-6 animate-pulse"
            role="button"
            onClick={() => {
              setActiveTab('users');
              setStatusFilter('PENDING');
            }}
          >
            <span>🔔</span>
            <span className="font-semibold">{analytics.pendingUsers} users awaiting approval</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === id ? 'bg-primary-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Users</span>
                  <Users className="text-blue-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-white">{analytics.totalUsers}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Pending Approval</span>
                  <Clock className="text-yellow-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-white">{analytics.pendingUsers}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Active Subscriptions</span>
                  <Check className="text-green-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-white">{analytics ? analytics.activeSubscriptions : 0}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Watch Time</span>
                  <Activity className="text-primary-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-white">{analytics.totalWatchTimeHours ?? 0}h</p>
              </div>
            </div>
            {/* Most Watched Content */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-4">Most Watched Content</h2>
              <div className="space-y-3">
                {analytics.mostWatched.map((item, idx) => (
                  <div key={item.tmdbId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-bold">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-gray-400 text-sm capitalize">{item.type}</p>
                      </div>
                    </div>
                    <span className="text-primary-400 font-bold">{item._count.id} views</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts: User Growth & Watch Trends (no external libs) */}
        {analytics?.userGrowth && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* User Growth - 7 days */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm" style={{ minHeight: 180 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">User Growth (Last 7 days)</h3>
              </div>
              <div className="flex items-end h-40 gap-2" aria-label="user-growth-bars">
                {analytics.userGrowth.map((day, idx) => {
                  const max = Math.max(...(analytics.userGrowth ?? []).map((d) => d.count), 1);
                  const height = Math.max(Math.round((day.count / max) * 120), 6);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center" title={`${day.date}: ${day.count}`}>
                      <div className="w-6 bg-primary-600 rounded-t" style={{ height }} />
                      <div className="mt-2 text-xs text-gray-300">{day.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Watch Trends */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm" style={{ minHeight: 180 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">Watch Trends</h3>
              </div>
              <div className="space-y-2">
                {analytics.mostWatched.slice(0, 5).map((item) => {
                  const count = item._count?.id ?? 0;
                  const max = Math.max(...analytics.mostWatched.map((x) => x._count.id), 1);
                  const width = Math.round((count / max) * 100);
                  return (
                    <div key={item.tmdbId} className="flex items-center gap-3" title={`${item.name}: ${count} views`}>
                      <span className="text-xs text-gray-300 w-6 text-right">{item.name.split(' ').slice(0,2).join(' ')}</span>
                      <div className="flex-1 h-4 bg-white/10 rounded-full" aria-label={item.name}>
                        <div className="h-4 bg-blue-500 rounded-full" style={{ width: `${width}%` }} />
                      </div>
                      <span className="text-sm text-gray-300 w-16 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-3 flex-1 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    fetchUsers();
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white ml-2"
                >
                  Filters
                </button>
                <button
                  onClick={() => {
                    setRoleFilter('');
                    setSubscriptionFilter('');
                    setCreatedAfter('');
                    setCreatedBefore('');
                    setSortOption('NAME_ASC');
                  }}
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white ml-2"
                >
                  Reset
                </button>
              </div>
            </div>
            {filtersOpen && (
              <div className="flex flex-wrap gap-3 p-2 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Role</span>
                  <select className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MODERATOR">MODERATOR</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Subscription</span>
                  <select className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white" value={subscriptionFilter} onChange={(e) => setSubscriptionFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Created After</span>
                  <input type="date" className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white" value={createdAfter} onChange={(e) => setCreatedAfter(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Created Before</span>
                  <input type="date" className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white" value={createdBefore} onChange={(e) => setCreatedBefore(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Sort</span>
                  <select className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                    <option value="NAME_ASC">Name A-Z</option>
                    <option value="NEWEST_FIRST">Newest First</option>
                    <option value="LAST_LOGIN">Last Login</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const header = ['Name','Email','Role','Status','Subscription Ends','Created At'];
                  const rows = users.map(u => [u.name, u.email, u.role, u.status, u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).toISOString() : '', u.createdAt ? new Date(u.createdAt).toISOString() : '']);
                  const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'nmovie_users.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setExportToast('Exported!');
                  setTimeout(() => setExportToast(''), 1500);
                }}
                className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10"
              >
                Export CSV
              </button>
              {exportToast && <span className="text-green-400 text-sm">{exportToast}</span>}
            </div>
            {/* Bulk Notification Panel */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setBulkNotifyOpen(!bulkNotifyOpen)}>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>Send Notification</span>
                </div>
                <span className="text-xs text-gray-300">{bulkNotifyOpen ? 'Hide' : 'Show'}</span>
              </div>
              {bulkNotifyOpen && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white" placeholder="Title" value={bulkNotifyTitle} onChange={(e) => setBulkNotifyTitle(e.target.value)} />
                  <select className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white" value={bulkNotifyTarget} onChange={(e) => setBulkNotifyTarget(e.target.value)}>
                    <option value="ALL">All Users</option>
                    <option value="APPROVED">Approved Only</option>
                    <option value="SELECTED">Selected Users</option>
                  </select>
                  <textarea className="bg-black/20 border border-white/10 rounded px-3 py-2 col-span-2" placeholder="Message" rows={4} value={bulkNotifyMessage} onChange={(e) => setBulkNotifyMessage(e.target.value)} />
                  <div className="col-span-2 flex items-center gap-2">
                    <button className="px-4 py-2 bg-green-600/20 text-green-200 rounded-lg" onClick={handleBulkNotify}>Send</button>
                    <span className="text-xs text-gray-300">Tip: If you select "Selected Users", the list below will be used.</span>
                  </div>
                </div>
              )}
            </div>
            {/* Users Table - simplified for brevity */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase font-medium text-gray-200">
                      <tr>
                        <th className="px-6 py-4">Select</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Subscription</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4"><input type="checkbox" checked={selectedUserIds.has(u.id)} onChange={() => toggleSelection(u.id)} className="rounded" /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-white/20" />
                            <div>
                              <div className="text-white">{u.name}</div>
                              <div className="text-xs text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{u.role}</td>
                        <td className="px-6 py-4">{u.status}</td>
                        <td className="px-6 py-4">{u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2"></div>
                        </td>
                            </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Activity & Logs: live feeds */}
        {(activeTab === 'activity' || activeTab === 'logs') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Feed */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm h-96 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">Recent Activity</h3>
              </div>
              {activityLogs.length === 0 && <div className="text-gray-400">No activity yet.</div>}
              {activityLogs.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-white">{a.user?.name ?? a.user?.email ?? 'Unknown'}</span>
                    <span className="text-gray-400 text-sm">{a.description ?? a.type ?? ''}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
            {/* Admin Logs */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm h-96 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">Admin Actions</h3>
              </div>
              {adminLogs.length === 0 && <div className="text-gray-400">No admin actions yet.</div>}
              {adminLogs.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <span className="text-gray-300">{a.adminEmail ?? 'Admin'}</span>
                    <span className="text-gray-400">{a.action}</span>
                    <span className="text-gray-400">{a.targetId ? `on ${a.targetId}` : ''}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans Tab - dynamic component */}
        {activeTab === 'plans' && (
          <div className="mt-6">
            <SubscriptionPlanManager />
          </div>
        )}
      </div>
    </div>
  );
}
