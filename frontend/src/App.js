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

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/home" />;
}

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/home" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
                    <Route path="/analysis" element={<PrivateRoute><AIAnalysis /></PrivateRoute>} />
                    <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
                    <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                    <Route path="/telehealth" element={<PrivateRoute><Telehealth /></PrivateRoute>} />
                    <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
                    <Route path="/premium" element={<PrivateRoute><Premium /></PrivateRoute>} />
                    <Route path="/superadmin" element={<SuperAdmin />} />
                    <Route path="/payment-admin" element={<PaymentAdmin />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;