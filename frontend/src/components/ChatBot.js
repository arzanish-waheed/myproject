import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';

export default function ChatBot() {
    const [open, setOpen]         = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi Dr.! I'm your DeepSense AI Assistant. Ask me about diagnoses, treatments, or clinical guidance. 🦷" }
    ]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const scrollRef = useRef(null);

    // Token se role nikalo - localStorage user par depend mat karo
    const getRole = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch { return null; }
    };

    // Hooks pehle, condition baad mein
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Sirf admin ko dikhao
    const role = getRole();
    if (role !== 'admin') return null;

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await API.post('/chat', {
                message: input,
                history: history
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, something went wrong.' }]);
        }
        setLoading(false);
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                style={styles.fab}
                onClick={() => setOpen(!open)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                    boxShadow: open
                        ? '0 0 0 0 rgba(13,148,136,0)'
                        : ['0 0 0 0 rgba(13,148,136,0.4)', '0 0 0 12px rgba(13,148,136,0)'],
                }}
                transition={{ duration: 2, repeat: open ? 0 : Infinity }}
            >
                {open ? '✕' : '🤖'}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        style={styles.chatWindow}
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
                    >
                        {/* Header */}
                        <div style={styles.header}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={styles.headerIcon}>🤖</div>
                                <div>
                                    <div style={{ fontWeight:700, color:'#fff', fontSize:14 }}>DeepSense Assistant</div>
                                    <div style={{ fontSize:11, color:'#10B981', display:'flex', alignItems:'center', gap:4 }}>
                                        <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', display:'inline-block' }}/>
                                        Online
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={styles.messages}>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    style={{
                                        ...styles.bubble,
                                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        background: m.role === 'user'
                                            ? 'linear-gradient(135deg,#0D9488,#0891B2)'
                                            : 'rgba(255,255,255,0.06)',
                                        color: m.role === 'user' ? '#fff' : '#E2E8F0',
                                    }}
                                    initial={{ opacity:0, y:10 }}
                                    animate={{ opacity:1, y:0 }}
                                >
                                    {m.content}
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div
                                    style={{ ...styles.bubble, alignSelf:'flex-start', background:'rgba(255,255,255,0.06)' }}
                                    initial={{ opacity:0 }}
                                    animate={{ opacity:1 }}
                                >
                                    <motion.span
                                        animate={{ opacity:[0.3,1,0.3] }}
                                        transition={{ duration:1.2, repeat:Infinity }}
                                    >
                                        ● ● ●
                                    </motion.span>
                                </motion.div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input */}
                        <div style={styles.inputArea}>
                            <input
                                style={styles.input}
                                placeholder="Ask about diagnosis, treatment..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                            />
                            <motion.button
                                style={styles.sendBtn}
                                onClick={sendMessage}
                                whileHover={{ scale:1.05 }}
                                whileTap={{ scale:0.95 }}
                            >
                                ➤
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

const styles = {
    fab: {
        position:'fixed', bottom:28, right:28, zIndex:998,
        width:58, height:58, borderRadius:'50%',
        background:'linear-gradient(135deg,#0D9488,#0891B2)',
        color:'#fff', border:'none', fontSize:24,
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    },
    chatWindow: {
        position:'fixed', bottom:96, right:28, zIndex:998,
        width:380, height:520,
        background:'rgba(10,18,32,0.97)',
        backdropFilter:'blur(20px)',
        border:'1px solid rgba(13,148,136,0.25)',
        borderRadius:18, display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
        overflow:'hidden',
    },
    header: {
        padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)',
        background:'rgba(13,148,136,0.08)',
    },
    headerIcon: {
        width:34, height:34, borderRadius:10,
        background:'rgba(13,148,136,0.2)', display:'flex',
        alignItems:'center', justifyContent:'center', fontSize:18,
    },
    messages: {
        flex:1, padding:16, display:'flex', flexDirection:'column',
        gap:10, overflowY:'auto',
    },
    bubble: {
        padding:'10px 14px', borderRadius:14, maxWidth:'85%',
        fontSize:13, lineHeight:1.5,
    },
    inputArea: {
        padding:12, borderTop:'1px solid rgba(255,255,255,0.06)',
        display:'flex', gap:8,
    },
    input: {
        flex:1, padding:'10px 14px',
        background:'rgba(255,255,255,0.05)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:10, color:'#E2E8F0', fontSize:13,
        outline:'none', fontFamily:'inherit',
    },
    sendBtn: {
        width:38, height:38, borderRadius:10,
        background:'linear-gradient(135deg,#0D9488,#0891B2)',
        border:'none', color:'#fff', cursor:'pointer', fontSize:16,
    },
};