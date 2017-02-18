const holojam = require('holojam-node')(['emitter', 'sink']);

holojam.on('update', (flakes, scope, origin) => {
  console.log(
    'Update received with ' + flakes.length
      + ' ' + (flakes.length == 1 ? 'flake' : 'flakes') + ':'
  );

  flakes.forEach((flake) => {
    console.log('  ' + scope + '.' + flake.label);
    if(flake.bytes.length > 0)
      console.log('    ' + flake.bytes);
  });

  holojam.Send(holojam.BuildNotification('example.client', 'my-notification'));
});

