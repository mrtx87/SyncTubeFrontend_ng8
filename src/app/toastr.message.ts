import { User } from './sync-tube/user';

export class ToastrMessage {
    type: string;
    raumId: string;
    message: string;
    origin: string;
    target: string;

    createdAt: Date;
    onlyLogging: boolean;
    toastrType: string;


    constructor(type: string, raumId: string, origin: string, target: string, createdAt: Date, onlyLogging: boolean, toastrType: string, message?: string) {
        this.raumId = raumId;
        this.type = type;
        this.createdAt = createdAt;
        this.onlyLogging = onlyLogging;
        this.origin = origin;
        this.target = target;
        this.toastrType = toastrType;
        this.message = message;
    }

}