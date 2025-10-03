import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { brandColors, gradients } from "../theme";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Chip,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  AutoAwesome,
  TrendingUp,
  Speed,
  Security,
  AccountBalance,
  Description,
  Phone,
} from "@mui/icons-material";
import "bootstrap/dist/css/bootstrap.min.css";

// Import Redux selectors
import {
  selectApplicationId,
  selectApprovalStatus,
  selectRiskScore,
  selectRiskLevel,
  selectMerchantTerms,
  selectProcessingTime,
  selectStorageMode,
} from "../redux/slices";

const ResultsScreen = ({ onAccept, onBack, onLogoClick }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  // Get real data from Redux state
  const applicationId = useSelector(selectApplicationId);
  const approvalStatus = useSelector(selectApprovalStatus);
  const riskScore = useSelector(selectRiskScore);
  const riskLevel = useSelector(selectRiskLevel);
  const merchantTerms = useSelector(selectMerchantTerms);
  const processingTime = useSelector(selectProcessingTime);
  const storageMode = useSelector(selectStorageMode);

  // Build result object from real Redux data
  const result = {
    status: approvalStatus || "PENDING",
    applicationId: applicationId || "APP-LOADING...",
    processingTime: processingTime || "Calculating...",
    riskScore: riskScore || 0,
    riskLevel: riskLevel || "UNKNOWN",
    terms: merchantTerms
      ? {
          rate: merchantTerms.rate || "N/A",
          transactionFee: merchantTerms.transaction_fee || "$0.30",
          dailyLimit: merchantTerms.daily_limit || "N/A",
          monthlyVolume: merchantTerms.monthly_volume || "N/A",
          settlement: merchantTerms.settlement || "Next business day",
          contractLength: merchantTerms.contract_length || "12 months",
          handNetProfit: merchantTerms.hand_net_profit || "N/A",
          estimatedMonthlyRevenue:
            merchantTerms.estimated_monthly_revenue || "N/A",
          estimatedFees: merchantTerms.estimated_fees || "N/A",
        }
      : null,
    nextSteps: [
      "Review and sign digital contract",
      "Complete bank account verification",
      "Receive payment gateway credentials",
      "Integration support call scheduled",
    ],
    // Debug info
    storageMode: storageMode || "unknown",
  };

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  // Show loading if no application data
  if (!applicationId) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3">Loading application results...</div>
        </div>
      </div>
    );
  }

  const isApproved = result.status === "APPROVED";

  const containerStyle = {
    minHeight: "100vh",
    background: isApproved ? gradients.primary : gradients.light,
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
              <span
                className={`badge fs-6 ${
                  isApproved ? "bg-success" : "bg-warning"
                }`}
              >
                {result.status}
              </span>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <Container>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <Card
                className="shadow-lg border-0"
                style={{
                  background: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(70, 190, 170, 0.2)",
                }}
              >
                <CardContent className="p-5">
                  {/* Status Header */}
                  <div className="text-center mb-5">
                    <div
                      className={`mb-3 ${
                        showAnimation ? "animate-bounce" : ""
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle
                          style={{
                            fontSize: "80px",
                            color: brandColors.primary,
                          }}
                        />
                      ) : (
                        <Cancel
                          style={{
                            fontSize: "80px",
                            color: "#FF9800",
                          }}
                        />
                      )}
                    </div>

                    <Typography
                      variant="h2"
                      className="fw-bold mb-2"
                      style={{
                        color: isApproved ? "#4CAF50" : "#f44336",
                      }}
                    >
                      {isApproved ? "Congratulations!" : "Application Review"}
                    </Typography>

                    <Typography variant="h5" className="text-muted mb-3">
                      {isApproved
                        ? "Your merchant account has been approved!"
                        : "We need additional information to proceed"}
                    </Typography>

                    <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
                      <Chip
                        icon={<Speed />}
                        label={`Processed in ${result.processingTime}`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Security />}
                        label={`ID: ${result.applicationId}`}
                        color="default"
                        variant="outlined"
                      />
                      {result.riskScore > 0 && (
                        <Chip
                          icon={<TrendingUp />}
                          label={`Risk Score: ${result.riskScore}/100`}
                          color={
                            result.riskScore >= 80
                              ? "success"
                              : result.riskScore >= 60
                              ? "warning"
                              : "error"
                          }
                          variant="outlined"
                        />
                      )}
                    </div>

                    {/* Debug Info */}
                    <div className="mt-2">
                      <small className="text-muted">
                        Storage: {result.storageMode} | Risk Level:{" "}
                        {result.riskLevel}
                      </small>
                    </div>
                  </div>

                  {isApproved ? (
                    <>
                      {/* Approved Terms */}
                      <div className="row">
                        <div className="col-lg-8">
                          <Typography variant="h5" className="fw-bold mb-3">
                            📋 Your Approved Terms
                          </Typography>

                          {result.terms ? (
                            <div className="table-responsive">
                              <table className="table table-borderless">
                                <tbody>
                                  <tr className="bg-light">
                                    <td className="fw-bold">Processing Rate</td>
                                    <td>
                                      {result.terms.rate} +{" "}
                                      {result.terms.transactionFee} per
                                      transaction
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">
                                      Daily Processing Limit
                                    </td>
                                    <td>{result.terms.dailyLimit}</td>
                                  </tr>
                                  <tr className="bg-light">
                                    <td className="fw-bold">
                                      Monthly Volume Limit
                                    </td>
                                    <td>{result.terms.monthlyVolume}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Settlement Time</td>
                                    <td>{result.terms.settlement}</td>
                                  </tr>
                                  <tr className="bg-light">
                                    <td className="fw-bold">Contract Length</td>
                                    <td>{result.terms.contractLength}</td>
                                  </tr>
                                  <tr className="table-success">
                                    <td className="fw-bold">
                                      💰 Hand Net Profit
                                    </td>
                                    <td className="fw-bold text-success fs-5">
                                      {result.terms.handNetProfit}/month
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="alert alert-info">
                              Terms are being calculated...
                            </div>
                          )}
                        </div>

                        <div className="col-lg-4">
                          <Card
                            className="text-white h-100"
                            style={{
                              background: gradients.secondary, 
                              borderRadius: "12px",
                              border: "none",
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" className="fw-bold mb-3">
                                <TrendingUp className="me-2" />
                                Quick Stats
                              </Typography>
                              {result.terms && (
                                <>
                                  <div className="mb-3">
                                    <small className="opacity-75">
                                      Estimated Monthly Revenue
                                    </small>
                                    <div className="fs-4 fw-bold">
                                      {result.terms.estimatedMonthlyRevenue}
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <small className="opacity-75">
                                      Processing Fees
                                    </small>
                                    <div className="fs-5">
                                      {result.terms.estimatedFees}
                                    </div>
                                  </div>
                                  <Divider className="bg-white opacity-25 my-3" />
                                  <div>
                                    <small className="opacity-75">
                                      Your Net Profit
                                    </small>
                                    <div className="fs-3 fw-bold">
                                      {result.terms.handNetProfit}
                                    </div>
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div className="mt-5">
                        <Typography variant="h5" className="fw-bold mb-3">
                          🚀 Next Steps
                        </Typography>
                        <div className="row">
                          {result.nextSteps.map((step, index) => (
                            <div key={index} className="col-md-6 mb-2">
                              <div className="d-flex align-items-center">
                                <span className="badge bg-primary rounded-circle me-3">
                                  {index + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="text-center mt-5">
                        <div className="d-flex gap-3 justify-content-center">
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<Description />}
                            className="px-5"
                            style={{
                              backgroundColor: brandColors.primary,
                              color: "white",
                              padding: "14px 40px",
                              fontSize: "1.1rem",
                              fontWeight: "bold",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(70, 190, 170, 0.3)",
                            }}
                            onClick={onAccept}
                          >
                            Generate Contract & Continue
                          </Button>
                          <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Phone />}
                            className="px-4"
                          >
                            Speak with Advisor
                          </Button>
                        </div>
                        <Typography variant="body2" className="text-muted mt-3">
                          This offer expires in 7 days. Terms are locked once
                          accepted.
                        </Typography>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Denied Content */}
                      <div className="text-center">
                        <Typography variant="h6" className="mb-4">
                          We're unable to approve your application at this time,
                          but we have alternative solutions.
                        </Typography>

                        <div className="row mt-4">
                          <div className="col-md-6">
                            <Card className="h-100 border-warning">
                              <CardContent>
                                <Typography
                                  variant="h6"
                                  className="text-warning"
                                >
                                  💳 Alternative Option 1
                                </Typography>
                                <Typography>
                                  High-risk merchant account with adjusted terms
                                </Typography>
                                <Button variant="outlined" className="mt-3">
                                  Learn More
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                          <div className="col-md-6">
                            <Card className="h-100 border-info">
                              <CardContent>
                                <Typography variant="h6" className="text-info">
                                  📞 Speak with Specialist
                                </Typography>
                                <Typography>
                                  Get personalized guidance for your business
                                </Typography>
                                <Button variant="outlined" className="mt-3">
                                  Schedule Call
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          40%,
          43% {
            transform: translate3d(0, -30px, 0);
          }
          70% {
            transform: translate3d(0, -15px, 0);
          }
          90% {
            transform: translate3d(0, -4px, 0);
          }
        }
        .animate-bounce {
          animation: bounce 1s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ResultsScreen;
