import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import ParticlesBg from '../components/ParticlesBg';

export default function Chat() {
    const location = useLocation();
    const reportContext = location.state?.reportContext || null;

    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [image, setImage]       = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const bottomRef = useRef(null);
    const fileRef   = useRef(null);

    // Initial greeting + auto-load report context
    useEffect(() => {
        const welcome = {
            role: 'assistant',
            content: reportContext
                ? `Hi Dr! I've loaded the X-ray analysis report. Ask me anything about the findings, treatment options, or clinical next steps. 🦷`
                : `Hi Dr! I'm your DeepSense AI Assistant. Ask me about diagnoses, treatments, drug interactions, or any clinical question. 🦷`,
        };
        const msgs = [welcome];
        if (reportContext) {
            msgs.push({
                role: 'system_note',
                content: '📋 Report context loaded from AI Analysis page.',
            });
        }
        setMessages(msgs);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleImageChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setImage(f);
        setImagePreview(URL.createObjectURL(f));
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const send = async () => {
        const text = input.trim();
        if (!text && !image) return;
        if (loading) return;

        let userContent = text;
        if (image) userContent = `[Image attached: ${image.name}]\n${text}`;

        const newMessages = [...messages, { role: 'user', content: userContent }];
        setMessages(newMessages);
        setInput('');
        setImage(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
        setLoading(true);

        try {
            // Build history for API (exclude system notes)
            const history = newMessages
                .filter(m => m.role === 'user' || m.role === 'assistant')
                .slice(-10)
                .map(m => ({ role: m.role, content: m.content }));

            // Prepend report context as first user message if available
            let apiHistory = history;
            if (reportContext) {
                apiHistory = [
                    { role: 'user', content: `Here is the X-ray analysis report for reference:\n\n${reportContext}` },
                    { role: 'assistant', content: `Understood. I have reviewed the report. How can I help you with this case?` },
                    ...history,
                ];
            }

            const res = await API.post('/chat', {
                message: userContent,
                history: apiHistory.slice(0, -1), // exclude last user msg (sent as message)
            });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Something went wrong. Please try again.',
            }]);
        }
        setLoading(false);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <div className="ds-page-root" style={{ minHeight:'100vh', background:'var(--bg-primary, #060B14)', color:'var(--text-primary, #E2E8F0)', position:'relative', display:'flex', flexDirection:'column', transition:'background 0.3s ease, color 0.3s ease' }}>
            <ParticlesBg />
            <Navbar />

            <div style={{ paddingTop:80, flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1, maxWidth:900, margin:'0 auto', width:'100%', padding:'80px 24px 24px' }}>

                {/* Header */}
                <motion.div
                    style={{ marginBottom:24 }}
                    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                >
                    <div style={{ fontSize:13, color:'#0D9488', fontWeight:600, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>
                        DeepSense AI
                    </div>
                    <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', marginBottom:4 }}>
                        🤖 AI Clinical Assistant
                    </h1>
                    <p style={{ color:'#64748B', fontSize:14 }}>
                        Ask about diagnoses, treatments, drug dosages, or discuss a patient case
                    </p>
                </motion.div>

                {/* Chat Window */}
                <motion.div
                    style={{
                        flex:1, background:'rgba(15,25,45,0.8)', backdropFilter:'blur(12px)',
                        border:'1px solid rgba(13,148,136,0.2)', borderRadius:16,
                        display:'flex', flexDirection:'column',
                        boxShadow:'0 0 40px rgba(13,148,136,0.08)', minHeight:480
                    }}
                    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.1 }}
                >
                    {/* Messages */}
                    <div style={{ flex:1, overflowY:'auto', padding:'24px 24px 8px', display:'flex', flexDirection:'column', gap:16 }}>
                        <AnimatePresence>
                            {messages.map((msg, i) => {
                                if (msg.role === 'system_note') {
                                    return (
                                        <motion.div key={i}
                                            style={{ textAlign:'center', fontSize:12, color:'#0D9488',
                                                background:'rgba(13,148,136,0.08)', borderRadius:8,
                                                padding:'6px 12px', border:'1px solid rgba(13,148,136,0.15)' }}
                                            initial={{ opacity:0 }} animate={{ opacity:1 }}
                                        >
                                            {msg.content}
                                        </motion.div>
                                    );
                                }

                                const isUser = msg.role === 'user';
                                return (
                                    <motion.div key={i}
                                        style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems:'flex-end', gap:10 }}
                                        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                                        transition={{ duration:0.3 }}
                                    >
                                        {!isUser && (
                                            <div style={{
                                                width:34, height:34, borderRadius:'50%', flexShrink:0,
                                                background:'linear-gradient(135deg,#0D9488,#0891B2)',
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                fontSize:16
                                            }}>🦷</div>
                                        )}
                                        <div style={{
                                            maxWidth:'72%', padding:'12px 16px', borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: isUser
                                                ? 'linear-gradient(135deg,#0D9488,#0891B2)'
                                                : 'rgba(255,255,255,0.06)',
                                            border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                            fontSize:14, lineHeight:1.65,
                                            color: isUser ? '#fff' : '#CBD5E1',
                                            whiteSpace:'pre-wrap',
                                        }}>
                                            {msg.content}
                                        </div>
                                        {isUser && (
                                            <div style={{
                                                width:34, height:34, borderRadius:'50%', flexShrink:0,
                                                background:'rgba(255,255,255,0.1)',
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                fontSize:16
                                            }}>👨‍⚕️</div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Typing indicator */}
                        {loading && (
                            <motion.div
                                style={{ display:'flex', alignItems:'flex-end', gap:10 }}
                                initial={{ opacity:0 }} animate={{ opacity:1 }}
                            >
                                <div style={{
                                    width:34, height:34, borderRadius:'50%',
                                    background:'linear-gradient(135deg,#0D9488,#0891B2)',
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16
                                }}>🦷</div>
                                <div style={{
                                    padding:'12px 18px', borderRadius:'18px 18px 18px 4px',
                                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)',
                                    display:'flex', gap:5, alignItems:'center'
                                }}>
                                    {[0,1,2].map(j => (
                                        <motion.div key={j}
                                            style={{ width:7, height:7, borderRadius:'50%', background:'#0D9488' }}
                                            animate={{ y:[0,-5,0] }}
                                            transition={{ duration:0.6, repeat:Infinity, delay:j*0.15 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div style={{ padding:'0 24px 8px', display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ position:'relative', display:'inline-block' }}>
                                <img src={imagePreview} alt="preview"
                                    style={{ height:60, width:60, objectFit:'cover', borderRadius:8,
                                        border:'1px solid rgba(13,148,136,0.4)' }}
                                />
                                <button onClick={removeImage}
                                    style={{
                                        position:'absolute', top:-6, right:-6,
                                        background:'#EF4444', border:'none', borderRadius:'50%',
                                        width:18, height:18, cursor:'pointer', color:'#fff',
                                        fontSize:10, display:'flex', alignItems:'center', justifyContent:'center',
                                        fontWeight:700
                                    }}
                                >✕</button>
                            </div>
                            <span style={{ color:'#64748B', fontSize:12 }}>{image?.name}</span>
                        </div>
                    )}

                    {/* Input Bar */}
                    <div style={{
                        padding:16, borderTop:'1px solid rgba(255,255,255,0.06)',
                        display:'flex', gap:10, alignItems:'flex-end'
                    }}>
                        {/* Image attach */}
                        <motion.button
                            onClick={() => fileRef.current?.click()}
                            style={{
                                width:42, height:42, borderRadius:10, flexShrink:0,
                                background: imagePreview ? 'rgba(13,148,136,0.2)' : 'rgba(255,255,255,0.05)',
                                border:`1px solid ${imagePreview ? 'rgba(13,148,136,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center'
                            }}
                            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                            title="Attach X-ray image"
                        >
                            📎
                        </motion.button>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display:'none' }} />

                        {/* Text input */}
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask about diagnosis, treatment, dosage... (Enter to send)"
                            rows={1}
                            style={{
                                flex:1, padding:'10px 14px',
                                background:'rgba(255,255,255,0.05)',
                                border:'1px solid rgba(255,255,255,0.1)',
                                borderRadius:10, fontSize:14, color:'#E2E8F0',
                                outline:'none', resize:'none', fontFamily:'inherit',
                                lineHeight:1.5, maxHeight:120, overflowY:'auto'
                            }}
                            onInput={e => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                        />

                        {/* Send */}
                        <motion.button
                            onClick={send} disabled={loading || (!input.trim() && !image)}
                            style={{
                                width:42, height:42, borderRadius:10, flexShrink:0,
                                background: (loading || (!input.trim() && !image))
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'linear-gradient(135deg,#0D9488,#0891B2)',
                                border:'none', cursor: (loading || (!input.trim() && !image)) ? 'not-allowed' : 'pointer',
                                fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'
                            }}
                            whileHover={(!loading && (input.trim() || image)) ? { scale:1.05 } : {}}
                            whileTap={(!loading && (input.trim() || image)) ? { scale:0.95 } : {}}
                        >
                            ➤
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}