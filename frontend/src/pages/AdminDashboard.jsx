import React, { useEffect, useState, useContext } from 'react';
import { BarChart3, PieChart, Activity, DollarSign, Users, Bus } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from "react-router-dom";
import {AuthContext} from "../context/AuthContext";
import {toast} from "react-toastify";

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    if(!user || !user.is_admin){
        toast.error("Youre not authorized to access this page");
        navigate("/");
    }
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setData(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center dark:bg-black font-black uppercase tracking-widest dark:text-white">Analyzing Data...</div>;

    return (
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-black p-4 md:p-10">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-black dark:text-white tracking-tighter uppercase italic">Control <span className="text-red-600">Center</span></h1>
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

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <MiniCard icon={<DollarSign size={20}/>} label="Weekly Rev" value={`₹${data.metrics.revenue}`} trend="+12%" />
                    <MiniCard icon={<Users size={20}/>} label="Total Users" value={data.metrics.users} trend="+5%" />
                    <MiniCard icon={<Activity size={20}/>} label="Occupancy" value={`${data.metrics.occupancy}%`} trend="Stable" />
                    <MiniCard icon={<Bus size={20}/>} label="Active Buses" value={data.bus_performance.length} trend="Live" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Bar Chart Representation */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-[3rem] border dark:border-neutral-800 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black dark:text-white uppercase italic flex items-center gap-2"><BarChart3 className="text-red-600"/> Revenue Trend</h3>
                            <span className="text-[10px] font-black bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full dark:text-gray-400 uppercase">Last 7 Days</span>
                        </div>
                        <div className="flex items-end justify-between h-48 gap-2">
                            {data.trend.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div 
                                        className="w-full bg-red-600 rounded-t-xl transition-all duration-500 group-hover:bg-black dark:group-hover:bg-white" 
                                        style={{ height: `${(day.amount / (Math.max(...data.trend.map(d => d.amount)) || 1)) * 100}%`, minHeight: '10%' }}
                                    />
                                    <span className="text-[10px] font-black text-gray-400 uppercase">{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bus Performance */}
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-[3rem] border dark:border-neutral-800 shadow-xl">
                        <h3 className="text-lg font-black dark:text-white uppercase italic mb-8 flex items-center gap-2"><PieChart className="text-red-600"/> Top Routes</h3>
                        <div className="space-y-6">
                            {data.bus_performance.map((bus, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-black uppercase mb-2">
                                        <span className="dark:text-white">{bus.name}</span>
                                        <span className="text-red-600">₹{bus.revenue}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600" style={{ width: `${(bus.tickets / 40) * 100}%` }} />
                                    </div>
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
            <span className="text-[9px] font-black text-green-500 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-lg uppercase">{trend}</span>
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black dark:text-white tracking-tighter">{value}</p>
    </div>
);

export default Dashboard;