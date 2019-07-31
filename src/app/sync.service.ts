import { Injectable } from "@angular/core";
import * as Stomp from "stompjs";
import * as SockJS from "sockjs-client";
import { Raum } from "./raum";
import { Message } from "./message";
import { VideoComponent } from "./video/video.component";
import { SyncTubeComponent } from "./sync-tube/sync-tube.component";
import { ChatMessage } from "./chat-message";
import { User } from "./sync-tube/user";
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { Video } from "./video/video";
import { CookieService } from "ngx-cookie-service";
import { SearchQuery } from "./sync-tube/search-query";
import { ImportedPlaylist } from "./video/playlist";
import { Observable } from 'rxjs';
import { IDataService } from './idata-service';
import { SupportedApi } from './supported-api';
import { YoutubeDataService } from './youtube-dataservice';
import { SupportedApiType } from './supported-api-type';
import { DailymotionDataService } from './dailymotion.dataservice';
import { VimeoDataService } from './vimeo.dataservice.';
import { IVideoService } from './ivideo.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: "root"
})
export class SyncService {
  //PLAYERSTATES
  static notStarted: number = -1;
  static FINISHED: number = 0;
  static playing: number = 1;
  static paused: number = 2;
  static buffering: number = 3;
  static placed: number = 5; //video platziert

  static cookieKey: string = "U_COOKIE";

  supportedApis: SupportedApi[];

  private _apiServices: Map<Number, ApiService>;

  public get apiServices(): Map<Number, ApiService> {
    return this._apiServices; 
  }
  public set apiServices(value: Map<Number, ApiService>) {
    this._apiServices = value;
  }

  get currentApiService(): ApiService {
    return this.apiServices.get(this.getSelectedApi().id);
  }

  getApiServiceByKey(key: Number): ApiService{
    return this.apiServices.get(key);
  }

  /***
   * add stats page for admins (debug)
   */

  v: any;
  ws: SockJS;
  private stompClient;

  synctubeComponent: SyncTubeComponent;
  videoComponent: VideoComponent;




  constructor(private http: HttpClient, private cookieService: CookieService) {

  }

  retrieveSupportedApis() {
    this.http.get("http://localhost:8080/supported-apis", {}).subscribe(response => {
      if (this.synctubeComponent) {
        this.synctubeComponent.supportedApis = <SupportedApi[]>response
        this.synctubeComponent.selectedApi = this.synctubeComponent.supportedApis[0];
        this.supportedApis = <SupportedApi[]>response;
      } else {
        this.supportedApis = <SupportedApi[]>response;
      }
      this.buildAvailableDataServices();
    });
  }

  /*
  dataService(): IDataService {
    return this.dataServices.get(this.getSelectedApi().id);
  }*/

  getSelectedApi(): SupportedApi {
    return this.synctubeComponent.selectedApi;
  }

  buildAvailableDataServices() {
    if (!this.apiServices && this.supportedApis) {
      this.apiServices = new Map<Number, ApiService>();
      for (let supportedApi of this.supportedApis) {
        switch (supportedApi.id) {
          case SupportedApiType.Youtube:

            let youtubeApiService: ApiService = new ApiService();
            let youTubeDataService: YoutubeDataService = new YoutubeDataService(this.http, this.synctubeComponent, SupportedApiType.Youtube, supportedApi.name);
            youtubeApiService.dataService = youTubeDataService;
            this.apiServices.set(SupportedApiType.Youtube, youtubeApiService);
            console.log("Successfully generated api: " + youTubeDataService.name);
            break;
          case SupportedApiType.Dailymotion:
              let dailymotionApiService: ApiService = new ApiService();
              let dailymotionDataService: DailymotionDataService = new DailymotionDataService(this.http, this.synctubeComponent, SupportedApiType.Dailymotion, supportedApi.name);
              dailymotionApiService.dataService = dailymotionDataService;
              this.apiServices.set(SupportedApiType.Dailymotion, dailymotionApiService);
            console.log("Successfully generated api: " + dailymotionDataService.name);
            break;
          case SupportedApiType.Vimeo:
              let vimeoApiService: ApiService = new ApiService();
              let vimeoDataService: VimeoDataService = new VimeoDataService(this.http, this.synctubeComponent, SupportedApiType.Vimeo, supportedApi.name);
              vimeoApiService.dataService = vimeoDataService;
              this.apiServices.set(SupportedApiType.Vimeo, vimeoApiService);
            console.log("Successfully generated api: " + vimeoDataService.name);
            break;

          default:
            break;
        }
      }
      return;
    }
    console.log("Couldn't build Apis")
  }

