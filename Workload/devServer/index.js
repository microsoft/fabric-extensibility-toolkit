/**
 * DevServer APIs index file
 * Exports all API routers for the dev server
 */

const manifestApi = require('./manifestApi');

/**
 * Register all dev server APIs with an Express application
 * @param {object} app Express application
 */
function registerDevServerApis(app) {
  console.log('*** Mounting Manifest API ***');
  app.use('/', manifestApi);
}

function registerDevServerComponents() {
  console.log("*********************************************************************");
  console.log('***                Mounting Dev Server Components                ***');

  // Log playground availability
  console.log('\x1b[32m🎮 Following playgrounds are enabled in development mode:\x1b[0m'); // Green
  const workloadName = process.env.WORKLOAD_NAME || 'unknown-workload';
  console.log(`\x1b[32m🌐 Client-SDK Playground:\x1b[0m \x1b[34mhttps://app.fabric.microsoft.com/workloads/${workloadName}/playground-client-sdk\x1b[0m`); // Blue
  console.log(`\x1b[32m🌐 Data Playground:\x1b[0m \x1b[34mhttps://app.fabric.microsoft.com/workloads/${workloadName}/playground-data\x1b[0m`); // Blue
  console.log("*********************************************************************");
}

module.exports = {
  manifestApi,
  registerDevServerApis,
  registerDevServerComponents
};
