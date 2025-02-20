import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!username || !password || !age) {
      setMessage("Todos los campos son obligatorios");
      return;
    }

    if (isNaN(age) || age < 18) {
      setMessage("Debes tener al menos 18 años para registrarte.");
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, age: parseInt(age) }),
    });

    if (response.ok) {
      localStorage.setItem("registeredUser", JSON.stringify({ username, age }));
      setMessage("Registro exitoso. Redirigiendo al login...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      const data = await response.json();
      setMessage(data.detail || "Error en el registro");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4">
            <h2 className="text-center">Registro</h2>
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Edad</label>
                <input
                  type="number"
                  className="form-control"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Registrarse
              </button>
              {message && <p className="mt-3 text-center text-danger">{message}</p>}
            </form>
            <p className="mt-3 text-center">
              ¿Ya tienes una cuenta?{" "}
              <span
                className="text-primary fw-bold"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/login")}
              >
                Inicia sesión aquí
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
