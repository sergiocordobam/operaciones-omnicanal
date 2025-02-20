import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      {/* ✅ Banner con estilos de Bootstrap */}
      <div className="card bg-primary text-white text-center p-5 shadow-lg rounded">
        <div className="card-body">
          <h1 className="mb-3 fw-bold">¿Necesitas ayuda con tus medicamentos?</h1>
          <p className="lead">
            Nuestro asistente virtual te ayudará a encontrar el mejor medicamento según tus síntomas y presupuesto.
          </p>
          <button
            className="btn btn-warning btn-lg fw-bold mt-3"
            onClick={() => navigate("/chat-llm")}
          >
            Hablar con el Asistente 🤖
          </button>
        </div>
      </div>

      {/* ✅ Sección de Medicamentos */}
      <div className="mt-5">
        <h2 className="text-center fw-bold">Nuestros Medicamentos</h2>
        <p className="text-center">
          Explora nuestra lista de medicamentos disponibles y encuentra el que necesitas.
        </p>
      </div>
    </div>
  );
};

export default Banner;
