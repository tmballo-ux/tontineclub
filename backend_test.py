#!/usr/bin/env python3
"""
TontineClub Subscription System API Testing
Testing the subscription endpoints as per review request.
"""

import requests
import json
import time
import sys
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://tontine-prod-ready.preview.emergentagent.com/api"

class SubscriptionTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.user1_token = None
        self.user2_token = None
        # Use timestamp to make emails unique
        self.timestamp = int(time.time())
        self.user1_email = f"sub_test_{self.timestamp}@test.com"
        self.user2_email = f"sub_test2_{self.timestamp}@test.com"

    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })

    def register_user(self, email, full_name, phone, password):
        """Register a new user"""
        try:
            response = self.session.post(f"{self.base_url}/auth/register", json={
                "email": email,
                "full_name": full_name,
                "phone": phone,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def login_user(self, email, password):
        """Login user and return token"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json={
                "email": email,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def get_subscription_status(self, token):
        """Test GET /api/subscription/status endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/subscription/status", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def activate_trial(self, token):
        """Test POST /api/subscription/activate-trial endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/subscription/activate-trial", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            elif response.status_code == 400:
                data = response.json() if response.content else {"error": f"Status {response.status_code}"}
                return False, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def cancel_subscription(self, token):
        """Test POST /api/subscription/cancel endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/subscription/cancel", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def verify_purchase(self, token, product_id, purchase_token):
        """Test POST /api/subscription/verify-purchase endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/subscription/verify-purchase", 
                headers=headers,
                json={
                    "product_id": product_id,
                    "purchase_token": purchase_token
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def run_comprehensive_test(self):
        """Run the comprehensive subscription test flow as specified in review request"""
        print("🚀 Starting TontineClub Subscription System API Testing")
        print("=" * 70)
        
        # Step 1: Register a new user (POST /api/auth/register with email "sub_test@test.com", full_name "Sub Test", phone "+33699999001", password "test123456")
        print("\n📝 Step 1: Register User 1")
        success, data = self.register_user(
            self.user1_email, 
            "Sub Test", 
            "+33699999001", 
            "test123456"
        )
        
        if success:
            self.log_test("Register User 1", True, f"User registered successfully")
        else:
            self.log_test("Register User 1", False, f"Registration failed: {data}")
            return

        # Step 2: Login and get JWT token
        print("\n🔐 Step 2: Login User 1")
        success, data = self.login_user(self.user1_email, "test123456")
        
        if success and "access_token" in data:
            self.user1_token = data["access_token"]
            self.log_test("Login User 1", True, "Login successful, JWT token obtained")
        else:
            self.log_test("Login User 1", False, f"Login failed: {data}")
            return

        # Step 3: GET /api/subscription/status - verify status is "none" and has_access is false
        print("\n📊 Step 3: Check Initial Subscription Status")
        success, data = self.get_subscription_status(self.user1_token)
        
        if success:
            status = data.get("status")
            has_access = data.get("has_access")
            
            if status == "none" and has_access == False:
                self.log_test("Initial Subscription Status", True, 
                    f"Correct initial state: status={status}, has_access={has_access}")
            else:
                self.log_test("Initial Subscription Status", False, 
                    f"Incorrect initial state: status={status}, has_access={has_access}", data)
        else:
            self.log_test("Initial Subscription Status", False, f"API call failed: {data}")

        # Step 4: POST /api/subscription/activate-trial - verify success, status "trialing", trial_end exists
        print("\n🎯 Step 4: Activate Trial")
        success, data = self.activate_trial(self.user1_token)
        
        if success:
            status = data.get("status")
            trial_end = data.get("trial_end")
            success_flag = data.get("success")
            
            if success_flag and status == "trialing" and trial_end:
                self.log_test("Activate Trial", True, 
                    f"Trial activated successfully: status={status}, trial_end={trial_end}")
            else:
                self.log_test("Activate Trial", False, 
                    f"Trial activation incomplete: success={success_flag}, status={status}, trial_end={trial_end}", data)
        else:
            self.log_test("Activate Trial", False, f"Trial activation failed: {data}")

        # Step 5: GET /api/subscription/status again - verify status is "trialing" and has_access is true
        print("\n📊 Step 5: Check Subscription Status After Trial")
        success, data = self.get_subscription_status(self.user1_token)
        
        if success:
            status = data.get("status")
            has_access = data.get("has_access")
            
            if status == "trialing" and has_access == True:
                self.log_test("Subscription Status After Trial", True, 
                    f"Correct trial state: status={status}, has_access={has_access}")
            else:
                self.log_test("Subscription Status After Trial", False, 
                    f"Incorrect trial state: status={status}, has_access={has_access}", data)
        else:
            self.log_test("Subscription Status After Trial", False, f"API call failed: {data}")

        # Step 6: POST /api/subscription/activate-trial again - should return 400 (already has trial)
        print("\n🚫 Step 6: Try to Activate Trial Again (Should Fail)")
        success, data = self.activate_trial(self.user1_token)
        
        if not success and ("400" in str(data) or "déjà" in str(data).lower() or "already" in str(data).lower()):
            self.log_test("Duplicate Trial Activation", True, 
                f"Correctly rejected duplicate trial activation: {data}")
        else:
            self.log_test("Duplicate Trial Activation", False, 
                f"Should have rejected duplicate trial but got: {data}")

        # Step 7: POST /api/subscription/cancel - verify success
        print("\n❌ Step 7: Cancel Subscription")
        success, data = self.cancel_subscription(self.user1_token)
        
        if success and data.get("success"):
            self.log_test("Cancel Subscription", True, 
                f"Subscription canceled successfully: {data.get('message', '')}")
        else:
            self.log_test("Cancel Subscription", False, 
                f"Subscription cancellation failed: {data}")

        # Step 8: GET /api/subscription/status - verify status is "canceled"
        print("\n📊 Step 8: Check Subscription Status After Cancel")
        success, data = self.get_subscription_status(self.user1_token)
        
        if success:
            status = data.get("status")
            
            if status == "canceled":
                self.log_test("Subscription Status After Cancel", True, 
                    f"Correct canceled state: status={status}")
            else:
                self.log_test("Subscription Status After Cancel", False, 
                    f"Incorrect canceled state: status={status}", data)
        else:
            self.log_test("Subscription Status After Cancel", False, f"API call failed: {data}")

        # Step 9: Register another user and check they get status "none" initially
        print("\n📝 Step 9: Register User 2")
        success, data = self.register_user(
            self.user2_email, 
            "Sub Test 2", 
            "+33699999002", 
            "test123456"
        )
        
        if success:
            self.log_test("Register User 2", True, f"User 2 registered successfully")
        else:
            self.log_test("Register User 2", False, f"User 2 registration failed: {data}")
            return

        # Login User 2
        print("\n🔐 Step 9b: Login User 2")
        success, data = self.login_user(self.user2_email, "test123456")
        
        if success and "access_token" in data:
            self.user2_token = data["access_token"]
            self.log_test("Login User 2", True, "User 2 login successful")
        else:
            self.log_test("Login User 2", False, f"User 2 login failed: {data}")
            return

        # Check User 2 initial subscription status
        print("\n📊 Step 9c: Check User 2 Initial Subscription Status")
        success, data = self.get_subscription_status(self.user2_token)
        
        if success:
            status = data.get("status")
            has_access = data.get("has_access")
            
            if status == "none" and has_access == False:
                self.log_test("User 2 Initial Subscription Status", True, 
                    f"User 2 correct initial state: status={status}, has_access={has_access}")
            else:
                self.log_test("User 2 Initial Subscription Status", False, 
                    f"User 2 incorrect initial state: status={status}, has_access={has_access}", data)
        else:
            self.log_test("User 2 Initial Subscription Status", False, f"API call failed: {data}")

        # Step 10: POST /api/subscription/verify-purchase with product_id "tontine_premium_monthly" and purchase_token "test_token" - verify activation
        print("\n💳 Step 10: Verify Purchase for User 2")
        success, data = self.verify_purchase(self.user2_token, "tontine_premium_monthly", "test_token")
        
        if success:
            status = data.get("status")
            success_flag = data.get("success")
            subscription_end = data.get("subscription_end")
            
            if success_flag and status == "active" and subscription_end:
                self.log_test("Verify Purchase", True, 
                    f"Purchase verified successfully: status={status}, subscription_end={subscription_end}")
            else:
                self.log_test("Verify Purchase", False, 
                    f"Purchase verification incomplete: success={success_flag}, status={status}, subscription_end={subscription_end}", data)
        else:
            self.log_test("Verify Purchase", False, f"Purchase verification failed: {data}")

        # Final check: Verify User 2 subscription status after purchase
        print("\n📊 Step 11: Check User 2 Subscription Status After Purchase")
        success, data = self.get_subscription_status(self.user2_token)
        
        if success:
            status = data.get("status")
            has_access = data.get("has_access")
            
            if status == "active" and has_access == True:
                self.log_test("User 2 Subscription Status After Purchase", True, 
                    f"User 2 correct active state: status={status}, has_access={has_access}")
            else:
                self.log_test("User 2 Subscription Status After Purchase", False, 
                    f"User 2 incorrect active state: status={status}, has_access={has_access}", data)
        else:
            self.log_test("User 2 Subscription Status After Purchase", False, f"API call failed: {data}")

        # Print final summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📋 SUBSCRIPTION SYSTEM TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎯 SUBSCRIPTION SYSTEM API TESTING COMPLETED")
        
        # Return success status for main agent
        return passed == total

if __name__ == "__main__":
    tester = SubscriptionTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)