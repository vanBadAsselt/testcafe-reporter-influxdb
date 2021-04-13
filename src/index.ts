import { EOL } from 'os';
import { config } from './config';
import { FieldType, InfluxDB, IPoint } from 'influx';
import { TestMetadata } from './test-metadata';

const tableNameTest = 'testcafeTest';
const tableNameRun = 'testcafeRun';
const testPoints: IPoint[] = [];
const testRunStarted = Date.now();
const hrtimeStarted = process.hrtime.bigint();

let testType = 'UNK';
let application = 'UNK';
let metaRisk = 'UNK';
let metaFeature = 'UNK';
let influxOnline = true;

const influx = new InfluxDB({
  host: config.influxHost,
  port: config.influxPort,
  database: config.influxDb,
  username: config.influxUsername,
  password: config.influxPassword,
  schema: [
    {
      measurement: tableNameTest,
      fields: {
        testName: FieldType.STRING,
        fixtureName: FieldType.STRING,
        durationMs: FieldType.INTEGER,
        errorMessage: FieldType.STRING,
        warningMessage: FieldType.STRING,
        releaseVersion: FieldType.STRING,
      },
      tags: ['application', 'testType', 'risk', 'feature', 'result'],
    },
    {
      measurement: tableNameRun,
      fields: {
        duration: FieldType.STRING,
        testCases: FieldType.INTEGER,
        testCasesFailed: FieldType.INTEGER,
        testCasesSkipped: FieldType.INTEGER,
        releaseVersion: FieldType.STRING,
      },
      tags: ['application', 'result'],
    },
  ],
});

/**
 * Get the application name based on the path of your project
 * @param path of the project
 */
function setApplication(path: string) {
  // TODO: Implement this for your applicable applications
  if (path.includes('application placeholder a')) application = 'application placeholder a';
  else if (path.includes('application placeholder b')) application = 'application placeholder a';
  else application = 'unknown application';
}

/**
 * Set the test type based on the path directory of your tests
 * @param path of the project
 */
function setTestType(path: string) {
  // TODO: Implement this for your applicable test types
  if (path.includes('component')) testType = 'CT';
  else if (path.includes('integration')) testType = 'IT';
}

/**
 * Set the metadata value for keys 'feature' and 'risk' you add to your TestCafe test, check out the readme for an example
 * @param metadata on fixture or test level
 */
function setMetadata(metadata: TestMetadata) {
  if (metadata.risk) metaRisk = metadata.risk;

  if (metadata.feature) metaFeature = metadata.feature;
}

module.exports = function () {
  return {
    noColors: true,

    /**
     * Fires when a test run starts
     * @param {Date} startTime - The date and time when testing started.
     * @param {Array of strings} userAgents - The list of browsers used for testing. Contains the formatted names and versions of the browsers and operating systems.
     * @param {Number} testCount - The total number of tests to run.
     */
    async reportTaskStart(startTime: number, userAgents: string[], testCount: number) {
      if (!config.testResultsEnabled) {
        this.write(`Uploading test results to Influx DB is disabled.${EOL}`);
        return;
      }

      influx.ping(5000).then(hosts => {
        hosts.forEach(host => {
          if (host.online) this.write(`${host.url.host} responded in ${host.rtt} ms running ${host.version}.${EOL}`);
          else {
            this.write(`${host.url.host} is offline :(${EOL}`);
            influxOnline = false;
            return;
          }
        });
      });

      this.startTime = startTime;
      this.testCount = testCount;

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
      if (influxOnline && config.testResultsEnabled) {
        this.currentFixtureName = name;
        setApplication(path);
        setTestType(path);
        setMetadata(fixtureMeta);
      }
    },

    /**
     * Fires each time a test starts. This method is optional.
     * @param {String} name - The test name.
     * @param {Object} testMeta - The test metadata.
     */
    async reportTestStart(/* name, testMeta */) {
      // Not implemented.
    },

    /**
     * Fires each time a test ends.
     * @param {String} name - The test name.
     * @param {Object} testRunInfo - The testRunInfo object. Check out typedefs.js
     * @param {Object} testMeta - The test metadata.
     */
    async reportTestDone(name: string, testRunInfo: any, testMeta: any) {
      if (influxOnline && config.testResultsEnabled) {
        const errors = testRunInfo.errs;
        const warnings = testRunInfo.warnings;
        const hasErrors = !!errors.length;
        const hasWarnings = !!warnings.length;

        setMetadata(testMeta);

        let resultTest = 'SUCCESSFUL';

        const errorMessage: string[] = [];

        if (hasErrors) {
          resultTest = 'FAIL';
          errors.forEach((err: string, idx: number) => {
            errorMessage.push(this.formatError(err, `${idx + 1})`));
          });
        }

        const warningMessage: string[] = [];

        if (hasWarnings) {
          warnings.forEach((warning: string) => {
            warningMessage.push(warning.toString());
          });
        }

        const hrtimeCurrent = process.hrtime.bigint();
        const timeDiffMs = Number(hrtimeCurrent - hrtimeStarted) / 1e6;
        const nanoTime = (testRunStarted + timeDiffMs) * 1e6;

        const testPoint: IPoint = {
          measurement: tableNameTest,
          timestamp: nanoTime,
          tags: {
            application: application,
            testType: testType,
            risk: metaRisk,
            feature: metaFeature,
            result: resultTest,
          },
          fields: {
            testName: name,
            fixtureName: this.currentFixtureName,
            durationMs: testRunInfo.durationMs,
            errorMessage: errorMessage,
            warningMessage: warningMessage,
            releaseVersion: config.ciReleaseVersion,
          },
        };

        testPoints.push(testPoint);
      }
    },

    /**
     * Fires when a test run ends.
     * @param {Date} endTime - The test name.
     * @param {Number} passed - The number of passed tests.
     * @param {Array of Strings} warnings - An array of warnings that occurred during a task run.
     * @param {Object} testRunResult - Contains information about the task results. Check out typedefs.js
     */
    async reportTaskDone(endTime: number, passed: number, warnings: number, testRunResult: any) {
      if (influxOnline && config.testResultsEnabled) {
        const durationMs = endTime - this.startTime;
        const durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');

        const resultTestRun = testRunResult.failedCount > 0 || durationMs === 0 ? 'FAIL' : 'SUCCESSFUL';

        await influx.writePoints(testPoints);

        await influx.writePoints([
          {
            measurement: tableNameRun,
            tags: { application: application, result: resultTestRun },
            fields: {
              duration: durationStr,
              testCases: this.testCount,
              testCasesFailed: testRunResult.failedCount,
              testCasesSkipped: testRunResult.skippedCount,
              releaseVersion: config.ciReleaseVersion,
            },
          },
        ]);
        this.write(`Test reporter done at ${endTime}`)
          .newline()
          .write(`Test results are saved in Influx DB ${config.influxHost}`)
          .newline();
      }
    },
  };
};
