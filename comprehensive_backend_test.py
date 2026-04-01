#!/usr/bin/env python3
"""
TontineClub Comprehensive Backend API Testing
Testing ALL endpoints as per review request for Play Store submission.
"""

import requests
import json
import time
import sys
from datetime import datetime
import uuid

# Base URL from frontend/.env
BASE_URL = "https://tontine-prod-ready.preview.emergentagent.com/api"

class ComprehensiveTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.user_token = None
        self.user2_token = None
        # Use timestamp to make emails unique
        self.timestamp = int(time.time())
        self.user_email = f"comprehensive_test_{self.timestamp}@test.com"
        self.user2_email = f"comprehensive_test2_{self.timestamp}@test.com"
        self.tontine_id = None
        self.invitation_id = None

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

    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    self.log_test("Health Check", True, f"Status: {data.get('status')}, Service: {data.get('service')}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_register(self, email, full_name, phone, password, preferred_currency="XOF"):
        """Test POST /api/auth/register"""
        try:
            response = self.session.post(f"{self.base_url}/auth/register", json={
                "email": email,
                "full_name": full_name,
                "phone": phone,
                "password": password,
                "preferred_currency": preferred_currency
            })
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.log_test("User Registration", True, f"User {email} registered successfully")
                    return True, data["access_token"]
                else:
                    self.log_test("User Registration", False, f"Missing token or user in response: {data}")
                    return False, None
            else:
                self.log_test("User Registration", False, f"Status {response.status_code}: {response.text}")
                return False, None
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False, None

    def test_login(self, email, password, should_succeed=True):
        """Test POST /api/auth/login"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json={
                "email": email,
                "password": password
            })
            
            if should_succeed:
                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        self.log_test("User Login (Valid)", True, f"Login successful for {email}")
                        return True, data["access_token"]
                    else:
                        self.log_test("User Login (Valid)", False, f"Missing token: {data}")
                        return False, None
                else:
                    self.log_test("User Login (Valid)", False, f"Status {response.status_code}: {response.text}")
                    return False, None
            else:
                if response.status_code == 401:
                    self.log_test("User Login (Invalid)", True, "Correctly rejected invalid credentials")
                    return True, None
                else:
                    self.log_test("User Login (Invalid)", False, f"Should have returned 401 but got {response.status_code}")
                    return False, None
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False, None

    def test_forgot_password(self, email):
        """Test POST /api/auth/forgot-password"""
        try:
            response = self.session.post(f"{self.base_url}/auth/forgot-password", json={
                "email": email
            })
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Forgot Password", True, f"Forgot password request processed: {data['message']}")
                    return True
                else:
                    self.log_test("Forgot Password", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Forgot Password", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Forgot Password", False, f"Exception: {str(e)}")
            return False

    def test_change_password(self, token, current_password, new_password, should_succeed=True):
        """Test POST /api/auth/change-password"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/auth/change-password", 
                headers=headers,
                json={
                    "current_password": current_password,
                    "new_password": new_password
                }
            )
            
            if should_succeed:
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Change Password (Valid)", True, f"Password changed successfully: {data.get('message', '')}")
                    return True
                else:
                    self.log_test("Change Password (Valid)", False, f"Status {response.status_code}: {response.text}")
                    return False
            else:
                if response.status_code == 400:
                    data = response.json()
                    self.log_test("Change Password (Invalid)", True, f"Correctly rejected: {data.get('detail', '')}")
                    return True
                else:
                    self.log_test("Change Password (Invalid)", False, f"Should have returned 400 but got {response.status_code}")
                    return False
        except Exception as e:
            self.log_test("Change Password", False, f"Exception: {str(e)}")
            return False

    def test_get_me(self, token):
        """Test GET /api/auth/me"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_test("Get User Info", True, f"User info retrieved: {data['email']}")
                    return True
                else:
                    self.log_test("Get User Info", False, f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Get User Info", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get User Info", False, f"Exception: {str(e)}")
            return False

    def test_update_profile(self, token):
        """Test PUT /api/auth/profile"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.put(f"{self.base_url}/auth/profile", 
                headers=headers,
                json={
                    "full_name": "Updated Test User",
                    "phone": "+33699999999"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("full_name") == "Updated Test User":
                    self.log_test("Update Profile", True, "Profile updated successfully")
                    return True
                else:
                    self.log_test("Update Profile", False, f"Profile not updated correctly: {data}")
                    return False
            else:
                self.log_test("Update Profile", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Update Profile", False, f"Exception: {str(e)}")
            return False

    def test_subscription_status(self, token):
        """Test GET /api/subscription/status"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/subscription/status", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "has_access" in data:
                    self.log_test("Subscription Status", True, f"Status: {data['status']}, Access: {data['has_access']}")
                    return True
                else:
                    self.log_test("Subscription Status", False, f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Subscription Status", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Subscription Status", False, f"Exception: {str(e)}")
            return False

    def test_activate_trial(self, token):
        """Test POST /api/subscription/activate-trial"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/subscription/activate-trial", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("status") == "trialing":
                    self.log_test("Activate Trial", True, f"Trial activated: {data.get('message', '')}")
                    return True
                else:
                    self.log_test("Activate Trial", False, f"Trial activation failed: {data}")
                    return False
            else:
                self.log_test("Activate Trial", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Activate Trial", False, f"Exception: {str(e)}")
            return False

    def test_cancel_subscription(self, token):
        """Test POST /api/subscription/cancel"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/subscription/cancel", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Cancel Subscription", True, f"Subscription canceled: {data.get('message', '')}")
                    return True
                else:
                    self.log_test("Cancel Subscription", False, f"Cancellation failed: {data}")
                    return False
            else:
                self.log_test("Cancel Subscription", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Cancel Subscription", False, f"Exception: {str(e)}")
            return False

    def test_create_tontine(self, token):
        """Test POST /api/tontines"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            tontine_data = {
                "name": f"Test Tontine {self.timestamp}",
                "contribution_amount": 5000,
                "currency": "XOF",
                "frequency": "monthly",
                "max_members": 5,
                "start_date": "2025-02-01T00:00:00Z",
                "description": "Test tontine for comprehensive testing"
            }
            
            response = self.session.post(f"{self.base_url}/tontines", 
                headers=headers,
                json=tontine_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("name") == tontine_data["name"]:
                    self.tontine_id = data["id"]
                    self.log_test("Create Tontine", True, f"Tontine created: {data['name']}")
                    return True
                else:
                    self.log_test("Create Tontine", False, f"Tontine creation failed: {data}")
                    return False
            else:
                self.log_test("Create Tontine", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Tontine", False, f"Exception: {str(e)}")
            return False

    def test_get_tontines(self, token):
        """Test GET /api/tontines"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/tontines", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Tontines", True, f"Retrieved {len(data)} tontines")
                    return True
                else:
                    self.log_test("Get Tontines", False, f"Expected list but got: {type(data)}")
                    return False
            else:
                self.log_test("Get Tontines", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Tontines", False, f"Exception: {str(e)}")
            return False

    def test_get_tontines_enriched(self, token):
        """Test GET /api/tontines/enriched"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/tontines/enriched", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if enriched fields are present
                        first_tontine = data[0]
                        required_fields = ["user_position", "total_pot", "is_creator"]
                        if all(field in first_tontine for field in required_fields):
                            self.log_test("Get Enriched Tontines", True, f"Retrieved {len(data)} enriched tontines")
                            return True
                        else:
                            self.log_test("Get Enriched Tontines", False, f"Missing enriched fields: {first_tontine.keys()}")
                            return False
                    else:
                        self.log_test("Get Enriched Tontines", True, "Retrieved 0 enriched tontines (empty list)")
                        return True
                else:
                    self.log_test("Get Enriched Tontines", False, f"Expected list but got: {type(data)}")
                    return False
            else:
                self.log_test("Get Enriched Tontines", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Enriched Tontines", False, f"Exception: {str(e)}")
            return False

    def test_send_invitation(self, token, invited_email):
        """Test POST /api/invitations"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.post(f"{self.base_url}/invitations", 
                headers=headers,
                json={
                    "tontine_id": self.tontine_id,
                    "invited_email": invited_email
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.invitation_id = data["id"]
                    self.log_test("Send Invitation", True, f"Invitation sent to {invited_email}")
                    return True
                else:
                    self.log_test("Send Invitation", False, f"Invitation creation failed: {data}")
                    return False
            else:
                self.log_test("Send Invitation", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Send Invitation", False, f"Exception: {str(e)}")
            return False

    def test_get_received_invitations_enriched(self, token):
        """Test GET /api/invitations/received/enriched"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/invitations/received/enriched", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Received Invitations Enriched", True, f"Retrieved {len(data)} enriched invitations")
                    return True
                else:
                    self.log_test("Get Received Invitations Enriched", False, f"Expected list but got: {type(data)}")
                    return False
            else:
                self.log_test("Get Received Invitations Enriched", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Received Invitations Enriched", False, f"Exception: {str(e)}")
            return False

    def test_dashboard(self, token):
        """Test GET /api/dashboard"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/dashboard", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["active_tontines_count", "pending_invitations_count", "financial_summary"]
                if all(field in data for field in required_fields):
                    self.log_test("Dashboard", True, f"Dashboard data retrieved with all required fields")
                    return True
                else:
                    self.log_test("Dashboard", False, f"Missing required fields: {data.keys()}")
                    return False
            else:
                self.log_test("Dashboard", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Dashboard", False, f"Exception: {str(e)}")
            return False

    def test_notifications(self, token):
        """Test GET /api/notifications"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/notifications", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Notifications", True, f"Retrieved {len(data)} notifications")
                    return True
                else:
                    self.log_test("Get Notifications", False, f"Expected list but got: {type(data)}")
                    return False
            else:
                self.log_test("Get Notifications", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Notifications", False, f"Exception: {str(e)}")
            return False

    def test_notifications_unread_count(self, token):
        """Test GET /api/notifications/unread-count"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/notifications/unread-count", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "count" in data:
                    self.log_test("Get Unread Count", True, f"Unread count: {data['count']}")
                    return True
                else:
                    self.log_test("Get Unread Count", False, f"Missing count field: {data}")
                    return False
            else:
                self.log_test("Get Unread Count", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Unread Count", False, f"Exception: {str(e)}")
            return False

    def test_account_stats(self, token):
        """Test GET /api/account/stats"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/account/stats", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["active_tontines", "completed_tontines", "total_participations", "pending_invitations"]
                if all(field in data for field in required_fields):
                    self.log_test("Account Stats", True, f"Account stats retrieved with all required fields")
                    return True
                else:
                    self.log_test("Account Stats", False, f"Missing required fields: {data.keys()}")
                    return False
            else:
                self.log_test("Account Stats", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Account Stats", False, f"Exception: {str(e)}")
            return False

    def test_account_check_deletion(self, token):
        """Test GET /api/account/check-deletion"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.base_url}/account/check-deletion", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["can_delete", "blockers", "warnings"]
                if all(field in data for field in required_fields):
                    self.log_test("Account Check Deletion", True, f"Can delete: {data['can_delete']}")
                    return True
                else:
                    self.log_test("Account Check Deletion", False, f"Missing required fields: {data.keys()}")
                    return False
            else:
                self.log_test("Account Check Deletion", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Account Check Deletion", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run comprehensive testing of ALL endpoints"""
        print("🚀 Starting TontineClub Comprehensive Backend API Testing")
        print("=" * 80)
        
        # 1. Health Check
        print("\n🏥 Testing Health Check")
        self.test_health_check()
        
        # 2. User Registration
        print("\n📝 Testing User Registration")
        success, token = self.test_register(
            self.user_email, 
            "Comprehensive Test User", 
            "+33699999001", 
            "Test123!",
            "XOF"
        )
        if not success:
            print("❌ Registration failed, stopping tests")
            return False
        self.user_token = token
        
        # 3. User Login (Valid and Invalid)
        print("\n🔐 Testing User Login")
        self.test_login(self.user_email, "Test123!", should_succeed=True)
        self.test_login(self.user_email, "WrongPassword", should_succeed=False)
        
        # 4. Forgot Password
        print("\n🔑 Testing Forgot Password")
        self.test_forgot_password(self.user_email)
        
        # 5. Change Password
        print("\n🔄 Testing Change Password")
        # Test with correct current password
        self.test_change_password(self.user_token, "Test123!", "NewTest123!", should_succeed=True)
        # Test with wrong current password
        self.test_change_password(self.user_token, "WrongPassword", "AnotherNew123!", should_succeed=False)
        # Test with short new password
        self.test_change_password(self.user_token, "NewTest123!", "123", should_succeed=False)
        
        # Update token after password change (login with new password)
        success, new_token = self.test_login(self.user_email, "NewTest123!", should_succeed=True)
        if success:
            self.user_token = new_token
        
        # 6. Get User Info
        print("\n👤 Testing Get User Info")
        self.test_get_me(self.user_token)
        
        # 7. Update Profile
        print("\n✏️ Testing Update Profile")
        self.test_update_profile(self.user_token)
        
        # 8. Subscription Tests
        print("\n💳 Testing Subscription System")
        self.test_subscription_status(self.user_token)
        self.test_activate_trial(self.user_token)
        self.test_cancel_subscription(self.user_token)
        
        # 9. Tontine Tests
        print("\n🏦 Testing Tontine System")
        self.test_create_tontine(self.user_token)
        self.test_get_tontines(self.user_token)
        self.test_get_tontines_enriched(self.user_token)
        
        # 10. Register second user for invitation testing
        print("\n👥 Testing Invitation System")
        success, token2 = self.test_register(
            self.user2_email, 
            "Test User 2", 
            "+33699999002", 
            "Test123!",
            "XOF"
        )
        if success:
            self.user2_token = token2
            # Send invitation
            if self.tontine_id:
                self.test_send_invitation(self.user_token, self.user2_email)
                # Check received invitations for user2
                self.test_get_received_invitations_enriched(self.user2_token)
        
        # 11. Dashboard
        print("\n📊 Testing Dashboard")
        self.test_dashboard(self.user_token)
        
        # 12. Notifications
        print("\n🔔 Testing Notifications")
        self.test_notifications(self.user_token)
        self.test_notifications_unread_count(self.user_token)
        
        # 13. Account Management
        print("\n⚙️ Testing Account Management")
        self.test_account_stats(self.user_token)
        self.test_account_check_deletion(self.user_token)
        
        # Print final summary
        self.print_summary()
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📋 COMPREHENSIVE BACKEND API TEST SUMMARY")
        print("=" * 80)
        
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
        else:
            print("\n🎉 ALL TESTS PASSED!")
        
        print("\n🎯 COMPREHENSIVE BACKEND API TESTING COMPLETED")
        
        # Return success status for main agent
        return passed == total

if __name__ == "__main__":
    tester = ComprehensiveTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)