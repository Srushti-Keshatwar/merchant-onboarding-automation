import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // ✅ Redux from your version
import { brandColors, gradients } from "../theme";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Container,
  Alert,
  LinearProgress,
  Chip,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Person,
  Business,
  Description,
  CheckCircle,
  CloudUpload,
  Psychology,
} from "@mui/icons-material";
import "bootstrap/dist/css/bootstrap.min.css";

// ✅ Redux imports
import {
  uploadAndProcessDocument,
  testBackendConnection,
  submitMerchantApplication,
  setCurrentStep,
  resetApplication,
  selectUploadingDocument,
  selectUploadError,
  selectProcessingResults,
  selectProcessedDocuments,
  selectBackendConnected,
  selectCurrentStep,
  selectApplicationSubmitted,
  selectSubmittingApplication,
} from "../redux/slices";

const MainSc = ({ onLogoClick }) => {
  // ✅ Redux integration
  const dispatch = useDispatch();
  const uploadingDocument = useSelector(selectUploadingDocument);
  const uploadError = useSelector(selectUploadError);
  const processingResults = useSelector(selectProcessingResults);
  const processedDocuments = useSelector(selectProcessedDocuments);
  const backendConnected = useSelector(selectBackendConnected);
  const currentStep = useSelector(selectCurrentStep);
  const applicationSubmitted = useSelector(selectApplicationSubmitted);
  const submittingApplication = useSelector(selectSubmittingApplication);
  const [processingDocs, setProcessingDocs] = useState({});

  // Enhanced form data state combining both versions
  const [formData, setFormData] = useState({
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      ssn: "",
      dateOfBirth: "",
      country: "United States",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
    },
    business: {
      businessName: "",
      businessType: "",
      industry: "",
      ein: "",
      foundedDate: "",
      annualRevenue: "",
      monthlyProcessingVolume: "",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      businessAddress: "",
    },
    documents: {},
    review: {},
  });

  // Document upload state
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  // Test backend connection on component mount
  useEffect(() => {
    dispatch(testBackendConnection());
  }, [dispatch]);

  const steps = [
    {
      label: "Personal Details",
      icon: <Person />,
      title: "Tell us about yourself",
      description: "We need your personal information to get started",
    },
    {
      label: "Business Information",
      icon: <Business />,
      title: "Your Business Details",
      description: "Help us understand your business better",
    },
    {
      label: "Documents Upload",
      icon: <Description />,
      title: "AI-Powered Document Processing",
      description: "Upload documents for instant AI analysis",
    },
    {
      label: "Review & Submit",
      icon: <CheckCircle />,
      title: "Almost Done!",
      description: "Review your information and submit",
    },
  ];

  // Form data handler for friend's detailed form fields
  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // In MainSc.js, find the handleNext function and replace it:
  const handleNext = () => {
    // ✅ ADDED: Document validation for step 2 (Documents Upload)
    if (currentStep === 2) {
      const uploadedDocCount = Object.keys(processedDocuments).length;
      if (uploadedDocCount === 0) {
        alert("⚠️ Please upload at least one document before proceeding.");
        return; // ✅ Prevent navigation
      }
    }

    if (currentStep < steps.length - 1) {
      dispatch(setCurrentStep(currentStep + 1));
    } else {
      // Submit application with enhanced data
      dispatch(
        submitMerchantApplication({
          personal: formData.personal,
          business: formData.business,
          documents: processedDocuments,
        })
      );
    }
  };

  const handleBack = () => {
    dispatch(setCurrentStep(currentStep - 1));
  };

  // ✅ Your AI-powered file upload handler
  const handleFileUpload = async (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`Uploading ${documentType}:`, file.name);

    setSelectedFiles((prev) => ({ ...prev, [documentType]: file }));
    setProcessingDocs((prev) => ({ ...prev, [documentType]: true }));

    try {
      await dispatch(uploadAndProcessDocument({ file, documentType })).unwrap();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setProcessingDocs((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  // ✅ Your AI document upload component
  const renderDocumentUpload = (
    documentType,
    label,
    accept = ".pdf,.jpg,.png"
  ) => {
    const isGlobalProcessing = uploadingDocument;
    const isThisDocProcessing = processingDocs[documentType];
    const hasResult = processedDocuments[documentType];
    const selectedFile = selectedFiles[documentType];

    return (
      <div className="col-12 mb-3">
        <label className="form-label">{label}</label>
        <input
          type="file"
          className="form-control mb-2"
          accept={accept}
          onChange={(e) => handleFileUpload(e, documentType)}
          disabled={isGlobalProcessing}
        />

        {selectedFile && (
          <div className="mt-2">
            <small className="text-muted">Selected: {selectedFile.name}</small>

            {(isThisDocProcessing || (isGlobalProcessing && !hasResult)) && (
              <div className="mt-2">
                <LinearProgress />
                <small className="text-primary">
                  🤖 AI is analyzing your {label.toLowerCase()}...
                </small>
              </div>
            )}

            {hasResult && hasResult.ai_processing && !isThisDocProcessing && (
              <Alert severity="success" className="mt-2">
                <Typography variant="body2">
                  <strong>✅ AI Processing Complete!</strong>
                </Typography>
                <Typography variant="caption" display="block">
                  📄 Text extracted:{" "}
                  {hasResult.ai_processing?.full_text_length || 0} characters
                  <br />
                  🎯 Confidence:{" "}
                  {Math.round(
                    (hasResult.ai_processing?.confidence_score || 0) * 100
                  )}
                  %<br />
                  📋 Fields detected:{" "}
                  {
                    Object.keys(hasResult.ai_processing?.form_fields || {})
                      .length
                  }
                </Typography>
                {hasResult.ai_processing?.form_fields &&
                  Object.keys(hasResult.ai_processing.form_fields).length >
                    0 && (
                    <Box mt={1}>
                      <Typography variant="caption" display="block">
                        <strong>Extracted Data:</strong>
                      </Typography>
                      {Object.entries(hasResult.ai_processing.form_fields).map(
                        ([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )
                      )}
                    </Box>
                  )}
              </Alert>
            )}

            {uploadError && !isThisDocProcessing && (
              <Alert severity="error" className="mt-2">
                <Typography variant="body2">
                  <strong>❌ Upload Failed:</strong> {uploadError}
                </Typography>
              </Alert>
            )}
          </div>
        )}
      </div>
    );
  };

  const containerStyle = {
    minHeight: "100vh",
    background: gradients.light,
    display: "flex",
    flexDirection: "column",
  };

  const cardStyle = {
    minHeight: "400px",
    width: "100%" ,
    transition: "all 0.5s ease-in-out",
    background: gradients.primary,
    color: "white",
    borderRadius: "16px",
    border: "none",
    boxShadow: "0 8px 32px rgba(70, 190, 170, 0.3)",
  };

  const carddiv = {
    width: "100%",
  }

  // Main Onboarding Flow
  return (
    <div style={containerStyle}>
      {/* ✅ enhanced header with AI features */}
      <header className="bg-white shadow-sm py-3">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div
              className="d-flex align-items-center"
              onClick={onLogoClick} // ✅ ADD onClick
              style={{ cursor: "pointer" }} // ✅ ADD pointer cursor
            >
              <div
                className="bg-primary rounded-circle p-2 me-3"
                style={{ backgroundColor: brandColors.primary }}
              >
                <Psychology className="text-white" />
              </div>
              <div>
                <h2
                  className="h4 mb-0 fw-bold"
                  style={{ color: brandColors.primary }}
                >
                  MerchantFlow AI
                </h2>
                <small className="text-muted">Powered by Google Cloud AI</small>
              </div>
            </div>
            <div className="d-flex align-items-center">
              {backendConnected ? (
                <Chip label="🟢 AI Connected" color="success" size="small" />
              ) : (
                <Chip label="🔴 AI Offline" color="error" size="small" />
              )}
              <div className="text-muted ms-3">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 py-5">
        <Container>
          {/* ✅ Enhanced stepper  */}
          <div
            className="mb-3"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              padding: "15px 15px",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}
          >
            <Stepper activeStep={currentStep} alternativeLabel className="mb-2">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    icon={step.icon}
                    sx={{
                      "& .MuiStepIcon-root": {
                        fontSize: "2rem",
                        color:
                          index < currentStep
                            ? "#4CAF50"
                            : index === currentStep
                            ? "#0d47a1"
                            : "#ccc",
                        backgroundColor:
                          index === currentStep
                            ? "#e3f2fd"
                            : index < currentStep
                            ? "rgba(76, 175, 80, 0.1)"
                            : "transparent",
                        borderRadius: "50%",
                        padding: "6px",
                        border:
                          index === currentStep
                            ? "2px solid #0d47a1"
                            : index < currentStep
                            ? "2px solid #4CAF50"
                            : "2px solid #ccc",
                      },
                      "& .MuiStepLabel-label": {
                        fontWeight: index === currentStep ? "bold" : "normal",
                        color:
                          index === currentStep
                            ? "#0d47a1"
                            : index < currentStep
                            ? "#4CAF50"
                            : "#999",
                      },
                    }}
                  >
                    <Typography variant="body2">{step.label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </div>

          {/* Card Content */}
          <div className="row justify-content-center" style={carddiv}>
            <div className="col-lg-8 col-xl-6"  style={carddiv}>
              <Card className="shadow-lg border-0" style={cardStyle}>
                <CardContent className="p-5">
                  <div className="text-center mb-4">
                    <div className="mb-3">
                      {React.cloneElement(steps[currentStep].icon, {
                        style: { fontSize: "60px", opacity: 0.9 },
                      })}
                    </div>
                    <Typography variant="h4" className="fw-bold mb-2">
                      {steps[currentStep].title}
                    </Typography>
                    <Typography variant="body1" style={{ opacity: 0.9 }}>
                      {steps[currentStep].description}
                    </Typography>
                  </div>

                  <div
                    className="bg-white rounded p-4 mb-4"
                    style={{ color: "#333" }}
                  >
                    {/* ✅ Enhanced Personal Information step */}
                    {currentStep === 0 && (
                      <div>
                        <h5 className="mb-3">Personal Information</h5>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="First Name"
                              value={formData.personal.firstName}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "firstName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Last Name"
                              value={formData.personal.lastName}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "lastName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-12">
                            <input
                              type="email"
                              className="form-control"
                              placeholder="Email Address"
                              value={formData.personal.email}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "email",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="tel"
                              className="form-control"
                              placeholder="Phone Number"
                              value={formData.personal.phone}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "phone",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="SSN (XXX-XX-XXXX)"
                              value={formData.personal.ssn}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "ssn",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label text-muted">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              value={formData.personal.dateOfBirth}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "dateOfBirth",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Country"
                              value={formData.personal.country}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "country",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="col-12">
                            <hr className="my-3" />
                            <h6 className="mb-3 text-primary">
                              Address Information
                            </h6>
                          </div>
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Street Address"
                              value={formData.personal.streetAddress}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "streetAddress",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="City"
                              value={formData.personal.city}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "city",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="State"
                              value={formData.personal.state}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "state",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="ZIP Code"
                              value={formData.personal.zipCode}
                              onChange={(e) =>
                                handleInputChange(
                                  "personal",
                                  "zipCode",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ Enhanced Business Information step  */}
                    {currentStep === 1 && (
                      <div>
                        <h5 className="mb-3">Business Details</h5>
                        <div className="row g-3">
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Business Name"
                              value={formData.business.businessName}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "businessName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <select
                              className="form-select"
                              value={formData.business.businessType}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "businessType",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Business Type</option>
                              <option value="LLC">LLC</option>
                              <option value="Corporation">Corporation</option>
                              <option value="Partnership">Partnership</option>
                              <option value="Sole Proprietorship">
                                Sole Proprietorship
                              </option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <select
                              className="form-select"
                              value={formData.business.industry}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "industry",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Industry</option>
                              <option value="Professional Services">
                                Professional Services
                              </option>
                              <option value="Retail">Retail</option>
                              <option value="Restaurant">Restaurant</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="E-commerce">E-commerce</option>
                              <option value="Technology">Technology</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="EIN (XX-XXXXXXX)"
                              value={formData.business.ein}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "ein",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label text-muted">
                              Founded Date
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              value={formData.business.foundedDate}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "foundedDate",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="col-12">
                            <hr className="my-3" />
                            <h6 className="mb-3 text-primary">
                              Financial Information
                            </h6>
                          </div>
                          <div className="col-md-6">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Annual Revenue ($)"
                              value={formData.business.annualRevenue}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "annualRevenue",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Monthly Processing Volume ($)"
                              value={formData.business.monthlyProcessingVolume}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "monthlyProcessingVolume",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="col-12">
                            <hr className="my-3" />
                            <h6 className="mb-3 text-primary">
                              Bank Account Information
                            </h6>
                          </div>
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Bank Name"
                              value={formData.business.bankName}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "bankName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Account Number"
                              value={formData.business.accountNumber}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "accountNumber",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Routing Number"
                              value={formData.business.routingNumber}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "routingNumber",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-12">
                            <textarea
                              className="form-control"
                              rows="3"
                              placeholder="Business Address (if different from personal)"
                              value={formData.business.businessAddress}
                              onChange={(e) =>
                                handleInputChange(
                                  "business",
                                  "businessAddress",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ AI-powered document upload step */}
                    {currentStep === 2 && (
                      <div>
                        <h5 className="mb-3">🤖 AI Document Processing</h5>
                        <Alert severity="info" className="mb-3">
                          <strong>
                            Upload documents for instant AI analysis!
                          </strong>
                          <br />
                          Our Google Cloud AI will extract data, verify
                          authenticity, and assess confidence in real-time.
                        </Alert>
                        {/* validation alert */}
                        {Object.keys(processedDocuments).length === 0 && (
                          <Alert severity="warning" className="mb-3">
                            <strong>
                              ⚠️ At least one document is required
                            </strong>
                            <br />
                            Please upload at least one document to proceed to
                            the next step.
                          </Alert>
                        )}

                        {/* success message when documents uploaded */}
                        {Object.keys(processedDocuments).length > 0 && (
                          <Alert severity="success" className="mb-3">
                            <strong>
                              ✅ {Object.keys(processedDocuments).length}{" "}
                              document(s) processed!
                            </strong>
                            <br />
                            You can upload more documents or proceed to review.
                          </Alert>
                        )}
                        <div className="row g-3">
                          {renderDocumentUpload(
                            "business_license",
                            "Business License",
                            ".pdf,.jpg,.png"
                          )}
                          {renderDocumentUpload(
                            "ein_letter",
                            "EIN Letter (IRS Document)",
                            ".pdf,.jpg,.png"
                          )}
                          {renderDocumentUpload(
                            "drivers_license",
                            "Driver License / ID",
                            ".pdf,.jpg,.png"
                          )}
                          {renderDocumentUpload(
                            "bank_statement",
                            "Bank Statement (Last 3 months)",
                            ".pdf"
                          )}
                          {renderDocumentUpload(
                            "articles_incorporation",
                            "Articles of Incorporation (if applicable)",
                            ".pdf,.jpg,.png"
                          )}
                        </div>
                      </div>
                    )}

                    {/* ✅ Enhanced Review step combining both versions */}
                    {currentStep === 3 && (
                      <div>
                        <h5 className="mb-3">🎯 AI Processing Summary</h5>
                        <Alert severity="success" className="mb-3">
                          <strong>All documents processed with AI!</strong>
                          <br />
                          Your application is ready for submission.
                        </Alert>

                        {Object.keys(processedDocuments).length > 0 && (
                          <div className="mb-3">
                            <h6>📄 Processed Documents:</h6>
                            {Object.entries(processedDocuments).map(
                              ([docType, data]) => (
                                <div
                                  key={docType}
                                  className="d-flex justify-content-between align-items-center mb-2"
                                >
                                  <span>
                                    {docType.replace("_", " ").toUpperCase()}
                                  </span>
                                  <Chip
                                    label={`${Math.round(
                                      (data.ai_processing?.confidence_score ||
                                        0) * 100
                                    )}% confident`}
                                    color="success"
                                    size="small"
                                  />
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <div className="row g-3">
                          <div className="col-12">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="terms"
                                required
                              />
                              <label
                                className="form-check-label"
                                htmlFor="terms"
                              >
                                I agree to the Terms & Conditions and Privacy
                                Policy
                              </label>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="confirm"
                                required
                              />
                              <label
                                className="form-check-label"
                                htmlFor="confirm"
                              >
                                I confirm all information is accurate and
                                complete
                              </label>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="consent"
                                required
                              />
                              <label
                                className="form-check-label"
                                htmlFor="consent"
                              >
                                I consent to background checks and KYC/AML
                                verification
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="d-flex justify-content-between">
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      style={{
                        color: "white",
                        borderColor: "white",
                        opacity: currentStep === 0 ? 0.5 : 1,
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={submittingApplication}
                      style={{
                        backgroundColor: "white",
                        color: brandColors.primary,
                        fontWeight: "bold",
                        padding: "12px 32px",
                        fontSize: "1.1rem",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      {submittingApplication ? (
                        <>
                          <CircularProgress size={20} className="me-2" />
                          Processing...
                        </>
                      ) : currentStep === steps.length - 1 ? (
                        "Submit Application"
                      ) : (
                        "Next"
                      )}
                    </Button>
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
    </div>
  );
};

export default MainSc;
