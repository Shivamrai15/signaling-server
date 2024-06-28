import { Server, Socket } from "socket.io";
import { User } from "./user-manager";
import {
    ACTION,
    JOINROOM,
    MESSAGE,
    MUTE,
    REMOVEPEER,
    UNMUTE,
    USERCOUNT,
    VIDEOOFF,
    VIDEOON
} from "../events/event";
import { DefaultEventsMap } from "socket.io/dist/typed-events";


export class RoomManager{

    private rooms: { [key: string]: string[] } = {};
    private users: { [key: string]: User } = {};

    constructor () {
        this.rooms = {};
        this.users = {};
    }

    joinRoom(socket: Socket, roomId: string, username: string, io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
        
        socket.join(roomId);
        const user = new User(socket.id, username);
        this.users[socket.id] = user;

        if ( this.rooms[roomId] && this.rooms[roomId].length > 0 ) {
            this.rooms[roomId].push(socket.id);
            socket.to(roomId).emit(MESSAGE, `${username} joined the meeting`);
            
            const remainingUsers = this.rooms[roomId].filter((userId)=>userId!=socket.id).map(userId=>this.users[userId]);
            io.to(socket.id).emit(JOINROOM, remainingUsers, this.users);
        } else {
            this.rooms[roomId] = [socket.id];
            io.to(socket.id).emit(JOINROOM, null, null);
        }

        io.to(roomId).emit(USERCOUNT, this.rooms[roomId].length);

    }

    userActions ( socket : Socket, payload : string ) { 
        const user = this.users[socket.id];
        if ( !user ) return;

        if ( payload === MUTE ) user.micStatus = "OFF";
        else if ( payload === UNMUTE ) user.micStatus = "ON";
        else if ( payload === VIDEOON ) user.videoStatus = "ON";
        else if ( payload === VIDEOOFF ) user.videoStatus = "OFF";

        socket.to(this.getRoom(socket.id)).emit(ACTION, payload, socket.id);
    }

    disconnect( socket: Socket, io : Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>  ) {
        const user = this.users[socket.id];
        if ( !user ) return;

        const roomId = this.getRoom(socket.id);
        if ( !roomId ) return;

        socket.to(roomId).emit(MESSAGE, `${user.username} left the chat.`);
        socket.to(roomId).emit(REMOVEPEER , socket.id);

        const roomUsers = this.rooms[roomId];
        if (roomUsers) {
            const index = roomUsers.indexOf(socket.id);
            if (index !== -1) roomUsers.splice(index, 1);

            io.to(USERCOUNT).emit(USERCOUNT, roomUsers.length);
        }

        delete this.users[socket.id];

    }

    getRoom(socketId: string) {
        for (const [roomid, users] of Object.entries(this.rooms)) {
            if (users.includes(socketId)) {
                return roomid;
            }
        }
        return "";
    }

    getUser( socketId : string ) {
        return this.users[socketId]
    }
} 