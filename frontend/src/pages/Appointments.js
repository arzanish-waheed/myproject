import React, { useState, useEffect, useCallback } from 'react';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import AnimatedBG from '../components/AnimatedBG';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
                position: 'fixed', bottom: 30, right: 30, zIndex: 9999,
                background: type === 'error' ? '#EF4444' : '#10B981',
                color: '#fff', padding: '12px 24px', borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: 14
            }}
        >
            {message}
        </motion.div>
    );
};

const dark = {
    btn: { background: 'linear-gradient(135deg, #0D9488, #0891B2)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    btnOutline: { background: 'transparent', color: '#0D9488', border: '1px solid #0D9488', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    btnDanger: { background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    btnSuccess: { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    btnWarning: { background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    card: { background: '#0F1928', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(13,148,136,0.15)', padding: 20 },
    table: { background: 'rgba(15,25,45,0.8)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(13,148,136,0.15)' },
    thead: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr 1.5fr', padding: '12px 20px', background: 'rgba(13,148,136,0.08)', color: '#64748B', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
    trow: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr 1.5fr', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
    modal: { background: '#0F1928', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 16, padding: 32, width: 420, boxShadow: '0 40px 80px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
    input: { width: '100%', padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: '#E2E8F0', colorScheme: 'dark' },
    tab: (active) => ({ padding: '12px 24px', background: active ? 'rgba(13,148,136,0.1)' : 'transparent', color: active ? '#14B8A6' : '#94A3B8', border: 'none', borderBottom: active ? '2px solid #14B8A6' : '2px solid transparent', cursor: 'pointer', fontSize: 15, fontWeight: 600, transition: 'all 0.2s' })
};

const statusConfig = {
    pending: { label: 'Awaiting Approval', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', pulse: true },
    approved: { label: 'Approved ✓', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Declined', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    alternative_proposed: { label: 'New Time Suggested', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
    booked: { label: 'Booked', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    completed: { label: 'Completed', color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
    cancelled: { label: 'Cancelled', color: '#94A3B8', bg: 'rgba(255,255,255,0.05)' },
    auto_cancelled: { label: 'Cancelled', color: '#94A3B8', bg: 'rgba(255,255,255,0.05)' },
};

const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: config.bg, color: config.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {config.pulse && (
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
            )}
            {config.label}
        </div>
    );
};

const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Appointments() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPatient = user.role === 'patient';

    const [appointments, setAppointments] = useState([]);
    const [dentists, setDentists] = useState([]);
    const [availability, setAvailability] = useState([]);
    
    // Patient State
    const [bookModal, setBookModal] = useState(false);
    const [bookForm, setBookForm] = useState({ dentist_id: '', date: '', time: '', reason: '', booking_type: 'online' });
    const [alreadyBooked, setAlreadyBooked] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [dentistAvailability, setDentistAvailability] = useState([]);
    const [slotError, setSlotError] = useState('');

    // Dentist State
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingCount, setPendingCount] = useState(0);
    const [altModal, setAltModal] = useState(false);
    const [altForm, setAltForm] = useState({ appointment_id: '', date: '', time: '', message: '' });
    const [availForm, setAvailForm] = useState({ day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', slot_duration: 30 });

    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    useEffect(() => {
        const initLoad = async () => {
            try {
                await API.post('/appointments/auto-cancel');
                fetchAppointments();
                if (isPatient) {
                    const res = await API.get('/dentists');
                    setDentists(res.data);
                } else {
                    fetchMyAvailability();
                    fetchPendingCount();
                }
            } catch (err) {
                console.error(err);
            }
        };
        initLoad();
    }, [isPatient]);

    const fetchAppointments = async () => {
        try {
            const res = await API.get('/appointments');
            setAppointments(res.data);
        } catch {}
    };

    const fetchMyAvailability = async () => {
        try {
            const res = await API.get('/availability');
            setAvailability(res.data);
        } catch {}
    };

    const fetchPendingCount = async () => {
        try {
            const res = await API.get('/appointments/pending-count');
            setPendingCount(res.data.count);
        } catch {}
    };

    // --- PATIENT FUNCTIONS ---
    const handleDentistSelect = async (dentist_id) => {
        setBookForm(prev => ({ ...prev, dentist_id, date: '', time: '' }));
        setAvailableSlots([]);
        setAlreadyBooked(false);
        if (!dentist_id) return setDentistAvailability([]);

        // Check if already has active appointment with this dentist
        const activeAppt = appointments.find(a => 
            String(a.admin_id) === String(dentist_id) && 
            !['completed', 'cancelled', 'auto_cancelled', 'rejected'].includes(a.status)
        );
        if (activeAppt) setAlreadyBooked(true);
        
        try {
            const res = await API.get(`/availability/${dentist_id}`);
            setDentistAvailability(res.data);
        } catch (err) {
            showToast('Failed to load availability', 'error');
        }
    };

    const handleDateSelect = async (e) => {
        const selectedDate = e.target.value;
        if (!selectedDate) return;

        if (!bookForm.dentist_id) {
            setSlotError('Please select a dentist first to see their available dates.');
            setBookForm(prev => ({ ...prev, date: '' }));
            return;
        }
        
        const dayOfWeekIndex = new Date(selectedDate).getDay();
        const dayStr = dayMap[dayOfWeekIndex];
        setSlotError('');
        setBookedSlots([]);
        
        // Backend stores day_of_week as int (0=Sunday...6=Saturday)
        const dayAvail = dentistAvailability.find(a => Number(a.day_of_week) === dayOfWeekIndex);
        if (!dayAvail) {
            setSlotError(`Dentist is not available on ${dayStr}s. Please choose another date.`);
            setBookForm(prev => ({ ...prev, date: '' }));
            setAvailableSlots([]);
            return;
        }

        setBookForm(prev => ({ ...prev, date: selectedDate, time: '' }));
        
        // Generate time slots
        const slots = [];
        let currTime = new Date(`1970-01-01T${dayAvail.start_time}`);
        const endTime = new Date(`1970-01-01T${dayAvail.end_time}`);
        const duration = dayAvail.slot_duration || 30;

        while (currTime < endTime) {
            slots.push(currTime.toTimeString().substring(0, 5));
            currTime.setMinutes(currTime.getMinutes() + duration);
        }
        setAvailableSlots(slots);

        // Fetch already booked slots for this dentist on this date
        try {
            const res = await API.get(`/appointments/booked-slots?dentist_id=${bookForm.dentist_id}&date=${selectedDate}`);
            setBookedSlots(res.data.booked_slots || []);
        } catch (err) {
            console.error('Failed to fetch booked slots:', err);
        }
    };

    const handleTimeSelect = (slot) => {
        if (bookedSlots.includes(slot)) {
            setSlotError('This time slot is already booked by another patient. Please select a different time.');
            return;
        }
        setSlotError('');
        setBookForm({...bookForm, time: slot});
    };

    const submitBooking = async () => {
        if (!bookForm.dentist_id || !bookForm.date || !bookForm.time) {
            return showToast('Please fill all required fields.', 'error');
        }

        if (alreadyBooked) {
            return showToast('You already have an active appointment with this dentist.', 'error');
        }

        try {
            await API.post('/appointments', {
                admin_id: bookForm.dentist_id,
                appointment_date: bookForm.date,
                time_slot: bookForm.time,
                reason: bookForm.reason,
                booking_type: bookForm.booking_type
            });
            showToast(bookForm.booking_type === 'online' ? 'Appointment request sent! Waiting for dentist approval.' : 'Physical appointment booked successfully!');
            setBookModal(false);
            fetchAppointments();
            setBookForm({ dentist_id: '', date: '', time: '', reason: '', booking_type: 'online' });
            setAlreadyBooked(false);
        } catch (err) {
            console.error("Booking Error:", err);
            showToast(err.response?.data?.detail || err.message || 'Failed to book appointment.', 'error');
        }
    };

    const patientAction = async (apptId, actionEndpoint) => {
        try {
            await API.post(`/appointments/${actionEndpoint}`, { appointment_id: apptId });
            showToast('Response recorded successfully.');
            fetchAppointments();
        } catch (err) {
            showToast('Failed to submit response.', 'error');
        }
    };

    // --- DENTIST FUNCTIONS ---
    const respondAppointment = async (apptId, action, extra = {}) => {
        try {
            await API.post('/appointments/respond', { appointment_id: apptId, action, ...extra });
            showToast('Appointment updated successfully.');
            fetchAppointments();
            fetchPendingCount();
            if (action === 'alternative') setAltModal(false);
        } catch (err) {
            showToast('Failed to respond.', 'error');
        }
    };

    const addAvailability = async () => {
        try {
            // Convert day name to int for backend (0=Sunday...6=Saturday)
            const dayIndex = dayMap.indexOf(availForm.day_of_week);
            if (dayIndex === -1) return showToast('Invalid day selected.', 'error');
            // Ensure time has seconds for Supabase time column
            const startTime = availForm.start_time.length === 5 ? availForm.start_time + ':00' : availForm.start_time;
            const endTime = availForm.end_time.length === 5 ? availForm.end_time + ':00' : availForm.end_time;
            await API.post('/availability', {
                day_of_week: dayIndex,
                start_time: startTime,
                end_time: endTime,
                slot_duration: availForm.slot_duration
            });
            showToast('Availability added.');
            fetchMyAvailability();
        } catch (err) {
            console.error('Availability error:', err?.response?.data || err);
            showToast(err?.response?.data?.detail || 'Failed to add availability.', 'error');
        }
    };

    const deleteAvailability = async (id) => {
        try {
            await API.delete(`/availability/${id}`);
            showToast('Availability removed.');
            fetchMyAvailability();
        } catch (err) {
            showToast('Failed to remove availability.', 'error');
        }
    };

    const cancelAppointment = async (apptId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await API.post('/appointments/cancel', { appointment_id: apptId });
            showToast('Appointment cancelled.');
            fetchAppointments();
        } catch (err) {
            showToast(err?.response?.data?.detail || 'Failed to cancel.', 'error');
        }
    };

    // --- RENDERERS ---
    const renderPatientView = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>📅 My Appointments</h2>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setBookModal(true)} style={dark.btn}>+ Book Appointment</motion.button>
            </div>
            
            <div style={dark.table}>
                <div style={{ ...dark.thead, gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1.2fr 0.6fr' }}>
                    <span>Dentist</span><span>Date</span><span>Time</span><span>Reason</span><span>Status</span><span>Action</span>
                </div>
                {appointments.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No appointments found.</div>
                ) : (
                    appointments.map(a => (
                        <div key={a.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ ...dark.trow, gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1.2fr 0.6fr' }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{a.dentist_name || '—'}</span>
                                <span style={{ color: '#E2E8F0' }}>{a.appointment_date}</span>
                                <span style={{ color: '#E2E8F0' }}>{a.time_slot}</span>
                                <span style={{ color: '#94A3B8' }}>{a.reason || '—'}</span>
                                <div>{getStatusBadge(a.status)}</div>
                                <div>
                                    {!['cancelled', 'auto_cancelled', 'completed', 'rejected'].includes(a.status) && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            onClick={() => cancelAppointment(a.id)}
                                            style={{
                                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                                color: '#EF4444', padding: '6px 12px', borderRadius: 6,
                                                cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
                                            }}
                                            title="Cancel Appointment"
                                        >✕ Cancel</motion.button>
                                    )}
                                </div>
                            </div>
                            {a.status === 'alternative_proposed' && (
                                <div style={{ background: 'rgba(249,115,22,0.05)', padding: '12px 20px', borderTop: '1px dashed rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ color: '#E2E8F0', fontSize: 13 }}>
                                        <strong>Suggested Time:</strong> {a.proposed_date} at {a.proposed_time}
                                        {a.dentist_message && <span> <br/><span style={{color: '#94A3B8'}}>Message: {a.dentist_message}</span></span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => patientAction(a.id, 'accept-alternative')} style={dark.btnSuccess}>Accept</button>
                                        <button onClick={() => patientAction(a.id, 'decline-alternative')} style={dark.btnDanger}>Decline</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {bookModal && (
                    <div style={dark.overlay}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{...dark.modal, width: 500}}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0D9488, #0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Book Appointment</h3>
                                    <div style={{ color: '#64748B', fontSize: 12 }}>Select a dentist, date & time</div>
                                </div>
                            </div>

                            {/* Already Booked Warning Banner */}
                            {alreadyBooked && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
                                        borderRadius: 10, padding: '14px 16px', marginBottom: 20,
                                        display: 'flex', alignItems: 'center', gap: 12
                                    }}
                                >
                                    <div style={{ fontSize: 24 }}>⚠️</div>
                                    <div>
                                        <div style={{ color: '#F87171', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Already Booked</div>
                                        <div style={{ color: '#FCA5A5', fontSize: 12 }}>You already have an active appointment with this dentist. Cancel it first or choose a different dentist.</div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Slot Error Banner */}
                            {slotError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                                        borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                                        display: 'flex', alignItems: 'center', gap: 10
                                    }}
                                >
                                    <span style={{ fontSize: 18 }}>⚠️</span>
                                    <span style={{ color: '#FCD34D', fontSize: 13 }}>{slotError}</span>
                                </motion.div>
                            )}
                            
                            <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, display: 'block', fontWeight: 600 }}>👨‍⚕️ Select Dentist</label>
                            <select 
                                style={dark.input} 
                                value={bookForm.dentist_id} 
                                onChange={e => handleDentistSelect(e.target.value)}
                            >
                                <option value="">-- Choose Dentist --</option>
                                {dentists.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
                            </select>

                            {/* Step 2: Appointment Type */}
                            <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, display: 'block', fontWeight: 600 }}>📋 Appointment Type</label>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                <motion.div 
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setBookForm({...bookForm, booking_type: 'online'})}
                                    style={{
                                        flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                                        background: bookForm.booking_type === 'online' ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.03)',
                                        border: `1.5px solid ${bookForm.booking_type === 'online' ? '#0D9488' : 'rgba(255,255,255,0.08)'}`,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: 18, marginBottom: 4 }}>🌐</div>
                                    <div style={{ color: bookForm.booking_type === 'online' ? '#14B8A6' : '#E2E8F0', fontWeight: 600, fontSize: 13 }}>Online Consultation</div>
                                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>Video/Audio call · Needs approval</div>
                                </motion.div>
                                <motion.div 
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setBookForm({...bookForm, booking_type: 'physical'})}
                                    style={{
                                        flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                                        background: bookForm.booking_type === 'physical' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                                        border: `1.5px solid ${bookForm.booking_type === 'physical' ? '#3B82F6' : 'rgba(255,255,255,0.08)'}`,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: 18, marginBottom: 4 }}>🏥</div>
                                    <div style={{ color: bookForm.booking_type === 'physical' ? '#60A5FA' : '#E2E8F0', fontWeight: 600, fontSize: 13 }}>Physical Visit</div>
                                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>In-person · Direct booking</div>
                                </motion.div>
                            </div>

                            {/* Step 3: Date & Time Selection */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6, display: 'block', fontWeight: 600 }}>📅 Select Date</label>
                                    <input style={{...dark.input, marginBottom: 0}} type="date" value={bookForm.date} onChange={handleDateSelect} min={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6, display: 'block', fontWeight: 600 }}>⏰ Select Time</label>
                                    <input 
                                        style={{...dark.input, marginBottom: 0}} 
                                        type="time" 
                                        value={bookForm.time} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            // Check if within available slots
                                            if (availableSlots.length > 0 && !availableSlots.includes(val)) {
                                                setSlotError('This time is outside the dentist\'s available hours. Please pick a time from the available slots below.');
                                            } else if (bookedSlots.includes(val)) {
                                                setSlotError('This time slot is already booked by another patient. Please select a different time.');
                                            } else {
                                                setSlotError('');
                                            }
                                            setBookForm({...bookForm, time: val});
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Dentist Availability Info */}
                            {dentistAvailability.length > 0 && (
                                        <div style={{
                                            background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)',
                                            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                                        }}>
                                            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>DENTIST'S AVAILABLE HOURS</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {dentistAvailability.map((a, i) => (
                                                    <div key={i} style={{
                                                        background: 'rgba(255,255,255,0.04)', padding: '4px 10px',
                                                        borderRadius: 6, fontSize: 12, color: '#14B8A6', fontWeight: 600,
                                                    }}>
                                                        {dayMap[Number(a.day_of_week)]?.substring(0,3)}: {a.start_time?.substring(0,5)} - {a.end_time?.substring(0,5)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            {/* Available Time Slots Grid */}
                            {bookForm.date && availableSlots.length > 0 && (
                                <>
                                    <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, display: 'block', fontWeight: 600 }}>🕐 Available Slots {bookedSlots.length > 0 && <span style={{ color: '#F59E0B', fontWeight: 400 }}>(grey = already booked)</span>}</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                        {availableSlots.map(s => {
                                            const isBooked = bookedSlots.includes(s);
                                            const isSelected = bookForm.time === s;
                                            return (
                                                <motion.div 
                                                    key={s} 
                                                    whileHover={!isBooked ? { scale: 1.05 } : {}}
                                                    whileTap={!isBooked ? { scale: 0.95 } : {}}
                                                    onClick={() => handleTimeSelect(s)}
                                                    style={{ 
                                                        padding: '8px 14px', 
                                                        background: isBooked ? 'rgba(239,68,68,0.08)' : isSelected ? '#0D9488' : 'rgba(255,255,255,0.05)', 
                                                        color: isBooked ? '#64748B' : isSelected ? '#fff' : '#E2E8F0', 
                                                        borderRadius: 8, 
                                                        cursor: isBooked ? 'not-allowed' : 'pointer', 
                                                        fontSize: 13, fontWeight: 600,
                                                        border: `1px solid ${isBooked ? 'rgba(239,68,68,0.2)' : isSelected ? '#0D9488' : 'rgba(255,255,255,0.06)'}`,
                                                        opacity: isBooked ? 0.5 : 1,
                                                        textDecoration: isBooked ? 'line-through' : 'none',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {s}
                                                    {isBooked && <span style={{ fontSize: 10, marginLeft: 4 }}>🔒</span>}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Reason */}
                            <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, display: 'block', fontWeight: 600 }}>💬 Reason (Optional)</label>
                            <input style={dark.input} placeholder="Briefly describe your issue..." value={bookForm.reason} onChange={e => setBookForm({...bookForm, reason: e.target.value})} />
                            
                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <button 
                                    style={{ ...dark.btn, flex: 1, opacity: (alreadyBooked || !bookForm.time || slotError) ? 0.5 : 1, cursor: (alreadyBooked || !bookForm.time || slotError) ? 'not-allowed' : 'pointer' }} 
                                    onClick={submitBooking} 
                                    disabled={alreadyBooked || !bookForm.time || !!slotError}
                                >
                                    {bookForm.booking_type === 'online' ? '📩 Submit Request' : '✅ Confirm Booking'}
                                </button>
                                <button style={dark.btnOutline} onClick={() => {setBookModal(false); setBookForm({dentist_id: '', date: '', time: '', reason: '', booking_type: 'online'}); setAlreadyBooked(false); setSlotError(''); setBookedSlots([]);}}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );

    const renderDentistView = () => {
        const pendingAppts = appointments.filter(a => a.status === 'pending');
        
        return (
            <>
                <div style={{ display: 'flex', gap: 20, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button style={dark.tab(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
                        Pending Requests {pendingCount > 0 && <span style={{ background: '#EF4444', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12, marginLeft: 8 }}>{pendingCount}</span>}
                    </button>
                    <button style={dark.tab(activeTab === 'all')} onClick={() => setActiveTab('all')}>All Appointments</button>
                    <button style={dark.tab(activeTab === 'availability')} onClick={() => setActiveTab('availability')}>My Availability ⏰</button>
                </div>

                {activeTab === 'pending' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {pendingAppts.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#475569' }}>No pending requests.</div>
                        ) : (
                            pendingAppts.map(a => (
                                <motion.div key={a.id} whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(13,148,136,0.1)' }} style={dark.card}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{a.patients?.full_name || 'Unknown Patient'}</div>
                                    <div style={{ color: '#E2E8F0', fontSize: 14, marginBottom: 4 }}>🗓 {a.appointment_date}</div>
                                    <div style={{ color: '#E2E8F0', fontSize: 14, marginBottom: 12 }}>⏰ {a.time_slot}</div>
                                    <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20, background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>{a.reason || 'No reason provided.'}</div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <button style={{ ...dark.btnSuccess, flex: 1 }} onClick={() => respondAppointment(a.id, 'approve')}>✅ Approve</button>
                                        <button style={{ ...dark.btnDanger, flex: 1 }} onClick={() => respondAppointment(a.id, 'reject')}>❌ Reject</button>
                                        <button style={{ ...dark.btnWarning, width: '100%' }} onClick={() => { setAltForm({ appointment_id: a.id, date: '', time: '', message: '' }); setAltModal(true); }}>🔄 Suggest Alternative</button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'all' && (
                    <div style={dark.table}>
                        <div style={dark.thead}>
                            <span>Patient</span><span>Date</span><span>Time</span><span>Reason</span><span>Status</span>
                        </div>
                        {appointments.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No appointments found.</div>
                        ) : (
                            appointments.map(a => (
                                <div key={a.id} style={dark.trow}>
                                    <span style={{ fontWeight: 600, color: '#fff' }}>{a.patients?.full_name || '—'}</span>
                                    <span style={{ color: '#E2E8F0' }}>{a.appointment_date}</span>
                                    <span style={{ color: '#E2E8F0' }}>{a.time_slot}</span>
                                    <span style={{ color: '#94A3B8' }}>{a.reason || '—'}</span>
                                    <div>{getStatusBadge(a.status)}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'availability' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 30 }}>
                        <div style={dark.card}>
                            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: 16 }}>Add Availability</h3>
                            <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, display: 'block' }}>Day of Week</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                {dayMap.map(d => (
                                    <div key={d} onClick={() => setAvailForm({...availForm, day_of_week: d})}
                                         style={{ padding: '6px 10px', background: availForm.day_of_week === d ? '#0D9488' : 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                                        {d.substring(0,3)}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, display: 'block' }}>Start</label>
                                    <input type="time" style={dark.input} value={availForm.start_time} onChange={e => setAvailForm({...availForm, start_time: e.target.value})} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, display: 'block' }}>End</label>
                                    <input type="time" style={dark.input} value={availForm.end_time} onChange={e => setAvailForm({...availForm, end_time: e.target.value})} />
                                </div>
                            </div>
                            <button style={{ ...dark.btn, width: '100%', marginTop: 10 }} onClick={addAvailability}>Add Slot</button>
                        </div>

                        <div style={dark.card}>
                            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: 16 }}>Current Availability</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {availability.length === 0 ? (
                                    <div style={{ color: '#475569', fontSize: 14 }}>No availability set.</div>
                                ) : (
                                    availability.map(a => (
                                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div>
                                                <div style={{ color: '#14B8A6', fontWeight: 600, fontSize: 14 }}>{dayMap[Number(a.day_of_week)] || a.day_of_week}</div>
                                                <div style={{ color: '#E2E8F0', fontSize: 13 }}>{a.start_time.substring(0,5)} - {a.end_time.substring(0,5)}</div>
                                            </div>
                                            <button onClick={() => deleteAvailability(a.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16 }}>✕</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {altModal && (
                        <div style={dark.overlay}>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={dark.modal}>
                                <h3 style={{ marginBottom: 20, color: '#fff' }}>Suggest Alternative Time</h3>
                                
                                <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, display: 'block' }}>Proposed Date</label>
                                <input style={dark.input} type="date" value={altForm.date} onChange={e => setAltForm({...altForm, date: e.target.value})} min={new Date().toISOString().split('T')[0]} />

                                <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, display: 'block' }}>Proposed Time</label>
                                <input style={dark.input} type="time" value={altForm.time} onChange={e => setAltForm({...altForm, time: e.target.value})} />

                                <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4, display: 'block' }}>Message to Patient</label>
                                <textarea style={{ ...dark.input, height: 80, resize: 'none' }} placeholder="Sorry, I have an emergency..." value={altForm.message} onChange={e => setAltForm({...altForm, message: e.target.value})} />
                                
                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                    <button style={{ ...dark.btn, flex: 1 }} onClick={() => respondAppointment(altForm.appointment_id, 'alternative', { proposed_date: altForm.date, proposed_time: altForm.time, message: altForm.message })}>Send Suggestion</button>
                                    <button style={dark.btnOutline} onClick={() => setAltModal(false)}>Cancel</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </>
        );
    };

    return (
        <div className="ds-page-root" style={{ minHeight: '100vh', background: 'var(--bg-primary, #060B14)', color: 'var(--text-primary, #E2E8F0)', position: 'relative', transition: 'background 0.3s ease, color 0.3s ease' }}>
            <AnimatedBG />
            <div style={{ position: 'relative', zIndex: 2 }}>
                <Navbar />
                <div style={{ padding: '96px 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
                    {isPatient ? renderPatientView() : renderDentistView()}
                </div>
            </div>
            
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    );
}