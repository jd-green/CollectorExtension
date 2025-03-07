// Import the logger
import logger from './logger.js';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendMetadata') {
    logger.info('Received sendMetadata request from popup', { url: request.metadata.url });
    sendMetadataToWebhook(request.metadata, sendResponse);
    return true; // Keep the message channel open for the async response
  }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // If popup is defined in manifest, this won't trigger
  // This is a fallback in case popup is removed in the future
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs?.[0]) {
      const currentUrl = tabs[0].url;
      logger.info('Extension icon clicked', { url: currentUrl });
      
      // Capture metadata
      const metadata = {
        url: currentUrl,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };
      
      // Send metadata to webhook
      sendMetadataToWebhook(metadata);
    }
  });
});

// Function to send metadata to the configured webhook
function sendMetadataToWebhook(metadata, callback = null) {
  chrome.storage.local.get(['webhookUrl', 'bearerToken', 'maxRetries', 'badgeDuration'], (result) => {
    if (!result.webhookUrl) {
      logger.warning('No webhook URL configured');
      showBadge('!', '#FF0000'); // Red exclamation mark for no webhook URL
      if (callback) callback({ success: false, error: 'No webhook URL configured' });
      return;
    }
    
    // Show sending badge
    showBadge('↻', '#3367d6'); // Blue loading indicator
    
    // Log the URL we're sending to
    logger.info(`Preparing to send metadata to webhook: ${result.webhookUrl}`, { 
      metadata: metadata,
      hasToken: !!result.bearerToken 
    });
    
    // Get max retries from settings or use default
    const maxRetries = result.maxRetries || 3;
    
    // Send data to webhook with retry logic
    sendWithRetry(result.webhookUrl, result.bearerToken, metadata, 0, callback, maxRetries);
  });
}

