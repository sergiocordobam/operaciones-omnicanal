import ollama
import numpy as np
import faiss
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import user_input as models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:3000"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

medications = {
    "Paracetamol": {"description": "Alivia el dolor y reduce la fiebre.", "price": 10000},
    "Ibuprofeno": {"description": "Reduce inflamación y dolor.", "price": 15000},
    "Amoxicilina": {"description": "Antibiótico para infecciones bacterianas.", "price": 30000},
    "Loratadina": {"description": "Antihistamínico para alergias.", "price": 12000},
}

d = 384  
index = faiss.IndexFlatIP(d)
med_names = []
med_prices = []

def get_embedding(text: str):
    response = ollama.embed(model="all-minilm", input=text)
    if "embeddings" not in response:
        raise ValueError("Embeddings not found in the response.")
    
    embedding = np.array(response["embeddings"][0]).astype("float32")

    embedding /= np.linalg.norm(embedding)

    return embedding

for med, data in medications.items():
    embedding = get_embedding(data["description"])
    index.add(np.array([embedding]))
    med_names.append(med)
    med_prices.append(data["price"])

def recommend_medication(user_description: str, budget: int):
    user_embedding = get_embedding(user_description).reshape(1, -1)

    similarities, indexes = index.search(user_embedding, k=len(medications))  

    for result_index in indexes[0]:
        med_name = med_names[result_index]
        med_price = med_prices[result_index]
        med_similarity = similarities[0].tolist()[0]

        if med_price <= budget:
            return {"best_match": med_name, "price": med_price, "similarity": med_similarity}

    return {"best_match": "No medication found within your budget.", "price": None, "similarity": None}

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