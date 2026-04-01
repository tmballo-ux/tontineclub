"""
TontineClub - Admin API Routes
Completely separate admin panel for SaaS management
"""
from fastapi import APIRouter, HTTPException, Body, Header
from typing import Optional
from datetime import datetime, timedelta
import jwt
import os
from pathlib import Path
from dotenv import load_dotenv
from passlib.context import CryptContext

# Load env vars explicitly for admin routes
load_dotenv(Path(__file__).parent / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET', '')
ADMIN_SECRET = os.environ.get('ADMIN_JWT_SECRET', '')

admin_router = APIRouter(prefix="/admin", tags=["admin"])

# Admin credentials
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')
ADMIN_PASSWORD_HASH = None


def get_admin_password_hash():
    global ADMIN_PASSWORD_HASH
    if ADMIN_PASSWORD_HASH is None:
        admin_pwd = os.environ.get('ADMIN_PASSWORD', '')
        ADMIN_PASSWORD_HASH = pwd_context.hash(admin_pwd)
    return ADMIN_PASSWORD_HASH


def verify_admin_token(token: str):
    """Verify admin JWT token"""
    try:
        payload = jwt.decode(token, ADMIN_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Accès admin requis")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session admin expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token admin invalide")


def require_admin(authorization: Optional[str] = Header(None)):
    """Extract and verify admin token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token admin requis")
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    return verify_admin_token(token)


def setup_admin_routes(db):
    """Setup admin routes with database access"""

    @admin_router.post("/login")
    async def admin_login(data: dict = Body(...)):
        email = data.get("email", "")
        password = data.get("password", "")

        if email != ADMIN_EMAIL:
            raise HTTPException(status_code=401, detail="Identifiants admin invalides")

        if not pwd_context.verify(password, get_admin_password_hash()):
            raise HTTPException(status_code=401, detail="Identifiants admin invalides")

        token = jwt.encode({
            "sub": email,
            "role": "admin",
            "exp": datetime.utcnow() + timedelta(hours=8)
        }, ADMIN_SECRET, algorithm="HS256")

        return {"access_token": token, "admin_email": email}

    @admin_router.get("/dashboard-stats")
    async def admin_dashboard_stats(admin=Header(None, alias="authorization")):
        require_admin(admin)
        total_users = await db.users.count_documents({})
        total_tontines = await db.tontines.count_documents({})
        active_tontines = await db.tontines.count_documents({"status": "active"})
        total_subscriptions = await db.subscriptions.count_documents({})
        active_trials = await db.subscriptions.count_documents({"status": "trialing"})
        active_subs = await db.subscriptions.count_documents({"status": "active"})
        total_invitations = await db.invitations.count_documents({})
        pending_invitations = await db.invitations.count_documents({"status": "pending"})
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})

        return {
            "total_users": total_users,
            "recent_users": recent_users,
            "total_tontines": total_tontines,
            "active_tontines": active_tontines,
            "total_subscriptions": total_subscriptions,
            "active_trials": active_trials,
            "active_subscriptions": active_subs,
            "total_invitations": total_invitations,
            "pending_invitations": pending_invitations,
        }

    @admin_router.get("/users")
    async def admin_list_users(admin=Header(None, alias="authorization")):
        require_admin(admin)
        users = await db.users.find({}, {"password_hash": 0, "_id": 0}).sort("created_at", -1).to_list(1000)
        for user in users:
            sub = await db.subscriptions.find_one({"user_id": user["id"]})
            user["subscription_status"] = sub.get("status", "none") if sub else "none"
            user["created_at"] = str(user.get("created_at", ""))
        return {"users": users, "total": len(users)}

    @admin_router.delete("/users/{user_id}")
    async def admin_delete_user(user_id: str, admin=Header(None, alias="authorization")):
        require_admin(admin)
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        await db.users.delete_one({"id": user_id})
        await db.subscriptions.delete_many({"user_id": user_id})
        await db.notifications.delete_many({"user_id": user_id})
        await db.invitations.delete_many({"$or": [
            {"inviter_id": user_id},
            {"invited_email": user.get("email")}
        ]})
        return {"message": f"Utilisateur {user.get('email')} supprimé avec succès"}

    @admin_router.post("/users/{user_id}/reset-password")
    async def admin_reset_password(user_id: str, data: dict = Body(...), admin=Header(None, alias="authorization")):
        require_admin(admin)
        new_password = data.get("new_password", "")
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        hashed = pwd_context.hash(new_password)
        await db.users.update_one({"id": user_id}, {"$set": {"password_hash": hashed}})
        return {"message": f"Mot de passe de {user.get('email')} réinitialisé avec succès"}

    @admin_router.get("/tontines")
    async def admin_list_tontines(admin=Header(None, alias="authorization")):
        require_admin(admin)
        tontines = await db.tontines.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        for tontine in tontines:
            creator = await db.users.find_one({"id": tontine.get("creator_id")})
            tontine["creator_name"] = creator.get("full_name", "Inconnu") if creator else "Inconnu"
            tontine["creator_email"] = creator.get("email", "") if creator else ""
            tontine["member_count"] = len(tontine.get("members", []))
            tontine["created_at"] = str(tontine.get("created_at", ""))
            tontine["start_date"] = str(tontine.get("start_date", ""))
        return {"tontines": tontines, "total": len(tontines)}

    @admin_router.delete("/tontines/{tontine_id}")
    async def admin_delete_tontine(tontine_id: str, admin=Header(None, alias="authorization")):
        require_admin(admin)
        tontine = await db.tontines.find_one({"id": tontine_id})
        if not tontine:
            raise HTTPException(status_code=404, detail="Tontine non trouvée")
        await db.tontines.delete_one({"id": tontine_id})
        await db.invitations.delete_many({"tontine_id": tontine_id})
        return {"message": f"Tontine '{tontine.get('name')}' supprimée avec succès"}

    @admin_router.get("/subscriptions")
    async def admin_list_subscriptions(admin=Header(None, alias="authorization")):
        require_admin(admin)
        subs = await db.subscriptions.find({}, {"_id": 0}).to_list(1000)
        for sub in subs:
            user = await db.users.find_one({"id": sub.get("user_id")})
            sub["user_email"] = user.get("email", "Inconnu") if user else "Inconnu"
            sub["user_name"] = user.get("full_name", "Inconnu") if user else "Inconnu"
            for key in ["trial_start", "trial_end", "subscription_start", "subscription_end"]:
                if sub.get(key):
                    sub[key] = str(sub[key])
        return {"subscriptions": subs, "total": len(subs)}

    # Admin dashboard HTML page
    @admin_router.get("/dashboard", response_class=None)
    async def admin_dashboard_page():
        from fastapi.responses import HTMLResponse
        from pathlib import Path
        admin_html = Path("/app/backend/admin_static/index.html")
        if admin_html.exists():
            return HTMLResponse(content=admin_html.read_text())
        return HTMLResponse(content="<h1>Admin page not found</h1>", status_code=404)

    return admin_router