  registerSyncTubeComponent(synctubeComponent: SyncTubeComponent) {
    this.synctubeComponent = synctubeComponent;
  }

  registerVideoComponent(videoComponent: VideoComponent) {
    this.videoComponent = videoComponent;
  }

  handleCookie(): User {
    let user: User;
    if (this.cookieService.check(SyncService.cookieKey)) {
      user = new User();
      let cookie: string = this.getCookie();
      user.userId = parseInt(cookie);
    } else {
      user = new User();
      user.userId = this.generateUserId();
    }
    this.setCookie(user.userId);
    return user;
  }

  connect() {
    let user: User = this.handleCookie();
    this.setLocalUser(user);

    this.ws = new SockJS("http://localhost:8080/socket");
    this.stompClient = Stomp.over(this.ws);
    let that = this;

    this.stompClient.connect({}, function () {
      that.stompClient.subscribe("/chat/" + user.userId, messageFromServer => that.handleServerResponse(messageFromServer));

      let raumId: number = that.synctubeComponent.getPathId();
      if (raumId) {
        that.sendJoinRaum(user, raumId);
      } else {
        that.sendRequestPublicRaeume();
        that.synctubeComponent.revealContent = true;
      }
    });
  }

  handleServerResponse(messageFromServer: any) {
    if (messageFromServer.body) {
      console.log("[RESPONSE FROM SERVER]: " + messageFromServer.body);
      let message: Message = JSON.parse(messageFromServer.body);
      this.handleMessage(message);
    }
  }

