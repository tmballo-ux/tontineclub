from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import random
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tontineclub')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'REDACTED_JWT_SECRET')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="TontineClub API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== ENUMS =====================
class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class TontineFrequency(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class Currency(str, Enum):
    CAD = "CAD"  # Dollar canadien
    USD = "USD"  # Dollar américain
    XOF = "XOF"  # FCFA (Franc CFA Ouest-Africain)
    EUR = "EUR"  # Euro

class TontineStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"

class PaymentStatus(str, Enum):
    NOT_ANNOUNCED = "not_announced"
    ANNOUNCED = "announced"
    CONFIRMED = "confirmed"
    CONTESTED = "contested"

class NotificationType(str, Enum):
    INVITATION_RECEIVED = "invitation_received"
    INVITATION_ACCEPTED = "invitation_accepted"
    INVITATION_REJECTED = "invitation_rejected"
    CYCLE_STARTED = "cycle_started"
    PAYMENT_REMINDER = "payment_reminder"
    PAYMENT_ANNOUNCED = "payment_announced"
    PAYMENT_CONFIRMED = "payment_confirmed"
    PAYMENT_CONTESTED = "payment_contested"

# ===================== MODELS =====================

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None  # Base64

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_photo: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    profile_photo: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Tontine Models
class TontineCreate(BaseModel):
    name: str
    contribution_amount: float
    currency: Currency = Currency.XOF
    frequency: TontineFrequency
    max_members: int
    start_date: datetime
    description: Optional[str] = None

class TontineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None

class Tontine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contribution_amount: float
    currency: Currency = Currency.XOF
    frequency: TontineFrequency
    max_members: int
    current_members: int = 1
    start_date: datetime
    description: Optional[str] = None
    status: TontineStatus = TontineStatus.DRAFT
    creator_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Invitation Models
class InvitationCreate(BaseModel):
    tontine_id: str
    invited_email: EmailStr

class Invitation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tontine_id: str
    tontine_name: str
    inviter_id: str
    inviter_name: str
    invited_email: str
    invited_user_id: Optional[str] = None
    status: InvitationStatus = InvitationStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None

# Member Models
class TontineMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tontine_id: str
    user_id: str
    user_name: str
    user_email: str
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    beneficiary_order: Optional[int] = None

# Beneficiary Order Models
class BeneficiaryOrderUpdate(BaseModel):
    member_ids: List[str]  # Ordered list of member IDs

# Cycle Models
class Cycle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tontine_id: str
    cycle_number: int
    beneficiary_id: str
    beneficiary_name: str
    start_date: datetime
    end_date: datetime
    is_current: bool = False
    is_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Contribution Models
class ContributionDeclaration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tontine_id: str
    cycle_id: str
    member_id: str
    member_name: str
    status: PaymentStatus = PaymentStatus.NOT_ANNOUNCED
    declared_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    contested_at: Optional[datetime] = None
    contest_reason: Optional[str] = None

class DeclarePaymentRequest(BaseModel):
    cycle_id: str

class ConfirmPaymentRequest(BaseModel):
    declaration_id: str

class ContestPaymentRequest(BaseModel):
    declaration_id: str
    reason: str

# Notification Models
class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: NotificationType
    title: str
    message: str
    tontine_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ===================== HELPER FUNCTIONS =====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

async def create_notification(user_id: str, notif_type: NotificationType, title: str, message: str, tontine_id: str = None):
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        tontine_id=tontine_id
    )
    await db.notifications.insert_one(notification.dict())
    return notification

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        phone=user_data.phone
    )
    user_dict = user.dict()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token({"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user.dict())
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    access_token = create_access_token({"sub": user["id"]})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            phone=user["phone"],
            profile_photo=user.get("profile_photo"),
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/forgot-password")
async def forgot_password(email: EmailStr):
    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal if email exists
        return {"message": "Si cet email existe, un lien de réinitialisation sera envoyé"}
    
    # In production, send email here
    # For MVP, just return success
    return {"message": "Si cet email existe, un lien de réinitialisation sera envoyé"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        phone=current_user["phone"],
        profile_photo=current_user.get("profile_photo"),
        created_at=current_user["created_at"]
    )

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": current_user["id"]})
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        full_name=updated_user["full_name"],
        phone=updated_user["phone"],
        profile_photo=updated_user.get("profile_photo"),
        created_at=updated_user["created_at"]
    )

# ===================== TONTINE ENDPOINTS =====================

@api_router.post("/tontines", response_model=Tontine)
async def create_tontine(tontine_data: TontineCreate, current_user: dict = Depends(get_current_user)):
    tontine = Tontine(
        name=tontine_data.name,
        contribution_amount=tontine_data.contribution_amount,
        currency=tontine_data.currency,
        frequency=tontine_data.frequency,
        max_members=tontine_data.max_members,
        start_date=tontine_data.start_date,
        description=tontine_data.description,
        creator_id=current_user["id"]
    )
    
    await db.tontines.insert_one(tontine.dict())
    
    # Add creator as first member
    member = TontineMember(
        tontine_id=tontine.id,
        user_id=current_user["id"],
        user_name=current_user["full_name"],
        user_email=current_user["email"],
        beneficiary_order=1
    )
    await db.tontine_members.insert_one(member.dict())
    
    return tontine

@api_router.get("/tontines", response_model=List[Tontine])
async def get_my_tontines(current_user: dict = Depends(get_current_user)):
    # Get tontines where user is a member
    member_records = await db.tontine_members.find({"user_id": current_user["id"]}).to_list(1000)
    tontine_ids = [m["tontine_id"] for m in member_records]
    
    tontines = await db.tontines.find({"id": {"$in": tontine_ids}}).to_list(1000)
    return [Tontine(**t) for t in tontines]

@api_router.get("/tontines/{tontine_id}", response_model=Tontine)
async def get_tontine(tontine_id: str, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": tontine_id})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    # Check if user is a member
    is_member = await db.tontine_members.find_one({"tontine_id": tontine_id, "user_id": current_user["id"]})
    if not is_member:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette tontine")
    
    return Tontine(**tontine)

@api_router.put("/tontines/{tontine_id}", response_model=Tontine)
async def update_tontine(tontine_id: str, update_data: TontineUpdate, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": tontine_id})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    if tontine["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le créateur peut modifier la tontine")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await db.tontines.update_one({"id": tontine_id}, {"$set": update_dict})
    
    updated = await db.tontines.find_one({"id": tontine_id})
    return Tontine(**updated)

@api_router.delete("/tontines/{tontine_id}")
async def delete_tontine(tontine_id: str, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": tontine_id})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    if tontine["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le créateur peut supprimer la tontine")
    
    if tontine["status"] == TontineStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Impossible de supprimer une tontine active")
    
    await db.tontines.delete_one({"id": tontine_id})
    await db.tontine_members.delete_many({"tontine_id": tontine_id})
    await db.invitations.delete_many({"tontine_id": tontine_id})
    
    return {"message": "Tontine supprimée avec succès"}

# ===================== INVITATION ENDPOINTS =====================

@api_router.post("/invitations", response_model=Invitation)
async def send_invitation(invitation_data: InvitationCreate, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": invitation_data.tontine_id})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    if tontine["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le créateur peut envoyer des invitations")
    
    if tontine["current_members"] >= tontine["max_members"]:
        raise HTTPException(status_code=400, detail="La tontine a atteint le nombre maximum de membres")
    
    # Check if already invited
    existing = await db.invitations.find_one({
        "tontine_id": invitation_data.tontine_id,
        "invited_email": invitation_data.invited_email,
        "status": InvitationStatus.PENDING
    })
    if existing:
        raise HTTPException(status_code=400, detail="Cette personne a déjà été invitée")
    
    # Check if already a member
    invited_user = await db.users.find_one({"email": invitation_data.invited_email})
    if invited_user:
        is_member = await db.tontine_members.find_one({
            "tontine_id": invitation_data.tontine_id,
            "user_id": invited_user["id"]
        })
        if is_member:
            raise HTTPException(status_code=400, detail="Cette personne est déjà membre")
    
    invitation = Invitation(
        tontine_id=invitation_data.tontine_id,
        tontine_name=tontine["name"],
        inviter_id=current_user["id"],
        inviter_name=current_user["full_name"],
        invited_email=invitation_data.invited_email,
        invited_user_id=invited_user["id"] if invited_user else None
    )
    
    await db.invitations.insert_one(invitation.dict())
    
    # Create notification if user exists
    if invited_user:
        await create_notification(
            user_id=invited_user["id"],
            notif_type=NotificationType.INVITATION_RECEIVED,
            title="Nouvelle invitation",
            message=f"{current_user['full_name']} vous invite à rejoindre la tontine '{tontine['name']}'",
            tontine_id=tontine["id"]
        )
    
    return invitation

@api_router.get("/invitations/received", response_model=List[Invitation])
async def get_received_invitations(current_user: dict = Depends(get_current_user)):
    invitations = await db.invitations.find({
        "invited_email": current_user["email"]
    }).sort("created_at", -1).to_list(1000)
    return [Invitation(**inv) for inv in invitations]

@api_router.get("/invitations/sent/{tontine_id}", response_model=List[Invitation])
async def get_sent_invitations(tontine_id: str, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": tontine_id})
    if not tontine or tontine["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    invitations = await db.invitations.find({"tontine_id": tontine_id}).sort("created_at", -1).to_list(1000)
    return [Invitation(**inv) for inv in invitations]

@api_router.post("/invitations/{invitation_id}/accept")
async def accept_invitation(invitation_id: str, current_user: dict = Depends(get_current_user)):
    invitation = await db.invitations.find_one({"id": invitation_id})
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation non trouvée")
    
    if invitation["invited_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Cette invitation ne vous est pas destinée")
    
    if invitation["status"] != InvitationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cette invitation a déjà été traitée")
    
    tontine = await db.tontines.find_one({"id": invitation["tontine_id"]})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    if tontine["current_members"] >= tontine["max_members"]:
        raise HTTPException(status_code=400, detail="La tontine est complète")
    
    # Update invitation
    await db.invitations.update_one(
        {"id": invitation_id},
        {"$set": {"status": InvitationStatus.ACCEPTED, "responded_at": datetime.utcnow(), "invited_user_id": current_user["id"]}}
    )
    
    # Add as member
    member_count = await db.tontine_members.count_documents({"tontine_id": invitation["tontine_id"]})
    member = TontineMember(
        tontine_id=invitation["tontine_id"],
        user_id=current_user["id"],
        user_name=current_user["full_name"],
        user_email=current_user["email"],
        beneficiary_order=member_count + 1
    )
    await db.tontine_members.insert_one(member.dict())
    
    # Update tontine member count
    new_count = member_count + 1
    update_data = {"current_members": new_count}
    
    # Auto-activate if full
    if new_count >= tontine["max_members"]:
        update_data["status"] = TontineStatus.ACTIVE
    
    await db.tontines.update_one({"id": invitation["tontine_id"]}, {"$set": update_data})
    
    # Notify creator
    await create_notification(
        user_id=tontine["creator_id"],
        notif_type=NotificationType.INVITATION_ACCEPTED,
        title="Invitation acceptée",
        message=f"{current_user['full_name']} a accepté votre invitation pour '{tontine['name']}'",
        tontine_id=tontine["id"]
    )
    
    return {"message": "Invitation acceptée avec succès"}

@api_router.post("/invitations/{invitation_id}/reject")
async def reject_invitation(invitation_id: str, current_user: dict = Depends(get_current_user)):
    invitation = await db.invitations.find_one({"id": invitation_id})
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation non trouvée")
    
    if invitation["invited_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Cette invitation ne vous est pas destinée")
    
    if invitation["status"] != InvitationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cette invitation a déjà été traitée")
    
    await db.invitations.update_one(
        {"id": invitation_id},
        {"$set": {"status": InvitationStatus.REJECTED, "responded_at": datetime.utcnow()}}
    )
    
    tontine = await db.tontines.find_one({"id": invitation["tontine_id"]})
    if tontine:
        await create_notification(
            user_id=tontine["creator_id"],
            notif_type=NotificationType.INVITATION_REJECTED,
            title="Invitation refusée",
            message=f"{current_user['full_name']} a refusé votre invitation pour '{tontine['name']}'",
            tontine_id=tontine["id"]
        )
    
    return {"message": "Invitation refusée"}

# ===================== MEMBER ENDPOINTS =====================

@api_router.get("/tontines/{tontine_id}/members", response_model=List[TontineMember])
async def get_tontine_members(tontine_id: str, current_user: dict = Depends(get_current_user)):
    is_member = await db.tontine_members.find_one({"tontine_id": tontine_id, "user_id": current_user["id"]})
    if not is_member:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette tontine")
    
    members = await db.tontine_members.find({"tontine_id": tontine_id}).sort("beneficiary_order", 1).to_list(1000)
    return [TontineMember(**m) for m in members]

# ===================== BENEFICIARY ORDER ENDPOINTS =====================

@api_router.put("/tontines/{tontine_id}/beneficiary-order")
async def set_beneficiary_order(tontine_id: str, order_data: BeneficiaryOrderUpdate, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": tontine_id})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    if tontine["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le créateur peut définir l'ordre")
    
    # Update order for each member
    for idx, member_id in enumerate(order_data.member_ids):
        await db.tontine_members.update_one(
            {"id": member_id, "tontine_id": tontine_id},
            {"$set": {"beneficiary_order": idx + 1}}
        )
    
    return {"message": "Ordre des bénéficiaires mis à jour"}

@api_router.post("/tontines/{tontine_id}/randomize-order")
async def randomize_beneficiary_order(tontine_id: str, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": tontine_id})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    if tontine["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le créateur peut modifier l'ordre")
    
    members = await db.tontine_members.find({"tontine_id": tontine_id}).to_list(1000)
    member_ids = [m["id"] for m in members]
    random.shuffle(member_ids)
    
    for idx, member_id in enumerate(member_ids):
        await db.tontine_members.update_one(
            {"id": member_id},
            {"$set": {"beneficiary_order": idx + 1}}
        )
    
    return {"message": "Ordre aléatoire généré avec succès"}

# ===================== CYCLE ENDPOINTS =====================

@api_router.post("/tontines/{tontine_id}/start")
async def start_tontine(tontine_id: str, current_user: dict = Depends(get_current_user)):
    tontine = await db.tontines.find_one({"id": tontine_id})
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine non trouvée")
    
    if tontine["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le créateur peut démarrer la tontine")
    
    if tontine["status"] == TontineStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="La tontine est déjà active")
    
    if tontine["current_members"] < 2:
        raise HTTPException(status_code=400, detail="Il faut au moins 2 membres pour démarrer")
    
    # Update status
    await db.tontines.update_one({"id": tontine_id}, {"$set": {"status": TontineStatus.ACTIVE}})
    
    # Generate cycles
    members = await db.tontine_members.find({"tontine_id": tontine_id}).sort("beneficiary_order", 1).to_list(1000)
    
    start_date = tontine["start_date"]
    frequency_days = 7 if tontine["frequency"] == TontineFrequency.WEEKLY else 30
    
    for idx, member in enumerate(members):
        cycle_start = start_date + timedelta(days=frequency_days * idx)
        cycle_end = cycle_start + timedelta(days=frequency_days - 1)
        
        cycle = Cycle(
            tontine_id=tontine_id,
            cycle_number=idx + 1,
            beneficiary_id=member["user_id"],
            beneficiary_name=member["user_name"],
            start_date=cycle_start,
            end_date=cycle_end,
            is_current=(idx == 0)
        )
        await db.cycles.insert_one(cycle.dict())
        
        # Create contribution declarations for all members
        for m in members:
            declaration = ContributionDeclaration(
                tontine_id=tontine_id,
                cycle_id=cycle.id,
                member_id=m["user_id"],
                member_name=m["user_name"]
            )
            await db.contributions.insert_one(declaration.dict())
    
    # Notify all members
    for member in members:
        await create_notification(
            user_id=member["user_id"],
            notif_type=NotificationType.CYCLE_STARTED,
            title="Tontine démarrée",
            message=f"La tontine '{tontine['name']}' a démarré!",
            tontine_id=tontine_id
        )
    
    return {"message": "Tontine démarrée avec succès"}

@api_router.get("/tontines/{tontine_id}/cycles", response_model=List[Cycle])
async def get_tontine_cycles(tontine_id: str, current_user: dict = Depends(get_current_user)):
    is_member = await db.tontine_members.find_one({"tontine_id": tontine_id, "user_id": current_user["id"]})
    if not is_member:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette tontine")
    
    cycles = await db.cycles.find({"tontine_id": tontine_id}).sort("cycle_number", 1).to_list(1000)
    return [Cycle(**c) for c in cycles]

@api_router.get("/tontines/{tontine_id}/current-cycle")
async def get_current_cycle(tontine_id: str, current_user: dict = Depends(get_current_user)):
    is_member = await db.tontine_members.find_one({"tontine_id": tontine_id, "user_id": current_user["id"]})
    if not is_member:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette tontine")
    
    cycle = await db.cycles.find_one({"tontine_id": tontine_id, "is_current": True})
    if not cycle:
        return None
    
    contributions = await db.contributions.find({"cycle_id": cycle["id"]}).to_list(1000)
    
    return {
        "cycle": Cycle(**cycle),
        "contributions": [ContributionDeclaration(**c) for c in contributions]
    }

# ===================== CONTRIBUTION ENDPOINTS =====================

@api_router.post("/contributions/declare")
async def declare_payment(request: DeclarePaymentRequest, current_user: dict = Depends(get_current_user)):
    contribution = await db.contributions.find_one({
        "cycle_id": request.cycle_id,
        "member_id": current_user["id"]
    })
    
    if not contribution:
        raise HTTPException(status_code=404, detail="Cotisation non trouvée")
    
    if contribution["status"] != PaymentStatus.NOT_ANNOUNCED:
        raise HTTPException(status_code=400, detail="Paiement déjà annoncé")
    
    await db.contributions.update_one(
        {"id": contribution["id"]},
        {"$set": {"status": PaymentStatus.ANNOUNCED, "declared_at": datetime.utcnow()}}
    )
    
    # Notify beneficiary
    cycle = await db.cycles.find_one({"id": request.cycle_id})
    if cycle:
        tontine = await db.tontines.find_one({"id": cycle["tontine_id"]})
        await create_notification(
            user_id=cycle["beneficiary_id"],
            notif_type=NotificationType.PAYMENT_ANNOUNCED,
            title="Paiement annoncé",
            message=f"{current_user['full_name']} a annoncé son paiement pour '{tontine['name']}'",
            tontine_id=cycle["tontine_id"]
        )
    
    return {"message": "Paiement annoncé avec succès"}

@api_router.post("/contributions/confirm")
async def confirm_payment(request: ConfirmPaymentRequest, current_user: dict = Depends(get_current_user)):
    contribution = await db.contributions.find_one({"id": request.declaration_id})
    if not contribution:
        raise HTTPException(status_code=404, detail="Cotisation non trouvée")
    
    cycle = await db.cycles.find_one({"id": contribution["cycle_id"]})
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle non trouvé")
    
    if cycle["beneficiary_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le bénéficiaire peut confirmer les paiements")
    
    if contribution["status"] != PaymentStatus.ANNOUNCED:
        raise HTTPException(status_code=400, detail="Ce paiement n'a pas été annoncé")
    
    await db.contributions.update_one(
        {"id": contribution["id"]},
        {"$set": {"status": PaymentStatus.CONFIRMED, "confirmed_at": datetime.utcnow()}}
    )
    
    # Notify member
    tontine = await db.tontines.find_one({"id": cycle["tontine_id"]})
    await create_notification(
        user_id=contribution["member_id"],
        notif_type=NotificationType.PAYMENT_CONFIRMED,
        title="Paiement confirmé",
        message=f"Votre paiement pour '{tontine['name']}' a été confirmé",
        tontine_id=cycle["tontine_id"]
    )
    
    # Check if all payments confirmed to complete cycle
    all_contributions = await db.contributions.find({"cycle_id": cycle["id"]}).to_list(1000)
    all_confirmed = all(c["status"] == PaymentStatus.CONFIRMED for c in all_contributions)
    
    if all_confirmed:
        await db.cycles.update_one({"id": cycle["id"]}, {"$set": {"is_completed": True, "is_current": False}})
        # Set next cycle as current
        next_cycle = await db.cycles.find_one({"tontine_id": cycle["tontine_id"], "cycle_number": cycle["cycle_number"] + 1})
        if next_cycle:
            await db.cycles.update_one({"id": next_cycle["id"]}, {"$set": {"is_current": True}})
            # Notify all members about new cycle
            members = await db.tontine_members.find({"tontine_id": cycle["tontine_id"]}).to_list(1000)
            for m in members:
                await create_notification(
                    user_id=m["user_id"],
                    notif_type=NotificationType.CYCLE_STARTED,
                    title="Nouveau cycle",
                    message=f"Le cycle {next_cycle['cycle_number']} de '{tontine['name']}' commence! Bénéficiaire: {next_cycle['beneficiary_name']}",
                    tontine_id=cycle["tontine_id"]
                )
    
    return {"message": "Paiement confirmé avec succès"}

@api_router.post("/contributions/contest")
async def contest_payment(request: ContestPaymentRequest, current_user: dict = Depends(get_current_user)):
    contribution = await db.contributions.find_one({"id": request.declaration_id})
    if not contribution:
        raise HTTPException(status_code=404, detail="Cotisation non trouvée")
    
    cycle = await db.cycles.find_one({"id": contribution["cycle_id"]})
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle non trouvé")
    
    if cycle["beneficiary_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le bénéficiaire peut contester les paiements")
    
    if contribution["status"] != PaymentStatus.ANNOUNCED:
        raise HTTPException(status_code=400, detail="Ce paiement n'a pas été annoncé")
    
    await db.contributions.update_one(
        {"id": contribution["id"]},
        {"$set": {
            "status": PaymentStatus.CONTESTED,
            "contested_at": datetime.utcnow(),
            "contest_reason": request.reason
        }}
    )
    
    # Notify member
    tontine = await db.tontines.find_one({"id": cycle["tontine_id"]})
    await create_notification(
        user_id=contribution["member_id"],
        notif_type=NotificationType.PAYMENT_CONTESTED,
        title="Paiement contesté",
        message=f"Votre paiement pour '{tontine['name']}' a été contesté: {request.reason}",
        tontine_id=cycle["tontine_id"]
    )
    
    return {"message": "Paiement contesté"}

@api_router.get("/tontines/{tontine_id}/contributions")
async def get_tontine_contributions(tontine_id: str, current_user: dict = Depends(get_current_user)):
    is_member = await db.tontine_members.find_one({"tontine_id": tontine_id, "user_id": current_user["id"]})
    if not is_member:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette tontine")
    
    contributions = await db.contributions.find({"tontine_id": tontine_id}).to_list(10000)
    return [ContributionDeclaration(**c) for c in contributions]

# ===================== NOTIFICATION ENDPOINTS =====================

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    return [Notification(**n) for n in notifications]

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": current_user["id"], "is_read": False})
    return {"count": count}

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marquée comme lue"}

@api_router.post("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "Toutes les notifications marquées comme lues"}

# ===================== DASHBOARD ENDPOINT =====================

@api_router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    # Get active tontines count
    member_records = await db.tontine_members.find({"user_id": current_user["id"]}).to_list(1000)
    tontine_ids = [m["tontine_id"] for m in member_records]
    
    active_tontines = await db.tontines.count_documents({
        "id": {"$in": tontine_ids},
        "status": TontineStatus.ACTIVE
    })
    
    # Get pending invitations count
    pending_invitations = await db.invitations.count_documents({
        "invited_email": current_user["email"],
        "status": InvitationStatus.PENDING
    })
    
    # Get next beneficiary info
    next_beneficiary = None
    current_cycles = await db.cycles.find({
        "tontine_id": {"$in": tontine_ids},
        "is_current": True
    }).to_list(100)
    
    for cycle in current_cycles:
        if cycle["beneficiary_id"] == current_user["id"]:
            tontine = await db.tontines.find_one({"id": cycle["tontine_id"]})
            next_beneficiary = {
                "tontine_name": tontine["name"] if tontine else "Inconnu",
                "cycle_number": cycle["cycle_number"]
            }
            break
    
    # Get pending confirmations (where user is beneficiary)
    pending_confirmations = 0
    for cycle in current_cycles:
        if cycle["beneficiary_id"] == current_user["id"]:
            announced = await db.contributions.count_documents({
                "cycle_id": cycle["id"],
                "status": PaymentStatus.ANNOUNCED
            })
            pending_confirmations += announced
    
    # Get recent tontines
    recent_tontines = await db.tontines.find({"id": {"$in": tontine_ids}}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "active_tontines_count": active_tontines,
        "pending_invitations_count": pending_invitations,
        "next_beneficiary": next_beneficiary,
        "pending_confirmations_count": pending_confirmations,
        "recent_tontines": [Tontine(**t) for t in recent_tontines]
    }

# ===================== HISTORY ENDPOINT =====================

@api_router.get("/tontines/{tontine_id}/history")
async def get_tontine_history(tontine_id: str, current_user: dict = Depends(get_current_user)):
    is_member = await db.tontine_members.find_one({"tontine_id": tontine_id, "user_id": current_user["id"]})
    if not is_member:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette tontine")
    
    cycles = await db.cycles.find({"tontine_id": tontine_id, "is_completed": True}).sort("cycle_number", 1).to_list(1000)
    
    history = []
    for cycle in cycles:
        contributions = await db.contributions.find({"cycle_id": cycle["id"]}).to_list(1000)
        confirmed = sum(1 for c in contributions if c["status"] == PaymentStatus.CONFIRMED)
        contested = sum(1 for c in contributions if c["status"] == PaymentStatus.CONTESTED)
        
        history.append({
            "cycle": Cycle(**cycle),
            "total_contributions": len(contributions),
            "confirmed_contributions": confirmed,
            "contested_contributions": contested
        })
    
    return history

# ===================== BASIC ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"message": "TontineClub API v1.0.0", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
