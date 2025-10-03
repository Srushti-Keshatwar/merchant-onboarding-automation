// frontend/src/theme.js
export const brandColors = {
    primary: '#46beaa',      // Company teal
    primaryLight: '#76e9d5', // Company light teal
    primaryDark: '#2a9d8f',  // Darker teal
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
    white: '#ffffff',
    dark: '#2c3e50',
    lightGray: '#f8f9fa',
    mediumGray: '#e0e0e0',
  };
  
  export const gradients = {
    primary: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryLight} 100%)`,
    secondary: `linear-gradient(135deg, ${brandColors.primaryDark} 0%, ${brandColors.primary} 100%)`,
    light: `linear-gradient(135deg, ${brandColors.primaryLight} 0%, #ffffff 100%)`,
  };