  handleMessage(message: Message) {
    if (message.type == "toggle-play") {
      console.log(message);

      this.videoComponent.currentDisplayedTime = message.video.timestamp;
      this.videoComponent.currentTimeProgressbar = message.video.timestamp;
      this.seekTo(message.video.timestamp, true);
      this.togglePlayVideo(message.playerState);
      this.updateVideo(message);

      return;
    }

    if (message.type == "assigned-as-admin") {
      console.log(message);
      this.assignedAsAdmin(message.user);
      this.updateClientChat(message);
      return;
    }

    if (message.type == "update-title-and-description") {
      this.updateRaumTitleAndDescription(
        message.raumTitle,
        message.raumDescription
      );
      return;
    }

    if (message.type == "all-chat-messages") {
      console.log(message); //SERVER SENDING ALL ?
      this.synctubeComponent.addAllChatMessages(message.chatMessages);
      this.synctubeComponent.forceScrollToChatBottom = true;
      return;
    }

    if (message.type == "seekto-timestamp") {
      console.log(message);
      this.videoComponent.currentTimestamp = message.video.timestamp;
      this.videoComponent.currentTimeProgressbar = message.video.timestamp;
      this.videoComponent.currentDisplayedTime = message.video.timestamp;
      this.seekTo(this.videoComponent.currentTimestamp, true);
      this.togglePlayVideo(this.getReceivedPlayerState());
      return;
    }

    if (message.type == "chat-message") {
      console.log(message);
      this.synctubeComponent.addChatMessage(message.chatMessage);
      this.synctubeComponent.forceScrollToChatBottom = true;
      return;
    }

    if (message.type == "refresh-userlist") {
      console.log(message);
      this.updateClientChat(message);

      return;
    }

    if (message.type == "refresh-user-and-list") {
      console.log(message);
      this.updateClientChat(message);
      this.setLocalUser(message.user);

      return;
    }
    if (message.type == "update-client") {
      console.log(message);
      this.updateClientChat(message);
      return;
    }

    if (message.type == "request-sync-timestamp") {
      console.log(message);
      let v: Video = new Video();
      v.videoId = this.getVideo().videoId;
      v.timestamp = this.getCurrentTime();
      this.sendCurrentTimeStamp(this.getLocalUser(), this.getRaumId(), v);
      return;
    }

    if (message.type == "update-kick-client") {
      console.log(message);
      this.updateKickedUsers(message);
      this.updateClientChat(message);
      this.setRaumId(message.raumId);
      this.replaceUrl(message.raumId);
      return;
    }

    if (message.type == "update-kicked-users") {
      console.log(message);
      this.updateKickedUsers(message);
      return;
    }

    if (message.type == "to-public-room") {
      console.log("[to public room: ]" + message);
      this.setRaumStatus(message.raumStatus);
      this.updateClientChat(message);
      return;
    }

    if (message.type == "to-private-room") {
      console.log("[to private room: ]" + message);
      this.setRaumStatus(message.raumStatus);
      this.updateClientChat(message);
      this.setLocalUser(message.user);
      return;
    }

    if (message.type == "remove-video-playlist") {
      this.synctubeComponent.playlist = this.getLocalPlaylist().filter(
        vid => vid.id !== message.playlistVideo.id
      );
      this.updateVideo(message);
      this.switchVideo(message);

      return;
    }

    if (message.type == "switch-video") {
      this.updateVideo(message);
      this.switchVideo(message);
      return;
    }

    if (message.type == "update-playlist") {
      console.log(message.users);
      if (message.video) {
        this.updateVideo(message);
        this.switchVideo(message);
      }
      if (message.chatMessage) {
        this.synctubeComponent.chatMessages.push(message.chatMessage);
      }
      this.getRaumPlaylist(this.getRaumId());
      return;
    }

    if (message.type == "toggle-playlist-running-order") {
      this.synctubeComponent.randomOrder = message.randomOrder;
    }

    if (message.type == "toggle-playlist-loop") {
      this.synctubeComponent.loop = message.loop;
    }

    if (message.type == "create-room") {
      this.createClient(message);
      this.replaceUrl(message.raumId);
      this.updateVideo(message);
      this.getRaumPlaylist(this.getRaumId());
      console.log(message.users);
      return;
    }

    if (message.type == "join-room") {
      this.createClient(message);
      this.replaceUrl(message.raumId);
      this.updateVideo(message);

      this.getRaumPlaylist(this.getRaumId());
      this.setInitalPlaybackRate(message.currentPlaybackRate)
      console.log(message.users);
      return;
    }

    if (message.type == "change-playback-rate") {
      this.setPlaybackRate(message.currentPlaybackRate);
      return;
    }

    if (message.type == "insert-new-video") {
      this.updateVideo(message);
      this.switchVideo(message);
      this.synctubeComponent.chatMessages.push(message.chatMessage);
      return;
    }

    if (message.type == "kicked-user") {
      console.log(message);
      this.resetClient();
      return;
    }

    if (message.type == "refresh-raumid") {
      console.log(message);
      this.setRaumId(message.raumId);
      this.replaceUrl(message.raumId);
    }

    if (message.type == "error") {
      console.log("[ERROR from Server]");
      return;
    }
  }

  setRaumId(raumId: number) {
    this.synctubeComponent.raumId = raumId;
  }

  resetClient() {
    //this.synctubeComponent.generateUserId();
    this.synctubeComponent.raumId = undefined;
    this.synctubeComponent.chatMessages = [];
    this.synctubeComponent.raumStatus = undefined;
    this.synctubeComponent.videoDuration = 0;
  }

  getReceivedPlayerState(): number {
    return this.synctubeComponent.getReceivedPlayerState();
  }

  replaceUrl(raumId: number) {
    let url: string = "/rooms/" + raumId;
    window.history.replaceState({}, "", url);
  }

  clearVideo() {
    this.videoComponent.clearVideo();
  }

  updateVideo(message: Message) {
    if (message.video) {
      this.synctubeComponent.video = message.video;
    }
    if (message.playerState) {
      this.synctubeComponent.receivedPlayerState = message.playerState;
    }
    if (message.currentPlaybackRate) {
      this.setInitalPlaybackRate(message.currentPlaybackRate);
    }
    if (this.videoComponent) {
      //this.videoComponent.availableQualitys = this.videoComponent.getAvailableQualityLevels();
    }
  }

