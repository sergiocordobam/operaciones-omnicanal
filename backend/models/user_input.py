from pydantic import BaseModel

class UserInput(BaseModel):
    name: str
    description: str
    age: int
    budget: int