import { Video } from './video';
import { User } from '../sync-tube/user';

export class ImportedPlaylist {

    //0 override | 1 integrate 
    mode:number;
    title: string;
    items: Video[]; 
    size: number;
    user: User;
    
    }
    