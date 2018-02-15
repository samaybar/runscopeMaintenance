# runscope-pause

This is a node.js application that allows you to use the [Runscope API](https://www.runscope.com/docs/api) to pause and resume all scheduled tests in a Runscope bucket.

## Installation
If Node.js is not installed, install it from https://nodejs.org/. Once complete, check by running ```node -v``` from a terminal window to show the install version.

Clone the repo:
`git clone https://github.com/samaybar/runscopeMaintenance.git`
`cd runscopeMaintenance`

Install node module dependencies:
`npm install`

Rename `mysettings.js` as `settings.js`

## How to Use

### Obtaining an Access Token

- Create an application at https://www.runscope.com/applications
- Use dummy URLs for the app and callback URL values (e.g. http://example.com)
- Copy the Personal Access Token from the created app and set the `apikey` in `settings.js`

### Pausing all tests in a bucket

- `node runscopeMaintenance.js pause YOUR_BUCKET_KEY`
- this will delete schedules for all tests in the bucket specified
- a file named `restore-YOUR_BUCKET_KEY-DATESTAMP.json` will be created for use when you resume your tests (see below for use)

### Resuming paused tests

- `node runscopeMaintenance.js resume restore-YOUR_BUCKET_KEY-DATESTAMP.json`
- this will schedule all "paused" tests to begin running again
- **IMPORTANT WARNING**: in the unlikely event you have the same test running at two different intervals with the same environment only one instance will be restored. You wil need to restore the other instance through the UI




## To Do
- allow running multiple buckets
