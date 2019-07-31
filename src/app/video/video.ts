export class Video {

    id: string;
    api:number;
    
    isPlaylistLink?: boolean;
    thumbnail?: string; 
    playlistId?: string;

    videoId: string;
    timestamp: number;
    title: string;
    description: string;
    publishedAt: Date;
    hover:boolean = false;

    //Debug

    clone(): Video {
        let v: Video = new Video();
        v.videoId = this.videoId;
        v.timestamp = this.timestamp;
        v.title = this.title;
        v.description = this.description;
        v.publishedAt = this.publishedAt;
        v.id = this.id;
        if(this.isPlaylistLink) {
            v.isPlaylistLink = this.isPlaylistLink;
        }
        if(this.thumbnail) {
            v.thumbnail = this.thumbnail;
        }
        v.api = this.api;
        return v;
    }


}
