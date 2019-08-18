export class Language {

    key: string;
    iconUrl: string;
    name?: string;

    constructor(key: string, iconUrl: string, name?: string) {
        this.key = key;
        this.iconUrl = iconUrl;
        this.name = name;
    }

    
}