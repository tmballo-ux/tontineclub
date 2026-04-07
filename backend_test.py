#!/usr/bin/env python3
"""
TontineClub Backend API Testing - Auth Flow & Subscription Endpoints
Focus: Logout/cleanup feature and protected route guards
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Backend URL from review request
BASE_URL = "https://logout-cleanup-fix.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "t.mballo@gmail.com"
ADMIN_PASSWORD = "REDACTED_ADMIN_PASSWORD"
TEST_EMAIL = "test@tontineclub.com"
TEST_PASSWORD = "Test123!"

class TontineClubTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_token = None
        self.new_user_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append(f"{status}: {test_name}")
        if details:
            self.test_results.append(f"    {details}")
        print(f"{status}: {test_name}")
        if details:
            print(f"    {details}")
    
    def test_admin_login_with_subscription(self):
        """Test 1: POST /api/auth/login with admin credentials → verify subscription object in response"""
        try:
            response = self.session.post(f"{API_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ["access_token", "user", "subscription"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Admin Login", False, f"Missing fields: {missing_fields}")
                    return
                
                # Verify subscription object structure
                subscription = data["subscription"]
                sub_required = ["status", "has_access", "trial_end", "subscription_end", "plan"]
                sub_missing = [field for field in sub_required if field not in subscription]
                
                if sub_missing:
                    self.log_test("Admin Login", False, f"Missing subscription fields: {sub_missing}")
                    return
                
                self.admin_token = data["access_token"]
                self.log_test("Admin Login", True, 
                    f"Status: {subscription['status']}, Access: {subscription['has_access']}")
                
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
    
    def test_invalid_login(self):
        """Test 2: POST /api/auth/login with invalid credentials → verify proper error"""
        try:
            response = self.session.post(f"{API_URL}/auth/login", json={
                "email": "invalid@test.com",
                "password": "wrongpassword"
            })
            
            if response.status_code == 401:
                data = response.json()
                if "detail" in data:
                    self.log_test("Invalid Login", True, f"Proper 401 error: {data['detail']}")
                else:
                    self.log_test("Invalid Login", False, "401 but no error detail")
            else:
                self.log_test("Invalid Login", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Login", False, f"Exception: {str(e)}")
    
    def test_new_user_registration(self):
        """Test 3: POST /api/auth/register with a new unique user → verify auto-trial subscription in response"""
        try:
            # Generate unique email
            unique_id = str(uuid.uuid4())[:8]
            new_email = f"authtest{unique_id}@test.com"
            
            response = self.session.post(f"{API_URL}/auth/register", json={
                "email": new_email,
                "password": "Test123!",
                "full_name": "Auth Test User",
                "phone": "+33699999999",
                "preferred_currency": "XOF"
            })
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ["access_token", "user", "subscription"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("New User Registration", False, f"Missing fields: {missing_fields}")
                    return
                
                # Verify auto-trial subscription
                subscription = data["subscription"]
                if subscription.get("status") == "trialing" and subscription.get("has_access") == True:
                    self.new_user_token = data["access_token"]
                    self.log_test("New User Registration", True, 
                        f"Auto-trial activated: {subscription['status']}, Access: {subscription['has_access']}")
                else:
                    self.log_test("New User Registration", False, 
                        f"Auto-trial failed: Status={subscription.get('status')}, Access={subscription.get('has_access')}")
                
            else:
                self.log_test("New User Registration", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("New User Registration", False, f"Exception: {str(e)}")
    
    def test_subscription_status_with_token(self):
        """Test 4: GET /api/subscription/status with valid token → verify proper status"""
        if not self.new_user_token:
            self.log_test("Subscription Status (With Token)", False, "No new user token available")
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.new_user_token}"}
            response = self.session.get(f"{API_URL}/subscription/status", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ["status", "has_access", "trial_end", "subscription_end", "plan"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Subscription Status (With Token)", False, f"Missing fields: {missing_fields}")
                    return
                
                self.log_test("Subscription Status (With Token)", True, 
                    f"Status: {data['status']}, Access: {data['has_access']}")
                
            else:
                self.log_test("Subscription Status (With Token)", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Subscription Status (With Token)", False, f"Exception: {str(e)}")
    
    def test_dashboard_with_token(self):
        """Test 5: GET /api/dashboard with valid token → verify dashboard data"""
        if not self.admin_token:
            self.log_test("Dashboard (With Token)", False, "No admin token available")
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{API_URL}/dashboard", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required dashboard fields
                required_fields = [
                    "active_tontines_count", "total_tontines_count", "pending_invitations_count",
                    "next_beneficiary", "pending_confirmations_count", "financial_summary", "recent_tontines"
                ]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Dashboard (With Token)", False, f"Missing fields: {missing_fields}")
                    return
                
                # Verify financial_summary structure
                financial = data.get("financial_summary", {})
                fin_required = ["total_contributed", "total_received", "balance"]
                fin_missing = [field for field in fin_required if field not in financial]
                
                if fin_missing:
                    self.log_test("Dashboard (With Token)", False, f"Missing financial_summary fields: {fin_missing}")
                    return
                
                self.log_test("Dashboard (With Token)", True, 
                    f"Active tontines: {data['active_tontines_count']}, Total: {data['total_tontines_count']}")
                
            else:
                self.log_test("Dashboard (With Token)", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Dashboard (With Token)", False, f"Exception: {str(e)}")
    
    def test_dashboard_without_token(self):
        """Test 6: GET /api/dashboard WITHOUT token → verify 401 Unauthorized (route guard backend)"""
        try:
            response = self.session.get(f"{API_URL}/dashboard")
            
            if response.status_code in [401, 403]:
                self.log_test("Dashboard (Without Token)", True, f"Proper {response.status_code} Unauthorized")
            else:
                self.log_test("Dashboard (Without Token)", False, 
                    f"Expected 401/403, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Dashboard (Without Token)", False, f"Exception: {str(e)}")
    
    def test_subscription_status_without_token(self):
        """Test 7: GET /api/subscription/status WITHOUT token → verify 401/403"""
        try:
            response = self.session.get(f"{API_URL}/subscription/status")
            
            if response.status_code in [401, 403]:
                self.log_test("Subscription Status (Without Token)", True, f"Proper {response.status_code} Unauthorized")
            else:
                self.log_test("Subscription Status (Without Token)", False, 
                    f"Expected 401/403, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Subscription Status (Without Token)", False, f"Exception: {str(e)}")
    
    def test_existing_test_user_login(self):
        """Bonus: Test existing test user login"""
        try:
            response = self.session.post(f"{API_URL}/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                subscription = data.get("subscription", {})
                self.test_token = data["access_token"]
                self.log_test("Test User Login", True, 
                    f"Status: {subscription.get('status')}, Access: {subscription.get('has_access')}")
            else:
                self.log_test("Test User Login", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Test User Login", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🎯 TontineClub Auth & Subscription Flow Testing")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Core tests from review request
        self.test_admin_login_with_subscription()
        self.test_invalid_login()
        self.test_new_user_registration()
        self.test_subscription_status_with_token()
        self.test_dashboard_with_token()
        self.test_dashboard_without_token()
        self.test_subscription_status_without_token()
        
        # Bonus test
        self.test_existing_test_user_login()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result)
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result)
        total = passed + failed
        
        for result in self.test_results:
            print(result)
        
        print(f"\n🎯 FINAL RESULTS: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
        
        if failed == 0:
            print("🚀 All tests PASSED! Auth & Subscription Flow is fully functional.")
        else:
            print(f"⚠️  {failed} test(s) FAILED. Review issues above.")
        
        return passed, failed, total

if __name__ == "__main__":
    tester = TontineClubTester()
    tester.run_all_tests()