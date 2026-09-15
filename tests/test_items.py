from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)

def test_get_item():
    response = client.get('/items/42')
    assert response.json() == {'item_id': 42, 'name': 'item-42'}
    assert client.get('/items/notanint').status_code == 422