#!/usr/bin/env python3
"""
TontineClub Account Deletion and Account Stats API Testing
Testing the new account management endpoints as per review request.
"""

import requests
import json
import time
import sys
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://tontine-dashboard-1.preview.emergentagent.com/api"

class TontineClubTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.user_a_token = None
        self.user_b_token = None
        self.user_a_data = None
        self.user_b_data = None
        self.tontine_id = None
        # Use timestamp to make emails unique
        self.timestamp = int(time.time())
        self.user_a_email = f"admin_del_{self.timestamp}@test.com"
        self.user_b_email = f"member_del_{self.timestamp}@test.com"

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

    def create_tontine(self, token, name="Test Tontine", contribution_amount=5000):
        """Create a tontine"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/tontines", 
                headers=headers,
                json={
                    "name": name,
                    "description": "Test tontine for account deletion testing",
                    "contribution_amount": contribution_amount,
                    "currency": "XOF",
                    "frequency": "monthly",
                    "max_members": 5,
                    "start_date": "2025-02-01T00:00:00Z"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def get_account_stats(self, token):
        """Test GET /api/account/stats endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/account/stats", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def check_account_deletion(self, token):
        """Test GET /api/account/check-deletion endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/account/check-deletion", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, response.json() if response.content else {"error": f"Status {response.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}

    def delete_account(self, token, password, confirm=True):
        """Test POST /api/account/delete endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/account/delete", 
                headers=headers,
                json={
                    "password": password,
                    "confirm": confirm
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
        """Run the comprehensive test flow as specified in review request"""
        print("🚀 Starting TontineClub Account Deletion and Stats API Testing")
        print("=" * 70)
        
        # Step 1: Register User A (admin_del@test.com)
        print("\n📝 Step 1: Register User A (Admin)")
        success, data = self.register_user(
            self.user_a_email, 
            "Admin Deletion Test", 
            "+33600111001", 
            "test123456"
        )
        
        if success:
            self.user_a_data = data
            self.log_test("Register User A", True, f"User registered successfully")
        else:
            self.log_test("Register User A", False, f"Registration failed: {data}")
            return

        # Step 2: Login User A
        print("\n🔐 Step 2: Login User A")
        success, data = self.login_user(self.user_a_email, "test123456")
        
        if success and "access_token" in data:
            self.user_a_token = data["access_token"]
            self.log_test("Login User A", True, "Login successful")
        else:
            self.log_test("Login User A", False, f"Login failed: {data}")
            return

        # Step 3: Test GET /api/account/stats for User A (empty state)
        print("\n📊 Step 3: Test Account Stats (Empty State)")
        success, data = self.get_account_stats(self.user_a_token)
        
        if success:
            required_fields = ["active_tontines", "completed_tontines", "total_participations", "pending_invitations"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_test("Account Stats API - Empty State", True, 
                    f"All required fields present: {data}")
            else:
                self.log_test("Account Stats API - Empty State", False, 
                    f"Missing fields: {missing_fields}", data)
        else:
            self.log_test("Account Stats API - Empty State", False, f"API call failed: {data}")

        # Step 4: Create a tontine as User A
        print("\n🏦 Step 4: Create Tontine as User A")
        success, data = self.create_tontine(self.user_a_token, "Admin Test Tontine")
        
        if success:
            self.tontine_id = data.get("id")
            self.log_test("Create Tontine", True, f"Tontine created with ID: {self.tontine_id}")
        else:
            self.log_test("Create Tontine", False, f"Tontine creation failed: {data}")
            return

        # Step 5: Test GET /api/account/check-deletion for User A (should be blocked)
        print("\n🚫 Step 5: Test Account Deletion Check - User A (Admin)")
        success, data = self.check_account_deletion(self.user_a_token)
        
        if success:
            can_delete = data.get("can_delete", True)
            blockers = data.get("blockers", [])
            
            if not can_delete and len(blockers) > 0:
                admin_blocker = any(b.get("type") == "admin_tontine" for b in blockers)
                if admin_blocker:
                    self.log_test("Account Deletion Check - Admin Blocked", True, 
                        f"Correctly blocked admin from deletion. Blockers: {len(blockers)}")
                else:
                    self.log_test("Account Deletion Check - Admin Blocked", False, 
                        f"Blocked but no admin_tontine blocker found", data)
            else:
                self.log_test("Account Deletion Check - Admin Blocked", False, 
                    f"Admin should be blocked but can_delete={can_delete}", data)
        else:
            self.log_test("Account Deletion Check - Admin Blocked", False, f"API call failed: {data}")

        # Step 6: Register User B (member_del@test.com)
        print("\n📝 Step 6: Register User B (Member)")
        success, data = self.register_user(
            self.user_b_email, 
            "Member Deletion", 
            "+33600111002", 
            "test123456"
        )
        
        if success:
            self.user_b_data = data
            self.log_test("Register User B", True, f"User registered successfully")
        else:
            self.log_test("Register User B", False, f"Registration failed: {data}")
            return

        # Step 7: Login User B
        print("\n🔐 Step 7: Login User B")
        success, data = self.login_user(self.user_b_email, "test123456")
        
        if success and "access_token" in data:
            self.user_b_token = data["access_token"]
            self.log_test("Login User B", True, "Login successful")
        else:
            self.log_test("Login User B", False, f"Login failed: {data}")
            return

        # Step 8: Test GET /api/account/check-deletion for User B (should be allowed)
        print("\n✅ Step 8: Test Account Deletion Check - User B (Member)")
        success, data = self.check_account_deletion(self.user_b_token)
        
        if success:
            can_delete = data.get("can_delete", False)
            blockers = data.get("blockers", [])
            
            if can_delete and len(blockers) == 0:
                self.log_test("Account Deletion Check - Member Allowed", True, 
                    f"Member correctly allowed to delete account")
            else:
                self.log_test("Account Deletion Check - Member Allowed", False, 
                    f"Member should be allowed but can_delete={can_delete}, blockers={len(blockers)}", data)
        else:
            self.log_test("Account Deletion Check - Member Allowed", False, f"API call failed: {data}")

        # Step 9: Test POST /api/account/delete with wrong password
        print("\n🔒 Step 9: Test Account Deletion - Wrong Password")
        success, data = self.delete_account(self.user_b_token, "wrongpassword", True)
        
        if not success and ("400" in str(data) or "Mot de passe incorrect" in str(data)):
            self.log_test("Account Deletion - Wrong Password", True, 
                f"Correctly rejected wrong password")
        else:
            self.log_test("Account Deletion - Wrong Password", False, 
                f"Should have rejected wrong password but got: {data}")

        # Step 10: Test POST /api/account/delete with correct password and confirm=true
        print("\n🗑️ Step 10: Test Account Deletion - Correct Password")
        success, data = self.delete_account(self.user_b_token, "test123456", True)
        
        if success and data.get("success"):
            self.log_test("Account Deletion - Success", True, 
                f"Account deleted successfully: {data.get('message', '')}")
        else:
            self.log_test("Account Deletion - Success", False, 
                f"Account deletion failed: {data}")

        # Step 11: Try to login as User B again (should fail)
        print("\n🚫 Step 11: Verify User B Cannot Login After Deletion")
        success, data = self.login_user(self.user_b_email, "test123456")
        
        if not success:
            self.log_test("Login After Deletion - Blocked", True, 
                f"Correctly blocked login after account deletion")
        else:
            self.log_test("Login After Deletion - Blocked", False, 
                f"Should have blocked login but succeeded: {data}")

        # Step 12: Test Account Stats for User A after creating tontine
        print("\n📊 Step 12: Test Account Stats - User A (With Tontine)")
        success, data = self.get_account_stats(self.user_a_token)
        
        if success:
            active_tontines = data.get("active_tontines", 0)
            total_participations = data.get("total_participations", 0)
            
            if active_tontines >= 1 and total_participations >= 1:
                self.log_test("Account Stats API - With Data", True, 
                    f"Stats updated correctly: active={active_tontines}, total={total_participations}")
            else:
                self.log_test("Account Stats API - With Data", False, 
                    f"Stats not updated correctly: {data}")
        else:
            self.log_test("Account Stats API - With Data", False, f"API call failed: {data}")

        # Print final summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📋 TEST SUMMARY")
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
        
        print("\n🎯 ACCOUNT DELETION & STATS API TESTING COMPLETED")
        
        # Return success status for main agent
        return passed == total

if __name__ == "__main__":
    tester = TontineClubTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)