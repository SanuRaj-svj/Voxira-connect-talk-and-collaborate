import {Server} from 'socket.io';
let connections={};
let messages={};
let timeOnline={};
let roomHosts={};

export const connectToSocket=(server)=>{
  const io=new Server(server, {
    cors: {
    origin:"*",
    methods:["GET","POST"],
    allowedHeaders:["*"],
    credentials:true
    }
  });

  io.on("connection",(socket)=>{
    console.log("socket connected")
    socket.on("join-call",(payload)=>{
      const room = typeof payload === 'object' && payload !== null ? payload.room : payload;
      const isHost = typeof payload === 'object' && payload !== null ? Boolean(payload.isHost) : false;

      if (!room) {
        return;
      }

      if(connections[room]===undefined){
        connections[room]=[];
      }

      if(!connections[room].includes(socket.id)){
        connections[room].push(socket.id);
      }

      if (isHost) {
        roomHosts[room] = socket.id;
      }

      timeOnline[socket.id]=new Date();
      const currentHost = roomHosts[room] || null;
      for(let a=0;a<connections[room].length;a++){
        io.to(connections[room][a]).emit("user-joined", socket.id, connections[room], currentHost);
      }
      io.to(socket.id).emit("room-state", { room, hostSocketId: roomHosts[room] || null, roomMembers: connections[room] });
      if(messages[room]!==undefined){
        for(let b=0;b<messages[room].length;b++){
          io.to(socket.id).emit("chat-message",messages[room][b]['data'],messages[room][b]['sender'],messages[room][b]['socket-id-sender']);
        }
      }
    })
    socket.on("signal",(payload, legacyMessage)=>{
      const toId = typeof payload === 'object' && payload !== null ? payload.to : payload;
      const signal = typeof payload === 'object' && payload !== null ? payload.signal : legacyMessage;

      if (!toId || !signal) {
        return;
      }

      io.to(toId).emit("signal", {
        from: socket.id,
        signal
      });
    })
    socket.on("chat-message",(data,sender)=>{
      const[matchingRoom,found]=Object.entries(connections).reduce(([room,isFound],[roomKey,roomValue])=>{
        if(!isFound && roomValue.includes(socket.id)){
          return [roomKey,true];
        }
        return [room,isFound];
      },['',false]);
      if(found==true){
        if(messages[matchingRoom]===undefined){
          messages[matchingRoom]=[];
        }
        messages[matchingRoom].push({'sender':sender,'data':data,'socket-id-sender':socket.id});
        console.log("message",matchingRoom,":",sender,data);
        connections[matchingRoom].forEach((elem)=>{
          io.to(elem).emit("chat-message",data,sender,socket.id)
        })

      }

    })
    socket.on("code-update", ({ room, code }) => {
      if (!room || typeof code !== 'string') return;
      const roomMembers = connections[room] || [];
      roomMembers.forEach((memberId) => {
        if (memberId === socket.id) return;
        io.to(memberId).emit('code-update', { code, from: socket.id });
      });
    });

    socket.on("whiteboard-update", ({ room, stroke }) => {
      if (!room || !stroke) return;
      const roomMembers = connections[room] || [];
      roomMembers.forEach((memberId) => {
        if (memberId === socket.id) return;
        io.to(memberId).emit('whiteboard-update', { stroke, from: socket.id });
      });
    });
    socket.on("media-state-change",({ room, mediaType, enabled, target })=>{
      if (!room || !mediaType || typeof enabled !== 'boolean') {
        return;
      }

      const roomMembers = connections[room] || [];
      const canControlRoom = roomHosts[room] === socket.id;
      const targetSocketId = target || socket.id;

      if (!canControlRoom && targetSocketId !== socket.id) {
        return;
      }

      if (target === 'all') {
        if (!canControlRoom) {
          return;
        }

        roomMembers.forEach((memberId) => {
          if (memberId === socket.id) {
            return;
          }

          io.to(memberId).emit('media-state-change', {
            room,
            mediaType,
            enabled,
            target: 'all',
            controlledBy: socket.id,
          });
        });
        return;
      }

      if (!roomMembers.includes(targetSocketId)) {
        return;
      }

      io.to(targetSocketId).emit('media-state-change', {
        room,
        mediaType,
        enabled,
        target: targetSocketId,
        controlledBy: socket.id,
      });
    })
    socket.on("host-end-meeting", ({ room }) => {
      if (!room || roomHosts[room] !== socket.id) {
        return;
      }

      const roomMembers = connections[room] || [];
      delete roomHosts[room];
      delete connections[room];
      delete messages[room];

      roomMembers.forEach((memberId) => {
        io.to(memberId).emit('meeting-ended', { reason: 'host-ended' });
      });
    });
    socket.on("disconnect",()=>{
      let endedRoom = null;

      for (const [room, roomMembers] of Object.entries(connections)) {
        if (!roomMembers.includes(socket.id)) {
          continue;
        }

        endedRoom = room;
        const remainingMembers = roomMembers.filter((memberId) => memberId !== socket.id);

        if (roomHosts[room] === socket.id) {
          const peersToEnd = [...remainingMembers];
          delete roomHosts[room];
          delete connections[room];
          delete messages[room];

          peersToEnd.forEach((peerId) => {
            io.to(peerId).emit("meeting-ended", {
              reason: "host-left"
            });
            const peerSocket = io.sockets.sockets.get(peerId);
            if (peerSocket) {
              peerSocket.disconnect(true);
            }
          });
          return;
        }

        connections[room] = remainingMembers;
        if (remainingMembers.length === 0) {
          delete connections[room];
          delete messages[room];
        }
        break;
      }

      if (endedRoom && roomHosts[endedRoom] === undefined) {
        delete connections[endedRoom];
        delete messages[endedRoom];
      }
    })
  })
   return io;
}