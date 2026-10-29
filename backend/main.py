from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from database import supabase
from auth import hash_password, verify_password, create_token, verify_token
from typing import Optional
import os, uuid, random, smtplib, secrets
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

SUPERADMIN_EMAIL    = os.getenv("SUPERADMIN_EMAIL", "arzanishw13@gmail.com")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "Aw37405")
PAYMENT_ADMIN_EMAIL    = os.getenv("PAYMENT_ADMIN_EMAIL", "payment@deepsense.ai")
PAYMENT_ADMIN_PASSWORD = os.getenv("PAYMENT_ADMIN_PASSWORD", "DeepSensePay2026!")
GOOGLE_CLIENT_ID    = "666475827485-d1ae76rj2sclgc02aj84gmc7rmlsba1v.apps.googleusercontent.com"
GMAIL_USER          = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD  = os.getenv("GMAIL_APP_PASSWORD")

otp_store = {}

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(to_email: str, otp: str, name: str):
    try:
        msg = MIMEMultipart()
        msg['From']    = GMAIL_USER
        msg['To']      = to_email
        msg['Subject'] = "DeepSense - Your Verification Code"
        body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #060B14; padding: 32px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #0D9488; font-size: 24px; margin: 0;">🦷 DeepSense</h2>
                <p style="color: #64748B; font-size: 12px; margin: 4px 0 0;">AI-Powered Dental Intelligence</p>
            </div>
            <p style="color: #E2E8F0;">Hi <strong>{name}</strong>,</p>
            <p style="color: #94A3B8;">Your verification code for DeepSense is:</p>
            <div style="background: #0F1928; border: 2px solid #0D9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #0D9488; letter-spacing: 8px;">{otp}</span>
            </div>
            <p style="color: #64748B; font-size: 13px;">⏱ This code expires in <strong style="color: #E2E8F0;">10 minutes</strong>.</p>
            <p style="color: #64748B; font-size: 13px;">If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #1E293B; margin: 24px 0;">
            <p style="color: #334155; font-size: 11px; text-align: center;">DeepSense AI · Dental Intelligence Platform · Rawalpindi, Pakistan</p>
        </div>
        """
        msg.attach(MIMEText(body, 'html'))
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_appointment_email(to_email: str, subject: str, body_html: str):
    """Generic appointment notification email using same Gmail credentials."""
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = f"DeepSense - {subject}"
        full_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #060B14; padding: 32px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #0D9488; font-size: 24px; margin: 0;">🦷 DeepSense</h2>
                <p style="color: #64748B; font-size: 12px; margin: 4px 0 0;">AI-Powered Dental Intelligence</p>
            </div>
            {body_html}
            <hr style="border: none; border-top: 1px solid #1E293B; margin: 24px 0;">
            <p style="color: #334155; font-size: 11px; text-align: center;">DeepSense AI · Dental Intelligence Platform</p>
        </div>
        """
        msg.attach(MIMEText(full_body, 'html'))
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Appointment email error: {e}")
        return False

