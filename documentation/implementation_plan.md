Below is a step-by-step implementation plan for the Chrome extension project. Each phase and sub-step cites the relevant document section (PRD, App Flow, Tech Stack) and specifies file paths where code or configurations are located.

## Phase 1: Environment Setup

**Step 1:** Create the main project directory structure with the following files and folders:

*   Root directory (e.g., `/chrome-extension-metadata-sender/`)
*   `/manifest.json`
*   `/popup.html` and `/popup.js` (for the popup/confirmation UI)
*   `/options.html` and `/options.js` (for the configuration page)
*   `/background.js` (service worker script for Manifest V3 background tasks)

*(Reference: PRD Section 1 & App Flow: Installation and Setup)*

**Step 2:** Initialize a Git repository within `/chrome-extension-metadata-sender/` and create an initial commit on the `main` branch.

*(Reference: PRD Section 1.4)*

**Step 3:** Validate that the directory structure is correctly set up by listing the files and ensuring that no files are missing.

*(Validation: Run *`tree`* or check folder structure manually)*

## Phase 2: Frontend Development

### A. Manifest and Background Configuration

**Step 4:** Create `/manifest.json` using Manifest V3. Include:

*   The declaration of using a service worker (pointing to `/background.js`)
*   Minimal permissions (only `storage` and `activeTab` as needed)
*   Include the `action` field for a browser toolbar icon

*(Reference: PRD Section 1 & Tech Stack Document; also note that this uses Manifest V3 for enhanced performance and security)*

**Step 5:** Validate the manifest file by running it through Chrome’s extension validation (via developer mode load unpacked) and ensuring no errors in the manifest.

*(Validation: Load extension in Chrome developer mode.)*

### B. Popup (Action) UI Development

**Step 6:** Create `/popup.html` to serve as the user interface when the extension icon is clicked. It may be minimal since the primary feedback is a temporary badge on the icon. You can include a simple message (e.g., “Sending…”).

*(Reference: PRD Section 3: Activating the Extension Instance)*

**Step 7:** Create `/popup.js` to control the popup UI logic. This script should:

*   Listen for the DOMContentLoaded event
*   Optionally display a message confirming that data is being sent
*   (If needed) Trigger feedback display logic after data is sent

*(Reference: PRD Section 4: Visual Feedback and Confirmation)*

**Step 8:** Validate that the popup loads correctly in Chrome by clicking on the extension icon and verifying the UI (even if minimal).

*(Validation: Using Chrome developer tools for the popup view)*

### C. Options Page UI Development

**Step 9:** Create `/options.html` for the configuration panel. This page should include:

*   A form for entering and saving a webhook URL
*   A file input for uploading a custom icon (ensure file type validation according to Chrome requirements, e.g., PNG/JPEG)

*(Reference: PRD Section 3: User Flow; Core Features: Options and Configuration Page)*

**Step 10:** Create `/options.js` to implement the following functionalities:

*   On page load, retrieve any saved configuration from local storage
*   Bind form submission to save the webhook URL and custom icon to local storage
*   Validate file type and size per Chrome icon requirements

*(Reference: PRD Section 3: Configuring the Extension)*

**Step 11:** Validate the options page by manually entering a webhook URL and uploading a test icon. Then check local storage to ensure the settings are correctly stored.

*(Validation: Use Chrome Developer Tools to inspect *`localStorage`* entries)*

## Phase 3: Background (Core Logic) Development

**Step 12:** Create `/background.js` as the service worker script. Within this script, implement the following core functionalities:

*   Listen for the extension icon click (using the `chrome.action.onClicked` event)
*   On click, retrieve the current active tab’s URL via `chrome.tabs.query` and gather metadata (date, time, and basic device info via the Navigator API)

*(Reference: PRD Section 4: Capturing and Sending Data)*

**Step 13:** In `/background.js`, implement the logic to send the gathered data to the webhook URL saved in local storage using the `fetch()` API. Package the data in a JSON format.

*(Reference: PRD Section 4: Metadata Capture and Transmission)*

**Step 14:** Within `/background.js`, implement a retry mechanism that:

*   Attempts to send the data up to 3 times on failure
*   Uses a delay (e.g., 2 seconds) between retry attempts
*   On final failure, notifies the user by triggering a failure badge on the icon

*(Reference: PRD Section 4: Data Transmission and Error Handling)*

**Step 15:** Implement logic in `/background.js` that triggers visual feedback:

*   On success, temporarily display a green checkmark badge on the extension icon
*   On failure (after retries), display a red X badge
*   Both badges should be visible for 10 seconds

*(Reference: PRD Section 4: Visual Feedback and Confirmation)*

**Step 16:** Validate the background script logic by using console logging and debugging in Chrome’s service worker console. Simulate both successful and failure scenarios (you might temporarily point to an invalid webhook URL to test retries and notification logic).

*(Validation: Manually test by clicking the extension icon and observing service worker logs, badge changes, etc.)*

## Phase 4: Integration

**Step 17:** Ensure that `/popup.js`, `/options.js`, and `/background.js` correctly communicate via local storage and, if necessary, message passing. Confirm that configuration changes made on the options page update the behavior in the background script.

*(Reference: App Flow: Configuring the Extension & Activating the Extension Instance)*

**Step 18:** Verify that all parts of the extension (popup, options page, background logic) are integrated by testing a complete user flow in developer mode:

*   Install the extension
*   Configure a webhook URL and upload a custom icon via the options page
*   Click the extension icon and check that the metadata is sent and the correct feedback is displayed

*(Validation: Full manual test of the user flow in Chrome)*

## Phase 5: Deployment

**Step 19:** Package the Chrome extension by following the official Chrome extension packaging guidelines (create a ZIP file including `/manifest.json` and all necessary assets). Document the steps within a README file in your project root.

*(Reference: PRD Sections 1 and 6; Non-Functional Requirements: Usability & Performance)*

**Step 20:** Validate the deployment package by loading it as an unpacked extension in a clean Chrome profile and running through all test flows (options page configuration, sending data, visual feedback, and retry mechanism).

*(Validation: Final manual end-to-end test in Chrome Developer Mode)*

**Notes:**

*   This plan uses vanilla JavaScript, Manifest V3, and local storage as specified in the Project Requirements Document and Tech Stack documents.
*   As this extension is client-side only, there is no separate backend deployment; all functionality is handled within service workers and local storage.
*   Ensure that file validations for custom icon upload are performed inline with Chrome’s guidelines regarding file types and sizes.

This completes the step-by-step implementation plan. Follow each step in order and use Chrome Developer Tools at each validation point to confirm successful implementation.
