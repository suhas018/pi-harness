from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class EchoIn(BaseModel):
    message: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/echo")
def echo(body: EchoIn):
    return {"echo": body.message}


@app.get("/items/{item_id}")
def get_item(item_id: int):
    return {"item_id": item_id, "name": f"item-{item_id}"}
