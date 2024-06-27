export class User {

    public socketId : string;
    public username : string;
    public micStatus : 'ON'|'OFF';
    public videoStatus : 'ON'|'OFF';

    constructor(socketId: string, username:string) {
        this.socketId = socketId;
        this.username = username;
        this.micStatus = 'ON';
        this.videoStatus = 'OFF';
    }

}