const { exec } = require("child_process");
const util = require("util");
const os = require("os");
const path = require("path");

const execAsync = util.promisify(exec);

// Update path to point to scripts from project root
const startDevGatewayScript = path.resolve(__dirname, "../../scripts/Run/StartDevGateway.ps1");

/**
 * Starts the Dev Gateway using the PowerShell script
 * @param {boolean} interactiveLogin - Whether to use interactive login (default: true)
 * @returns {Promise<void>}
 */
async function startDevGateway(interactiveLogin = true) {
  try {
    console.log("🚀 Starting Fabric Dev Gateway...");
    
    // Follow the same pattern as build-manifest.js
    var startDevGatewayCmd = "";
    const operatingSystem = os.platform();
    if (operatingSystem === 'win32') {
      startDevGatewayCmd = startDevGatewayScript;
    } else {
      startDevGatewayCmd = `pwsh ${startDevGatewayScript}`;
    }

    console.log(`🔧 Executing: pwsh ${startDevGatewayScript}`);
    
    // Execute the PowerShell script using pwsh (like build-manifest.js does)
    // Note: We don't use execAsync here because the Dev Gateway is a long-running process
    const childProcess = exec(`pwsh ${startDevGatewayScript}`);
    
    // Pipe the output to console in real-time
    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log("✅ Dev Gateway process completed successfully.");
      } else {
        console.error(`❌ Dev Gateway process exited with code ${code}`);
        process.exit(code);
      }
    });
    
    childProcess.on('error', (error) => {
      console.error(`❌ Error starting Dev Gateway: ${error.message}`);
      process.exit(1);
    });
    
    // Handle process termination gracefully
    process.on('SIGINT', () => {
      console.log("\n🛑 Received SIGINT, terminating Dev Gateway...");
      childProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log("\n🛑 Received SIGTERM, terminating Dev Gateway...");
      childProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error(`❌ Error starting Dev Gateway: ${error.message}`);
    process.exit(1);
  }
}

// Export the function for use in other modules
module.exports = {
  startDevGateway
};

// Execute when run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const interactiveLogin = !args.includes('--no-interactive');
  
  startDevGateway(interactiveLogin);
}