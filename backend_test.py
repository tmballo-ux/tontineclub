#!/usr/bin/env python3
"""
TontineClub Backend API Testing - Enriched Tontines Endpoint
Testing the new enriched tontines endpoint with comprehensive validation.
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "https://tontine-dashboard-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class TontineClubTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=self.headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_user_registration(self):
        """Test user registration"""
        test_email = f"enriched_test_{uuid.uuid4().hex[:8]}@example.com"
        user_data = {
            "email": test_email,
            "full_name": "Enriched Test User",
            "phone": "+1234567890",
            "password": "SecurePass123!"
        }
        
        response = self.make_request("POST", "/auth/register", user_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.auth_token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.headers["Authorization"] = f"Bearer {self.auth_token}"
                self.log_test("User Registration", True, f"User created with ID: {self.user_id}")
                return True
            else:
                self.log_test("User Registration", False, "Missing token or user in response")
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("User Registration", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False
    
    def test_user_login(self):
        """Test user login (backup authentication)"""
        if self.auth_token:
            return True  # Already authenticated from registration
            
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.auth_token = data["access_token"]
            self.user_id = data["user"]["id"]
            self.headers["Authorization"] = f"Bearer {self.auth_token}"
            self.log_test("User Login", True, "Login successful")
            return True
        else:
            self.log_test("User Login", False, f"Login failed: {response.status_code if response else 'No response'}")
            return False
    
    def test_create_tontines(self):
        """Create 2 test tontines with different amounts and currencies"""
        if not self.auth_token:
            self.log_test("Create Tontines", False, "No authentication token")
            return []
        
        tontines_data = [
            {
                "name": "Tontine Enriched Test 1",
                "contribution_amount": 100.0,
                "currency": "XOF",
                "frequency": "monthly",
                "max_members": 5,
                "start_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
                "description": "Test tontine for enriched endpoint validation"
            },
            {
                "name": "Tontine Enriched Test 2", 
                "contribution_amount": 250.0,
                "currency": "CAD",
                "frequency": "weekly",
                "max_members": 3,
                "start_date": (datetime.utcnow() + timedelta(days=14)).isoformat(),
                "description": "Second test tontine with different currency"
            }
        ]
        
        created_tontines = []
        
        for i, tontine_data in enumerate(tontines_data, 1):
            response = self.make_request("POST", "/tontines", tontine_data)
            
            if response and response.status_code == 200:
                tontine = response.json()
                created_tontines.append(tontine)
                self.log_test(f"Create Tontine {i}", True, f"Created: {tontine['name']} (ID: {tontine['id']})")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_test(f"Create Tontine {i}", False, f"Failed: {error_msg}")
        
        return created_tontines
    
    def test_regular_tontines_endpoint(self):
        """Test backward compatibility - regular GET /api/tontines"""
        if not self.auth_token:
            self.log_test("Regular Tontines Endpoint", False, "No authentication token")
            return False
        
        response = self.make_request("GET", "/tontines")
        
        if response and response.status_code == 200:
            tontines = response.json()
            if isinstance(tontines, list):
                self.log_test("Regular Tontines Endpoint", True, f"Retrieved {len(tontines)} tontines")
                return True
            else:
                self.log_test("Regular Tontines Endpoint", False, "Response is not a list")
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Regular Tontines Endpoint", False, f"Failed: {error_msg}")
            return False
    
    def test_enriched_tontines_endpoint(self):
        """Test the main enriched tontines endpoint"""
        if not self.auth_token:
            self.log_test("Enriched Tontines Endpoint", False, "No authentication token")
            return False
        
        response = self.make_request("GET", "/tontines/enriched")
        
        if response and response.status_code == 200:
            enriched_tontines = response.json()
            
            if not isinstance(enriched_tontines, list):
                self.log_test("Enriched Tontines Endpoint", False, "Response is not a list")
                return False
            
            if len(enriched_tontines) == 0:
                self.log_test("Enriched Tontines Endpoint", True, "No tontines found (empty list is valid)")
                return True
            
            # Validate each enriched tontine
            required_fields = [
                "id", "name", "contribution_amount", "currency", "frequency", 
                "max_members", "current_members", "start_date", "status", 
                "creator_id", "created_at", "user_position", "total_pot", 
                "next_payment_date", "current_cycle_number", "cycles_completed", 
                "total_cycles", "payment_reliability", "is_creator"
            ]
            
            all_valid = True
            validation_details = []
            
            for i, tontine in enumerate(enriched_tontines):
                missing_fields = [field for field in required_fields if field not in tontine]
                if missing_fields:
                    all_valid = False
                    validation_details.append(f"Tontine {i+1} missing fields: {missing_fields}")
                else:
                    # Validate specific enriched fields
                    validation_errors = []
                    
                    # Check total_pot calculation
                    expected_pot = tontine["contribution_amount"] * tontine["max_members"]
                    if tontine["total_pot"] != expected_pot:
                        validation_errors.append(f"total_pot incorrect: got {tontine['total_pot']}, expected {expected_pot}")
                    
                    # Check is_creator (should be True since user created these tontines)
                    if not tontine["is_creator"]:
                        validation_errors.append("is_creator should be True for user-created tontines")
                    
                    # Check user_position (should be 1 for creator)
                    if tontine["user_position"] != 1:
                        validation_errors.append(f"user_position should be 1 for creator, got {tontine['user_position']}")
                    
                    # Check total_cycles equals max_members
                    if tontine["total_cycles"] != tontine["max_members"]:
                        validation_errors.append(f"total_cycles should equal max_members: got {tontine['total_cycles']}, expected {tontine['max_members']}")
                    
                    # Check payment_reliability is a number between 0-100
                    if not isinstance(tontine["payment_reliability"], (int, float)) or not (0 <= tontine["payment_reliability"] <= 100):
                        validation_errors.append(f"payment_reliability should be 0-100, got {tontine['payment_reliability']}")
                    
                    if validation_errors:
                        all_valid = False
                        validation_details.append(f"Tontine {i+1} ({tontine['name']}): {'; '.join(validation_errors)}")
                    else:
                        validation_details.append(f"Tontine {i+1} ({tontine['name']}): All validations passed ✅")
            
            if all_valid:
                self.log_test("Enriched Tontines Endpoint", True, f"All {len(enriched_tontines)} tontines have required enriched fields")
                for detail in validation_details:
                    print(f"   {detail}")
                return True
            else:
                self.log_test("Enriched Tontines Endpoint", False, "Validation errors found")
                for detail in validation_details:
                    print(f"   {detail}")
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Enriched Tontines Endpoint", False, f"Failed: {error_msg}")
            return False
    
    def test_authentication_required(self):
        """Test that enriched endpoint requires authentication"""
        # Remove auth header temporarily
        original_auth = self.headers.pop("Authorization", None)
        
        response = self.make_request("GET", "/tontines/enriched")
        
        # Restore auth header
        if original_auth:
            self.headers["Authorization"] = original_auth
        
        if response and response.status_code in [401, 403]:
            self.log_test("Authentication Required", True, f"Properly rejected unauthenticated request (status: {response.status_code})")
            return True
        else:
            self.log_test("Authentication Required", False, f"Should reject unauthenticated requests, got status: {response.status_code if response else 'None'}")
            return False
    
    def run_comprehensive_test(self):
        """Run the complete test suite for enriched tontines endpoint"""
        print("=" * 80)
        print("🧪 TONTINECLUB ENRICHED TONTINES ENDPOINT TESTING")
        print("=" * 80)
        print()
        
        # Step 1: Register new test user
        print("📝 Step 1: User Registration")
        if not self.test_user_registration():
            print("❌ Registration failed, trying login as fallback...")
            if not self.test_user_login():
                print("❌ Authentication failed completely. Cannot continue testing.")
                return False
        print()
        
        # Step 2: Create test tontines
        print("🏦 Step 2: Create Test Tontines")
        created_tontines = self.test_create_tontines()
        if len(created_tontines) < 2:
            print("⚠️  Warning: Could not create both test tontines, continuing with available ones...")
        print()
        
        # Step 3: Test regular tontines endpoint (backward compatibility)
        print("🔄 Step 3: Test Regular Tontines Endpoint (Backward Compatibility)")
        self.test_regular_tontines_endpoint()
        print()
        
        # Step 4: Test enriched tontines endpoint
        print("✨ Step 4: Test Enriched Tontines Endpoint")
        self.test_enriched_tontines_endpoint()
        print()
        
        # Step 5: Test authentication requirement
        print("🔐 Step 5: Test Authentication Requirement")
        self.test_authentication_required()
        print()
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        total = len(self.test_results)
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        print()
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Enriched Tontines API is working correctly.")
        else:
            print("⚠️  Some tests failed. See details above.")
            
        print()
        print("Detailed Results:")
        for result in self.test_results:
            print(f"  {result['status']}: {result['test']}")
        
        return passed == total

def main():
    """Main test execution"""
    tester = TontineClubTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🚀 Enriched Tontines API is ready for production!")
        exit(0)
    else:
        print("\n🔧 Some issues found that need attention.")
        exit(1)

if __name__ == "__main__":
    main()