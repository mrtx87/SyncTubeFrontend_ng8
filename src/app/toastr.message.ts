export class ToastrMessage {
    index: number;
    type: string;
    message: string;
    raumId: string;

    constructor(index: number, type: string, message: string, raumId: string) {

        this.raumId = raumId;
        this.index = index;
        this.type = type;
        this.message = message;

    }

}