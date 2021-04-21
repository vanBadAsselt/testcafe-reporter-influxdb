import { TestMetadata } from './test-metadata';
import { TestCafeTestPoint } from './models/TestCafeTestPoint';
import { TestCafeRunPoint } from './models/TestCafeRunPoint';
import { config } from './config';

export const UNKNOWN = 'UNK';

export class TestDataProcessor {
  private _application: string = UNKNOWN;
  private _durationTestRunMs: number = 0;
  private _startTimeTest: number = 0;
  private _startHrTimeTest: bigint = BigInt(0);
  private _startTimeTestRun: number = 0;
  private _startTimeTestRunDate: number = Date.now();
  private _testRunResult: string = UNKNOWN;

  private _testCafeTestPoint: TestCafeTestPoint;
  private readonly _testCafeRunPoint: TestCafeRunPoint;

  constructor() {
    this._testCafeTestPoint = new TestCafeTestPoint();
    this._testCafeRunPoint = new TestCafeRunPoint();
  }

  get testCafeTestPoint(): TestCafeTestPoint {
    return this._testCafeTestPoint;
  }

  get testCafeRunPoint(): TestCafeRunPoint {
    return this._testCafeRunPoint;
  }

  resetTestCafeTestPoint() {
    this._testCafeTestPoint = new TestCafeTestPoint();
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

      if (!config.ciProjectName.includes('UNK')) {
          applicationProcessed = config.ciProjectName;
      }

      if (path.includes('my-project')) applicationProcessed = 'MY_PROJECT';
      else applicationProcessed = 'UNKNOWN_APPLICATION';

      this._application = applicationProcessed;
      this._testCafeRunPoint.tags.application = this._application;
      this._testCafeTestPoint.tags.application = this._application;
  }

  set durationTestMs(durationMs: number) {
    this._testCafeTestPoint.fields.durationMs = durationMs;
  }

  get durationTestRunMs(): number {
    return this._durationTestRunMs;
  }

  set durationTestRunMs(endTime: number) {
    this._durationTestRunMs = endTime - this.startTimeTestRun;
  }

  set durationTestRunStr(durationStr: string) {
    this._testCafeRunPoint.fields.duration = durationStr;
  }

  set errorMessages(errorMessages: string[]) {
    this._testCafeTestPoint.fields.errorMessage = errorMessages;
  }

  set fixtureName(fixtureName: string) {
    this._testCafeTestPoint.fields.fixtureName = fixtureName;
  }

  /**
   * Set the metadata value for keys 'feature' and 'risk' you add to your TestCafe test
   * TODO: this is an example, make this applicable for your project, check out the readme for an example
   * @param metadata on fixture or test level
   */
  // set metadata(metadata: TestMetadata) {
  //   if (metadata.risk) metaRisk = metadata.risk;
  //
  //   if (metadata.feature) metaFeature = metadata.feature;
  // }
  set metaData(metadata: TestMetadata) {
    if (metadata.category) this._testCafeTestPoint.tags.category = metadata.category;

    if (metadata.process) this._testCafeTestPoint.tags.process = metadata.process;

    if (metadata.section) this._testCafeTestPoint.tags.section = metadata.section;
  }

  set releaseVersion(releaseVersion: string) {
    this._testCafeTestPoint.tags.releaseVersion = releaseVersion;
    this._testCafeRunPoint.tags.releaseVersion = releaseVersion;
  }

  set startTimeTest(startTime: number) {
    this._startTimeTest = startTime;
    this._startHrTimeTest = process.hrtime.bigint();
  }

  get startTimeTestRun(): number {
    return this._startTimeTestRun;
  }

  set startTimeTestRun(startTime: number) {
    this._startTimeTestRun = startTime;
    this._startTimeTestRunDate = Date.now();
  }

  set testCases(testCases: number) {
    this._testCafeRunPoint.fields.testCases = testCases;
  }

  set testCasesFailed(testCases: number) {
    this._testCafeRunPoint.fields.testCasesFailed = testCases;
  }

  set testCasesSkipped(testCases: number) {
    this._testCafeRunPoint.fields.testCasesSkipped = testCases;
  }

  /**
   * Set the test type based on the path directory of your tests
   * @param path of the project
   */
  set testName(testName: string) {
    this._testCafeTestPoint.fields.testName = testName;
  }

  /**
   * Set the test type based on the path directory of your tests
   * TODO: Implement this for your applicable test types
   * @param path of the project
   */
  set testType(path: string) {
    let testType: string;

    if (path.includes('component')) testType = 'CT';
    else if (path.includes('integration')) testType = 'IT';
    else testType = 'UNKNOWN_TEST_TYPE';

    this._testCafeTestPoint.tags.testType = testType;
  }

  set testResult(result: string) {
    this._testCafeTestPoint.tags.result = result;
  }

  get testRunResult(): any {
    return this._testRunResult;
  }

  set testRunResult(testRunResult: any) {
    this._testCafeRunPoint.tags.result =
      testRunResult.failedCount > 0 || this._durationTestRunMs === 0 ? 'FAIL' : 'SUCCESSFUL';
  }

  set timeStampInNano(endHrTime: bigint) {
    const timeDiffMs = Number(endHrTime - this._startHrTimeTest) / 1e6;
    this._testCafeTestPoint.timestamp = (this._startTimeTestRunDate + timeDiffMs) * 1e6;
  }

  set unstable(unstable: boolean) {
    this._testCafeTestPoint.tags.unstable = String(unstable);
  }

  set warningMessages(value: string[]) {
    this._testCafeTestPoint.fields.warningMessage = value;
  }
}
