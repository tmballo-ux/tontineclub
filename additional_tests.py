#!/usr/bin/env python3
"""
Additional TontineClub Backend API Tests - Error Cases and Complete Flows
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://club-auth-test.preview.emergentagent.com/api"

class AdditionalAPITests:
    def __init__(self):
        self.base_url = BASE_URL
        self.results = []
        
        # Set up test users and get tokens first
        self.setup_users()
    
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
    
    def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None, params: dict = None) -> tuple:
        """Make HTTP request and return response, success status"""
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            if method == "GET":
                response = requests.get(url, headers=default_headers, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=default_headers, params=params, timeout=30)
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
    
    def setup_users(self):
        """Setup test users and get their tokens"""
        print("🔧 Setting up test users...")
        
        # Create user 1
        user1_data = {
            "email": f"testuser1_{int(datetime.now().timestamp())}@test.com",
            "password": "password123",
            "full_name": "Test User 1",
            "phone": "+1234567890"
        }
        
        response, _ = self.make_request("POST", "/auth/register", user1_data)
        if response and response.status_code == 200:
            data = response.json()
            self.user1_token = data.get("access_token")
            self.user1_data = data.get("user")
        
        # Create user 2
        user2_data = {
            "email": f"testuser2_{int(datetime.now().timestamp())}@test.com", 
            "password": "password123",
            "full_name": "Test User 2",
            "phone": "+0987654321"
        }
        
        response, _ = self.make_request("POST", "/auth/register", user2_data)
        if response and response.status_code == 200:
            data = response.json()
            self.user2_token = data.get("access_token")
            self.user2_data = data.get("user")
    
    def get_auth_headers(self, token: str) -> dict:
        """Get authorization headers with Bearer token"""
        return {"Authorization": f"Bearer {token}"}
    
    def test_forgot_password_corrected(self):
        """Test forgot password with correct query parameter format"""
        print("\n🔍 Testing Forgot Password (Corrected)...")
        
        response, success = self.make_request("POST", "/auth/forgot-password", params={"email": "test@example.com"})
        
        if not success:
            self.log_result("Forgot Password Corrected", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            self.log_result("Forgot Password Corrected", True, f"Message: {data.get('message')}")
            return True
        else:
            self.log_result("Forgot Password Corrected", False, f"Status: {response.status_code}")
            return False
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Try to get user info without token
        response, success = self.make_request("GET", "/auth/me")
        
        if not success:
            self.log_result("Unauthorized Access", False, "Request failed")
            return False
        
        if response.status_code == 403 or response.status_code == 401:
            self.log_result("Unauthorized Access", True, f"Correctly blocked with status {response.status_code}")
            return True
        else:
            self.log_result("Unauthorized Access", False, f"Unexpected status: {response.status_code}")
            return False
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        print("\n🔍 Testing Invalid Login...")
        
        invalid_data = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        
        response, success = self.make_request("POST", "/auth/login", invalid_data)
        
        if not success:
            self.log_result("Invalid Login", False, "Request failed")
            return False
        
        if response.status_code == 401:
            self.log_result("Invalid Login", True, "Correctly rejected invalid credentials")
            return True
        else:
            self.log_result("Invalid Login", False, f"Unexpected status: {response.status_code}")
            return False
    
    def test_duplicate_registration(self):
        """Test registering with existing email"""
        print("\n🔍 Testing Duplicate Registration...")
        
        # Try to register with same email as user1
        duplicate_data = {
            "email": self.user1_data["email"],
            "password": "password123",
            "full_name": "Duplicate User",
            "phone": "+9999999999"
        }
        
        response, success = self.make_request("POST", "/auth/register", duplicate_data)
        
        if not success:
            self.log_result("Duplicate Registration", False, "Request failed")
            return False
        
        if response.status_code == 400:
            self.log_result("Duplicate Registration", True, "Correctly rejected duplicate email")
            return True
        else:
            self.log_result("Duplicate Registration", False, f"Unexpected status: {response.status_code}")
            return False
    
    def test_complete_contribution_flow(self):
        """Test the complete contribution flow including confirmation and contest"""
        print("\n🔍 Testing Complete Contribution Flow...")
        
        # First create a tontine
        tontine_data = {
            "name": "Contribution Test Tontine",
            "contribution_amount": 500.0,
            "frequency": "weekly",
            "max_members": 2,
            "start_date": datetime.now().isoformat(),
            "description": "For testing contribution flow"
        }
        
        headers1 = self.get_auth_headers(self.user1_token)
        response, _ = self.make_request("POST", "/tontines", tontine_data, headers1)
        if not response or response.status_code != 200:
            self.log_result("Complete Contribution Flow - Tontine Creation", False, "Failed to create tontine")
            return False
        
        tontine = response.json()
        
        # Send invitation to user2
        inv_data = {
            "tontine_id": tontine["id"],
            "invited_email": self.user2_data["email"]
        }
        
        response, _ = self.make_request("POST", "/invitations", inv_data, headers1)
        if not response or response.status_code != 200:
            self.log_result("Complete Contribution Flow - Send Invitation", False, "Failed to send invitation")
            return False
        
        invitation = response.json()
        
        # User2 accepts invitation
        headers2 = self.get_auth_headers(self.user2_token)
        response, _ = self.make_request("POST", f"/invitations/{invitation['id']}/accept", headers=headers2)
        if not response or response.status_code != 200:
            self.log_result("Complete Contribution Flow - Accept Invitation", False, "Failed to accept invitation")
            return False
        
        # Start the tontine
        response, _ = self.make_request("POST", f"/tontines/{tontine['id']}/start", headers=headers1)
        if not response or response.status_code != 200:
            self.log_result("Complete Contribution Flow - Start Tontine", False, "Failed to start tontine")
            return False
        
        # Get cycles
        response, _ = self.make_request("GET", f"/tontines/{tontine['id']}/cycles", headers=headers1)
        if not response or response.status_code != 200:
            self.log_result("Complete Contribution Flow - Get Cycles", False, "Failed to get cycles")
            return False
        
        cycles = response.json()
        if not cycles:
            self.log_result("Complete Contribution Flow - Get Cycles", False, "No cycles found")
            return False
        
        first_cycle = cycles[0]
        
        # User1 declares payment
        declare_data = {"cycle_id": first_cycle["id"]}
        response, _ = self.make_request("POST", "/contributions/declare", declare_data, headers1)
        if not response or response.status_code != 200:
            self.log_result("Complete Contribution Flow - Declare Payment", False, f"Failed to declare payment: {response.text if response else 'No response'}")
            return False
        
        # Get contributions to find the declaration
        response, _ = self.make_request("GET", f"/tontines/{tontine['id']}/contributions", headers=headers1)
        if not response or response.status_code != 200:
            self.log_result("Complete Contribution Flow - Get Contributions", False, "Failed to get contributions")
            return False
        
        contributions = response.json()
        user1_contribution = None
        for contrib in contributions:
            if contrib["member_id"] == self.user1_data["id"] and contrib["cycle_id"] == first_cycle["id"]:
                user1_contribution = contrib
                break
        
        if not user1_contribution:
            self.log_result("Complete Contribution Flow - Find Contribution", False, "Could not find user1's contribution")
            return False
        
        # Determine who is the beneficiary and confirm the payment
        beneficiary_token = self.user1_token if first_cycle["beneficiary_id"] == self.user1_data["id"] else self.user2_token
        
        confirm_data = {"declaration_id": user1_contribution["id"]}
        response, _ = self.make_request("POST", "/contributions/confirm", confirm_data, headers=self.get_auth_headers(beneficiary_token))
        
        if response and response.status_code == 200:
            self.log_result("Complete Contribution Flow", True, "Successfully completed declaration and confirmation")
            return True
        else:
            self.log_result("Complete Contribution Flow", False, f"Failed to confirm payment: Status {response.status_code if response else 'No response'}")
            return False
    
    def test_tontine_access_control(self):
        """Test tontine access control - user shouldn't access tontines they're not members of"""
        print("\n🔍 Testing Tontine Access Control...")
        
        # User1 creates a tontine
        tontine_data = {
            "name": "Private Tontine",
            "contribution_amount": 1000.0,
            "frequency": "monthly",
            "max_members": 2,
            "start_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "description": "Private tontine for access control test"
        }
        
        headers1 = self.get_auth_headers(self.user1_token)
        response, _ = self.make_request("POST", "/tontines", tontine_data, headers1)
        
        if not response or response.status_code != 200:
            self.log_result("Tontine Access Control - Create", False, "Failed to create tontine")
            return False
        
        tontine = response.json()
        
        # User2 tries to access this tontine without being invited
        headers2 = self.get_auth_headers(self.user2_token)
        response, _ = self.make_request("GET", f"/tontines/{tontine['id']}", headers=headers2)
        
        if response and response.status_code == 403:
            self.log_result("Tontine Access Control", True, "Correctly blocked unauthorized access")
            return True
        else:
            self.log_result("Tontine Access Control", False, f"Unexpected status: {response.status_code if response else 'No response'}")
            return False
    
    def test_invalid_invitation_operations(self):
        """Test invalid invitation operations"""
        print("\n🔍 Testing Invalid Invitation Operations...")
        
        # Try to accept a non-existent invitation
        headers2 = self.get_auth_headers(self.user2_token)
        response, _ = self.make_request("POST", "/invitations/non-existent-id/accept", headers=headers2)
        
        if response and response.status_code == 404:
            self.log_result("Invalid Invitation Operations", True, "Correctly handled non-existent invitation")
            return True
        else:
            self.log_result("Invalid Invitation Operations", False, f"Unexpected status: {response.status_code if response else 'No response'}")
            return False
    
    def test_tontine_deletion(self):
        """Test tontine deletion - should only work for draft tontines"""
        print("\n🔍 Testing Tontine Deletion...")
        
        # Create a draft tontine
        tontine_data = {
            "name": "Draft Tontine for Deletion",
            "contribution_amount": 250.0,
            "frequency": "weekly",
            "max_members": 3,
            "start_date": (datetime.now() + timedelta(days=5)).isoformat(),
            "description": "Draft tontine to test deletion"
        }
        
        headers1 = self.get_auth_headers(self.user1_token)
        response, _ = self.make_request("POST", "/tontines", tontine_data, headers1)
        
        if not response or response.status_code != 200:
            self.log_result("Tontine Deletion - Create", False, "Failed to create draft tontine")
            return False
        
        tontine = response.json()
        
        # Try to delete it (should work since it's in draft status)
        response, _ = self.make_request("DELETE", f"/tontines/{tontine['id']}", headers=headers1)
        
        if response and response.status_code == 200:
            self.log_result("Tontine Deletion", True, "Successfully deleted draft tontine")
            return True
        else:
            self.log_result("Tontine Deletion", False, f"Failed to delete: Status {response.status_code if response else 'No response'}")
            return False
    
    def test_notification_management(self):
        """Test notification read functionality"""
        print("\n🔍 Testing Notification Management...")
        
        # Get notifications for user2
        headers2 = self.get_auth_headers(self.user2_token)
        response, _ = self.make_request("GET", "/notifications", headers=headers2)
        
        if not response or response.status_code != 200:
            self.log_result("Notification Management - Get", False, "Failed to get notifications")
            return False
        
        notifications = response.json()
        
        if not notifications:
            self.log_result("Notification Management", True, "No notifications to test (expected)")
            return True
        
        # Mark first notification as read
        first_notif = notifications[0]
        response, _ = self.make_request("POST", f"/notifications/{first_notif['id']}/read", headers=headers2)
        
        if response and response.status_code == 200:
            # Mark all as read
            response, _ = self.make_request("POST", "/notifications/read-all", headers=headers2)
            
            if response and response.status_code == 200:
                self.log_result("Notification Management", True, "Successfully managed notifications")
                return True
            else:
                self.log_result("Notification Management", False, "Failed to mark all as read")
                return False
        else:
            self.log_result("Notification Management", False, "Failed to mark notification as read")
            return False
    
    def run_additional_tests(self):
        """Run all additional tests"""
        print("🚀 Running Additional TontineClub Backend Tests")
        print("=" * 60)
        
        self.test_forgot_password_corrected()
        self.test_unauthorized_access()
        self.test_invalid_login() 
        self.test_duplicate_registration()
        self.test_tontine_access_control()
        self.test_invalid_invitation_operations()
        self.test_tontine_deletion()
        self.test_notification_management()
        self.test_complete_contribution_flow()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 ADDITIONAL TESTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r["success"])
        failed = len(self.results) - passed
        
        print(f"Total additional tests: {len(self.results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        
        if failed > 0:
            print("\n🔴 Failed tests:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")

if __name__ == "__main__":
    tester = AdditionalAPITests()
    tester.run_additional_tests()