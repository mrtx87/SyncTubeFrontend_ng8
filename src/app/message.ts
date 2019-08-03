import { Raum } from "./raum";
import { ChatMessage } from "./chat-message";
import { User } from "./sync-tube/user";
import { Video } from "./video/video";
import { ToastrMessageTypes } from './toastr.message.types';
import { ToastrMessage } from './toastr.message';

export class Message {

    type: String;
    user: User;
    raumId: string;
    
    video: Video;
    playerState: number;
    chatMessage: ChatMessage;
    chatMessages: ChatMessage[];
    users: User[];
    kickedUsers: User[];
    raumStatus : Boolean;
    publicRaeume: Raum[];
    assignedUser: User;
    toastrMessage: ToastrMessage;

    playlistVideo : Video;
    loop: number; //0 noloop, 1 loop all, 2 loop single video
    randomOrder: boolean; //false sequentiell, true random

    currentPlaybackRate: number; 

    raumDescription:string;
    raumTitle: string;

}