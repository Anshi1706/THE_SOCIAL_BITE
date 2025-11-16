// error-handler.js - Global error handling for the entire application
class ErrorHandler {
    constructor() {
        this.initialized = false;
        this.setupGlobalErrorHandling();
        this.initialized = true;
        console.log('ErrorHandler initialized');
    }

    setupGlobalErrorHandling() {
        // Prevent multiple initializations
        if (this._listenersSetup) return;
        this._listenersSetup = true;

        // Window error events
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'Runtime Error',
                message: event.message,
                file: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                error: event.error
            });
            
            // Prevent browser's default error handling for some errors
            if (this.isUserFacingError(event.error)) {
                event.preventDefault();
            }
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || 'Unknown promise rejection',
                reason: event.reason,
                stack: event.reason?.stack
            });
            
            // Prevent browser default handling
            event.preventDefault();
        });

        // Network errors
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.logError({
                type: 'NetworkError',
                message: 'Network connection lost'
            });
            this.showNotification('You are currently offline. Some features may not work.', 'warning');
        });

        // Console error interception (optional)
        this.interceptConsoleErrors();
    }

    interceptConsoleErrors() {
        const originalConsoleError = console.error;
        const self = this;
        
        console.error = function(...args) {
            // Log to original console first
            originalConsoleError.apply(console, args);
            
            // Capture as error if it looks like an error object
            if (args.length > 0) {
                const firstArg = args[0];
                if (firstArg instanceof Error) {
                    self.captureError(firstArg, { consoleArgs: args.slice(1) });
                } else if (typeof firstArg === 'string' && firstArg.includes('Error')) {
                    self.logError({
                        type: 'Console Error',
                        message: args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                        ).join(' '),
                        stack: new Error().stack
                    });
                }
            }
        };
    }

    isUserFacingError(error) {
        // Ignore certain errors that don't affect user experience
        const ignoredErrors = [
            'Script error',
            'ResizeObserver loop',
            'Loading CSS',
            'Loading chunk'
        ];
        
        return !ignoredErrors.some(ignored => 
            error?.message?.includes(ignored) || error?.toString().includes(ignored)
        );
    }

    logError(errorInfo) {
        console.error('Application Error:', errorInfo);
        
        try {
            // Add timestamp and additional context
            const enhancedError = {
                ...errorInfo,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            };
            
            // Clean up circular references
            const safeError = this.sanitizeError(enhancedError);
            
            // Save to localStorage for debugging
            this.saveErrorToStorage(safeError);
            
            // In production, send to error tracking service
            if (this.isProduction()) {
                this.reportToService(safeError);
            }
            
            // Show user-friendly error message for important errors
            if (this.shouldShowToUser(safeError)) {
                this.showUserFriendlyError(safeError);
            }
        } catch (storageError) {
            // Fallback if error logging itself fails
            console.error('Error logging failed:', storageError);
        }
    }

    sanitizeError(errorObj) {
        // Remove circular references and large objects
        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(errorObj, (key, value) => {
            // Skip large strings
            if (typeof value === 'string' && value.length > 1000) {
                return value.substring(0, 1000) + '... [truncated]';
            }
            
            // Handle circular references
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular Reference]';
                }
                seen.add(value);
            }
            return value;
        }));
    }

    saveErrorToStorage(errorInfo) {
        try {
            const errors = JSON.parse(localStorage.getItem('appErrors') || '[]');
            errors.unshift(errorInfo);
            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.length = 50;
            }
            localStorage.setItem('appErrors', JSON.stringify(errors));
        } catch (e) {
            console.warn('Could not save error to storage:', e);
            // If localStorage is full, try to clear some space
            this.handleStorageFull();
        }
    }

    handleStorageFull() {
        try {
            // Clear old errors to free up space
            const errors = JSON.parse(localStorage.getItem('appErrors') || '[]');
            if (errors.length > 10) {
                localStorage.setItem('appErrors', JSON.stringify(errors.slice(0, 10)));
            }
        } catch (e) {
            // If we still can't save, give up
            console.warn('Could not free up storage space for errors');
        }
    }

    isProduction() {
        return window.ENV === 'production' || 
               (!window.location.hostname.includes('localhost') &&
                !window.location.hostname.includes('127.0.0.1') &&
                !window.location.hostname.includes('0.0.0.0'));
    }

    shouldShowToUser(errorInfo) {
        // Don't show network errors for offline events (we handle separately)
        if (errorInfo.type === 'NetworkError' && errorInfo.message === 'Network connection lost') {
            return false;
        }
        
        // Don't show console errors to users
        if (errorInfo.type === 'Console Error') {
            return false;
        }
        
        // Show other errors
        return true;
    }

    showUserFriendlyError(errorInfo) {
        const errorMessages = {
            'QuotaExceededError': 'Storage is full. Please clear some data and try again.',
            'NetworkError': 'Network connection failed. Please check your internet connection.',
            'TypeError': 'Something went wrong. Please refresh the page and try again.',
            'SyntaxError': 'There seems to be an issue with the page. Please refresh.',
            'ReferenceError': 'Something went wrong. Please refresh the page and try again.',
            'Unhandled Promise Rejection': 'Operation failed. Please try again.',
            'Runtime Error': 'An error occurred. Please try refreshing the page.',
            'Manual Error': 'An error occurred. Please try again.'
        };

        const userMessage = errorMessages[errorInfo.type] || 
                           errorMessages[errorInfo.error?.name] ||
                           errorMessages[errorInfo.reason?.name] ||
                           'An unexpected error occurred. Please try again.';

        this.showNotification(userMessage, 'error');
    }

    showNotification(message, type = 'info') {
        // Use existing notification system from order.js if available
        if (window.order && typeof window.order.showNotification === 'function') {
            window.order.showNotification(message, type);
        } else if (typeof showNotification === 'function') {
            // Global function fallback
            showNotification(message, type);
        } else {
            // Ultimate fallback notification
            this.fallbackNotification(message, type);
        }
    }

    fallbackNotification(message, type) {
        // Remove existing notifications to prevent duplicates
        const existingAlerts = document.querySelectorAll('.error-handler-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `error-handler-alert alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
        alertDiv.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 99999;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${iconMap[type] || 'info-circle'} me-2"></i>
                <span class="flex-grow-1">${this.escapeHtml(message)}</span>
                <button type="button" class="btn-close btn-sm ms-2" aria-label="Close"></button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Add click handler for close button
        const closeBtn = alertDiv.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => alertDiv.remove());
        
        // Auto-remove after 5 seconds for success/info, 8 seconds for errors
        const duration = type === 'error' || type === 'warning' ? 8000 : 5000;
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, duration);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    reportToService(errorInfo) {
        // Send to error tracking service (e.g., Sentry, LogRocket)
        // This is a mock implementation - replace with your actual error reporting service
        if (navigator.onLine && !this.isLocalhost()) {
            fetch('/api/error-log', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Error-Report': 'true'
                },
                body: JSON.stringify(errorInfo)
            }).catch(() => {
                // Silently fail if error reporting fails
            });
        }
    }

    isLocalhost() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' || 
               window.location.hostname === '0.0.0.0';
    }

    // Utility method to manually log errors
    captureError(error, context = {}) {
        const errorInfo = {
            type: 'Manual Error',
            message: error?.message || String(error),
            stack: error?.stack,
            context: context,
            timestamp: new Date().toISOString()
        };
        
        this.logError(errorInfo);
        return errorInfo;
    }

    // Create a wrapper function for async operations
    async captureAsync(fn, context = {}) {
        try {
            return await fn();
        } catch (error) {
            this.captureError(error, context);
            throw error; // Re-throw to maintain error propagation
        }
    }

    // Get recent errors for debugging
    getRecentErrors(limit = 10) {
        try {
            const errors = JSON.parse(localStorage.getItem('appErrors') || '[]');
            return errors.slice(0, limit);
        } catch (e) {
            return [];
        }
    }

    // Clear error logs
    clearErrorLogs() {
        try {
            localStorage.removeItem('appErrors');
            return true;
        } catch (e) {
            console.warn('Could not clear error logs:', e);
            return false;
        }
    }

    // Debug method to test error handling
    testErrorHandling() {
        console.log('Testing error handling...');
        
        // Test runtime error
        setTimeout(() => {
            try {
                throw new Error('Test error for error handler');
            } catch (e) {
                this.captureError(e, { test: true });
            }
        }, 100);
        
        // Test promise rejection
        setTimeout(() => {
            Promise.reject(new Error('Test promise rejection'));
        }, 200);
    }
}

// Initialize error handler
let errorHandler;

try {
    errorHandler = new ErrorHandler();
    
    // Make globally available for manual error capturing
    window.errorHandler = errorHandler;

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ErrorHandler, errorHandler };
    }
} catch (error) {
    console.error('Failed to initialize ErrorHandler:', error);
    // Create a minimal fallback
    window.errorHandler = {
        captureError: (error) => console.error('Fallback error handler:', error),
        showNotification: (message) => alert(message)
    };
}