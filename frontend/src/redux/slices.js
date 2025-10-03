import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Backend URL (matching our running backend)
const BASE_URL = "http://localhost:8080/api/v1";

// Upload and process document with Google AI
export const uploadAndProcessDocument = createAsyncThunk(
  "merchant/uploadAndProcessDocument",
  async ({ file, documentType }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const response = await axios.post(
        `${BASE_URL}/upload-and-process`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || "Upload failed"
      );
    }
  }
);

export const submitMerchantApplication = createAsyncThunk(
  "merchant/submitApplication",
  async (applicationData, { rejectWithValue }) => {
    try {
      console.log("🚀 Submitting to SIMPLE endpoint:", applicationData);

      const response = await axios.post(
        `${BASE_URL}/submit-application-simple`,
        {
          personal_data: applicationData.personal,
          business_data: applicationData.business,
          processed_documents: applicationData.documents,
        }
      );

      console.log("✅ SIMPLE endpoint response:", response.data);

      // ✅ ADD: Return both backend response AND original form data
      return {
        ...response.data,
        originalFormData: {
          // Store the original form data
          personal: applicationData.personal,
          business: applicationData.business,
          documents: applicationData.documents,
        },
      };
    } catch (error) {
      console.error("❌ SIMPLE endpoint error:", error);
      return rejectWithValue(
        error.response?.data?.detail || error.message || "Submission failed"
      );
    }
  }
);

// ADD status check for simple endpoint:
export const checkApplicationStatus = createAsyncThunk(
  "merchant/checkApplicationStatus",
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/application-simple/${applicationId}/status`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || "Status check failed"
      );
    }
  }
);

export const generateContract = createAsyncThunk(
  "merchant/generateContract",
  async ({ applicationId, merchantName }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/generate-contract`, {
        application_id: applicationId,
        merchant_name: merchantName,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
          error.message ||
          "Contract generation failed"
      );
    }
  }
);

// Test backend connection
export const testBackendConnection = createAsyncThunk(
  "merchant/testConnection",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/test`);
      return response.data;
    } catch (error) {
      return rejectWithValue("Backend connection failed");
    }
  }
);

// ADD this new action after existing ones (don't touch uploadAndProcessDocument)
export const submitMerchantApplicationTest = createAsyncThunk(
  "merchant/submitApplicationTest",
  async (applicationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/submit-application-test`, {
        personal_data: applicationData.personal,
        business_data: applicationData.business,
        processed_documents: applicationData.documents,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || "Submission failed"
      );
    }
  }
);

