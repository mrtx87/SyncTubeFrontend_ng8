import { IDataService } from './idata-service';
import { Video } from './video/video';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { SyncTubeComponent } from './sync-tube/sync-tube.component';
import { SupportedApiType } from './supported-api-type';
import { DailymotionVideo } from './dailymotion.video';
import { SearchQuery } from './sync-tube/search-query';


export class VerystreamDataService implements IDataService {

  nextPageToken: string;
  id: string;
  name: string;
  http: HttpClient;
  synctubeComponent: SyncTubeComponent;
  APIKEY: string;
  iframe: any;
  currentLink: string;


  constructor(http: HttpClient, synctubeComponent: SyncTubeComponent, id: string, name: string) {
    this.http = http;
    this.synctubeComponent = synctubeComponent;
    this.id = id;
    this.name = name;
  }


  search(searchQuery: SearchQuery): boolean {
    //@TODO
    this.searchQuery(searchQuery.query, true);
    return true;
  }

  retrieveIframe() {
    if (!this.iframe) {
      this.iframe = document.getElementById(SupportedApiType.Openload + "player");
    }
  }



  searchQuery(query: string, normalQuery: boolean, timestamp?: number) {

    let unknownVideo = new Video();
    unknownVideo.videoId = query;
    unknownVideo.api = SupportedApiType.Verystream;
    unknownVideo.title = "verystreamvideo";
    unknownVideo.thumbnail = 'assets/video-player.svg';
    this.synctubeComponent.searchResults = [unknownVideo];
    this.currentLink = query;
  }





  searchPlaylist(query: string, mode: boolean, nextPageToken?: string, title?: string) { // mapping für playlist mit id oder als suche (andere endpunkte) [das gleiche wohl bei videos] selectliste (playlist, video) für dailymotion

  }

  containsVideo(input: string): boolean {
    return input.includes(".mp4") || input.includes(".webm") || input.includes(".mkv")
  }

  processInput(input: string): SearchQuery {
    if (this.synctubeComponent.isUrl(input)) {
      let videoId = this.extractVideoId(input);
      this.retrieveIframe();
      let query: SearchQuery = new SearchQuery();
      query.query = input;
      return query;
    }
    return null
  }

  extractVideoId(input: string): string {
    let index: number = input.indexOf("stream/");
    index = index >= 0 ? index : input.indexOf("/");
    if (index >= 0) {
      index += 7;
      let restUrl = input.substring(index);
      let endIndex: number = restUrl.indexOf("/");
      if (endIndex >= 0) {
        let videoId = restUrl.substring(0, endIndex);
        return videoId;
      }
    }

    return null;
  }

  mapVideo(dmVideo: DailymotionVideo): Video {
    return null;
  }

}