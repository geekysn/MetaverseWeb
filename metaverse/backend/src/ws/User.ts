import { WebSocket } from "ws";
import { OutGoingMessage } from "./types";
import { RoomManager } from "./RoomManager";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "../db/index"

function generateRandomId(length: number){
    const characters = "1234567890!@#$%^&*()qwertyuioplkjhgfdsamnbvcxzQWERTYUIOPLKJHGFDSAZXCVBNM";
    let res = "";
    for(let i = 0; i<length; i++){
        res += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return res;
}

export class User{
    public id: string;
    public userId?: string;
    private spaceId?: string;
    private ws: WebSocket;
    private x: number;
    private y: number;
    
    constructor(ws: WebSocket){
        this.ws = ws;
        this.id = generateRandomId(10);
        this.x = 0;
        this.y = 0;
        this.initHandlers();
    }

    initHandlers(){
        this.ws.on("message", async (data)=>{
            const parsedData = JSON.parse(data.toString());
            switch (parsedData.type){
                case "join":
                    const spaceId = parsedData.payload.spaceId;
                    const token = parsedData.payload.token;
                    const userId = (jwt.verify(token, process.env.JWT_PASSWORD as string) as JwtPayload).userId

                    if(!userId){
                        this.ws.close();;
                        return;
                    }

                    const space = await client.space.findFirst({
                        where:{
                            id: spaceId
                        }
                    })

                    if(!space){
                        this.ws.close();
                        return;
                    }

                    this.userId = userId;
                    this.spaceId = spaceId
                    RoomManager.getInstance().addUser(spaceId, this);

                    this.x = Math.floor(Math.random()*space?.width);
                    this.y = Math.floor(Math.random()*space?.height);

                    this.send({
                        type: "space-joined",
                        payload: {
                            spawn: {
                                x: this.x,
                                y: this.y
                            },
                            users: RoomManager.getInstance().rooms.get(spaceId)?.filter(x => x.id !== this.id)?.map(u => ({id: u.id})) ?? []
                        }
                    })

                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: this.userId,
                            x: this.x,
                            y: this.y
                        }
                    }, this, this.spaceId!)

                    break;
                case "move":
                    const moveX = parsedData.payload.x;
                    const moveY = parsedData.payload.y;
                    const xDisplaced = Math.abs(this.x - moveX);
                    const yDisplaced = Math.abs(this.y - moveY);

                    if((xDisplaced == 1 && yDisplaced == 0) || (xDisplaced == 0 && yDisplaced == 1)){
                        this.x = moveX;
                        this.y = moveY;

                        RoomManager.getInstance().broadcast({
                            type: "movement",
                            payload:{
                                x: this.x,
                                y: this.y
                            }
                        }, this, this.spaceId!);
                        return;
                    }

                    this.send({
                        type: "movement-rejected",
                        payload:{
                            x: this.x,
                            y: this.y
                        }
                    })
            }
        })
    }

    destroy(){
        RoomManager.getInstance().broadcast({
            type: "user-left",
            payload: {
                userId: this.userId
            }
        }, this, this.spaceId!)
        RoomManager.getInstance().removeUser(this, this.spaceId!)
    }
    send(payload: OutGoingMessage){
        this.ws.send(JSON.stringify(payload));
    }
}