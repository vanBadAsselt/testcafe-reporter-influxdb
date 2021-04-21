import * as dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) throw result.error;

export const config = {
  ciProjectName: process.env.CI_PROJECT_NAME ?? 'UNK', // this is a gitlab predefined variable
  ciReleaseVersion: process.env.CI_RELEASE_VERSION ?? 'UNK',
  testResultsEnabled: process.env.TEST_RESULTS_ENABLED === 'true',
  influxHost: process.env.TEST_RESULTS_INFLUX_HOST ?? 'localhost',
  influxPort: Number.parseInt(process.env.TEST_RESULTS_INFLUX_PORT, 10) ?? 8086,
  influxDb: process.env.TEST_RESULTS_INFLUX_DB ?? 'testresults',
  influxUsername: process.env.TEST_RESULTS_INFLUX_USER ?? 'root',
  influxPassword: process.env.TEST_RESULTS_INFLUX_PASSWORD ?? 'root',
};
