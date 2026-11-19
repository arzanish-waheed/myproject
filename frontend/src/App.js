import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import AIAnalysis from './pages/AIAnalysis';
import Appointments from './pages/Appointments';
import Reports from './pages/Reports';
import Telehealth from './pages/Telehealth';
import LandingPage from './pages/LandingPage';
import Chat from './pages/Chat';
import SuperAdmin from './pages/SuperAdmin';
import Premium from './pages/Premium';
import PaymentAdmin from './pages/PaymentAdmin';
import BrightnessWidget from './components/BrightnessWidget';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/home" />;
}

function VerifiedDentistRoute({ children }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/home" />;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isDentist = user.role === 'admin' || user.role === 'dentist' || (user.role && user.role !== 'patient');
    if (isDentist && !user.is_verified) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <BrightnessWidget />
                <Routes>
                    <Route path="/home" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/patients" element={<VerifiedDentistRoute><Patients /></VerifiedDentistRoute>} />
                    <Route path="/analysis" element={<VerifiedDentistRoute><AIAnalysis /></VerifiedDentistRoute>} />
                    <Route path="/appointments" element={<VerifiedDentistRoute><Appointments /></VerifiedDentistRoute>} />
                    <Route path="/reports" element={<VerifiedDentistRoute><Reports /></VerifiedDentistRoute>} />
                    <Route path="/telehealth" element={<VerifiedDentistRoute><Telehealth /></VerifiedDentistRoute>} />
                    <Route path="/chat" element={<VerifiedDentistRoute><Chat /></VerifiedDentistRoute>} />
                    <Route path="/premium" element={<PrivateRoute><Premium /></PrivateRoute>} />
                    <Route path="/superadmin" element={<SuperAdmin />} />
                    <Route path="/payment-admin" element={<PaymentAdmin />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;