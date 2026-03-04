/**
 * Environment configuration for Tax Invoice Generator Pro
 * Supports both development and production environments
 */

export const config = {
  // Application
  app: {
    name: import.meta.env.VITE_APP_TITLE || 'Tax Invoice Generator Pro',
    version: '1.0.0',
    environment: import.meta.env.MODE, // 'development' or 'production'
  },

  // Feature flags
  features: {
    enableDebugLogging: import.meta.env.MODE === 'development',
    enableAnalytics: import.meta.env.MODE === 'production',
  },

  // API endpoints (for future use)
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '',
    timeout: 30000,
  },

  // PDF Configuration
  pdf: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    defaultFont: 'Helvetica',
    pageSize: 'A4',
  },

  // Invoice Configuration
  invoice: {
    defaultPaymentTerms: '30days',
    defaultTransportMode: 'road',
    numberFormat: 'INV-YYYY-MM-DD-XXXXX', // Format placeholder
  },
};

export default config;
