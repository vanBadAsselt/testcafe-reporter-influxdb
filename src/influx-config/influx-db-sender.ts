import { FieldType, InfluxDB, IPoint } from 'influx';
import { config } from './config';

export const tableNameTest = 'testResults';
export const tableNameRun = 'testRunResults';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types*/
export const influx = new InfluxDB({
  host: config.influxHost,
  port: config.influxPort,
  database: config.influxDb,
  username: config.influxUsername,
  password: config.influxPassword,
  schema: [
    {
      measurement: tableNameTest,
      fields: {
        durationMs: FieldType.INTEGER,
        errorMessage: FieldType.STRING,
        featureName: FieldType.STRING,
        skippedMessage: FieldType.STRING,
        testName: FieldType.STRING,
        warningMessage: FieldType.STRING,
      },
      tags: ['application', 'applicationType', 'feature', 'releaseVersion', 'result', 'risk', 'run', 'testType'],
    },
    {
      measurement: tableNameRun,
      fields: {
        durationMs: FieldType.INTEGER,
        testCasesTotal: FieldType.INTEGER,
        testCasesFailed: FieldType.INTEGER,
        testCasesSkipped: FieldType.INTEGER,
      },
      tags: ['application', 'applicationType', 'releaseVersion', 'result', 'run', 'testType'],
    },
  ],
});

export class InfluxDbSender {
  private _testPoints: IPoint[] = [];

  public savePoint(point: IPoint) {
    this._testPoints.push(point);
  }

  public async sendPoints() {
    await influx.createRetentionPolicy('defaultPolicy', {
      database: config.influxDb,
      duration: '30d',
      isDefault: true,
      replication: 1,
    });
    await influx.writePoints(this._testPoints);
  }
}
