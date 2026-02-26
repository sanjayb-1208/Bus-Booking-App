import React, { useContext } from 'react';
import {AuthContext} from '../context/AuthContext';
import { Sun, Moon, Bus, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


const Navbar = ({ darkMode, setDarkMode }) => {
    const { user, logout, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    if(loading){
        return(<></>)
    }
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer">
                        <Bus className="text-red-600" size={32} />
                        <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">
                            ABC<span className="text-red-600">TRAVELS</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setDarkMode(!darkMode)} 
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 transition-colors"
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium dark:text-gray-300">Hi, {user.username}</span>
                                <button onClick={() => {logout();navigate("/")}} className="flex items-center gap-1 text-red-600 font-semibold text-sm hover:opacity-80 transition-opacity">
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors">Login</Link>
                                <Link to="/signup" className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;