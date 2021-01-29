/**
 * @typedef testRunInfo
 * @property {Array of Objects} errs - An array of errors that occurred during the test run. Use the formatError helper to convert objects in this array to strings.
 * @property {Array of Strings} warnings - An array of warnings that appeared during the test run.
 * @property {Number} durationMs - The duration of the test (in milliseconds).
 * @property {Boolean} unstable - Specifies if the test is marked as unstable.
 * @property {String} screenshotPath - The path where screenshots are saved.
 * @property {Array of Objects} screenshots - An array of screenshot objects, see below
 * @property {Object} quarantine - A quarantine object.
 * @property {Boolean} skipped - Specifies if the test was skipped
 */

/**
 * @typedef screenshot
 * @property {String} screenshotPath - The path where the screenshot was saved.
 * @property {String} thumbnailPath - The path where the screenshot's thumbnail was saved.
 * @property {String} userAgent - The user agent string of the browser where the screenshot was captured.
 * @property {Number} quarantineAttempt - The quarantine attempt's number. see below
 * @property {Boolean} takenOnFail - Specifies if the screenshot was captured when the test failed.
 */

/**
 * @typedef quarantine
 * @property {Boolean} # quarantineAttempt - The object that provides information about the attempt. The object has the boolean passed property that specifies if the test passed in the current attempt.
 */


/**
 * @typedef testRunResult
 * @property {Number} passedCount - The number of passed tests.
 * @property {Number} failedCount - The number of failed tests.
 * @property {Number} skippedCount - The number of skipped tests.
 */
