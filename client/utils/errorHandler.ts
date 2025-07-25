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
      // Get stack trace to identify source
      const stack = error instanceof Error ? error.stack : '';
      const isFromExternalAPI = stack.includes('simulateon-backend.onrender.com') ||
                               stack.includes('calculate-standard') ||
                               stack.includes('compare-refrigerants') ||
                               stack.includes('calculate-cascade');
      const isFromInternalAPI = stack.includes('api.ts') && !isFromExternalAPI;

      console.error('🚨 JSON.parse FAILED:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: isFromExternalAPI ? 'External Calculation API' :
                isFromInternalAPI ? 'Internal Backend API' : 'Unknown',
        textPreview: typeof text === 'string' ? text.substring(0, 200) : 'Not a string',
        textLength: typeof text === 'string' ? text.length : 'N/A',
        isHTML: typeof text === 'string' && (text.includes('<!doctype') || text.includes('<html')),
        isProbablyErrorPage: typeof text === 'string' && (
          text.includes('<!doctype') ||
          text.includes('<html') ||
          text.includes('<title>Error</title>') ||
          text.includes('404') ||
          text.includes('500')
        ),
        stack: stack,
        timestamp: new Date().toISOString()
      });

      // Provide user-friendly error based on source
      if (isFromExternalAPI) {
        console.warn('💡 This appears to be from the external calculation API. Check if the API server is returning HTML error pages.');
      } else if (isFromInternalAPI) {
        console.warn('💡 This appears to be from the internal backend API. Check if the API server is configured and running.');
      }

      throw error; // Re-throw the error
    }
  };

  console.log('🛡️ Global error handler and JSON.parse monitor initialized');
}

export function removeGlobalErrorHandler() {
  // This would remove the error handlers if needed
  // For now, we'll keep them active
}
