#!/usr/bin/env python3
"""
TontineClub Test Credentials Verification
Testing with the specific credentials mentioned in the review request.
"""

import requests
import json
import sys

# Base URL from review request
BASE_URL = "https://qa-checkpoint-7.preview.emergentagent.com/api"

def test_existing_credentials():
    """Test with the credentials from review request"""
    print("🔐 Testing with existing credentials from review request")
    print("Email: test@tontineclub.com")
    print("Password: Test123!")
    
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    try:
        # Test login
        response = session.post(f"{BASE_URL}/auth/login", json={
            "email": "test@tontineclub.com",
            "password": "Test123!"
        })
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print("✅ PASS: Login successful with test credentials")
                token = data["access_token"]
                
                # Test a few key endpoints with this token
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test dashboard
                dash_response = session.get(f"{BASE_URL}/dashboard", headers=headers)
                if dash_response.status_code == 200:
                    print("✅ PASS: Dashboard accessible with test credentials")
                else:
                    print(f"❌ FAIL: Dashboard not accessible: {dash_response.status_code}")
                
                # Test subscription status
                sub_response = session.get(f"{BASE_URL}/subscription/status", headers=headers)
                if sub_response.status_code == 200:
                    sub_data = sub_response.json()
                    print(f"✅ PASS: Subscription status: {sub_data.get('status')}, Access: {sub_data.get('has_access')}")
                else:
                    print(f"❌ FAIL: Subscription status not accessible: {sub_response.status_code}")
                
                return True
            else:
                print(f"❌ FAIL: No access token in response: {data}")
                return False
        else:
            print(f"❌ FAIL: Login failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Exception during test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_existing_credentials()
    sys.exit(0 if success else 1)