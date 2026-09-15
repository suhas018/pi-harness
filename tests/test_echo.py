from fastapi.testclient import TestClient

from src.app import app

test_client = TestClient(app)

def test_echo():
    response = test_client.post("/echo", json={"message": "hi"})
    assert response.json() == {"echo": "hi"}
