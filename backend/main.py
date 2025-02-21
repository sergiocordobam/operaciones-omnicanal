import ollama
import numpy as np
import faiss
import json
import os
import jwt
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from models import user_input as models

#SECCION DE CONFIGURACION DEL LOGIN Y DEL LOCAL STORAGE , LLM MAS ABAJO

# Configuración de CORS para permitir peticiones del frontend
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],    
    allow_credentials=True,  
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Configuración de JWT
SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
USERS_FILE = "users.json"

# Configuración de seguridad y encriptación
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Leer usuarios desde el archivo
def read_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r") as file:
        return json.load(file)

def write_users(users):
    with open(USERS_FILE, "w") as file:
        json.dump(users, file, indent=4)

# Modelo de usuario
class User(BaseModel):
    username: str
    password: str
    age: int

# Función para generar un token JWT
def create_access_token(username: str, age: int):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": username,
        "age": age, 
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# Ruta para registrar usuario
@app.post("/register")
async def register(user: User):
    users = read_users()

    if any(u["username"] == user.username for u in users):
        raise HTTPException(status_code=400, detail="El usuario ya existe.")

    users.append({"username": user.username, "password": user.password, "age": user.age})
    write_users(users)

    return {"message": "Usuario registrado exitosamente"}

# Ruta para iniciar sesión
@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users = read_users()

    user = next((u for u in users if u["username"] == form_data.username and u["password"] == form_data.password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")

    token = create_access_token(user["username"], user["age"])
    return {"access_token": token, "token_type": "bearer"}

# Función para obtener el usuario autenticado
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"username": payload["sub"], "age": payload["age"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")

# Ruta protegida para obtener el usuario autenticado
@app.get("/current-user")
async def current_user(user: dict = Depends(get_current_user)):
    return user 


#LLM

# Modelo de Entrada de Usuario
class UserInput(BaseModel):
    description: str
    budget: int

# Medications con descripción más precisa
medications = {
    "Paracetamol": {"description": "fiebre, dolor de cabeza, gripe, resfriado", "price": 10000},
    "Ibuprofeno": {"description": "migrañas, dolor menstrual, fiebre, artritis", "price": 15000},
    "Loratadina": {"description": "alergias, urticaria, rinitis, picazón en la piel", "price": 12000},
    "Omeprazol": {"description": "gastritis, reflujo, úlceras gástricas", "price": 25000},
    "Amoxicilina": {"description": "infecciones bacterianas, bronquitis, faringitis, neumonía", "price": 30000},
    "Salbutamol": {"description": "asma, broncoespasmo, dificultad respiratoria", "price": 18000},
    "Metformina": {"description": "diabetes tipo 2, resistencia a la insulina", "price": 22000},    
}

# Preparar FAISS con tamaño correcto
d = 768 
index = faiss.IndexFlatIP(d)
med_names = []
med_prices = []

# Obtener embeddings de todos los medicamentos antes de agregarlos al índice
med_embeddings = []

def get_embedding(text: str):
    response = ollama.embed(model="nomic-embed-text", input=text)
    if "embeddings" not in response:
        raise ValueError("Embeddings not found in the response.")
    
    embedding = np.array(response["embeddings"][0]).astype("float32")
    embedding /= np.linalg.norm(embedding)
    return embedding

for med, data in medications.items():
    embedding = get_embedding(data["description"])
    med_embeddings.append(embedding)
    med_names.append(med)
    med_prices.append(data["price"])

# Agregar todos los embeddings a FAISS 
index.add(np.array(med_embeddings, dtype="float32"))

# Función para recomendar medicamentos
def recommend_medication(user_description: str, budget: int):
    user_embedding = get_embedding(user_description).reshape(1, -1)

    # Buscar el top K en FAISS
    similarities, indexes = index.search(user_embedding, k=len(medications))  

    print(similarities)
    print(indexes)
    best_match = None
    best_score = float("-inf")
    best_price = None

    for i, result_index in enumerate(indexes[0]):
        med_name = med_names[result_index]
        med_price = med_prices[result_index]
        med_similarity = similarities[0].tolist()[i]

        print(f"🔎 Evaluando: {med_name} | Similitud: {med_similarity:.4f} | Precio: {med_price}")

        # FILTRAR por presupuesto y similitud mínima
        if med_price <= budget and med_similarity > best_score:  # 0.3 es un umbral razonable
            best_score = med_similarity
            best_match = med_name
            best_price = med_price

    if best_match:
        print(f"✅ Best Match Final: {best_match} con Similitud: {best_score}")
        return {"best_match": best_match, "price": best_price, "similarity": best_score}
    else:
        return {"best_match": "No se encontró un medicamento adecuado en tu presupuesto.", "price": None, "similarity": None}

@app.post("/process")
async def process_input(user_input: UserInput):
    try:
        recommended_med = recommend_medication(user_input.description, user_input.budget)
        return recommended_med
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/medications")
async def get_medications():
    return [{"name": name, **info} for name, info in medications.items()]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)