import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app)
const io = new Server(server);

app.use(express.json());
app.use(cors({
    origin : "*"
}));



io.on("connection", (socket)=>{
    console.log("user connected", socket.id);
})

server.listen(5000, ()=>{
    console.log("App is listening on port 5000");
})