// Function to send data with retry logic
function sendWithRetry(webhookUrl, bearerToken, metadata, retryCount, callback = null, maxRetries = 3) {
  // Try different approaches to handle CORS issues
  const useCorsMode = retryCount % 3 === 0; // First try with normal mode
  const useJsonFormat = retryCount % 3 === 1; // Second try with URL params
  const useNoCorsMode = retryCount % 3 === 2; // Third try with no-cors mode
  
  const fetchOptions = {
    method: 'POST'
  };
  
  // Prepare the request based on the current approach
  if (useNoCorsMode) {
    // Approach 3: Use no-cors mode (opaque response, can't read response data)
    logger.debug('Using no-cors mode for webhook request');
    fetchOptions.mode = 'no-cors';
    
    // Convert to URL parameters for no-cors mode
    const params = new URLSearchParams();
    for (const key in metadata) {
      if (typeof metadata[key] === 'object') {
        params.append(key, JSON.stringify(metadata[key]));
      } else {
        params.append(key, metadata[key]);
      }
    }
    fetchOptions.body = params;
    
    // Add Authorization header if bearer token is provided
    if (bearerToken) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${bearerToken}`
      };
    }
  } else if (useJsonFormat) {
    // Approach 2: Use URL parameters without Content-Type header
    logger.debug('Using URL parameters for webhook request');
    const params = new URLSearchParams();
    for (const key in metadata) {
      if (typeof metadata[key] === 'object') {
        params.append(key, JSON.stringify(metadata[key]));
      } else {
        params.append(key, metadata[key]);
      }
    }
    fetchOptions.body = params;
    
    // Add Authorization header if bearer token is provided
    if (bearerToken) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${bearerToken}`
      };
    }
  } else {
    // Approach 1: Use JSON format with proper headers
    logger.debug('Using JSON format for webhook request');
    fetchOptions.headers = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if bearer token is provided
    if (bearerToken) {
      fetchOptions.headers.Authorization = `Bearer ${bearerToken}`;
    }
    
    fetchOptions.body = JSON.stringify(metadata);
  }
  
  // Log request details
  logger.debug('Webhook request details', {
    url: webhookUrl,
    method: fetchOptions.method,
    mode: fetchOptions.mode || 'cors',
    hasToken: !!bearerToken,
    retryCount: retryCount,
    approach: useNoCorsMode ? 'no-cors' : (useJsonFormat ? 'url-params' : 'json')
  });
  
  // Use fetch with the current approach
  fetch(webhookUrl, fetchOptions)
  .then(response => {
    // Log the response status
    logger.debug(`Received response with status: ${response.status} ${response.statusText}`);
    
    // For no-cors mode, we can't read the response, so assume success
    if (useNoCorsMode) {
      logger.warning('No-cors mode used, assuming success (opaque response)');
      return { 
        ok: true, 
        status: 'unknown', 
        statusText: 'Opaque response (no-cors mode)', 
        data: 'No data available in no-cors mode' 
      };
    }
    
    // Store the response status for logging
    const responseInfo = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    };
    
    // Check if the response is ok
    if (!response.ok) {
      // Create a more detailed error message
      let errorMessage = `HTTP error! Status: ${response.status} (${response.statusText})`;
      
      // Add specific guidance based on status code
      if (response.status === 404) {
        errorMessage += ' - The webhook URL was not found. Please verify the URL is correct and accessible.';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage += ' - Authentication failed. Please check your bearer token.';
      } else if (response.status === 400) {
        errorMessage += ' - Bad request. The webhook server rejected the data format.';
      } else if (response.status >= 500) {
        errorMessage += ' - Server error. The webhook server is experiencing issues.';
      }
      
      throw { 
        message: errorMessage, 
        response: responseInfo 
      };
    }
    
    // Try to get the response text
    return response.text().then(text => {
      try {
        // Try to parse as JSON
        const data = text ? JSON.parse(text) : {};
        responseInfo.data = data;
        return responseInfo;
      } catch (e) {
        // If not JSON, just return the text
        responseInfo.data = text;
        return responseInfo;
      }
    });
  })
  .then(responseData => {
    // Log successful response
    logger.success('Webhook request successful', responseData);
    
    // Log the webhook activity
    logger.logWebhook(
      webhookUrl, 
      fetchOptions.method, 
      metadata, 
      responseData, 
      true
    );
    
    // Success
    showBadge('✓', '#4CAF50'); // Green checkmark
    if (callback) callback({ success: true, data: responseData.data });
  })
  .catch(error => {
    // Extract response info if available
    const responseInfo = error.response || {
      status: 'unknown',
      statusText: 'Network or CORS error'
    };
    
    // Log the error
    logger.error('Error sending metadata to webhook', { 
      error: error.message || error,
      response: responseInfo
    });
    
    // Log the webhook activity
    logger.logWebhook(
      webhookUrl, 
      fetchOptions.method, 
      metadata, 
      responseInfo, 
      false, 
      error.message || 'Unknown error'
    );
    
    // Check if it's a CORS error
    const isCorsError = (error.message?.includes('CORS')) || 
                        (error.message?.includes('Failed to fetch')) ||
                        (error.message?.includes('NetworkError'));
    
    // If it's a CORS error and we haven't tried all approaches yet
    if (isCorsError && retryCount < maxRetries) {
      logger.warning(`CORS issue detected. Trying different approach (${retryCount + 1}/${maxRetries})...`);
      // Try immediately with a different approach
      sendWithRetry(webhookUrl, bearerToken, metadata, retryCount + 1, callback, maxRetries);
    } else if (retryCount < maxRetries) {
      // For non-CORS errors, wait before retrying
      logger.warning(`Retrying webhook request (${retryCount + 1}/${maxRetries})...`);
      // Wait 2 seconds before retrying
      setTimeout(() => {
        sendWithRetry(webhookUrl, bearerToken, metadata, retryCount + 1, callback, maxRetries);
      }, 2000);
    } else {
      // Max retries reached, show error
      logger.error('Max retries reached. Webhook request failed.', { 
        url: webhookUrl,
        error: error.message || 'Unknown error'
      });
      
      showBadge('✗', '#FF0000'); // Red X
      
      // Show a notification with the error message
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/default_icon128.png',
        title: 'Webhook Error',
        message: error.message || 'Failed to send data to webhook'
      });
      
      if (callback) callback({ 
        success: false, 
        error: error.message || 'Unknown error',
        response: responseInfo
      });
    }
  });
}

// Function to show badge on the extension icon
function showBadge(text, backgroundColor) {
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: backgroundColor });
  
  // Get badge duration from settings or use default
  chrome.storage.local.get(['badgeDuration'], (result) => {
    const badgeDuration = (result.badgeDuration || 10) * 1000; // Convert to milliseconds
    
    // Clear badge after the configured duration
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, badgeDuration);
  });
} 