  switchVideo(message: Message) {
    if (message.video) {
      this.loadVideoById({
        videoId: message.video.videoId,
        startSeconds: message.video.timestamp,
        suggestedQuality: "large"
      });
      this.videoComponent.currentTimeProgressbar = message.video.timestamp;
      this.videoComponent.currentDisplayedTime = message.video.timestamp;
      this.synctubeComponent.forceScrollToChatBottom = true;

      let that = this;
      let wait = setInterval(function () {
        if (that.getPlayerState() == SyncService.playing) {
          that.setVideoDuration();
          that.setPlaybackRates();
          that.setPlaybackRate(message.currentPlaybackRate);
          //      that.getCaptions(that.getVideo());
          that.togglePlayVideo(that.getReceivedPlayerState());
          clearInterval(wait);
        }
      }, 20);
    }
  }

  /*
  updatePlaylist(playlist: Video[]) {
    this.synctubeComponent.playlist = playlist;
  }*/

  updateKickedUsers(message: Message) {
    if (message.kickedUsers) {
      this.synctubeComponent.kickedUsers = message.kickedUsers;
    }
  }

  updateClientChat(message: Message) {
    this.synctubeComponent.users = message.users;
    if (message.chatMessage) {
      this.synctubeComponent.chatMessages.push(message.chatMessage);
    }
    this.synctubeComponent.forceScrollToChatBottom = true;
  }

  createClient(message: Message) {
    this.synctubeComponent.revealContent = true;
    this.synctubeComponent.user = message.user;
    if (message.video) {
      this.synctubeComponent.video = message.video;
    }
    this.synctubeComponent.raumId = message.raumId;
    this.synctubeComponent.users = message.users;
    this.synctubeComponent.chatMessages = <ChatMessage[]>message.chatMessages;
    this.synctubeComponent.raumStatus = message.raumStatus;
    this.updateRaumTitleAndDescription(
      message.raumTitle,
      message.raumDescription
    );
  }

  updateRaumTitleAndDescription(title: string, description: string) {
    if (title) {
      this.synctubeComponent.raumTitle = title;
      this.synctubeComponent.raumTitleChange = title;
    }

    if (description) {
      this.synctubeComponent.raumDescription = description;
      this.synctubeComponent.raumDescriptionChange = description;
    }
  }

  localCloseConnection() {
    this.stompClient.disconnect();
    this.ws.close();
  }

  generateUserId(): number {
    return parseInt(
      Math.floor(Date.now() / 1000) + "" + Math.floor(Math.random() * 10000)
    );
  }

  sendRequestPublicRaeume() {
    console.log("[request public rooms]");
    this.synctubeComponent.publicRaeume = <Observable<Raum[]>>this.http
      .get("http://localhost:8080/publicrooms/userId/" + this.getUserId(), {})

  }

  sendChatMessage(message: Message) {
    console.log("[send chatmessage... " + message + "]");
    this.stompClient.send(
      "/app/send/chat-message",
      {},
      JSON.stringify(message)
    );
  }

  sendcreateRaum(user: User, raumStatus: Boolean) {
    console.log("[create Raum...] " + user);
    this.stompClient.send(
      "/app/send/create-room",
      {},
      JSON.stringify({ user: user, raumStatus: raumStatus })
    );
  }

  sendJoinRaum(user: User, raumId: number) {
    console.log("[join-raum:] " + user.userId + " " + raumId);
    this.stompClient.send(
      "/app/send/join-room",
      {},
      JSON.stringify({ user: user, raumId: raumId })
    );
  }

  sendChangeUserName(user: User, raumId: number) {
    console.log("[change-user-name:] " + user.userName + " " + raumId);
    this.stompClient.send(
      "/app/send/change-user-name",
      {},
      JSON.stringify({ user: user, raumId: raumId })
    );
  }

