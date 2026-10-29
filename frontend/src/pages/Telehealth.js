import React, { useState, useCallback, useRef, useEffect } from 'react';
import Particles from 'react-particles';
import { loadSlim } from 'tsparticles-slim';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import AnimatedBG from '../components/AnimatedBG';
import { PolicyModal, PolicyButton } from '../components/PoliciesModal';
import API from '../api/axios';

const dark = {
    card: { background: 'rgba(15,25,45,0.8)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(13,148,136,0.15)', padding: 28 },
    btn: { background: 'linear-gradient(135deg, #0D9488, #0891B2)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' },
    btnOutline: { background: 'transparent', color: '#0D9488', border: '1.5px solid rgba(13,148,136,0.4)', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' },
    btnDanger: { background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' },
    input: { width: '100%', padding: 14, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 15, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: '#E2E8F0', outline: 'none', fontFamily: 'inherit' },
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, background: type === 'error' ? '#EF4444' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: 14 }}>
            {message}
        </motion.div>
    );
};

// ─── Premium Paywall Component ───────────────────────────
const PremiumPaywall = ({ onPurchaseSuccess, onOpenPolicies }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState('select'); // select, payment, processing, success
    const [paymentMethod, setPaymentMethod] = useState(null); // 'meezan' or 'easypaisa'
    const [transactionId, setTransactionId] = useState('');
    const [copiedField, setCopiedField] = useState(null);
    const [cardExpiry, setCardExpiry] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const plans = [
        {
            id: 'one_time',
            name: 'One-Time Access',
            price: 999,
            priceLabel: 'PKR 999',
            desc: 'Lifetime telehealth access',
            features: ['Unlimited video calls', 'Unlimited audio calls', 'Screen sharing', 'HD quality', '1-Hour 100% money-back guarantee'],
            badge: 'BEST VALUE',
            badgeColor: '#10B981',
            icon: '💎',
        },
        {
            id: 'monthly',
            name: 'Monthly Plan',
            price: 2499,
            priceLabel: 'PKR 2,499',
            desc: 'Per month, cancel anytime',
            features: ['Unlimited video calls', 'Unlimited audio calls', 'Screen sharing', 'HD quality', '48-Hour full refund guarantee'],
            badge: 'POPULAR',
            badgeColor: '#F59E0B',
            icon: '⭐',
        },
    ];

    const paymentMethods = [
        {
            id: 'card',
            name: 'Credit / Debit Card',
            icon: '💳',
            color: '#6366F1',
            details: {
                bankName: 'Stripe Secure Checkout',
                label: 'Simulated Gateway',
            },
        },
    ];

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleConfirmPayment = async () => {
        setStep('otp');
    };

    const handleVerifyOTPAndPurchase = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length < 4) {
            alert('Please enter a valid 4-digit PIN');
            return;
        }

        setStep('processing');
        setProcessing(true);

        await new Promise(r => setTimeout(r, 2500));

        try {
            // Use the original /premium/purchase endpoint
            const res = await API.post('/premium/purchase', {
                plan_type: selectedPlan,
                payment_method: 'card',
                transaction_id: 'txn_simulated_' + Math.random().toString(36).substr(2, 9),
            });
            setStep('success');
            setTimeout(() => {
                onPurchaseSuccess(res.data);
            }, 2000);
        } catch (err) {
            setStep('payment');
            setProcessing(false);
            alert(err.response?.data?.detail || 'Failed to verify payment. Please try again.');
        }
    };

    // ── OTP Verification Step ──
    if (step === 'otp') {
        return (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
                <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Enter Verification PIN</h2>
                <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 32 }}>
                    A 4-digit PIN has been sent to your registered mobile number to verify this transaction.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                                const newOtp = [...otp];
                                newOtp[index] = e.target.value.replace(/\D/g, '');
                                setOtp(newOtp);
                                if (e.target.value && index < 3) {
                                    document.getElementById(`otp-${index + 1}`).focus();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                    document.getElementById(`otp-${index - 1}`).focus();
                                }
                            }}
                            style={{
                                width: 56, height: 64,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(13,148,136,0.3)',
                                borderRadius: 12,
                                color: '#fff', fontSize: 24, fontWeight: 700,
                                textAlign: 'center', outline: 'none'
                            }}
                        />
                    ))}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyOTPAndPurchase}
                    disabled={otp.join('').length < 4}
                    style={{
                        ...dark.btn, width: '100%',
                        padding: '16px 0', fontSize: 16,
                        opacity: otp.join('').length === 4 ? 1 : 0.5,
                        boxShadow: otp.join('').length === 4 ? '0 8px 32px rgba(13,148,136,0.3)' : 'none',
                    }}
                >
                    Verify & Pay
                </motion.button>
            </motion.div>
        );
    }

    // ── Processing Animation ──
    if (step === 'processing') {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '80px 40px' }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    style={{
                        width: 64, height: 64, borderRadius: '50%',
                        border: '3px solid rgba(13,148,136,0.2)',
                        borderTop: '3px solid #0D9488',
                        margin: '0 auto 24px',
                    }}
                />
                <h2 style={{ color: '#fff', fontSize: 22, marginBottom: 8 }}>Verifying Payment...</h2>
                <p style={{ color: '#64748B', fontSize: 14 }}>Please wait while we confirm your transaction</p>
                <motion.div
                    animate={{ width: ['0%', '70%', '90%', '100%'] }}
                    transition={{ duration: 2.5, ease: 'easeInOut' }}
                    style={{
                        height: 4, borderRadius: 4,
                        background: 'linear-gradient(90deg, #0D9488, #0891B2)',
                        marginTop: 32, maxWidth: 300, margin: '32px auto 0',
                    }}
                />
            </motion.div>
        );
    }

    // ── Success Animation ──
    if (step === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '80px 40px' }}
            >
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', fontSize: 36,
                    }}
                >✓</motion.div>
                <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 8 }}>Premium Activated! 🎉</h2>
                <p style={{ color: '#94A3B8', fontSize: 14 }}>You now have full access to DeepSense Telehealth</p>
            </motion.div>
        );
    }

    // ── Payment Details Step ──
    if (step === 'payment') {
        const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
        const selectedPlanObj = plans.find(p => p.id === selectedPlan);

        return (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 560, margin: '0 auto' }}>
                {/* Back button */}
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setStep('select'); setPaymentMethod(null); setTransactionId(''); }}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
                >← Back to Plans</motion.button>

                {/* Payment Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Complete Payment</h2>
                    <p style={{ color: '#64748B', fontSize: 14 }}>
                        {selectedPlanObj?.name} — <span style={{ color: '#14B8A6', fontWeight: 700 }}>{selectedPlanObj?.priceLabel}</span>
                    </p>
                </div>

                {/* Choose Payment Method */}
                {!paymentMethod ? (
                    <div>
                        <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
                            Select Payment Method
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {paymentMethods.map((method) => (
                                <motion.div
                                    key={method.id}
                                    whileHover={{ scale: 1.03, y: -3 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setPaymentMethod(method.id)}
                                    style={{
                                        background: 'rgba(15,25,45,0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 16, padding: 28, cursor: 'pointer',
                                        textAlign: 'center', transition: 'all 0.3s ease',
                                    }}
                                >
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 16,
                                        background: `${method.color}15`, border: `1px solid ${method.color}30`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px', fontSize: 28,
                                    }}>{method.icon}</div>
                                    <div style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 15 }}>{method.name}</div>
                                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>
                                        {method.id === 'meezan' ? 'Bank Transfer' : 'Mobile Wallet'}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Selected method header with clear label */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 20,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 22 }}>{selectedMethod.icon}</span>
                                <div>
                                    <span style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 16 }}>
                                        Secure Card Checkout
                                    </span>
                                    <div style={{ color: '#64748B', fontSize: 11 }}>
                                        Enter your details to upgrade instantly
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setPaymentMethod(null)}
                                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13 }}
                            >Change ↗</motion.button>
                        </div>

                        {/* Amount to Pay */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(13,148,136,0.1), rgba(8,145,178,0.1))',
                            border: '1px solid rgba(13,148,136,0.25)',
                            borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center',
                        }}>
                            <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Amount to Pay</div>
                            <div style={{
                                fontSize: 36, fontWeight: 800,
                                background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>{selectedPlanObj?.priceLabel}</div>
                        </div>

                        <div style={{ marginTop: 32 }}>
                        {paymentMethod === 'card' ? (
                            <div style={{
                                background: 'rgba(15,25,45,0.9)', border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: 16, padding: 24,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <div style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 700 }}>Card Details</div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <div style={{ width: 32, height: 20, background: '#1E293B', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>VISA</div>
                                        <div style={{ width: 32, height: 20, background: '#1E293B', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>MC</div>
                                    </div>
                                </div>
                                <input style={{ ...dark.input, fontSize: 15, padding: 14, letterSpacing: 2, marginBottom: 16 }} placeholder="Card Number (e.g., 4242 4242 4242 4242)" maxLength={19} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <input 
                                        style={{ ...dark.input, fontSize: 15, padding: 14, letterSpacing: 1, marginBottom: 0 }} 
                                        placeholder="MM / YY" 
                                        maxLength={7} 
                                        value={cardExpiry}
                                        onChange={e => {
                                            let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                            if (val.length >= 2) {
                                                val = val.substring(0, 2) + ' / ' + val.substring(2, 4);
                                            }
                                            setCardExpiry(val);
                                        }}
                                    />
                                    <input style={{ ...dark.input, fontSize: 15, padding: 14, letterSpacing: 1, marginBottom: 0 }} placeholder="CVC" maxLength={4} type="password" />
                                </div>
                                <input style={{ ...dark.input, fontSize: 15, padding: 14, marginBottom: 24 }} placeholder="Cardholder Name" />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748B', fontSize: 11, marginBottom: 20 }}>
                                    <span>🔒</span> Secured by Stripe (Simulated Mode)
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, marginBottom: 20 }}>
                            {/* QR Code */}
                            <div style={{
                                background: '#fff', borderRadius: 12, padding: 10,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                                        paymentMethod === 'meezan' 
                                            ? `03230112679301`
                                            : `03095367405`
                                    )}`}
                                    alt="Payment QR Code"
                                    style={{ width: 120, height: 120, borderRadius: 4 }}
                                />
                                <div style={{ color: '#333', fontSize: 9, marginTop: 6, fontWeight: 600 }}>Scan to copy {paymentMethod === 'meezan' ? 'Account No' : 'Number'}</div>
                            </div>

                            {/* Bank/Account Details Card */}
                            <div style={{
                                background: 'rgba(15,25,45,0.9)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 14, padding: 18,
                            }}>
                                <div style={{ color: '#64748B', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                                    {paymentMethod === 'meezan' ? '🏦 MEEZAN BANK DETAILS' : '📱 EASYPAISA DETAILS'}
                                </div>

                                {/* Account Title */}
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ color: '#64748B', fontSize: 10, marginBottom: 2 }}>Account Title</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 700 }}>
                                            {selectedMethod.details.accountTitle}
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            onClick={() => copyToClipboard(selectedMethod.details.accountTitle, 'title')}
                                            style={{
                                                background: copiedField === 'title' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                                                border: 'none', color: copiedField === 'title' ? '#10B981' : '#94A3B8',
                                                cursor: 'pointer', fontSize: 11, padding: '4px 8px', borderRadius: 6,
                                                fontWeight: 600, transition: 'all 0.2s',
                                            }}
                                        >{copiedField === 'title' ? '✓' : '📋'}</motion.button>
                                    </div>
                                </div>

                                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 0 10px' }} />

                                {/* Account/IBAN Number */}
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ color: '#64748B', fontSize: 10, marginBottom: 2 }}>{selectedMethod.details.label}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{
                                            color: '#14B8A6', fontSize: 15, fontWeight: 800,
                                            fontFamily: 'monospace', letterSpacing: 1,
                                        }}>
                                            {selectedMethod.details.accountNumber}
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            onClick={() => copyToClipboard(selectedMethod.details.accountNumber, 'number')}
                                            style={{
                                                background: copiedField === 'number' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                                                border: 'none', color: copiedField === 'number' ? '#10B981' : '#94A3B8',
                                                cursor: 'pointer', fontSize: 11, padding: '4px 8px', borderRadius: 6,
                                                fontWeight: 600, transition: 'all 0.2s',
                                            }}
                                        >{copiedField === 'number' ? '✓' : '📋'}</motion.button>
                                    </div>
                                </div>

                                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 0 10px' }} />

                                <div>
                                    <div style={{ color: '#64748B', fontSize: 10, marginBottom: 2 }}>Bank / Service</div>
                                    <div style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>
                                        {selectedMethod.details.bankName}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                        </div>

                        {/* Instructions */}
                        {paymentMethod !== 'card' && (
                        <div style={{
                            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                            borderRadius: 12, padding: 16, marginBottom: 20,
                        }}>
                            <div style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📋 How to Pay</div>
                            <div style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.8 }}>
                                1. Open your <strong style={{ color: '#14B8A6' }}>{paymentMethod === 'meezan' ? 'Meezan Bank app' : 'EasyPaisa app'}</strong><br />
                                2. {paymentMethod === 'meezan' ? 'Transfer' : 'Send money'} <strong style={{ color: '#14B8A6' }}>{selectedPlanObj?.priceLabel}</strong> to the account above<br />
                                3. After payment, either:<br />
                                <span style={{ paddingLeft: 16, display: 'inline-block' }}>• Type the <strong>Transaction ID</strong> below, OR</span><br />
                                <span style={{ paddingLeft: 16, display: 'inline-block' }}>• Upload a <strong>screenshot</strong> of the payment confirmation</span>
                            </div>
                        </div>
                        )}

                        {/* Transaction Verification - Two Options */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                                {paymentMethod === 'card' ? 'Verify Payment' : 'Verify Your Payment (either option works)'}
                            </label>

                            {/* Option 1: Transaction ID */}
                            <div style={{
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12, padding: 16, marginBottom: 12,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span style={{ fontSize: 14 }}>⌨️</span>
                                    <span style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{paymentMethod === 'card' ? 'Payment Reference' : 'Option 1: Enter Transaction ID'}</span>
                                </div>
                                <input
                                    style={{
                                        ...dark.input,
                                        fontSize: 15, padding: 14, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 0,
                                        border: transactionId ? '1px solid rgba(13,148,136,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                    }}
                                    placeholder={paymentMethod === 'card' ? "Reference ID (if provided)..." : "Paste your transaction ID here..."}
                                    value={transactionId}
                                    onChange={e => setTransactionId(e.target.value)}
                                />
                            </div>

                            {paymentMethod !== 'card' && (
                                <>
                                    {/* Divider - OR */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                                        <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>OR</span>
                                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                                    </div>

                                    {/* Option 2: Screenshot Upload */}
                                    <div style={{
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 12, padding: 16,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                            <span style={{ fontSize: 14 }}>📸</span>
                                            <span style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>Option 2: Upload Payment Screenshot</span>
                                        </div>
                                        <label style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            padding: 16, borderRadius: 10, cursor: 'pointer',
                                            border: '2px dashed rgba(13,148,136,0.3)',
                                            background: 'rgba(13,148,136,0.04)',
                                            transition: 'all 0.2s',
                                            color: '#94A3B8', fontSize: 13,
                                        }}>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                style={{ display: 'none' }}
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        if (!transactionId) {
                                                            setTransactionId(`SS-${file.name.replace(/\.[^/.]+$/, '').substring(0,20)}-${Date.now().toString(36)}`);
                                                        }
                                                        setCopiedField('screenshot');
                                                        setTimeout(() => setCopiedField(null), 3000);
                                                    }
                                                }}
                                            />
                                            {copiedField === 'screenshot' ? (
                                                <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Screenshot uploaded!</span>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: 20 }}>📤</span>
                                                    <span>Click to upload screenshot</span>
                                                </>
                                            )}
                                        </label>
                                        <div style={{ color: '#475569', fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                                            PNG, JPG up to 5MB
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Confirm Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleConfirmPayment}
                            disabled={!transactionId.trim() || processing}
                            style={{
                                ...dark.btn, width: '100%',
                                padding: '16px 0', fontSize: 16,
                                opacity: transactionId.trim() ? 1 : 0.5,
                                boxShadow: transactionId.trim() ? '0 8px 32px rgba(13,148,136,0.3)' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            ✓ Confirm Payment — {selectedPlanObj?.priceLabel}
                        </motion.button>

                        <p style={{ color: '#475569', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
                            🔒 Your payment will be verified and premium will be activated instantly
                        </p>

                        {onOpenPolicies && (
                            <div style={{ marginTop: 14, textAlign: 'center' }}>
                                <PolicyButton onClick={onOpenPolicies} label="📜 View Refund & Money-Back Policy" style={{ fontSize: 12, padding: '6px 14px' }} />
                            </div>
                        )}
                    </motion.div>
                )}
            </motion.div>
        );
    }

    // ── Plan Selection (Step 1) ──
    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            {/* Lock Icon & Title */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    style={{
                        width: 80, height: 80, borderRadius: 20,
                        background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(8,145,178,0.15))',
                        border: '1px solid rgba(13,148,136,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', fontSize: 36,
                    }}
                >🔒</motion.div>
                <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                    Upgrade to <span style={{ background: 'linear-gradient(135deg, #0D9488, #0891B2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Premium</span>
                </h2>
                <p style={{ color: '#64748B', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>
                    Unlock HD video & audio consultations with your dentist. Secure, private, and professional.
                </p>
            </div>

            {/* Pricing Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 620, margin: '0 auto 32px' }}>
                {plans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPlan(plan.id)}
                        style={{
                            background: selectedPlan === plan.id
                                ? 'linear-gradient(135deg, rgba(13,148,136,0.12), rgba(8,145,178,0.12))'
                                : 'rgba(15,25,45,0.8)',
                            border: selectedPlan === plan.id
                                ? '2px solid #0D9488'
                                : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16, padding: 28, cursor: 'pointer',
                            position: 'relative', overflow: 'hidden',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {/* Badge */}
                        <div style={{
                            position: 'absolute', top: 12, right: 12,
                            background: `${plan.badgeColor}22`, color: plan.badgeColor,
                            fontSize: 10, fontWeight: 800, padding: '4px 10px',
                            borderRadius: 20, letterSpacing: 1,
                        }}>{plan.badge}</div>

                        {/* Icon */}
                        <div style={{ fontSize: 32, marginBottom: 16 }}>{plan.icon}</div>

                        {/* Plan Name */}
                        <div style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                            {plan.name}
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: 12 }}>
                            <span style={{
                                fontSize: 32, fontWeight: 800,
                                background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>{plan.priceLabel}</span>
                            {plan.id === 'monthly' && (
                                <span style={{ color: '#64748B', fontSize: 13, marginLeft: 4 }}>/month</span>
                            )}
                        </div>

                        <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 16 }}>{plan.desc}</div>

                        {/* Features */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {plan.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#CBD5E1' }}>
                                    <span style={{ color: '#10B981', fontSize: 12 }}>✓</span> {f}
                                </div>
                            ))}
                        </div>

                        {/* Selection indicator */}
                        {selectedPlan === plan.id && (
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute', top: 12, left: 12,
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 14, fontWeight: 700,
                                }}>✓</motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Payment Methods Preview */}
            <div style={{ maxWidth: 620, margin: '0 auto 24px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
                    padding: '16px 0',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12 }}>
                        <span>💳</span> Secure Card Payment Supported
                    </div>
                </div>
            </div>

            {/* Continue Button */}
            <div style={{ textAlign: 'center' }}>
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setStep('payment'); setPaymentMethod('card'); }}
                    disabled={!selectedPlan}
                    style={{
                        ...dark.btn,
                        padding: '16px 48px', fontSize: 16,
                        opacity: selectedPlan ? 1 : 0.5,
                        boxShadow: selectedPlan ? '0 8px 32px rgba(13,148,136,0.3)' : 'none',
                        transition: 'all 0.3s ease',
                    }}
                >
                    {selectedPlan ? `Continue — PKR ${selectedPlan === 'one_time' ? '999' : '2,499'}` : 'Select a Plan'}
                </motion.button>
                <p style={{ color: '#475569', fontSize: 12, marginTop: 12 }}>
                    🔒 Secure payment · Instant activation
                </p>
                {onOpenPolicies && (
                    <div style={{ marginTop: 16 }}>
                        <PolicyButton onClick={onOpenPolicies} label="📜 View Refund & Money-Back Policy" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ─── Call Ended Summary Component ─────────────────────────
const CallEndedSummary = ({ callDuration, roomName, onReturn }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
                height: '100vh', background: '#060B14',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                style={{
                    textAlign: 'center', maxWidth: 480, padding: 48,
                    background: 'rgba(15,25,45,0.9)', backdropFilter: 'blur(20px)',
                    borderRadius: 24, border: '1px solid rgba(13,148,136,0.15)',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                }}
            >
                {/* Checkmark animation */}
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', fontSize: 36, color: '#fff',
                    }}
                >✓</motion.div>

                <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                    Consultation Ended
                </h2>
                <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 32 }}>
                    Your telehealth session has been completed successfully
                </p>

                {/* Call Info */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32,
                }}>
                    <div style={{
                        background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.15)',
                        borderRadius: 12, padding: 16,
                    }}>
                        <div style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>DURATION</div>
                        <div style={{ color: '#14B8A6', fontSize: 20, fontWeight: 700 }}>{callDuration}</div>
                    </div>
                    <div style={{
                        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                        borderRadius: 12, padding: 16,
                    }}>
                        <div style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>SESSION</div>
                        <div style={{ color: '#60A5FA', fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>
                            {roomName || 'Completed'}
                        </div>
                    </div>
                </div>

                {/* Security badge */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 10, padding: '10px 20px', marginBottom: 32,
                }}>
                    <span style={{ fontSize: 14 }}>🔒</span>
                    <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                        End-to-end encrypted · HIPAA compliant
                    </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={onReturn}
                        style={{ ...dark.btn, padding: '14px 32px', fontSize: 15 }}
                    >
                        🏠 Return to Dashboard
                    </motion.button>
                </div>

                {/* DeepSense branding */}
                <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🦷</span>
                    <span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>DeepSense AI · Dental Intelligence Platform</span>
                </div>
            </motion.div>
        </motion.div>
    );
};


export default function Telehealth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isDentist = user.role === 'admin';

    const [policyOpen, setPolicyOpen] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [toast, setToast] = useState(null);
    const [copied, setCopied] = useState(false);
    const jitsiContainer = useRef(null);
    const jitsiApi = useRef(null);
    const callStartTime = useRef(null);
    const [callDuration, setCallDuration] = useState('00:00');

    // Premium state (patient only)
    const [premiumLoading, setPremiumLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const [premiumInfo, setPremiumInfo] = useState(null);

    // Appointment-based calls
    const [myCallsLoading, setMyCallsLoading] = useState(false);
    const [myCalls, setMyCalls] = useState([]);
    const [dentistCalls, setDentistCalls] = useState([]);

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    // ── Check premium status on mount (patient only) ──
    useEffect(() => {
        if (isDentist) {
            setPremiumLoading(false);
            setIsPremium(true); // Dentist always has access
            fetchDentistCalls();
        } else {
            checkPremium();
        }
    }, [isDentist]);

    const checkPremium = async () => {
        try {
            setPremiumLoading(true);
            const res = await API.get('/premium/status');
            setIsPremium(res.data.is_premium);
            if (res.data.is_premium) {
                setPremiumInfo(res.data);
                fetchMyCalls();
            }
        } catch (err) {
            console.error('Premium check failed:', err);
        } finally {
            setPremiumLoading(false);
        }
    };

    const fetchMyCalls = async () => {
        try {
            setMyCallsLoading(true);
            const res = await API.get('/telehealth/my-call');
            setMyCalls(res.data);
        } catch (err) {
            console.error('Failed to fetch calls:', err);
        } finally {
            setMyCallsLoading(false);
        }
    };

    const fetchDentistCalls = async () => {
        try {
            const res = await API.get('/telehealth/dentist-calls');
            setDentistCalls(res.data);
        } catch (err) {
            console.error('Failed to fetch dentist calls:', err);
        }
    };

    // Auto-refresh calls every 30 seconds
    useEffect(() => {
        if (!isPremium && !isDentist) return;
        const interval = setInterval(() => {
            if (isDentist) fetchDentistCalls();
            else fetchMyCalls();
        }, 30000);
        return () => clearInterval(interval);
    }, [isPremium, isDentist]);

    // ── Start or join a call ──
    const startCall = (room, type = 'video') => {
        if (!room || room.trim().length < 3) {
            return showToast('Invalid room code.', 'error');
        }

        const cleanRoom = room.trim().replace(/[^a-zA-Z0-9-_]/g, '');
        setRoomName(cleanRoom);
        setInCall(true);
        setCallEnded(false);
        callStartTime.current = Date.now();

        if (!window.JitsiMeetExternalAPI) {
            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.async = true;
            script.onload = () => initJitsi(cleanRoom, type);
            script.onerror = () => {
                showToast('Failed to load video call service.', 'error');
                setInCall(false);
            };
            document.head.appendChild(script);
        } else {
            initJitsi(cleanRoom, type);
        }
    };

    const initJitsi = (room, type) => {
        if (jitsiApi.current) {
            jitsiApi.current.dispose();
            jitsiApi.current = null;
        }

        setTimeout(() => {
            if (!jitsiContainer.current) return;

            try {
                const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
                    roomName: `DeepSense_${room}`,
                    parentNode: jitsiContainer.current,
                    width: '100%',
                    height: '100%',
                    configOverwrite: {
                        startWithAudioMuted: false,
                        startWithVideoMuted: type === 'audio',
                        prejoinPageEnabled: false,
                        disableDeepLinking: true,
                        hideConferenceSubject: false,
                        subject: `DeepSense Consultation — ${room}`,
                        // Disable Jitsi ads/promos
                        disableThirdPartyRequests: true,
                        enableClosePage: false,
                    },
                    interfaceConfigOverwrite: {
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'desktop', 'chat',
                            'raisehand', 'fullscreen', 'hangup',
                            'tileview', 'settings'
                        ],
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        DEFAULT_BACKGROUND: '#060B14',
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                        MOBILE_APP_PROMO: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_POWERED_BY: false,
                        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
                    },
                    userInfo: {
                        displayName: user.full_name || 'DeepSense User',
                        email: user.email || '',
                    },
                });

                api.on('readyToClose', () => endCall());
                jitsiApi.current = api;
            } catch (err) {
                console.error('Jitsi init error:', err);
                showToast('Failed to start call.', 'error');
                setInCall(false);
            }
        }, 300);
    };

    const endCall = () => {
        // Calculate call duration
        if (callStartTime.current) {
            const elapsed = Math.floor((Date.now() - callStartTime.current) / 1000);
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            setCallDuration(`${mins}:${secs}`);
        }

        if (jitsiApi.current) {
            jitsiApi.current.dispose();
            jitsiApi.current = null;
        }

        // Remove Jitsi iframe completely to prevent ads
        if (jitsiContainer.current) {
            jitsiContainer.current.innerHTML = '';
        }

        setInCall(false);
        setCallEnded(true);
    };

    const copyRoomCode = (code) => {
        navigator.clipboard.writeText(code || roomName);
        setCopied(true);
        showToast('Room code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (jitsiApi.current) {
                jitsiApi.current.dispose();
                jitsiApi.current = null;
            }
        };
    }, []);

    // ─── CALL ENDED SCREEN ─────────────────────────────
    if (callEnded) {
        return (
            <CallEndedSummary
                callDuration={callDuration}
                roomName={roomName}
                onReturn={() => {
                    setCallEnded(false);
                    setRoomName('');
                    window.location.href = '/';
                }}
            />
        );
    }

    // ─── IN-CALL VIEW ──────────────────────────────────
    if (inCall) {
        return (
            <div style={{ height: '100vh', background: '#060B14', display: 'flex', flexDirection: 'column' }}>
                {/* Call Header */}
                <div style={{
                    background: 'rgba(6,11,20,0.95)', padding: '10px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(13,148,136,0.2)', zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>🦷</span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>DeepSense</span>
                        <span style={{ color: '#14B8A6', fontSize: 12, fontWeight: 600 }}>LIVE</span>
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 8 }}>
                            <span style={{ color: '#94A3B8', fontSize: 12 }}>Room:</span>
                            <span style={{ color: '#14B8A6', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{roomName}</span>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => copyRoomCode()}
                                style={{ background: 'none', border: 'none', color: copied ? '#10B981' : '#94A3B8', cursor: 'pointer', fontSize: 14, padding: 0 }}
                                title="Copy room code"
                            >{copied ? '✓' : '📋'}</motion.button>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={endCall}
                            style={{ ...dark.btnDanger, padding: '8px 18px', fontSize: 13 }}
                        >📞 End Call</motion.button>
                    </div>
                </div>

                {/* Jitsi Container */}
                <div ref={jitsiContainer} style={{ flex: 1, background: '#000' }} />

                <AnimatePresence>
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </AnimatePresence>
            </div>
        );
    }

    // ─── LOBBY VIEW ─────────────────────────────────────
    return (
        <div className="ds-page-root" style={{ minHeight: '100vh', background: 'var(--bg-primary, #060B14)', color: 'var(--text-primary, #E2E8F0)', position: 'relative', transition: 'background 0.3s ease, color 0.3s ease' }}>
            <AnimatedBG />
            <div style={{ position: 'relative', zIndex: 2 }}>
                <Navbar />
                <div style={{ padding: '96px 40px 40px', maxWidth: 900, margin: '0 auto' }}>

                    {/* Header */}
                    <motion.div style={{ marginBottom: 40 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ fontSize: 13, color: '#0D9488', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>DeepSense</div>
                            {isPremium && !isDentist && (
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    style={{
                                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                        color: '#000', fontSize: 10, fontWeight: 800,
                                        padding: '3px 10px', borderRadius: 20,
                                    }}
                                >⭐ PREMIUM</motion.div>
                            )}
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8 }}>📹 Tele-Health Consultation</h1>
                        <p style={{ color: '#64748B', fontSize: 15 }}>
                            {isDentist
                                ? "Start video consultations with your patients. Today's approved appointments are shown below."
                                : isPremium
                                    ? 'Join your scheduled consultation when it\'s time. Your approved appointments are shown below.'
                                    : 'Upgrade to Premium to access HD video & audio consultations.'
                            }
                        </p>
                    </motion.div>

                    {/* Loading state */}
                    {premiumLoading && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ textAlign: 'center', padding: 60 }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    border: '3px solid rgba(13,148,136,0.2)',
                                    borderTop: '3px solid #0D9488',
                                    margin: '0 auto',
                                }}
                            />
                        </motion.div>
                    )}

                    {/* ── PATIENT: Premium Paywall ────────────── */}
                    {!isDentist && !premiumLoading && !isPremium && (
                        <PremiumPaywall
                            onPurchaseSuccess={() => {
                                setIsPremium(true);
                                showToast('Premium activated! You can now use Telehealth. 🎉');
                                fetchMyCalls();
                            }}
                            onOpenPolicies={() => setPolicyOpen(true)}
                        />
                    )}

                    {/* ── PATIENT: Appointment-Based Call Access ── */}
                    {!isDentist && !premiumLoading && isPremium && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div style={{ maxWidth: 650, margin: '0 auto' }}>
                                {/* Upcoming Appointments */}
                                <motion.div style={{ ...dark.card, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                                            }}>📋</div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Your Appointments</div>
                                                <div style={{ color: '#64748B', fontSize: 12 }}>Join when your appointment time arrives</div>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={fetchMyCalls}
                                            style={{ ...dark.btnOutline, padding: '8px 14px', fontSize: 12 }}
                                        >🔄 Refresh</motion.button>
                                    </div>

                                    {myCallsLoading ? (
                                        <div style={{ textAlign: 'center', padding: 40 }}>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                style={{
                                                    width: 30, height: 30, borderRadius: '50%',
                                                    border: '3px solid rgba(13,148,136,0.2)',
                                                    borderTop: '3px solid #0D9488',
                                                    margin: '0 auto',
                                                }}
                                            />
                                        </div>
                                    ) : myCalls.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center', padding: '40px 20px',
                                            background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                                            border: '1px dashed rgba(255,255,255,0.08)',
                                        }}>
                                            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📭</div>
                                            <div style={{ color: '#94A3B8', fontSize: 14, marginBottom: 4 }}>No upcoming consultations</div>
                                            <div style={{ color: '#475569', fontSize: 12 }}>
                                                Book an appointment first, then come back here when it's time
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {myCalls.map((call) => (
                                                <motion.div
                                                    key={call.appointment_id}
                                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                                    style={{
                                                        background: call.status === 'ready'
                                                            ? 'rgba(13,148,136,0.08)'
                                                            : 'rgba(255,255,255,0.02)',
                                                        border: call.status === 'ready'
                                                            ? '1px solid rgba(13,148,136,0.3)'
                                                            : '1px solid rgba(255,255,255,0.06)',
                                                        borderRadius: 12, padding: 20,
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                                <span style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 15 }}>
                                                                    Dr. {call.dentist_name}
                                                                </span>
                                                                {call.status === 'ready' && (
                                                                    <motion.div
                                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                                        transition={{ repeat: Infinity, duration: 1.2 }}
                                                                        style={{
                                                                            background: '#10B981', color: '#fff',
                                                                            fontSize: 10, fontWeight: 700,
                                                                            padding: '2px 8px', borderRadius: 10,
                                                                        }}
                                                                    >LIVE NOW</motion.div>
                                                                )}
                                                            </div>
                                                            <div style={{ color: '#94A3B8', fontSize: 13 }}>
                                                                📅 {call.appointment_date} · ⏰ {call.time_slot}
                                                                {call.reason && <span> · {call.reason}</span>}
                                                            </div>
                                                            {call.status === 'upcoming' && (
                                                                <div style={{ color: '#F59E0B', fontSize: 12, marginTop: 4 }}>
                                                                    ⏳ Starts in {call.minutes_until} minutes
                                                                </div>
                                                            )}
                                                        </div>

                                                        {call.status === 'ready' ? (
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                    onClick={() => startCall(call.room_code, 'audio')}
                                                                    style={{ ...dark.btnOutline, padding: '10px 16px', fontSize: 13 }}
                                                                >🎤</motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                    onClick={() => startCall(call.room_code, 'video')}
                                                                    style={{ ...dark.btn, padding: '10px 20px', fontSize: 13 }}
                                                                >📹 Join Call</motion.button>
                                                            </div>
                                                        ) : (
                                                            <div style={{
                                                                background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
                                                                padding: '8px 16px', borderRadius: 8,
                                                                fontSize: 12, fontWeight: 600,
                                                            }}>Waiting...</div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Info note */}
                                <div style={{
                                    background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                                    borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
                                }}>
                                    <span style={{ fontSize: 18 }}>ℹ️</span>
                                    <div style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.7 }}>
                                        <strong style={{ color: '#60A5FA' }}>How it works:</strong><br />
                                        1. Book an appointment from the Appointments page<br />
                                        2. Wait for your dentist to approve it<br />
                                        3. Come back here at appointment time — "Join Call" will appear<br />
                                        4. Call window opens ±15 minutes around your scheduled time
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── DENTIST: Today's Calls ───────────────── */}
                    {isDentist && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div style={{ maxWidth: 650, margin: '0 auto' }}>
                                <motion.div style={{ ...dark.card, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: 'linear-gradient(135deg, #0D9488, #0891B2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                                            }}>📞</div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Today's Consultations</div>
                                                <div style={{ color: '#64748B', fontSize: 12 }}>Approved appointments for today</div>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={fetchDentistCalls}
                                            style={{ ...dark.btnOutline, padding: '8px 14px', fontSize: 12 }}
                                        >🔄 Refresh</motion.button>
                                    </div>

                                    {dentistCalls.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center', padding: '40px 20px',
                                            background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                                            border: '1px dashed rgba(255,255,255,0.08)',
                                        }}>
                                            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📭</div>
                                            <div style={{ color: '#94A3B8', fontSize: 14, marginBottom: 4 }}>No consultations scheduled for today</div>
                                            <div style={{ color: '#475569', fontSize: 12 }}>
                                                Approved appointments for today will appear here
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {dentistCalls.map((call) => (
                                                <motion.div
                                                    key={call.appointment_id}
                                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                                    style={{
                                                        background: 'rgba(13,148,136,0.06)',
                                                        border: '1px solid rgba(13,148,136,0.2)',
                                                        borderRadius: 12, padding: 20,
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                                                                {call.patient_name}
                                                            </div>
                                                            <div style={{ color: '#94A3B8', fontSize: 13 }}>
                                                                ⏰ {call.time_slot} {call.reason && `· ${call.reason}`}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                                                <span style={{ color: '#64748B', fontSize: 11 }}>Room:</span>
                                                                <span style={{ color: '#14B8A6', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                                                                    {call.room_code}
                                                                </span>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                                    onClick={() => copyRoomCode(call.room_code)}
                                                                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12, padding: 0 }}
                                                                >📋</motion.button>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                onClick={() => startCall(call.room_code, 'audio')}
                                                                style={{ ...dark.btnOutline, padding: '10px 16px', fontSize: 13 }}
                                                            >🎤 Audio</motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                onClick={() => startCall(call.room_code, 'video')}
                                                                style={{ ...dark.btn, padding: '10px 20px', fontSize: 13 }}
                                                            >📹 Video</motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Quick Start (Dentist can still manually create) */}
                                <motion.div style={dark.card}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                                        }}>⚡</div>
                                        <div>
                                            <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 14 }}>Quick Start Room</div>
                                            <div style={{ color: '#64748B', fontSize: 11 }}>Start an instant consultation outside scheduled appointments</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                const quickRoom = `DS-Quick-${Date.now().toString(36).toUpperCase()}`;
                                                startCall(quickRoom, 'audio');
                                            }}
                                            style={{ ...dark.btnOutline, flex: 1, padding: '12px 0', fontSize: 14 }}
                                        >🎤 Quick Audio</motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                const quickRoom = `DS-Quick-${Date.now().toString(36).toUpperCase()}`;
                                                startCall(quickRoom, 'video');
                                            }}
                                            style={{ ...dark.btn, flex: 1, padding: '12px 0', fontSize: 14 }}
                                        >📹 Quick Video</motion.button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* Features Info (always visible) */}
                    {(isPremium || isDentist) && (
                        <motion.div
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 40 }}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        >
                            {[
                                { icon: '🎥', label: 'HD Video', desc: 'Crystal clear video' },
                                { icon: '🎤', label: 'Audio Call', desc: 'High quality audio' },
                                { icon: '🖥️', label: 'Screen Share', desc: 'Share X-ray reports' },
                                { icon: '🔒', label: 'Encrypted', desc: 'Secure & private' },
                            ].map((f, i) => (
                                <div key={i} style={{
                                    background: 'rgba(15,25,45,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12, padding: '20px 16px', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                                    <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.label}</div>
                                    <div style={{ color: '#64748B', fontSize: 11 }}>{f.desc}</div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Patient Policies Button */}
                    {!isDentist && (
                        <div style={{ textAlign: 'center', marginTop: 36 }}>
                            <PolicyButton onClick={() => setPolicyOpen(true)} />
                        </div>
                    )}
                </div>
            </div>

            <PolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />

            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    );
}