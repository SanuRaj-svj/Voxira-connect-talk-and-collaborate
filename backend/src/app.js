import express from 'express';
import {createServer} from "node:http";
import {Server} from "socket.io";
import mongoose from 'mongoose';
import {connectToSocket} from './controllers/socketManager.js';
import cors from 'cors';
import userRoutes from './Routes/users.routes.js';
const app=express();
const server=createServer(app);
const io=connectToSocket(server);
app.set("port",process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({limit:"50kb"}));
app.use(express.urlencoded({
  limit:"50kb",
  extended:true
}));
app.use('/api/v1/users',userRoutes);

app.get("/",(req,res)=>{
  res.send("Holo backend is running");
});

app.get("/home",(req,res)=>{
  res.send("Hello, World!");
});
const start=async()=>{
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await mongoose.connect(mongoUri);
  server.listen(app.get("port"),()=>{
    console.log(`server is running on port ${app.get("port")}`)
  })
};
start();