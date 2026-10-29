import React, { useState, useEffect, useCallback } from 'react';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import AnimatedBG from '../components/AnimatedBG';

function ReportModal({ report, onClose }) {
    const [pdfLoading, setPdfLoading] = useState(false);
    const findings = report.confidence_scores || {};
    const top = Object.entries(findings).sort((a,b) => b[1]-a[1])[0];
    const date = new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const downloadPDF = async () => {
        setPdfLoading(true);
        try {
            if (!window.jspdf) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const patientName = report.patients?.full_name || 'Unknown Patient';
            const today = date;
            const reportId = report.id?.slice(0,8) || ('DS-' + Date.now().toString().slice(-6));
            const teal = [13, 148, 136], darkBg = [6, 11, 20], cardBg = [15, 25, 45], white = [255, 255, 255], lightGray = [148, 163, 184];
            const W = 210, H = 297;
            doc.setFillColor(...darkBg); doc.rect(0, 0, W, H, 'F');
            doc.setFillColor(...teal); doc.rect(0, 0, W, 28, 'F');
            doc.setFillColor(6, 11, 20); doc.circle(20, 14, 8, 'F');
            doc.setFontSize(10); doc.setTextColor(...white); doc.setFont('helvetica', 'bold');
            doc.text('DS', 20, 17, { align: 'center' });
            doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
            doc.text('DeepSense AI', 32, 11);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 240, 237);
            doc.text('Dental Intelligence Platform', 32, 17);
            doc.setFontSize(8); doc.setTextColor(...white);
            doc.text(`Report ID: ${reportId}`, W - 10, 11, { align: 'right' });
            doc.text(`Date: ${today}`, W - 10, 17, { align: 'right' });
            doc.setFillColor(...teal); doc.rect(0, 28, W, 1.5, 'F');
            doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
            doc.text('Dental X-Ray Analysis Report', W / 2, 46, { align: 'center' });
            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...lightGray);
            doc.text('AI-Assisted Clinical Diagnosis · For Dentist Review Only', W / 2, 53, { align: 'center' });
            doc.setDrawColor(...teal); doc.setLineWidth(0.3); doc.line(15, 57, W - 15, 57);
            doc.setFillColor(...cardBg); doc.roundedRect(15, 62, W - 30, 26, 3, 3, 'F');
            doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...teal);
            doc.text('PATIENT INFORMATION', 22, 70);
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
            doc.text(`Patient Name:`, 22, 78);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(...lightGray);
            doc.text(patientName, 55, 78);
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
            doc.text(`Report Date:`, 120, 78);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(...lightGray);
            doc.text(today, 148, 78);
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
            doc.text(`Analysis Type:`, 22, 84);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(...lightGray);
            doc.text('AI X-Ray Dental Diagnosis', 55, 84);
            doc.setFillColor(16, 40, 35); doc.roundedRect(15, 96, W - 30, 36, 3, 3, 'F');
            doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.4);
            doc.roundedRect(15, 96, W - 30, 36, 3, 3, 'S');
            doc.setFillColor(16, 185, 129); doc.roundedRect(15, 96, 3, 36, 1, 1, 'F');
            doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...teal);
            doc.text('PRIMARY FINDING', 24, 105);
            doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
            doc.text(top ? top[0] : '—', 24, 116);
            doc.setFontSize(26); doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 185, 129);
            doc.text(top ? `${(top[1] * 100).toFixed(1)}%` : '—', 24, 128);
            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...lightGray);
            doc.text('Confidence Score', 65, 128);
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...teal);
            doc.text('ALL FINDINGS', 15, 144);
            doc.setDrawColor(...teal); doc.line(15, 146, W - 15, 146);
            const sortedFindings = Object.entries(findings).sort((a, b) => b[1] - a[1]);
            let yPos = 154;
            sortedFindings.forEach(([name, val]) => {
                const pct = val * 100, barW = W - 70;
                doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...lightGray);
                doc.text(name, 15, yPos);
                doc.setFont('helvetica', 'bold'); doc.setTextColor(...teal);
                doc.text(`${pct.toFixed(1)}%`, W - 15, yPos, { align: 'right' });
                doc.setFillColor(30, 40, 60); doc.roundedRect(15, yPos + 2, barW, 4, 1, 1, 'F');
                doc.setFillColor(...teal); doc.roundedRect(15, yPos + 2, (barW * pct) / 100, 4, 1, 1, 'F');
                yPos += 14;
            });
            yPos += 4;
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...teal);
            doc.text('CLINICAL REPORT', 15, yPos);
            doc.setDrawColor(...teal); doc.line(15, yPos + 2, W - 15, yPos + 2);
            yPos += 8;
            doc.setFillColor(...cardBg); doc.roundedRect(15, yPos, W - 30, 62, 3, 3, 'F');
            const clinicalText = report.nlp_report || '';
            const reportLines = doc.splitTextToSize(clinicalText.trim(), W - 42);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...lightGray);
            doc.text(reportLines.slice(0, 20), 22, yPos + 8);
            doc.setFillColor(40, 20, 20); doc.roundedRect(15, H - 38, W - 30, 16, 2, 2, 'F');
            doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(252, 165, 165);
            doc.text('⚠  DISCLAIMER', 22, H - 31);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(253, 186, 186);
            doc.text('This report is AI-generated and intended to assist clinical decision-making only. Final diagnosis and treatment must be determined by a licensed dental professional.', 22, H - 26, { maxWidth: W - 44 });
            doc.setFillColor(...teal); doc.rect(0, H - 18, W, 18, 'F');
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
            doc.text('DeepSense AI · Dental Intelligence Platform', W / 2, H - 10, { align: 'center' });
            doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 240, 237);
            doc.text(`Generated: ${today}  ·  Report ID: ${reportId}`, W / 2, H - 5, { align: 'center' });
            doc.save(`DeepSense_Report_${patientName.replace(/\s+/g,'_')}_${reportId}.pdf`);
        } catch (err) {
            console.error('PDF error:', err);
            alert('PDF generation failed. Please try again.');
        }
        setPdfLoading(false);
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
                        <motion.button
                            onClick={downloadPDF} disabled={pdfLoading}
                            style={{
                                width: '100%', padding: '14px 10px', marginBottom: 20,
                                background: pdfLoading ? '#94A3B8' : 'linear-gradient(135deg,#DC2626,#B91C1C)',
                                color: '#fff', border: 'none', borderRadius: 10,
                                cursor: pdfLoading ? 'not-allowed' : 'pointer',
                                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                            }}
                            whileHover={!pdfLoading ? { scale: 1.02, boxShadow: '0 6px 20px rgba(220,38,38,0.3)' } : {}}
                            whileTap={!pdfLoading ? { scale: 0.98 } : {}}
                        >
                            {pdfLoading ? '⏳ Generating PDF...' : '📄 Download as PDF'}
                        </motion.button>
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Generated by DeepSense AI • Rawalpindi, Pakistan</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>⚠️ AI-assisted report. Consult a qualified dentist.</div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function Reports() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isDentist = user.role === 'admin';

    const [reports, setReports]   = useState([]);
    const [selected, setSelected] = useState(null);
    const [search, setSearch]     = useState('');

    const fetchReports = () => API.get('/reports').then(r => setReports(r.data));
    useEffect(() => { fetchReports(); }, []);

    const deleteReport = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
        try {
            await API.delete(`/reports/${id}`);
            fetchReports();
        } catch (err) {
            alert('Failed to delete report.');
        }
    };

    const filtered = reports.filter(r => {
        const findings = r.confidence_scores || {};
        const top = Object.entries(findings).sort((a,b) => b[1]-a[1])[0];
        const name    = r.patients?.full_name?.toLowerCase() || '';
        const finding = top ? top[0].toLowerCase() : '';
        return name.includes(search.toLowerCase()) || finding.includes(search.toLowerCase());
    });

    return (
        <div className="ds-page-root" style={{ minHeight: '100vh', background: 'var(--bg-primary, #060B14)', color: 'var(--text-primary, #E2E8F0)', position: 'relative', transition: 'background 0.3s ease, color 0.3s ease' }}>
            <AnimatedBG />
            <div style={{ position: 'relative', zIndex: 2 }}>
                <Navbar />
                <div style={{ padding: '90px 40px 40px' }}>
                    <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 24, fontWeight: 700 }}>📋 Reports</h2>
                    <input
                        style={{
                            width: '100%', padding: '12px 16px', marginBottom: 16,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10, fontSize: 14, color: '#E2E8F0',
                            outline: 'none', boxSizing: 'border-box'
                        }}
                        placeholder="🔍 Search by patient name or finding..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div style={{ background: 'rgba(15,25,45,0.8)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(13,148,136,0.15)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr', padding: '12px 20px', background: 'rgba(13,148,136,0.08)', color: '#64748B', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                            <span>Patient</span><span>Finding</span><span>Confidence</span><span>Date</span><span>Action</span>
                        </div>
                        {filtered.map(r => {
                            const findings = r.confidence_scores || {};
                            const top = Object.entries(findings).sort((a,b) => b[1]-a[1])[0];
                            return (
                                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: '#fff' }}>{r.patients?.full_name || '—'}</span>
                                    <span><span style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{top ? top[0] : '—'}</span></span>
                                    <span style={{ color: '#14B8A6', fontWeight: 700 }}>{top ? `${(top[1]*100).toFixed(0)}%` : '—'}</span>
                                    <span style={{ color: '#64748B', fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                                    <span style={{ display: 'flex', gap: 8 }}>
                                        <motion.button
                                            style={{ background: 'linear-gradient(135deg, #0D9488, #0891B2)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                            onClick={() => setSelected(r)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            View Report
                                        </motion.button>
                                        {isDentist && (
                                            <motion.button
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                                onClick={() => deleteReport(r.id)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                title="Delete Report"
                                            >
                                                ✕
                                            </motion.button>
                                        )}
                                    </span>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
                                {search ? 'No reports found matching your search' : 'No reports yet'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {selected && <ReportModal report={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}