def send_premium_activation_email(to_email: str, name: str, plan_type: str, expires_at: Optional[str] = None):
    try:
        msg = MIMEMultipart()
        msg['From']    = GMAIL_USER
        msg['To']      = to_email
        msg['Subject'] = "DeepSense - Premium Membership Activated!"
        plan_name = "Monthly Pro (PKR 2,499)" if plan_type == "monthly" else "Lifetime Access (PKR 999)"
        exp_text = f"Valid until: {expires_at[:10]}" if expires_at else "Lifetime Unlimited Access"
        body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #060B14; padding: 32px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #0D9488; font-size: 24px; margin: 0;">🦷 DeepSense</h2>
                <p style="color: #64748B; font-size: 12px; margin: 4px 0 0;">AI-Powered Dental Intelligence</p>
            </div>
            <p style="color: #E2E8F0;">Hi <strong>{name}</strong>,</p>
            <p style="color: #94A3B8;">Awesome news! Your payment has been verified and your <strong>DeepSense Premium</strong> is now active!</p>
            <div style="background: #0F1928; border: 2px solid #0D9488; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 20px; font-weight: bold; color: #10B981;">✨ DeepSense Premium Active</span>
                <p style="color: #14B8A6; margin: 8px 0 0; font-size: 14px;"><strong>{plan_name}</strong></p>
                <p style="color: #64748B; margin: 4px 0 0; font-size: 12px;">{exp_text}</p>
            </div>
            <p style="color: #94A3B8; font-size: 13px;">You can now enjoy unlimited AI X-Ray diagnoses, priority appointments, AI assistant features, and advanced telemetry reports.</p>
            <hr style="border: none; border-top: 1px solid #1E293B; margin: 24px 0;">
            <p style="color: #334155; font-size: 11px; text-align: center;">DeepSense AI · Dental Intelligence Platform</p>
        </div>
        """
        msg.attach(MIMEText(body, 'html'))
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Premium activation email error: {e}")
        return False

app = FastAPI(title="DeepSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = verify_token(credentials.credentials)
        print(f"Token OK: {payload}")
        return payload
    except Exception as e:
        print(f"Token FAILED: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def require_verified_dentist(user=Depends(get_current_user)):
    if user["role"] == "admin":
        result = supabase.table("users")\
            .select("is_verified").eq("id", user["user_id"]).execute()
        if not result.data or not result.data[0].get("is_verified"):
            raise HTTPException(403, "Your account is pending verification. Please wait for admin approval.")
    return user

def get_super_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = verify_token(credentials.credentials)
        if payload.get("role") != "superadmin":
            raise HTTPException(403, "Super admin access only")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

def get_payment_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = verify_token(credentials.credentials)
        if payload.get("role") != "payment_admin":
            raise HTTPException(403, "Payment admin access only")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

class RegisterModel(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    license_number: Optional[str] = None

class LoginModel(BaseModel):
    email: str
    password: str

class PatientModel(BaseModel):
    full_name: str
    email: Optional[str] = None
    date_of_birth: Optional[str] = None

class AppointmentModel(BaseModel):
    patient_id: Optional[str] = None
    admin_id: Optional[str] = None
    appointment_date: str
    time_slot: str
    reason: Optional[str] = None
    booking_type: Optional[str] = 'online'

class SendOTPModel(BaseModel):
    email: str
    full_name: str
    password: str
    role: str
    license_number: Optional[str] = None
    phone: Optional[str] = None

class VerifyOTPModel(BaseModel):
    email: str
    otp: str

class ForgotPasswordModel(BaseModel):
    email: str

class ResetPasswordModel(BaseModel):
    email: str
    otp: str
    new_password: str

class GoogleAuthModel(BaseModel):
    credential: str
    role: Optional[str] = None
    license_number: Optional[str] = None

class SuperAdminLoginModel(BaseModel):
    email: str
    password: str

class PaymentAdminLoginModel(BaseModel):
    email: str
    password: str

class VerifyDentistModel(BaseModel):
    user_id: str
    verified: bool

class AvailabilityModel(BaseModel):
    day_of_week: int  # 0=Sunday ... 6=Saturday
    start_time: str   # 'HH:MM' format
    end_time: str     # 'HH:MM' format
    slot_duration: int = 30

class AppointmentResponseModel(BaseModel):
    appointment_id: str
    action: str  # 'approve', 'reject', 'alternative'
    proposed_date: Optional[str] = None
    proposed_time: Optional[str] = None
    message: Optional[str] = None

class AcceptAlternativeModel(BaseModel):
    appointment_id: str

class PremiumPurchaseModel(BaseModel):
    plan_type: str  # 'one_time' or 'monthly'
    payment_method: Optional[str] = 'meezan'  # 'meezan' or 'easypaisa'
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None

class PremiumApprovalModel(BaseModel):
    subscription_id: str
    action: str  # 'approve' or 'reject'
    reason: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "DeepSense API Running!"}

@app.post("/register")
async def register(data: RegisterModel):
    try:
        existing = supabase.table("users")\
            .select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(400, "Email already exists")
        hashed = hash_password(data.password)
        result = supabase.table("users").insert({
            "full_name": data.full_name,
            "email": data.email,
            "password": hashed,
            "role": data.role,
            "license_number": data.license_number
        }).execute()
        user = result.data[0]
        token = create_token({"user_id": user["id"], "role": user["role"]})
        return {"message": "Success", "token": token, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/login")
async def login(data: LoginModel):
    try:
        result = supabase.table("users")\
            .select("*").eq("email", data.email).execute()
        if not result.data:
            raise HTTPException(401, "Invalid credentials")
        user = result.data[0]
        if not verify_password(data.password, user["password"]):
            raise HTTPException(401, "Invalid credentials")
        token = create_token({"user_id": user["id"], "role": user["role"]})
        return {"message": "Success", "token": token, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/me")
async def get_me(user=Depends(get_current_user)):
    result = supabase.table("users")\
        .select("id,full_name,email,role,is_verified")\
        .eq("id", user["user_id"]).execute()
    return result.data[0]

@app.delete("/me")
async def delete_my_account(user=Depends(get_current_user)):
    try:
        if user["role"] == "patient":
            user_data = supabase.table("users")\
                .select("email").eq("id", user["user_id"]).execute()
            if user_data.data:
                email = user_data.data[0]["email"]
                supabase.table("patients").delete().eq("email", email).execute()
        supabase.table("users").delete().eq("id", user["user_id"]).execute()
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/send-otp")
async def send_otp(data: SendOTPModel):
    try:
        existing = supabase.table("users")\
            .select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(400, "Email already registered")
        otp = generate_otp()
        otp_store[data.email] = {
            "otp":            otp,
            "expires":        datetime.utcnow() + timedelta(minutes=10),
            "name":           data.full_name,
            "password":       data.password,
            "role":           data.role,
            "license_number": data.license_number,
            "phone":          data.phone,
        }
        sent = send_otp_email(data.email, otp, data.full_name)
        if not sent:
            raise HTTPException(500, "Failed to send OTP email. Check Gmail credentials.")
        print(f"✅ OTP sent to {data.email}")
        return {"message": "OTP sent! Check your email."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/verify-otp")
async def verify_otp(data: VerifyOTPModel):
    try:
        stored = otp_store.get(data.email)
        if not stored:
            raise HTTPException(400, "OTP not found — request again")
        if datetime.utcnow() > stored["expires"]:
            del otp_store[data.email]
            raise HTTPException(400, "OTP expired — request again")
        if stored["otp"] != data.otp:
            raise HTTPException(400, "Invalid OTP")
        hashed = hash_password(stored["password"])
        result = supabase.table("users").insert({
            "full_name":      stored["name"],
            "email":          data.email,
            "password":       hashed,
            "role":           stored["role"],
            "license_number": stored.get("license_number"),
            "phone":          stored.get("phone"),
            "is_verified":    False if stored["role"] == "admin" else True,
        }).execute()
        del otp_store[data.email]
        user  = result.data[0]
        token = create_token({"user_id": user["id"], "role": user["role"]})
        return {"message": "Verified!", "token": token, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordModel):
    try:
        existing = supabase.table("users")\
            .select("id, full_name").eq("email", data.email).execute()
        if not existing.data:
            raise HTTPException(404, "Email not found")
        user_name = existing.data[0].get("full_name", "User")
        otp = generate_otp()
        otp_store[data.email] = {
            "otp": otp,
            "expires": datetime.utcnow() + timedelta(minutes=10),
            "type": "reset"
        }
        sent = send_otp_email(data.email, otp, user_name)
        if not sent:
            raise HTTPException(500, "Email send failed!")
        print(f"Reset OTP for {data.email}: {otp}")
        return {"message": "OTP sent!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/verify-forgot-otp")
async def verify_forgot_otp(data: VerifyOTPModel):
    try:
        stored = otp_store.get(data.email)
        if not stored:
            raise HTTPException(400, "OTP not found — request again")
        if datetime.utcnow() > stored["expires"]:
            del otp_store[data.email]
            raise HTTPException(400, "OTP expired")
        if stored["otp"] != data.otp:
            raise HTTPException(400, "Invalid OTP")
        return {"message": "OTP verified!", "email": data.email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/reset-password")
async def reset_password(data: ResetPasswordModel):
    try:
        stored = otp_store.get(data.email)
        if not stored:
            raise HTTPException(400, "OTP not found")
        if datetime.utcnow() > stored["expires"]:
            del otp_store[data.email]
            raise HTTPException(400, "OTP expired")
        if stored["otp"] != data.otp:
            raise HTTPException(400, "Invalid OTP")
        hashed = hash_password(data.new_password)
        supabase.table("users")\
            .update({"password": hashed})\
            .eq("email", data.email).execute()
        del otp_store[data.email]
        return {"message": "Password reset successful!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/google-auth")
async def google_auth(data: GoogleAuthModel):
    try:
        idinfo = id_token.verify_oauth2_token(
            data.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email     = idinfo.get("email")
        full_name = idinfo.get("name", "")
        if not email:
            raise HTTPException(400, "Could not retrieve email from Google")
        existing = supabase.table("users")\
            .select("*").eq("email", email).execute()
        if existing.data:
            user = existing.data[0]
            token = create_token({"user_id": user["id"], "role": user["role"]})
            return {"message": "Success", "token": token, "user": user, "is_new_user": False}
        if not data.role:
            return {"is_new_user": True, "needs_role": True, "google_email": email, "google_name": full_name}
        if data.role == "admin" and not data.license_number:
            return {"is_new_user": True, "needs_pmc": True, "google_email": email, "google_name": full_name}
        random_password = hash_password(secrets.token_urlsafe(32))
        result = supabase.table("users").insert({
            "full_name": full_name,
            "email": email,
            "password": random_password,
            "role": data.role,
            "license_number": data.license_number if data.role == "admin" else None,
            "auth_provider": "google",
            "is_verified": False if data.role == "admin" else True,
        }).execute()
        user = result.data[0]
        token = create_token({"user_id": user["id"], "role": user["role"]})
        return {"message": "Account created", "token": token, "user": user, "is_new_user": False}
    except ValueError:
        raise HTTPException(401, "Invalid Google token")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/superadmin/login")
async def superadmin_login(data: SuperAdminLoginModel):
    if data.email != SUPERADMIN_EMAIL or data.password != SUPERADMIN_PASSWORD:
        raise HTTPException(401, "Invalid credentials")
    token = create_token({"user_id": "superadmin", "role": "superadmin"})
    return {"message": "Success", "token": token, "user": {"full_name": "Super Admin", "role": "superadmin", "email": data.email}}

@app.get("/superadmin/stats")
async def superadmin_stats(admin=Depends(get_super_admin)):
    try:
        users = supabase.table("users").select("*").execute()
        total_dentists      = len([u for u in users.data if u["role"] == "admin"])
        total_patients      = len([u for u in users.data if u["role"] == "patient"])
        verified_dentists   = len([u for u in users.data if u["role"] == "admin" and u.get("is_verified") == True])
        unverified_dentists = len([u for u in users.data if u["role"] == "admin" and u.get("is_verified") == False])
        reports      = supabase.table("xray_reports").select("id").execute()
        appointments = supabase.table("appointments").select("id").execute()
        return {
            "total_dentists": total_dentists,
            "total_patients": total_patients,
            "verified_dentists": verified_dentists,
            "unverified_dentists": unverified_dentists,
            "total_reports": len(reports.data),
            "total_appointments": len(appointments.data),
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/superadmin/dentists")
async def superadmin_get_dentists(admin=Depends(get_super_admin)):
    try:
        result = supabase.table("users")\
            .select("id, full_name, email, license_number, phone, is_verified, auth_provider, created_at")\
            .eq("role", "admin")\
            .order("created_at", desc=True)\
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/superadmin/patients")
async def superadmin_get_patients_count_only(admin=Depends(get_super_admin)):
    try:
        result = supabase.table("users")\
            .select("id", count="exact")\
            .eq("role", "patient")\
            .execute()
        return {"total_patients": result.count}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/superadmin/patient-lookup")
async def superadmin_emergency_lookup(email: str, reason: str, admin=Depends(get_super_admin)):
    try:
        if not reason or len(reason.strip()) < 10:
            raise HTTPException(400, "A reason (at least 10 characters) is required for this lookup and will be logged.")
        user_result = supabase.table("users")\
            .select("id, full_name, email, created_at")\
            .eq("email", email).eq("role", "patient").execute()
        if not user_result.data:
            print(f"🔍 AUDIT LOG — Emergency Lookup: email={email}, reason={reason}, found=False")
            raise HTTPException(404, "No patient found with this exact email")
        patient_user = user_result.data[0]
        linked = supabase.table("patients").select("admin_id").eq("email", email).execute()
        dentist_name = None
        if linked.data:
            admin_id = linked.data[0].get("admin_id")
            if admin_id:
                dentist_result = supabase.table("users").select("full_name").eq("id", admin_id).execute()
                if dentist_result.data:
                    dentist_name = dentist_result.data[0]["full_name"]
        print(f"🔍 AUDIT LOG — Emergency Lookup: email={email}, reason={reason}, found=True, patient_id={patient_user['id']}")
        return {
            "full_name": patient_user["full_name"],
            "email": patient_user["email"],
            "registered_on": patient_user["created_at"],
            "linked_dentist": dentist_name,
            "note": "This lookup has been logged for compliance purposes.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/superadmin/verify-dentist")
async def superadmin_verify_dentist(data: VerifyDentistModel, admin=Depends(get_super_admin)):
    try:
        supabase.table("users")\
            .update({"is_verified": data.verified})\
            .eq("id", data.user_id).execute()
        return {"message": "Updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/superadmin/user/{user_id}")
async def superadmin_delete_user(user_id: str, admin=Depends(get_super_admin)):
    try:
        target = supabase.table("users").select("role").eq("id", user_id).execute()
        if not target.data:
            raise HTTPException(404, "User not found")
        if target.data[0]["role"] != "admin":
            raise HTTPException(403, "Super Admin can only manage dentist accounts, not patient records")
        supabase.table("users").delete().eq("id", user_id).execute()
        return {"message": "Dentist account deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

# ============================================================
# DEDICATED PAYMENT ADMIN PORTAL ENDPOINTS
# ============================================================

@app.post("/payment-admin/login")
async def payment_admin_login(data: PaymentAdminLoginModel):
    if data.email != PAYMENT_ADMIN_EMAIL or data.password != PAYMENT_ADMIN_PASSWORD:
        raise HTTPException(401, "Invalid payment admin credentials")
    token = create_token({"user_id": "payment_admin", "role": "payment_admin"})
    return {
        "message": "Success",
        "token": token,
        "user": {"full_name": "Finance & Payment Admin", "role": "payment_admin", "email": data.email}
    }

@app.get("/payment-admin/stats")
async def payment_admin_stats(admin=Depends(get_payment_admin)):
    try:
        subs_res = supabase.table("premium_subscriptions").select("*").execute()
        subs = subs_res.data or []
        pending_count = len([s for s in subs if s.get("status") == "pending"])
        active_count = len([s for s in subs if s.get("status") == "active"])
        rejected_count = len([s for s in subs if s.get("status") == "rejected"])
        total_revenue = sum([s.get("amount", 0) for s in subs if s.get("status") == "active"])
        lifetime_count = len([s for s in subs if s.get("status") == "active" and s.get("plan_type") == "one_time"])
        monthly_count = len([s for s in subs if s.get("status") == "active" and s.get("plan_type") == "monthly"])
        return {
            "total_revenue": total_revenue,
            "pending_count": pending_count,
            "active_count": active_count,
            "rejected_count": rejected_count,
            "lifetime_count": lifetime_count,
            "monthly_count": monthly_count,
            "total_orders": len(subs),
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/payment-admin/requests")
async def payment_admin_get_requests(admin=Depends(get_payment_admin)):
    try:
        subs_res = supabase.table("premium_subscriptions").select("*").execute()
        subs = subs_res.data or []
        users_res = supabase.table("users").select("id, full_name, email, phone, role").execute()
        user_map = {u["id"]: u for u in (users_res.data or [])}
        enriched = []
        for s in subs:
            u_info = user_map.get(s.get("user_id"), {})
            enriched.append({
                **s,
                "user_name": u_info.get("full_name", "Unknown User"),
                "user_email": u_info.get("email", "—"),
                "user_phone": u_info.get("phone", "—"),
                "user_role": u_info.get("role", "patient"),
            })
        enriched.sort(key=lambda x: (0 if x.get("status") == "pending" else 1, x.get("id") or 0), reverse=False)
        return enriched
    except Exception as e:
        print(f"Error fetching payment requests: {e}")
        raise HTTPException(500, str(e))

@app.post("/payment-admin/approve")
async def payment_admin_approve(data: PremiumApprovalModel, admin=Depends(get_payment_admin)):
    try:
        sub_res = supabase.table("premium_subscriptions").select("*").eq("id", data.subscription_id).execute()
        if not sub_res.data:
            raise HTTPException(404, "Subscription request not found")
        sub = sub_res.data[0]
        now_dt = datetime.utcnow()
        purchased_at = now_dt.isoformat()
        expires_at = None
        if sub.get("plan_type") == "monthly":
            expires_at = (now_dt + timedelta(days=30)).isoformat()
        update_data = {
            "status": "active",
            "purchased_at": purchased_at,
            "expires_at": expires_at,
        }
        supabase.table("premium_subscriptions").update(update_data).eq("id", data.subscription_id).execute()
        user_res = supabase.table("users").select("full_name, email").eq("id", sub["user_id"]).execute()
        if user_res.data:
            u = user_res.data[0]
            send_premium_activation_email(u["email"], u["full_name"], sub.get("plan_type", "one_time"), expires_at)
        return {"message": "Premium approved and activated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Approve error: {e}")
        raise HTTPException(500, str(e))

@app.post("/payment-admin/reject")
async def payment_admin_reject(data: PremiumApprovalModel, admin=Depends(get_payment_admin)):
    try:
        supabase.table("premium_subscriptions")\
            .update({"status": "rejected"})\
            .eq("id", data.subscription_id).execute()
        return {"message": "Premium request rejected"}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/search-patient")
async def search_patient(email: str, user=Depends(get_current_user)):
    try:
        result = supabase.table("users")\
            .select("id, full_name, email")\
            .eq("email", email).eq("role", "patient").execute()
        if not result.data:
            raise HTTPException(404, "Patient not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/link-patient")
async def link_patient(data: PatientModel, user=Depends(require_verified_dentist)):
    try:
        existing = supabase.table("patients")\
            .select("id").eq("admin_id", user["user_id"]).eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(400, "Patient already linked")
        result = supabase.table("patients").insert({
            "admin_id":      user["user_id"],
            "full_name":     data.full_name,
            "email":         data.email,
            "date_of_birth": data.date_of_birth
        }).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/patients")
async def get_patients(user=Depends(require_verified_dentist)):
    result = supabase.table("patients")\
        .select("*").eq("admin_id", user["user_id"]).execute()
    return result.data

@app.post("/patients")
async def add_patient(data: PatientModel, user=Depends(require_verified_dentist)):
    result = supabase.table("patients").insert({
        "admin_id": user["user_id"],
        "full_name": data.full_name,
        "email": data.email,
        "date_of_birth": data.date_of_birth
    }).execute()
    return result.data[0]

@app.get("/patients/{patient_id}")
async def get_patient(patient_id: str, user=Depends(require_verified_dentist)):
    result = supabase.table("patients")\
        .select("*").eq("id", patient_id).execute()
    return result.data[0]

@app.delete("/patients/{patient_id}")
async def remove_patient(patient_id: str, user=Depends(require_verified_dentist)):
    try:
        existing = supabase.table("patients")\
            .select("id, admin_id").eq("id", patient_id).execute()
        if not existing.data:
            raise HTTPException(404, "Patient not found")
        if existing.data[0]["admin_id"] != user["user_id"]:
            raise HTTPException(403, "You can only remove your own linked patients")
        supabase.table("patients").delete().eq("id", patient_id).execute()
        return {"message": "Patient removed from your list"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/reports")
async def get_reports(user=Depends(require_verified_dentist)):
    patients = supabase.table("patients")\
        .select("id").eq("admin_id", user["user_id"]).execute()
    if not patients.data:
        return []
    patient_ids = [p["id"] for p in patients.data]
    result = supabase.table("xray_reports")\
        .select("*, patients(full_name)")\
        .in_("patient_id", patient_ids).execute()
    return result.data

@app.delete("/reports/{report_id}")
async def delete_report(report_id: str, user=Depends(require_verified_dentist)):
    try:
        # Verify the report belongs to a patient of this dentist
        report_data = supabase.table("xray_reports").select("patient_id").eq("id", report_id).execute()
        if not report_data.data:
            raise HTTPException(404, "Report not found")
            
        patient_id = report_data.data[0]["patient_id"]
        
        # Check if dentist owns this patient
        patient_check = supabase.table("patients").select("id").eq("id", patient_id).eq("admin_id", user["user_id"]).execute()
        if not patient_check.data:
            raise HTTPException(403, "You don't have permission to delete this report")
            
        supabase.table("xray_reports").delete().eq("id", report_id).execute()
        return {"message": "Report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/reports/{patient_id}")
async def get_patient_reports(patient_id: str, user=Depends(get_current_user)):
    result = supabase.table("xray_reports")\
        .select("*").eq("patient_id", patient_id).execute()
    return result.data

@app.get("/my-reports")
async def get_my_reports(user=Depends(get_current_user)):
    try:
        user_data = supabase.table("users")\
            .select("email").eq("id", user["user_id"]).execute()
        if not user_data.data:
            return []
        email = user_data.data[0]["email"]
        patient = supabase.table("patients")\
            .select("id").eq("email", email).execute()
        if not patient.data:
            return []
        patient_id = patient.data[0]["id"]
        result = supabase.table("xray_reports")\
            .select("*").eq("patient_id", patient_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/dentists")
async def get_dentists(user=Depends(get_current_user)):
    """Returns list of verified dentists — used by patients when booking."""
    result = supabase.table("users")\
        .select("id, full_name, email")\
        .eq("role", "admin")\
        .eq("is_verified", True)\
        .execute()
    return result.data

@app.get("/appointments")
async def get_appointments(user=Depends(get_current_user)):
    if user["role"] == "admin":
        result_check = supabase.table("users")\
            .select("is_verified").eq("id", user["user_id"]).execute()
        if not result_check.data or not result_check.data[0].get("is_verified"):
            raise HTTPException(403, "Your account is pending verification.")
        result = supabase.table("appointments")\
            .select("*")\
            .eq("admin_id", user["user_id"]).execute()
        appointments = result.data
        for appt in appointments:
            if appt.get("patient_id"):
                patient_res = supabase.table("users").select("full_name").eq("id", appt["patient_id"]).execute()
                if patient_res.data:
                    appt["patients"] = {"full_name": patient_res.data[0]["full_name"]}
                else:
                    p_res = supabase.table("patients").select("full_name").eq("id", appt["patient_id"]).execute()
                    if p_res.data:
                        appt["patients"] = {"full_name": p_res.data[0]["full_name"]}
                    else:
                        appt["patients"] = {"full_name": "Unknown Patient"}
        return appointments
    else:
        result = supabase.table("appointments")\
            .select("*").eq("patient_id", user["user_id"]).execute()
        appointments = result.data
        for appt in appointments:
            if appt.get("admin_id"):
                dentist_res = supabase.table("users").select("full_name").eq("id", appt["admin_id"]).execute()
                if dentist_res.data:
                    appt["dentist_name"] = dentist_res.data[0]["full_name"]
        return appointments

@app.post("/availability")
async def set_availability(data: AvailabilityModel, user=Depends(require_verified_dentist)):
    try:
        # Best-effort delete of existing same slot (ignore if none found)
        try:
            supabase.table("dentist_availability")\
                .delete()\
                .eq("dentist_id", user["user_id"])\
                .eq("day_of_week", data.day_of_week)\
                .eq("start_time", data.start_time)\
                .eq("end_time", data.end_time)\
                .execute()
        except Exception:
            pass  # No existing row to delete — that's fine
        
        result = supabase.table("dentist_availability").insert({
            "dentist_id": user["user_id"],
            "day_of_week": data.day_of_week,
            "start_time": data.start_time,
            "end_time": data.end_time,
            "slot_duration": data.slot_duration,
            "is_active": True
        }).execute()
        return result.data[0]
    except Exception as e:
        print(f"Availability error: {e}")
        raise HTTPException(500, str(e))

@app.get("/availability")
async def get_my_availability(user=Depends(require_verified_dentist)):
    try:
        result = supabase.table("dentist_availability")\
            .select("*")\
            .eq("dentist_id", user["user_id"])\
            .eq("is_active", True)\
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/availability/{availability_id}")
async def delete_availability(availability_id: str, user=Depends(require_verified_dentist)):
    try:
        result = supabase.table("dentist_availability")\
            .delete()\
            .eq("id", availability_id)\
            .eq("dentist_id", user["user_id"])\
            .execute()
        return {"message": "Availability deleted"}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/availability/{dentist_id}")
async def get_dentist_availability(dentist_id: str, user=Depends(get_current_user)):
    try:
        result = supabase.table("dentist_availability")\
            .select("*")\
            .eq("dentist_id", dentist_id)\
            .eq("is_active", True)\
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/appointments/booked-slots")
async def get_booked_slots(dentist_id: str, date: str, user=Depends(get_current_user)):
    """Get already booked time slots for a specific dentist on a specific date."""
    try:
        result = supabase.table("appointments")\
            .select("time_slot")\
            .eq("admin_id", dentist_id)\
            .eq("appointment_date", date)\
            .in_("status", ["pending", "approved", "booked", "alternative_proposed"])\
            .execute()
        booked = [r["time_slot"] for r in result.data] if result.data else []
        return {"booked_slots": booked}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/appointments")
async def book_appointment(data: AppointmentModel, user=Depends(get_current_user)):
    try:
        if user["role"] == "patient":
            if not data.admin_id:
                raise HTTPException(400, "Please select a dentist")
                
            active_appts = supabase.table("appointments")\
                .select("id")\
                .eq("patient_id", user["user_id"])\
                .eq("admin_id", data.admin_id)\
                .in_("status", ["pending", "approved", "booked", "alternative_proposed"])\
                .execute()
            if active_appts.data:
                raise HTTPException(400, "You already have an active appointment with this dentist")
                
            dt = datetime.strptime(data.appointment_date, "%Y-%m-%d")
            day_of_week = dt.isoweekday() % 7 # 0=Sunday ... 6=Saturday
            
            avail_result = supabase.table("dentist_availability")\
                .select("*")\
                .eq("dentist_id", data.admin_id)\
                .eq("day_of_week", day_of_week)\
                .eq("is_active", True)\
                .execute()
                
            is_valid_time = False
            req_time_dt = datetime.strptime(data.time_slot[:5], "%H:%M").time()
            for slot in avail_result.data:
                start_dt = datetime.strptime(slot["start_time"][:5], "%H:%M").time()
                end_dt = datetime.strptime(slot["end_time"][:5], "%H:%M").time()
                if start_dt <= req_time_dt <= end_dt:
                    is_valid_time = True
                    break
                    
            if not is_valid_time:
                raise HTTPException(400, "Selected time slot is outside dentist's available hours. Please choose a time within the dentist's schedule.")

            # Check if same slot already booked by another patient
            existing_slot = supabase.table("appointments")\
                .select("id")\
                .eq("admin_id", data.admin_id)\
                .eq("appointment_date", data.appointment_date)\
                .eq("time_slot", data.time_slot)\
                .in_("status", ["pending", "approved", "booked", "alternative_proposed"])\
                .execute()
            if existing_slot.data:
                raise HTTPException(400, "This time slot is already booked by another patient. Please select a different time.")
                
            status = "pending" if data.booking_type == "online" else "booked"
            
            result = supabase.table("appointments").insert({
                "patient_id": user["user_id"],
                "admin_id": data.admin_id,
                "appointment_date": data.appointment_date,
                "time_slot": data.time_slot,
                "reason": data.reason,
                "status": status,
                "booking_type": data.booking_type
            }).execute()
            
            dentist = supabase.table("users").select("email, full_name").eq("id", data.admin_id).execute()
            patient = supabase.table("users").select("email, full_name").eq("id", user["user_id"]).execute()
            
            if dentist.data and patient.data:
                d_email = dentist.data[0]["email"]
                d_name = dentist.data[0]["full_name"]
                p_email = patient.data[0].get("email")
                p_name = patient.data[0]["full_name"]
                
                # Email to Dentist
                dentist_body = f'''
                <h3 style="color: #E2E8F0;">New Appointment Request</h3>
                <p style="color: #94A3B8;">Dr. {d_name}, you have a new appointment request from <strong>{p_name}</strong>.</p>
                <div style="background: #0F1928; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 4px 0; color: #CBD5E1;"><strong>Type:</strong> {data.booking_type.capitalize()}</p>
                    <p style="margin: 4px 0; color: #CBD5E1;"><strong>Date:</strong> {data.appointment_date}</p>
                    <p style="margin: 4px 0; color: #CBD5E1;"><strong>Time:</strong> {data.time_slot}</p>
                    <p style="margin: 4px 0; color: #CBD5E1;"><strong>Reason:</strong> {data.reason or 'N/A'}</p>
                </div>
                <p style="color: #94A3B8;">Please log in to your DeepSense dashboard to manage this appointment.</p>
                '''
                send_appointment_email(d_email, "New Appointment Request", dentist_body)

                # Email to Patient
                if p_email:
                    patient_body = f'''
                    <h3 style="color: #E2E8F0;">Appointment Booked Successfully</h3>
                    <p style="color: #94A3B8;">Hi <strong>{p_name}</strong>, your {data.booking_type} appointment with Dr. {d_name} has been placed.</p>
                    <div style="background: #0F1928; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 4px 0; color: #CBD5E1;"><strong>Date:</strong> {data.appointment_date}</p>
                        <p style="margin: 4px 0; color: #CBD5E1;"><strong>Time:</strong> {data.time_slot}</p>
                        <p style="margin: 4px 0; color: #CBD5E1;"><strong>Status:</strong> {status.capitalize()}</p>
                    </div>
                    <p style="color: #94A3B8;">We will notify you if there are any updates from your dentist.</p>
                    '''
                    send_appointment_email(p_email, "Your Appointment Confirmation", patient_body)
                
        else:
            if not data.patient_id:
                raise HTTPException(400, "Please select a patient")
            result = supabase.table("appointments").insert({
                "patient_id": data.patient_id,
                "admin_id": user["user_id"],
                "appointment_date": data.appointment_date,
                "time_slot": data.time_slot,
                "reason": data.reason,
                "status": "booked",
                "booking_type": data.booking_type
            }).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/appointments/respond")
async def respond_appointment(data: AppointmentResponseModel, user=Depends(require_verified_dentist)):
    try:
        appt_res = supabase.table("appointments").select("*").eq("id", data.appointment_id).eq("admin_id", user["user_id"]).execute()
        if not appt_res.data:
            raise HTTPException(404, "Appointment not found")
        appt = appt_res.data[0]
        
        patient_res = supabase.table("users").select("email, full_name").eq("id", appt["patient_id"]).execute()
        dentist_res = supabase.table("users").select("full_name").eq("id", user["user_id"]).execute()
        
        p_email = patient_res.data[0]["email"] if patient_res.data else None
        p_name = patient_res.data[0]["full_name"] if patient_res.data else "Patient"
        d_name = dentist_res.data[0]["full_name"] if dentist_res.data else "Dentist"
        
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if data.action == "approve":
            update_data["status"] = "approved"
            msg_subject = "Appointment Approved"
            msg_body = f'''
            <h3 style="color: #E2E8F0;">Appointment Confirmed</h3>
            <p style="color: #94A3B8;">Hello {p_name},</p>
            <p style="color: #94A3B8;">Your appointment with Dr. {d_name} has been <strong>approved</strong>.</p>
            <div style="background: #0F1928; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; color: #CBD5E1;"><strong>Date:</strong> {appt["appointment_date"]}</p>
                <p style="margin: 4px 0; color: #CBD5E1;"><strong>Time:</strong> {appt["time_slot"]}</p>
            </div>
            '''
            
        elif data.action == "reject":
            update_data["status"] = "rejected"
            msg_subject = "Appointment Rejected"
            msg_body = f'''
            <h3 style="color: #E2E8F0;">Appointment Update</h3>
            <p style="color: #94A3B8;">Hello {p_name},</p>
            <p style="color: #94A3B8;">Unfortunately, your appointment request with Dr. {d_name} on {appt["appointment_date"]} at {appt["time_slot"]} has been <strong>declined</strong>.</p>
            '''
            if data.message:
                msg_body += f'<p style="color: #94A3B8;"><strong>Message from doctor:</strong> {data.message}</p>'
                
        elif data.action == "alternative":
            update_data["status"] = "alternative_proposed"
            update_data["proposed_date"] = data.proposed_date
            update_data["proposed_time"] = data.proposed_time
            update_data["dentist_message"] = data.message
            msg_subject = "Alternative Appointment Time Proposed"
            msg_body = f'''
            <h3 style="color: #E2E8F0;">Action Required: Appointment Update</h3>
            <p style="color: #94A3B8;">Hello {p_name},</p>
            <p style="color: #94A3B8;">Dr. {d_name} has proposed an alternative time for your appointment.</p>
            <div style="background: #0F1928; border: 1px solid #0D9488; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; color: #CBD5E1;"><strong>Proposed Date:</strong> {data.proposed_date}</p>
                <p style="margin: 4px 0; color: #CBD5E1;"><strong>Proposed Time:</strong> {data.proposed_time}</p>
            </div>
            '''
            if data.message:
                msg_body += f'<p style="color: #94A3B8;"><strong>Message from doctor:</strong> {data.message}</p>'
            msg_body += '<p style="color: #94A3B8;">Please log in to your DeepSense account to accept or decline this new time.</p>'
        else:
            raise HTTPException(400, "Invalid action")
            
        result = supabase.table("appointments").update(update_data).eq("id", data.appointment_id).execute()
        
        if p_email:
            send_appointment_email(p_email, msg_subject, msg_body)
            
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/appointments/accept-alternative")
async def accept_alternative(data: AcceptAlternativeModel, user=Depends(get_current_user)):
    try:
        appt_res = supabase.table("appointments").select("*").eq("id", data.appointment_id).eq("patient_id", user["user_id"]).execute()
        if not appt_res.data:
            raise HTTPException(404, "Appointment not found")
        appt = appt_res.data[0]
        
        if appt["status"] != "alternative_proposed":
            raise HTTPException(400, "No alternative time proposed for this appointment")
            
        result = supabase.table("appointments").update({
            "appointment_date": appt["proposed_date"],
            "time_slot": appt["proposed_time"],
            "status": "approved",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", data.appointment_id).execute()
        
        dentist_res = supabase.table("users").select("email, full_name").eq("id", appt["admin_id"]).execute()
        patient_res = supabase.table("users").select("full_name").eq("id", user["user_id"]).execute()
        
        if dentist_res.data and patient_res.data:
            d_email = dentist_res.data[0]["email"]
            d_name = dentist_res.data[0]["full_name"]
            p_name = patient_res.data[0]["full_name"]
            
            body_html = f'''
            <h3 style="color: #E2E8F0;">Alternative Time Accepted</h3>
            <p style="color: #94A3B8;">Dr. {d_name},</p>
            <p style="color: #94A3B8;"><strong>{p_name}</strong> has accepted the alternative time you proposed.</p>
            <div style="background: #0F1928; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; color: #CBD5E1;"><strong>Confirmed Date:</strong> {appt["proposed_date"]}</p>
                <p style="margin: 4px 0; color: #CBD5E1;"><strong>Confirmed Time:</strong> {appt["proposed_time"]}</p>
            </div>
            '''
            send_appointment_email(d_email, "Alternative Time Accepted", body_html)
            
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/appointments/decline-alternative")
async def decline_alternative(data: AcceptAlternativeModel, user=Depends(get_current_user)):
    try:
        result = supabase.table("appointments").update({
            "status": "cancelled",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", data.appointment_id).eq("patient_id", user["user_id"]).execute()
        if not result.data:
            raise HTTPException(404, "Appointment not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/appointments/pending-count")
async def get_pending_count(user=Depends(get_current_user)):
    try:
        if user["role"] == "admin":
            result = supabase.table("appointments").select("id").eq("admin_id", user["user_id"]).eq("status", "pending").execute()
            return {"count": len(result.data) if result.data else 0}
        else:
            result = supabase.table("appointments").select("id").eq("patient_id", user["user_id"]).eq("status", "alternative_proposed").execute()
            return {"count": len(result.data) if result.data else 0}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/appointments/cancel")
async def cancel_appointment(data: AcceptAlternativeModel, user=Depends(get_current_user)):
    """Patient or dentist can cancel an appointment."""
    try:
        # Check ownership
        if user["role"] == "patient":
            appt_check = supabase.table("appointments").select("id, status, admin_id").eq("id", data.appointment_id).eq("patient_id", user["user_id"]).execute()
        else:
            appt_check = supabase.table("appointments").select("id, status, patient_id").eq("id", data.appointment_id).eq("admin_id", user["user_id"]).execute()
        
        if not appt_check.data:
            raise HTTPException(404, "Appointment not found")
        
        appt = appt_check.data[0]
        if appt["status"] in ["cancelled", "auto_cancelled", "completed"]:
            raise HTTPException(400, "This appointment is already closed")
        
        result = supabase.table("appointments").update({
            "status": "cancelled",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", data.appointment_id).execute()
        
        # Send notification email
        if user["role"] == "patient" and appt.get("admin_id"):
            dentist_res = supabase.table("users").select("email, full_name").eq("id", appt["admin_id"]).execute()
            patient_res = supabase.table("users").select("full_name").eq("id", user["user_id"]).execute()
            if dentist_res.data and patient_res.data:
                p_name = patient_res.data[0]["full_name"]
                d_email = dentist_res.data[0]["email"]
                body_html = f'''
                <h3 style="color: #E2E8F0;">Appointment Cancelled</h3>
                <p style="color: #94A3B8;"><strong>{p_name}</strong> has cancelled their appointment.</p>
                '''
                send_appointment_email(d_email, "Appointment Cancelled", body_html)
        
        return result.data[0] if result.data else {"message": "Appointment cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/appointments/auto-cancel")
async def auto_cancel_appointments():
    try:
        cutoff = (datetime.utcnow() - timedelta(hours=48)).isoformat()
        result = supabase.table("appointments")\
            .update({"status": "auto_cancelled"})\
            .eq("status", "pending")\
            .lt("created_at", cutoff)\
            .execute()
        return {"cancelled": len(result.data) if result.data else 0}
    except Exception as e:
        raise HTTPException(500, str(e))
from ultralytics import YOLO
import cv2, numpy as np, base64, io

_yolo_model = YOLO(os.path.join(os.path.dirname(__file__), 'best.pt'))
@app.post("/analyze")
async def analyze_xray(
    file: UploadFile = File(...),
    patient_id: str = None,
    user=Depends(require_verified_dentist)
):
    try:
        from PIL import Image
        import io, base64
        import cv2, numpy as np

        YOLO_CLASSES = [
            'Impacted', 'Caries', 'Filling', 'Bone Loss',
            'Implant', 'Deep Caries', 'Fracture', 'Periapical Lesion'
        ]
        COLORS = {
            'Caries':            (0,   200, 150),
            'Deep Caries':       (255,  50,  50),
            'Periapical Lesion': (255,   0,   0),
            'Bone Loss':         (255, 140,   0),
            'Fracture':          (220,  20,  60),
            'Impacted':          (100, 149, 237),
            'Implant':           (50,  205,  50),
            'Filling':           (148,   0, 211),
        }
        SEVERITY = {
            'Caries':            'Moderate — early intervention recommended',
            'Deep Caries':       'High — immediate treatment required',
            'Periapical Lesion': 'High — urgent evaluation needed',
            'Bone Loss':         'Moderate-High — periodontal evaluation required',
            'Fracture':          'High — immediate clinical assessment required',
            'Impacted':          'Moderate — surgical consultation advised',
            'Implant':           'Informational — implant detected',
            'Filling':           'Informational — existing restoration detected',
        }

        contents = await file.read()
        img_pil = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np  = np.array(img_pil)

        results = _yolo_model(img_pil, conf=0.25, verbose=False)
        result  = results[0]

        detections  = []
        class_counts = {}
        findings    = {}

        if result.boxes is not None and len(result.boxes) > 0:
            for box in result.boxes:
                cls_id   = int(box.cls[0])
                conf     = float(box.conf[0])
                cls_name = YOLO_CLASSES[cls_id] if cls_id < len(YOLO_CLASSES) else f"Class_{cls_id}"
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                detections.append({"class": cls_name, "confidence": round(conf, 4), "bbox": [x1, y1, x2, y2]})
                class_counts[cls_name] = class_counts.get(cls_name, 0) + 1
                if cls_name not in findings or conf > findings[cls_name]:
                    findings[cls_name] = round(conf, 4)

        img_draw = img_np.copy()
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            color = COLORS.get(det["class"], (13, 148, 136))
            label = f"{det['class']} {det['confidence']*100:.0f}%"
            cv2.rectangle(img_draw, (x1, y1), (x2, y2), color, 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(img_draw, (x1, y1-th-8), (x1+tw+6, y1), color, -1)
            cv2.putText(img_draw, label, (x1+3, y1-4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)

        _, buf = cv2.imencode('.jpg', cv2.cvtColor(img_draw, cv2.COLOR_RGB2BGR))
        annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode()

        if detections:
            primary    = max(detections, key=lambda d: d["confidence"])
            detected   = primary["class"]
            confidence = primary["confidence"]
        else:
            detected   = "No pathology detected"
            confidence = 0.0

        nlp_report = f"""DeepSense AI Dental Analysis Report
