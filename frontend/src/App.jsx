import React, { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BusSeatLayout from "./pages/BusSeatLayout";
import MyTickets from './pages/MyTickets';
import TicketDetail from "./pages/TicketDetail";
import AdminSeed from './pages/AdminSeed';
import AdminDashboard from './pages/AdminDashboard';


// Layout component to wrap pages with Navbar and Dark Mode container
const Layout = ({ darkMode, setDarkMode }) => (
  <div className={darkMode ? 'dark' : ''}>
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main>
        <Outlet />
      </main>
    </div>
  </div>
);

const App = () => {
  // Theme state initialized from system preference or local storage
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
    <ToastContainer position="top-right" theme={darkMode ? "dark" : "light"}/>
    <Routes>
      <Route element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />}>
        <Route path="/" element={<Home />} />
        <Route path="/bus/:id" element={<BusSeatLayout />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/my-tickets/:id" element={<TicketDetail />} />
        <Route path='admin/seed' element = {<AdminSeed />} />
        <Route path='admin/dashboard' element = {<AdminDashboard />} />
      </Route>
      <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
    </Routes>
    </>
  );
}

export default App;