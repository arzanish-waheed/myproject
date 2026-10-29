import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function PaymentAdmin() {
    const [token, setToken]             = useState(localStorage.getItem('payment_admin_token') || '');
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [loginError, setLoginError]   = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const [stats, setStats]             = useState(null);
    const [requests, setRequests]       = useState([]);
    const [loading, setLoading]         = useState(false);
    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'active', 'rejected'
    const [methodFilter, setMethodFilter] = useState('all'); // 'all', 'easypaisa', 'meezan'
    const [actionLoading, setActionLoading] = useState(null);
    const [copiedTid, setCopiedTid]     = useState('');

    const initParticles = useCallback(async engine => { await loadSlim(engine); }, []);
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setLoginLoading(true); setLoginError('');
        try {
            const res = await axios.post(`${API_BASE}/payment-admin/login`, { email, password });
            localStorage.setItem('payment_admin_token', res.data.token);
            setToken(res.data.token);
        } catch (err) {
            setLoginError(err.response?.data?.detail || 'Invalid email or password');
        }
        setLoginLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('payment_admin_token');
        setToken('');
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, reqsRes] = await Promise.all([
                axios.get(`${API_BASE}/payment-admin/stats`, authHeader),
                axios.get(`${API_BASE}/payment-admin/requests`, authHeader),
            ]);
            setStats(statsRes.data);
            setRequests(reqsRes.data || []);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (token) loadData();
    }, [token]);

    const handleApprove = async (subId, userName) => {
        if (!window.confirm(`Are you sure you want to approve premium subscription for ${userName}?`)) return;
        setActionLoading(subId);
        try {
            await axios.post(`${API_BASE}/payment-admin/approve`, {
                subscription_id: subId,
                action: 'approve'
            }, authHeader);
            await loadData();
        } catch (err) {
            alert('Failed to approve: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (subId, userName) => {
        const reason = window.prompt(`Reject payment for ${userName}? Enter reason (optional):`);
        if (reason === null) return;
        setActionLoading(subId);
        try {
            await axios.post(`${API_BASE}/payment-admin/reject`, {
                subscription_id: subId,
                action: 'reject',
                reason: reason
            }, authHeader);
            await loadData();
        } catch (err) {
            alert('Failed to reject: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    const copyText = (txt) => {
        navigator.clipboard.writeText(txt);
        setCopiedTid(txt);
        setTimeout(() => setCopiedTid(''), 2000);
    };

    // ── LOGIN SCREEN ──
    if (!token) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at 20% 50%, #06191f 0%, #060b14 50%, #08111e 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif"
            }}>
                <Particles id="payment-admin-particles" init={initParticles}
                    style={{ position: 'fixed', inset: 0, zIndex: 0 }}
                    options={{
                        background: { color: { value: 'transparent' } }, fpsLimit: 60,
                        particles: {
                            number: { value: 45 },
                            color: { value: ['#10B981', '#0D9488', '#F59E0B'] },
                            links: { enable: true, color: '#10B981', opacity: 0.1, distance: 130 },
                            move: { enable: true, speed: 0.35 },
                            opacity: { value: { min: 0.05, max: 0.3 } },
                            size: { value: { min: 1, max: 2.5 } },
                        },
                    }}
                />

                <motion.div
                    style={{
                        background: 'rgba(10,20,30,0.92)', backdropFilter: 'blur(40px)',
                        border: '1px solid rgba(16,185,129,0.25)', borderRadius: 24,
                        padding: '48px 44px', width: 420, position: 'relative', zIndex: 10,
                        boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
                    }}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 68, height: 68, borderRadius: 18, margin: '0 auto 16px',
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(13,148,136,0.2))',
                            border: '1px solid rgba(16,185,129,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32
                        }}>💳</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                            Finance & Billing Portal
                        </div>
                        <div style={{ fontSize: 12, color: '#10B981', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
                            Private Payment Administration
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                            DeepSense Dental AI Revenue Control
                        </div>
                    </div>

                    <AnimatePresence>
                        {loginError && (
                            <motion.div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#FCA5A5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16
                            }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                ⚠️ {loginError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} autoComplete="off">
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                                Payment Admin Email
                            </label>
                            <input
                                style={iStyle}
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="off"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                                Admin Password
                            </label>
                            <input
                                style={iStyle}
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loginLoading}
                            style={{
                                width: '100%', padding: '14px 0',
                                background: loginLoading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10B981, #0D9488)',
                                color: '#fff', border: 'none', borderRadius: 12,
                                fontSize: 14, fontWeight: 700, cursor: loginLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(16,185,129,0.25)'
                            }}
                            whileHover={!loginLoading ? { scale: 1.02 } : {}}
                            whileTap={!loginLoading ? { scale: 0.98 } : {}}
                        >
                            {loginLoading ? '⚡ Verifying...' : '🔐 Access Payment Portal'}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        );
    }

    // ── FILTERED DATA ──
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const filteredRequests = requests.filter(r => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesMethod = methodFilter === 'all' || r.payment_method === methodFilter;
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            (r.user_name || '').toLowerCase().includes(q) ||
            (r.user_email || '').toLowerCase().includes(q) ||
            (r.payment_id || '').toLowerCase().includes(q) ||
            (r.user_phone || '').includes(q);
        return matchesStatus && matchesMethod && matchesSearch;
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: '#060B14',
            color: '#E2E8F0',
            fontFamily: "'Inter', sans-serif",
            paddingBottom: 80
        }}>
            {/* Header */}
            <div style={{
                padding: '20px 40px', borderBottom: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(16,185,129,0.04)', backdropFilter: 'blur(20px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'linear-gradient(135deg, #10B981, #0D9488)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                    }}>💰</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                            DeepSense Finance & Billing Admin
                            <span style={{
                                background: 'rgba(16,185,129,0.15)', color: '#10B981',
                                border: '1px solid rgba(16,185,129,0.3)', fontSize: 10,
                                padding: '2px 8px', borderRadius: 10, fontWeight: 800
                            }}>
                                PRIVATE PORTAL
                            </span>
                        </div>
                        <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                            Independent Payment Verification, Revenue Dashboard & Direct Approvals
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                        onClick={loadData}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#94A3B8', padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                            fontSize: 12, fontFamily: 'inherit'
                        }}
                    >
                        🔄 Refresh Data
                    </button>
                    <motion.button
                        onClick={handleLogout}
                        style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#F87171', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                            fontSize: 13, fontFamily: 'inherit', fontWeight: 600
                        }}
                        whileHover={{ background: 'rgba(239,68,68,0.2)' }}
                    >
                        Sign Out
                    </motion.button>
                </div>
            </div>

            <div style={{ padding: '32px 40px' }}>
                {/* Confidentiality Notice */}
                <div style={{
                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 14, padding: '14px 18px', marginBottom: 28,
                    display: 'flex', gap: 12, alignItems: 'center'
                }}>
                    <span style={{ fontSize: 20 }}>🔒</span>
                    <div style={{ fontSize: 12, color: '#A7F3D0', lineHeight: 1.5 }}>
                        <strong>Private Revenue Management:</strong> This portal is completely isolated from dentist view. All customer transactions, EasyPaisa/Meezan bank payments, and customer revenue are accessible only through these credentials.
                    </div>
                </div>

                {/* Financial Summary Stats Cards */}
                {stats && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: 16, marginBottom: 32
                    }}>
                        <StatCard
                            icon="💵"
                            label="Total Revenue Collected"
                            value={`PKR ${(stats.total_revenue || 0).toLocaleString()}`}
                            color="#10B981"
                        />
                        <StatCard
                            icon="⏳"
                            label="Pending Approvals"
                            value={stats.pending_count || 0}
                            color="#F59E0B"
                            highlight={stats.pending_count > 0}
                        />
                        <StatCard
                            icon="💎"
                            label="Lifetime Access Sold"
                            value={stats.lifetime_count || 0}
                            color="#0D9488"
                        />
                        <StatCard
                            icon="⚡"
                            label="Monthly Pro Active"
                            value={stats.monthly_count || 0}
                            color="#7C3AED"
                        />
                        <StatCard
                            icon="✅"
                            label="Total Active Subscribers"
                            value={stats.active_count || 0}
                            color="#3B82F6"
                        />
                        <StatCard
                            icon="📦"
                            label="All Time Orders"
                            value={stats.total_orders || 0}
                            color="#64748B"
                        />
                    </div>
                )}

                {/* Filters & Search Header */}
                <div style={{
                    background: 'rgba(15,25,45,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: '18px 20px', marginBottom: 20,
                    display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'
                }}>
                    {/* Status Filter Buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { id: 'all', label: `All (${requests.length})` },
                            { id: 'pending', label: `⏳ Pending (${pendingCount})`, alert: pendingCount > 0 },
                            { id: 'active', label: `✅ Active (${requests.filter(r => r.status === 'active').length})` },
                            { id: 'rejected', label: `❌ Rejected (${requests.filter(r => r.status === 'rejected').length})` },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                style={{
                                    padding: '8px 16px', borderRadius: 10, border: 'none',
                                    background: statusFilter === f.id
                                        ? (f.id === 'pending' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #10B981, #0D9488)')
                                        : 'rgba(255,255,255,0.04)',
                                    color: statusFilter === f.id ? '#fff' : (f.alert ? '#FBBF24' : '#94A3B8'),
                                    fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                                    boxShadow: statusFilter === f.id ? '0 4px 14px rgba(16,185,129,0.2)' : 'none'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Method Filter */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        <select
                            value={methodFilter}
                            onChange={e => setMethodFilter(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: '#E2E8F0', padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none'
                            }}
                        >
                            <option value="all">All Payment Methods</option>
                            <option value="easypaisa">🟢 EasyPaisa Only</option>
                            <option value="meezan">🏦 Meezan Bank Only</option>
                        </select>
                    </div>

                    {/* Search */}
                    <input
                        placeholder="Search by name, email, phone, Ref or TID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            marginLeft: 'auto', padding: '9px 16px', width: 320,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10, color: '#E2E8F0', fontSize: 13, outline: 'none', fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* Requests Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                        Loading payment records...
                    </div>
                ) : (
                    <div style={{
                        background: 'rgba(15,25,45,0.85)', border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.6fr 1.4fr 2.4fr 1.2fr 1.6fr',
                            padding: '14px 24px', background: 'rgba(16,185,129,0.08)',
                            color: '#94A3B8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5
                        }}>
                            <span>Customer / User</span>
                            <span>Plan & Price</span>
                            <span>Payment Method</span>
                            <span>Reference & TID</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>

                        {filteredRequests.map(r => (
                            <div key={r.id} style={{
                                display: 'grid', gridTemplateColumns: '2fr 1.6fr 1.4fr 2.4fr 1.2fr 1.6fr',
                                padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
                                alignItems: 'center'
                            }}>
                                {/* Customer */}
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                                        {r.user_name}
                                        <span style={{
                                            marginLeft: 8, fontSize: 10, padding: '2px 7px', borderRadius: 4,
                                            background: r.user_role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(59,130,246,0.2)',
                                            color: r.user_role === 'admin' ? '#A78BFA' : '#60A5FA',
                                            textTransform: 'uppercase', fontWeight: 700
                                        }}>
                                            {r.user_role === 'admin' ? 'Dentist' : 'Patient'}
                                        </span>
                                    </div>
                                    <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{r.user_email}</div>
                                    {r.user_phone && r.user_phone !== '—' && (
                                        <div style={{ marginTop: 6 }}>
                                            <a
                                                href={`https://wa.me/${r.user_phone.replace(/[^0-9]/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(`Hi ${r.user_name}! DeepSense Billing Team here regarding your payment [${r.payment_id}].`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    fontSize: 11, color: '#25D366', textDecoration: 'none',
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    background: 'rgba(37,211,102,0.1)', padding: '3px 8px', borderRadius: 6
                                                }}
                                            >
                                                <span>💬</span> WhatsApp: {r.user_phone}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Plan & Price */}
                                <div>
                                    <div style={{ color: '#10B981', fontWeight: 800, fontSize: 13 }}>
                                        {r.plan_type === 'monthly' ? 'Monthly Pro' : 'Lifetime Access'}
                                    </div>
                                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, marginTop: 2 }}>
                                        PKR {r.amount ? r.amount.toLocaleString() : (r.plan_type === 'monthly' ? '2,499' : '999')}
                                    </div>
                                </div>

                                {/* Method */}
                                <div>
                                    <span style={{
                                        textTransform: 'capitalize', fontWeight: 700, fontSize: 13,
                                        color: r.payment_method === 'easypaisa' ? '#10B981' : '#60A5FA',
                                        display: 'inline-flex', alignItems: 'center', gap: 6
                                    }}>
                                        {r.payment_method === 'easypaisa' ? '🟢 EasyPaisa' : '🏦 Meezan Bank'}
                                    </span>
                                </div>

                                {/* Reference & TID */}
                                <div>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 8, padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: 8,
                                        fontFamily: 'monospace', fontSize: 12, color: '#E2E8F0', maxWidth: '100%', wordBreak: 'break-all'
                                    }}>
                                        <span>{r.payment_id || '—'}</span>
                                        {r.payment_id && (
                                            <button
                                                type="button"
                                                onClick={() => copyText(r.payment_id)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#14B8A6',
                                                    cursor: 'pointer', fontSize: 11, padding: 0
                                                }}
                                            >
                                                {copiedTid === r.payment_id ? '✓' : 'Copy'}
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>
                                        {r.purchased_at ? new Date(r.purchased_at).toLocaleString() : ''}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <span style={{
                                        background: r.status === 'active' ? 'rgba(16,185,129,0.15)' :
                                                    r.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: r.status === 'active' ? '#10B981' :
                                               r.status === 'pending' ? '#F59E0B' : '#EF4444',
                                        padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                                        display: 'inline-block', textTransform: 'capitalize'
                                    }}>
                                        {r.status === 'active' ? '✅ Active' :
                                         r.status === 'pending' ? '⏳ Pending Review' : '❌ ' + r.status}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {r.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleApprove(r.id, r.user_name)}
                                                disabled={actionLoading === r.id}
                                                style={{
                                                    background: 'linear-gradient(135deg, #10B981, #0D9488)',
                                                    border: 'none', color: '#fff',
                                                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                                                    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                                                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                                                }}
                                            >
                                                {actionLoading === r.id ? '...' : '✓ Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(r.id, r.user_name)}
                                                disabled={actionLoading === r.id}
                                                style={{
                                                    background: 'rgba(239,68,68,0.12)',
                                                    border: '1px solid rgba(239,68,68,0.3)', color: '#F87171',
                                                    padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                                                    fontSize: 12, fontFamily: 'inherit'
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    ) : r.status === 'active' ? (
                                        <div style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                                            {r.expires_at ? `Exp: ${new Date(r.expires_at).toLocaleDateString()}` : 'Lifetime Access'}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#64748B', fontSize: 12 }}>—</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filteredRequests.length === 0 && (
                            <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>
                                No payment requests match your criteria.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, highlight }) {
    return (
        <motion.div
            style={{
                background: highlight ? 'rgba(245,158,11,0.08)' : 'rgba(15,25,45,0.85)',
                border: highlight ? '2px solid #F59E0B' : `1px solid ${color}33`,
                borderRadius: 16, padding: '20px 22px', position: 'relative'
            }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>{label}</div>
        </motion.div>
    );
}

const iStyle = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, fontSize: 14, color: '#E2E8F0',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

