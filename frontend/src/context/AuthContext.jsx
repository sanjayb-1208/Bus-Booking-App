import React, {createContext, useState, useEffect } from "react";
import api from "../api/axios";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const getAuthState = async () => {
    try {
        const token = localStorage.getItem('token');
        if(!token){
            setLoading(false);
            return;
        }
        if (token) {
            const response = await api.get('/user/me'); 
            setUser(response.data);
        }
    } catch (error) {
        console.log(error);
        localStorage.removeItem('token');
        setUser(null);
    } finally {
        setLoading(false);
    }
};

        useEffect(() => {
        getAuthState();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {user, setUser,  loading, logout, getAuthState};

    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )

}

export default AuthProvider;