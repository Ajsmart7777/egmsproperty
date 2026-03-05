/**
 * Error handler utility to map database/API errors to safe user-facing messages.
 * This prevents exposing sensitive information like table names, column names,
 * or internal implementation details to end users.
 */

export const mapErrorToUserMessage = (error: unknown, fallbackMessage: string = "An error occurred. Please try again."): string => {
  // Log full error in development only
  if (import.meta.env.DEV) {
    console.error('Detailed error:', error);
  }

  // Extract error message safely
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'object' && error !== null && 'message' in error 
      ? String((error as { message: unknown }).message)
      : '';

  // Map known error patterns to safe messages
  if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
    return 'This record already exists.';
  }
  
  if (errorMessage.includes('permission denied') || errorMessage.includes('not authorized')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (errorMessage.includes('violates check constraint')) {
    return 'Invalid data provided. Please check your input.';
  }
  
  if (errorMessage.includes('violates foreign key')) {
    return 'The referenced record does not exist.';
  }
  
  if (errorMessage.includes('violates not-null')) {
    return 'Please fill in all required fields.';
  }
  
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Invalid email or password.';
  }
  
  if (errorMessage.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  
  if (errorMessage.includes('User already registered')) {
    return 'An account with this email already exists.';
  }
  
  if (errorMessage.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Return the provided fallback message for unknown errors
  return fallbackMessage;
};