=============================================
Total Detections : {len(detections)}
Primary Finding  : {detected}
Confidence       : {confidence*100:.1f}%

Findings Summary:\n"""
        for cls, cnt in sorted(class_counts.items(), key=lambda x: -x[1]):
            nlp_report += f"  • {cls} × {cnt}  — {SEVERITY.get(cls, '')}\n"
        if not detections:
            nlp_report += "  No dental pathology detected above confidence threshold.\n"
        nlp_report += "\nClinical Notes:\n  - All findings are AI-assisted and require dentist confirmation.\n  - Immediate evaluation recommended for high-severity findings.\n"

        if patient_id:
            supabase.table("xray_reports").insert({
                "patient_id":        patient_id,
                "findings":          findings,
                "confidence_scores": findings,
                "nlp_report":        nlp_report,
            }).execute()

        return {
            "detected":        detected,
            "confidence":      confidence,
            "all_findings":    findings,
            "detections":      detections,
            "annotated_image": annotated_b64,
            "total_count":     len(detections),
            "class_counts":    class_counts,
            "nlp_report":      nlp_report,
        }

    except Exception as e:
        print(f"Analyze error: {e}")
        raise HTTPException(500, str(e))
@app.post("/chat")
async def chat(request: dict, user=Depends(require_verified_dentist)):
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        message = request.get("message", "")
        history = request.get("history", [])
        system_prompt = """You are DeepSense AI, an expert dental clinical assistant.
