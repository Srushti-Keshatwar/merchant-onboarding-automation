-- init.sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_created_at ON merchants(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_merchant_id ON documents(merchant_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_processing_logs_merchant_id ON processing_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_stage ON processing_logs(stage);