  sendSeekToTimestamp(
    user: User,
    raumId: number,
    videoId: string,
    timestamp: number
  ) {
    console.log("[seekto-timestamp:] " + timestamp);
    let video: Video = new Video();
    video.videoId = videoId;
    video.timestamp = timestamp;
    this.stompClient.send(
      "/app/send/seekto-timestamp",
      {},
      JSON.stringify({ user: user, raumId: raumId, video: video })
    );
  }

  sendCurrentTimeStamp(user: User, raumId: number, video: Video) {
    console.log("[seekto-timestamp:] " + video);
    this.stompClient.send(
      "/app/send/current-timestamp",
      {},
      JSON.stringify({ user: user, raumId: raumId, video: video })
    );
  }

  sendNewVideo(user: User, raumId: number, video: Video) {
    console.log("[send-new-video:] " + video);
    if (video) {
      this.stompClient.send(
        "/app/send/receive-new-video",
        {},
        JSON.stringify({ user: user, raumId: raumId, video: video })
      );
    }
  }

  sendUpdateTitleAndDescription(
    user: User,
    raumId: number,
    raumTitle: string,
    raumDescription: string
  ) {
    this.stompClient.send(
      "/app/send/update-title-and-description",
      {},
      JSON.stringify({
        user: user,
        raumId: raumId,
        raumDescription: raumDescription,
        raumTitle: raumTitle
      })
    );
  }

  sendSwitchPlaylistVideo(user: User, raumId: number, playlistVideo: Video) {
    if (playlistVideo) {
      this.stompClient.send(
        "/app/send/switch-playlist-video",
        {},
        JSON.stringify({
          user: user,
          raumId: raumId,
          playlistVideo: playlistVideo
        })
      );
    }
  }

  sendChangePlaybackRate(
    user: User,
    raumId: number,
    currentPlaybackRate: number
  ) {
    this.stompClient.send(
      "/app/send/change-playback-rate",
      {},
      JSON.stringify({
        user: user,
        raumId: raumId,
        currentPlaybackRate: currentPlaybackRate
      })
    );
  }

  sendAutoNextPlaylistVideo(user: User, raumId: number, playerState: number) {
    this.stompClient.send(
      "/app/send/auto-next-playlist-video",
      {},
      JSON.stringify({ user: user, raumId: raumId, playerState: playerState })
    );
  }

  sendTogglePlaylistLoop(user: User, raumId: number, loop: number) {
    this.stompClient.send(
      "/app/send/toggle-playlist-loop",
      {},
      JSON.stringify({ user: user, raumId: raumId, loop: loop })
    );
  }

  sendTogglePlaylistRunningOrder(
    user: User,
    raumId: number,
    randomOrder: boolean
  ) {
    this.stompClient.send(
      "/app/send/toggle-playlist-running-order",
      {},
      JSON.stringify({ user: user, raumId: raumId, randomOrder: randomOrder })
    );
  }

  sendToggleMuteUser(user: User, raumId: number, assignedUser: User) {
    console.log(assignedUser);
    this.stompClient.send(
      "/app/send/toggle-mute-user",
      {},
      JSON.stringify({ user: user, raumId: raumId, assignedUser: assignedUser })
    );
  }

  sendPardonKickedUser(user: User, raumId: number, kickedUser: User) {
    this.stompClient.send(
      "/app/send/pardon-kicked-user",
      {},
      JSON.stringify({ user: user, raumId: raumId, assignedUser: kickedUser })
    );
  }

  /*
    searchQuery(query: string, normalQuery: boolean, timestamp?: number) {
      let params: HttpParams = new HttpParams();
      params.append("q", query);
      this.http
        .get(
          "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&key=" +
          '' +
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
      let params: HttpParams = new HttpParams();
      params.append("q", query);
      this.http
        .get(
          "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50" +
          (nextPageToken ? "&pageToken=" + nextPageToken : "") +
          "&key=" +
          '' +
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
              let video: Video = new Video();
              video.videoId = item.resourceId.videoId;
              video.title = item.title;
              video.description = item.description;
              video.publishedAt = item.publishedAt;
  
              if (item.snippet.thumbnails.high) {
                video.thumbnail = item.snippet.thumbnails.high.url;
              } else if (item.snippet.thumbnails.medium) {
                video.thumbnail = item.snippet.thumbnails.medium.url;
              } else {
                video.thumbnail = item.snippet.thumbnails.default.url;
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
  */
  sendDisconnectMessage(user: User, raumId: number) {
    console.log("[disconnect-client:] " + user);
    this.stompClient.send(
      "/app/send/disconnect-client",
      {},
      JSON.stringify({ user: user, raumId: raumId })
    );
  }

