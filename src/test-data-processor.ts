import { TestMetadata } from './test-metadata';
import { TestResult } from './influx-models/TestResult';
import { TestRunResult } from './influx-models/TestRunResult';
import { config } from './influx-config/config';

export const APPLICATION_TYPE_FRONTEND = 'FE';
export const OK = 'SUCCESSFUL';
export const NOK = 'FAILED';
export const SKIP = 'SKIPPED';
export const TYPE_COMPONENT = 'CT';
export const TYPE_INTEGRATION = 'IT';
export const UNKNOWN = 'UNK';

export class TestDataProcessor {
  private _application: string = UNKNOWN;
  private _durationTestRunMs: number = 0;
  private _feature: string = UNKNOWN;
  private _featureName: string = UNKNOWN;
  private _releaseVersion: string = UNKNOWN;
  private _risk: string = UNKNOWN;
  private _run: string = UNKNOWN;
  private _startTimeTest: number = 0;
  private _startHrTimeTest: bigint = BigInt(0);
  private _startTimeTestRun: number = 0;
  private _startTimeTestRunDate: number = Date.now();
  private _testType: string = UNKNOWN;

  private _testResult: TestResult;
  private readonly _testRunResult: TestRunResult;

  constructor() {
    this._testResult = new TestResult();
    this._testRunResult = new TestRunResult();
  }

  get testResult(): TestResult {
    return this._testResult;
  }

  get testRunResult(): TestRunResult {
    return this._testRunResult;
  }

  resetTestResult() {
    this._testResult = new TestResult();
    this._testResult.fields.featureName = this._featureName;
    this._testResult.tags.application = this._application;
    this._testResult.tags.feature = this._feature;
    this._testResult.tags.releaseVersion = this._releaseVersion;
    this._testResult.tags.risk = this._risk;
    this._testResult.tags.run = this._run;
    this._testResult.tags.testType = this._testType;
  }

  get application(): string {
    return this._application;
  }

  /**
   * Get the application name based on the path of your project
   * TODO: this is an example, make this applicable for your project
   * @param path of the project
   */
  set application(path: string) {
    let applicationProcessed;

    if (!config.ciProjectName.includes(UNKNOWN)) {
      applicationProcessed = config.ciProjectName;
    }

    if (path.includes('my-project')) applicationProcessed = 'MY_PROJECT';
    else applicationProcessed = 'UNKNOWN_APPLICATION';

    this._application = applicationProcessed;
    this._testRunResult.tags.application = this._application;
    this._testResult.tags.application = this._application;
  }

  set durationTestMs(durationMs: number) {
    this._testResult.fields.durationMs = durationMs;
  }

  set durationTestRunMs(endTime: number) {
    this._durationTestRunMs = endTime - this.startTimeTestRun;
  }

  set errorMessages(errorMessages: string[]) {
    this._testResult.fields.errorMessage = errorMessages;
  }

  set featureName(featureName: string) {
    this._testResult.fields.featureName = featureName;
    this._featureName = featureName;
  }

  /**
   * Set the metadata value for keys 'feature' and 'risk' you add to your TestCafe test
   * TODO: this is an example, make this applicable for your project, check out the readme for an example
   * @param metadata on fixture level
   */
  set fixtureMetaData(metadata: TestMetadata) {
    if (metadata.risk) {
      this._testResult.tags.risk = metadata.risk;
      this._risk = metadata.risk;
    } else if (!metadata.risk) {
      this._risk = UNKNOWN;
    }
    if (metadata.feature) {
      this._testResult.tags.feature = metadata.feature;
      this._feature = metadata.feature;
    } else if (!metadata.feature) {
      this._feature = UNKNOWN;
    }
  }

  /**
   * Set the metadata value for keys 'feature' and 'risk' you add to your TestCafe test
   * TODO: this is an example, make this applicable for your project, check out the readme for an example
   * @param metadata on test level
   */
  set testMetaData(metadata: TestMetadata) {
    if (metadata.risk) this._testResult.tags.risk = metadata.risk;

    if (metadata.feature) this._testResult.tags.feature = metadata.feature;
  }

  set releaseVersion(releaseVersion: string) {
    this._testResult.tags.releaseVersion = releaseVersion;
    this._testRunResult.tags.releaseVersion = releaseVersion;
    this._releaseVersion = releaseVersion;
  }

  set startTimeTest(startTime: number) {
    this._startTimeTest = startTime;
    this._startHrTimeTest = process.hrtime.bigint();
  }

  get startTimeTestRun(): number {
    return this._startTimeTestRun;
  }

  set startTimeTestRun(startTime: number) {
    const date = Date.now();

    if (startTime) {
      this._startTimeTestRun = startTime;
    } else {
      this._startTimeTestRun = date.valueOf();
    }
    this._startTimeTestRunDate = date;

    let d = new Date(date);
    const dateString =
      ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    const timeString = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    this._run = dateString + ', ' + timeString;
    this._testResult.tags.run = this._run;
    this._testRunResult.tags.run = this._run;
  }

  set testCasesTotal(testCases: number) {
    this._testRunResult.fields.testCasesTotal = testCases;
  }

  set testCasesFailed(testCases: number) {
    this._testRunResult.fields.testCasesFailed = testCases;
  }

  set testCasesSkipped(testCases: number) {
    this._testRunResult.fields.testCasesSkipped = testCases;
  }

  /**
   * Set the test type based on the path directory of your tests
   * @param path of the project
   */
  set testName(testName: string) {
    this._testResult.fields.testName = testName;
  }

  /**
   * Set the test type based on the path directory of your tests
   * TODO: Implement this for your applicable test types
   * @param path of the project
   */
  set testType(path: string) {
    let testType: string;

    if (path.includes('component')) testType = TYPE_COMPONENT;
    else if (path.includes('integration')) testType = TYPE_INTEGRATION;
    else testType = 'UNKNOWN_TEST_TYPE';

    this._testType = testType;
    this._testResult.tags.testType = testType;
  }

  set result(result: string) {
    this._testResult.tags.result = result;
  }

  set runResult(testRunResult: any) {
    this._testRunResult.tags.result = testRunResult.failedCount > 0 || this._durationTestRunMs === 0 ? NOK : OK;
  }

  set timeStampInNano(endHrTime: bigint) {
    const timeDiffMs = Number(endHrTime - this._startHrTimeTest) / 1e6;
    this._testResult.timestamp = (this._startTimeTestRunDate + timeDiffMs) * 1e6;
  }

  set warningMessages(warningMessages: string[]) {
    this._testResult.fields.warningMessage = warningMessages[0];
  }
}
