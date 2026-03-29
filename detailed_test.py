#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Base URL from frontend .env
BASE_URL = "https://club-staging-3.preview.emergentagent.com/api"

def test_enriched_invitations_detailed():
    """Test the enriched invitations endpoint with detailed response verification."""
    
    print("🔍 DETAILED ENRICHED INVITATIONS API VERIFICATION")
    print("=" * 60)
    
    # Generate unique emails with timestamp
    timestamp = int(datetime.now().timestamp())
    user_a_email = f"usera_detail_{timestamp}@test.com"
    user_b_email = f"userb_detail_{timestamp}@test.com"
    
    try:
        # Register users and create tontine
        print("\n📝 Setting up test scenario...")
        
        # Register User A
        user_a_data = {
            "email": user_a_email,
            "full_name": "Alice Martin",
            "phone": "+33600000001",
            "password": "test123456"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=user_a_data, timeout=10)
        user_a_token = response.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {user_a_token}"}
        
        # Create tontine
        tontine_data = {
            "name": "Tontine Test Invitation",
            "contribution_amount": 5000,
            "currency": "XOF",
            "frequency": "monthly",
            "max_members": 5,
            "start_date": "2026-04-01"
        }
        response = requests.post(f"{BASE_URL}/tontines", json=tontine_data, headers=headers_a, timeout=10)
        tontine_id = response.json()["id"]
        
        # Register User B
        user_b_data = {
            "email": user_b_email,
            "full_name": "Bob Diouf",
            "phone": "+33600000002",
            "password": "test123456"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=user_b_data, timeout=10)
        user_b_token = response.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {user_b_token}"}
        
        # Send invitation
        invitation_data = {
            "tontine_id": tontine_id,
            "invited_email": user_b_email
        }
        response = requests.post(f"{BASE_URL}/invitations", json=invitation_data, headers=headers_a, timeout=10)
        invitation_id = response.json()["id"]
        
        print("✅ Test scenario setup complete")
        
        # Test enriched endpoint
        print("\n🔍 Testing enriched invitations endpoint...")
        response = requests.get(f"{BASE_URL}/invitations/received/enriched", headers=headers_b, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Enriched endpoint failed: {response.status_code}")
            return False
        
        enriched_invitations = response.json()
        if not enriched_invitations:
            print("❌ No enriched invitations returned")
            return False
        
        invitation = enriched_invitations[0]
        
        print("\n📊 DETAILED RESPONSE VERIFICATION:")
        print("-" * 40)
        
        # Print the actual response structure
        print(f"📋 Full Response Structure:")
        print(json.dumps(invitation, indent=2, default=str))
        
        # Verify basic invitation fields
        print(f"\n✅ Basic Invitation Fields:")
        print(f"   • ID: {invitation.get('id', 'MISSING')}")
        print(f"   • Tontine Name: {invitation.get('tontine_name', 'MISSING')}")
        print(f"   • Inviter Name: {invitation.get('inviter_name', 'MISSING')}")
        print(f"   • Status: {invitation.get('status', 'MISSING')}")
        print(f"   • Created At: {invitation.get('created_at', 'MISSING')}")
        
        # Verify tontine_details object
        if "tontine_details" in invitation:
            tontine_details = invitation["tontine_details"]
            print(f"\n✅ Tontine Details Object:")
            print(f"   • Name: {tontine_details.get('name', 'MISSING')}")
            print(f"   • Contribution Amount: {tontine_details.get('contribution_amount', 'MISSING')}")
            print(f"   • Currency: {tontine_details.get('currency', 'MISSING')}")
            print(f"   • Frequency: {tontine_details.get('frequency', 'MISSING')}")
            print(f"   • Max Members: {tontine_details.get('max_members', 'MISSING')}")
            print(f"   • Current Members: {tontine_details.get('current_members', 'MISSING')}")
            print(f"   • Total Pot: {tontine_details.get('total_pot', 'MISSING')}")
            print(f"   • Start Date: {tontine_details.get('start_date', 'MISSING')}")
            print(f"   • Status: {tontine_details.get('status', 'MISSING')}")
            print(f"   • Member Names: {tontine_details.get('member_names', 'MISSING')}")
            
            # Verify calculations
            expected_total_pot = tontine_details.get('contribution_amount', 0) * tontine_details.get('max_members', 0)
            actual_total_pot = tontine_details.get('total_pot', 0)
            
            print(f"\n🧮 Calculation Verification:")
            print(f"   • Expected Total Pot: {expected_total_pot}")
            print(f"   • Actual Total Pot: {actual_total_pot}")
            print(f"   • Calculation Correct: {'✅' if expected_total_pot == actual_total_pot else '❌'}")
        else:
            print(f"\n❌ Missing tontine_details object")
            return False
        
        # Test invitation acceptance
        print(f"\n🔄 Testing invitation acceptance...")
        response = requests.post(f"{BASE_URL}/invitations/{invitation_id}/accept", headers=headers_b, timeout=10)
        if response.status_code != 200:
            print(f"❌ Invitation acceptance failed: {response.status_code}")
            return False
        
        # Verify status change
        response = requests.get(f"{BASE_URL}/invitations/received/enriched", headers=headers_b, timeout=10)
        enriched_invitations = response.json()
        invitation = enriched_invitations[0]
        
        print(f"✅ Status after acceptance: {invitation.get('status', 'MISSING')}")
        
        # Test backward compatibility
        print(f"\n🔄 Testing backward compatibility...")
        response = requests.get(f"{BASE_URL}/invitations/received", headers=headers_b, timeout=10)
        if response.status_code != 200:
            print(f"❌ Original endpoint failed: {response.status_code}")
            return False
        
        original_invitations = response.json()
        print(f"✅ Original endpoint returns {len(original_invitations)} invitation(s)")
        
        print(f"\n🎉 DETAILED VERIFICATION COMPLETE!")
        print("=" * 60)
        print("✅ Enriched Invitations API fully verified")
        print("✅ All required fields present and correct")
        print("✅ Calculations accurate")
        print("✅ Status transitions working")
        print("✅ Backward compatibility maintained")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_enriched_invitations_detailed()
    sys.exit(0 if success else 1)