  sendTogglePlay(
    user: User,
    raumId: number,
    playerState: number,
    video: Video,
    currentTime: number
  ) {
    console.log("[toggle-play:] " + user);
    let message: Message = new Message();
    video.timestamp = currentTime;
    message.video = video;
    message.user = user;
    message.raumId = raumId;
    message.playerState = playerState;
    this.stompClient.send("/app/send/toggle-play", {}, JSON.stringify(message));
  }

  sendAssignAdmin(raumId: number, user: User, assignedUser: User) {
    console.log("[assign-as-admin:] " + assignedUser);
    this.stompClient.send(
      "/app/send/assign-admin",
      {},
      JSON.stringify({ raumId: raumId, user: user, assignedUser: assignedUser })
    );
  }

  sendKickUser(raumId: number, user: User, assignedUser: User) {
    console.log("[kick-user:] " + assignedUser);
    this.stompClient.send(
      "/app/send/kick-user",
      {},
      JSON.stringify({ assignedUser: assignedUser, raumId: raumId, user: user })
    );
  }

  sendToPublicRoomRequest(raumId: number, user: User) {
    console.log("[switch-to-public-room:] " + user);
    this.stompClient.send(
      "/app/send/to-public-room",
      {},
      JSON.stringify({ raumId: raumId, user: user })
    );
  }

  sendToPrivateRoomRequest(raumId: number, user: User) {
    console.log("[switch-to-private-room:] " + user);
    this.stompClient.send(
      "/app/send/to-private-room",
      {},
      JSON.stringify({ raumId: raumId, user: user })
    );
  }

  sendRefreshRaumId(raumId: number, user: User) {
    console.log("[refresh-RaumId:] " + user);
    this.stompClient.send(
      "/app/send/refresh-raumid",
      {},
      JSON.stringify({ raumId: raumId, user: user })
    );
  }

  getRaumPlaylist(raumId: number) {
    // /room/{raumId}/playlist/
    this.http
      .get("http://localhost:8080/room/" + raumId + "/playlist")
      .subscribe((playlist: Video[]) => {
        console.log(playlist);
        this.synctubeComponent.playlist = playlist;
        if (this.synctubeComponent.playlist.length == 0) {
          //this.stopVideo();
        }
      });
  }

  sendImportPlaylist(
    raumId: number,
    user: User,
    importedPlaylist: ImportedPlaylist
  ) {
    console.log(
      "[import-playlist:] " + user + " | playlist: " + importedPlaylist
    );

    if (importedPlaylist) {
      // /room/{raumId}/playlist/
      this.http
        .post(
          "http://localhost:8080/room/" + raumId + "/userId/" + user.userId + "/playlist",
          importedPlaylist
        )
        .subscribe(response => {
          console.log(response);
        });
    }
  }

  sendRemoveVideoFromPlaylist(
    raumId: number,
    user: User,
    playlistVideo: Video
  ) {
    console.log(
      "[remove-video-from-playlist:] " + user + " | video: " + playlistVideo
    );
    if (playlistVideo) {
      this.stompClient.send(
        "/app/send/remove-video-from-playlist",
        {},
        JSON.stringify({
          raumId: raumId,
          user: user,
          playlistVideo: playlistVideo
        })
      );
    }
  }

  sendAddVideoToPlaylist(raumId: number, user: User, playlistvideo: Video) {
    console.log(
      "[add-video-to-playlist:] " + user + " | video: " + playlistvideo.videoId
    );
    if (playlistvideo) {
      this.stompClient.send(
        "/app/send/add-video-to-playlist",
        {},
        JSON.stringify({
          raumId: raumId,
          user: user,
          playlistVideo: playlistvideo
        })
      );
    }
  }

