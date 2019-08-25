import { IDataService } from './idata-service';
import { Video } from './video/video';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { SyncTubeComponent } from './sync-tube/sync-tube.component';
import { ImportedPlaylist } from './video/playlist';
import { SupportedApiType } from './supported-api-type';
import { DailymotionVideo } from './dailymotion.video';
import { SearchQuery } from './sync-tube/search-query';
import { NullTemplateVisitor } from '@angular/compiler';


export class DirectLinkDataService implements IDataService {

  nextPageToken: string;
  id: string;
  name: string;
  http: HttpClient;
  synctubeComponent: SyncTubeComponent;
  APIKEY: string;
  iframe: any;

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
    if(!this.iframe) {
      this.iframe = document.getElementById( SupportedApiType.DirectLink + "player");
    }
  }



  searchQuery(query: string, normalQuery: boolean, timestamp?: number) {
    let unknownVideo = new Video();
    unknownVideo.videoId = query;
    unknownVideo.api = SupportedApiType.DirectLink;
    unknownVideo.title = query;
    unknownVideo.thumbnail = 'assets/video-player.svg';
    this.synctubeComponent.searchResults = [unknownVideo];

  }





  searchPlaylist(query: string, mode: boolean, nextPageToken?: string, title?: string) { // mapping für playlist mit id oder als suche (andere endpunkte) [das gleiche wohl bei videos] selectliste (playlist, video) für dailymotion

  }

  processInput(input: string): SearchQuery {
    this.retrieveIframe();
    let query : SearchQuery = new SearchQuery();
    query.query = input;

    return query;
  }

  mapVideo(dmVideo: DailymotionVideo): Video {
    return null;
  }

}