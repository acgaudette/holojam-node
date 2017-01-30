# holojam-node
Enables rapid, straightforward networking with the Holojam virtual reality platform

```
npm install holojam-node --save
```

### Bare Minimum:
To set up a working server in one line, just do

```javascript
const holojam = require('holojam-node')(['full']);
```

Create partial servers with `'emitter'` (send-only) or `'sink'` (receive-only). Pass in `'web'` to enable the web relay (socket.io, JSON).

### Usage:
```javascript
var flakes = [{
   label: 'my-flake-0',
   ...
},{
   label: 'my-flake-1',
   ...
}]
holojam.Send(holojam.BuildUpdate('my-app',flakes));

var flake = {
   label: 'my-event',
   ...
}
holojam.Send(holojam.BuildEvent('my-app',flake));

holojam.on('update',(json) => {
  console.log(json);
});

holojam.on('my-event',(flake,scope,origin) => {
   console.log(flake);
});
```

## Advanced:
Additional functions:

`SendRaw(buffer)`, `SendToWeb(json)`, `Encode(json)`, `Decode(buffer)`

Additional (node) events:

`'update-raw',(buffer,info)`, `'update-web',(json)`

As shown above, Holojam events and notifications are converted to node events for ease of use.

Build packets to send (in Holojam-ese) with `BuildUpdate(scope,flakes)`, `BuildEvent(scope,flake)`, and `BuildNotification(scope,label)`. Flakes are passed in as js objects and follow the Holojam format. The scope is a string, similar to a namespace.

Read metrics with the `'tick'` event, which fires every second: packets sent, packets received, bytes sent, bytes received (all per second), average packet size (bytes), events per second.

Full constructor with defaults:

```javascript
const holojam = require('holojam-node')(['full','web'],'0.0.0.0',9592,'239.0.2.4',9591,9593);
```
(Mode, server address, server port, UDP multicast address, multicast port, web port)
