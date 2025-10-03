import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { brandColors, gradients } from "../theme";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
} from "@mui/material";
import {
  Description,
  AutoAwesome,
  Security,
  CheckCircle,
  AccountBalance,
  Gavel,
  EditNote,
  Send,
} from "@mui/icons-material";
import "bootstrap/dist/css/bootstrap.min.css";

// Import Redux selectors
import {
  selectApplicationId,
  selectMerchantTerms,
  selectApprovalStatus,
  selectApplicationSubmitted,
  selectPersonalDetails,
  selectBusinessDetails,
  selectProcessedDocuments,
} from "../redux/slices";

const ContractScreen = ({ onComplete, onLogoClick }) => {
  const { applicationId: urlApplicationId } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    compliance: false,
    pricing: false,
  });
  const [signature, setSignature] = useState("");
  const [isSignatureValid, setIsSignatureValid] = useState(false);

  // Get real data from Redux
  const reduxApplicationId = useSelector(selectApplicationId);
  const merchantTerms = useSelector(selectMerchantTerms);
  const approvalStatus = useSelector(selectApprovalStatus);
  const applicationSubmitted = useSelector(selectApplicationSubmitted);

  const personalData = useSelector(selectPersonalDetails);
  const businessData = useSelector(selectBusinessDetails);
  const documentsData = useSelector(selectProcessedDocuments);

  // Use URL application ID or fallback to Redux
  const currentApplicationId =
    urlApplicationId || reduxApplicationId || "APP-LOADING...";

  // Build contract data from real Redux state
  const contractData = {
    applicationId: currentApplicationId,
    merchantName:
      businessData?.businessName ||
      personalData?.firstName + " " + personalData?.lastName ||
      "Your Business", // ✅ FIXED
    approvalDate: new Date().toLocaleDateString(),
    effectiveDate: new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toLocaleDateString(),
    status: approvalStatus,
    terms: merchantTerms
      ? {
          rate: merchantTerms.rate || "2.9%",
          transactionFee: merchantTerms.transaction_fee || "$0.30",
          dailyLimit: merchantTerms.daily_limit || "$50,000",
          monthlyVolume: merchantTerms.monthly_volume || "$500,000",
          settlement: merchantTerms.settlement || "Next business day",
          contractLength: merchantTerms.contract_length || "12 months",
          handNetProfit: merchantTerms.hand_net_profit || "$1,450",
        }
      : {
          // Fallback terms if Redux is empty
          rate: "2.9%",
          transactionFee: "$0.30",
          dailyLimit: "$50,000",
          monthlyVolume: "$500,000",
          settlement: "Next business day",
          contractLength: "12 months",
          handNetProfit: "$1,450",
        },
  };

  const steps = [
    "Review Terms",
    "Legal Agreements",
    "Digital Signature",
    "Complete Contract",
  ];

  useEffect(() => {
    setIsSignatureValid(signature.length >= 3);
  }, [signature]);

  // Debug info
  console.log("🔍 ContractScreen Debug:");
  console.log("URL Application ID:", urlApplicationId);
  console.log("Redux Application ID:", reduxApplicationId);
  console.log("Current Application ID:", currentApplicationId);
  console.log("Merchant Terms:", merchantTerms);
  console.log("Approval Status:", approvalStatus);

  //Debug temporary
  console.log("🔍 ContractScreen Debug:");
  console.log("URL Application ID:", urlApplicationId);
  console.log("Redux Application ID:", reduxApplicationId);
  console.log("Current Application ID:", currentApplicationId);
  console.log("Merchant Terms:", merchantTerms);
  console.log("Approval Status:", approvalStatus);

  // ✅ UPDATED: Use correct selectors
  console.log("🏢 Available Redux Data:");
  console.log("- Application Submitted:", applicationSubmitted);

  console.log("- Personal Data:", personalData);
  console.log("- Business Data:", businessData);
  console.log("- Documents Data:", documentsData);

  useEffect(() => {
    // If user navigates directly to contract URL but Redux is empty
    if (urlApplicationId && !reduxApplicationId && !applicationSubmitted) {
      console.log(
        "🔄 Loading application data for direct URL access:",
        urlApplicationId
      );
      // TODO: Dispatch action to load application data
      // dispatch(checkApplicationStatus(urlApplicationId));
    }
  }, [urlApplicationId, reduxApplicationId, applicationSubmitted]);

  const handleAgreementChange = (key) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allAgreementsChecked = Object.values(agreements).every(Boolean);
  const canProceed = allAgreementsChecked && isSignatureValid;

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Submit contract
      console.log("Contract submitted for:", currentApplicationId);
      // TODO: Call contract generation API here
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Show loading if no application data
  if (!applicationSubmitted && !urlApplicationId) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3">Loading contract data...</div>
        </div>
      </div>
    );
  }

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #14b18fff 0%, #2a3198ff 100%)",
    display: "flex",
    flexDirection: "column",
  };

  //   // Add this function after the existing handleBack function:
  //   const handleDownloadContract = async () => {
  //     try {
  //       console.log("📄 Generating contract for:", currentApplicationId);

  //       // Prepare contract data using your existing Redux data
  //       const contractPayload = {
  //         application_id: currentApplicationId,
  //         personal_data: personalData,
  //         business_data: businessData,
  //         merchant_terms: merchantTerms,
  //         processed_documents: documentsData || {},
  //       };

  //       console.log("📋 Contract payload:", contractPayload);

  //       // Call your backend API
  //       const response = await fetch(
  //         `http://localhost:8080/api/v1/generate-contract/${currentApplicationId}`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify(contractPayload),
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }

  //       const result = await response.json();
  //       console.log("✅ Contract generated:", result);

  //       if (result.success) {
  //         // Download the PDF
  //         const downloadUrl = `http://localhost:8080/api/v1/download-contract/${result.filename}`;
  //         const link = document.createElement("a");
  //         link.href = downloadUrl;
  //         link.download = result.filename;
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);

  //         console.log("✅ Contract downloaded:", result.filename);
  //       }
  //     } catch (error) {
  //       console.error("❌ Contract generation failed:", error);
  //       alert(`Contract generation failed: ${error.message}`);
  //     }
  //   };
  const handleDownloadContract = async () => {
    try {
      console.log("📄 Starting contract generation for:", currentApplicationId);

      // Prepare contract data using your existing Redux data
      const contractPayload = {
        application_id: currentApplicationId,
        personal_data: personalData,
        business_data: businessData,
        merchant_terms: merchantTerms,
        processed_documents: documentsData || {},
      };

      console.log("📋 Contract payload:", contractPayload);

      // Call your backend API
      const generateUrl = `http://localhost:8080/api/v1/generate-contract/${currentApplicationId}`;
      console.log("🌐 Generate URL:", generateUrl);

      const response = await fetch(generateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractPayload),
      });

      console.log("📡 Generate response status:", response.status);
      console.log("📡 Generate response ok:", response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Contract generation result:", result);

      if (result.success) {
        // ✅ ADD: Debug the download URL construction
        const downloadUrl = `http://localhost:8080/api/v1/download-contract/${result.filename}`;
        console.log("📥 Download URL constructed:", downloadUrl);

        // ✅ ADD: Test the download URL directly first
        console.log("🔍 Testing download URL accessibility...");

        try {
          const testResponse = await fetch(downloadUrl, { method: "HEAD" });
          console.log("🔍 Download URL test status:", testResponse.status);
          console.log("🔍 Download URL test ok:", testResponse.ok);
        } catch (testError) {
          console.error("🔍 Download URL test failed:", testError);
        }

        // ✅ ADD: Try direct window.open first (for debugging)
        console.log("🚀 Attempting window.open download...");
        window.open(downloadUrl, "_blank");

        // Also try the original method
        console.log("🚀 Attempting programmatic download...");
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = result.filename;
        link.target = "_blank"; // Add this for backup
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Download attempts completed");
      } else {
        throw new Error("Contract generation failed");
      }
    } catch (error) {
      console.error("❌ Contract process failed:", error);
      alert(`Contract generation failed: ${error.message}`);
    }
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
            <div className="ms-auto d-flex gap-2">
              <span className="badge bg-warning fs-6">Contract Pending</span>
              <span className="badge bg-info fs-6">{currentApplicationId}</span>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 py-5">
        <Container>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Progress Stepper */}
              <Card className="mb-4 shadow-sm">
                <CardContent className="py-3">
                  <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>

              {/* Main Contract Card */}
              <Card
                className="shadow-lg border-0"
                style={{
                  background: "rgba(255, 255, 255, 0.98)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(70, 190, 170, 0.2)",
                }}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <div className="mb-3">
                      <Description
                        style={{
                          fontSize: "60px",
                          color: brandColors.primary,
                        }}
                      />
                    </div>
                    <Typography
                      variant="h3"
                      className="fw-bold mb-2 text-primary"
                    >
                      Merchant Processing Agreement
                    </Typography>
                    <Typography variant="h6" className="text-muted">
                      Application ID: {contractData.applicationId}
                    </Typography>
                    {/* Debug info */}
                    <Typography variant="body2" className="text-muted">
                      Status: {contractData.status} | Terms:{" "}
                      {merchantTerms ? "Loaded" : "Fallback"}
                    </Typography>
                  </div>

                  {activeStep === 0 && (
                    <div>
                      <Typography variant="h5" className="fw-bold mb-4">
                        📋 Contract Terms Summary
                      </Typography>

                      <div className="row">
                        <div className="col-lg-8">
                          {/* Your existing table stays exactly the same */}
                          <div className="table-responsive">
                            <table className="table table-borderless">
                              <tbody>
                                <tr className="bg-light">
                                  <td className="fw-bold">Merchant Name</td>
                                  <td>{contractData.merchantName}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Approval Date</td>
                                  <td>{contractData.approvalDate}</td>
                                </tr>
                                <tr className="bg-light">
                                  <td className="fw-bold">
                                    Contract Effective Date
                                  </td>
                                  <td>{contractData.effectiveDate}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Processing Rate</td>
                                  <td>
                                    {contractData.terms.rate} +{" "}
                                    {contractData.terms.transactionFee}
                                  </td>
                                </tr>
                                <tr className="bg-light">
                                  <td className="fw-bold">Daily Limit</td>
                                  <td>{contractData.terms.dailyLimit}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Monthly Volume</td>
                                  <td>{contractData.terms.monthlyVolume}</td>
                                </tr>
                                <tr className="bg-light">
                                  <td className="fw-bold">Settlement</td>
                                  <td>{contractData.terms.settlement}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Contract Length</td>
                                  <td>{contractData.terms.contractLength}</td>
                                </tr>
                                <tr className="table-success">
                                  <td className="fw-bold">
                                    💰 Hand Net Profit
                                  </td>
                                  <td className="fw-bold text-success fs-5">
                                    {contractData.terms.handNetProfit}/month
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* ✅ ADD this download button section (following your Bootstrap + MUI pattern) */}
                          <div className="text-center mt-4">
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleDownloadContract}
                              startIcon={<Description />}
                              size="large"
                              className="px-4"
                              style={{
                                backgroundColor: brandColors.primary,
                                padding: "12px 32px",
                                fontSize: "1.05rem",
                                fontWeight: "bold",
                                borderRadius: "8px",
                              }}
                            >
                              📄 Download Contract PDF
                            </Button>
                            <div className="mt-2">
                              <Typography
                                variant="body2"
                                className="text-muted"
                              >
                                Generate and download the complete merchant
                                agreement
                              </Typography>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4">
                          {/* Your existing Alert components stay exactly the same */}
                          <Alert severity="info" className="mb-3">
                            <strong>Important:</strong> These terms are locked
                            for 7 days after signing.
                          </Alert>
                          <Alert severity="success">
                            <strong>Estimated ROI:</strong> 340% annually based
                            on your projected volume.
                          </Alert>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div>
                      <Typography variant="h5" className="fw-bold mb-4">
                        📜 Legal Agreements & Compliance
                      </Typography>

                      <div className="row">
                        <div className="col-lg-8">
                          <div className="space-y-4">
                            <Card className="border mb-3">
                              <CardContent>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={agreements.terms}
                                      onChange={() =>
                                        handleAgreementChange("terms")
                                      }
                                      color="primary"
                                    />
                                  }
                                  label={
                                    <div>
                                      <Typography
                                        variant="h6"
                                        className="fw-bold"
                                      >
                                        Terms & Conditions
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        className="text-muted"
                                      >
                                        I agree to the merchant processing
                                        terms, including processing rates,
                                        settlement timelines, and volume limits
                                        as outlined above.
                                      </Typography>
                                    </div>
                                  }
                                />
                              </CardContent>
                            </Card>

                            <Card className="border mb-3">
                              <CardContent>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={agreements.privacy}
                                      onChange={() =>
                                        handleAgreementChange("privacy")
                                      }
                                      color="primary"
                                    />
                                  }
                                  label={
                                    <div>
                                      <Typography
                                        variant="h6"
                                        className="fw-bold"
                                      >
                                        Privacy Policy & Data Protection
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        className="text-muted"
                                      >
                                        I acknowledge the privacy policy and
                                        consent to data processing for payment
                                        processing and compliance purposes.
                                      </Typography>
                                    </div>
                                  }
                                />
                              </CardContent>
                            </Card>

                            <Card className="border mb-3">
                              <CardContent>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={agreements.compliance}
                                      onChange={() =>
                                        handleAgreementChange("compliance")
                                      }
                                      color="primary"
                                    />
                                  }
                                  label={
                                    <div>
                                      <Typography
                                        variant="h6"
                                        className="fw-bold"
                                      >
                                        PCI DSS & Security Compliance
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        className="text-muted"
                                      >
                                        I agree to maintain PCI DSS compliance
                                        and follow all security protocols for
                                        payment data handling.
                                      </Typography>
                                    </div>
                                  }
                                />
                              </CardContent>
                            </Card>

                            <Card className="border mb-3">
                              <CardContent>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={agreements.pricing}
                                      onChange={() =>
                                        handleAgreementChange("pricing")
                                      }
                                      color="primary"
                                    />
                                  }
                                  label={
                                    <div>
                                      <Typography
                                        variant="h6"
                                        className="fw-bold"
                                      >
                                        Pricing & Fee Structure
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        className="text-muted"
                                      >
                                        I understand all fees, including
                                        processing rates, monthly fees, and any
                                        additional charges as disclosed in the
                                        pricing schedule.
                                      </Typography>
                                    </div>
                                  }
                                />
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <Alert severity="warning">
                            <Security className="me-2" />
                            <strong>Legal Requirement:</strong> All agreements
                            must be accepted to proceed.
                          </Alert>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div>
                      <Typography variant="h5" className="fw-bold mb-4">
                        ✍️ Digital Signature
                      </Typography>

                      <div className="row">
                        <div className="col-lg-8">
                          <Card className="border">
                            <CardContent>
                              <Typography variant="h6" className="mb-3">
                                Electronic Signature
                              </Typography>
                              <Typography
                                variant="body2"
                                className="text-muted mb-3"
                              >
                                By typing your full name below, you are
                                providing a legally binding electronic signature
                                equivalent to a handwritten signature.
                              </Typography>

                              <div className="mb-3">
                                <label className="form-label fw-bold">
                                  Full Legal Name *
                                </label>
                                <input
                                  type="text"
                                  className="form-control form-control-lg"
                                  placeholder="Type your full legal name"
                                  value={signature}
                                  onChange={(e) => setSignature(e.target.value)}
                                  style={{
                                    fontFamily: "cursive",
                                    fontSize: "1.5rem",
                                    border: isSignatureValid
                                      ? "2px solid #4CAF50"
                                      : "2px solid #ddd",
                                  }}
                                />
                                {signature && (
                                  <div className="mt-2">
                                    <small
                                      className={
                                        isSignatureValid
                                          ? "text-success"
                                          : "text-danger"
                                      }
                                    >
                                      {isSignatureValid
                                        ? "✓ Valid signature"
                                        : "Please enter your full name (minimum 3 characters)"}
                                    </small>
                                  </div>
                                )}
                              </div>

                              <div className="bg-light p-3 rounded">
                                <Typography variant="body2">
                                  <strong>Date:</strong>{" "}
                                  {new Date().toLocaleString()}
                                  <br />
                                  <strong>IP Address:</strong> 192.168.1.100
                                  <br />
                                  <strong>Application ID:</strong>{" "}
                                  {contractData.applicationId}
                                </Typography>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="col-lg-4">
                          <Alert severity="info" className="mb-3">
                            <EditNote className="me-2" />
                            <strong>Digital Signature:</strong> Your signature
                            will be encrypted and stored securely.
                          </Alert>
                          <Alert severity="success">
                            <CheckCircle className="me-2" />
                            <strong>Legally Binding:</strong> This electronic
                            signature has the same legal effect as a handwritten
                            signature.
                          </Alert>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="text-center">
                      <CheckCircle
                        style={{
                          fontSize: "80px",
                          color: "#4CAF50",
                          marginBottom: "20px",
                        }}
                      />
                      <Typography
                        variant="h4"
                        className="fw-bold text-success mb-3"
                      >
                        Contract Complete!
                      </Typography>
                      <Typography variant="h6" className="text-muted mb-4">
                        Your merchant processing agreement has been successfully
                        executed.
                      </Typography>

                      <div className="row justify-content-center">
                        <div className="col-md-8">
                          <Alert severity="success" className="mb-4">
                            <strong>What's Next:</strong>
                            <ul className="mb-0 mt-2 text-start">
                              <li>
                                You'll receive a signed copy via email within 5
                                minutes
                              </li>
                              <li>Account setup will begin within 24 hours</li>
                              <li>
                                Integration credentials will be provided within
                                48 hours
                              </li>
                              <li>
                                Your account manager will contact you within 1
                                business day
                              </li>
                            </ul>
                          </Alert>
                        </div>
                      </div>

                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<AccountBalance />}
                        className="px-5"
                        style={{ backgroundColor: "#4CAF50" }}
                        onClick={() => console.log("Navigate to dashboard")}
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  {activeStep < 3 && (
                    <div className="d-flex justify-content-between mt-5 pt-4 border-top">
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        disabled={activeStep === 0}
                      >
                        Back
                      </Button>

                      <Button
                        variant="contained"
                        onClick={handleNext}
                        startIcon={activeStep === 2 ? <Send /> : null}
                        style={{
                          backgroundColor: brandColors.primary,
                          color: "white",
                          padding: "12px 32px",
                          fontSize: "1.05rem",
                          fontWeight: "bold",
                          borderRadius: "8px",
                        }}
                      >
                        {activeStep === 2 ? "Sign Contract" : "Continue"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
};

export default ContractScreen;