You help dentists analyze X-rays, understand diagnoses, suggest treatments, and answer clinical questions.
Be professional, accurate, and concise. Always recommend consulting a qualified dentist for final decisions."""
        messages = []
        for h in history:
            if h["role"] in ["user", "assistant"]:
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=system_prompt,
            messages=messages
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(500, str(e))

# ============================================================
# PREMIUM SUBSCRIPTION ENDPOINTS
# ============================================================

def check_premium_status(user_id: str):
    """Helper: check if user has active premium subscription."""
    try:
        result = supabase.table("premium_subscriptions")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("status", "active")\
            .execute()
        if not result.data:
            return None
        sub = result.data[0]
        # Check if monthly plan has expired
        if sub["plan_type"] == "monthly" and sub.get("expires_at"):
            expires = datetime.fromisoformat(sub["expires_at"].replace("Z", "+00:00"))
            if datetime.now(expires.tzinfo) > expires:
                supabase.table("premium_subscriptions")\
                    .update({"status": "expired"})\
                    .eq("id", sub["id"]).execute()
                return None
        return sub
    except Exception:
        return None

@app.get("/premium/status")
async def get_premium_status(user=Depends(get_current_user)):
    """Check if current user has active or pending premium."""
    sub = check_premium_status(user["user_id"])
    if sub:
        return {
            "is_premium": True,
            "status": "active",
            "plan_type": sub["plan_type"],
            "purchased_at": sub.get("purchased_at"),
            "expires_at": sub.get("expires_at"),
            "payment_method": sub.get("payment_method"),
            "payment_id": sub.get("payment_id"),
        }
    
    # Check if there is a pending subscription request
    try:
        pending_res = supabase.table("premium_subscriptions")\
            .select("*")\
            .eq("user_id", user["user_id"])\
            .eq("status", "pending")\
            .execute()
        if pending_res.data:
            # Pick latest
            p = pending_res.data[-1]
            return {
                "is_premium": False,
                "status": "pending",
                "plan_type": p.get("plan_type"),
                "payment_method": p.get("payment_method"),
                "payment_id": p.get("payment_id"),
                "amount": p.get("amount"),
                "purchased_at": p.get("purchased_at"),
            }
    except Exception as e:
        print(f"Error checking pending status: {e}")

    return {"is_premium": False, "status": "none"}

@app.post("/premium/purchase")
async def purchase_premium(data: PremiumPurchaseModel, user=Depends(get_current_user)):
    """Submit premium purchase request for approval."""
    try:
        if data.plan_type not in ["one_time", "monthly"]:
            raise HTTPException(400, "Invalid plan type. Use 'one_time' or 'monthly'.")

        if not data.transaction_id or len(data.transaction_id.strip()) < 3:
            raise HTTPException(400, "Please provide a valid Transaction ID / TID.")

        # Check if already has active subscription
        existing = check_premium_status(user["user_id"])
        if existing:
            raise HTTPException(400, "You already have an active premium subscription.")

        amount = 999 if data.plan_type == "one_time" else 2499
        
        # Build reference & payment_id
        ref = data.reference_number.strip() if data.reference_number else f"DS-{random.randint(100000, 999999)}"
        payment_id = f"REF: {ref} | TID: {data.transaction_id.strip()}"

        result = supabase.table("premium_subscriptions").insert({
            "user_id": user["user_id"],
            "plan_type": data.plan_type,
            "amount": amount,
            "status": "pending",
            "payment_id": payment_id,
            "payment_method": data.payment_method or "easypaisa",
            "purchased_at": datetime.utcnow().isoformat(),
        }).execute()

        return {
            "message": "Payment request submitted successfully! We will verify and activate your premium shortly.",
            "subscription": result.data[0] if result.data else {},
            "reference_number": ref,
            "payment_id": payment_id,
            "status": "pending"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Premium purchase error: {e}")
        raise HTTPException(500, str(e))

# ============================================================
# TELEHEALTH APPOINTMENT-BASED CALL ENDPOINTS
# ============================================================

@app.get("/telehealth/my-call")
async def get_my_telehealth_call(user=Depends(get_current_user)):
    """Patient: Get approved/booked appointments that are within call window (±15 min)."""
    try:
        result = supabase.table("appointments")\
            .select("*")\
            .eq("patient_id", user["user_id"])\
            .in_("status", ["approved", "booked"])\
            .execute()

        now = datetime.utcnow()
        callable_appointments = []

        for appt in result.data:
            try:
                appt_date = datetime.strptime(appt["appointment_date"], "%Y-%m-%d")
                appt_time = datetime.strptime(appt["time_slot"], "%H:%M").time()
                appt_datetime = datetime.combine(appt_date.date(), appt_time)

                diff_minutes = (appt_datetime - now).total_seconds() / 60

                # Within ±15 minutes window
                if -15 <= diff_minutes <= 15:
                    room_code = f"DS-APPT-{appt['id'][:8].upper()}"
                    # Get dentist name
                    dentist_res = supabase.table("users")\
                        .select("full_name").eq("id", appt["admin_id"]).execute()
                    dentist_name = dentist_res.data[0]["full_name"] if dentist_res.data else "Dentist"

                    callable_appointments.append({
                        "appointment_id": appt["id"],
                        "appointment_date": appt["appointment_date"],
                        "time_slot": appt["time_slot"],
                        "reason": appt.get("reason"),
                        "dentist_name": dentist_name,
                        "room_code": room_code,
                        "status": "ready",
                    })
                elif diff_minutes > 15:
                    # Upcoming but not yet callable
                    dentist_res = supabase.table("users")\
                        .select("full_name").eq("id", appt["admin_id"]).execute()
                    dentist_name = dentist_res.data[0]["full_name"] if dentist_res.data else "Dentist"

                    callable_appointments.append({
                        "appointment_id": appt["id"],
                        "appointment_date": appt["appointment_date"],
                        "time_slot": appt["time_slot"],
                        "reason": appt.get("reason"),
                        "dentist_name": dentist_name,
                        "room_code": None,
                        "status": "upcoming",
                        "minutes_until": int(diff_minutes),
                    })
            except Exception as parse_err:
                print(f"Date parse error for appointment {appt['id']}: {parse_err}")
                continue

        return callable_appointments
    except Exception as e:
        print(f"Telehealth my-call error: {e}")
        raise HTTPException(500, str(e))

@app.get("/telehealth/dentist-calls")
async def get_dentist_telehealth_calls(user=Depends(require_verified_dentist)):
    """Dentist: Get today's approved/booked appointments for telehealth."""
    try:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        result = supabase.table("appointments")\
            .select("*, patients(full_name)")\
            .eq("admin_id", user["user_id"])\
            .eq("appointment_date", today)\
            .in_("status", ["approved", "booked"])\
            .execute()

        calls = []
        for appt in result.data:
            patient_name = "Patient"
            if appt.get("patients") and appt["patients"].get("full_name"):
                patient_name = appt["patients"]["full_name"]
            else:
                p_res = supabase.table("users")\
                    .select("full_name").eq("id", appt["patient_id"]).execute()
                if p_res.data:
                    patient_name = p_res.data[0]["full_name"]

            room_code = f"DS-APPT-{appt['id'][:8].upper()}"
            calls.append({
                "appointment_id": appt["id"],
                "patient_name": patient_name,
                "time_slot": appt["time_slot"],
                "reason": appt.get("reason"),
                "room_code": room_code,
                "status": appt["status"],
            })

        return calls
    except Exception as e:
        print(f"Dentist telehealth error: {e}")
        raise HTTPException(500, str(e))