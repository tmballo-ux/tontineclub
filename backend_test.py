#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Base URL from frontend .env
BASE_URL = "https://tontine-dashboard-1.preview.emergentagent.com/api"

def test_enriched_invitations_api():
    """Test the enriched invitations endpoint for TontineClub."""
    
    print("🧪 TESTING ENRICHED INVITATIONS API")
    print("=" * 50)
    
    # Generate unique emails with timestamp
    timestamp = int(datetime.now().timestamp())
    user_a_email = f"usera_inv_{timestamp}@test.com"
    user_b_email = f"userb_inv_{timestamp}@test.com"
    
    try:
        # Step 1: Register User A
        print("\n1️⃣ Registering User A...")
        user_a_data = {
            "email": user_a_email,
            "full_name": "Alice Martin",
            "phone": "+33600000001",
            "password": "test123456"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=user_a_data, timeout=10)
        if response.status_code not in [200, 201]:
            print(f"❌ User A registration failed: {response.status_code} - {response.text}")
            return False
        
        user_a_token = response.json()["access_token"]
        print(f"✅ User A registered successfully")
        
        # Step 2: Login User A (already have token from registration)
        print("\n2️⃣ User A token obtained from registration")
        
        # Step 3: Create a tontine as User A
        print("\n3️⃣ Creating tontine as User A...")
        tontine_data = {
            "name": "Tontine Test Invitation",
            "contribution_amount": 5000,
            "currency": "XOF",
            "frequency": "monthly",
            "max_members": 5,
            "start_date": "2026-04-01"
        }
        
        headers_a = {"Authorization": f"Bearer {user_a_token}"}
        response = requests.post(f"{BASE_URL}/tontines", json=tontine_data, headers=headers_a, timeout=10)
        if response.status_code not in [200, 201]:
            print(f"❌ Tontine creation failed: {response.status_code} - {response.text}")
            return False
        
        tontine_id = response.json()["id"]
        print(f"✅ Tontine created successfully with ID: {tontine_id}")
        
        # Step 4: Get User A's tontine list to verify tontine_id
        print("\n4️⃣ Getting User A's tontine list...")
        response = requests.get(f"{BASE_URL}/tontines", headers=headers_a, timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get tontines: {response.status_code} - {response.text}")
            return False
        
        tontines = response.json()
        if not tontines or tontines[0]["id"] != tontine_id:
            print(f"❌ Tontine ID mismatch or no tontines found")
            return False
        
        print(f"✅ Tontine list retrieved, confirmed ID: {tontine_id}")
        
        # Step 5: Register User B
        print("\n5️⃣ Registering User B...")
        user_b_data = {
            "email": user_b_email,
            "full_name": "Bob Diouf",
            "phone": "+33600000002",
            "password": "test123456"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=user_b_data, timeout=10)
        if response.status_code not in [200, 201]:
            print(f"❌ User B registration failed: {response.status_code} - {response.text}")
            return False
        
        user_b_token = response.json()["access_token"]
        print(f"✅ User B registered successfully")
        
        # Step 6: As User A, send invitation to User B's email
        print("\n6️⃣ Sending invitation from User A to User B...")
        invitation_data = {
            "tontine_id": tontine_id,
            "invited_email": user_b_email
        }
        
        response = requests.post(f"{BASE_URL}/invitations", json=invitation_data, headers=headers_a, timeout=10)
        if response.status_code not in [200, 201]:
            print(f"❌ Invitation sending failed: {response.status_code} - {response.text}")
            return False
        
        invitation_id = response.json()["id"]
        print(f"✅ Invitation sent successfully with ID: {invitation_id}")
        
        # Step 7: Login as User B (already have token from registration)
        print("\n7️⃣ User B token obtained from registration")
        
        # Step 8: Call GET /api/invitations/received/enriched with User B's token
        print("\n8️⃣ Testing enriched invitations endpoint...")
        headers_b = {"Authorization": f"Bearer {user_b_token}"}
        response = requests.get(f"{BASE_URL}/invitations/received/enriched", headers=headers_b, timeout=10)
        if response.status_code != 200:
            print(f"❌ Enriched invitations endpoint failed: {response.status_code} - {response.text}")
            return False
        
        enriched_invitations = response.json()
        if not enriched_invitations:
            print(f"❌ No enriched invitations returned")
            return False
        
        invitation = enriched_invitations[0]
        print(f"✅ Enriched invitations endpoint working")
        
        # Step 9: Verify the response contains enriched data
        print("\n9️⃣ Verifying enriched invitation data structure...")
        
        # Check basic invitation fields
        required_fields = ["id", "tontine_name", "inviter_name", "status", "created_at"]
        for field in required_fields:
            if field not in invitation:
                print(f"❌ Missing required field: {field}")
                return False
        
        # Verify status is "pending"
        if invitation["status"] != "pending":
            print(f"❌ Expected status 'pending', got: {invitation['status']}")
            return False
        
        # Check tontine_details object
        if "tontine_details" not in invitation:
            print(f"❌ Missing tontine_details object")
            return False
        
        tontine_details = invitation["tontine_details"]
        required_tontine_fields = [
            "name", "contribution_amount", "currency", "frequency", 
            "max_members", "current_members", "total_pot", "start_date", 
            "status", "member_names"
        ]
        
        for field in required_tontine_fields:
            if field not in tontine_details:
                print(f"❌ Missing tontine_details field: {field}")
                return False
        
        print(f"✅ All required fields present in enriched data")
        
        # Step 10: Verify total_pot calculation
        print("\n🔟 Verifying total_pot calculation...")
        expected_total_pot = tontine_details["contribution_amount"] * tontine_details["max_members"]
        actual_total_pot = tontine_details["total_pot"]
        
        if actual_total_pot != expected_total_pot:
            print(f"❌ Total pot calculation incorrect. Expected: {expected_total_pot}, Got: {actual_total_pot}")
            return False
        
        if actual_total_pot != 25000:  # 5000 * 5 = 25000
            print(f"❌ Total pot should be 25000, got: {actual_total_pot}")
            return False
        
        print(f"✅ Total pot calculation correct: {actual_total_pot}")
        
        # Step 11: As User B, accept the invitation
        print("\n1️⃣1️⃣ Accepting invitation as User B...")
        response = requests.post(f"{BASE_URL}/invitations/{invitation_id}/accept", headers=headers_b, timeout=10)
        if response.status_code != 200:
            print(f"❌ Invitation acceptance failed: {response.status_code} - {response.text}")
            return False
        
        print(f"✅ Invitation accepted successfully")
        
        # Step 12: Call enriched endpoint again and verify status is "accepted"
        print("\n1️⃣2️⃣ Verifying invitation status changed to 'accepted'...")
        response = requests.get(f"{BASE_URL}/invitations/received/enriched", headers=headers_b, timeout=10)
        if response.status_code != 200:
            print(f"❌ Enriched invitations endpoint failed after acceptance: {response.status_code} - {response.text}")
            return False
        
        enriched_invitations = response.json()
        if not enriched_invitations:
            print(f"❌ No enriched invitations returned after acceptance")
            return False
        
        invitation = enriched_invitations[0]
        if invitation["status"] != "accepted":
            print(f"❌ Expected status 'accepted', got: {invitation['status']}")
            return False
        
        print(f"✅ Invitation status correctly updated to 'accepted'")
        
        # Step 13: Verify the original GET /api/invitations/received still works
        print("\n1️⃣3️⃣ Verifying original invitations endpoint still works...")
        response = requests.get(f"{BASE_URL}/invitations/received", headers=headers_b, timeout=10)
        if response.status_code != 200:
            print(f"❌ Original invitations endpoint failed: {response.status_code} - {response.text}")
            return False
        
        original_invitations = response.json()
        if not original_invitations:
            print(f"❌ No invitations returned from original endpoint")
            return False
        
        print(f"✅ Original invitations endpoint still working")
        
        print("\n🎉 ALL TESTS PASSED!")
        print("=" * 50)
        print("✅ Enriched Invitations API is fully functional")
        print(f"✅ Invitation flow: pending → accepted")
        print(f"✅ Total pot calculation: {actual_total_pot}")
        print(f"✅ All required fields present")
        print(f"✅ Backward compatibility maintained")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_enriched_invitations_api()
    sys.exit(0 if success else 1)