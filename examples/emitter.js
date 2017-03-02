const holojam = require('holojam-node')(['emitter']);

// Send an update every 256 ms
setInterval(() => {
  holojam.Send(holojam.BuildUpdate('example', [
    {
      label: 'my-flake-0',
      vector3s: [ // Two vector3s
        {x:0, y:1, z:2},
        {x:3, y:4, z:5}
      ],
      vector4s: [ // One vector4
        {x:6, y:7, z:8, w:9}
      ],
      floats: [10.11, 12.13], // Two floats
    },{
      label: 'my-flake-1',
      ints: [14], // One int
      bytes: [0, 255], // Two unsigned bytes
      text: 'some text' // A string
    }
  ]));
}, 256);

// Send an event every second
setInterval(() => {
  holojam.Send(holojam.BuildEvent('example', {
    label: 'my-event', text: 'some event data'
  }));
}, 1000);
