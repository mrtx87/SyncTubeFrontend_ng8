import { User } from './sync-tube/user';

export class ToastrMessage {
    index: number;
    type: string;
    raumId:string;

    message: string;
    origin: string;
    target: string;

    createdAt: Date;
    onlyLogging:boolean;

    constructor(    index: number,type: string,raumId:string,message: string,origin: string, target: string,createdAt: Date, onlyLogging:boolean) {

        this.raumId = raumId;
        this.index = index;
        this.type = type;
        this.message = message;
        this.createdAt  = createdAt;
        this.onlyLogging = onlyLogging;
        this.origin = origin;
        this.target = target;

    }

}