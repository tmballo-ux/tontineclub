#!/usr/bin/env python3
"""
TontineClub Backend Auth & Subscription Flow Testing
Testing specific endpoints as per review request
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://auth-flow-sync-1.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "t.mballo@gmail.com"
ADMIN_PASSWORD = "REDACTED_ADMIN_PASSWORD"
TEST_USER_EMAIL = "test@tontineclub.com"
TEST_USER_PASSWORD = "Test123!"

# Generate unique email for new user registration
timestamp = int(time.time())
NEW_USER_EMAIL = f"authtest{timestamp}@test.com"
NEW_USER_PASSWORD = "TestPass123!"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_result(success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"   Details: {details}")

def test_admin_login():
    """Test 1: POST /api/auth/login with admin credentials"""
    print_test_header("Test 1: Admin Login with Subscription Object")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if subscription object exists
            if "subscription" in data:
                subscription = data["subscription"]
                required_fields = ["has_access", "status", "trial_end", "plan"]
                missing_fields = [field for field in required_fields if field not in subscription]
                
                if not missing_fields:
                    print_result(True, "Admin login successful with complete subscription object")
                    print(f"   Subscription: {json.dumps(subscription, indent=2)}")
                    return data.get("access_token"), True
                else:
                    print_result(False, f"Subscription object missing fields: {missing_fields}")
                    return data.get("access_token"), False
            else:
                print_result(False, "Response missing subscription object")
                return data.get("access_token"), False
        else:
            print_result(False, f"Login failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return None, False
            
    except Exception as e:
        print_result(False, f"Request failed: {str(e)}")
        return None, False

def test_new_user_registration():
    """Test 2: POST /api/auth/register with new user"""
    print_test_header("Test 2: New User Registration with Auto-Trial")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json={
                "email": NEW_USER_EMAIL,
                "password": NEW_USER_PASSWORD,
                "full_name": "Auth Test User",
                "phone": "+33699999999",
                "preferred_currency": "EUR"
            },
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            
            # Check if subscription object exists with auto-trial
            if "subscription" in data:
                subscription = data["subscription"]
                
                if subscription.get("has_access") == True and subscription.get("status") == "trialing":
                    print_result(True, "Registration successful with auto-trial subscription")
                    print(f"   Subscription: {json.dumps(subscription, indent=2)}")
                    return data.get("access_token"), True
                else:
                    print_result(False, f"Auto-trial not activated. has_access: {subscription.get('has_access')}, status: {subscription.get('status')}")
                    return data.get("access_token"), False
            else:
                print_result(False, "Response missing subscription object")
                return data.get("access_token"), False
        else:
            print_result(False, f"Registration failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return None, False
            
    except Exception as e:
        print_result(False, f"Request failed: {str(e)}")
        return None, False

def test_new_user_login(expected_token):
    """Test 3: POST /api/auth/login with newly registered user"""
    print_test_header("Test 3: New User Login Verification")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={
                "email": NEW_USER_EMAIL,
                "password": NEW_USER_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if subscription object shows trialing status
            if "subscription" in data:
                subscription = data["subscription"]
                
                if subscription.get("has_access") == True and subscription.get("status") == "trialing":
                    print_result(True, "New user login successful with trialing subscription")
                    print(f"   Subscription: {json.dumps(subscription, indent=2)}")
                    return data.get("access_token"), True
                else:
                    print_result(False, f"Subscription not trialing. has_access: {subscription.get('has_access')}, status: {subscription.get('status')}")
                    return data.get("access_token"), False
            else:
                print_result(False, "Response missing subscription object")
                return data.get("access_token"), False
        else:
            print_result(False, f"Login failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return None, False
            
    except Exception as e:
        print_result(False, f"Request failed: {str(e)}")
        return None, False

def test_subscription_status(token):
    """Test 4: GET /api/subscription/status"""
    print_test_header("Test 4: Subscription Status Endpoint")
    
    try:
        response = requests.get(
            f"{API_BASE}/subscription/status",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("has_access") == True and data.get("status") == "trialing":
                print_result(True, "Subscription status endpoint working correctly")
                print(f"   Status: {json.dumps(data, indent=2)}")
                return True
            else:
                print_result(False, f"Unexpected subscription status. has_access: {data.get('has_access')}, status: {data.get('status')}")
                return False
        else:
            print_result(False, f"Status check failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request failed: {str(e)}")
        return False

def test_duplicate_trial_activation(token):
    """Test 5: POST /api/subscription/activate-trial (should fail for existing trial)"""
    print_test_header("Test 5: Duplicate Trial Activation Prevention")
    
    try:
        response = requests.post(
            f"{API_BASE}/subscription/activate-trial",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 400:
            data = response.json()
            print_result(True, "Duplicate trial activation correctly prevented")
            print(f"   Error message: {data.get('detail', 'No detail provided')}")
            return True
        else:
            print_result(False, f"Expected 400 error but got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request failed: {str(e)}")
        return False

def test_expired_trial_user():
    """Test 6: Login with test@tontineclub.com to verify expired trial"""
    print_test_header("Test 6: Expired Trial User Verification")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if subscription shows expired trial (has_access: false)
            if "subscription" in data:
                subscription = data["subscription"]
                
                if subscription.get("has_access") == False:
                    print_result(True, "Expired trial user correctly shows no access")
                    print(f"   Subscription: {json.dumps(subscription, indent=2)}")
                    return True
                else:
                    print_result(False, f"Expected has_access=false but got {subscription.get('has_access')}")
                    return False
            else:
                print_result(False, "Response missing subscription object")
                return False
        else:
            print_result(False, f"Login failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request failed: {str(e)}")
        return False

def main():
    """Run all auth and subscription flow tests"""
    print("🚀 Starting TontineClub Auth & Subscription Flow Testing")
    print(f"Backend URL: {BASE_URL}")
    print(f"Testing with new user: {NEW_USER_EMAIL}")
    
    results = []
    
    # Test 1: Admin login with subscription object
    admin_token, test1_success = test_admin_login()
    results.append(("Admin Login with Subscription Object", test1_success))
    
    # Test 2: New user registration with auto-trial
    new_user_token, test2_success = test_new_user_registration()
    results.append(("New User Registration with Auto-Trial", test2_success))
    
    # Test 3: New user login verification
    if new_user_token:
        verified_token, test3_success = test_new_user_login(new_user_token)
        results.append(("New User Login Verification", test3_success))
        
        # Test 4: Subscription status endpoint
        if verified_token:
            test4_success = test_subscription_status(verified_token)
            results.append(("Subscription Status Endpoint", test4_success))
            
            # Test 5: Duplicate trial activation prevention
            test5_success = test_duplicate_trial_activation(verified_token)
            results.append(("Duplicate Trial Prevention", test5_success))
    else:
        results.append(("New User Login Verification", False))
        results.append(("Subscription Status Endpoint", False))
        results.append(("Duplicate Trial Prevention", False))
    
    # Test 6: Expired trial user
    test6_success = test_expired_trial_user()
    results.append(("Expired Trial User Verification", test6_success))
    
    # Print summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n🎯 OVERALL RESULT: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🚀 All auth and subscription flow tests PASSED!")
    else:
        print("⚠️  Some tests FAILED - check details above")
    
    return passed == total

if __name__ == "__main__":
    main()