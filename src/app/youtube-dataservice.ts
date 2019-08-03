import { IDataService } from './idata-service';
import { Video } from './video/video';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { SyncTubeComponent } from './sync-tube/sync-tube.component';
import { ImportedPlaylist } from './video/playlist';
import { SupportedApiType } from './supported-api-type';
import { SearchQuery } from './sync-tube/search-query';


export class YoutubeDataService implements IDataService {

    nextPageToken: string;
    id: number;
    name: string;
    http: HttpClient;
    synctubeComponent: SyncTubeComponent;
    APIKEY: string = "AIzaSyBJKPvOKMDqPzaR-06o1-Mfixvq2CRlS5M";

    constructor(http: HttpClient, synctubeComponent: SyncTubeComponent, id: number, name: string) {
        this.http = http;
        this.synctubeComponent = synctubeComponent;
        this.id = id;
        this.name = name;
    }

    search(searchQuery: SearchQuery): boolean {

        if (searchQuery.playlistId) {
            this.searchPlaylist(searchQuery.playlistId, false);
            return true;
        } else if (searchQuery.videoId) {
            //this.sendNewVideoLink(video);
            this.searchQuery(searchQuery.videoId, false, searchQuery.timestamp);
            return true;
        } else {
            this.searchQuery(searchQuery.query, true);
            return true;
        }

    }

    searchQuery(query: string, normalQuery: boolean, timestamp?: number, nextPageToken?: string) {
        this.http
            .get(
                "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&key=" +
                this.APIKEY +
                (nextPageToken ? "&pageToken=" + nextPageToken : "") +
                "&q=" +
                query
            )
            .subscribe(response => {
                console.log(response);
                let data: any = response;
                let items: any[] = data.items;
                let vids: Video[] = items
                    .filter(
                        i =>
                            i.id.kind === "youtube#playlist" || i.id.kind === "youtube#video"
                    )
                    .map(item => {
                        let video: Video = new Video();
                        if (item.id.kind === "youtube#playlist") {
                            video.isPlaylistLink = true;
                            video.playlistId = item.id.playlistId;
                        } else {
                            video.videoId = item.id.videoId;
                        }

                        if (item.snippet.thumbnails.high) {
                            video.thumbnail = item.snippet.thumbnails.high.url;
                        } else if (item.snippet.thumbnails.medium) {
                            video.thumbnail = item.snippet.thumbnails.medium.url;
                        } else {
                            video.thumbnail = item.snippet.thumbnails.default.url;
                        }
                        video.title = item.snippet.title;
                        video.description = item.snippet.description;
                        video.publishedAt = item.snippet.publishedAt;
                        video.api = this.id;
                        return video;
                    });
                if (normalQuery) {
                    if (nextPageToken) {
                        for(let video of vids){
                            this.synctubeComponent.searchResults.push(video);
                        }
                    } else {
                        this.synctubeComponent.searchResults = vids;
                    }
                    this.nextPageToken = (data.nextPageToken) ? data.nextPageToken : null;
                    this.synctubeComponent.updateCurrentScrollTop();
                } else { //youtube video link 
                    let vid: Video = vids[0];
                    if (timestamp) {
                        vid.timestamp = timestamp;
                    }
                    this.synctubeComponent.searchResults = [vid];
                }

                this.synctubeComponent.isLoadingVideos = false;
            });
    }

    searchPlaylist(query: string, mode: boolean, nextPageToken?: string, title?: string) {
        this.http
            .get(
                "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50" +
                (nextPageToken ? "&pageToken=" + nextPageToken : "") +
                "&key=" +
                this.APIKEY +
                "&playlistId=" +
                query
            )
            .subscribe(response => {
                let data: any = response;
                let items: any[] = data.items;
                if (this.synctubeComponent.importedPlaylist) {
                    this.synctubeComponent.importedPlaylist.size =
                        data.pageInfo.totalResults;

                }
                let nextPageToken: string = data.nextPageToken;
                console.log(data);
                let vids: Video[] = items
                    .filter(i => (i.snippet.resourceId.videoId ? true : false))
                    .map(it => it.snippet)
                    .map(item => {
                        return this.mapVideo(item);
                    });

                if (vids) {
                    for (let vid of vids) {
                        this.synctubeComponent.searchResults.push(vid);
                    }
                    //this.synctubeComponent.searchResults = [...this.synctubeComponent.searchResults, ...vids];
                }

                if (nextPageToken) {
                    this.searchPlaylist(query, mode, nextPageToken, title);
                } else {
                    this.synctubeComponent.importedPlaylist = new ImportedPlaylist();
                    this.synctubeComponent.importedPlaylist.items = this.synctubeComponent.searchResults;
                    this.synctubeComponent.importedPlaylist.size = this.synctubeComponent.importedPlaylist.items.length;
                    if (title) {
                        this.synctubeComponent.importedPlaylist.title = title;
                    }
                    this.synctubeComponent.hasImportedPlaylist = true;
                }
            });
    }

    processInput(input: string): SearchQuery {

        let paramsIndex: number = input.indexOf("?") + 1;
        let paramsString: string = input.substring(paramsIndex);
        let paramsList: string[] = paramsString.split("&");

        let query: SearchQuery = new SearchQuery();
        query.query = input;
        for (let param_ of paramsList) {
            if (param_.startsWith("v=")) {
                query.videoId = param_.substring(2);
            } else if (param_.startsWith("t=")) {
                query.timestamp = parseInt(param_.substring(2));
            } else if (param_.startsWith("list=")) {
                query.playlistId = param_.substring(5);
            } else if (param_.startsWith("start_radio=")) {
                query.startPlaylistIndex = parseInt(param_.substring(12));
            } else {
                console.log("_unkownParam_");
            }
        }
        return query;
    }

    mapVideo(item: any): Video {
        let video: Video = new Video();
        video.videoId = item.resourceId.videoId;
        video.title = item.title;
        video.description = item.description;
        video.publishedAt = item.publishedAt;

        if (item.thumbnails.high) {
            video.thumbnail = item.thumbnails.high.url;
        } else if (item.thumbnails.medium) {
            video.thumbnail = item.thumbnails.medium.url;
        } else {
            video.thumbnail = item.thumbnails.default.url;
        }
        video.api = this.id;
        return video;
    }

}