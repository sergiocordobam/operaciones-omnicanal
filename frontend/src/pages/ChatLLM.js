import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";

const ChatLLM = () => {
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState("");
  const [user, setUser] = useState({ name: "", age: "" });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ name: decoded.sub, age: decoded.age });
      } catch (error) {
        console.error("Error decodificando el token:", error);
      }
    }
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) {
      setError("⚠️ Por favor describe tu síntoma.");
      return;
    }
    if (!budget.trim() || isNaN(budget) || parseInt(budget) <= 0) {
      setError("⚠️ Ingresa un presupuesto válido.");
      return;
    }

    setError("");
    setLoading(true);

    const userMessage = {
      name: user.name || "Desconocido",
      age: user.age || "No especificada",
      description: input,
      budget: parseInt(budget),
    };

    setMessages((prev) => [
      ...prev,
      {
        sender: "Usuario",
        text: `📝 Síntoma: ${userMessage.description} \n💰 Presupuesto: $${userMessage.budget}`,
      },
    ]);

    try {
      const response = await fetch("http://127.0.0.1:8000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });

      const data = await response.json();

      const llmMessage = {
        sender: "Asistente",
        text: `👤 Hola ${userMessage.name}, veo que tienes estos síntomas: \n📝 ${userMessage.description} \n💰 Tu presupuesto: $${userMessage.budget} \n🔍 Desde la Farmacia Agilista te recomiendo: \n💊 ${data.best_match} \n💵 Precio: ${data.price ? `$${data.price}` : "No disponible"}`,
      };

      setMessages((prev) => [...prev, llmMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "Asistente", text: "❌ Error al obtener respuesta del modelo." }]);
    }

    setLoading(false);
    setInput("");
    setBudget("");
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-lg p-4">
        <h2 className="text-center fw-bold mb-4">Asistente de Medicamentos</h2>

        {/* Área de Mensajes con Scroll Estilizado */}
        <div
          className="chat-box border rounded p-3 mb-3"
          style={{
            height: "400px",
            overflowY: "auto",
            backgroundColor: "#f8f9fa",
            scrollbarWidth: "thin",
            scrollbarColor: "#007bff #f1f1f1",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`d-flex ${msg.sender === "Usuario" ? "justify-content-end" : "justify-content-start"} mb-2`}
            >
              <div
                className={`p-3 rounded shadow-sm ${
                  msg.sender === "Usuario" ? "bg-primary text-white" : "bg-light text-dark"
                }`}
                style={{ maxWidth: "75%", whiteSpace: "pre-line" }}
              >
                <strong>{msg.sender}:</strong> <br />
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatContainerRef}></div>
        </div>

        {/*Mostrar Mensaje de Error */}
        {error && <p className="text-danger text-center fw-bold">{error}</p>}

        {/*Entrada de Mensaje */}
        <div className="mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Describe tu síntoma..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
        </div>
        <div className="mb-3">
          <input
            type="number"
            className="form-control"
            placeholder="Presupuesto"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        {/* Botón de Envío */}
        <button className="btn btn-primary w-100" onClick={sendMessage} disabled={loading}>
          {loading ? "Esperando respuesta..." : "Enviar Consulta"}
        </button>
      </div>
    </div>
  );
};

export default ChatLLM;
