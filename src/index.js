require('dotenv').config();

const Influx = require('influx');
const tableNameTest = 'testcafeTest';
const tableNameRun = 'testcafeRun';
const resultOk = 'SUCCESSFUL';
const resultNok = 'FAILED';

const influx = new Influx.InfluxDB({
    host:     process.env.INFLUX_HOST,
    port:     process.env.INFLUX_PORT,
    database: process.env.INFLUX_DB_NAME,
    username: process.env.INFLUX_USERNAME,
    password: process.env.INFLUX_PASSWORD,
    schema:   [
        {
            measurement: tableNameTest,
            fields:      {
                testRun:        Influx.FieldType.STRING,
                testName:       Influx.FieldType.STRING,
                fixtureName:    Influx.FieldType.STRING,
                durationMs:     Influx.FieldType.INTEGER,
                errorMessage:   Influx.FieldType.STRING,
                warningMessage: Influx.FieldType.STRING,
                releaseVersion: Influx.FieldType.STRING
            },
            tags: [
                'application', 'testType', 'feature', 'risk', 'result'
            ]
        },
        {
            measurement: tableNameRun,
            fields:      {
                testRun:          Influx.FieldType.STRING,
                durationMs:       Influx.FieldType.STRING,
                testCases:        Influx.FieldType.INTEGER,
                testCasesFailed:  Influx.FieldType.INTEGER,
                testCasesSkipped: Influx.FieldType.INTEGER,
                releaseVersion:   Influx.FieldType.STRING
            },
            tags: [
                'application', 'result',
            ]
        }
    ]
});

/**
 * Get the application name based on the path of your project
 * @param path of the project
 */
function getApplicationFromPath (path) {
    if (path.includes('application placeholder a'))
        return 'application placeholder a';
    else if (path.includes('application placeholder b'))
        return 'application placeholder b';
    return 'UNK';
}

/**
 * Get the test type based on the path directory of your tests
 * @param path of the project
 */
function getTestTypeFromPath (path) {
    if (path.includes('component'))
        return 'CT';
    else if (path.includes('integration'))
        return 'IT';
    return 'UNK';
}

/**
 * Get the metadata value for key 'feature' you add to your TestCafe test, check out the readme for an example
 * @param metadata on fixture or test level
 */
function getFeatureFromMetadata (metadata) {
    if (metadata && metadata.feature)
        return metadata.feature;
    return 'UNK';
}

/**
 * Get the metadata value for key 'risk' you add to your TestCafe test, check out the readme for an example
 * @param metadata on fixture or test level
 */
function getRiskFromMetadata (metadata) {
    if (metadata && metadata.risk)
        return metadata.risk;
    return 'UNK';
}

/**
 * Get the release version of your project when available, check out the readme to export this env var
 */
function getReleaseVersionFromCI () {
    if (process.env.CI_RELEASE_VERSION)
        return process.env.CI_RELEASE_VERSION.toString();
    return 'UNK';
}


