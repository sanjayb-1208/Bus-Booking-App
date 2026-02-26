import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation} from "react-router-dom";
import api from "../api/axios";
import { toast } from 'react-toastify';


const Signup = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const from = location.state?.from || "/";
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const handleSignUp = async (e) => {
            e.preventDefault();
            try {
                if((formData.password).length < 8){
                    toast.error("Password must be at least 8 characters long!");
                    return;
                }
                const response = await api.post('/auth/signup', formData);
                if(!response.data.success) {
                    toast.error(response.data.message || "Signup failed!");
                    return;
                }
                toast.success("Account created!");
                navigate('/login', { state: { from } });
            } catch (error) {
                toast.error("Signup failed! Please try again.", error.response?.data?.message || "Please try again.");
            }
        };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white dark:bg-black px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">JOIN <span className="text-red-600">ABC TRAVELS</span></h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Fast, secure, and premium bus travel.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSignUp}>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                        <input 
                            required = {true}
                            value = {formData.username}
                            type="text" 
                            placeholder="Full Name"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl outline-none focus:border-red-600 dark:text-white transition-all"
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>

                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                        <input 
                            required = {true}
                            type="email" 
                            placeholder="Email Address"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl outline-none focus:border-red-600 dark:text-white transition-all"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                        <input
                            required = {true}
                            type="password" 
                            placeholder="Create Password"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl outline-none focus:border-red-600 dark:text-white transition-all"
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <input type = "submit" value = "CREATE ACCOUNT" className="w-full bg-red-600 hover:bg-black dark:hover:bg-white dark:hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-600/10 active:scale-95">
                    </input>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500 dark:text-neutral-500 font-medium">
                    Already a member? <Link to="/login" className="text-red-600 font-bold hover:underline">Login here</Link>
                </p>
            </div>
        </div>
    );
}


export default Signup;