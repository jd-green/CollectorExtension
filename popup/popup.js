document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const configureBtn = document.getElementById('configureBtn');
  
  // Open options page when configure button is clicked
  configureBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Check if webhook URL is configured
  chrome.storage.local.get(['webhookUrl'], function(result) {
    if (!result.webhookUrl) {
      statusElement.textContent = 'Please configure a webhook URL first';
      statusElement.className = 'status error';
      return;
    }
    
    // Get the current tab's URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        const currentUrl = tabs[0].url;
        
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
        
        // Show sending status
        statusElement.textContent = 'Sending metadata...';
        statusElement.className = 'status sending';
        
        // Send message to background script to send the data
        chrome.runtime.sendMessage(
          { action: 'sendMetadata', metadata: metadata },
          function(response) {
            if (response && response.success) {
              statusElement.textContent = 'Metadata sent successfully!';
              statusElement.className = 'status success';
            } else {
              // Show a more detailed error message
              let errorMessage = 'Failed to send metadata.';
              
              if (response && response.error) {
                // Extract the main part of the error message
                if (response.error.includes('404')) {
                  errorMessage = 'Webhook URL not found (404). Please check the URL.';
                } else if (response.error.includes('401') || response.error.includes('403')) {
                  errorMessage = 'Authentication failed. Check your bearer token.';
                } else if (response.error.includes('400')) {
                  errorMessage = 'Bad request. The webhook rejected the data format.';
                } else if (response.error.includes('500')) {
                  errorMessage = 'Server error. The webhook server is having issues.';
                } else if (response.error.includes('CORS')) {
                  errorMessage = 'CORS error. The webhook server is blocking the request.';
                } else {
                  // Include the actual error if it's not too long
                  const shortError = response.error.split(' - ')[0]; // Get first part of error
                  if (shortError.length < 50) {
                    errorMessage += ' ' + shortError;
                  }
                }
              }
              
              statusElement.textContent = errorMessage;
              statusElement.className = 'status error';
            }
          }
        );
      } else {
        statusElement.textContent = 'Could not access current tab information';
        statusElement.className = 'status error';
      }
    });
  });
}); 