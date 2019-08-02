import { Raum } from "./raum";
import { User } from "./sync-tube/user";
import { Video } from "./video/video";

export class ChatMessage {
    type:String;
    isPrivate: Boolean;
    user: User;    
    raumId: string;
    timestamp: number;
    messageText: String;
    video: Video;

}