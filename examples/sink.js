const holojam = require('holojam-node')(['sink']);

holojam.on('my-event', (flake, scope, origin) => {
  console.log('Received ' + scope + '.my-event from ' + origin + ':');
  console.log('  ' + flake.text);
});

holojam.on('my-notification', (flake, scope, origin) => {
  console.log('Received ' + scope + '.my-notification from ' + origin);
});
