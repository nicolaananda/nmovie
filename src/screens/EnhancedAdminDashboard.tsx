import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { User } from '../types/auth';
import {
    Check,
    X,
    Trash2,
    Loader2,
    Shield,
    Users,
    Activity,
    TrendingUp,
    Clock,
    Search,
} from 'lucide-react';

interface Analytics {
    totalUsers: number;
    pendingUsers: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    totalWatchTimeHours: number;
    recentActivity: number;
    mostWatched: Array<{ tmdbId: string; name: string; type: string; _count: { id: number } }>;
}

type TabType = 'overview' | 'users' | 'activity' | 'logs';

export default function EnhancedAdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [bulkDuration, setBulkDuration] = useState(1);

    useEffect(() => {
        fetchAnalytics();
        fetchUsers();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await adminService.getAnalytics();
            setAnalytics(data);
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

    const handleStatusUpdate = async (id: number, status: 'APPROVED' | 'REJECTED', durationMonths?: number) => {
        setActionLoading(id);
        try {
            await adminService.updateUserStatus(id, status, durationMonths);
            fetchUsers();
            fetchAnalytics();
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedUsers.size === 0) {
            alert('Please select users to approve');
            return;
        }

        setLoading(true);
        try {
            await adminService.bulkApproveUsers(Array.from(selectedUsers), bulkDuration);
            setSelectedUsers(new Set());
            fetchUsers();
            fetchAnalytics();
        } catch (error) {
            console.error('Failed to bulk approve', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setActionLoading(id);
        try {
            await adminService.deleteUser(id);
            setUsers(users.filter((u) => u.id !== id));
            fetchAnalytics();
        } catch (error) {
            console.error('Failed to delete user', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDateUpdate = async (id: number, dateStr: string) => {
        if (!dateStr) return;
        setActionLoading(id);
        try {
            await adminService.updateUserStatus(id, 'APPROVED', undefined, dateStr);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update date', error);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleUserSelection = (id: number) => {
        const newSelection = new Set(selectedUsers);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedUsers(newSelection);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: TrendingUp },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'logs', label: 'Logs', icon: Clock },
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
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as TabType)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                                activeTab === id
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
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
                        {/* Stats Grid */}
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
                                <p className="text-3xl font-bold text-white">{analytics.activeSubscriptions}</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">Total Watch Time</span>
                                    <Activity className="text-primary-400" size={20} />
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics.totalWatchTimeHours}h</p>
                            </div>
                        </div>

                        {/* Most Watched Content */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white mb-4">Most Watched Content</h2>
                            <div className="space-y-3">
                                {analytics.mostWatched.map((item, idx) => (
                                    <div
                                        key={item.tmdbId}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                    >
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
                            </div>

                            {selectedUsers.size > 0 && (
                                <div className="flex items-center gap-3">
                                    <select
                                        value={bulkDuration}
                                        onChange={(e) => setBulkDuration(parseInt(e.target.value))}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                                    >
                                        <option value={1}>1 Month</option>
                                        <option value={3}>3 Months</option>
                                        <option value={6}>6 Months</option>
                                        <option value={12}>12 Months</option>
                                    </select>
                                    <button
                                        onClick={handleBulkApprove}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/30"
                                    >
                                        <Check size={18} />
                                        Approve {selectedUsers.size} Users
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Users Table */}
                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-white/5 text-xs uppercase font-medium text-gray-200">
                                        <tr>
                                            <th className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUsers(new Set(users.filter(u => u.status === 'PENDING').map(u => u.id)));
                                                        } else {
                                                            setSelectedUsers(new Set());
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                            </th>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Subscription</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    {user.status === 'PENDING' && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.has(user.id)}
                                                            onChange={() => toggleUserSelection(user.id)}
                                                            className="rounded"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-white text-base">{user.name}</span>
                                                        <span className="text-xs">{user.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                            user.role === 'ADMIN'
                                                                ? 'bg-primary-500/20 text-primary-400'
                                                                : 'bg-gray-700/50 text-gray-300'
                                                        }`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                            user.status === 'APPROVED'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : user.status === 'REJECTED'
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                user.status === 'APPROVED'
                                                                    ? 'bg-green-400'
                                                                    : user.status === 'REJECTED'
                                                                    ? 'bg-red-400'
                                                                    : 'bg-yellow-400'
                                                            }`}
                                                        ></span>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.status === 'APPROVED' ? (
                                                        <input
                                                            type="date"
                                                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-primary-500 outline-none"
                                                            value={
                                                                user.subscriptionEndsAt
                                                                    ? new Date(user.subscriptionEndsAt).toISOString().split('T')[0]
                                                                    : ''
                                                            }
                                                            onChange={(e) => handleDateUpdate(user.id, e.target.value)}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-600">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {actionLoading === user.id ? (
                                                            <Loader2 className="animate-spin text-gray-400" size={18} />
                                                        ) : (
                                                            <>
                                                                {user.status === 'PENDING' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleStatusUpdate(user.id, 'APPROVED', 1)}
                                                                            title="Approve for 1 Month"
                                                                            className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/20"
                                                                        >
                                                                            <Check size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleStatusUpdate(user.id, 'REJECTED')}
                                                                            title="Reject"
                                                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                                                                        >
                                                                            <X size={18} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(user.id)}
                                                                    title="Delete User"
                                                                    className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity & Logs tabs - Placeholder for now */}
                {(activeTab === 'activity' || activeTab === 'logs') && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center backdrop-blur-sm">
                        <Activity size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 text-lg">
                            {activeTab === 'activity' ? 'Activity monitoring' : 'System logs'} coming soon
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
