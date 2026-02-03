const fs = require('fs');
const dns = require('dns').promises;

exports.handler = async (event, context) => {
  const disclosure = {};

  // 1. DNS Leak Test
  try {
    const internalHosts = [
      'metadata.google.internal',
      'kubernetes.default.svc',
      'localhost',
      'internal-api.netlify.com'
    ];
    disclosure.dns_lookup = {};
    for (const host of internalHosts) {
      try {
        disclosure.dns_lookup[host] = await dns.lookup(host);
      } catch (e) {
        disclosure.dns_lookup[host] = "Not Found";
      }
    }
  } catch (e) { disclosure.dns_error = e.message; }

  // 2. Mount Points
  try {
    disclosure.mounts = fs.readFileSync('/proc/mounts', 'utf8').split('\n').filter(m => m.includes('/tmp') || m.includes('/var/task'));
  } catch (e) { disclosure.mounts = e.message; }

  // 3. Checkk Limit Resource
  try {
    disclosure.mem_info = fs.readFileSync('/proc/meminfo', 'utf8').split('\n').slice(0, 5);
    disclosure.cpu_info = fs.readFileSync('/proc/cpuinfo', 'utf8').split('\n').slice(0, 5);
  } catch (e) { disclosure.specs_error = e.message; }

  // 4. Data Injection
  disclosure.raw_headers = event.headers;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Information Disclosure Probe",
      results: disclosure
    }, null, 2)
  };
};
