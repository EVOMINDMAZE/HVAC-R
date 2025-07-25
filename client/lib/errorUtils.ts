/**
 * Safely extracts a readable error message from any error object
 */
export function extractErrorMessage(error: any): string {
  if (!error) {
    return 'Unknown error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Try to extract common error properties
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
    if (error[prop] && typeof error[prop] === 'string') {
      return error[prop];
    }
  }

  // Handle specific error codes
  if (error.code) {
    const codeMessages: Record<string, string> = {
      'PGRST116': 'Table does not exist in database',
      '42P01': 'Table does not exist in database',
      'PGRST301': 'Invalid authentication credentials',
      'PGRST204': 'No rows found',
      'ENOTFOUND': 'Network connection error',
      'ECONNREFUSED': 'Connection refused',
      'ETIMEDOUT': 'Request timeout'
    };

    if (codeMessages[error.code]) {
      return `${codeMessages[error.code]} (${error.code})`;
    }

    return `Database error: ${error.code}`;
  }

  // Try to extract readable information from nested errors
  if (error.response?.data) {
    return extractErrorMessage(error.response.data);
  }

  if (error.response?.statusText) {
    return error.response.statusText;
  }

  // Try to safely stringify the object
  try {
    const str = JSON.stringify(error, null, 2);
    if (str && str !== '{}' && str !== 'null') {
      // Truncate long error messages
      return str.length > 200 ? str.substring(0, 200) + '...' : str;
    }
  } catch {
    // JSON.stringify failed, try other approaches
  }

  // Try to get constructor name or type information
  if (error.constructor?.name && error.constructor.name !== 'Object') {
    return `${error.constructor.name} error`;
  }

  // Extract enumerable properties manually
  try {
    const props = Object.getOwnPropertyNames(error);
    const relevantProps = props.filter(prop => 
      typeof error[prop] === 'string' || 
      typeof error[prop] === 'number'
    );
    
    if (relevantProps.length > 0) {
      const propValues = relevantProps.map(prop => `${prop}: ${error[prop]}`);
      return propValues.slice(0, 3).join(', '); // Limit to first 3 properties
    }
  } catch {
    // Property enumeration failed
  }

  // Last resort
  return 'An error occurred but details could not be extracted';
}

/**
 * Safely logs error information to console
 */
export function logError(context: string, error: any): void {
  console.group(`🚨 Error in ${context}`);
  
  try {
    console.error('Original error:', error);
    console.log('Error type:', typeof error);
    console.log('Error constructor:', error?.constructor?.name);
    
    if (error && typeof error === 'object') {
      // Log enumerable properties
      const props = Object.getOwnPropertyNames(error);
      console.log('Error properties:', props);
      
      // Log key properties individually
      ['message', 'code', 'details', 'hint', 'stack'].forEach(prop => {
        if (error[prop] !== undefined) {
          console.log(`${prop}:`, error[prop]);
        }
      });
      
      // Try to log as JSON (but catch circular reference errors)
      try {
        console.log('Error as JSON:', JSON.stringify(error, null, 2));
      } catch (jsonError) {
        console.log('Cannot stringify error (likely circular reference)');
        
        // Try to create a safe representation
        const safeError: any = {};
        props.forEach(prop => {
          try {
            const value = error[prop];
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              safeError[prop] = value;
            }
          } catch {
            // Skip problematic properties
          }
        });
        console.log('Safe error representation:', safeError);
      }
    }
    
    console.log('Extracted message:', extractErrorMessage(error));
  } catch (loggingError) {
    console.error('Error while logging error:', loggingError);
  }
  
  console.groupEnd();
}
