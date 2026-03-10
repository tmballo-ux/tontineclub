#!/usr/bin/env python3
"""
TontineClub Backend API Test Suite
Comprehensive testing of all backend endpoints following the specified flows.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any
import time

# Base URL for testing - using the EXPO_PUBLIC_BACKEND_URL
BASE_URL = "https://tontine-app-10.preview.emergentagent.com/api"

class TontineAPITest:
    def __init__(self):
        self.base_url = BASE_URL
        self.user1_token = None
        self.user2_token = None
        self.user1_data = None
        self.user2_data = None
        self.test_tontine = None
        self.invitation = None
        self.cycles = []
        self.contributions = []
        self.results = []
        
        # Test users
        self.user1 = {
            "email": "creator@test.com", 
            "password": "password123",
            "full_name": "Test Creator",
            "phone": "+1234567890"
        }
        self.user2 = {
            "email": "member@test.com", 
            "password": "password123",
            "full_name": "Test Member",
            "phone": "+0987654321"
        }
    
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"    Details: {details}")
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None) -> tuple:
        """Make HTTP request and return response, success status"""
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            if method == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                return None, False
                
            return response, True
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None, False
    
    def get_auth_headers(self, token: str) -> dict:
        """Get authorization headers with Bearer token"""
        return {"Authorization": f"Bearer {token}"}
    
    def test_health_check(self):
        """Test basic health endpoint"""
        print("\n🔍 Testing Health Check...")
        
        response, success = self.make_request("GET", "/health")
        if not success:
            self.log_result("Health Check", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.log_result("Health Check", True, f"Status: {response.json()}")
            return True
        else:
            self.log_result("Health Check", False, f"Status: {response.status_code}")
            return False
    
    def test_user_registration(self):
        """Test user registration for both users"""
        print("\n🔍 Testing User Registration...")
        
        # Register User 1
        response, success = self.make_request("POST", "/auth/register", self.user1)
        if not success:
            self.log_result("User 1 Registration", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            self.user1_token = data.get("access_token")
            self.user1_data = data.get("user")
            self.log_result("User 1 Registration", True, f"User ID: {self.user1_data.get('id')}")
        else:
            self.log_result("User 1 Registration", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
        
        # Register User 2
        response, success = self.make_request("POST", "/auth/register", self.user2)
        if not success:
            self.log_result("User 2 Registration", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            self.user2_token = data.get("access_token")
            self.user2_data = data.get("user")
            self.log_result("User 2 Registration", True, f"User ID: {self.user2_data.get('id')}")
            return True
        else:
            self.log_result("User 2 Registration", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    
    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "email": self.user1["email"],
            "password": self.user1["password"]
        }
        
        response, success = self.make_request("POST", "/auth/login", login_data)
        if not success:
            self.log_result("User Login", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            self.log_result("User Login", True, f"Token received: {token[:20]}...")
            return True
        else:
            self.log_result("User Login", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    
    def test_get_me(self):
        """Test get current user info"""
        print("\n🔍 Testing Get Current User...")
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", "/auth/me", headers=headers)
        
        if not success:
            self.log_result("Get Current User", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            self.log_result("Get Current User", True, f"Email: {data.get('email')}")
            return True
        else:
            self.log_result("Get Current User", False, f"Status: {response.status_code}")
            return False
    
    def test_profile_update(self):
        """Test profile update"""
        print("\n🔍 Testing Profile Update...")
        
        update_data = {
            "full_name": "Updated Creator Name",
            "phone": "+1111111111"
        }
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("PUT", "/auth/profile", update_data, headers)
        
        if not success:
            self.log_result("Profile Update", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            self.log_result("Profile Update", True, f"New name: {data.get('full_name')}")
            return True
        else:
            self.log_result("Profile Update", False, f"Status: {response.status_code}")
            return False
    
    def test_forgot_password(self):
        """Test forgot password endpoint"""
        print("\n🔍 Testing Forgot Password...")
        
        response, success = self.make_request("POST", "/auth/forgot-password", self.user1["email"])
        
        if not success:
            self.log_result("Forgot Password", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.log_result("Forgot Password", True, "Email reset message sent")
            return True
        else:
            self.log_result("Forgot Password", False, f"Status: {response.status_code}")
            return False
    
    def test_create_tontine(self):
        """Test tontine creation"""
        print("\n🔍 Testing Tontine Creation...")
        
        tontine_data = {
            "name": "Test Tontine Group",
            "contribution_amount": 1000.0,
            "frequency": "monthly",
            "max_members": 3,
            "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "description": "Test tontine for API testing"
        }
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("POST", "/tontines", tontine_data, headers)
        
        if not success:
            self.log_result("Create Tontine", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.test_tontine = response.json()
            self.log_result("Create Tontine", True, f"Tontine ID: {self.test_tontine.get('id')}")
            return True
        else:
            self.log_result("Create Tontine", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    
    def test_get_tontines(self):
        """Test get user's tontines"""
        print("\n🔍 Testing Get Tontines...")
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", "/tontines", headers=headers)
        
        if not success:
            self.log_result("Get Tontines", False, "Request failed")
            return False
        
        if response.status_code == 200:
            tontines = response.json()
            self.log_result("Get Tontines", True, f"Found {len(tontines)} tontines")
            return True
        else:
            self.log_result("Get Tontines", False, f"Status: {response.status_code}")
            return False
    
    def test_get_tontine_detail(self):
        """Test get tontine details"""
        print("\n🔍 Testing Get Tontine Detail...")
        
        if not self.test_tontine:
            self.log_result("Get Tontine Detail", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", f"/tontines/{self.test_tontine['id']}", headers=headers)
        
        if not success:
            self.log_result("Get Tontine Detail", False, "Request failed")
            return False
        
        if response.status_code == 200:
            tontine = response.json()
            self.log_result("Get Tontine Detail", True, f"Name: {tontine.get('name')}")
            return True
        else:
            self.log_result("Get Tontine Detail", False, f"Status: {response.status_code}")
            return False
    
    def test_update_tontine(self):
        """Test tontine update"""
        print("\n🔍 Testing Update Tontine...")
        
        if not self.test_tontine:
            self.log_result("Update Tontine", False, "No tontine to test")
            return False
        
        update_data = {
            "name": "Updated Tontine Name",
            "description": "Updated description for testing"
        }
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("PUT", f"/tontines/{self.test_tontine['id']}", update_data, headers)
        
        if not success:
            self.log_result("Update Tontine", False, "Request failed")
            return False
        
        if response.status_code == 200:
            updated_tontine = response.json()
            self.log_result("Update Tontine", True, f"New name: {updated_tontine.get('name')}")
            return True
        else:
            self.log_result("Update Tontine", False, f"Status: {response.status_code}")
            return False
    
    def test_send_invitation(self):
        """Test sending invitation"""
        print("\n🔍 Testing Send Invitation...")
        
        if not self.test_tontine:
            self.log_result("Send Invitation", False, "No tontine to test")
            return False
        
        invitation_data = {
            "tontine_id": self.test_tontine["id"],
            "invited_email": self.user2["email"]
        }
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("POST", "/invitations", invitation_data, headers)
        
        if not success:
            self.log_result("Send Invitation", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.invitation = response.json()
            self.log_result("Send Invitation", True, f"Invitation ID: {self.invitation.get('id')}")
            return True
        else:
            self.log_result("Send Invitation", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    
    def test_get_received_invitations(self):
        """Test get received invitations"""
        print("\n🔍 Testing Get Received Invitations...")
        
        headers = self.get_auth_headers(self.user2_token)
        response, success = self.make_request("GET", "/invitations/received", headers=headers)
        
        if not success:
            self.log_result("Get Received Invitations", False, "Request failed")
            return False
        
        if response.status_code == 200:
            invitations = response.json()
            self.log_result("Get Received Invitations", True, f"Found {len(invitations)} invitations")
            return True
        else:
            self.log_result("Get Received Invitations", False, f"Status: {response.status_code}")
            return False
    
    def test_accept_invitation(self):
        """Test accepting invitation"""
        print("\n🔍 Testing Accept Invitation...")
        
        if not self.invitation:
            self.log_result("Accept Invitation", False, "No invitation to test")
            return False
        
        headers = self.get_auth_headers(self.user2_token)
        response, success = self.make_request("POST", f"/invitations/{self.invitation['id']}/accept", headers=headers)
        
        if not success:
            self.log_result("Accept Invitation", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.log_result("Accept Invitation", True, "Invitation accepted successfully")
            return True
        else:
            self.log_result("Accept Invitation", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    
    def test_get_tontine_members(self):
        """Test get tontine members"""
        print("\n🔍 Testing Get Tontine Members...")
        
        if not self.test_tontine:
            self.log_result("Get Tontine Members", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", f"/tontines/{self.test_tontine['id']}/members", headers=headers)
        
        if not success:
            self.log_result("Get Tontine Members", False, "Request failed")
            return False
        
        if response.status_code == 200:
            members = response.json()
            self.log_result("Get Tontine Members", True, f"Found {len(members)} members")
            return True
        else:
            self.log_result("Get Tontine Members", False, f"Status: {response.status_code}")
            return False
    
    def test_randomize_beneficiary_order(self):
        """Test randomize beneficiary order"""
        print("\n🔍 Testing Randomize Beneficiary Order...")
        
        if not self.test_tontine:
            self.log_result("Randomize Beneficiary Order", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("POST", f"/tontines/{self.test_tontine['id']}/randomize-order", headers=headers)
        
        if not success:
            self.log_result("Randomize Beneficiary Order", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.log_result("Randomize Beneficiary Order", True, "Order randomized successfully")
            return True
        else:
            self.log_result("Randomize Beneficiary Order", False, f"Status: {response.status_code}")
            return False
    
    def test_start_tontine(self):
        """Test starting tontine"""
        print("\n🔍 Testing Start Tontine...")
        
        if not self.test_tontine:
            self.log_result("Start Tontine", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("POST", f"/tontines/{self.test_tontine['id']}/start", headers=headers)
        
        if not success:
            self.log_result("Start Tontine", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.log_result("Start Tontine", True, "Tontine started successfully")
            return True
        else:
            self.log_result("Start Tontine", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    
    def test_get_cycles(self):
        """Test get tontine cycles"""
        print("\n🔍 Testing Get Cycles...")
        
        if not self.test_tontine:
            self.log_result("Get Cycles", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", f"/tontines/{self.test_tontine['id']}/cycles", headers=headers)
        
        if not success:
            self.log_result("Get Cycles", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.cycles = response.json()
            self.log_result("Get Cycles", True, f"Found {len(self.cycles)} cycles")
            return True
        else:
            self.log_result("Get Cycles", False, f"Status: {response.status_code}")
            return False
    
    def test_get_current_cycle(self):
        """Test get current cycle"""
        print("\n🔍 Testing Get Current Cycle...")
        
        if not self.test_tontine:
            self.log_result("Get Current Cycle", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", f"/tontines/{self.test_tontine['id']}/current-cycle", headers=headers)
        
        if not success:
            self.log_result("Get Current Cycle", False, "Request failed")
            return False
        
        if response.status_code == 200:
            current_cycle = response.json()
            if current_cycle:
                self.log_result("Get Current Cycle", True, f"Current cycle: {current_cycle.get('cycle', {}).get('cycle_number')}")
            else:
                self.log_result("Get Current Cycle", True, "No current cycle (expected if not started)")
            return True
        else:
            self.log_result("Get Current Cycle", False, f"Status: {response.status_code}")
            return False
    
    def test_declare_payment(self):
        """Test declare payment"""
        print("\n🔍 Testing Declare Payment...")
        
        if not self.cycles:
            self.log_result("Declare Payment", False, "No cycles available")
            return False
        
        cycle_id = self.cycles[0]["id"]
        declare_data = {"cycle_id": cycle_id}
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("POST", "/contributions/declare", declare_data, headers)
        
        if not success:
            self.log_result("Declare Payment", False, "Request failed")
            return False
        
        if response.status_code == 200:
            self.log_result("Declare Payment", True, "Payment declared successfully")
            return True
        else:
            self.log_result("Declare Payment", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    
    def test_get_contributions(self):
        """Test get tontine contributions"""
        print("\n🔍 Testing Get Contributions...")
        
        if not self.test_tontine:
            self.log_result("Get Contributions", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", f"/tontines/{self.test_tontine['id']}/contributions", headers=headers)
        
        if not success:
            self.log_result("Get Contributions", False, "Request failed")
            return False
        
        if response.status_code == 200:
            contributions = response.json()
            self.log_result("Get Contributions", True, f"Found {len(contributions)} contributions")
            return True
        else:
            self.log_result("Get Contributions", False, f"Status: {response.status_code}")
            return False
    
    def test_get_notifications(self):
        """Test get notifications"""
        print("\n🔍 Testing Get Notifications...")
        
        headers = self.get_auth_headers(self.user2_token)  # Use user2 to see invitation notifications
        response, success = self.make_request("GET", "/notifications", headers=headers)
        
        if not success:
            self.log_result("Get Notifications", False, "Request failed")
            return False
        
        if response.status_code == 200:
            notifications = response.json()
            self.log_result("Get Notifications", True, f"Found {len(notifications)} notifications")
            return True
        else:
            self.log_result("Get Notifications", False, f"Status: {response.status_code}")
            return False
    
    def test_get_unread_count(self):
        """Test get unread notifications count"""
        print("\n🔍 Testing Get Unread Count...")
        
        headers = self.get_auth_headers(self.user2_token)
        response, success = self.make_request("GET", "/notifications/unread-count", headers=headers)
        
        if not success:
            self.log_result("Get Unread Count", False, "Request failed")
            return False
        
        if response.status_code == 200:
            count_data = response.json()
            self.log_result("Get Unread Count", True, f"Unread count: {count_data.get('count')}")
            return True
        else:
            self.log_result("Get Unread Count", False, f"Status: {response.status_code}")
            return False
    
    def test_dashboard(self):
        """Test dashboard endpoint"""
        print("\n🔍 Testing Dashboard...")
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", "/dashboard", headers=headers)
        
        if not success:
            self.log_result("Dashboard", False, "Request failed")
            return False
        
        if response.status_code == 200:
            dashboard = response.json()
            self.log_result("Dashboard", True, f"Active tontines: {dashboard.get('active_tontines_count')}")
            return True
        else:
            self.log_result("Dashboard", False, f"Status: {response.status_code}")
            return False
    
    def test_history(self):
        """Test tontine history"""
        print("\n🔍 Testing Tontine History...")
        
        if not self.test_tontine:
            self.log_result("Tontine History", False, "No tontine to test")
            return False
        
        headers = self.get_auth_headers(self.user1_token)
        response, success = self.make_request("GET", f"/tontines/{self.test_tontine['id']}/history", headers=headers)
        
        if not success:
            self.log_result("Tontine History", False, "Request failed")
            return False
        
        if response.status_code == 200:
            history = response.json()
            self.log_result("Tontine History", True, f"Found {len(history)} completed cycles")
            return True
        else:
            self.log_result("Tontine History", False, f"Status: {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting TontineClub Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic tests
        if not self.test_health_check():
            return
        
        # Authentication flow
        if not self.test_user_registration():
            return
        
        if not self.test_user_login():
            return
        
        if not self.test_get_me():
            return
        
        self.test_profile_update()
        self.test_forgot_password()
        
        # Tontine CRUD flow
        if not self.test_create_tontine():
            return
        
        self.test_get_tontines()
        self.test_get_tontine_detail()
        self.test_update_tontine()
        
        # Invitation flow
        if not self.test_send_invitation():
            return
        
        self.test_get_received_invitations()
        
        if not self.test_accept_invitation():
            return
        
        # Member and beneficiary management
        self.test_get_tontine_members()
        self.test_randomize_beneficiary_order()
        
        # Cycle management
        if not self.test_start_tontine():
            return
        
        self.test_get_cycles()
        self.test_get_current_cycle()
        
        # Contributions
        self.test_declare_payment()
        self.test_get_contributions()
        
        # Notifications
        self.test_get_notifications()
        self.test_get_unread_count()
        
        # Dashboard and history
        self.test_dashboard()
        self.test_history()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r["success"])
        failed = len(self.results) - passed
        
        print(f"Total tests: {len(self.results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        
        if failed > 0:
            print("\n🔴 Failed tests:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        success_rate = (passed / len(self.results)) * 100 if self.results else 0
        print(f"\n📈 Success rate: {success_rate:.1f}%")

if __name__ == "__main__":
    print("TontineClub Backend API Test Suite")
    print("=" * 50)
    
    tester = TontineAPITest()
    tester.run_all_tests()