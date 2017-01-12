# holojam-node
Enables rapid, straightforward networking with the Holojam virtual reality platform

```
npm install holojam-node --save
```
Requires the provided protocol descriptor `deprecated.proto` in the execution directory

### Usage:
```javascript
const holojam = require('holojam-node')(['full','web']);

var json = ...
holojam.Send(json);

holojam.on('update',(json) => {
  console.log(json);
});
```
Set up partial servers with `'emitter'` (send-only) or `'sink'` (receive-only). Omit `'web'` to disable the web relay.

## Advanced:
Additional functions:

`SendRaw(buffer)`, `SendToWeb(json)`, `Encode(json)`, `Decode(buffer)`

Additional events:

`'update-raw',(buffer,info)`, `'update-web',(json)`, `'tick',(packetsSent,packetsReceived)`

Full constructor:
```javascript
(mode = ['full','web'],                                                   
serverAddress = '0.0.0.0', serverPort = 9592,                           
multicastAddress = '239.0.2.4', multicastPort = 9591,                         
webPort = 9593)
```
