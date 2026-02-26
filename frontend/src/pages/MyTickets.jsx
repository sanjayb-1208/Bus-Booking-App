import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Ticket, ChevronRight, Clock, Armchair, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MyTickets = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // Now returns the grouped JSON from our updated backend
                const res = await api.get('/bookings/my-tickets');
                setBookings(res.data);
            } catch (err) {
                toast.error("Failed to load your bookings");
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const isExpired = (departureTime) => {
        return new Date(departureTime) < new Date();
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center dark:bg-black">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 transition-colors">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-black dark:text-white uppercase tracking-tighter">My Tickets</h1>
                        <p className="text-gray-400 font-bold text-sm uppercase mt-2">Manage your group journeys</p>
                    </div>
                </div>
                
                <div className="grid gap-6">
                    {bookings.length > 0 ? bookings.map((ticket) => {
                        const expired = isExpired(ticket.trip.departure_time);
                        
                        return (
                            <div 
                                key={ticket.booking_number} // Use PNR as key
                                onClick={() => !expired && navigate(`/my-tickets/${ticket.booking_number}`)}
                                className={`bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between ${
                                    expired 
                                    ? 'opacity-60 cursor-not-allowed grayscale border-gray-200 dark:border-neutral-800' 
                                    : 'hover:border-red-600 cursor-pointer group hover:shadow-xl border-gray-100 dark:border-neutral-800'
                                }`}
                            >
                                <div className="flex gap-8 items-center">
                                    <div className={`hidden sm:flex p-5 rounded-[1.5rem] transition-all ${
                                        expired ? 'bg-gray-100 text-gray-400' : 'bg-red-50 dark:bg-red-950/20 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                                    }`}>
                                        {expired ? <Lock size={28} /> : <Ticket size={28} />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xl font-black dark:text-white uppercase">{ticket.trip.source}</span>
                                            <div className="h-[2px] w-4 bg-gray-300 dark:bg-neutral-700" />
                                            <span className="text-xl font-black dark:text-white uppercase">{ticket.trip.destination}</span>
                                            <span className="ml-2 px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black text-[8px] font-black rounded uppercase">
                                                {ticket.booking_number}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-y-2 gap-x-6 text-[11px] text-gray-400 font-black uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(ticket.trip.departure_time).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(ticket.trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="flex items-center gap-1.5 text-red-600">
                                                <Armchair size={14}/> Seats: {ticket.seats.join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-8 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-0 dark:border-neutral-800">
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Status</p>
                                        <p className={`text-sm font-black uppercase ${expired ? 'text-gray-500' : 'text-green-500'}`}>
                                            {expired ? 'Completed' : 'Upcoming'}
                                        </p>
                                    </div>
                                    {!expired && (
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-800 px-4 py-2 rounded-xl border dark:border-neutral-700 group-hover:bg-red-600 group-hover:border-red-600 transition-all">
                                            <ChevronRight size={16} className="text-gray-400 group-hover:text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-neutral-800">
                                <h3 className="text-xl font-black dark:text-white uppercase">No journeys found</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyTickets;