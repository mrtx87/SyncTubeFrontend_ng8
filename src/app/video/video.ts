export class Video {

    videoId: string;
    timestamp: number;
    title: string;
    description: string;
    publishedAt: Date;

    clone(): Video {
        let v: Video = new Video();
        v.videoId = this.videoId;
        v.timestamp = this.timestamp;
        v.title = this.title;
        v.description = this.description;
        v.publishedAt = this.publishedAt;
        return v;
    }

}
