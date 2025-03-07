document.addEventListener('DOMContentLoaded', function() {
  // Tab functionality
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  const tabContents = document.querySelectorAll('.tab-content');
  
  for (const trigger of tabTriggers) {
    trigger.addEventListener('click', () => {
      // Remove active class from all triggers and contents
      for (const t of tabTriggers) {
        t.classList.remove('active');
      }
      for (const c of tabContents) {
        c.classList.remove('active');
      }
      
      // Add active class to clicked trigger and corresponding content
      trigger.classList.add('active');
      const tabId = trigger.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // If logs tab is selected, refresh logs
      if (tabId === 'logs') {
        refreshLogs();
      }
    });
  }

  // Form elements
  const webhookUrlInput = document.getElementById('webhookUrl');
  const bearerTokenInput = document.getElementById('bearerToken');
  const customIconInput = document.getElementById('customIcon');
  const iconPreview = document.getElementById('iconPreview');
  const saveBtn = document.getElementById('saveBtn');
  const saveAppearanceBtn = document.getElementById('saveAppearanceBtn');
  const saveAdvancedBtn = document.getElementById('saveAdvancedBtn');
  const resetBtn = document.getElementById('resetBtn');
  const testBtn = document.getElementById('testBtn');
  const retryCountInput = document.getElementById('retryCount');
  const badgeDurationInput = document.getElementById('badgeDuration');
  const logLevelSelect = document.getElementById('logLevel');
  const maxLogEntriesInput = document.getElementById('maxLogEntries');
  const refreshLogsBtn = document.getElementById('refreshLogsBtn');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const exportLogsBtn = document.getElementById('exportLogsBtn');
  const logsContainer = document.getElementById('logs-container');
  const statusElement = document.getElementById('status');
  
  // Load saved configuration
  loadSavedConfig();
  
  function loadSavedConfig() {
    chrome.storage.local.get([
      'webhookUrl', 
      'bearerToken', 
      'customIcon',
      'maxRetries',
      'badgeDuration',
      'logLevel',
      'maxLogEntries'
    ], function(result) {
      if (result.webhookUrl) {
        webhookUrlInput.value = result.webhookUrl;
      }
      
      if (result.bearerToken) {
        bearerTokenInput.value = result.bearerToken;
      }
      
      if (result.customIcon) {
        iconPreview.src = result.customIcon;
      }
      
      if (result.maxRetries) {
        retryCountInput.value = result.maxRetries;
      }
      
      if (result.badgeDuration) {
        badgeDurationInput.value = result.badgeDuration;
      }
      
      if (result.logLevel) {
        logLevelSelect.value = result.logLevel;
      }
      
      if (result.maxLogEntries) {
        maxLogEntriesInput.value = result.maxLogEntries;
      }
    });
  }
  
  // Preview custom icon when selected
  customIconInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image/png')) {
        showStatus('Error: Please select a PNG image.', 'error');
        return;
      }
      
      // Validate file size (max 128KB)
      if (file.size > 128 * 1024) {
        showStatus('Error: Image size should be less than 128KB.', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        // Create an image to check dimensions
        const img = new Image();
        img.onload = function() {
          if (img.width > 128 || img.height > 128) {
            showStatus('Error: Image dimensions should be 128x128px or smaller.', 'error');
            return;
          }
          
          // If all validations pass, show the preview
          iconPreview.src = e.target.result;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Test webhook URL
  testBtn.addEventListener('click', function() {
    const webhookUrl = webhookUrlInput.value.trim();
    const bearerToken = bearerTokenInput.value.trim();
    
    // Validate webhook URL
    if (!webhookUrl) {
      showStatus('Error: Please enter a webhook URL to test.', 'error');
      return;
    }
    
    try {
      new URL(webhookUrl);
    } catch (e) {
      showStatus('Error: Please enter a valid URL.', 'error');
      return;
    }
    
    // Show testing status
    showStatus('Testing webhook connection...', 'sending');
    
    // Prepare test data
    const testData = {
      url: 'https://example.com/test',
      timestamp: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      test: true
    };
    
    // Try with no-cors mode first
    testWebhookWithNoCors(webhookUrl, bearerToken, testData);
  });
  
  // Function to test webhook with no-cors mode
  function testWebhookWithNoCors(webhookUrl, bearerToken, testData) {
    console.log('Testing webhook with no-cors mode');
    
    // Convert to URL parameters for no-cors mode
    const params = new URLSearchParams();
    for (const key in testData) {
      if (typeof testData[key] === 'object') {
        params.append(key, JSON.stringify(testData[key]));
      } else {
        params.append(key, testData[key]);
      }
    }
    
    // Prepare fetch options
    const fetchOptions = {
      method: 'POST',
      mode: 'no-cors',
      body: params
    };
    
    // Add Authorization header if bearer token is provided
    if (bearerToken) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${bearerToken}`
      };
    }
    
    // Test the webhook
    fetch(webhookUrl, fetchOptions)
      .then(response => {
        // With no-cors, we can't read the response, so assume success
        console.log('No-cors response received (opaque)');
        showStatus('Webhook test likely successful! (Using no-cors mode, cannot verify response)', 'success');
      })
      .catch(error => {
        console.error('Error with no-cors mode:', error);
        // If no-cors fails, try with URL parameters
        testWebhookWithUrlParams(webhookUrl, bearerToken, testData);
      });
  }
  
  // Function to test webhook with URL parameters
  function testWebhookWithUrlParams(webhookUrl, bearerToken, testData) {
    console.log('Testing webhook with URL parameters');
    
    // Convert to URL parameters
    const params = new URLSearchParams();
    for (const key in testData) {
      if (typeof testData[key] === 'object') {
        params.append(key, JSON.stringify(testData[key]));
      } else {
        params.append(key, testData[key]);
      }
    }
    
    // Prepare fetch options
    const fetchOptions = {
      method: 'POST',
      body: params
    };
    
    // Add Authorization header if bearer token is provided
    if (bearerToken) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${bearerToken}`
      };
    }
    
    // Test the webhook
    fetch(webhookUrl, fetchOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);
        }
        return response.text();
      })
      .then(data => {
        showStatus(`Webhook test successful! Response: ${data.length > 50 ? data.substring(0, 50) + '...' : data}`, 'success');
      })
      .catch(error => {
        console.error('Error with URL parameters:', error);
        // If URL parameters fail, try with JSON
        testWebhookWithJson(webhookUrl, bearerToken, testData);
      });
  }
  
  // Function to test webhook with JSON
  function testWebhookWithJson(webhookUrl, bearerToken, testData) {
    console.log('Testing webhook with JSON');
    
    // Prepare fetch options
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    };
    
    // Add Authorization header if bearer token is provided
    if (bearerToken) {
      fetchOptions.headers.Authorization = `Bearer ${bearerToken}`;
    }
    
    // Test the webhook
    fetch(webhookUrl, fetchOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);
        }
        return response.text();
      })
      .then(data => {
        showStatus(`Webhook test successful! Response: ${data.length > 50 ? data.substring(0, 50) + '...' : data}`, 'success');
      })
      .catch(error => {
        // All methods failed
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          showStatus('Error: Could not connect to the webhook. Check the URL and your internet connection.', 'error');
        } else if (error.message.includes('CORS')) {
          showStatus('Error: CORS policy blocked the request. The webhook server needs to allow requests from extensions. Try using the extension icon instead, which uses a more robust approach.', 'error');
        } else {
          showStatus(`Error: ${error.message}`, 'error');
        }
      });
  }
  
  // Save general configuration
  saveBtn.addEventListener('click', function() {
    const webhookUrl = webhookUrlInput.value.trim();
    const bearerToken = bearerTokenInput.value.trim();
    
    // Validate webhook URL
    if (!webhookUrl) {
      showStatus('Error: Please enter a webhook URL.', 'error');
      return;
    }
    
    try {
      new URL(webhookUrl);
    } catch (e) {
      showStatus('Error: Please enter a valid URL.', 'error');
      return;
    }
    
    // Save webhook URL and bearer token
    chrome.storage.local.set({ 
      webhookUrl: webhookUrl,
      bearerToken: bearerToken
    }, function() {
      showStatus('Configuration saved successfully!', 'success');
    });
  });
  
  // Save appearance settings
  saveAppearanceBtn.addEventListener('click', function() {
    // If a custom icon was selected, save it
    if (customIconInput.files.length > 0) {
      const reader = new FileReader();
      reader.onload = function(e) {
        chrome.storage.local.set({ customIcon: e.target.result }, function() {
          showStatus('Appearance settings saved successfully!', 'success');
          
          // Update the extension icon
          chrome.action.setIcon({ path: { 
            "16": iconPreview.src,
            "48": iconPreview.src,
            "128": iconPreview.src
          }});
        });
      };
      reader.readAsDataURL(customIconInput.files[0]);
    } else if (iconPreview.src !== '../icons/default_icon128.png') {
      // If no new file selected but we have a custom icon already
      showStatus('Appearance settings saved successfully!', 'success');
    } else {
      showStatus('No custom icon selected. Using default icon.', 'success');
    }
  });
  
  // Save advanced settings
  saveAdvancedBtn.addEventListener('click', function() {
    const maxRetries = parseInt(retryCountInput.value);
    const badgeDuration = parseInt(badgeDurationInput.value);
    const logLevel = logLevelSelect.value;
    const maxLogEntries = parseInt(maxLogEntriesInput.value);
    
    // Validate inputs
    if (isNaN(maxRetries) || maxRetries < 1 || maxRetries > 5) {
      showStatus('Error: Maximum retry attempts must be between 1 and 5.', 'error');
      return;
    }
    
    if (isNaN(badgeDuration) || badgeDuration < 1 || badgeDuration > 30) {
      showStatus('Error: Badge duration must be between 1 and 30 seconds.', 'error');
      return;
    }
    
    if (isNaN(maxLogEntries) || maxLogEntries < 10 || maxLogEntries > 1000) {
      showStatus('Error: Maximum log entries must be between 10 and 1000.', 'error');
      return;
    }
    
    // Save advanced settings
    chrome.storage.local.set({ 
      maxRetries: maxRetries,
      badgeDuration: badgeDuration,
      logLevel: logLevel,
      maxLogEntries: maxLogEntries
    }, function() {
      showStatus('Advanced settings saved successfully!', 'success');
    });
  });
  
  // Reset to defaults
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      chrome.storage.local.set({ 
        maxRetries: 3,
        badgeDuration: 10,
        logLevel: 'info',
        maxLogEntries: 100
      }, function() {
        retryCountInput.value = 3;
        badgeDurationInput.value = 10;
        logLevelSelect.value = 'info';
        maxLogEntriesInput.value = 100;
        showStatus('Advanced settings reset to defaults.', 'success');
      });
    }
  });
  
  // Logs tab functionality
  refreshLogsBtn.addEventListener('click', refreshLogs);
  clearLogsBtn.addEventListener('click', clearLogs);
  exportLogsBtn.addEventListener('click', exportLogs);
  
  // Function to refresh logs
  function refreshLogs() {
    chrome.storage.local.get(['logs'], function(result) {
      const logs = result.logs || [];
      
      if (logs.length === 0) {
        logsContainer.innerHTML = '<div class="no-logs">No logs available. Activity will appear here when you use the extension.</div>';
        return;
      }
      
      // Clear logs container
      logsContainer.innerHTML = '';
      
      // Add each log entry
      logs.forEach(function(log) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        // Format timestamp
        const timestamp = new Date(log.timestamp);
        const formattedTime = timestamp.toLocaleString();
        
        // Create log entry HTML
        let logHtml = `
          <div>
            <span class="log-timestamp">${formattedTime}</span>
            <span class="log-level log-level-${log.level}">${log.level.toUpperCase()}</span>
            <span class="log-message">${log.message}</span>
          </div>
        `;
        
        // Add details if available
        if (log.details) {
          try {
            // Try to parse the details as JSON
            const details = JSON.parse(log.details);
            logHtml += `<pre class="log-details">${JSON.stringify(details, null, 2)}</pre>`;
          } catch (e) {
            // If not JSON, just show as text
            logHtml += `<pre class="log-details">${log.details}</pre>`;
          }
        }
        
        logEntry.innerHTML = logHtml;
        logsContainer.appendChild(logEntry);
      });
    });
  }
  
  // Function to clear logs
  function clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
      chrome.storage.local.set({ logs: [] }, function() {
        refreshLogs();
        showStatus('Logs cleared successfully!', 'success');
      });
    }
  }
  
  // Function to export logs
  function exportLogs() {
    chrome.storage.local.get(['logs'], function(result) {
      const logs = result.logs || [];
      
      if (logs.length === 0) {
        showStatus('No logs available to export.', 'error');
        return;
      }
      
      // Create export data
      const exportData = {
        extension: 'Web Page Metadata Sender',
        exportDate: new Date().toISOString(),
        logs: logs
      };
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = `webhook-extension-logs-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
      
      showStatus('Logs exported successfully!', 'success');
    });
  }
  
  // Helper function to show status messages
  function showStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = 'status ' + type;
    statusElement.style.display = 'block';
    
    // Hide status after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(function() {
        statusElement.style.display = 'none';
      }, 5000);
    }
  }
}); 