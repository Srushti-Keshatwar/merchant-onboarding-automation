import React from "react";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import { useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import store from "./redux/store";
import LoginSc from "./components/LoginSc";
import MainSc from "./components/MainSc";
import ProcessingScreen from "./components/processingSteps";
import ResultsScreen from "./components/ResultsScreen";
import ContractScreen from "./components/ContractScreen";
import { selectApplicationSubmitted, selectApplicationId } from "./redux/slices";
import { useDispatch } from "react-redux";
import { resetApplication } from "./redux/slices";

const theme = createTheme();

// ✅ FIXED: Navigation component with better logic
function AppFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const applicationSubmitted = useSelector(selectApplicationSubmitted);
  const applicationId = useSelector(selectApplicationId);

  // ✅ FIXED: Prevent multiple redirects with location tracking
  React.useEffect(() => {
    if (applicationSubmitted && applicationId && location.pathname === "/onboarding") {
      console.log("🚀 App submitted, navigating to processing");
      navigate("/processing");
    }
  }, [applicationSubmitted, applicationId, navigate, location.pathname]); // ✅ Added location.pathname

  // Navigation functions for components
  const goToLogin = () => navigate("/login");
  const goToOnboarding = () => navigate("/onboarding");
  const goToProcessing = () => navigate("/processing");
  const goToResults = () => navigate("/results");
  const goToContract = () => {
    if (applicationId) {
      console.log("🎯 Navigating to contract:", applicationId);
      navigate(`/contract/${applicationId}`);
    } else {
      console.error("❌ No application ID for contract");
    }
  };

  const handleLogoClick = () => {
    console.log("🔄 Logo clicked - resetting application");
    dispatch(resetApplication()); // Clear all Redux state
    navigate("/onboarding"); // Go back to start
  };


  return (
    <Routes>
      {/* Pass handleLogoClick to all components */}
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      
      <Route 
        path="/login" 
        element={<LoginSc onLogin={goToOnboarding} onLogoClick={handleLogoClick} />} 
      />
      
      <Route 
        path="/onboarding" 
        element={<MainSc onNext={goToProcessing} onLogoClick={handleLogoClick} />} 
      />
      
      <Route 
        path="/processing" 
        element={<ProcessingScreen onComplete={goToResults} onLogoClick={handleLogoClick} />} 
      />
      
      <Route 
        path="/results" 
        element={<ResultsScreen onAccept={goToContract} onBack={goToOnboarding} onLogoClick={handleLogoClick} />} 
      />
      
      <Route 
        path="/contract/:applicationId" 
        element={<ContractScreen onComplete={goToOnboarding} onLogoClick={handleLogoClick} />} 
      />

      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppFlow />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;