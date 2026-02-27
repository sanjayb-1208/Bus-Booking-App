import React, { useEffect, useState, useContext } from 'react';
import { BarChart3, PieChart, Activity, DollarSign, Users, Bus } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial Auth Guard - Modified to prevent reload kick-out
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        // Only redirect if auth check is finished, no user found, and no token exists
        if (!authLoading && !user && !token) {
            toast.error("Session expired. Please login again.");
            navigate("/");
        } else if (!authLoading && user && !user.is_admin) {
            toast.error("You are not authorized to access this page");
            navigate("/");
        }
    }, [user, navigate, authLoading]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setData(res.data);
            } catch (e) { 
                console.error("Dashboard Fetch Error:", e);
                // Don't toast error if it's just a 401 during reload sync
                if (e.response?.status !== 401) {
                    toast.error("Failed to load analytics data");
                }
            } finally { 
                setLoading(false); 
            }
        };

        // Fetch if user is admin or if we have a token (assuming backend will validate token)
        if (user?.is_admin || localStorage.getItem('token')) {
            fetchAll();
        }
    }, [user]);

    // Show loading state while Auth is checking or Data is fetching
    if (authLoading || loading) return (
        <div className="h-screen flex items-center justify-center dark:bg-black font-black uppercase tracking-widest dark:text-white">
            Authenticating & Analyzing Data...
        </div>
    );

    if (!data) return null;

    // Scaling factor for chart
    const maxAmount = Math.max(...data.trend.map(d => d.amount), 1);

    return (
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-black p-4 md:p-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-black dark:text-white tracking-tighter uppercase italic">
                            Control <span className="text-red-600">Center</span>
                        </h1>
                        <p className="text-gray-400 font-bold text-sm uppercase mt-1">Real-time system health & financial analytics</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white dark:bg-neutral-900 px-6 py-3 rounded-2xl border dark:border-neutral-800 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Server Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                <span className="text-sm font-black dark:text-white uppercase">Operational</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <MiniCard icon={<DollarSign size={20}/>} label="Weekly Rev" value={`₹${data.metrics.revenue}`} trend="+12%" />
                    <MiniCard icon={<Users size={20}/>} label="Total Users" value={data.metrics.users} trend="+5%" />
                    <MiniCard icon={<Activity size={20}/>} label="Occupancy" value={`${(data.metrics.occupancy * 100).toFixed(1)}%`} trend="Stable" />
                    <MiniCard icon={<Bus size={20}/>} label="Active Buses" value={data.bus_performance.length} trend="Live" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Bar Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-[3rem] border dark:border-neutral-800 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black dark:text-white uppercase italic flex items-center gap-2">
                                <BarChart3 className="text-red-600"/> Revenue Trend
                            </h3>
                            <span className="text-[10px] font-black bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full dark:text-gray-400 uppercase">
                                Last 7 Days
                            </span>
                        </div>
                        
                        <div className="flex items-end justify-between h-48 gap-2 px-2">
                            {data.trend.map((day, i) => {
                                const barHeight = (day.amount / maxAmount) * 100;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                                        <div className="relative w-full flex flex-col items-center justify-end h-full">
                                            <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black dark:bg-white dark:text-black text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                                                ₹{day.amount}
                                            </span>
                                            <div 
                                                className="w-full bg-red-600 rounded-t-xl transition-all duration-700 ease-out group-hover:bg-black dark:group-hover:bg-neutral-400" 
                                                style={{ height: `${Math.max(barHeight, 5)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">{day.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bus Performance */}
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-[3rem] border dark:border-neutral-800 shadow-xl">
                        <h3 className="text-lg font-black dark:text-white uppercase italic mb-8 flex items-center gap-2">
                            <PieChart className="text-red-600"/> Top Routes
                        </h3>
                        <div className="space-y-6">
                            {data.bus_performance.map((bus, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-black uppercase mb-2">
                                        <span className="dark:text-white">{bus.name}</span>
                                        <span className="text-red-600">₹{bus.revenue}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-red-600 transition-all duration-1000" 
                                            style={{ width: `${Math.min((bus.tickets / 40) * 100, 100)}%` }} 
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                                        {bus.tickets} Tickets Sold
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MiniCard = ({ icon, label, value, trend }) => (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border dark:border-neutral-800 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl">{icon}</div>
            <span className="text-[9px] font-black text-green-500 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-lg uppercase">
                {trend}
            </span>
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black dark:text-white tracking-tighter">{value}</p>
    </div>
);

export default Dashboard;