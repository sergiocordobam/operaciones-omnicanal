import ollama
import numpy as np
from fastapi import FastAPI, HTTPException
from models import user_input as models

app = FastAPI()

medications = {
    "Paracetamol": {"description": "Alivia el dolor y reduce la fiebre.", "price": 10000},
    "Ibuprofeno": {"description": "Reduce inflamación y dolor.", "price": 15000},
    "Amoxicilina": {"description": "Antibiótico para infecciones bacterianas.", "price": 30000},
    "Loratadina": {"description": "Antihistamínico para alergias.", "price": 12000},
}

def get_embedding(text: str):
    response = ollama.embed(model="all-minilm", input=text)

    if "embeddings" not in response:
        raise ValueError("Embeddings not found in the response.")

    embedding = np.array(response["embeddings"][0])

    return embedding.flatten()

def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def recommend_medication(user_description: str, budget: int):
    user_embedding = get_embedding(user_description)

    best_match = None
    best_score = float("-inf")
    best_price = None

    print(f"\nUser input: {user_description}")
    print(f"User budget: {budget}\n")

    for med, data in medications.items():
        med_embedding = get_embedding(data["description"])
        similarity = cosine_similarity(user_embedding, med_embedding)

        print(f"Checking: {med} | Similarity: {similarity:.4f} | Price: {data['price']}")  

        if data["price"] <= budget and similarity > best_score:
            best_score = similarity
            best_match = med
            best_price = data["price"]

    if best_match is None:
        return {"best_match": "No medication found within your budget.", "price": None}

    return {"best_match": best_match, "price": best_price}


@app.post("/process")
async def process_input(user_input: models.UserInput):
    try:
        recommended_med = recommend_medication(user_input.description, user_input.budget)
        return recommended_med
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)