import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Armchair, MapPin, DoorOpen, ArrowLeft, ShieldCheck, User as UserIcon, Settings as SteeringWheel, Clock } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';

const BusSeatLayout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useContext(AuthContext);
    
    const [trip, setTrip] = useState(null);
    const [bookedSeats, setBookedSeats] = useState([]); 
    const [lockedSeats, setLockedSeats] = useState([]); 
    const [selectedSeats, setSelectedSeats] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); 
    const [passengerData, setPassengerData] = useState({ gender: '', age: '', phone_number: '' });
    const [timeLeft, setTimeLeft] = useState(null);

    const socketRef = useRef(null);
    const selectedRef = useRef([]);

    useEffect(() => { selectedRef.current = selectedSeats; }, [selectedSeats]);

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error("Please login to book seats");
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            setPassengerData({
                gender: user.gender || '',
                age: user.age || '',
                phone_number: user.phone_number || ''
            });
        }
    }, [user]);

    // Timer Logic
    useEffect(() => {
        if (selectedSeats.length > 0 && timeLeft === null) {
            setTimeLeft(300); 
        } else if (selectedSeats.length === 0) {
            setTimeLeft(null);
        }
        if (timeLeft === 0) {
            selectedSeats.forEach(s => api.post(`/bookings/unlock-seat/${id}/${s}`).catch(() => {}));
            setSelectedSeats([]);
            setTimeLeft(null);
            toast.error("Session expired. Seats released.");
        }
        if (timeLeft === null) return;
        const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [selectedSeats, timeLeft, id]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // WebSocket Sync
    useEffect(() => {
        if (authLoading || !user || !id) return;
        let isStopped = false;

        const connect = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const ws = new WebSocket(`${protocol}://localhost:8000/ws/seats/${id}`);
            
            ws.onmessage = (event) => {
                if (isStopped) return;
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case "INITIAL_STATE": {
                        const othersLocks = [];
                        const myRecoveredSeats = [];

                        // UPDATED: Check owner of each lock
                        data.locked_seats.forEach(lock => {
                            if (Number(lock.user_id) === Number(user?.id)) {
                                myRecoveredSeats.push(Number(lock.seat_no));
                            } else {
                                othersLocks.push(Number(lock.seat_no));
                            }
                        });

                        setLockedSeats(othersLocks);
                        setSelectedSeats(myRecoveredSeats);
                        break;
                    }
                    case "SEAT_LOCKED": {
                        if (Number(data.user_id) !== Number(user?.id)) {
                            setLockedSeats(prev => [...new Set([...prev, Number(data.seat_no)])]);
                        }
                        break;
                    }
                    case "SEAT_UNLOCKED": {
                        const seatNum = Number(data.seat_no);
                        setLockedSeats(prev => prev.filter(s => Number(s) !== seatNum));
                        if (selectedRef.current.includes(seatNum) && Number(data.user_id) !== Number(user?.id)) {
                            setSelectedSeats(prev => prev.filter(s => s !== seatNum));
                        }
                        break;
                    }
                    case "SEAT_BOOKED": {
                        const nums = data.seat_numbers.map(Number);
                        setBookedSeats(prev => [...new Set([...prev, ...nums])]);
                        setLockedSeats(prev => prev.filter(s => !nums.includes(s)));
                        setSelectedSeats(prev => prev.filter(s => !nums.includes(s)));
                        break;
                    }
                    default: break;
                }
            };

            ws.onclose = () => { if (!isStopped) setTimeout(connect, 3000); };
            socketRef.current = ws;
        };

        connect();
        return () => {
            isStopped = true;
            if (socketRef.current) socketRef.current.close();
        };
    }, [id, user, authLoading]);

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                const [tripRes, seatsRes] = await Promise.all([
                    api.get(`/trips/${id}`), 
                    api.get(`/trips/${id}/seats`)
                ]);
                setTrip(tripRes.data);
                setBookedSeats(seatsRes.data.filter(x => x.is_booked).map(x => Number(x.seat_number)));
            } catch (err) { navigate('/'); } finally { setLoading(false); }
        };
        if (id) loadData();
    }, [id, navigate]);

    const toggleSeat = async (num) => {
        if (bookedSeats.includes(num)) return;
        if (lockedSeats.includes(num)) return toast.error("Seat held by another user");

        try {
            if (selectedSeats.includes(num)) {
                await api.post(`/bookings/unlock-seat/${id}/${num}`);
                setSelectedSeats(prev => prev.filter(s => s !== num));
            } else {
                if (selectedSeats.length >= 6) return toast.warning("Max 6 seats");
                await api.post(`/bookings/lock-seat/${id}/${num}`);
                setSelectedSeats(prev => [...prev, num]);
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Action failed");
        }
    };

    const renderGrid = () => {
        let count = 1;
        const grid = [];
        for (let r = 1; r <= 11; r++) {
            for (let c = 1; c <= 6; c++) {
                if (r === 1) {
                    if (c === 6) grid.push({ type: 'driver' });
                    else grid.push({ type: 'aisle' });
                } else if ((r === 2 || r === 10) && c === 1) {
                    grid.push({ type: 'door' });
                } else if (r === 11 || c === 1 || c >= 4) {
                    grid.push({ type: 'seat', num: count++ });
                } else {
                    grid.push({ type: 'aisle' });
                }
            }
        }
        return grid;
    };

    if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-white dark:bg-black py-8 px-4 font-sans text-neutral-900 dark:text-neutral-100">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
                <div className={`lg:col-span-7 bg-gray-50 dark:bg-neutral-900 p-8 rounded-[2.5rem] border dark:border-neutral-800 transition-all ${step === 2 ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div className="flex justify-between items-center mb-10">
                        <div className="text-[10px] font-black bg-neutral-200 dark:bg-neutral-800 px-3 py-1 rounded">FRONT</div>
                        <div className="flex gap-4">
                            <Legend color="bg-white" label="Free" />
                            <Legend color="bg-red-600" label="Selected" />
                            <Legend color="bg-orange-500" label="Held" />
                            <Legend color="bg-gray-300" label="Sold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 max-w-xs mx-auto">
                        {renderGrid().map((cell, i) => (
                            <div key={i} className="h-10 flex items-center justify-center">
                                {cell.type === 'seat' && (
                                    <button
                                        onClick={() => toggleSeat(cell.num)}
                                        className={`w-full h-full rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all border-2 ${
                                            bookedSeats.includes(cell.num) ? 'bg-gray-300 border-transparent opacity-40 cursor-not-allowed' :
                                            selectedSeats.includes(cell.num) ? 'bg-red-600 border-red-700 text-white shadow-lg scale-105' :
                                            lockedSeats.includes(cell.num) ? 'bg-orange-500 border-orange-600 text-white animate-pulse' :
                                            'bg-white dark:bg-neutral-800 border-transparent text-gray-400 hover:border-red-500'
                                        }`}
                                    >
                                        <Armchair size={14} /> {cell.num}
                                    </button>
                                )}
                                {cell.type === 'driver' && (
                                    <div className="w-full h-full rounded-xl flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                                        Driver
                                    </div>
                                )}
                                {cell.type === 'door' && <DoorOpen size={20} className="text-neutral-300 dark:text-neutral-700" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-5">
                    {timeLeft !== null && (
                        <div className="mb-4 bg-red-600 text-white p-4 rounded-2xl flex items-center justify-between animate-bounce">
                            <div className="flex items-center gap-2 font-black text-xs uppercase"><Clock size={16}/> Finish booking in:</div>
                            <div className="text-xl font-black">{formatTime(timeLeft)}</div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border dark:border-neutral-800 shadow-2xl sticky top-8">
                        {step === 1 ? (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Summary</h2>
                                <div className="flex gap-3 items-center text-sm font-bold opacity-60"><MapPin size={16}/> {trip?.source} → {trip?.destination}</div>
                                <div className="bg-gray-50 dark:bg-neutral-800 p-5 rounded-2xl flex justify-between items-center">
                                    <div className="text-xs font-bold text-gray-500">Seats: {selectedSeats.length > 0 ? selectedSeats.sort((a,b)=>a-b).join(', ') : 'None'}</div>
                                    <div className="text-2xl font-black text-red-600">₹{selectedSeats.length * (trip?.price || 0)}</div>
                                </div>
                                <button onClick={() => setStep(2)} disabled={selectedSeats.length === 0} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase hover:bg-black transition-all disabled:opacity-30">Continue</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest"><ArrowLeft size={12}/> Back</button>
                                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl mb-2">
                                    <UserIcon size={20} className="text-red-600"/>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Passenger</p>
                                        <p className="font-black uppercase">{user?.full_name || user?.username}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" placeholder="Age" className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl outline-none border border-transparent focus:border-red-600 transition-all" value={passengerData.age} onChange={e => setPassengerData({...passengerData, age: e.target.value})} />
                                    <select className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl outline-none border border-transparent focus:border-red-600 transition-all" value={passengerData.gender} onChange={e => setPassengerData({...passengerData, gender: e.target.value})}>
                                        <option value="">Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <input placeholder="Phone Number" className="w-full bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl outline-none border border-transparent focus:border-red-600 transition-all" value={passengerData.phone_number} onChange={e => setPassengerData({...passengerData, phone_number: e.target.value})} />
                                <button onClick={() => {
                                    if (!passengerData.age || !passengerData.gender || !passengerData.phone_number) return toast.error("Fill all details");
                                    api.post('/bookings/', { trip_id: parseInt(id), seat_numbers: selectedSeats, ...passengerData, age: parseInt(passengerData.age) })
                                    .then(() => { toast.success("Booking Confirmed!"); navigate('/my-tickets'); })
                                    .catch((err) => toast.error(err.response?.data?.detail || "Booking Failed"));
                                }} className="w-full bg-black dark:bg-white dark:text-black text-white py-5 mt-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                                    <ShieldCheck size={20}/> Confirm & Pay
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Legend = ({ color, label }) => (
    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase">
        <div className={`w-3 h-3 rounded-full ${color} border dark:border-neutral-700`} /> {label}
    </div>
);

export default BusSeatLayout;