[![GitHub license](https://img.shields.io/github/license/palcarazm/batchjs.svg?color=informational)](https://github.com/palcarazm/batchjs/blob/version/v1/LICENSE)
[![Latest release](https://img.shields.io/github/package-json/v/palcarazm/batchjs/version/v1?logo=github)](https://github.com/palcarazm/batchjs/releases)
[![NPM Badge](https://img.shields.io/npm/dm/batchjs?logo=npm)](https://www.npmjs.com/package/batchjs)
[![CI](https://img.shields.io/github/actions/workflow/status/palcarazm/batchjs/ci-workflow.yml?branch=version/v1&label=CI&logo=Node.js&logoColor=white)](https://github.com/palcarazm/batchjs/actions/workflows/ci-workflow.yml)
[![Coverage](https://coveralls.io/repos/github/palcarazm/batchjs/badge.svg)](https://coveralls.io/github/palcarazm/batchjs)
[![Funding](https://img.shields.io/badge/sponsor-30363D?style=flat&logo=GitHub-Sponsors&logoColor=#white)](https://github.com/sponsors/palcarazm)

# BatchJS

Dependencies free batch processing framework for NodeJS based on streams.

---

- [BatchJS](#batchjs)
- [Download](#download)
  - [NPM](#npm)
  - [Yarn](#yarn)
- [Usage](#usage)
- [Documentation](#documentation)
- [Collaborators welcome!](#collaborators-welcome)

---

# Download

[![Latest release](https://img.shields.io/github/package-json/v/palcarazm/batchjs/version/v1?logo=github)](https://github.com/palcarazm/batchjs/releases)

## NPM

[![NPM Badge](https://img.shields.io/npm/dm/batchjs?logo=npm)](https://www.npmjs.com/package/batchjs)

```ksh
npm install batchjs
```

## Yarn

```ksh
yarn add batchjs
```

# Usage

```typescript
import { Job, Step } from "batchjs";

// Implement a step
class StepImplementation extends Step {
  // Set a name to the step
  constructor(name: string = "MockPassingStep") {
    super(name);
  }

  // Implement the reader to load step data source
  protected _reader() {
    return new Readable({
      objectMode: true,
      read() {
        this.push("data");
        this.push(null);
      },
    });
  }

  // Implement the processors to transform data sequently using our streams or your own streams
  protected _processors() {
    const opts: TransformOptions = {
      objectMode: true,
      transform(
        chunk: unknown,
        encoding: BufferEncoding,
        callback: TransformCallback
      ) {
        this.push(chunk);
        callback();
      },
    };
    return [new Transform(opts), new Transform(opts)];
  }

  // Implement the write to stock final step data
  protected _writer() {
    return new Writable({
      objectMode: true,
      write(
        chunk: unknown,
        encoding: BufferEncoding,
        callback: TransformCallback
      ) {
        callback();
      },
    });
  }
}

// Implement a Job
class JobImplementation extends Job {
  // Implement to set the steps to be sequently executed.
  protected _steps() {
    return [new StepImplementation(), new StepImplementation()];
  }
}

// Instance the Job
const job = new JobImplementation("My job");

// Set events listener
job.on("stepStart", (step: step) => {
  console.log(`Starting step ${step.name}`);
});

// Launch the job
job
  .run()
  .then(() => {
    console.log("Job completed successfully");
  })
  .catch((error) => {
    console.log("Job completed with errors");
  });
```

# Documentation

- [Core API](./docs/common-api.md)
- [Stream API](./docs/streams-api.md)

# Collaborators welcome!

- ¿Do you like the project? Give us a :star: in [GitHub](https://github.com/palcarazm/batchjs).
- :sos: ¿Do you need some help? Open a discussion in [GitHub help wanted](https://github.com/palcarazm/batchjs/discussions/new?category=q-a)
- :bug: ¿Do you find a bug? Open a issue in [GitHub bug report](https://github.com/palcarazm/batchjs/issues/new?assignees=&labels=bug&projects=&template=01-BUG_REPORT.yml)
- :bulb: ¿Do you have a great idea? Open a issue in [GitHub feature request](https://github.com/palcarazm/batchjs/issues/new?assignees=&labels=feature&projects=&template=02-FEATURE_REQUEST.yml)
- :computer: ¿Do you know how to fix a bug? Open a pull request in [GitHub pull request](https://github.com/palcarazm/batchjs/compare).
- ¿Do you know a security issue? Take a read to our [security strategy](https://github.com/palcarazm/batchjs/blob/version/v1/SECURITY.md).

[![GitHub Contributors](https://contrib.rocks/image?repo=palcarazm/batchjs)](https://github.com/palcarazm/batchjs/graphs/contributors)

[Subscribe our code of conduct](https://github.com/palcarazm/batchjs/blob/version/v1/CODE_OF_CONDUCT.md) and follow the [Contribution Guidelines](https://github.com/palcarazm/batchjs/blob/version/v1/CONTRIBUTING.md).
