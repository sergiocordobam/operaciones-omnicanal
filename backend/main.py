from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import ollama
import numpy as np

app = FastAPI()

medications = {
    "Paracetamol": "Alivia el dolor y reduce la fiebre.",
    "Ibuprofeno": "Reduce inflamación y dolor.",
    "Amoxicilina": "Antibiótico para infecciones bacterianas.",
    "Loratadina": "Antihistamínico para alergias.",
}

class UserInput(BaseModel):
    name: str
    description: str
    age: int

def get_embedding(text: str):
    """Generate an embedding for a given text using Ollama."""
    response = ollama.embeddings(model="mistral", prompt=text)
    return np.array(response["embedding"])

def recommend_medication(user_description: str):
    """Find the best medication based on symptom similarity."""
    user_embedding = get_embedding(user_description)
    
    best_match = None
    best_score = float("-inf")
    
    for med, desc in medications.items():
        med_embedding = get_embedding(desc)
        similarity = np.dot(user_embedding, med_embedding)
        
        if similarity > best_score:
            best_score = similarity
            best_match = med
    
    return best_match if best_match else "No recommendation found."

@app.post("/process")
async def process_input(user_input: UserInput):
    try:
        # prompt = f"Paciente: {user_input.name}, {user_input.age} años. Síntomas: {user_input.description}."
        # chat_response = ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}])

        recommended_med = recommend_medication(user_input.description)

        return {
            # "chat_response": chat_response["message"]["content"],
            "recommended_medication": recommended_med,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
