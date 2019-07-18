import { Raum } from "./raum";
import { ChatMessage } from "./chat-message";
import { User } from "./sync-tube/user";
import { Video } from "./video/video";

export class Message {

    type: String;
    user: User;
    raumId: number;
    
    video: Video;
    playerState: number;
    chatMessage: ChatMessage;
    chatMessages: ChatMessage[];
    users: User[];
    raumStatus : Boolean;
    publicRaeume: Raum[];
    assignedUser: User;

    playlistVideo : Video;
    loop: number; //0 noloop, 1 loop all, 2 loop single video
    randomOrder: boolean; //false sequentiell, true random

    currentPlaybackRate: number; 

    raumDescription:string;
    raumTitle: string;

}