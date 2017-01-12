//index.js
//Created by Aaron C Gaudette on 10.01.17

"use_strict";

//Server
const dgram = require('dgram');
//Protocol
const fs = require('fs');
const protobuf = require('protocol-buffers');
const protocol = protobuf(fs.readFileSync('deprecated.proto'));
//Events
const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;

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

   var packetsSent = [0,0], packetsReceived = [0,0];

   //Initialize
   var udp = dgram.createSocket('udp4');
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
         this.Send(buffer);
         if(web)this.SendToWeb(this.Decode(buffer));

         //Update events
         this.emit('update',protocol.Update.decode(buffer));
         this.emit('update-raw',buffer,info);
         packetsReceived[0]++;
      });
   }

   //Emit updates
   this.Send = (buffer) => {
      if(!emitter)return;

      udp.send(buffer,0,buffer.length,
         multicastPort,multicastAddress,
         (error,bytes) => {if(error)throw error;}
      );
      packetsSent[0]++;
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
               this.SendToWeb(json); //Route
               //Feed web data into the normal stream
               this.Send(this.Encode(json));
               //Update event
               this.emit('update-web',json);
               packetsReceived[1]++;
            });
         });
      }

      //Emit updates to web
      this.SendToWeb = (json) => {
         if(!emitter)return;
         io.emit('update',json);
         packetsSent[1]++;
      };
   }

   //Metrics (PPS)
   setInterval(() => {
      this.emit('tick',packetsSent,packetsReceived);
      packetsSent = [0,0]; packetsReceived = [0,0];
   },1000);
};
inherits(Holojam,EventEmitter);

//Protocol <-> JSON conversion
Holojam.prototype.Encode = (data) => {
   return protocol.Update.encode(data);
};
Holojam.prototype.Decode = (buffer) => {
   return protocol.Update.decode(buffer);
};
