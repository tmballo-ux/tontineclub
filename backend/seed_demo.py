"""
TontineClub Demo Data Seeder
Creates 2 complete tontines with realistic data for production demo.
Run with: python3 seed_demo.py
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta
from passlib.hash import bcrypt

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# ============================================================
# DEMO ACCOUNTS
# ============================================================
DEMO_ACCOUNTS = [
    {"email": "demo_chef@tontineclub.com", "password": "Demo2025!", "full_name": "Amadou Diallo", "phone": "+221771234567", "currency": "XOF"},
    {"email": "demo_fatou@tontineclub.com", "password": "Demo2025!", "full_name": "Fatou Sow", "phone": "+221772345678", "currency": "XOF"},
    {"email": "demo_moussa@tontineclub.com", "password": "Demo2025!", "full_name": "Moussa Ndiaye", "phone": "+221773456789", "currency": "XOF"},
    {"email": "demo_awa@tontineclub.com", "password": "Demo2025!", "full_name": "Awa Ba", "phone": "+221774567890", "currency": "XOF"},
    {"email": "demo_ibra@tontineclub.com", "password": "Demo2025!", "full_name": "Ibrahima Fall", "phone": "+221775678901", "currency": "XOF"},
    {"email": "demo_mariam@tontineclub.com", "password": "Demo2025!", "full_name": "Mariam Diop", "phone": "+221776789012", "currency": "XOF"},
]

async def create_demo_user(db, account):
    """Create a demo user if not exists"""
    existing = await db.users.find_one({"email": account["email"]})
    if existing:
        print(f"  [exists] {account['email']}")
        return str(existing["_id"])
    
    user_id = str(uuid.uuid4())
    hashed = bcrypt.hash(account["password"])
    await db.users.insert_one({
        "_id": user_id,
        "id": user_id,
        "email": account["email"],
        "password_hash": hashed,
        "full_name": account["full_name"],
        "phone": account["phone"],
        "currency": account["currency"],
        "role": "user",
        "is_demo": True,
        "created_at": datetime.utcnow() - timedelta(days=60),
    })
    
    # Give them active subscription
    await db.subscriptions.insert_one({
        "user_id": user_id,
        "status": "active",
        "has_access": True,
        "trial_end": None,
        "subscription_end": datetime.utcnow() + timedelta(days=365),
        "plan": "tontine_premium_monthly",
        "created_at": datetime.utcnow(),
    })
    
    print(f"  [created] {account['email']} → {user_id}")
    return user_id

async def seed_demo_data():
    print(f"\n{'='*60}")
    print(f"  TontineClub Demo Data Seeder")
    print(f"  DB: {DB_NAME}")
    print(f"{'='*60}\n")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Step 1: Create demo users
    print("📝 Creating demo users...")
    user_ids = []
    for account in DEMO_ACCOUNTS:
        uid = await create_demo_user(db, account)
        user_ids.append(uid)
    
    amadou_id, fatou_id, moussa_id, awa_id, ibra_id, mariam_id = user_ids
    
    # Step 2: Create Tontine 1 — "Tontine Famille Diallo"
    print("\n🏦 Creating Tontine 1: Tontine Famille Diallo...")
    tontine1_id = str(uuid.uuid4())
    tontine1 = {
        "_id": tontine1_id,
        "id": tontine1_id,
        "name": "Tontine Famille Diallo",
        "description": "Tontine mensuelle familiale pour l'épargne et l'entraide",
        "contribution_amount": 25000,
        "currency": "XOF",
        "frequency": "monthly",
        "max_members": 5,
        "current_members": 5,
        "status": "active",
        "creator_id": amadou_id,
        "creator_name": "Amadou Diallo",
        "is_demo": True,
        "start_date": datetime.utcnow() - timedelta(days=90),
        "created_at": datetime.utcnow() - timedelta(days=90),
    }
    
    # Check if already exists
    existing_t1 = await db.tontines.find_one({"name": "Tontine Famille Diallo", "is_demo": True})
    if existing_t1:
        print("  [exists] Tontine Famille Diallo — skipping")
        tontine1_id = str(existing_t1["_id"])
    else:
        await db.tontines.insert_one(tontine1)
        print(f"  [created] Tontine Famille Diallo → {tontine1_id}")
        
        # Add members
        t1_members = [
            (amadou_id, "Amadou Diallo", DEMO_ACCOUNTS[0]["email"], 1),
            (fatou_id, "Fatou Sow", DEMO_ACCOUNTS[1]["email"], 2),
            (moussa_id, "Moussa Ndiaye", DEMO_ACCOUNTS[2]["email"], 3),
            (awa_id, "Awa Ba", DEMO_ACCOUNTS[3]["email"], 4),
            (ibra_id, "Ibrahima Fall", DEMO_ACCOUNTS[4]["email"], 5),
        ]
        for uid, name, email, order in t1_members:
            await db.tontine_members.insert_one({
                "tontine_id": tontine1_id,
                "user_id": uid,
                "user_name": name,
                "user_email": email,
                "joined_at": datetime.utcnow() - timedelta(days=88),
                "beneficiary_order": order,
                "is_demo": True,
            })
        print(f"  [members] 5 members added")
        
        # Create cycles for Tontine 1
        # Cycle 1 — COMPLETED (Amadou was beneficiary, all paid)
        cycle1_id = str(uuid.uuid4())
        await db.cycles.insert_one({
            "_id": cycle1_id,
            "id": cycle1_id,
            "tontine_id": tontine1_id,
            "cycle_number": 1,
            "beneficiary_id": amadou_id,
            "beneficiary_name": "Amadou Diallo",
            "start_date": datetime.utcnow() - timedelta(days=90),
            "end_date": datetime.utcnow() - timedelta(days=60),
            "is_current": False,
            "is_completed": True,
            "is_demo": True,
            "created_at": datetime.utcnow() - timedelta(days=90),
        })
        # All payments confirmed for cycle 1
        for uid, name, _, _ in t1_members:
            await db.contributions.insert_one({
                "id": str(uuid.uuid4()),
                "tontine_id": tontine1_id,
                "cycle_id": cycle1_id,
                "member_id": uid,
                "member_name": name,
                "status": "confirmed",
                "declared_at": datetime.utcnow() - timedelta(days=85, hours=int(uid[-1]) if uid[-1].isdigit() else 3),
                "confirmed_at": datetime.utcnow() - timedelta(days=83, hours=int(uid[-1]) if uid[-1].isdigit() else 5),
                "is_demo": True,
            })
        print(f"  [cycle 1] COMPLETED — Beneficiary: Amadou, 5/5 confirmed")
        
        # Cycle 2 — COMPLETED (Fatou was beneficiary, all paid)
        cycle2_id = str(uuid.uuid4())
        await db.cycles.insert_one({
            "_id": cycle2_id,
            "id": cycle2_id,
            "tontine_id": tontine1_id,
            "cycle_number": 2,
            "beneficiary_id": fatou_id,
            "beneficiary_name": "Fatou Sow",
            "start_date": datetime.utcnow() - timedelta(days=60),
            "end_date": datetime.utcnow() - timedelta(days=30),
            "is_current": False,
            "is_completed": True,
            "is_demo": True,
            "created_at": datetime.utcnow() - timedelta(days=60),
        })
        for uid, name, _, _ in t1_members:
            await db.contributions.insert_one({
                "id": str(uuid.uuid4()),
                "tontine_id": tontine1_id,
                "cycle_id": cycle2_id,
                "member_id": uid,
                "member_name": name,
                "status": "confirmed",
                "declared_at": datetime.utcnow() - timedelta(days=55, hours=int(uid[-1]) if uid[-1].isdigit() else 2),
                "confirmed_at": datetime.utcnow() - timedelta(days=52, hours=int(uid[-1]) if uid[-1].isdigit() else 4),
                "is_demo": True,
            })
        print(f"  [cycle 2] COMPLETED — Beneficiary: Fatou, 5/5 confirmed")
        
        # Cycle 3 — CURRENT (Moussa is beneficiary, mixed statuses)
        cycle3_id = str(uuid.uuid4())
        await db.cycles.insert_one({
            "_id": cycle3_id,
            "id": cycle3_id,
            "tontine_id": tontine1_id,
            "cycle_number": 3,
            "beneficiary_id": moussa_id,
            "beneficiary_name": "Moussa Ndiaye",
            "start_date": datetime.utcnow() - timedelta(days=15),
            "end_date": datetime.utcnow() + timedelta(days=15),
            "is_current": True,
            "is_completed": False,
            "is_demo": True,
            "created_at": datetime.utcnow() - timedelta(days=15),
        })
        
        # Mixed payment statuses for current cycle
        c3_statuses = [
            (amadou_id, "Amadou Diallo", "confirmed", datetime.utcnow() - timedelta(days=12), datetime.utcnow() - timedelta(days=11)),
            (fatou_id, "Fatou Sow", "confirmed", datetime.utcnow() - timedelta(days=10), datetime.utcnow() - timedelta(days=9)),
            (moussa_id, "Moussa Ndiaye", "confirmed", datetime.utcnow() - timedelta(days=14), datetime.utcnow() - timedelta(days=14)),
            (awa_id, "Awa Ba", "announced", datetime.utcnow() - timedelta(days=3), None),
            (ibra_id, "Ibrahima Fall", "not_announced", None, None),
        ]
        for uid, name, status, declared, confirmed in c3_statuses:
            await db.contributions.insert_one({
                "id": str(uuid.uuid4()),
                "tontine_id": tontine1_id,
                "cycle_id": cycle3_id,
                "member_id": uid,
                "member_name": name,
                "status": status,
                "declared_at": declared,
                "confirmed_at": confirmed,
                "is_demo": True,
            })
        print(f"  [cycle 3] CURRENT — Beneficiary: Moussa, 3 confirmed / 1 announced / 1 not paid")
    
    # Step 3: Create Tontine 2 — "Tontine Amis Dakar"
    print("\n🏦 Creating Tontine 2: Tontine Amis Dakar...")
    tontine2_id = str(uuid.uuid4())
    tontine2 = {
        "_id": tontine2_id,
        "id": tontine2_id,
        "name": "Tontine Amis Dakar",
        "description": "Tontine hebdomadaire entre amis pour projets personnels",
        "contribution_amount": 10000,
        "currency": "FCFA",
        "frequency": "weekly",
        "max_members": 4,
        "current_members": 4,
        "status": "active",
        "creator_id": fatou_id,
        "creator_name": "Fatou Sow",
        "is_demo": True,
        "start_date": datetime.utcnow() - timedelta(days=42),
        "created_at": datetime.utcnow() - timedelta(days=42),
    }
    
    existing_t2 = await db.tontines.find_one({"name": "Tontine Amis Dakar", "is_demo": True})
    if existing_t2:
        print("  [exists] Tontine Amis Dakar — skipping")
        tontine2_id = str(existing_t2["_id"])
    else:
        await db.tontines.insert_one(tontine2)
        print(f"  [created] Tontine Amis Dakar → {tontine2_id}")
        
        t2_members = [
            (fatou_id, "Fatou Sow", DEMO_ACCOUNTS[1]["email"], 1),
            (moussa_id, "Moussa Ndiaye", DEMO_ACCOUNTS[2]["email"], 2),
            (awa_id, "Awa Ba", DEMO_ACCOUNTS[3]["email"], 3),
            (mariam_id, "Mariam Diop", DEMO_ACCOUNTS[5]["email"], 4),
        ]
        for uid, name, email, order in t2_members:
            await db.tontine_members.insert_one({
                "tontine_id": tontine2_id,
                "user_id": uid,
                "user_name": name,
                "user_email": email,
                "joined_at": datetime.utcnow() - timedelta(days=40),
                "beneficiary_order": order,
                "is_demo": True,
            })
        print(f"  [members] 4 members added")
        
        # Cycle 1 — COMPLETED (Fatou beneficiary)
        c2c1_id = str(uuid.uuid4())
        await db.cycles.insert_one({
            "_id": c2c1_id, "id": c2c1_id,
            "tontine_id": tontine2_id, "cycle_number": 1,
            "beneficiary_id": fatou_id, "beneficiary_name": "Fatou Sow",
            "start_date": datetime.utcnow() - timedelta(days=42),
            "end_date": datetime.utcnow() - timedelta(days=35),
            "is_current": False, "is_completed": True, "is_demo": True,
            "created_at": datetime.utcnow() - timedelta(days=42),
        })
        for uid, name, _, _ in t2_members:
            await db.contributions.insert_one({
                "id": str(uuid.uuid4()), "tontine_id": tontine2_id, "cycle_id": c2c1_id,
                "member_id": uid, "member_name": name, "status": "confirmed",
                "declared_at": datetime.utcnow() - timedelta(days=40),
                "confirmed_at": datetime.utcnow() - timedelta(days=39), "is_demo": True,
            })
        print(f"  [cycle 1] COMPLETED — Beneficiary: Fatou, 4/4 confirmed")
        
        # Cycle 2 — COMPLETED (Moussa beneficiary)
        c2c2_id = str(uuid.uuid4())
        await db.cycles.insert_one({
            "_id": c2c2_id, "id": c2c2_id,
            "tontine_id": tontine2_id, "cycle_number": 2,
            "beneficiary_id": moussa_id, "beneficiary_name": "Moussa Ndiaye",
            "start_date": datetime.utcnow() - timedelta(days=35),
            "end_date": datetime.utcnow() - timedelta(days=28),
            "is_current": False, "is_completed": True, "is_demo": True,
            "created_at": datetime.utcnow() - timedelta(days=35),
        })
        for uid, name, _, _ in t2_members:
            await db.contributions.insert_one({
                "id": str(uuid.uuid4()), "tontine_id": tontine2_id, "cycle_id": c2c2_id,
                "member_id": uid, "member_name": name, "status": "confirmed",
                "declared_at": datetime.utcnow() - timedelta(days=33),
                "confirmed_at": datetime.utcnow() - timedelta(days=32), "is_demo": True,
            })
        print(f"  [cycle 2] COMPLETED — Beneficiary: Moussa, 4/4 confirmed")
        
        # Cycle 3 — CURRENT (Awa beneficiary, with a contested payment)
        c2c3_id = str(uuid.uuid4())
        await db.cycles.insert_one({
            "_id": c2c3_id, "id": c2c3_id,
            "tontine_id": tontine2_id, "cycle_number": 3,
            "beneficiary_id": awa_id, "beneficiary_name": "Awa Ba",
            "start_date": datetime.utcnow() - timedelta(days=7),
            "end_date": datetime.utcnow() + timedelta(days=0),
            "is_current": True, "is_completed": False, "is_demo": True,
            "created_at": datetime.utcnow() - timedelta(days=7),
        })
        
        c2c3_statuses = [
            (fatou_id, "Fatou Sow", "confirmed", datetime.utcnow() - timedelta(days=5), datetime.utcnow() - timedelta(days=4)),
            (moussa_id, "Moussa Ndiaye", "contested", datetime.utcnow() - timedelta(days=4), None),
            (awa_id, "Awa Ba", "confirmed", datetime.utcnow() - timedelta(days=6), datetime.utcnow() - timedelta(days=6)),
            (mariam_id, "Mariam Diop", "not_announced", None, None),
        ]
        for uid, name, status, declared, confirmed in c2c3_statuses:
            doc = {
                "id": str(uuid.uuid4()), "tontine_id": tontine2_id, "cycle_id": c2c3_id,
                "member_id": uid, "member_name": name, "status": status,
                "declared_at": declared, "confirmed_at": confirmed, "is_demo": True,
            }
            if status == "contested":
                doc["contested_at"] = datetime.utcnow() - timedelta(days=3)
                doc["contest_reason"] = "Le virement n'a pas été reçu sur mon compte"
            await db.contributions.insert_one(doc)
        print(f"  [cycle 3] CURRENT — Beneficiary: Awa, 2 confirmed / 1 contested / 1 not paid")
    
    # Step 4: Add demo notifications
    print("\n🔔 Creating demo notifications...")
    demo_notifications = [
        {"user_id": amadou_id, "type": "payment_confirmed", "title": "Paiement confirmé", "message": "Votre paiement pour Tontine Famille Diallo a été confirmé par Moussa Ndiaye.", "is_read": True, "created_at": datetime.utcnow() - timedelta(days=11)},
        {"user_id": fatou_id, "type": "payment_confirmed", "title": "Paiement confirmé", "message": "Votre paiement pour Tontine Famille Diallo a été confirmé par Moussa Ndiaye.", "is_read": True, "created_at": datetime.utcnow() - timedelta(days=9)},
        {"user_id": moussa_id, "type": "cycle_started", "title": "Nouveau cycle", "message": "Le cycle 3 de Tontine Famille Diallo a commencé. Vous êtes le bénéficiaire !", "is_read": True, "created_at": datetime.utcnow() - timedelta(days=15)},
        {"user_id": moussa_id, "type": "payment_announced", "title": "Paiement annoncé", "message": "Awa Ba a annoncé son paiement pour le cycle 3.", "is_read": False, "created_at": datetime.utcnow() - timedelta(days=3)},
        {"user_id": awa_id, "type": "payment_contested", "title": "Paiement contesté", "message": "Awa Ba a contesté le paiement de Moussa Ndiaye dans Tontine Amis Dakar.", "is_read": False, "created_at": datetime.utcnow() - timedelta(days=3)},
        {"user_id": ibra_id, "type": "payment_reminder", "title": "Rappel de paiement", "message": "N'oubliez pas de faire votre paiement pour le cycle 3 de Tontine Famille Diallo.", "is_read": False, "created_at": datetime.utcnow() - timedelta(days=1)},
    ]
    
    # Only add if not already existing
    existing_demo_notif = await db.notifications.count_documents({"is_demo": True})
    if existing_demo_notif == 0:
        for notif in demo_notifications:
            notif["id"] = str(uuid.uuid4())
            notif["is_demo"] = True
            await db.notifications.insert_one(notif)
        print(f"  [created] {len(demo_notifications)} notifications")
    else:
        print(f"  [exists] {existing_demo_notif} demo notifications already exist")
    
    print(f"\n{'='*60}")
    print(f"  ✅ DEMO DATA CREATED SUCCESSFULLY")
    print(f"{'='*60}")
    print(f"\n📱 DEMO ACCOUNTS (all passwords: Demo2025!):")
    for acc in DEMO_ACCOUNTS:
        print(f"  • {acc['email']} — {acc['full_name']}")
    print(f"\n🏦 DEMO TONTINES:")
    print(f"  • Tontine Famille Diallo — 5 members, 3 cycles (2 completed + 1 active)")
    print(f"  • Tontine Amis Dakar — 4 members, 3 cycles (2 completed + 1 active with contest)")
    print()

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
