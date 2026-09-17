from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_update_item():
    r = client.put("/items/5", json={"name": "updated"})
    assert r.status_code == 200
    assert r.json() == {"item_id": 5, "name": "updated"}


def test_update_item_validation():
    r = client.put("/items/notanint", json={"name": "x"})
    assert r.status_code == 422
