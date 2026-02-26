import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { Mail, Lock, ArrowRight } from 'lucide-react';
import api from "../api/axios";
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Hook to access state passed via navigate
    const { getAuthState } = useContext(AuthContext);
    const [formData, setFormData] = useState({ email: '', password: '' });

    // Determine where to send the user after successful login
    // If state exists (from navigate), go there; otherwise, go Home
    const from = location.state?.from || "/";

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', formData);
            
            if (!response.data.success) {
                toast.error(response.data.message || "Login failed!");
                return;
            }

            toast.success("Login successful!");
            localStorage.setItem('token', response.data.access_token);
            
            // Sync the auth state
            await getAuthState();
            
            // Redirect to the intended page (e.g., /bus/123) or Home
            navigate(from, { replace: true }); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed! Please try again.");
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white dark:bg-black px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                        Welcome <span className="text-red-600">Back</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium italic">
                        {location.state?.from ? "Login to continue your booking" : "Enter your details to access your account."}
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                        <input 
                            required={true}
                            type="email" 
                            placeholder="Email Address"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl outline-none focus:border-red-600 dark:text-white transition-all font-bold"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                        <input 
                            required={true}
                            type="password" 
                            placeholder="Password"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl outline-none focus:border-red-600 dark:text-white transition-all font-bold"
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-black dark:hover:bg-white dark:hover:text-black text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/10 active:scale-95 uppercase tracking-widest"
                    >
                        Sign In <ArrowRight size={18} />
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500 dark:text-neutral-500 font-medium">
                    New here? <Link 
                                to="/signup" 
                                state={{ from: location.state?.from }} // Pass the original destination forward
                                className="text-red-600 font-bold hover:underline"
                                >
                                Create an account
                            </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;