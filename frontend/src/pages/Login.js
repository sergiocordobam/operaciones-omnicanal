import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage("Todos los campos son obligatorios");
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.access_token);
      setUser(username);
      navigate("/");
    } else {
      setMessage(`Error: ${data.detail}`);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4">
            <h2 className="text-center">Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Nombre de Usuario</label>
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
              <button type="submit" className="btn btn-primary w-100">
                Iniciar Sesión
              </button>
              {message && <p className="mt-3 text-center text-danger">{message}</p>}
            </form>
            <p className="mt-3 text-center">
              ¿No tienes cuenta?{" "}
              <span
                className="text-primary fw-bold"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/register")}
              >
                Regístrate acá
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
