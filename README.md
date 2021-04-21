# testcafe-reporter-influxdb
[![Build Status](https://travis-ci.org/vanBadAsselt/testcafe-reporter-influxdb.svg)](https://travis-ci.org/vanBadAsselt/testcafe-reporter-influxdb)

This is the **influxdb** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).
Generated this project using the [generator-testcafe-reporter](https://devexpress.github.io/testcafe/documentation/guides/extend-testcafe/reporter-plugin.html)

<p align="center">
    <img src="https://raw.github.com/vanBadAsselt/testcafe-reporter-influxdb/master/media/preview.png" alt="preview" />
</p>

## Install

```
npm install --save-dev testcafe-reporter-influxdb
```

### Local
Install the library local in the project you want to use the reporter by using the tarball
```
gulp build
npm pack
npm install --save-dev ../testcafe-reporter-influxdb/testcafe-reporter-influxdb-1.0.0.tgz
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter influxdb
```


When you use API, pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter([{ name: 'influxdb', output: `output/test/influxdb.txt` }]) // <-
    .run();
```

Don't forget to set the following environment variables of the Influx database in the project you use this reporter! Locally via `.env` or via `.yml`:
```
variables:
    INFLUX_HOST: "localhost"
    INFLUX_PORT: "8086"
    INFLUX_DB_NAME: "testresults"
    INFLUX_USERNAME: "root"
    INFLUX_PASSWORD: "root"
```

### Expand this reporter to fit your needs

Check out the `typedefs.js` to see what data is accessible from the TestCafe test runs.

### Extract release version

Export the release version of your application via the `CI_RELEASE_VERSION` variable. Add this script to your pipeline yaml and find it back in your InfluxDB!

```
    - git fetch --all --tags
    - export CI_RELEASE_VERSION=$(git describe --tags `git rev-list --tags --max-count=1`)
```

### Test Metadata

Within this reporter you can create a generic collection of your test metadata; feature and risk categories for example. This is how you can categorize your fixture or test:

```
fixture`The user sees the home screen after a successful login`
  .meta({ feature: FeatureCategory.LOGIN, risk: RiskCategory.SMOKE })
```

This metadata is saved in the database, in order to filter or group on it across multiple applications. You can create a dashboard per feature category for example!

## Author
anaisvanasselt (https://linkedin.com/in/anais-van-asselt)
