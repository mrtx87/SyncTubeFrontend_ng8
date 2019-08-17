import { IDataService } from './idata-service';
import { Video } from './video/video';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { SyncTubeComponent } from './sync-tube/sync-tube.component';
import { ImportedPlaylist } from './video/playlist';
import { SupportedApiType } from './supported-api-type';
import { DailymotionVideo } from './dailymotion.video';
import { SearchQuery } from './sync-tube/search-query';


export class DailymotionDataService implements IDataService {

  nextPageToken: string;
  id: number;
  name: string;
  http: HttpClient;
  synctubeComponent: SyncTubeComponent;
  APIKEY: string = "a8f15ba0bbd9f9552be9";

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
        //console.log("playlist-ID: " + searchQuery.playlistId)
        this.searchPlaylist(searchQuery.playlistId, false);
        return true;
      }
      if (searchQuery.videoId) {
        //this.sendNewVideoLink(video);
        this.searchQuery(searchQuery.videoId, false, searchQuery.timestamp);
        return true;
      }
    }

    if (this.synctubeComponent.dailymotionSearchTypeSelection === 'video') {
      this.searchQuery(searchQuery.query, true);

    } else {
      this.searchPlaylist(searchQuery.query, true);
    }
    return true;
  }



  requestUrlVideos: string = 'https://api.dailymotion.com/videos?fields=id,title,description,thumbnail_480_url,published,item_type&limit=30&search=';

  requestUrlSingleVideo: string = 'https://api.dailymotion.com/video/'
  requestUrlSingleVideoParams: string = '?fields=id,title,description,thumbnail_480_url,published,item_type';

  searchQuery(query: string, normalQuery: boolean, timestamp?: number) {
    this.http
      .get(
        (normalQuery ? this.requestUrlVideos : this.requestUrlSingleVideo) +
        query +
        (normalQuery ? '' : this.requestUrlSingleVideoParams)
      )
      .subscribe(searchResponse => {
        //console.log(searchResponse);
        let data: any = searchResponse;
        if (normalQuery) {
          let items: any[] = data.list;
          let vids: Video[] = items
            .filter((item: DailymotionVideo) => item.item_type === 'video' && item.published)
            .map((item: DailymotionVideo) => this.mapVideo(item))
            .map((video: Video) => {

              return video;
            });

          this.synctubeComponent.searchResults = vids;
        }else{
          this.synctubeComponent.searchResults = [this.mapVideo(data)];
        }
      });
  }


  requestUrlPlaylistVideos: string = 'https://api.dailymotion.com/playlist/';
  requestUrlPlayistVideosParams: string = '/videos?page=';
  requestUrlPlayistVideosParams2: string = '&fields=id,title,description,thumbnail_480_url,published,item_type&limit=30';

  requestUrlPlaylists: string = 'https://api.dailymotion.com//playlists?search='
  requestUrlPlaylistsParams: string = '&fields=name,id,description,private,thumbnail_480_url,created_time,item_type&limit=30&page=';


  /**
   * 
   * @param query TODO
   * @param mode 
   * @param nextPageToken 
   * @param title 
   */
  searchPlaylist(query: string, mode: boolean, nextPageToken?: string, title?: string) { // mapping für playlist mit id oder als suche (andere endpunkte) [das gleiche wohl bei videos] selectliste (playlist, video) für dailymotion
    this.http
      .get(
        ((!mode) ? this.requestUrlPlaylistVideos : this.requestUrlPlaylists)
        + query
        + ((!mode) ? this.requestUrlPlayistVideosParams : this.requestUrlPlaylistsParams)
        + ((nextPageToken) ? nextPageToken : 1)
        + ((!mode) ? this.requestUrlPlayistVideosParams2 : '')

      )
      .subscribe(response => {
        let data: any = response;
        let items: any[] = data.list;
        if (!mode && this.synctubeComponent.importedPlaylist) {
          this.synctubeComponent.importedPlaylist.size =
            data.total;

        }
        let nextPageToken: string = !mode && data.has_more ? (data.page + 1) : null;
        let vids: Video[] = items
          .filter(item => (!mode) ? item.item_type == 'video' && item.published : item.item_type == "playlist" && !item.private && item.thumbnail_480_url)
          .map(item => {
            if (!mode) {
              return this.mapPlaylistVideo(item);
            }
            return this.mapPlaylist(item);
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
          if (!mode) {
            this.synctubeComponent.importedPlaylist = new ImportedPlaylist();
            this.synctubeComponent.importedPlaylist.items = this.synctubeComponent.searchResults;
            this.synctubeComponent.importedPlaylist.size = this.synctubeComponent.importedPlaylist.items.length;
            if (title) {
              this.synctubeComponent.importedPlaylist.title = title;
            }
            this.synctubeComponent.hasImportedPlaylist = true;
          }
        }
      });
  }

  processInput(input: string): SearchQuery {
    //@TODO
    //https://www.dailymotion.com/playlist/x36nbl
    let query: SearchQuery = new SearchQuery();

    if (input.includes('/playlist/')) {
      let id = input.split('/playlist/')[1];
      query.playlistId = id;
    }
    if (input.includes('/video/')) {
      let id = input.split('/video/')[1];
      query.videoId = id;
    }
    query.query = input;
    return query;
  }

  mapPlaylist(playlist: any): Video {

    let video: Video = new Video();
    video.isPlaylistLink = true;
    video.playlistId = playlist.id;
    video.publishedAt = playlist.created_time;
    video.description = playlist.description;
    video.title = playlist.name;
    video.api = this.id;
    if (playlist.thumbnail_480_url) {
      video.thumbnail = playlist.thumbnail_480_url;
    }
    return video;
  }

  mapPlaylistVideo(item: any) {
    let video: Video = new Video();
    video.videoId = item.id;
    video.title = item.title;
    video.description = item.description;
    video.publishedAt = item.publishedAt;
    if (item.thumbnail_480_url) {
      video.thumbnail = item.thumbnail_480_url;
    }
    video.api = this.id;
    return video;
  }

  mapVideo(dmVideo: DailymotionVideo): Video {
    let video: Video = new Video();

    video.videoId = dmVideo.id;
    video.description = dmVideo.description;
    video.thumbnail = dmVideo.thumbnail_480_url;
    video.title = dmVideo.title;
    video.api = this.id;
    return video;
  }

}