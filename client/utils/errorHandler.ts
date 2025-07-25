// Global error handler to catch and debug JSON parsing errors

export function setupGlobalErrorHandler() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      console.error('🚨 CAUGHT JSON PARSING ERROR:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Try to find the source of the error
      if (error.stack) {
        console.error('Error stack trace:', error.stack);
      }
      
      // Prevent the error from bubbling up and breaking the app
      event.preventDefault();
      
      // Show user-friendly message
      console.warn('A JSON parsing error was caught and prevented from breaking the app');
    }
  });

  // Catch general JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      console.error('🚨 CAUGHT GENERAL JSON PARSING ERROR:', {
        error: error.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Override JSON.parse to track all parsing attempts
  const originalJSONParse = JSON.parse;
  JSON.parse = function(text: string, reviver?: any) {
    try {
      return originalJSONParse.call(this, text, reviver);
    } catch (error) {
      console.error('🚨 JSON.parse FAILED:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        textPreview: typeof text === 'string' ? text.substring(0, 200) : 'Not a string',
        textLength: typeof text === 'string' ? text.length : 'N/A',
        isHTML: typeof text === 'string' && (text.includes('<!doctype') || text.includes('<html')),
        stack: error instanceof Error ? error.stack : 'No stack',
        timestamp: new Date().toISOString()
      });
      throw error; // Re-throw the error
    }
  };

  console.log('🛡️ Global error handler and JSON.parse monitor initialized');
}

export function removeGlobalErrorHandler() {
  // This would remove the error handlers if needed
  // For now, we'll keep them active
}
