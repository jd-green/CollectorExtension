/**
 * Logger utility for the Web Page Metadata Sender extension
 * Handles logging of events, errors, and webhook activity
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  SUCCESS: 2,
  WARNING: 3,
  ERROR: 4
};

// Default settings
const DEFAULT_SETTINGS = {
  logLevel: 'info',
  maxLogEntries: 100
};

/**
 * Main logger class
 */
class Logger {
  constructor() {
    this.settings = DEFAULT_SETTINGS;
    this.loadSettings();
  }

  /**
   * Load logger settings from storage
   */
  loadSettings() {
    chrome.storage.local.get(['logLevel', 'maxLogEntries'], (result) => {
      this.settings.logLevel = result.logLevel || DEFAULT_SETTINGS.logLevel;
      this.settings.maxLogEntries = result.maxLogEntries || DEFAULT_SETTINGS.maxLogEntries;
    });
  }

  /**
   * Get the numeric value of the current log level
   * @returns {number} The numeric log level
   */
  getCurrentLogLevel() {
    switch (this.settings.logLevel) {
      case 'debug': return LOG_LEVELS.DEBUG;
      case 'info': return LOG_LEVELS.INFO;
      case 'warning': return LOG_LEVELS.WARNING;
      case 'error': return LOG_LEVELS.ERROR;
      default: return LOG_LEVELS.INFO;
    }
  }

  /**
   * Check if a log level should be recorded based on current settings
   * @param {string} level - The log level to check
   * @returns {boolean} Whether the log should be recorded
   */
  shouldLog(level) {
    const currentLevel = this.getCurrentLogLevel();
    const messageLevel = LOG_LEVELS[level.toUpperCase()];
    return messageLevel >= currentLevel;
  }

  /**
   * Add a log entry to storage
   * @param {string} level - Log level (debug, info, success, warning, error)
   * @param {string} message - Log message
   * @param {object} details - Additional details (optional)
   */
  log(level, message, details = null) {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      message: message,
      details: details ? JSON.stringify(details, null, 2) : null
    };

    // Get existing logs
    chrome.storage.local.get(['logs'], (result) => {
      let logs = result.logs || [];
      
      // Add new log entry
      logs.unshift(logEntry);
      
      // Trim logs if they exceed the maximum
      if (logs.length > this.settings.maxLogEntries) {
        logs = logs.slice(0, this.settings.maxLogEntries);
      }
      
      // Save updated logs
      chrome.storage.local.set({ logs: logs });
      
      // Also log to console for debugging
      this.logToConsole(level, message, details);
    });
  }

  /**
   * Log to the browser console
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} details - Additional details
   */
  logToConsole(level, message, details) {
    const formattedMessage = `[${level.toUpperCase()}] ${message}`;
    
    switch (level.toLowerCase()) {
      case 'debug':
        console.debug(formattedMessage, details || '');
        break;
      case 'info':
        console.info(formattedMessage, details || '');
        break;
      case 'success':
        console.log(`%c${formattedMessage}`, 'color: green', details || '');
        break;
      case 'warning':
        console.warn(formattedMessage, details || '');
        break;
      case 'error':
        console.error(formattedMessage, details || '');
        break;
      default:
        console.log(formattedMessage, details || '');
    }
  }

  /**
   * Clear all logs
   * @param {function} callback - Callback function after clearing
   */
  clearLogs(callback) {
    chrome.storage.local.set({ logs: [] }, () => {
      this.log('info', 'Logs cleared');
      if (callback) callback();
    });
  }

  /**
   * Get all logs
   * @param {function} callback - Callback function with logs
   */
  getLogs(callback) {
    chrome.storage.local.get(['logs'], (result) => {
      callback(result.logs || []);
    });
  }

  /**
   * Export logs as JSON
   * @returns {string} JSON string of logs
   */
  exportLogs(callback) {
    this.getLogs((logs) => {
      const exportData = {
        extension: 'Web Page Metadata Sender',
        exportDate: new Date().toISOString(),
        logs: logs
      };
      
      callback(JSON.stringify(exportData, null, 2));
    });
  }

  // Convenience methods for different log levels
  debug(message, details = null) {
    this.log('debug', message, details);
  }

  info(message, details = null) {
    this.log('info', message, details);
  }

  success(message, details = null) {
    this.log('success', message, details);
  }

  warning(message, details = null) {
    this.log('warning', message, details);
  }

  error(message, details = null) {
    this.log('error', message, details);
  }

  // Special method for logging webhook activity
  logWebhook(url, method, requestData, response, success, errorDetails = null) {
    const level = success ? 'success' : 'error';
    const message = success 
      ? `Webhook request to ${url} succeeded` 
      : `Webhook request to ${url} failed`;
    
    const details = {
      url: url,
      method: method,
      requestData: requestData,
      responseStatus: response?.status,
      responseStatusText: response?.statusText,
      responseData: response?.data,
      error: errorDetails
    };
    
    this.log(level, message, details);
  }
}

// Create and export a singleton instance
const logger = new Logger();
export default logger; 