module.exports = function () {
    const defaultTestPoint = {
        measurement: tableNameTest,
        tags:        {},
        fields:      {},
    };

    let testPoint = defaultTestPoint;

    const testPoints = [];

    const testRunPoint = {
        measurement: tableNameRun,
        tags:        {},
        fields:      {},
    };

    return {
        noColors: true,

        /**
         * Fires when a test run starts
         * @param {Date} startTime - The date and time when testing started.
         * @param {Array of strings} userAgents - The list of browsers used for testing. Contains the formatted names and versions of the browsers and operating systems.
         * @param {Number} testCount - The total number of tests to run.
         */
        reportTaskStart (startTime, userAgents, testCount) {
            influx.ping(5000).then(hosts => {
                hosts.forEach(host => {
                    if (host.online)
                        console.log(`${host.url.host} responded in ${host.rtt} ms running ${host.version})`);
                    else
                        console.log(`${host.url.host} is offline :(`);
                });
            });

            this.startTime = startTime.toDateString();

            const ciReleaseVersion = getReleaseVersionFromCI();

            testPoint.fields.releaseVersion = ciReleaseVersion;
            testPoint.fields.testRun = this.startTime;

            testRunPoint.fields.releaseVersion = ciReleaseVersion;
            testRunPoint.fields.testRun = this.startTime;
            testRunPoint.fields.testCases = testCount;

            this.write(`Testcafe reporter started! Running tests in: ${userAgents} for ${ciReleaseVersion}`)
                .newline()
                .newline();
        },

        /**
         * Fires each time a test starts. This method is optional.
         * @param {String} name - The test fixture name.
         * @param {String} path - The path to a test fixture file.
         * @param {Object} fixtureMeta - The fixture metadata.
         */
        reportFixtureStart (name, path, fixtureMeta) {
            if (typeof defaultTestPoint.tags.application === 'undefined') {
                const application = getApplicationFromPath(path);

                defaultTestPoint.tags.application = application;
                testRunPoint.tags.application = application;
            }

            testPoint.fields.fixtureName = name;
            testPoint.tags.testType = getTestTypeFromPath(path);
            testPoint.tags.feature = getFeatureFromMetadata(fixtureMeta);
            testPoint.tags.risk = getRiskFromMetadata(fixtureMeta);
        },

        /**
         * Fires each time a test starts. This method is optional.
         * @param {String} name - The test name.
         * @param {Object} testMeta - The test metadata.
         */
        reportTestStart (name, testMeta ) {
            testPoint.fields.testName = name;
            testPoint.tags.feature = getFeatureFromMetadata(testMeta);
            testPoint.tags.risk = getRiskFromMetadata(testMeta);
        },

        /**
         * Fires each time a test ends.
         * @param {String} name - The test name.
         * @param {Object} testRunInfo - The testRunInfo object. Check out typedefs.js
         * @param {Object} testMeta - The test metadata.
         */
        reportTestDone (name, testRunInfo, /* testMeta */) {
            const errors = testRunInfo.errs;
            const warnings = testRunInfo.warnings;
            const hasErrors = !!errors.length;
            const hasWarnings = !!warnings.length;

            let resultTest = resultOk;

            const errorMessage = [];

            if (hasErrors) {
                resultTest = resultNok;
                errors.forEach((err, idx) => {
                    errorMessage.push(this.formatError(err, `${idx + 1})`));
                });
            }

            const warningMessage = [];

            if (hasWarnings) {
                warnings.forEach(warning => {
                    warningMessage.push(warning.toString());
                });
            }

            testPoint.tags.result = resultTest;
            testPoint.fields.durationMs = testRunInfo.durationMs;
            testPoint.fields.errorMessage = errorMessage;
            testPoint.fields.warningMessage = warningMessage;

            testPoints.push(testPoint);
            testPoint = defaultTestPoint;
        },

        /**
         * Fires when a test run ends.
         * @param {Date} endTime - The test name.
         * @param {Number} passed - The number of passed tests.
         * @param {Array of Strings} warnings - An array of warnings that occurred during a task run.
         * @param {Object} testRunResult - Contains information about the task results. Check out typedefs.js
         */
        reportTaskDone (endTime, passed, warnings, testRunResult) {
            const durationMs = endTime - this.startTime;

            const resultTestRun = testRunResult.failedCount > 0 || durationMs === 0 ? resultNok : resultOk;

            testRunPoint.tags.result = resultTestRun;
            testRunPoint.fields.durationMs = durationMs;
            testRunPoint.fields.testCasesFailed = testRunResult.failedCount;
            testRunPoint.fields.testCasesSkipped = testRunResult.skippedCount;

            influx.writePoints(testPoints);
            influx.writePoints([testRunPoint]);

            this.write(`Test reporter done at ${endTime}`)
                .newline()
                .write(`Test results are saved in Influx DB ${process.env.INFLUX_HOST}`)
                .newline();
        }
    };
};
