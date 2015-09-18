# metalsmith-formatcheck

[metalsmith]: http://metalsmith.io
[html-validator]: https://www.npmjs.com/package/html-validator

This is a plugin for [Metalsmith][] that checks HTML pages for HTML5 format
compliance via the [html-validator][] module.

## Installation

This module is released via npm, install the latest released version with:

```
npm install --save metalsmith-formatcheck
```

##  Usage

If using the CLI for Metalsmith, metalsmith-formatcheck can be used like any other plugin by including it in `metalsmith.json`:

```json
{
  "plugins": {
    "metalsmith-formatcheck"
  }
}
```

For metalsmiths JavaScript API, metalsmith-formatcheck can be used like any other plugin, by attaching it to the function invocation chain on the metalscript object:

```js
var formatcheck = require('metalsmith-formatcheck');
require('metalsmith')(__dirname)
  .use(formatcheck())
  .build();
```

Because metalsmith-formatcheck will only check HTML pages, normally you will
want to use metalsmith-formatcheck at the end of your build pipeline when all
of your HTML pages have been generated. **Note that metalsmith-formatcheck
requires network access**.

### Options

metalsmith-formatcheck does not require any options, but the following options
are available:


#### `verbose` (optional)

(default: *false*)

If set a message will be printed if files generate warnings or errors.

#### `failWithoutNetwork` (optional)

(default : *true*)

If set, metalsmith-formatcheck will fail if no network
connection is available.

#### `failErrors` (optional)

(default: *true*)

If set the metalsmith build process will halt if any files have format
errors.

#### `failWarnings` (optional)

(default: *false*)

If set the metalsmith build process will halt if any files have format
warnings.

#### `cacheChecks` (optional)

(default: *true*)

If set metalsmith-formatcheck will record when external links succeed in
`checkFile` and not repeat the check for an interval set by `recheckMinutes`.

#### `checkFile` (optional)

(default: *`.format_checked.json`*)

Path relative to the metalsmith source directory where
metalsmith-formatcheck caches link check information. This will be removed from
the build directory.

#### `failFile` (optional)

(default: *`format_failed.json`*)

Path relative to the metalsmith source directory to a JSON file where link
failures are recorded. This will be removed from the build directory.
