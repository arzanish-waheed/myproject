import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import API from '../api/axios';

const fadeUp = (delay=0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.16,1,0.3,1] }
});

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' });

function ReportModal({ report, onClose }) {
    const findings = report.confidence_scores || {};
    const top = Object.entries(findings).sort((a,b) => b[1]-a[1])[0];
    const date = formatDate(report.created_at);

    const downloadPDF = () => {
        const findingsHTML = Object.entries(findings)
            .sort((a,b) => b[1]-a[1])
            .map(([k, v]) => `
                <div style="margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
                        <span style="font-weight:600;color:#0A1628;">${k}</span>
                        <span style="font-weight:700;color:#0D9488;">${(v*100).toFixed(1)}%</span>
                    </div>
                    <div style="height:8px;background:#e2e8f0;border-radius:4px;">
                        <div style="height:8px;width:${v*100}%;background:linear-gradient(90deg,#0D9488,#0891B2);border-radius:4px;"></div>
                    </div>
                </div>
            `).join('');

        const summaryHTML = top ? `
            <p>• <strong>${top[0]}</strong> detected with <strong>${(top[1]*100).toFixed(1)}%</strong> confidence</p>
            <p>• Immediate clinical evaluation recommended</p>
            <p>• Follow-up X-ray advised in 3 months</p>
            <p>• Please consult with your dentist for treatment options</p>
        ` : '';

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DeepSense AI - Dental Report</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #0A1628; padding: 0; }
                .header { background: linear-gradient(135deg, #0A1628, #0D9488); padding: 28px 36px; color: #fff; }
                .header h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
                .header .sub { color: rgba(255,255,255,0.6); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
                .body { padding: 32px 36px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; background: #f8fafc; border-radius: 10px; padding: 20px; }
                .info-label { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                .info-value { font-size: 15px; font-weight: 700; color: #0A1628; }
                .info-mono { font-size: 13px; color: #475569; font-family: monospace; }
                .primary { background: rgba(13,148,136,0.08); border: 1px solid rgba(13,148,136,0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
                .primary-label { font-size: 11px; color: #0D9488; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .primary-row { display: flex; justify-content: space-between; align-items: center; }
                .primary-name { font-size: 22px; font-weight: 800; color: #0A1628; }
                .primary-badge { background: #0D9488; color: #fff; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 18px; }
                .section-title { font-size: 13px; font-weight: 700; color: #0A1628; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 1px; }
                .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
                .summary-box p { font-size: 13px; color: #475569; line-height: 1.8; margin-bottom: 4px; }
                .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #94A3B8; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🦷 DeepSense AI</h1>
                <div class="sub">DENTAL ANALYSIS REPORT</div>
            </div>
            <div class="body">
                <div class="info-grid">
                    <div>
                        <div class="info-label">Patient Name</div>
                        <div class="info-value">${report.patients?.full_name || 'N/A'}</div>
                    </div>
                    <div>
                        <div class="info-label">Report Date</div>
                        <div class="info-value">${date}</div>
                    </div>
                    <div>
                        <div class="info-label">Report ID</div>
                        <div class="info-mono">${report.id?.slice(0,16)}...</div>
                    </div>
                    <div>
                        <div class="info-label">Analysis Type</div>
                        <div class="info-value">Dental X-Ray AI</div>
                    </div>
                </div>

                <div class="primary">
                    <div class="primary-label">Primary Finding</div>
                    <div class="primary-row">
                        <div class="primary-name">${top ? top[0] : '—'}</div>
                        <div class="primary-badge">${top ? (top[1]*100).toFixed(1) + '%' : '—'}</div>
                    </div>
                </div>

                <div style="margin-bottom:24px;">
                    <div class="section-title">All Findings</div>
                    ${findingsHTML}
                </div>

                <div class="summary-box">
                    <div class="section-title">Clinical Summary</div>
                    ${summaryHTML}
                </div>

                <div class="footer">
                    <div>Generated by DeepSense AI • Rawalpindi, Pakistan</div>
                    <div>⚠️ AI-assisted report. Consult a qualified dentist.</div>
                </div>
            </div>
        </body>
        </html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    return (
        <AnimatePresence>
            <motion.div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                    initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ background: 'linear-gradient(135deg, #0A1628, #0D9488)', padding: '28px 36px', borderRadius: '16px 16px 0 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <span style={{ fontSize: 28 }}>🦷</span>
                                    <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>DeepSense AI</span>
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 2 }}>DENTAL ANALYSIS REPORT</div>
                            </div>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                    </div>

                    <div style={{ padding: '32px 36px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28, background: '#f8fafc', borderRadius: 10, padding: 20 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Patient Name</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>{report.patients?.full_name || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Report Date</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>{date}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Report ID</div>
                                <div style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace' }}>{report.id?.slice(0,16)}...</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Analysis Type</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Dental X-Ray AI</div>
                            </div>
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(8,145,178,0.08))', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                            <div style={{ fontSize: 11, color: '#0D9488', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Primary Finding</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1628' }}>{top ? top[0] : '—'}</div>
                                <div style={{ background: '#0D9488', color: '#fff', padding: '6px 16px', borderRadius: 20, fontWeight: 800, fontSize: 18 }}>
                                    {top ? `${(top[1]*100).toFixed(1)}%` : '—'}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>All Findings</div>
                            {Object.entries(findings).sort((a,b) => b[1]-a[1]).map(([k, v]) => (
                                <div key={k} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                                        <span style={{ fontWeight: 600, color: '#0A1628' }}>{k}</span>
                                        <span style={{ fontWeight: 700, color: '#0D9488' }}>{(v*100).toFixed(1)}%</span>
                                    </div>
                                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                                        <div style={{ height: 8, width: `${v*100}%`, background: 'linear-gradient(90deg, #0D9488, #0891B2)', borderRadius: 4 }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 24 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Clinical Summary</div>
                            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
                                {top && <>
                                    <p>• <strong>{top[0]}</strong> detected with <strong>{(top[1]*100).toFixed(1)}%</strong> confidence</p>
                                    <p>• Immediate clinical evaluation recommended</p>
                                    <p>• Follow-up X-ray advised in 3 months</p>
                                    <p>• Please consult with your dentist for treatment options</p>
                                </>}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>Generated by DeepSense AI • Rawalpindi, Pakistan</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>⚠️ AI-assisted report. Consult a qualified dentist.</div>
                                <motion.button
                                    onClick={downloadPDF}
                                    style={{
                                        background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '8px 18px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    📥 Download PDF
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── PATIENT DASHBOARD ─────────────────────────────
function PatientDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [reports, setReports]           = useState([]);
    const [selected, setSelected]         = useState(null);

    useEffect(() => {
        API.get('/appointments').then(r => setAppointments(r.data)).catch(()=>{});
        API.get('/my-reports').then(r => setReports(r.data)).catch(()=>{});
    }, []);

    return (
        <PageWrapper>
            <Navbar />
            <div style={{ paddingTop: 96, paddingLeft: 40, paddingRight: 40, paddingBottom: 60 }}>

                <motion.div style={{ marginBottom: 40 }} {...fadeUp(0)}>
                    <div style={{ fontSize: 13, color: '#0D9488', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</div>
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary, #fff)', marginBottom: 6 }}>{user.full_name} 👋</h1>
                    <p style={{ color: '#64748B', fontSize: 15 }}>Here's your dental health overview.</p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginBottom: 40, maxWidth: 600 }}>
                    {[
                        { label: 'My Appointments', val: appointments.length, icon: '◷', color: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
                        { label: 'My Reports',      val: reports.length,      icon: '◈', color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
                    ].map((s, i) => (
                        <motion.div key={i}
                            style={{ background: 'rgba(15,25,45,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${s.color}22`, borderRadius: 16, padding: 24, boxShadow: `0 0 30px ${s.glow}` }}
                            {...fadeUp(0.1 + i * 0.07)}
                            whileHover={{ y: -4, boxShadow: `0 12px 40px ${s.glow}` }}
                        >
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 16 }}>
                                <div style={{ fontSize: 22, color: s.color }}>{s.icon}</div>
                                <div style={{ background: `${s.color}15`, color: s.color, fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>LIVE</div>
                            </div>
                            <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary, #fff)', lineHeight: 1 }}>{s.val}</div>
                            <div style={{ color: '#64748B', fontSize: 13, marginTop: 6 }}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                <motion.div style={{ background: 'rgba(15,25,45,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(13,148,136,0.12)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }} {...fadeUp(0.3)}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary, #fff)', fontSize: 16 }}>📅 My Appointments</div>
                    </div>
                    {appointments.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#334155' }}>No appointments yet</div>
                    ) : appointments.map((a, i) => (
                        <motion.div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
                            whileHover={{ background: 'rgba(13,148,136,0.05)' }}
                        >
                            <div>
                                <div style={{ color:'#E2E8F0', fontSize: 14, fontWeight: 500 }}>{a.appointment_date} — {a.time_slot}</div>
                                <div style={{ color:'#475569', fontSize: 12, marginTop: 2 }}>{a.reason || 'General Checkup'}</div>
                            </div>
                            <div style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{a.status}</div>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div style={{ background: 'rgba(15,25,45,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(13,148,136,0.12)', borderRadius: 16, overflow: 'hidden' }} {...fadeUp(0.4)}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary, #fff)', fontSize: 16 }}>📋 My AI Reports</div>
                    </div>
                    {reports.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#334155' }}>No reports yet</div>
                    ) : reports.map((r, i) => {
                        const findings = r.confidence_scores || {};
                        const top = Object.entries(findings).sort((a,b)=>b[1]-a[1])[0];
                        return (
                            <motion.div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.07 }}
                                whileHover={{ background: 'rgba(13,148,136,0.05)' }}
                            >
                                <div>
                                    <div style={{ color:'#E2E8F0', fontSize: 14, fontWeight: 500 }}>{top ? top[0] : 'Analysis'}</div>
                                    <div style={{ color:'#475569', fontSize: 12, marginTop: 2 }}>{formatDate(r.created_at)}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ color:'#10B981', fontWeight: 700, fontSize: 14 }}>{top ? `${(top[1]*100).toFixed(0)}%` : '—'}</div>
                                    <motion.button
                                        style={{ background: 'linear-gradient(135deg, #0D9488, #0891B2)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                        onClick={() => setSelected(r)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        View Report
                                    </motion.button>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
            {selected && <ReportModal report={selected} onClose={() => setSelected(null)} />}
        </PageWrapper>
    );
}

// ── DENTIST DASHBOARD ─────────────────────────────
function DentistDashboard({ user }) {
    const navigate = useNavigate();
    const [stats, setStats]         = useState({ patients:0, reports:0, appointments:0 });
    const [reports, setReports]     = useState([]);
    const [isVerified, setIsVerified] = useState(user.is_verified ?? null); // null = loading
    const [checking, setChecking]   = useState(true);
    const [hasAvailability, setHasAvailability] = useState(true);

    // Live verification check — localStorage stale ho sakta hai, /me se taza pata karo
    useEffect(() => {
        API.get('/me')
            .then(r => {
                setIsVerified(!!r.data.is_verified);
                // localStorage bhi update kar do taake baaki components bhi sahi dekhein
                const updatedUser = { ...user, is_verified: r.data.is_verified };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            })
            .catch(() => setIsVerified(user.is_verified ?? false))
            .finally(() => setChecking(false));
    }, []);

    useEffect(() => {
        if (!isVerified) return; // verified nahi hai toh data fetch hi mat karo
        Promise.all([
            API.get('/patients'),
            API.get('/reports'),
            API.get('/appointments'),
            API.get('/availability'),
        ]).then(([p,r,a,av]) => {
            setStats({ patients: p.data.length, reports: r.data.length, appointments: a.data.length });
            setReports(r.data.slice(0,5));
            setHasAvailability(av.data && av.data.length > 0);
        }).catch(()=>{});
    }, [isVerified]);

    const statCards = [
        { label:'Total Patients',  val: stats.patients,     icon:'◉', color:'#0D9488', glow:'rgba(13,148,136,0.15)' },
        { label:'AI Reports',      val: stats.reports,      icon:'◈', color:'#8B5CF6', glow:'rgba(139,92,246,0.15)' },
        { label:'Appointments',    val: stats.appointments, icon:'◷', color:'#F59E0B', glow:'rgba(245,158,11,0.15)' },
        { label:'Avg Confidence',  val: '94%',              icon:'◎', color:'#10B981', glow:'rgba(16,185,129,0.15)' },
    ];

    return (
        <PageWrapper>
            <Navbar />
            <div style={{ paddingTop: 96, paddingLeft: 40, paddingRight: 40, paddingBottom: 60 }}>

                <motion.div style={{ marginBottom: 24 }} {...fadeUp(0)}>
                    <div style={{ fontSize: 13, color: '#0D9488', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</div>
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary, #fff)', marginBottom: 6 }}>{user.full_name} 👋</h1>
                    <p style={{ color: '#64748B', fontSize: 15 }}>Here's what's happening with your patients today.</p>

                    {/* Verification Badge */}
                    {!checking && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: isVerified ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                            border: `1px solid ${isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                            color: isVerified ? '#10B981' : '#F59E0B',
                            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            marginTop: 12
                        }}>
                            {isVerified ? '✅ PMC Verified' : '⏳ Verification Pending'}
                        </div>
                    )}
                </motion.div>

                {/* ── UNVERIFIED: Big warning banner, locked features ── */}
                {!checking && !isVerified && (
                    <motion.div
                        style={{
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: 16, padding: '28px 32px', marginBottom: 32,
                            display: 'flex', alignItems: 'flex-start', gap: 18
                        }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{ fontSize: 36 }}>⏳</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#F59E0B', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                                Awaiting Verification
                            </div>
                            <p style={{ color: '#CBD5E1', fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
                                Your account has been created, but your PMC license is still pending manual review by our team. Once approved, you'll get full access to <strong>Patients</strong>, <strong>AI Analysis</strong>, <strong>Reports</strong>, and the <strong>AI Assistant</strong>.
                            </p>
                            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                                This usually takes a short while. You can still book or view appointments in the meantime. If this is taking unusually long, please contact support with your registered email.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── Availability Not Set Banner ── */}
                {!checking && isVerified && !hasAvailability && (
                    <motion.div
                        style={{
                            background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)',
                            borderRadius: 16, padding: '24px 28px', marginBottom: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20
                        }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ fontSize: 32 }}>⏰</div>
                            <div>
                                <div style={{ color: '#14B8A6', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                                    Set Your Availability Hours
                                </div>
                                <div style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                                    Patients can't book appointments until you set your available hours. Set your schedule so patients can book online.
                                </div>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => navigate('/appointments')}
                            style={{
                                background: 'linear-gradient(135deg, #0D9488, #0891B2)', color: '#fff',
                                border: 'none', padding: '10px 22px', borderRadius: 10,
                                cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                                whiteSpace: 'nowrap', flexShrink: 0
                            }}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        >
                            ⏰ Set Availability
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Stat Cards — locked visual if unverified ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 40, position: 'relative' }}>
                    {statCards.map((s, i) => (
                        <motion.div key={i}
                            style={{
                                background: 'rgba(15,25,45,0.7)', backdropFilter: 'blur(12px)',
                                border: `1px solid ${s.color}22`, borderRadius: 16, padding: 24,
                                boxShadow: `0 0 30px ${s.glow}`,
                                opacity: isVerified ? 1 : 0.35,
                                filter: isVerified ? 'none' : 'grayscale(0.6)',
                                pointerEvents: isVerified ? 'auto' : 'none',
                            }}
                            {...fadeUp(0.1 + i * 0.07)}
                            whileHover={isVerified ? { y: -4, boxShadow: `0 12px 40px ${s.glow}`, borderColor: `${s.color}44` } : {}}
                        >
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 16 }}>
                                <div style={{ fontSize: 22, color: s.color }}>{s.icon}</div>
                                <div style={{ background: `${s.color}15`, color: s.color, fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                                    {isVerified ? 'LIVE' : 'LOCKED'}
                                </div>
                            </div>
                            <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary, #fff)', lineHeight: 1 }}>
                                {isVerified ? s.val : '—'}
                            </div>
                            <div style={{ color: '#64748B', fontSize: 13, marginTop: 6 }}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Recent AI Findings — locked if unverified ── */}
                <motion.div
                    style={{
                        background: 'rgba(15,25,45,0.7)', backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(13,148,136,0.12)', borderRadius: 16, overflow: 'hidden',
                        opacity: isVerified ? 1 : 0.4,
                        filter: isVerified ? 'none' : 'grayscale(0.6)',
                        pointerEvents: isVerified ? 'auto' : 'none',
                    }}
                    {...fadeUp(0.4)}
                >
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary, #fff)', fontSize: 16 }}>Recent AI Findings</div>
                        <div style={{ background: 'rgba(13,148,136,0.15)', color: '#14B8A6', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            {isVerified ? '● AI Active' : '🔒 Locked'}
                        </div>
                    </div>
                    {!isVerified ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#334155' }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                            Unlocks after verification
                        </div>
                    ) : reports.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#334155' }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
                            No AI reports yet
                        </div>
                    ) : reports.map((r, i) => {
                        const findings = r.confidence_scores || {};
                        const top = Object.entries(findings).sort((a,b)=>b[1]-a[1])[0];
                        return (
                            <motion.div key={r.id}
                                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.07 }}
                                whileHover={{ background: 'rgba(13,148,136,0.05)' }}
                            >
                                <div style={{ display:'flex', gap: 12, alignItems:'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius:'50%', background: '#F59E0B' }}/>
                                    <div>
                                        <div style={{ color:'#E2E8F0', fontSize: 14, fontWeight: 500 }}>{top ? top[0] : 'Analysis'}</div>
                                        <div style={{ color:'#475569', fontSize: 12, marginTop: 2 }}>{formatDate(r.created_at)}</div>
                                    </div>
                                </div>
                                <div style={{ color:'#10B981', fontWeight: 700, fontSize: 14 }}>{top ? `${(top[1]*100).toFixed(0)}%` : '—'}</div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </PageWrapper>
    );
}

// ── MAIN EXPORT ───────────────────────────────────
export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin'
        ? <DentistDashboard user={user} />
        : <PatientDashboard user={user} />;
}