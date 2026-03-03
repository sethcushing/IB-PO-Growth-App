import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@company.com",
        "password": "demo123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed — skipping authenticated tests")

@pytest.fixture
def exec_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "exec@company.com",
        "password": "demo123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("ExecViewer authentication failed")

@pytest.fixture
def manager_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "james.chen@company.com",
        "password": "demo123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Manager authentication failed")

@pytest.fixture
def po_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "alex.johnson@company.com",
        "password": "demo123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("PO authentication failed")

@pytest.fixture
def partner_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "lisa.wang@company.com",
        "password": "demo123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("BusinessPartner authentication failed")

@pytest.fixture
def admin_client(api_client, admin_token):
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client

@pytest.fixture
def exec_client(api_client, exec_token):
    api_client.headers.update({"Authorization": f"Bearer {exec_token}"})
    return api_client

@pytest.fixture
def manager_client(api_client, manager_token):
    api_client.headers.update({"Authorization": f"Bearer {manager_token}"})
    return api_client

@pytest.fixture
def po_client(api_client, po_token):
    api_client.headers.update({"Authorization": f"Bearer {po_token}"})
    return api_client

@pytest.fixture
def partner_client(api_client, partner_token):
    api_client.headers.update({"Authorization": f"Bearer {partner_token}"})
    return api_client