  sendAddVideoToPlaylistAsNext(
    raumId: number,
    user: User,
    playlistvideo: Video
  ) {
    console.log(
      "[add-video-to-playlist-asnext:] " +
      user +
      " | video: " +
      playlistvideo.videoId
    );
    if (playlistvideo) {
      this.stompClient.send(
        "/app/send/add-video-to-playlist-asnext",
        {},
        JSON.stringify({
          raumId: raumId,
          user: user,
          playlistVideo: playlistvideo
        })
      );
    }
  }

  sendAddVideoToPlaylistAsCurrent(
    raumId: number,
    user: User,
    playlistvideo: Video
  ) {
    console.log(
      "[add-video-to-playlist-ascurrent:] " +
      user +
      " | video: " +
      playlistvideo.videoId
    );
    if (playlistvideo) {
      this.stompClient.send(
        "/app/send/add-video-to-playlist-ascurrent",
        {},
        JSON.stringify({
          raumId: raumId,
          user: user,
          playlistVideo: playlistvideo
        })
      );
    }
  }

  sendRequestSyncTimestamp() {
    console.log("[request-sync-timestamp]");
    this.stompClient.send(
      "/app/send/request-sync-timestamp",
      {},
      JSON.stringify({ raumId: this.getRaumId(), user: this.getLocalUser() })
    );
  }

  getCurrentTime(): number {
    return this.videoComponent.getCurrentTime();
  }

  getPlayerState(): number {
    return this.videoComponent.getPlayerState();
  }

  seekTo(seconds: number, allowSeekAhead: Boolean): void {
    this.videoComponent.seekTo(seconds, allowSeekAhead);
  }

  pauseVideo(): void {
    this.videoComponent.pauseVideo();
  }

  stopVideo(): void {
    this.videoComponent.stopVideo();
  }

  togglePlayVideo(toggle: number): void {
    this.videoComponent.togglePlayVideo(toggle);
  }

  loadVideoById(urlObject: any) {
    this.videoComponent.loadVideoById(urlObject);
  }

  setVideoDuration() {
    this.videoComponent.setVideoDuration();
  }

  setPlaybackRates() {
    this.videoComponent.setPlaybackRates();
  }

  getUserId(): number {
    return this.synctubeComponent.getUserId();
  }

  getLocalUser(): User {
    return this.synctubeComponent.getUser();
  }

  getRaumId(): number {
    return this.synctubeComponent.getRaumId();
  }

  mute(): void {
    this.videoComponent.mute();
  }

  unMute(): void {
    this.videoComponent.unMute();
  }

  isMuted(): Boolean {
    return this.videoComponent.isMuted();
  }

  togglePlay() { }

  toggleMute() {
    if (this.isMuted()) {
      this.unMute();
    } else {
      this.mute();
    }
  }

  assignedAsAdmin(user: User) {
    this.setLocalUser(user);
  }

  setLocalUser(user: User) {
    this.synctubeComponent.setLocalUser(user);
  }

  setRaumStatus(raumStatus: Boolean) {
    this.synctubeComponent.setRaumstatus(raumStatus);
  }

  getVideo(): Video {
    return this.synctubeComponent.getVideo();
  }

  getVideoDuration(): number {
    return this.videoComponent.getVideoDuration();
  }

  getAvailablePlaybackRates(): Array<number> {
    return this.videoComponent.getAvailablePlaybackRates();
  }

  getPlaybackRate(): number {
    return this.videoComponent.getPlaybackRate();
  }

  setPlaybackRate(rate: number) {
    if (this.videoComponent) {
      this.videoComponent.setPlaybackRate(rate);
    }
  }

  getInitalPlaybackRate(): number {
    return this.synctubeComponent.initalPlaybackRate;
  }

  setInitalPlaybackRate(rate: number) {
    if (this.synctubeComponent) {
      this.synctubeComponent.setInitalPlaybackRate(rate);
    }
  }

  toggleSubtitle(_module, option, value) {
  }

  toggleDisplayOptions() {
    this.videoComponent.toggleDisplayOptions();
  }

  /*
  setSize(width: number, height: number) {
    this.videoComponent.setSize(width, height);
  }*/

  toggleFullscreen() {
    this.videoComponent.toggleDisplayFullscreen();
  }

