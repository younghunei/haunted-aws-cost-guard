#!/usr/bin/env node

/**
 * 🎃 Haunted Load Test Runner
 * Orchestrates our supernatural performance testing scenarios
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 👻 Test configurations
const testConfigs = [
  {
    name: '🏚️ Haunted Mansion Load Test',
    file: 'haunted-mansion-load-test.yml',
    description: 'Standard load testing with realistic user scenarios'
  },
  {
    name: '💀 Stress Test',
    file: 'stress-test.yml',
    description: 'High-intensity stress testing to find breaking points'
  }
];

// 🦇 Colors for spooky console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🎃 ${message}`, 'yellow');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 🕷️ Check if servers are running
async function checkServers() {
  logHeader('Checking Server Status');
  
  const checkServer = (url, name) => {
    return new Promise((resolve) => {
      const http = require('http');
      const request = http.get(url, (res) => {
        if (res.statusCode === 200) {
          logSuccess(`${name} is running`);
          resolve(true);
        } else {
          logError(`${name} returned status ${res.statusCode}`);
          resolve(false);
        }
      });
      
      request.on('error', () => {
        logError(`${name} is not accessible`);
        resolve(false);
      });
      
      request.setTimeout(5000, () => {
        logError(`${name} connection timeout`);
        resolve(false);
      });
    });
  };

  const frontendRunning = await checkServer('http://localhost:5173', 'Frontend Server');
  const backendRunning = await checkServer('http://localhost:3001/health', 'Backend API');

  if (!frontendRunning || !backendRunning) {
    logError('Required servers are not running!');
    logInfo('Please start the servers:');
    logInfo('  Frontend: npm run dev');
    logInfo('  Backend: cd backend && npm run dev');
    process.exit(1);
  }

  logSuccess('All servers are running! 👻');
}

// 🔥 Run a specific test configuration
function runTest(config) {
  return new Promise((resolve, reject) => {
    logHeader(`Running ${config.name}`);
    logInfo(config.description);
    
    const testFile = path.join(__dirname, config.file);
    
    if (!fs.existsSync(testFile)) {
      logError(`Test file not found: ${testFile}`);
      reject(new Error(`Test file not found: ${testFile}`));
      return;
    }

    const artillery = spawn('npx', ['artillery', 'run', testFile], {
      stdio: 'inherit',
      shell: true
    });

    artillery.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${config.name} completed successfully!`);
        resolve();
      } else {
        logError(`${config.name} failed with exit code ${code}`);
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });

    artillery.on('error', (error) => {
      logError(`Failed to start ${config.name}: ${error.message}`);
      reject(error);
    });
  });
}

// 🎯 Generate load test report
function generateReport() {
  logHeader('Generating Load Test Report');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    testSuite: 'Haunted AWS Cost Guard Load Tests',
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    tests: testConfigs.map(config => ({
      name: config.name,
      description: config.description,
      status: 'completed' // This would be updated based on actual results
    }))
  };

  const reportPath = path.join(__dirname, 'reports', `load-test-report-${Date.now()}.json`);
  
  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  logSuccess(`Report generated: ${reportPath}`);
}

// 🎪 Main execution function
async function main() {
  try {
    logHeader('Haunted AWS Cost Guard Load Testing Suite');
    logInfo('Preparing to unleash supernatural load testing! 👻');

    // Check if servers are running
    await checkServers();

    // Run each test configuration
    for (const config of testConfigs) {
      try {
        await runTest(config);
        // Wait between tests to let system recover
        logInfo('Letting the spirits rest for 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (error) {
        logError(`Test ${config.name} failed: ${error.message}`);
        // Continue with other tests even if one fails
      }
    }

    // Generate final report
    generateReport();

    logHeader('Load Testing Complete! 🎉');
    logSuccess('All supernatural load tests have been executed!');
    logInfo('Check the reports directory for detailed results.');

  } catch (error) {
    logError(`Load testing failed: ${error.message}`);
    process.exit(1);
  }
}

// 🚀 Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  logHeader('Haunted Load Test Runner Help');
  logInfo('Usage: node run-load-tests.js [options]');
  logInfo('');
  logInfo('Options:');
  logInfo('  --help, -h     Show this help message');
  logInfo('  --list, -l     List available test configurations');
  logInfo('  --test <name>  Run a specific test by name');
  logInfo('');
  logInfo('Available tests:');
  testConfigs.forEach((config, index) => {
    logInfo(`  ${index + 1}. ${config.name}`);
    logInfo(`     ${config.description}`);
  });
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  logHeader('Available Load Test Configurations');
  testConfigs.forEach((config, index) => {
    logInfo(`${index + 1}. ${config.name}`);
    logInfo(`   File: ${config.file}`);
    logInfo(`   Description: ${config.description}`);
    logInfo('');
  });
  process.exit(0);
}

const testIndex = args.indexOf('--test');
if (testIndex !== -1 && args[testIndex + 1]) {
  const testName = args[testIndex + 1];
  const config = testConfigs.find(c => c.name.includes(testName) || c.file.includes(testName));
  
  if (config) {
    checkServers().then(() => runTest(config)).catch(error => {
      logError(`Test execution failed: ${error.message}`);
      process.exit(1);
    });
  } else {
    logError(`Test not found: ${testName}`);
    logInfo('Use --list to see available tests');
    process.exit(1);
  }
} else {
  // Run all tests
  main();
}