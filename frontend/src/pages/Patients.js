import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';


const dark = {
    btn:        { background: 'linear-gradient(135deg, #0D9488, #0891B2)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    btnOutline: { background: 'transparent', color: '#0D9488', border: '1px solid #0D9488', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
    search:     { width: '100%', padding: 12, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #E2E8F0)' },
    table:      { background: 'var(--card-bg, rgba(15,25,45,0.8))', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-teal, rgba(13,148,136,0.15))' },
    thead:      { display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 0.8fr', padding: '12px 20px', background: 'rgba(13,148,136,0.08)', color: 'var(--text-secondary, #64748B)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
    trow:       { display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 0.8fr', padding: '14px 20px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', alignItems: 'center' },
    badge:      { background: 'rgba(13,148,136,0.15)', color: '#14B8A6', padding: '3px 10px', borderRadius: 20, fontSize: 12 },
    overlay:    { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
    modal:      { background: 'var(--bg-card, #0F1928)', border: '1px solid var(--border-teal, rgba(13,148,136,0.2))', borderRadius: 16, padding: 32, width: 460, boxShadow: '0 40px 80px rgba(0,0,0,0.5)' },
    input:      { width: '100%', padding: 12, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #E2E8F0)' },
};

export default function Patients() {
    const [patients, setPatients]     = useState([]);
    const [search, setSearch]         = useState('');
    const [modal, setModal]           = useState(false);
    const [mode, setMode]             = useState('search'); // 'search' | 'manual'
    const [searchEmail, setSearchEmail] = useState('');
    const [foundPatient, setFoundPatient] = useState(null);
    const [searchError, setSearchError]   = useState('');
    const [searching, setSearching]       = useState(false);
    const [form, setForm]             = useState({ full_name: '', email: '', date_of_birth: '' });
    const [successMsg, setSuccessMsg] = useState('');
    const [removingId, setRemovingId] = useState(null); // patient_id pending confirmation

    useEffect(() => { fetchPatients(); }, []);

    const fetchPatients = async () => {
        try { const res = await API.get('/patients'); setPatients(res.data); }
        catch (err) { console.log(err); }
    };

    const handleSearchPatient = async () => {
        setSearching(true); setSearchError(''); setFoundPatient(null);
        try {
            const res = await API.get(`/search-patient?email=${searchEmail}`);
            setFoundPatient(res.data);
        } catch {
            setSearchError('No patient found with this email. Ask them to sign up first.');
        }
        setSearching(false);
    };

    const handleLinkPatient = async () => {
        try {
            await API.post('/link-patient', {
                full_name: foundPatient.full_name,
                email: foundPatient.email,
            });
            setModal(false);
            setFoundPatient(null);
            setSearchEmail('');
            setSuccessMsg('Patient linked successfully!');
            fetchPatients();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setSearchError('Patient already linked or error occurred.');
        }
    };

    const addManualPatient = async () => {
        try {
            await API.post('/patients', form);
            setModal(false);
            setForm({ full_name: '', email: '', date_of_birth: '' });
            fetchPatients();
        } catch (err) { console.log(err); }
    };

    const handleRemovePatient = async (patientId) => {
        try {
            await API.delete(`/patients/${patientId}`);
            setRemovingId(null);
            setSuccessMsg('Patient removed from your list.');
            fetchPatients();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.log(err);
            setRemovingId(null);
        }
    };

    const filtered = patients.filter(p =>
        p.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PageWrapper>
            <Navbar />
            <div style={{ padding: '90px 40px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ color: 'var(--text-primary, #fff)', fontSize: 24, fontWeight: 700 }}>👥 Patients</h2>
                        <motion.button onClick={() => { setModal(true); setMode('search'); setFoundPatient(null); setSearchEmail(''); setSearchError(''); }}
                            style={dark.btn} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                            + Add Patient
                        </motion.button>
                    </div>

                    {/* Success message */}
                    <AnimatePresence>
                        {successMsg && (
                            <motion.div style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#14B8A6', padding: '12px 20px', borderRadius: 8, marginBottom: 16 }}
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            >✅ {successMsg}</motion.div>
                        )}
                    </AnimatePresence>

                    <input style={dark.search} placeholder="Search patients by name..." value={search} onChange={e => setSearch(e.target.value)} />

                    <div style={dark.table}>
                        <div style={dark.thead}>
                            <span>Name</span><span>Email</span><span>Date of Birth</span><span>Status</span><span>Action</span>
                        </div>
                        {filtered.map(p => (
                            <div key={p.id} style={dark.trow}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary, #fff)' }}>{p.full_name}</span>
                                <span style={{ color: '#64748B' }}>{p.email || '—'}</span>
                                <span style={{ color: '#64748B' }}>{p.date_of_birth || '—'}</span>
                                <span><span style={dark.badge}>Active</span></span>
                                <span>
                                    {removingId === p.id ? (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => handleRemovePatient(p.id)}
                                                style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#F87171', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 700 }}
                                            >Confirm</button>
                                            <button onClick={() => setRemovingId(null)}
                                                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}
                                            >✕</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setRemovingId(p.id)}
                                            title="Remove this patient from your list"
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}
                                        >Remove</button>
                                    )}
                                </span>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No patients found</div>
                        )}
                    </div>
                </div>

            {/* Modal */}
            {modal && (
                <div style={dark.overlay}>
                    <motion.div style={dark.modal} initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}>
                        <h3 style={{ marginBottom: 20, color: '#fff' }}>Add Patient</h3>

                        {/* Mode toggle */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
                            {['search', 'manual'].map(m => (
                                <button key={m} onClick={() => { setMode(m); setFoundPatient(null); setSearchError(''); }}
                                    style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, background: mode === m ? 'rgba(13,148,136,0.2)' : 'transparent', color: mode === m ? '#14B8A6' : '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                                    {m === 'search' ? '🔍 Search by Email' : '✏️ Add Manually'}
                                </button>
                            ))}
                        </div>

                        {/* Search mode */}
                        {mode === 'search' && (
                            <div>
                                <p style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>
                                    Patient must be signed up first. Search by their email:
                                </p>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <input style={{ ...dark.input, marginBottom: 0, flex: 1 }}
                                        placeholder="patient@email.com"
                                        value={searchEmail}
                                        onChange={e => setSearchEmail(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSearchPatient()}
                                    />
                                    <motion.button style={dark.btn} onClick={handleSearchPatient} disabled={searching}
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                                        {searching ? '...' : 'Search'}
                                    </motion.button>
                                </div>

                                {searchError && (
                                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                                        ⚠️ {searchError}
                                    </div>
                                )}

                                {foundPatient && (
                                    <motion.div style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)', borderRadius: 10, padding: 16, marginBottom: 16 }}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <div style={{ color: '#14B8A6', fontWeight: 700, marginBottom: 4 }}>✅ Patient Found!</div>
                                        <div style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 600 }}>{foundPatient.full_name}</div>
                                        <div style={{ color: '#64748B', fontSize: 13 }}>{foundPatient.email}</div>
                                        <motion.button style={{ ...dark.btn, marginTop: 12, width: '100%' }}
                                            onClick={handleLinkPatient} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            Add to My Patients
                                        </motion.button>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Manual mode */}
                        {mode === 'manual' && (
                            <div>
                                <input style={dark.input} placeholder="Full Name *" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                                <input style={dark.input} placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                                <input style={dark.input} type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                                <motion.button style={dark.btn} onClick={addManualPatient} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    Add Patient
                                </motion.button>
                            </div>
                        )}

                        <button style={{ ...dark.btnOutline, marginTop: 12, width: '100%' }} onClick={() => setModal(false)}>Cancel</button>
                    </motion.div>
                </div>
            )}
        </PageWrapper>
    );
}