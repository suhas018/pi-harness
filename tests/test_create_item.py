from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_create_item():
    r = client.post("/items", json={"name": "foo"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "foo"
    assert "item_id" in data
    assert isinstance(data["item_id"], int)
