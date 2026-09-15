from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class EchoIn(BaseModel):
    message: str


class CreateItemIn(BaseModel):
    name: str


class ItemOut(BaseModel):
    item_id: int
    name: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/echo")
def echo(body: EchoIn):
    return {"echo": body.message}


@app.get("/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int):
    return {"item_id": item_id, "name": f"item-{item_id}"}


@app.post("/items", response_model=ItemOut, status_code=201)
def create_item(body: CreateItemIn):
    # simple id generation for demo — use hash of name
    return {"item_id": abs(hash(body.name)) % 10000, "name": body.name}


@app.put("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, body: CreateItemIn):
    return {"item_id": item_id, "name": body.name}
