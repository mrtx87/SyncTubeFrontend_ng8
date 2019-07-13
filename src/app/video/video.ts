export class Video {

    id: string;

    videoId: string;
    timestamp: number;
    title: string;
    description: string;
    publishedAt: Date;
    hover:boolean = false;

    //Debug
    playlistId: string;

    clone(): Video {
        let v: Video = new Video();
        v.videoId = this.videoId;
        v.timestamp = this.timestamp;
        v.title = this.title;
        v.description = this.description;
        v.publishedAt = this.publishedAt;
        v.id = this.id;
        return v;
    }


}
