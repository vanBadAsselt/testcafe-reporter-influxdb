import { IPoint } from 'influx';
import { APPLICATION_TYPE_FRONTEND, UNKNOWN } from '../test-data-processor';
import { tableNameRun } from '../influx-config/influx-db-sender';

/* eslint-disable @typescript-eslint/no-explicit-any*/
export class TestRunResult implements IPoint {
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
      durationMs: 0,
      testCasesTotal: 0,
      testCasesFailed: 0,
      testCasesSkipped: 0,
    };
    this.tags = {
      application: UNKNOWN,
      applicationType: APPLICATION_TYPE_FRONTEND,
      releaseVersion: UNKNOWN,
      result: UNKNOWN,
      run: UNKNOWN,
    };
  }
}
