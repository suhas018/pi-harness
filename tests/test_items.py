from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_get_item():
    r = client.get("/items/42")
    assert r.status_code == 200
    assert r.json() == {"item_id": 42, "name": "item-42"}


def test_get_item_validation():
    r = client.get("/items/notanint")
    assert r.status_code == 422
