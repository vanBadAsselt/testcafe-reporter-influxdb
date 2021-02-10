require('dotenv').config();

const Influx = require('influx');
const tableNameTest = 'testcafeTest';
const tableNameRun = 'testcafeRun';
const unknown = 'UNK';
const resultOk = 'SUCCESSFUL';
const resultNok = 'FAILED';

let testType = unknown;

let application = unknown;

let metaFeature = unknown;

let metaRisk = unknown;

let ciReleaseVersion = unknown;

let startTimeDate = new Date();

let startTimeStr = unknown;

let testCasesAmount = 0;

let fixtureName = unknown;

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
                duration:         Influx.FieldType.STRING,
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
function setApplicationFromPath (path) {
    if (path.includes('application placeholder a'))
        application = 'application placeholder a';
    else if (path.includes('application placeholder b'))
        application = 'application placeholder b';
    else
        application = 'UNK_APP';
}

/**
 * Set the test type based on the path directory of your tests
 * @param path of the project
 */
function setTestTypeFromPath (path) {
    if (path.includes('component'))
        testType = 'CT';
    else if (path.includes('integration'))
        testType = 'IT';
}

/**
 * Set the metadata value for keys 'feature' and 'risk' you add to your TestCafe test, check out the readme for an example
 * @param metadata on fixture or test level
 */
function setFeatureAndRiskFromMetadata (metadata) {
    if (metadata && metadata.feature)
        metaFeature = metadata.feature;

    if (metadata && metadata.risk)
        metaRisk = metadata.risk;
}

/**
 * Set the release version of your project when available, check out the readme to export this env var
 */
function setReleaseVersionFromCI () {
    if (process.env.CI_RELEASE_VERSION)
        ciReleaseVersion = process.env.CI_RELEASE_VERSION.toString();
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
        reportTaskStart (startTime, userAgents, testCount) {
            influx.ping(5000).then(hosts => {
                hosts.forEach(host => {
                    if (host.online)
                        console.log(`${host.url.host} responded in ${host.rtt} ms running on host version ${host.version}`);
                    else
                        console.log(`${host.url.host} is offline :(`);
                });
            });

            startTimeDate = startTime;
            startTimeStr = startTime.toDateString();
            testCasesAmount = testCount;
            setReleaseVersionFromCI();

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
            if (application === unknown)
                setApplicationFromPath(path);

            setTestTypeFromPath(path);
            setFeatureAndRiskFromMetadata(fixtureMeta);
            fixtureName = name;
        },

        /**
         * Fires each time a test starts. This method is optional.
         * @param {String} name - The test name.
         * @param {Object} testMeta - The test metadata.
         */
        reportTestStart (/*name, testMeta*/ ) {
            // Not implemented.
        },

        /**
         * Fires each time a test ends.
         * @param {String} name - The test name.
         * @param {Object} testRunInfo - The testRunInfo object. Check out typedefs.js
         * @param {Object} testMeta - The test metadata.
         */
        reportTestDone (name, testRunInfo, testMeta ) {
            const errors = testRunInfo.errs;
            const warnings = testRunInfo.warnings;
            const hasErrors = !!errors.length;
            const hasWarnings = !!warnings.length;

            setFeatureAndRiskFromMetadata(testMeta);

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

            const testPoint =
                {
                    measurement: tableNameTest,
                    tags:        { application: application, testType: testType, feature: metaFeature, risk: metaRisk, result: resultTest },
                    fields:      {
                        testRun:        startTimeStr,
                        testName:       name,
                        fixtureName:    fixtureName,
                        durationMs:     testRunInfo.durationMs,
                        errorMessage:   errorMessage,
                        warningMessage: warningMessage,
                        releaseVersion: ciReleaseVersion
                    },
                };

            influx.writePoints([testPoint]);
        },

        /**
         * Fires when a test run ends.
         * @param {Date} endTime - The test name.
         * @param {Number} passed - The number of passed tests.
         * @param {Array of Strings} warnings - An array of warnings that occurred during a task run.
         * @param {Object} testRunResult - Contains information about the task results. Check out typedefs.js
         */
        reportTaskDone (endTime, passed, warnings, testRunResult) {
            const durationMs = endTime - startTimeDate;
            const durationStr = this.moment
                .duration(durationMs)
                .format('h[h] mm[m] ss[s]');

            const resultTestRun = testRunResult.failedCount > 0 || durationMs === 0 ? resultNok : resultOk;

            influx.writePoints([{
                measurement: tableNameRun,
                tags:        { application: application, result: resultTestRun },
                fields:      {
                    duration:         durationStr,
                    testRun:          startTimeStr,
                    testCases:        testCasesAmount,
                    testCasesFailed:  testRunResult.failedCount,
                    testCasesSkipped: testRunResult.skippedCount,
                    releaseVersion:   ciReleaseVersion
                },
            }]);

            this.write(`Test reporter done at ${endTime}`)
                .newline()
                .write(`Test results are saved in Influx DB ${process.env.INFLUX_HOST}`)
                .newline();
        }
    };
};
