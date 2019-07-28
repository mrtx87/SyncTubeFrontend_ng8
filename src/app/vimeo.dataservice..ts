import { IDataService } from './idata-service';
import { Video } from './video/video';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { SyncTubeComponent } from './sync-tube/sync-tube.component';
import { ImportedPlaylist } from './video/playlist';
import { SupportedApiType } from './supported-api-type';
import { DailymotionVideo } from './dailymotion.video';
import { SearchQuery } from './sync-tube/search-query';
import { VimeoVideo } from './vimeo.video ';


export class VimeoDataService implements IDataService {
  

  id: number;
  name: string;
  http: HttpClient;
  synctubeComponent: SyncTubeComponent;
  APIKEY: string = "be6fcf0320704697342bd26a54557395";

  constructor(http: HttpClient, synctubeComponent: SyncTubeComponent, type: number, name: string) {
    this.http = http;
    this.synctubeComponent = synctubeComponent;
    this.id = type;
    this.name = name;
  }

  search(searchQuery: SearchQuery): boolean {

    //@TODO
    if (searchQuery) {

      if (searchQuery.playlistId) {
        console.log("playlist-ID: " + searchQuery.playlistId)
        this.searchPlaylist(searchQuery.playlistId, false);
        return true;
      }
      if (searchQuery.videoId) {
        //this.sendNewVideoLink(video);
        this.searchQuery(searchQuery.videoId, false, searchQuery.timestamp);
        return true;
      }
    }

    this.searchQuery(searchQuery.query, true);
    return true;
  }


  searchQuery(query: string, normalQuery: boolean, timestamp?: number) {
    this.http
      .get(
        "http://api.vimeo.com/videos?access_token=" + this.APIKEY + 
        "&query=" +
        query
      )
      .subscribe(searchResponse => {
        console.log(searchResponse);
        let data: any = searchResponse;
        let items: any[] = data.data;
        let vids: Video[] = items
          .filter((item: VimeoVideo) => item.type === 'video')
          .map((item: VimeoVideo) => this.mapVideo(item))
          .map((video: Video) => {

            return video;
          });

        if (normalQuery) {
          this.synctubeComponent.searchResults = vids;
        } else {
          let vid: Video = vids[0];
          if (timestamp) {
            vid.timestamp = timestamp;
          }
          this.synctubeComponent.searchResults = [vid];
        }
      });
  }

  searchPlaylist(query: string, mode: boolean, nextPageToken?: string, title?: string) {
    this.http
      .get(
        "http://api.vimeo.com/videos?access_token=" + this.APIKEY + "fields=id,title,description,thumbnail_480_url,published,item_type&" +
        "search=" +
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
            return video;
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
        //@TODO

    let query: SearchQuery = new SearchQuery();
    query.query = input;
    return query;
  }

  mapVideo(vimeoVideo: VimeoVideo): Video {
    let video: Video = new Video();

    if (vimeoVideo.type !== 'video') {
      video.isPlaylistLink = true;
      video.playlistId = vimeoVideo.uri.substring(8);;
    } else {
      video.videoId = vimeoVideo.uri.substring(8);
    }
    video.publishedAt = vimeoVideo.created_time;
    video.thumbnail = vimeoVideo.pictures.sizes[3].link;
    video.title = vimeoVideo.description;
    video.api = this.id;
    return video;
  }

}