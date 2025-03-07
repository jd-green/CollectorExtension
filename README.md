# Web Page Metadata Sender Chrome Extension

A simple Chrome extension that sends the current web page's URL and basic metadata (date, time, device info) to a pre-configured webhook when the extension icon is clicked.

## Features

- Capture and send the current URL and metadata to a configured webhook
- Support for multiple independent instances with custom icons
- Visual feedback through temporary badges (green checkmark for success, red X for failure)
- Retry mechanism that attempts to resend data up to three times if sending fails
- Simple configuration page for setting webhook URL and custom icon
- Advanced CORS handling with multiple fallback strategies
- Bearer token authentication support

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension will be added to your Chrome toolbar

### From Chrome Web Store

*Coming soon*

## Usage

1. After installation, right-click on the extension icon and select "Options"
2. Configure your webhook URL and optionally add a bearer token for authentication
3. Customize the extension with your own icon if desired
4. Adjust advanced settings like retry attempts and badge display duration
5. Click the extension icon in the toolbar to send the current page's URL and metadata to your webhook
6. A temporary badge will appear on the icon to indicate success or failure

## Options Page

The extension includes a modern, tabbed options page with the following sections:

### General
- Configure your webhook URL
- Add bearer token authentication if required
- Test your webhook connection

### Appearance
- Upload a custom icon to personalize your extension

### Advanced
- Set the maximum number of retry attempts (1-5)
- Configure how long success/failure badges display (1-30 seconds)
- Reset settings to defaults

### About
- View extension information and features

## Webhook Data Format

The extension sends data in the following JSON format:

```json
{
  "url": "https://example.com/page",
  "timestamp": "2023-06-15T12:34:56.789Z",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 ...",
    "platform": "MacIntel",
    "language": "en-US"
  }
}
```

## CORS Handling

This extension uses a sophisticated approach to handle CORS issues with webhooks:

1. First attempts with standard JSON format and proper Content-Type header
2. If that fails, tries with URL parameters without Content-Type header
3. As a last resort, uses no-cors mode which should work in most cases

## Development

This extension is built using:

- Vanilla JavaScript
- Chrome Extension Manifest V3
- Local storage for configuration

## License

MIT

## Privacy

This extension only requests the minimum required permissions:
- `storage`: To save your webhook URL and custom icon
- `activeTab`: To access the URL of the current tab when the extension is clicked
- `notifications`: To show error notifications when webhook requests fail

No data is collected or transmitted except to your configured webhook. 