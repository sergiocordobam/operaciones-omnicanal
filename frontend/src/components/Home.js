import React, { useEffect, useState } from "react";
import Banner from "./Banner";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/medications")
      .then((response) => response.json())
      .then((data) => {
        setMedications(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching medications:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* ✅ Banner agregado al Home */}
      <Banner />

      {/* Sección de Productos Destacados */}
      <section className="container mt-5">
        <h2 className="text-center mb-4">Medicamentos Disponibles</h2>

        {loading ? (
          <p className="text-center">Cargando medicamentos...</p>
        ) : (
          <div className="row g-4">
            {medications.map((med, index) => (
              <div className="col-12 col-md-6 col-lg-4" key={index}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{med.name}</h5>
                    <p className="card-text">{med.description}</p>
                    <p className="text-muted">Precio: ${med.price.toLocaleString()}</p>
                    <button className="btn btn-primary mt-auto">Añadir al Carrito</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
