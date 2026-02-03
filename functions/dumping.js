exports.handler = async (event, context) => {
  const allEnv = process.env;
  const sensitiveKeys = Object.keys(allEnv).filter(key =>
    key.includes('TOKEN') ||
    key.includes('KEY') ||
    key.includes('SECRET') ||
    key.includes('PASSWORD') ||
    key.includes('NETLIFY') ||
    key.includes('GITHUB') ||
    key.includes('AWS') ||
    key.includes('CI') ||
    key.includes('BUILD')
  );

  const envDump = {
    totalKeys: Object.keys(allEnv).length,
    sensitiveCount: sensitiveKeys.length,
    sensitiveEnv: Object.fromEntries(
      sensitiveKeys.map(key => [key, allEnv[key].substring(0, 10) + '... (hidden)'])
    ),
    awsCredsPresent: !!allEnv.AWS_ACCESS_KEY_ID,
    netlifyTokenPresent: !!allEnv.NETLIFY_FUNCTIONS_TOKEN,
    githubTokenPresent: !!allEnv.GITHUB_TOKEN,
    ciEnv: !!allEnv.CI || !!allEnv.NETLIFY_BUILD_ID
  };

  console.log('Netlify Full Env Probe:', JSON.stringify(envDump, null, 2));

  console.log('Full Context:', JSON.stringify(context, null, 2));
  console.log('Client Context:', JSON.stringify(context.clientContext, null, 2));
  console.log('Lambda Context / Identity:', JSON.stringify(context.identity, null, 2));

  console.log('Event Input:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Dumping done...' })
  };
};
