import { IPoint } from 'influx';
import { APPLICATION_TYPE_FRONTEND, UNKNOWN } from '../test-data-processor';
import { tableNameTest } from '../influx-config/influx-db-sender';

/* eslint-disable @typescript-eslint/no-explicit-any*/
export class TestResult implements IPoint {
  measurement: string;

  timestamp: number;

  fields: {
    [name: string]: any;
  };

  tags: {
    [name: string]: string;
  };

  constructor() {
    this.measurement = tableNameTest;
    this.timestamp = 0;
    this.fields = {
      durationMs: 0,
      errorMessage: UNKNOWN,
      featureName: UNKNOWN,
      skippedMessage: UNKNOWN,
      testName: UNKNOWN,
      warningMessage: UNKNOWN,
    };
    this.tags = {
      application: UNKNOWN,
      applicationType: APPLICATION_TYPE_FRONTEND,
      feature: UNKNOWN,
      releaseVersion: UNKNOWN,
      result: UNKNOWN,
      risk: UNKNOWN,
      run: UNKNOWN,
      testType: UNKNOWN,
    };
  }
}
