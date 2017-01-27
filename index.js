//index.js
//Created by Aaron C Gaudette on 10.01.17

"use_strict";

//Server
const dgram = require('dgram');
const os = require('os');
const sizeof = require('object-sizeof');
//Protocol
const fs = require('fs');
const flatbuffers = require('flatbuffers');
const protocol = flatbuffers.compileSchema(
   fs.readFileSync('node_modules/holojam-node/holojam.bfbs')
);
//Events
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;

//Entry
module.exports = (
   mode = ['full','web'],
   serverAddress = '0.0.0.0', serverPort = 9592,
   multicastAddress = '239.0.2.4', multicastPort = 9591,
   webPort = 9593
) => {return new Holojam(
   mode,serverAddress,serverPort,multicastAddress,multicastPort,webPort
);};

var Holojam = function(
   mode,serverAddress,serverPort,multicastAddress,multicastPort,webPort
){
   const emitter = mode.includes('full') || mode.includes('emitter');
   const sink = mode.includes('full') || mode.includes('sink');
   const web = mode.includes('web');

   let packetsSent = [0,0], packetsReceived = [0,0];
   let bytesSent = [0,0], bytesReceived = [0,0];
   let events = 0;

   //Initialize
   const udp = dgram.createSocket('udp4');
   if(sink)udp.bind(serverPort,serverAddress);
   EventEmitter.call(this);

   if(!emitter && !sink)
      throw new Error('Invalid mode passed to constructor!'
         + ' (Try \'full\', \'emitter\', or \'sink\')');

   console.log('Holojam: Initialized,',
      (emitter && sink)? 'full server':
      emitter? 'emitter':'sink',
      web? '(with web relay)':'(without web relay)'
   );

   if(emitter)
      console.log('Holojam: Server on',serverAddress + ':' + serverPort);

   //Listen
   udp.on('listening',() => {
      if(sink)console.log('Holojam: Listening on',
         multicastAddress + ':' + multicastPort);
   });
   udp.on('error',(error) => {
      console.log('Holojam:');
      console.log(error);
      udp.close();
   });

   if(sink){
      udp.on('message',(buffer,info) => {
         //Route
         let data = this.SendRaw(buffer);

         //Update events
         this.emit('update',data);
         this.emit('update-raw',buffer,info);

         //Holojam events
         if(data.type=='Event'){
            this.emit(data.flakes[0].label,data.flakes[0]);
            events++;
         }

         packetsReceived[0]++;
         bytesReceived[0] += buffer.length;
      });
   }

   //Emit updates
   const Emit = (json,buffer) => {
      if(!emitter)return;

      udp.send(buffer,0,buffer.length,
         multicastPort,multicastAddress,
         (error,bytes) => {if(error)throw error;}
      );
      if(web)this.SendToWeb(json);

      packetsSent[0]++;
      bytesSent[0] += buffer.length;
   }
   this.Send = function(json){
      let buffer = this.Encode(json);
      Emit(json,buffer);
      return buffer;
   };
   this.SendRaw = function(buffer){
      let json = this.Decode(buffer);
      Emit(json,buffer);
      return json;
   };

   //Web
   if(web){
      const io = require('socket.io')();
      io.listen(webPort,(error) => {if(error){
         console.log('Holojam:');
         console.log(error);
      }});
      console.log('Holojam: Web server on *:' + webPort);

      if(sink){
         io.on('connection',(client) => {
            //Listen for packets back from the web
            client.on('relay',(json) => {
               //Feed web data into the normal stream
               this.Send(json);
               //Update event
               this.emit('update-web',json);

               packetsReceived[1]++;
               bytesReceived[1] += sizeof(json);
            });
         });
      }

      //Emit updates to web
      this.SendToWeb = function(json){
         if(!emitter)return;
         io.emit('update',json);

         packetsSent[1]++;
         bytesSent[1] += sizeof(json);
      };
   }

   //Protocol

   const BuildPacket = function(scope,type,flakes){
      return {
         scope: scope, origin: os.userInfo()['username'] + '@' + os.hostname(),
         type: type, flakes: flakes
      };
   }

   this.BuildUpdate = (scope = 'Node', flakes) =>
      BuildPacket(scope,'Update',flakes);

   this.BuildEvent = (scope = 'Node', flake) =>
      BuildPacket(scope,'Event',[flake]);
   this.BuildNotification = (scope = 'Node', label = 'Notification') =>
      BuildPacket(scope,'Event',[{label: label}]);

   //Metrics
   setInterval(() => {
      this.emit('tick',
         packetsSent,packetsReceived,
         bytesSent,bytesReceived,
         [parseInt(
            (bytesSent[0]+bytesReceived[0])/(packetsSent[0]+packetsReceived[0])),
         parseInt(
            (bytesSent[1]+bytesReceived[1])/(packetsSent[1]+packetsReceived[1]))],
         events
      );
      packetsSent = [0,0]; packetsReceived = [0,0];
      bytesSent = [0,0]; bytesReceived = [0,0];
      events = 0;
   },1000);
};
inherits(Holojam,EventEmitter);

//Protocol <-> JSON conversion
Holojam.prototype.Encode = (json) => Buffer.from(protocol.generate(json));
Holojam.prototype.Decode = (buffer) => protocol.parse(buffer);
