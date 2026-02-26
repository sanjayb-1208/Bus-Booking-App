import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Armchair, ArrowLeft, ShieldCheck, User, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const TicketDetail = () => {
    const { id } = useParams(); // This is now the booking_number (PNR)
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTicketDetail = async () => {
            try {
                // Fetch by booking_number instead of numeric ID
                const res = await api.get(`/bookings/${id}`);
                setTicket(res.data);
            } catch (err) {
                toast.error("Ticket not found", err.response?.data?.message || "Please try again.");
                navigate('/my-tickets');
            } finally {
                setLoading(false);
            }
        };
        fetchTicketDetail();
    }, [id, navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center dark:bg-black">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 transition-colors">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/my-tickets')} className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-black text-xs uppercase mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to My Tickets
                </button>

                <div className="bg-white dark:bg-neutral-900 rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-neutral-800">
                    {/* Header: Journey Info */}
                    <div className="bg-red-600 p-10 text-white">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Booking Number</p>
                                <h2 className="text-xl font-black">#{ticket.booking_number}</h2>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                                <ShieldCheck size={24} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h1 className="text-3xl font-black uppercase truncate">{ticket.trip.source}</h1>
                                <p className="text-xs font-bold opacity-80 uppercase">Origin</p>
                            </div>
                            <div className="flex-1 border-t-2 border-dashed border-white/30 mx-6 mt-4 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/10 p-1 rounded-full backdrop-blur-sm">
                                    <Clock size={14} />
                                </div>
                            </div>
                            <div className="flex-1 text-right">
                                <h1 className="text-3xl font-black uppercase truncate">{ticket.trip.destination}</h1>
                                <p className="text-xs font-bold opacity-80 uppercase">Destination</p>
                            </div>
                        </div>
                    </div>

                    {/* Body: Passenger & Ticket Details */}
                    <div className="p-10">
                        {/* Passenger Details Section */}
                        <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b dark:border-neutral-800">
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Passenger Name</p>
                                <p className="font-black dark:text-white flex items-center gap-2 uppercase">
                                    <User size={16} className="text-red-600"/> {ticket.user_details.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Contact Number</p>
                                <p className="font-black dark:text-white flex items-center gap-2">
                                    <Phone size={16} className="text-red-600"/> {ticket.user_details.phone}
                                </p>
                            </div>
                        </div>

                        {/* Trip Details Section */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Departure Date</p>
                                <p className="font-black dark:text-white flex items-center gap-2">
                                    <Calendar size={16} className="text-red-600"/> {new Date(ticket.trip.departure_time).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Boarding Time</p>
                                <p className="font-black dark:text-white flex items-center gap-2">
                                    <Clock size={16} className="text-red-600"/> {new Date(ticket.trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Seats Reserved</p>
                                <p className="font-black dark:text-white flex items-center gap-2">
                                    <Armchair size={16} className="text-red-600"/> {ticket.seats.join(', ')}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Booking Status</p>
                                <p className="font-black text-green-500 uppercase tracking-tighter">{ticket.status}</p>
                            </div>
                        </div>

                        {/* Pass Visualizer */}
                        <div className="bg-gray-50 dark:bg-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-dashed dark:border-neutral-700">
                            <div className="w-full h-16 bg-black dark:bg-white rounded-md mb-4 flex gap-1 px-4 py-2 overflow-hidden">
                                {[...Array(30)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="h-full bg-white dark:bg-black rounded-full" 
                                        style={{ width: `${Math.floor(Math.random() * 4) + 1}px`, opacity: Math.random() + 0.5 }}
                                    ></div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 font-black tracking-[0.5em] uppercase text-center">
                                Show this ticket for Boarding
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;