const merchantSlice = createSlice({
  name: "merchant",
  initialState: {
    // Connection status
    backendConnected: false,
    connectionError: null,

    // Document processing
    uploadingDocument: false,
    uploadError: null,
    processedDocuments: {},

    // Application submission
    submittingApplication: false,
    submissionError: null,
    applicationSubmitted: false,
    applicationId: null,

    // Application results from production backend
    approvalStatus: null,
    riskScore: null,
    riskLevel: null,
    merchantTerms: null,
    processingTime: null,
    savedToDatabase: null,
    storageMode: null,

    // Contract generation
    contractId: null,
    contractTerms: null,
    contractStatus: null,
    generatingContract: false,
    contractError: null,

    // Status checking
    checkingStatus: false,
    statusError: null,
    applicationSource: null, // database or memory_fallback

    // Form data
    personalDetails: {},
    businessDetails: {},
    uploadedFiles: {},

    // UI state
    currentStep: 0,
    processingResults: null,
  },
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },

    updatePersonalDetails: (state, action) => {
      state.personalDetails = { ...state.personalDetails, ...action.payload };
    },

    updateBusinessDetails: (state, action) => {
      state.businessDetails = { ...state.businessDetails, ...action.payload };
    },

    clearProcessingResults: (state) => {
      state.processingResults = null;
    },

    resetApplication: (state) => {
      state.currentStep = 0;
      state.personalDetails = {};
      state.businessDetails = {};
      state.uploadedFiles = {};
      state.processedDocuments = {};
      state.applicationSubmitted = false;
      state.applicationId = null;
      state.processingResults = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Test connection
      .addCase(testBackendConnection.pending, (state) => {
        state.connectionError = null;
      })
      .addCase(testBackendConnection.fulfilled, (state, action) => {
        state.backendConnected = true;
        state.connectionError = null;
      })
      .addCase(testBackendConnection.rejected, (state, action) => {
        state.backendConnected = false;
        state.connectionError = action.payload;
      })

      // Document upload and processing
      .addCase(uploadAndProcessDocument.pending, (state) => {
        state.uploadingDocument = true;
        state.uploadError = null;
      })
      .addCase(uploadAndProcessDocument.fulfilled, (state, action) => {
        state.uploadingDocument = false;
        state.processingResults = action.payload;

        // Store the processed document data
        // ✅ FIXED: Store by document type from the action meta (not from response)
        const documentType = action.meta.arg.documentType; // Get from original request
        if (documentType) {
          state.processedDocuments[documentType] = action.payload;
          state.uploadedFiles[documentType] = action.payload.upload_data;
        }
      })
      .addCase(uploadAndProcessDocument.rejected, (state, action) => {
        state.uploadingDocument = false;
        state.uploadError = action.payload;
      })

      // Application submission
      .addCase(submitMerchantApplication.pending, (state) => {
        state.submittingApplication = true;
        state.submissionError = null;
      })
      // UPDATE the submitMerchantApplication.fulfilled case:
      .addCase(submitMerchantApplication.fulfilled, (state, action) => {
        state.submittingApplication = false;
        state.applicationSubmitted = true;

        // Store all response data
        state.applicationId = action.payload.application_id;
        state.approvalStatus = action.payload.approval_status;
        state.riskScore = action.payload.risk_score;
        state.riskLevel = action.payload.risk_level;
        state.merchantTerms = action.payload.terms;
        state.processingTime = action.payload.processing_time;
        state.savedToDatabase = action.payload.saved_to_database;
        state.storageMode = action.payload.storage_mode;

        // ✅ ADD: Store the original form data
        if (action.payload.originalFormData) {
          state.personalDetails = action.payload.originalFormData.personal;
          state.businessDetails = action.payload.originalFormData.business;
          // processedDocuments are already stored from upload actions
        }
      })
      .addCase(submitMerchantApplication.rejected, (state, action) => {
        state.submittingApplication = false;
        state.submissionError = action.payload;
      })
      // ADD new cases for contract generation:
      .addCase(generateContract.pending, (state) => {
        state.generatingContract = true;
        state.contractError = null;
      })
      .addCase(generateContract.fulfilled, (state, action) => {
        state.generatingContract = false;
        state.contractId = action.payload.contract_id;
        state.contractTerms = action.payload.contract_terms;
        state.contractStatus = "GENERATED";
      })
      .addCase(generateContract.rejected, (state, action) => {
        state.generatingContract = false;
        state.contractError = action.payload;
      })

      // ADD new cases for status checking:
      .addCase(checkApplicationStatus.pending, (state) => {
        state.checkingStatus = true;
        state.statusError = null;
      })
      .addCase(checkApplicationStatus.fulfilled, (state, action) => {
        state.checkingStatus = false;
        state.applicationSource = action.payload.source;
        // Update any fields that might have changed
        state.approvalStatus = action.payload.status;
        state.riskScore = action.payload.risk_score;
        state.merchantTerms = action.payload.terms;
      })
      .addCase(checkApplicationStatus.rejected, (state, action) => {
        state.checkingStatus = false;
        state.statusError = action.payload;
      });
  },
});

export const {
  setCurrentStep,
  updatePersonalDetails,
  updateBusinessDetails,
  clearProcessingResults,
  resetApplication,
} = merchantSlice.actions;

// Selectors
export const selectBackendConnected = (state) =>
  state.merchant.backendConnected;
export const selectConnectionError = (state) => state.merchant.connectionError;
export const selectUploadingDocument = (state) =>
  state.merchant.uploadingDocument;
export const selectUploadError = (state) => state.merchant.uploadError;
export const selectProcessedDocuments = (state) =>
  state.merchant.processedDocuments;
export const selectProcessingResults = (state) =>
  state.merchant.processingResults;
export const selectCurrentStep = (state) => state.merchant.currentStep;
export const selectApplicationSubmitted = (state) =>
  state.merchant.applicationSubmitted;
export const selectSubmittingApplication = (state) =>
  state.merchant.submittingApplication;
// ADD these new selectors:
export const selectApprovalStatus = (state) => state.merchant.approvalStatus;
export const selectRiskScore = (state) => state.merchant.riskScore;
export const selectRiskLevel = (state) => state.merchant.riskLevel;
export const selectMerchantTerms = (state) => state.merchant.merchantTerms;
export const selectProcessingTime = (state) => state.merchant.processingTime;
export const selectSavedToDatabase = (state) => state.merchant.savedToDatabase;
export const selectContractId = (state) => state.merchant.contractId;
export const selectContractTerms = (state) => state.merchant.contractTerms;
export const selectGeneratingContract = (state) =>
  state.merchant.generatingContract;
export const selectApplicationSource = (state) =>
  state.merchant.applicationSource;

export const selectStorageMode = (state) => state.merchant.storageMode;
export const selectApplicationId = (state) => state.merchant.applicationId;

export const selectPersonalDetails = (state) => state.merchant.personalDetails;
export const selectBusinessDetails = (state) => state.merchant.businessDetails;
export const selectUploadedFiles = (state) => state.merchant.uploadedFiles;

export default merchantSlice.reducer;
