import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { FileSpreadsheet, Search, MapPin, Calendar, Bus, Clock, ChevronDown, Ticket, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const cities = ["Chennai", "Madurai", "Bangalore", "Tirunelveli", "Tenkasi", "Tanjavur"];

const Home = () => {
    const [searchData, setSearchData] = useState({ source: '', destination: '', date: '' });
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateError, setDateError] = useState(false);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchTrips = async () => {
            setDateError(false);

            if (searchData.date) {
                const selectedDate = new Date(searchData.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    setDateError(true);
                    setTrips([]);
                    return;
                }
            }

            // Strictly wait for all three fields
            if (searchData.source && searchData.destination && searchData.date) {
                setLoading(true);
                try {
                    const response = await api.get(`/trips/search`, {
                        params: { 
                            source: searchData.source, 
                            destination: searchData.destination, 
                            travel_date: searchData.date 
                        }
                    });
                    setTrips(response.data);
                } catch (err) {
                    console.error("Search failed:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setTrips([]);
            }
        };

        const timeoutId = setTimeout(fetchTrips, 300);
        return () => clearTimeout(timeoutId);
    }, [searchData]);

    return (
        <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 pt-6 flex justify-end gap-6">
                {user?.is_admin && (
                    <>
                        <Link to="/admin/dashboard" className="flex items-center gap-2 text-[10px] font-black text-red-600 hover:text-black dark:hover:text-white uppercase tracking-[0.2em] transition-all">
                            <LayoutDashboard size={14} /> Dashboard
                        </Link>
                        <Link to="/admin/seed" className="flex items-center gap-2 text-[10px] font-black text-red-600 hover:text-black dark:hover:text-white uppercase tracking-[0.2em] transition-all">
                            <FileSpreadsheet size={14} /> Seed Data
                        </Link>
                    </>
                )}
                {user && (
                    <Link to="/my-tickets" className="flex items-center gap-2 text-[10px] font-black text-red-600 hover:text-black dark:hover:text-white uppercase tracking-[0.2em] transition-all group">
                        <Ticket size={14} className="group-hover:rotate-12 transition-transform" />
                        Bookings
                    </Link>
                )}
            </div>

            <div className="relative h-[350px] flex flex-col items-center justify-center text-center px-4 bg-gray-50 dark:bg-neutral-900/50">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">
                    FIND YOUR <span className="text-red-600">BUS</span> INSTANTLY
                </h1>
                
                <div className="absolute -bottom-10 w-full max-w-5xl px-4">
                    <div className="bg-white dark:bg-neutral-900 grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800">
                        <div className="relative flex items-center px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                            <MapPin className="text-red-600 mr-3" size={20} />
                            <select className="bg-transparent outline-none w-full dark:text-white text-sm appearance-none cursor-pointer" value={searchData.source} onChange={(e) => setSearchData({...searchData, source: e.target.value})}>
                                <option value="" disabled>Select Source</option>
                                {cities.map(city => <option key={city} value={city} className="dark:bg-neutral-900">{city}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        <div className="relative flex items-center px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                            <MapPin className="text-red-600 mr-3" size={20} />
                            <select className="bg-transparent outline-none w-full dark:text-white text-sm appearance-none cursor-pointer" value={searchData.destination} onChange={(e) => setSearchData({...searchData, destination: e.target.value})}>
                                <option value="" disabled>Select Destination</option>
                                {cities.map(city => <option key={city} value={city} className="dark:bg-neutral-900">{city}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        <div className={`flex items-center px-4 py-3 rounded-xl transition-colors ${dateError ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500' : 'bg-gray-50 dark:bg-neutral-800'}`}>
                            <Calendar className={dateError ? "text-red-500 mr-3" : "text-red-600 mr-3"} size={20} />
                            <input type="date" className="bg-transparent outline-none w-full dark:text-white text-sm cursor-pointer" value={searchData.date} onChange={(e) => setSearchData({...searchData, date: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto pt-24 pb-20 px-4">
                {dateError && (
                    <div className="flex items-center justify-center gap-2 text-red-600 font-black text-sm uppercase mb-10 bg-red-50 dark:bg-red-900/10 py-4 rounded-2xl animate-pulse">
                        <AlertCircle size={18} /> Enter a valid date
                    </div>
                )}
                <div className="grid gap-4">
                    {trips.length > 0 ? (
                        trips.map(trip => (
                            <div key={trip.id} className="group bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center hover:border-red-500 transition-all shadow-sm">
                                <div className="flex-1 w-full text-left">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{trip.bus_name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${trip.bus_type == "AC" ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500'}`}>
                                            {trip.bus_type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2 dark:text-gray-300">
                                            <Clock size={16} className="text-red-600" />
                                            <span>{new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-semibold dark:text-white">
                                            <span>{trip.source}</span>
                                            <span className="text-red-600 font-black">→</span>
                                            <span>{trip.destination}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Price</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">₹{trip.price}</p>
                                    </div>
                                    <button onClick={() => navigate(`/bus/${trip.trip_id}`)} className="bg-red-600 hover:bg-black dark:hover:bg-white dark:hover:text-black text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg">
                                        Book
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && !dateError && (
                            <div className="text-center py-20 bg-gray-50/50 dark:bg-neutral-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-neutral-800">
                                <Bus className="mx-auto text-gray-300 dark:text-neutral-800 mb-4" size={48} />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    {searchData.source && searchData.destination && searchData.date ? "No buses found." : "Fill all fields to search."}
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;