  getCookie(): string {
    if (this.hasCookie()) {
      return this.cookieService.get(SyncService.cookieKey);
    }
  }

  hasCookie(): boolean {
    return this.cookieService.check(SyncService.cookieKey);
  }

  setCookie(userId: number) {
    this.cookieService.set(SyncService.cookieKey, "" + userId, 30);
  }

  isLocalUserAdmin(): Boolean {
    return this.getLocalUser().admin;
  }

  getLocalPlaylist(): Video[] {
    return this.synctubeComponent.getLocalPlaylist();
  }

  currentVideoExists() {
    return this.getVideo() ? true : false;
  }

  jumpBySeconds(offset: number) {
    if (this.isLocalUserAdmin() && this.currentVideoExists()) {
      let raumId: number = this.getRaumId();
      let user: User = this.getLocalUser();
      let videoId: string = this.getVideo().videoId;
      let currentTime: number = this.getCurrentTime();
      this.sendSeekToTimestamp(user, raumId, videoId, currentTime + offset);
    }
  }

  startDisplaylingsecondsBack() {
    this.videoComponent.startDisplaylingsecondsBack();
  }

  startDisplaylingsecondsForward() {
    this.videoComponent.startDisplaylingsecondsForward();
  }

  parseYoutubeUrl(url: string): Video {
    //https://www.youtube.com/watch?v=luQ0JWcrsWg&feature=youtu.be&list=PLuUrokoVSxlfUJuJB_D8j_wsFR4exaEmy&t=81
    //https://youtu.be/AmAy0KABoX0

    let youtubeUrl: string = url;
    let result: string[] = youtubeUrl.split("/");
    youtubeUrl = result[result.length - 1];
    let videoId: string;
    let listlink: string;
    let timestamp: number;
    let urlIndex: number = youtubeUrl.search("v=");
    if (urlIndex > -1) {
      let andIndex: number = youtubeUrl.search("&");
      if (andIndex > -1) {
        videoId = youtubeUrl.substring(urlIndex + 2, andIndex);
        console.log("!!!1 " + andIndex + " | " + videoId);
        youtubeUrl = youtubeUrl.substring(andIndex + 1);

        let listIndex: number = youtubeUrl.search("list=");
        if (listIndex > -1) {
          let youtubeList: string = youtubeUrl.substring(listIndex + 5);
          andIndex = youtubeList.search("&");
          if (andIndex > -1) {
            listlink = youtubeList.substring(listIndex, andIndex);
          } else {
            listlink = youtubeList;
          }
          console.log("YTLIST: " + listlink);
        }

        let timeStampIndex: number = youtubeUrl.search("t=");
        if (timeStampIndex > -1) {
          let youtubeTimeStamp: string = youtubeUrl.substring(
            timeStampIndex + 2
          );
          andIndex = youtubeTimeStamp.search("&");
          if (andIndex > -1) {
            timestamp = parseInt(
              youtubeTimeStamp.substring(timeStampIndex, andIndex)
            );
          } else {
            timestamp = parseInt(youtubeTimeStamp);
          }
          console.log("YTTS:" + timestamp);
        }
      } else {
        videoId = youtubeUrl.substring(urlIndex + 2);
        console.log("!!! " + videoId);
      }
    } else {
      let timeStampIndex: number = youtubeUrl.search("t=");
      if (timeStampIndex > -1) {
        let youtubeTimeStamp: string = youtubeUrl.substring(timeStampIndex + 2);
        let andIndex = youtubeTimeStamp.search("&");
        if (andIndex > -1) {
          timestamp = parseInt(
            youtubeTimeStamp.substring(timeStampIndex, andIndex)
          );
        } else {
          timestamp = parseInt(youtubeTimeStamp);
        }
        videoId = youtubeUrl.substring(0, timeStampIndex - 1);
        console.log("YTS:" + timestamp + "videoId: " + videoId);
      }
    }

    if (videoId || timestamp || listlink) {
      let video: Video = new Video();
      video.videoId = videoId;
      video.timestamp = timestamp;
      video.playlistId = listlink;
      return video;
    }
    return null;
  }
}
