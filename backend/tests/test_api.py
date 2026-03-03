import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


# ===== HEALTH CHECK =====
def test_health_check():
    response = requests.get(f"{BASE_URL}/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


# ===== AUTH TESTS =====
class TestAuth:
    def test_login_admin(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@company.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == "Admin"

    def test_login_exec(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "exec@company.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "ExecViewer"

    def test_login_manager(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "james.chen@company.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "Manager"

    def test_login_product_owner(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alex.johnson@company.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "ProductOwner"

    def test_login_business_partner(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "lisa.wang@company.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "BusinessPartner"

    def test_login_invalid_credentials(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@company.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401

    def test_get_me(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@company.com"
        assert "password_hash" not in data

    def test_me_unauthenticated(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 403  # No credentials

    def test_register_new_user(self, api_client):
        unique_email = f"test_{uuid.uuid4().hex[:8]}@company.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User",
            "role": "ProductOwner"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == unique_email


# ===== DIMENSIONS & QUESTIONS =====
class TestDimensionsAndQuestions:
    def test_get_dimensions(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/dimensions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 8  # 8 dimensions from seed

    def test_dimensions_have_correct_fields(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/dimensions")
        data = response.json()
        for dim in data:
            assert "id" in dim
            assert "name" in dim
            assert "weight" in dim
            assert "order" in dim

    def test_get_questions(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/questions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 40  # 5 questions × 8 dimensions

    def test_get_questions_by_dimension(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/questions/by-dimension")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 8
        for dim_group in data:
            assert "questions" in dim_group
            assert len(dim_group["questions"]) == 5


# ===== ASSESSMENT CYCLES =====
class TestCycles:
    def test_get_active_cycle(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/cycles/active")
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert "id" in data
        assert "name" in data

    def test_get_all_cycles(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/cycles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


# ===== ASSIGNMENTS =====
class TestAssignments:
    def test_po_my_assignments(self, po_client):
        response = po_client.get(f"{BASE_URL}/api/assignments/my")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # PO should have at least 1 self-assessment assignment
        assert len(data) >= 1
        assert all(a["rater_type"] == "Self" for a in data)

    def test_manager_my_assignments(self, manager_client):
        response = manager_client.get(f"{BASE_URL}/api/assignments/my")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert all(a["rater_type"] == "Manager" for a in data)

    def test_partner_my_assignments(self, partner_client):
        response = partner_client.get(f"{BASE_URL}/api/assignments/my")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert all(a["rater_type"] == "Partner" for a in data)

    def test_admin_all_assignments(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/assignments")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 12  # 12 POs


# ===== SCORECARDS =====
class TestScorecards:
    def test_get_all_scorecards(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/scorecards")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 12  # 12 POs seeded

    def test_scorecard_fields(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/scorecards")
        data = response.json()
        sc = data[0]
        assert "po_name" in sc
        assert "overall_self" in sc
        assert "maturity_band" in sc
        assert "dimension_scores" in sc
        assert isinstance(sc["dimension_scores"], list)

    def test_my_scorecard_po(self, po_client):
        response = po_client.get(f"{BASE_URL}/api/scorecards/my")
        assert response.status_code == 200
        data = response.json()
        assert "overall_self" in data
        assert "maturity_band" in data

    def test_scorecard_maturity_bands_valid(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/scorecards")
        data = response.json()
        valid_bands = ["Foundational", "Developing", "Performing", "Leading", "Elite"]
        for sc in data:
            assert sc.get("maturity_band") in valid_bands


# ===== MANAGER ENDPOINTS =====
class TestManager:
    def test_manager_team(self, manager_client):
        response = manager_client.get(f"{BASE_URL}/api/manager/team")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for member in data:
            assert "po_id" in member
            assert "po_name" in member
            assert "completion_pct" in member

    def test_non_manager_cannot_access_team(self, po_client):
        response = po_client.get(f"{BASE_URL}/api/manager/team")
        assert response.status_code == 403


# ===== EXECUTIVE ENDPOINTS =====
class TestExecutive:
    def test_executive_summary(self, exec_client):
        response = exec_client.get(f"{BASE_URL}/api/executive/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_pos" in data
        assert data["total_pos"] == 12
        assert "maturity_distribution" in data
        assert "dimension_averages" in data

    def test_executive_heatmap(self, exec_client):
        response = exec_client.get(f"{BASE_URL}/api/executive/heatmap")
        assert response.status_code == 200
        data = response.json()
        assert "dimensions" in data
        assert "data" in data
        assert len(data["dimensions"]) == 8

    def test_executive_summary_kpis(self, exec_client):
        response = exec_client.get(f"{BASE_URL}/api/executive/summary")
        data = response.json()
        # Should have avg scores
        assert data.get("avg_self") is not None
        assert data.get("avg_manager") is not None


# ===== ADMIN ENDPOINTS =====
class TestAdmin:
    def test_admin_get_users(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have 25 users (1 admin + 1 exec + 3 managers + 12 POs + 8 partners)
        assert len(data) >= 20
        # No password hashes in response
        for user in data:
            assert "password_hash" not in user

    def test_admin_get_product_owners(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/admin/product-owners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 12

    def test_non_admin_cannot_access_users(self, po_client):
        response = po_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 403


# ===== EXPORT =====
class TestExport:
    def test_csv_export(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/export/csv")
        assert response.status_code == 200
        data = response.json()
        assert "headers" in data
        assert "rows" in data
        assert len(data["headers"]) > 0
        assert len(data["rows"]) == 12

    def test_csv_export_non_admin_fails(self, po_client):
        response = po_client.get(f"{BASE_URL}/api/export/csv")
        assert response.status_code == 403

    def test_csv_export_exec_viewer_allowed(self, exec_client):
        response = exec_client.get(f"{BASE_URL}/api/export/csv")
        assert response.status_code == 200
