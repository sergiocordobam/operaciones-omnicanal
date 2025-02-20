import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener("resize", handleResize);

    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://127.0.0.1:8000/current-user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.username) {
            setUser(data.username);
          }
        })
        .catch(() => setUser(null));
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand" href="/">Farmacia Agilista</a>
        {isMobile ? (
          user ? (
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          ) : (
            <button className="btn btn-light display-flex" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </button>
          )
        ) : (
          <>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                {user ? (
                  <>
                    <li className="nav-item">
                      <span className="nav-link text-white">Bienvenido, {user}</span>
                    </li>
                    <li className="nav-item">
                      <button className="btn btn-outline-light" onClick={handleLogout}>
                        Cerrar Sesión
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <button className="btn btn-light me-2" onClick={() => navigate("/login")}>
                        Iniciar Sesión
                      </button>
                    </li>
                    <li className="nav-item">
                      <button className="btn btn-success" onClick={() => navigate("/register")}>
                        Registrarse
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
