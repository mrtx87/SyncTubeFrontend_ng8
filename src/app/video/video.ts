export class Video {

    videoId: string;
    timestamp: number;
    title: string;
    description: string;
    publishedAt: Date;
    playlistNr: number;

    //Debug
    playlistId: string;

    clone(): Video {
        let v: Video = new Video();
        v.videoId = this.videoId;
        v.timestamp = this.timestamp;
        v.title = this.title;
        v.description = this.description;
        v.publishedAt = this.publishedAt;
        v.playlistNr = this.playlistNr;
        return v;
    }


}
