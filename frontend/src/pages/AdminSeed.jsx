import React, { useState, useContext } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import {AuthContext} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";

const AdminSeed = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { user } = useContext(AuthContext);

    if(!user || !user.is_admin){
        toast.error("Youre not authorized to access this page");
        navigate("/")
    }
    const handleUpload = async () => {
        if (!file) return toast.error("Select a file first");
        
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await api.post('/setup/seed-schedule', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Schedule Seeded Successfully!");
            setFile(null);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Seeding failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-20 px-4">
            <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-neutral-800 text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <FileSpreadsheet size={40} />
                </div>
                <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-2">Data Seeding</h1>
                <p className="text-gray-400 text-sm font-bold uppercase mb-8">Upload Weekly Schedule Excel</p>

                <label className="block border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl p-8 cursor-pointer hover:border-red-600 transition-colors mb-6">
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept=".xlsx, .xls" />
                    <Upload className="mx-auto text-gray-300 mb-2" />
                    <span className="text-xs font-black text-gray-500 uppercase">{file ? file.name : "Select Excel File"}</span>
                </label>

                <button 
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full bg-black dark:bg-white dark:text-black text-white font-black py-4 rounded-2xl uppercase tracking-widest disabled:opacity-20 transition-all shadow-xl"
                >
                    {uploading ? "Seeding..." : "Start Seeding"}
                </button>
            </div>
        </div>
    );
};

export default AdminSeed;