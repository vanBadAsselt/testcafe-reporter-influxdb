import { IPoint } from 'influx';
import { UNKNOWN } from '../test-data-processor';
import { tableNameTest } from '../influx-db-sender';

export class TestCafeTestPoint implements IPoint {
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
      fixtureName: UNKNOWN,
      testName: UNKNOWN,
      warningMessage: UNKNOWN,
    };
    this.tags = {
      application: UNKNOWN,
      feature: UNKNOWN,
      releaseVersion: UNKNOWN,
      result: UNKNOWN,
      risk: UNKNOWN,
      testType: UNKNOWN,
      unstable: UNKNOWN,
    };
  }
}
