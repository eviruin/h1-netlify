const fs = require('fs');

exports.handler = async (event, context) => {
  const paths = [
    '/etc/hostname',
    '/var/task',
    '/proc/self/environ',
    '/tmp'
  ];

  const fileDetails = {};
  paths.forEach(p => {
    try {
      fileDetails[p] = fs.readdirSync(p);
    } catch (e) {
      try {
        fileDetails[p] = fs.readFileSync(p, 'utf8').substring(0, 50);
      } catch (err) {
        fileDetails[p] = `Error: ${err.message}`;
      }
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ 
        msg: "Diving deeper...", 
        files: fileDetails,
        uid: process.getuid(),
        gid: process.getgid()
    })
  };
};
