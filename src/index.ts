import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomManager } from "./managers/room-manger";
import { ACTION, ANSWER, ICE, JOINROOM, MESSAGE, OFFER } from "./events/event";


const PORT = process.env.PORT || 8000;


const app = express();
const server = http.createServer(app)
const io = new Server(server, {
    cors : {
        origin: ["http://localhost:3000", process.env.ORIGIN!],
        methods : ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000", process.env.ORIGIN!],
    methods : ["GET", "POST"]
}));


const roomManager = new RoomManager()

io.on("connection", (socket)=>{

    socket.on(JOINROOM, ( payload )=> {
        const { roomId, username } : { roomId:string, username:string } = payload;
        roomManager.joinRoom(socket, roomId, username, io);
    });

    socket.on(ACTION, ( payload:string )=>{
        roomManager.userActions(socket, payload);
    });

    socket.on(OFFER, (offer: any, socketId : string)=>{
        const user = roomManager.getUser(socket.id)
        const payload = {
            socketId : socket.id,
            username : user.username,
            micStatus : user.micStatus,
            videoStatus : user.videoStatus
        }
        socket.to(socketId).emit(OFFER, offer, payload);
    });

    socket.on(ANSWER, (answer: any, socketId: string) => {
        socket.to(socketId).emit(ANSWER, answer, socket.id);
    });

    socket.on(ICE, ( candidate:any, socketId: string )=>{
        socket.to(socketId).emit(ICE, candidate, socket.id);
    });

    socket.on(MESSAGE, ( payload : { message:string, username:string, roomId:string })=> {
        io.to(payload.roomId).emit(MESSAGE, {
            "message" : payload.message,
            "username" : payload.username
        });
    });

    socket.on('disconnect', ()=>{
        roomManager.disconnect(socket, io);
    })

});


server.listen(PORT, ()=>{
    console.log(`App is listening on port ${PORT}`);
});