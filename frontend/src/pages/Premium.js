import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

export default function Premium() {
    const { isDark } = useTheme();
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    
    // Status state
    const [subStatus, setSubStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Purchase form state
    const [selectedPlan, setSelectedPlan] = useState('one_time'); // 'one_time' or 'monthly'
    const [paymentMethod, setPaymentMethod] = useState('easypaisa'); // 'easypaisa' or 'meezan'
    const [transactionId, setTransactionId] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [copiedField, setCopiedField] = useState('');

    // Generate reference code on load
    useEffect(() => {
        const randomCode = Math.floor(100000 + Math.random() * 900000);
        setReferenceNumber(`DS-${randomCode}`);
    }, []);

    // Fetch premium status
    const fetchStatus = async () => {
        try {
            const res = await API.get('/premium/status');
            setSubStatus(res.data);
        } catch (err) {
            console.error('Failed to fetch premium status', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 20000); // Polling for approval updates
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(''), 2000);
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!transactionId || transactionId.trim().length < 4) {
            setErrorMsg('Please enter a valid Transaction ID / Trx ID from your payment SMS/receipt.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await API.post('/premium/purchase', {
                plan_type: selectedPlan,
                payment_method: paymentMethod,
                transaction_id: transactionId.trim(),
                reference_number: referenceNumber,
            });
            await fetchStatus();
        } catch (err) {
            setErrorMsg(err.response?.data?.detail || 'Failed to submit payment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // WhatsApp & Email support links
    const supportPhone = "923001234567"; // Replace with your admin contact
    const currentRef = subStatus?.payment_id ? subStatus.payment_id : referenceNumber;
    const planName = selectedPlan === 'one_time' ? 'Lifetime Access (PKR 999)' : 'Monthly Pro (PKR 2,499)';
    const amountVal = selectedPlan === 'one_time' ? '999' : '2499';
    
    const waMessage = encodeURIComponent(
        `Hi DeepSense Team!\nI have made payment for Premium Membership.\n\n👤 Name: ${user.full_name || 'User'}\n📧 Email: ${user.email || ''}\n💳 Plan: ${planName}\n💰 Amount: PKR ${amountVal}\n🔖 Reference: ${currentRef}\n🔢 Transaction ID: ${transactionId || (subStatus?.payment_id || '')}\n\nHere is my payment screenshot:`
    );
    const waLink = `https://wa.me/${supportPhone}?text=${waMessage}`;

    const mailtoLink = `mailto:deepsense.dental@gmail.com?subject=${encodeURIComponent(`DeepSense Payment Proof - ${currentRef}`)}&body=${waMessage}`;

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark ? '#060B14' : '#F0F4F8',
            color: isDark ? '#E2E8F0' : '#0F172A',
            fontFamily: "'Inter', sans-serif",
            paddingBottom: 80,
        }}>
            <Navbar />

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 40px' }}>
                
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: 40 }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)',
                        borderRadius: 30, padding: '6px 18px', marginBottom: 16,
                        color: '#14B8A6', fontSize: 13, fontWeight: 700
                    }}>
                        <span>👑</span> DEEPSENSE PREMIUM
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: 0,
                        background: isDark 
                            ? 'linear-gradient(135deg, #FFFFFF 0%, #14B8A6 100%)'
                            : 'linear-gradient(135deg, #0F172A 0%, #0D9488 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Elevate Your Dental Diagnostics with AI
                    </h1>
                    <p style={{
                        color: isDark ? '#94A3B8' : '#64748B', fontSize: 16,
                        maxWidth: 620, margin: '14px auto 0', lineHeight: 1.6
                    }}>
                        Enjoy unlimited AI X-ray pathology detections, clinical insights, smart chat assistant, and priority telehealth consultations.
                    </p>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#14B8A6' }}>
                        <div style={{ fontSize: 32 }}>⚡</div>
                        <p style={{ marginTop: 12 }}>Checking subscription status...</p>
                    </div>
                )}

                {/* ACTIVE PREMIUM STATE */}
                {!loading && subStatus?.is_premium && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: isDark ? 'rgba(15,25,40,0.9)' : '#FFFFFF',
                            border: '2px solid #10B981',
                            borderRadius: 24, padding: '40px 32px',
                            textAlign: 'center', maxWidth: 650, margin: '0 auto',
                            boxShadow: '0 20px 50px rgba(16,185,129,0.15)'
                        }}
                    >
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'rgba(16,185,129,0.15)', color: '#10B981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 36, margin: '0 auto 20px'
                        }}>✨</div>
                        
                        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#10B981' }}>
                            You are a Premium Member!
                        </h2>
                        <p style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 15, margin: '0 0 24px' }}>
                            Your account has full access to all DeepSense AI features and priority services.
                        </p>

                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: 16, background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                            padding: 20, borderRadius: 16, textAlign: 'left', marginBottom: 24,
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0'
                        }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Plan Type</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#14B8A6', marginTop: 4 }}>
                                    {subStatus.plan_type === 'monthly' ? 'Monthly Pro' : 'Lifetime Access'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Valid Until</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#fff' : '#0F172A', marginTop: 4 }}>
                                    {subStatus.expires_at ? new Date(subStatus.expires_at).toLocaleDateString() : 'Lifetime Access'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                                    Active ✅
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="/analysis" style={{
                                textDecoration: 'none', background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14
                            }}>
                                ◈ Start AI Analysis
                            </a>
                            <a href="/chat" style={{
                                textDecoration: 'none', background: 'rgba(124,58,237,0.15)',
                                border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA',
                                padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14
                            }}>
                                🤖 AI Clinical Assistant
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* PENDING VERIFICATION STATE */}
                {!loading && !subStatus?.is_premium && subStatus?.status === 'pending' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: isDark ? 'rgba(15,25,40,0.9)' : '#FFFFFF',
                            border: '2px solid #F59E0B',
                            borderRadius: 24, padding: '40px 32px',
                            textAlign: 'center', maxWidth: 700, margin: '0 auto',
                            boxShadow: '0 20px 50px rgba(245,158,11,0.15)'
                        }}
                    >
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 36, margin: '0 auto 20px'
                        }}>⏳</div>

                        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#F59E0B' }}>
                            Payment Verification in Progress
                        </h2>
                        <p style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
                            We received your payment details. Our administration team is cross-checking the bank record. Verification usually takes <strong>15–30 minutes</strong>.
                        </p>

                        <div style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                            borderRadius: 16, padding: '20px 24px', textAlign: 'left', marginBottom: 28
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#64748B', fontSize: 13 }}>Plan Requested:</span>
                                <span style={{ fontWeight: 700, color: '#14B8A6' }}>
                                    {subStatus.plan_type === 'monthly' ? 'Monthly Pro (PKR 2,499)' : 'Lifetime Access (PKR 999)'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#64748B', fontSize: 13 }}>Payment Method:</span>
                                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{subStatus.payment_method || 'EasyPaisa'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ color: '#64748B', fontSize: 13 }}>Reference / TID:</span>
                                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#fff' : '#0F172A', fontSize: 14 }}>
                                    {subStatus.payment_id || 'Pending'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748B', fontSize: 13 }}>Status:</span>
                                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 13 }}>
                                    ● Awaiting Admin Approval
                                </span>
                            </div>
                        </div>

                        {/* Fast Track Verification Action Buttons */}
                        <div style={{
                            background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)',
                            borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'left'
                        }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#14B8A6', marginBottom: 6 }}>
                                ⚡ Want instant approval?
                            </div>
                            <p style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>
                                Send your payment receipt/screenshot directly via WhatsApp or Email. We'll approve your account in minutes!
                            </p>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        background: '#25D366', color: '#fff', textDecoration: 'none',
                                        padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700
                                    }}
                                >
                                    <span>💬</span> Send Screenshot on WhatsApp
                                </a>
                                <a
                                    href={mailtoLink}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                                        color: isDark ? '#E2E8F0' : '#1E293B', textDecoration: 'none',
                                        padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1'
                                    }}
                                >
                                    <span>✉️</span> Email Receipt
                                </a>
                            </div>
                        </div>

                        <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                            This page updates automatically once approved. No need to refresh.
                        </p>
                    </motion.div>
                )}

                {/* PLANS SELECTION & PAYMENT FORM (WHEN NOT PREMIUM & NOT PENDING) */}
                {!loading && (!subStatus || (!subStatus.is_premium && subStatus.status !== 'pending')) && (
                    <div>
                        {/* Two Pricing Cards */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: 24, marginBottom: 48
                        }}>
                            {/* Card 1: Lifetime Access */}
                            <motion.div
                                whileHover={{ y: -6 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedPlan('one_time')}
                                style={{
                                    background: isDark ? 'rgba(15,25,45,0.85)' : '#FFFFFF',
                                    border: selectedPlan === 'one_time' ? '2px solid #14B8A6' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'),
                                    borderRadius: 24, padding: 32, cursor: 'pointer', position: 'relative',
                                    boxShadow: selectedPlan === 'one_time' ? '0 12px 40px rgba(13,148,136,0.2)' : 'none',
                                    transition: 'border 0.2s, box-shadow 0.2s'
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: 20, right: 20,
                                    background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                    color: '#fff', fontSize: 11, fontWeight: 800,
                                    padding: '4px 12px', borderRadius: 20, letterSpacing: 0.5
                                }}>
                                    MOST POPULAR
                                </div>

                                <div style={{ fontSize: 28, marginBottom: 12 }}>💎</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Lifetime Access</h3>
                                <p style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13, margin: '0 0 20px' }}>
                                    One-time payment, unlimited lifetime access with no renewals.
                                </p>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                                    <span style={{ fontSize: 36, fontWeight: 900, color: '#14B8A6' }}>PKR 999</span>
                                    <span style={{ fontSize: 13, color: '#64748B' }}>/ lifetime</span>
                                </div>

                                <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', marginBottom: 20 }} />

                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> Unlimited AI X-Ray Analysis
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> YOLOv8 + CNN Pathology Detection
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> Claude AI Clinical Assistant
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> PDF Clinical Reports Export
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> Lifetime Feature Updates
                                    </li>
                                </ul>

                                <button
                                    type="button"
                                    style={{
                                        width: '100%', padding: '12px 0', borderRadius: 12,
                                        background: selectedPlan === 'one_time' ? 'linear-gradient(135deg, #0D9488, #0891B2)' : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                                        color: selectedPlan === 'one_time' ? '#fff' : (isDark ? '#E2E8F0' : '#475569'),
                                        border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    }}
                                >
                                    {selectedPlan === 'one_time' ? '● Selected Plan' : 'Select Plan'}
                                </button>
                            </motion.div>

                            {/* Card 2: Monthly Pro */}
                            <motion.div
                                whileHover={{ y: -6 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedPlan('monthly')}
                                style={{
                                    background: isDark ? 'rgba(15,25,45,0.85)' : '#FFFFFF',
                                    border: selectedPlan === 'monthly' ? '2px solid #7C3AED' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'),
                                    borderRadius: 24, padding: 32, cursor: 'pointer', position: 'relative',
                                    boxShadow: selectedPlan === 'monthly' ? '0 12px 40px rgba(124,58,237,0.2)' : 'none',
                                    transition: 'border 0.2s, box-shadow 0.2s'
                                }}
                            >
                                <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Monthly Pro</h3>
                                <p style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13, margin: '0 0 20px' }}>
                                    Comprehensive clinical plan with 30 days recurring validity.
                                </p>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                                    <span style={{ fontSize: 36, fontWeight: 900, color: '#A78BFA' }}>PKR 2,499</span>
                                    <span style={{ fontSize: 13, color: '#64748B' }}>/ 30 days</span>
                                </div>

                                <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', marginBottom: 20 }} />

                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> Everything in Lifetime Plan
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> High-Resolution Deep CNN Insights
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> Tele-Health Priority Room Access
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> Dedicated 24/7 Support Channel
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#10B981' }}>✓</span> Multi-Patient Clinical Archives
                                    </li>
                                </ul>

                                <button
                                    type="button"
                                    style={{
                                        width: '100%', padding: '12px 0', borderRadius: 12,
                                        background: selectedPlan === 'monthly' ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                                        color: selectedPlan === 'monthly' ? '#fff' : (isDark ? '#E2E8F0' : '#475569'),
                                        border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    }}
                                >
                                    {selectedPlan === 'monthly' ? '● Selected Plan' : 'Select Plan'}
                                </button>
                            </motion.div>
                        </div>

                        {/* STEP 2: PAYMENT DETAILS & SUBMISSION FORM */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: isDark ? 'rgba(15,25,45,0.9)' : '#FFFFFF',
                                border: isDark ? '1px solid rgba(13,148,136,0.25)' : '1px solid #CBD5E1',
                                borderRadius: 24, padding: '36px 32px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'rgba(13,148,136,0.15)', color: '#14B8A6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 16
                                }}>2</div>
                                <div>
                                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Payment Instructions</h3>
                                    <p style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13, margin: '2px 0 0' }}>
                                        Transfer <strong>PKR {selectedPlan === 'one_time' ? '999' : '2,499'}</strong> using EasyPaisa or Meezan Bank.
                                    </p>
                                </div>
                            </div>

                            {/* Reference Number Box */}
                            <div style={{
                                background: 'rgba(13,148,136,0.08)',
                                border: '1px dashed #14B8A6',
                                borderRadius: 16, padding: '16px 20px', marginBottom: 24,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                            }}>
                                <div>
                                    <div style={{ fontSize: 11, color: '#14B8A6', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>
                                        Your Unique Payment Reference
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', color: isDark ? '#fff' : '#0F172A', marginTop: 4 }}>
                                        {referenceNumber}
                                    </div>
                                    <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                                        💡 Please mention this reference code in the transfer remark/message.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(referenceNumber, 'ref')}
                                    style={{
                                        background: copiedField === 'ref' ? '#10B981' : 'rgba(13,148,136,0.2)',
                                        border: '1px solid rgba(13,148,136,0.3)', color: copiedField === 'ref' ? '#fff' : '#14B8A6',
                                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    {copiedField === 'ref' ? '✓ Copied' : '📋 Copy Reference'}
                                </button>
                            </div>

                            {/* Payment Method Switcher */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>
                                    Select Transfer Method
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div
                                        onClick={() => setPaymentMethod('easypaisa')}
                                        style={{
                                            border: paymentMethod === 'easypaisa' ? '2px solid #10B981' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'),
                                            background: paymentMethod === 'easypaisa' ? (isDark ? 'rgba(16,185,129,0.08)' : '#F0FDF4') : 'transparent',
                                            padding: '16px 20px', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12
                                        }}
                                    >
                                        <div style={{ fontSize: 24 }}>🟢</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#fff' : '#0F172A' }}>EasyPaisa Account</div>
                                            <div style={{ fontSize: 12, color: '#64748B' }}>Instant mobile wallet transfer</div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setPaymentMethod('meezan')}
                                        style={{
                                            border: paymentMethod === 'meezan' ? '2px solid #0D9488' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'),
                                            background: paymentMethod === 'meezan' ? (isDark ? 'rgba(13,148,136,0.08)' : '#F0FDFA') : 'transparent',
                                            padding: '16px 20px', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12
                                        }}
                                    >
                                        <div style={{ fontSize: 24 }}>🏦</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#fff' : '#0F172A' }}>Meezan Bank</div>
                                            <div style={{ fontSize: 12, color: '#64748B' }}>Online Bank Transfer / Raast / IBAN</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Details Box */}
                            <div style={{
                                background: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                                borderRadius: 16, padding: 20, marginBottom: 28
                            }}>
                                {paymentMethod === 'easypaisa' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#64748B', fontSize: 13 }}>Account Title:</span>
                                            <strong style={{ color: isDark ? '#fff' : '#0F172A' }}>DeepSense Dental AI</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#64748B', fontSize: 13 }}>EasyPaisa Number:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <strong style={{ color: '#10B981', fontFamily: 'monospace', fontSize: 15 }}>0300-1234567</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard('03001234567', 'ep')}
                                                    style={{ background: 'none', border: 'none', color: '#14B8A6', cursor: 'pointer', fontSize: 12 }}
                                                >
                                                    {copiedField === 'ep' ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#64748B', fontSize: 13 }}>Amount to send:</span>
                                            <strong style={{ color: '#10B981', fontSize: 16 }}>PKR {selectedPlan === 'one_time' ? '999' : '2,499'}</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#64748B', fontSize: 13 }}>Bank Name:</span>
                                            <strong style={{ color: isDark ? '#fff' : '#0F172A' }}>Meezan Bank Ltd</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#64748B', fontSize: 13 }}>Account Title:</span>
                                            <strong style={{ color: isDark ? '#fff' : '#0F172A' }}>DeepSense AI</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#64748B', fontSize: 13 }}>Account / IBAN:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <strong style={{ color: '#14B8A6', fontFamily: 'monospace', fontSize: 13 }}>PK12MEZN0001234567890123</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard('PK12MEZN0001234567890123', 'iban')}
                                                    style={{ background: 'none', border: 'none', color: '#14B8A6', cursor: 'pointer', fontSize: 12 }}
                                                >
                                                    {copiedField === 'iban' ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#64748B', fontSize: 13 }}>Amount to send:</span>
                                            <strong style={{ color: '#14B8A6', fontSize: 16 }}>PKR {selectedPlan === 'one_time' ? '999' : '2,499'}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Verification Form */}
                            <form onSubmit={handlePurchase}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                                        Enter Transaction ID (TID / Trx ID) *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 9876543210 (received from EasyPaisa SMS / Bank receipt)"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', padding: '14px 16px',
                                            background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
                                            borderRadius: 12, color: isDark ? '#fff' : '#0F172A',
                                            fontSize: 14, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                                        You get this unique number in the confirmation SMS or receipt immediately after sending the money.
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {errorMsg && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                                color: '#F87171', padding: '10px 16px', borderRadius: 10,
                                                fontSize: 13, marginBottom: 20
                                            }}
                                        >
                                            ⚠️ {errorMsg}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <motion.button
                                        type="submit"
                                        disabled={submitting}
                                        whileHover={!submitting ? { scale: 1.01 } : {}}
                                        whileTap={!submitting ? { scale: 0.99 } : {}}
                                        style={{
                                            flex: 1, minWidth: 240, padding: '15px 0',
                                            background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                            color: '#fff', border: 'none', borderRadius: 12,
                                            fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 8px 24px rgba(13,148,136,0.3)'
                                        }}
                                    >
                                        {submitting ? 'Submitting Details...' : '✓ Submit Payment for Verification'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}

