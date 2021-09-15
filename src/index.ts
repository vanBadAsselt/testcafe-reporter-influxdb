import { EOL } from 'os';
import { config } from './influx-config/config';
import { influx, InfluxDbSender } from './influx-config/influx-db-sender';
import { NOK, OK, SKIP, TestDataProcessor } from './test-data-processor';

let testDataProcessor: TestDataProcessor;
let influxDbSender: InfluxDbSender;

module.exports = function () {
  return {
    noColors: true,

    /**
     * Fires when a test run starts
     * @param {Date} startTime - The date and time when testing started.
     * @param {Array of strings} userAgents - The list of browsers used for testing. Contains the formatted names and versions of the browsers and operating systems.
     * @param {Number} testCount - The total number of tests to run.
     */
    async reportTaskStart(startTime: Date, userAgents: string[], testCount: number) {
      if (!config.testResultsEnabled) {
        this.write(`Uploading test results to Influx DB is disabled. ${EOL}`);
        return;
      }

      influxDbSender = new InfluxDbSender();
      testDataProcessor = new TestDataProcessor();
      testDataProcessor.releaseVersion = config.ciReleaseVersion;
      testDataProcessor.startTimeTestRun = startTime.getTime();
      testDataProcessor.testCasesTotal = testCount;

      this.write(`Testcafe reporter started! Running tests in: ${userAgents} for ${config.ciReleaseVersion}`)
        .newline()
        .newline();
    },

    /**
     * Fires each time a test starts. This method is optional.
     * @param {String} name - The test fixture name.
     * @param {String} path - The path to a test fixture file.
     * @param {Object} fixtureMeta - The fixture metadata.
     */
    async reportFixtureStart(name: string, path: string, fixtureMeta: any) {
      if (config.testResultsEnabled) {
        testDataProcessor.featureName = name;
        testDataProcessor.application = path;
        testDataProcessor.testType = path;
        testDataProcessor.fixtureMetaData = fixtureMeta;
      }
    },

    /**
     * Fires each time a test starts. This method is optional.
     * @param {String} name - The test name.
     * @param {Object} testMeta - The test metadata.
     */
    async reportTestStart(/* name, testMeta */) {
      if (config.testResultsEnabled) {
        testDataProcessor.startTimeTest = Date.now();
      }
    },

    /**
     * Fires each time a test ends.
     * @param {String} name - The test name.
     * @param {Object} testRunInfo - The testRunInfo object. Check out typedefs.js
     * @param {Object} testMeta - The test metadata.
     */
    async reportTestDone(name: string, testRunInfo: any, testMeta: any) {
      if (config.testResultsEnabled) {
        const errors = testRunInfo.errs;
        const { warnings } = testRunInfo;
        const hasErrors = !!errors.length;
        const hasWarnings = !!warnings.length;

        testDataProcessor.testMetaData = testMeta;
        testDataProcessor.testName = name;
        testDataProcessor.timeStampInNano = process.hrtime.bigint();
        testDataProcessor.durationTestMs = testRunInfo.durationMs;
        testDataProcessor.result = testRunInfo.skipped ? SKIP : OK;

        if (hasErrors) {
          const errorMessages: string[] = [];
          errors.forEach((err: string, idx: number) => {
            errorMessages.push(this.formatError(err, `${idx + 1})`));
          });

          testDataProcessor.errorMessages = errorMessages;
          testDataProcessor.result = NOK;
        }

        if (hasWarnings) {
          const warningMessages: string[] = [];
          warnings.forEach((warning: string) => {
            warningMessages.push(warning.toString());
          });
          testDataProcessor.warningMessages = warningMessages;
        }

        influxDbSender.savePoint(testDataProcessor.testResult);
        testDataProcessor.resetTestResult();
      }
    },

    /**
     * Fires when a test run ends.
     * @param {Date} endTime - The test name.
     * @param {Number} passed - The number of passed tests.
     * @param {Array of Strings} warnings - An array of warnings that occurred during a task run.
     * @param {Object} testRunResult - Contains information about the task results. Check out typedefs.js
     */
    async reportTaskDone(endTime: Date, passed: number, warnings: number, testRunResult: any) {
      if (config.testResultsEnabled) {
        testDataProcessor.durationTestRunMs = endTime.getTime();
        testDataProcessor.runResult = testRunResult;
        testDataProcessor.testCasesFailed = testRunResult.failedCount;
        testDataProcessor.testCasesSkipped = testRunResult.skippedCount;

        influxDbSender.savePoint(testDataProcessor.testRunResult);

        influx.ping(5000).then(hosts => {
          hosts.forEach(host => {
            if (host.online) this.write(`${host.url.host} responded in ${host.rtt} ms running ${host.version}.${EOL}`);
            else {
              this.write(`${host.url.host} is offline :( test results won't be stored. ${EOL}`);
            }
          });
        });

        await influxDbSender.sendPoints();

        this.write(`Test reporter done at ${endTime}`)
          .newline()
          .write(`Test results are saved in Influx DB ${config.influxHost}`)
          .newline();
      }
    },
  };
};
