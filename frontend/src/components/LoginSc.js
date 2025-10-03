import React, { useState } from "react";
import { Button, TextField, Paper, Typography, Box } from "@mui/material";
import { Login as LoginIcon } from "@mui/icons-material";
import "bootstrap/dist/css/bootstrap.min.css";

const LoginSc = ({ onLogin, onLogoClick }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", credentials);
    // ✅ Navigate to onboarding after login
    if (onLogin) onLogin();
  };

  const containerStyle = {
    backgroundImage:
      'url("https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    position: "relative",
  };

  // Add overlay style (add before return)
  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(135deg, rgba(70, 190, 170, 0.85) 0%, rgba(118, 233, 213, 0.85) 100%)",
    zIndex: 1,
  };

  return (
    <div
      className="container-fluid vh-100 d-flex align-items-center justify-content-center"
      style={containerStyle}
    >
      <div style={overlayStyle}></div>
      <div
        className="container-fluid vh-100 d-flex align-items-center justify-content-center"
        style={containerStyle}
      >
        <div className="row w-100 justify-content-center">
          <div className="col-md-6 col-lg-6">
            {" "}
            {/* Changed to 50% width */}
            <div
              className="card shadow-lg"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            >
              <div className="card-body p-5">
                {" "}
                {/* Increased padding */}
                <div className="text-center mb-4">
                  <h2 className="h3 fw-bold">Welcome Back</h2>
                  <p className="text-muted">Please sign in to your account</p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="Enter your email"
                      value={credentials.email}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3"
                  >
                    Sign In
                  </button>

                  <div className="text-center">
                    <button type="button" className="btn btn-link text-muted">
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSc;
