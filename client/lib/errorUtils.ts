/**
 * Safely extracts a readable error message from any error object
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) {
    return 'Unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    const errorProps = [
      'message',
      'error_description', 
      'details',
      'hint',
      'description',
      'error',
      'statusText',
      'data'
    ];

    for (const prop of errorProps) {
      if (errorObj[prop] && typeof errorObj[prop] === 'string') {
        return errorObj[prop] as string;
      }
    }

    if (errorObj.code && typeof errorObj.code === 'string') {
      const codeMessages: Record<string, string> = {
        'PGRST116': 'Table does not exist in database',
        '42P01': 'Table does not exist in database',
        'PGRST301': 'Invalid authentication credentials',
        'PGRST204': 'No rows found',
        'ENOTFOUND': 'Network connection error',
        'ECONNREFUSED': 'Connection refused',
        'ETIMEDOUT': 'Request timeout'
      };

      if (codeMessages[errorObj.code]) {
        return `${codeMessages[errorObj.code]} (${errorObj.code})`;
      }

      return `Database error: ${errorObj.code}`;
    }

    if (errorObj.response && typeof errorObj.response === 'object' && errorObj.response !== null) {
      const response = errorObj.response as Record<string, unknown>;
      if (response.data) {
        return extractErrorMessage(response.data);
      }
      if (response.statusText && typeof response.statusText === 'string') {
        return response.statusText;
      }
    }

    try {
      const str = JSON.stringify(error, null, 2);
      if (str && str !== '{}' && str !== 'null') {
        return str.length > 200 ? str.substring(0, 200) + '...' : str;
      }
    } catch {
      // JSON.stringify failed
    }
  }

  return 'An error occurred but details could not be extracted';
}

/**
 * Type guard to check if an error is an Error object
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely logs error information to console
 */
export function logError(context: string, error: unknown): void {
  console.group(`🚨 Error in ${context}`);

  try {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else if (typeof error === 'string') {
      console.error('Error:', error);
    } else {
      console.error('Unknown error type:', typeof error);
    }
    
    console.log('Extracted message:', extractErrorMessage(error));
  } catch (loggingError) {
    console.error('Error while logging error:', loggingError);
  }
  
  console.groupEnd();
}
