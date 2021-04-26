import { IPoint } from 'influx';
import { UNKNOWN } from '../test-data-processor';
import { tableNameRun } from '../influx-db-sender';

export class TestCafeRunPoint implements IPoint {
  measurement: string;
  tags: {
    [name: string]: string;
  };
  fields: {
    [name: string]: any;
  };

  constructor() {
    this.measurement = tableNameRun;
    this.fields = {
      duration: UNKNOWN,
      testCases: 0,
      testCasesFailed: 0,
      testCasesSkipped: 0,
    };
    this.tags = {
      application: UNKNOWN,
      releaseVersion: UNKNOWN,
      result: UNKNOWN,
    };
  }
}
