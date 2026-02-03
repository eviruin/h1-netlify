const dns = require('dns').promises;

exports.handler = async (event, context) => {
  const dnsResearch = {};
  
  const resolver = new dns.Resolver();
  resolver.setServers(['169.254.100.5']);

  const targets = [
    'compute.internal',
    'us-east-2.compute.internal',
    'netlify.internal',
    'internal.netlify.app',
    'database.internal'
  ];

  dnsResearch.discovery = {};

  for (const host of targets) {
    try {
      const addresses = await resolver.resolve4(host);
      dnsResearch.discovery[host] = addresses;
    } catch (e) {
      dnsResearch.discovery[host] = `Error: ${e.code}`;
    }
  }

  try {
    dnsResearch.reverse_gateway = await resolver.reverse('169.254.100.5');
  } catch (e) {
    dnsResearch.reverse_gateway = `Error: ${e.code}`;
  }

  console.log('--- DNS DEEP DIVE LOG ---');
  console.log(JSON.stringify(dnsResearch, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "DNS Internal Discovery",
      results: dnsResearch,
      note: "If any target returns an IP instead of ENOTFOUND, it's a valid Internal Disclosure."
    }, null, 2)
  };
};
