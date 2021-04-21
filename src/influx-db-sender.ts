import { FieldType, InfluxDB, IPoint } from 'influx';
import { config } from './config';

export const tableNameTest = 'testcafeTest';
export const tableNameRun = 'testcafeRun';
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
        testName: FieldType.STRING,
        fixtureName: FieldType.STRING,
        durationMs: FieldType.INTEGER,
        errorMessage: FieldType.STRING,
        warningMessage: FieldType.STRING,
      },
      tags: ['application', 'testType', 'feature', 'risk', 'releaseVersion', 'result', 'unstable'],
    },
    {
      measurement: tableNameRun,
      fields: {
        duration: FieldType.STRING,
        testCases: FieldType.INTEGER,
        testCasesFailed: FieldType.INTEGER,
        testCasesSkipped: FieldType.INTEGER,
      },
      tags: ['application', 'releaseVersion', 'result'],
    },
  ],
});

export class InfluxDbSender {
  private _testPoints: IPoint[] = [];

  public savePoint(point: IPoint) {
    this._testPoints.push(point);
  }

  public async sendPoints() {
    await influx.writePoints(this._testPoints);
  }
}
