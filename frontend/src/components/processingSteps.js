import React, { useState, useEffect } from "react";
import { brandColors, gradients } from "../theme";
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Container,
} from "@mui/material";
import {
  CheckCircle,
  AutoAwesome,
  Security,
  Assessment,
  AccountBalance,
} from "@mui/icons-material";
import "bootstrap/dist/css/bootstrap.min.css";

const ProcessingScreen = ({ onComplete, onLogoClick }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const processingSteps = [
    {
      id: 1,
      title: "Document Analysis",
      description: "AI is analyzing uploaded documents using OCR and NLP...",
      icon: <AutoAwesome />,
      duration: 3000,
    },
    {
      id: 2,
      title: "Identity Verification",
      description:
        "Cross-referencing personal information with government databases...",
      icon: <Security />,
      duration: 2500,
    },
    {
      id: 3,
      title: "Credit & Risk Assessment",
      description: "Evaluating creditworthiness and business risk profile...",
      icon: <Assessment />,
      duration: 2500,
    },
    {
      id: 4,
      title: "Bank Validation",
      description: "Validating bank account information and routing numbers...",
      icon: <AccountBalance />,
      duration: 2000,
    },
    {
      id: 5,
      title: "Compliance Screening",
      description: "Checking against AML/KYC databases and sanctions lists...",
      icon: <Security />,
      duration: 2000,
    },
    {
      id: 6,
      title: "Final Review",
      description:
        "AI conducting final approval decision and terms calculation...",
      icon: <CheckCircle />,
      duration: 1500,
    },
  ];

  // Progress Bar useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 1;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            console.log("✅ Processing complete - calling onComplete");
            if (onComplete) onComplete();
          }, 2000);
        }
        return Math.min(newProgress, 100);
      });
    }, 150);

    return () => {
      clearInterval(timer); // ✅ Ensure cleanup
    };
  }, [onComplete]);

  // Steps useEffect
  useEffect(() => {
    const stepTimer = setInterval(() => {
      if (currentStep < processingSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        clearInterval(stepTimer);
      }
    }, 2200); // chnage : 1250 → 2200 (for slower step progression)

    return () => clearInterval(stepTimer);
  }, []);

  const containerStyle = {
    minHeight: "100vh",
    background: gradients.secondary,
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header className="bg-white shadow-sm py-3">
        <Container>
          <div className="d-flex align-items-center">
            <div
              className="d-flex align-items-center"
              onClick={onLogoClick} // ✅ ADD onClick
              style={{ cursor: "pointer" }} // ✅ ADD pointer cursor
            >
              <div
                className="bg-primary rounded-circle p-2 me-3"
                style={{ backgroundColor: brandColors.primary }}
              >
                <AutoAwesome className="text-white" />
              </div>
              <h2
                className="h4 mb-0 fw-bold"
                style={{ color: brandColors.primary }}
              >
                MerchantFlow AI
              </h2>
            </div>
            <div className="ms-auto">
              <span className="badge bg-success fs-6">
                Processing Application
              </span>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <Container>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <Card
                className="shadow-lg border-0"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <CardContent className="p-5">
                  {/* Header Section */}
                  <div className="text-center mb-5">
                    <div className="mb-3">
                      <AutoAwesome
                        style={{
                          fontSize: "60px",
                          color: "#1976d2",
                          animation: "pulse 2s infinite",
                        }}
                      />
                    </div>
                    <Typography
                      variant="h3"
                      className="fw-bold mb-2 text-primary"
                    >
                      AI Processing Your Application
                    </Typography>
                    <Typography variant="h6" className="text-muted mb-4">
                      Our advanced AI is reviewing your information in real-time
                    </Typography>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: brandColors.primary,
                          },
                        }}
                      />
                      <Typography
                        variant="body2"
                        className="mt-2 fw-bold text-success"
                      >
                        {Math.round(progress)}% Complete
                      </Typography>
                    </div>
                  </div>

                  {/* Processing Steps */}
                  <div className="row g-4">
                    {processingSteps.map((step, index) => (
                      <div key={step.id} className="col-md-6">
                        <div
                          className={`p-3 rounded-3 h-100 ${
                            index <= currentStep
                              ? "text-white"
                              : index === currentStep + 1
                              ? "bg-warning text-dark"
                              : "bg-light text-muted"
                          }`}
                          style={{
                            backgroundColor:
                              index <= currentStep
                                ? brandColors.primary
                                : undefined,
                          }}
                        >
                          <div className="d-flex align-items-start">
                            <div className="me-3">
                              {index < currentStep ? (
                                <CheckCircle style={{ fontSize: "30px" }} />
                              ) : (
                                React.cloneElement(step.icon, {
                                  style: { fontSize: "30px" },
                                })
                              )}
                            </div>
                            <div>
                              <h6 className="fw-bold mb-1">{step.title}</h6>
                              <p className="mb-0 small">
                                {index < currentStep
                                  ? "✓ Completed"
                                  : index === currentStep
                                  ? step.description
                                  : "Waiting..."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status Messages */}
                  <div className="mt-4">
                    <div className="alert alert-info d-flex align-items-center">
                      <AutoAwesome className="me-2" />
                      <div>
                        <strong>Advanced AI Processing:</strong> Our system
                        performs 15+ verification checks that traditionally take
                        3-5 business days. Current processing time: ~10 minutes.
                      </div>
                    </div>

                    {progress > 30 && progress < 70 && (
                      <div className="alert alert-primary d-flex align-items-center">
                        <Security className="me-2" />
                        <div>
                          <strong>Deep Verification:</strong> Cross-referencing
                          data across multiple databases and credit bureaus...
                        </div>
                      </div>
                    )}

                    {progress > 70 && progress < 95 && (
                      <div className="alert alert-warning d-flex align-items-center">
                        <Assessment className="me-2" />
                        <div>
                          <strong>Final Analysis:</strong> AI is calculating
                          optimal terms and generating personalized offer...
                        </div>
                      </div>
                    )}

                    {progress >= 95 && (
                      <div className="alert alert-success d-flex align-items-center">
                        <CheckCircle className="me-2" />
                        <div>
                          <strong>Almost Done!</strong> Finalizing results and
                          preparing comprehensive report...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Estimate */}
                  <div className="text-center mt-4">
                    <Typography variant="body1" className="text-muted">
                      Estimated completion:{" "}
                      <strong className="text-success">
                        {progress < 20
                          ? "8-10 minutes"
                          : progress < 40
                          ? "5-7 minutes"
                          : progress < 60
                          ? "3-5 minutes"
                          : progress < 80
                          ? "2-3 minutes"
                          : progress < 95
                          ? "1-2 minutes"
                          : "Almost ready..."}
                      </strong>{" "}
                      remaining
                    </Typography>

                    {progress === 100 && (
                      <div className="mt-3">
                        <div
                          className="spinner-border text-success me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <Typography
                          variant="body2"
                          className="text-success fw-bold"
                        >
                          ✅ All checks completed! Generating final results...
                        </Typography>
                      </div>
                    )}
                  </div>

                  {/* Security Notice */}
                  <div className="mt-4 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-center text-muted">
                      <Security className="me-2" style={{ fontSize: "16px" }} />
                      <small>
                        Your data is encrypted and processed securely using
                        bank-level security protocols
                      </small>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <footer
        className="py-3"
        style={{
          background: gradients.secondary,
          color: "white",
        }}
      >
        <Container>
          <div className="text-center">
            <p className="mb-0">
              🤖 Powered by Google Cloud AI • MerchantFlow AI &copy; 2024
            </p>
          </div>
        </Container>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
