from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_echo():
    r = client.post("/echo", json={"message": "hi"})
    assert r.status_code == 200
    assert r.json() == {"echo": "hi"}
