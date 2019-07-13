import { Raum } from "./raum";
import { ChatMessage } from "./chat-message";
import { User } from "./sync-tube/user";
import { Video } from "./video/video";
import { ImportedPlaylist } from './video/playlist';

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

    description:string;
    raumTitle: string;
    createdAt: string;

}