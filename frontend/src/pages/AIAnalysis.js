import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import ParticlesBg from '../components/ParticlesBg';

export default function AIAnalysis() {
    const [file, setFile]           = useState(null);
    const [result, setResult]       = useState(null);
    const [loading, setLoading]     = useState(false);
    const [patients, setPatients]   = useState([]);
    const [patientId, setPatientId] = useState('');
    const [error, setError]         = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);

    // ── Chat state ──
    const [messages, setMessages]   = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatImage, setChatImage] = useState(null);
    const [chatImagePreview, setChatImagePreview] = useState(null);
    const bottomRef = useRef(null);
    const fileRef   = useRef(null);

    useEffect(() => {
        API.get('/patients')
            .then(r => setPatients(r.data))
            .catch(() => {});

        // Initial chat message - analyze se pehle bhi visible
        setMessages([{
            role: 'assistant',
            content: `Hi Dr! I'm your DeepSense AI Assistant. You can upload an X-ray for analysis above, or directly share an image/PDF here to discuss with me. 🦷`
        }]);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, chatLoading]);

    const analyze = async () => {
        if (!patientId) { setError('⚠️ Please select a patient first!'); return; }
        if (!file)      { setError('⚠️ Please upload an X-ray image!');  return; }
        setError('');
        setLoading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await API.post(
                `/analyze?patient_id=${patientId}`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setResult(res.data);

            const patient = patients.find(p => p.id === patientId);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I've analyzed the X-ray for ${patient?.full_name || 'the patient'}. Primary finding: ${res.data.detected} (${(res.data.confidence*100).toFixed(1)}% confidence). Ask me anything about this case. 🦷`
            }]);
        } catch (err) {
    const msg = err.response?.data?.detail || 'Analysis failed. Please upload a valid X-ray image.';
    setError(`⚠️ ${msg}`);
    setLoading(false);
}
        setLoading(false);
    };

    const downloadPDF = async () => {
        if (!result) return;
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

            const patient = patients.find(p => p.id === patientId);
            const patientName = patient ? patient.full_name : 'Unknown Patient';
            const today = new Date().toLocaleDateString('en-PK', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const reportId = 'DS-' + Date.now().toString().slice(-6);

            const teal     = [13, 148, 136];
            const darkBg   = [6, 11, 20];
            const cardBg   = [15, 25, 45];
            const white     = [255, 255, 255];
            const lightGray = [148, 163, 184];

            const W = 210, H = 297;

            doc.setFillColor(...darkBg);
            doc.rect(0, 0, W, H, 'F');

            doc.setFillColor(...teal);
            doc.rect(0, 0, W, 28, 'F');

            doc.setFillColor(6, 11, 20);
            doc.circle(20, 14, 8, 'F');
            doc.setFontSize(10);
            doc.setTextColor(...white);
            doc.setFont('helvetica', 'bold');
            doc.text('DS', 20, 17, { align: 'center' });

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...white);
            doc.text('DeepSense AI', 32, 11);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 240, 237);
            doc.text('Dental Intelligence Platform', 32, 17);

            doc.setFontSize(8);
            doc.setTextColor(...white);
            doc.text(`Report ID: ${reportId}`, W - 10, 11, { align: 'right' });
            doc.text(`Date: ${today}`, W - 10, 17, { align: 'right' });

            doc.setFillColor(...teal);
            doc.rect(0, 28, W, 1.5, 'F');

            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...white);
            doc.text('Dental X-Ray Analysis Report', W / 2, 46, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            doc.text('AI-Assisted Clinical Diagnosis · For Dentist Review Only', W / 2, 53, { align: 'center' });

            doc.setDrawColor(...teal);
            doc.setLineWidth(0.3);
            doc.line(15, 57, W - 15, 57);

            doc.setFillColor(...cardBg);
            doc.roundedRect(15, 62, W - 30, 26, 3, 3, 'F');
            doc.setDrawColor(13, 148, 136, 0.3);
            doc.setLineWidth(0.3);
            doc.roundedRect(15, 62, W - 30, 26, 3, 3, 'S');

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...teal);
            doc.text('PATIENT INFORMATION', 22, 70);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...white);
            doc.text(`Patient Name:`, 22, 78);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            doc.text(patientName, 55, 78);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...white);
            doc.text(`Report Date:`, 120, 78);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            doc.text(today, 148, 78);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...white);
            doc.text(`Analysis Type:`, 22, 84);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            doc.text('AI X-Ray Dental Diagnosis', 55, 84);

            doc.setFillColor(16, 40, 35);
            doc.roundedRect(15, 96, W - 30, 36, 3, 3, 'F');
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.4);
            doc.roundedRect(15, 96, W - 30, 36, 3, 3, 'S');

            doc.setFillColor(16, 185, 129);
            doc.roundedRect(15, 96, 3, 36, 1, 1, 'F');

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...teal);
            doc.text('PRIMARY FINDING', 24, 105);

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...white);
            doc.text(result.detected, 24, 116);

            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text(`${(result.confidence * 100).toFixed(1)}%`, 24, 128);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            doc.text('Confidence Score', 65, 128);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...teal);
            doc.text('ALL FINDINGS', 15, 144);
            doc.setDrawColor(...teal);
            doc.line(15, 146, W - 15, 146);

            const findings = Object.entries(result.all_findings).sort((a, b) => b[1] - a[1]);
            let yPos = 154;

            findings.forEach(([name, val]) => {
                const pct = val * 100;
                const barW = W - 70;

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...lightGray);
                doc.text(name, 15, yPos);

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...teal);
                doc.text(`${pct.toFixed(1)}%`, W - 15, yPos, { align: 'right' });

                doc.setFillColor(30, 40, 60);
                doc.roundedRect(15, yPos + 2, barW, 4, 1, 1, 'F');

                doc.setFillColor(...teal);
                doc.roundedRect(15, yPos + 2, (barW * pct) / 100, 4, 1, 1, 'F');

                yPos += 14;
            });

            yPos += 4;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...teal);
            doc.text('CLINICAL REPORT', 15, yPos);
            doc.setDrawColor(...teal);
            doc.line(15, yPos + 2, W - 15, yPos + 2);
            yPos += 8;

            doc.setFillColor(...cardBg);
            doc.roundedRect(15, yPos, W - 30, 62, 3, 3, 'F');

            const reportLines = doc.splitTextToSize(result.nlp_report.trim(), W - 42);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            doc.text(reportLines.slice(0, 20), 22, yPos + 8);

            doc.setFillColor(40, 20, 20);
            doc.roundedRect(15, H - 38, W - 30, 16, 2, 2, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(252, 165, 165);
            doc.text('⚠  DISCLAIMER', 22, H - 31);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(253, 186, 186);
            doc.text(
                'This report is AI-generated and intended to assist clinical decision-making only. Final diagnosis and treatment must be determined by a licensed dental professional.',
                22, H - 26,
                { maxWidth: W - 44 }
            );

            doc.setFillColor(...teal);
            doc.rect(0, H - 18, W, 18, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...white);
            doc.text('DeepSense AI · Dental Intelligence Platform', W / 2, H - 10, { align: 'center' });
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 240, 237);
            doc.text(`Generated: ${today}  ·  Report ID: ${reportId}`, W / 2, H - 5, { align: 'center' });

            doc.save(`DeepSense_Report_${patientName.replace(/\s+/g,'_')}_${reportId}.pdf`);
        } catch (err) {
            console.error('PDF error:', err);
            alert('PDF generation failed. Please try again.');
        }
        setPdfLoading(false);
    };

    // ── Chat handlers ──
    const handleChatImage = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setChatImage(f);
        setChatImagePreview(URL.createObjectURL(f));
    };

    const removeChatImage = () => {
        setChatImage(null);
        setChatImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const sendChat = async () => {
        const text = chatInput.trim();
        if (!text && !chatImage) return;
        if (chatLoading) return;

        let userContent = text;
        if (chatImage) userContent = `[Image attached: ${chatImage.name}]\n${text}`;

        const newMessages = [...messages, { role: 'user', content: userContent }];
        setMessages(newMessages);
        setChatInput('');
        setChatImage(null);
        setChatImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
        setChatLoading(true);

        try {
            const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

            let apiHistory = history;
            if (result) {
                const patient = patients.find(p => p.id === patientId);
                const reportContext = `Patient: ${patient?.full_name || 'Unknown'}
Primary Finding: ${result.detected} (${(result.confidence * 100).toFixed(1)}% confidence)
All Findings: ${Object.entries(result.all_findings).map(([k,v]) => `${k}: ${(v*100).toFixed(1)}%`).join(', ')}

${result.nlp_report}`;
                apiHistory = [
                    { role: 'user', content: `Here is the X-ray analysis report for reference:\n\n${reportContext}` },
                    { role: 'assistant', content: `Understood. I have reviewed the report. How can I help you with this case?` },
                    ...history,
                ];
            }

            const res = await API.post('/chat', {
                message: userContent,
                history: apiHistory.slice(0, -1),
            });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Something went wrong. Please try again.',
            }]);
        }
        setChatLoading(false);
    };

    const handleChatKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
    };

    return (
        <div className="ds-page-root" style={{ minHeight:'100vh', background:'var(--bg-primary, #060B14)', color:'var(--text-primary, #E2E8F0)', position:'relative', transition:'background 0.3s ease, color 0.3s ease' }}>
            <ParticlesBg />
            <Navbar />

            <div style={{ paddingTop:96, padding:'96px 40px 60px', position:'relative', zIndex:1 }}>
                <motion.div
                    style={{ marginBottom:32 }}
                    initial={{ opacity:0, y:20 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.5 }}
                >
                    <div style={{ fontSize:13, color:'#0D9488', fontWeight:600, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>
                        DeepSense AI
                    </div>
                    <h1 style={{ fontSize:32, fontWeight:800, color:'#fff', marginBottom:6 }}>
                        🧠 AI Analysis
                    </h1>
                    <p style={{ color:'#64748B', fontSize:15 }}>
                        Upload a dental X-ray for instant AI diagnosis
                    </p>
                </motion.div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                    {/* Upload Card */}
                    <motion.div
                        style={{
                            background:'rgba(15,25,45,0.8)', backdropFilter:'blur(12px)',
                            border:'1px solid rgba(13,148,136,0.2)', borderRadius:16, padding:28,
                            boxShadow:'0 0 30px rgba(13,148,136,0.08)'
                        }}
                        initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                        transition={{ duration:0.5, delay:0.1 }}
                    >
                        <h3 style={{ color:'#fff', marginBottom:20, fontSize:16 }}>Upload X-ray</h3>

                        {error && (
                            <motion.div
                                style={{
                                    background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                                    color:'#FCA5A5', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16
                                }}
                                initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <div style={{ marginBottom:16 }}>
                            <label style={{ fontSize:12, color:'#64748B', marginBottom:6, display:'block', letterSpacing:1, textTransform:'uppercase' }}>
                                Select Patient *
                            </label>
                            <select
                                style={{
                                    width:'100%', padding:'12px 16px',
                                    background:'rgba(255,255,255,0.05)',
                                    border:`1px solid ${!patientId && error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius:10, fontSize:14, color:'#E2E8F0', outline:'none', cursor:'pointer'
                                }}
                                value={patientId}
                                onChange={e => { setPatientId(e.target.value); setError(''); }}
                            >
                                <option value="" style={{ background:'#0F1929' }}>-- Select Patient --</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id} style={{ background:'#0F1929' }}>{p.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <motion.div
                            style={{
                                border:`2px dashed ${file ? '#10B981' : 'rgba(13,148,136,0.3)'}`,
                                borderRadius:12, padding:40, textAlign:'center', marginBottom:16, cursor:'pointer',
                                background: file ? 'rgba(16,185,129,0.05)' : 'rgba(13,148,136,0.03)', transition:'all 0.3s'
                            }}
                            whileHover={{ borderColor:'#0D9488', background:'rgba(13,148,136,0.08)' }}
                        >
                            <div style={{ fontSize:36, marginBottom:8 }}>🦷</div>
                            <input
                                type="file" accept="image/*"
                                onChange={e => { setFile(e.target.files[0]); setError(''); }}
                                style={{ color:'#94A3B8' }}
                            />
                            {file && (
                                <motion.div
                                    style={{ color:'#10B981', fontSize:13, marginTop:8, fontWeight:600 }}
                                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                                >
                                    ✅ {file.name}
                                </motion.div>
                            )}
                            <p style={{ color:'#475569', fontSize:12, marginTop:8 }}>DICOM, PNG, JPEG · Max 20MB</p>
                        </motion.div>

                        <motion.button
                            onClick={analyze} disabled={loading}
                            style={{
                                width:'100%', padding:14,
                                background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#0D9488,#0891B2)',
                                color: loading ? '#475569' : '#fff', border:'none',
                                borderRadius:12, cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize:15, fontWeight:700, fontFamily:'inherit',
                            }}
                            whileHover={!loading ? { scale:1.02, boxShadow:'0 8px 25px rgba(13,148,136,0.3)' } : {}}
                            whileTap={!loading ? { scale:0.98 } : {}}
                        >
                            {loading ? (
                                <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ duration:1, repeat:Infinity }}>
                                    ⏳ Analyzing...
                                </motion.span>
                            ) : '🔍 Analyze X-ray'}
                        </motion.button>
                    </motion.div>

                    {/* Results Card */}
                    <motion.div
                        style={{
                            background:'rgba(15,25,45,0.8)', backdropFilter:'blur(12px)',
                            border:'1px solid rgba(13,148,136,0.2)', borderRadius:16, padding:28,
                            boxShadow:'0 0 30px rgba(13,148,136,0.08)'
                        }}
                        initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                        transition={{ duration:0.5, delay:0.2 }}
                    >
                        <h3 style={{ color:'#fff', marginBottom:20, fontSize:16 }}>AI Findings</h3>

                        {result ? (
                            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                                <div style={{
                                    background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
                                    borderRadius:12, padding:20, marginBottom:20
                                }}>
                                    <div style={{ fontSize:11, color:'#64748B', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>
                                        Primary Finding
                                    </div>
                                    <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>{result.detected}</div>
                                    <div style={{ fontSize:36, fontWeight:800, color:'#10B981' }}>
                                        {(result.confidence * 100).toFixed(1)}%
                                    </div>
                                </div>

                                {Object.entries(result.all_findings).sort((a,b) => b[1]-a[1]).map(([k,v], i) => (
                                    <motion.div key={k} style={{ marginBottom:12 }}
                                        initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                                        transition={{ delay:0.1*i }}
                                    >
                                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                                            <span style={{ color:'#94A3B8' }}>{k}</span>
                                            <span style={{ color:'#0D9488', fontWeight:700 }}>{(v*100).toFixed(1)}%</span>
                                        </div>
                                        <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                                            <motion.div
                                                style={{ height:6, background:'linear-gradient(90deg,#0D9488,#14B8A6)', borderRadius:3 }}
                                                initial={{ width:0 }} animate={{ width:`${v*100}%` }}
                                                transition={{ duration:0.8, delay:0.1*i }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}

                                <div style={{
                                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                                    borderRadius:10, padding:16, marginTop:16
                                }}>
                                    <div style={{ fontSize:11, color:'#0D9488', letterSpacing:2, textTransform:'uppercase', marginBottom:10, fontWeight:700 }}>
                                        📋 Clinical Report
                                    </div>
                                    <pre style={{ fontSize:12, whiteSpace:'pre-wrap', color:'#94A3B8', fontFamily:'inherit', margin:0, lineHeight:1.7 }}>
                                        {result.nlp_report}
                                    </pre>
                                </div>

                                <motion.div
                                    style={{ color:'#10B981', fontWeight:600, textAlign:'center', fontSize:13, marginTop:12 }}
                                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
                                >
                                    ✅ Report saved to patient record!
                                </motion.div>

                                <motion.button
                                    onClick={downloadPDF} disabled={pdfLoading}
                                    style={{
                                        width:'100%', padding:'12px 10px', marginTop:16,
                                        background: pdfLoading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#DC2626,#B91C1C)',
                                        color: pdfLoading ? '#475569' : '#fff',
                                        border:'none', borderRadius:10,
                                        cursor: pdfLoading ? 'not-allowed' : 'pointer',
                                        fontSize:13, fontWeight:700, fontFamily:'inherit',
                                    }}
                                    whileHover={!pdfLoading ? { scale:1.02, boxShadow:'0 6px 20px rgba(220,38,38,0.3)' } : {}}
                                    whileTap={!pdfLoading ? { scale:0.98 } : {}}
                                >
                                    {pdfLoading ? '⏳ Generating...' : '📄 Download PDF'}
                                </motion.button>
                            </motion.div>
                        ) : (
                            <div style={{ textAlign:'center', paddingTop:60 }}>
                                <motion.div
                                    style={{ fontSize:48, marginBottom:16 }}
                                    animate={{ y:[0,-8,0] }} transition={{ duration:2, repeat:Infinity }}
                                >
                                    🦷
                                </motion.div>
                                <div style={{ color:'#334155', fontSize:14 }}>
                                    Select patient and upload X-ray<br/>to see AI analysis
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ── INLINE AI CHAT BOX — hamesha visible ── */}
                <motion.div
                    style={{
                        marginTop:32, background:'rgba(15,25,45,0.8)', backdropFilter:'blur(12px)',
                        border:'1px solid rgba(124,58,237,0.25)', borderRadius:16,
                        display:'flex', flexDirection:'column',
                        boxShadow:'0 0 40px rgba(124,58,237,0.08)', minHeight:420
                    }}
                    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.2 }}
                >
                    <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize:11, color:'#A78BFA', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>
                            AI Clinical Assistant
                        </div>
                        <div style={{ color:'#fff', fontSize:16, fontWeight:700 }}>🤖 Discuss with AI</div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex:1, overflowY:'auto', maxHeight:340, padding:'20px 24px 8px', display:'flex', flexDirection:'column', gap:14 }}>
                        <AnimatePresence>
                            {messages.map((msg, i) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <motion.div key={i}
                                        style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems:'flex-end', gap:10 }}
                                        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                                        transition={{ duration:0.3 }}
                                    >
                                        {!isUser && (
                                            <div style={{
                                                width:30, height:30, borderRadius:'50%', flexShrink:0,
                                                background:'linear-gradient(135deg,#7C3AED,#6D28D9)',
                                                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14
                                            }}>🦷</div>
                                        )}
                                        <div style={{
                                            maxWidth:'72%', padding:'11px 15px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: isUser ? 'linear-gradient(135deg,#0D9488,#0891B2)' : 'rgba(255,255,255,0.06)',
                                            border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                            fontSize:13.5, lineHeight:1.6,
                                            color: isUser ? '#fff' : '#CBD5E1',
                                            whiteSpace:'pre-wrap',
                                        }}>
                                            {msg.content}
                                        </div>
                                        {isUser && (
                                            <div style={{
                                                width:30, height:30, borderRadius:'50%', flexShrink:0,
                                                background:'rgba(255,255,255,0.1)',
                                                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14
                                            }}>👨‍⚕️</div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {chatLoading && (
                            <motion.div style={{ display:'flex', alignItems:'flex-end', gap:10 }} initial={{ opacity:0 }} animate={{ opacity:1 }}>
                                <div style={{
                                    width:30, height:30, borderRadius:'50%',
                                    background:'linear-gradient(135deg,#7C3AED,#6D28D9)',
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14
                                }}>🦷</div>
                                <div style={{
                                    padding:'11px 16px', borderRadius:'16px 16px 16px 4px',
                                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)',
                                    display:'flex', gap:5, alignItems:'center'
                                }}>
                                    {[0,1,2].map(j => (
                                        <motion.div key={j}
                                            style={{ width:6, height:6, borderRadius:'50%', background:'#7C3AED' }}
                                            animate={{ y:[0,-5,0] }}
                                            transition={{ duration:0.6, repeat:Infinity, delay:j*0.15 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Image preview */}
                    {chatImagePreview && (
                        <div style={{ padding:'0 24px 8px', display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ position:'relative', display:'inline-block' }}>
                                <img src={chatImagePreview} alt="preview"
                                    style={{ height:54, width:54, objectFit:'cover', borderRadius:8, border:'1px solid rgba(124,58,237,0.4)' }}
                                />
                                <button onClick={removeChatImage}
                                    style={{
                                        position:'absolute', top:-6, right:-6,
                                        background:'#EF4444', border:'none', borderRadius:'50%',
                                        width:18, height:18, cursor:'pointer', color:'#fff',
                                        fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700
                                    }}
                                >✕</button>
                            </div>
                            <span style={{ color:'#64748B', fontSize:12 }}>{chatImage?.name}</span>
                        </div>
                    )}

                    {/* Input bar */}
                    <div style={{ padding:16, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:10, alignItems:'flex-end' }}>
                        <motion.button
                            onClick={() => fileRef.current?.click()}
                            style={{
                                width:40, height:40, borderRadius:10, flexShrink:0,
                                background: chatImagePreview ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                                border:`1px solid ${chatImagePreview ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center'
                            }}
                            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                            title="Attach X-ray image or PDF"
                        >
                            📎
                        </motion.button>
                        <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleChatImage} style={{ display:'none' }} />

                        <textarea
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={handleChatKey}
                            placeholder="Ask about a finding, upload an image to discuss, treatment options... (Enter to send)"
                            rows={1}
                            style={{
                                flex:1, padding:'9px 14px',
                                background:'rgba(255,255,255,0.05)',
                                border:'1px solid rgba(255,255,255,0.1)',
                                borderRadius:10, fontSize:13.5, color:'#E2E8F0',
                                outline:'none', resize:'none', fontFamily:'inherit',
                                lineHeight:1.5, maxHeight:100, overflowY:'auto'
                            }}
                            onInput={e => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                            }}
                        />

                        <motion.button
                            onClick={sendChat} disabled={chatLoading || (!chatInput.trim() && !chatImage)}
                            style={{
                                width:40, height:40, borderRadius:10, flexShrink:0,
                                background: (chatLoading || (!chatInput.trim() && !chatImage))
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
                                border:'none', cursor: (chatLoading || (!chatInput.trim() && !chatImage)) ? 'not-allowed' : 'pointer',
                                fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'
                            }}
                            whileHover={(!chatLoading && (chatInput.trim() || chatImage)) ? { scale:1.05 } : {}}
                            whileTap={(!chatLoading && (chatInput.trim() || chatImage)) ? { scale:0.95 } : {}}
                        >
                            ➤
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}