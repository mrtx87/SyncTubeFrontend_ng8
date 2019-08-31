import { Injectable, ɵPlayState } from "@angular/core";
import * as Stomp from "stompjs";
import * as SockJS from "sockjs-client";
import { Raum } from "./raum";
import { Message } from "./message";
import { VideoComponent } from "./video/video.component";
import { SyncTubeComponent } from "./sync-tube/sync-tube.component";
import { ChatMessage } from "./chat-message";
import { User } from "./sync-tube/user";
import {
  HttpClient,
  HttpParams,
  HttpXsrfTokenExtractor,
  HttpHeaders
} from "@angular/common/http";
import { Video } from "./video/video";
import { CookieService } from "ngx-cookie-service";
import { SearchQuery } from "./sync-tube/search-query";
import { ImportedPlaylist } from "./video/playlist";
import { Observable } from "rxjs";
import { IDataService } from "./idata-service";
import { SupportedApi } from "./supported-api";
import { YoutubeDataService } from "./youtube-dataservice";
import { SupportedApiType } from "./supported-api-type";
import { DailymotionDataService } from "./dailymotion.dataservice";
import { IVideoService } from "./ivideo.service";
import { ToastrConfig } from "./toastr.config";
import { ToastrService } from "ngx-toastr";
import { ToastrConfigs } from "./toastr.configs";
import { ToastrMessageTypes } from "./toastr.message.types";
import { MessageTypes } from "./message.types";
import { ToastrMessage } from "./toastr.message";
import { AppCookie } from "./app.cookie";
import { Constants } from './constants';
import { DirectLinkDataService } from './directlink.dataservice';
import { LanguagesService } from './languages.service';

@Injectable({
  providedIn: "root"
})
export class SyncService {
  /***
   * add stats page for admins (debug)
   */

  v: any;
  ws: SockJS;
  private stompClient;

  synctubeComponent: SyncTubeComponent;
  videoComponent: VideoComponent;
  initResponseMessage: Message;

  toastrMessageTypes: any;
  messageTypes: any;

  private _selectedVideoApi: string;
  supportedApis: SupportedApi[];

  private _videoServices: Map<string, IVideoService>;
  private _dataServices: Map<string, IDataService>;

  public get selectedVideoApiId(): string {
    return this._selectedVideoApi;
  }
  public set selectedVideoApiId(value: string) {
    this._selectedVideoApi = value;
  }

  public get videoServices(): Map<string, IVideoService> {
    return this._videoServices;
  }
  public set videoServices(value: Map<string, IVideoService>) {
    this._videoServices = value;
  }

  public get dataServices(): Map<string, IDataService> {
    return this._dataServices;
  }
  public set dataServices(value: Map<string, IDataService>) {
    this._dataServices = value;
  }

  get currentDataService(): IDataService {
    return this.dataServices.get(this.getSelectedDataApi().id);
  }

  getDataServiceByKey(key: string): IDataService {
    return this.dataServices.get(key);
  }

  get currentVideoService(): IVideoService {
    return this.videoServices.get(this.selectedVideoApiId);
  }

  getVideoServiceByKey(key: string): IVideoService {
    return this.videoServices.get(key);
  }

  get cookieService(): CookieService {
    return this.cookieService_;
  }

  get languageService(): LanguagesService {
    return this.languageService_;
  }

  constructor(
    private http: HttpClient,
    private cookieService_: CookieService,
    private toastr_: ToastrService,
    private languageService_: LanguagesService
  ) {
    this.retrieveMessageTypes();
    this.retrieveToastrMessageTypes();
  }

  get toastr(): ToastrService {
    return this.toastr_;
  }


  registeredVideoApiCount: number = 0;
  hasSuccessfullyRegisteredAllVideoApis(supportedApi: SupportedApi) {
    if (this.dataServices.has(supportedApi.id)) {
      this.registeredVideoApiCount += 1;
    }

    if (this.registeredVideoApiCount == this.supportedApis.length) {
      console.log("succesfully generated all video apis: " + this.registeredVideoApiCount);
    }
  }

  hasBeenInitialized: boolean = false;
  readyVideoPlayersInitList: Map<string, boolean> = new Map<string, boolean>();
  addToLoadedVideoPlayers(supportedApi: SupportedApi) {
    this.readyVideoPlayersInitList.set(supportedApi.id, true);
    if (!this.hasBeenInitialized && this.readyVideoPlayersInitList.size === this.supportedApis.length) {
      console.log("success -> all video players are ready:  " + this.readyVideoPlayersInitList.size);
      console.log("load first video");
      this.videoComponent.listenForPlayerState();
      this.switchVideo(this.initResponseMessage)
      //this.hasBeenInitialized = true;
    }
  }


  retrieveToastrMessageTypes() {
    let that = this;
    this.http
      .get("http://localhost:8080/toastr-message-types", {})
      .subscribe(function (response) {
        that.toastrMessageTypes = <any> response;
      });
  }

  retrieveMessageTypes() {
    let that = this;
    this.http
      .get("http://localhost:8080/message-types", {})
      .subscribe(function (response) {
        that.messageTypes = <any> response;
        (that.messageTypes);
      });
  }

  retrieveSupportedApis() {
    this.http
      .get("http://localhost:8080/supported-apis", {})
      .subscribe(response => {
        if (this.synctubeComponent) {
          this.synctubeComponent.supportedApis = <SupportedApi[]>response;
          this.synctubeComponent.selectedDataApi = this.synctubeComponent.supportedApis[0];
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

  getSelectedDataApi(): SupportedApi {
    return this.synctubeComponent.selectedDataApi;
  }

  buildAvailableDataServices() {
    if (this.supportedApis) {
      this.dataServices = new Map<string, IDataService>();
      for (let supportedApi of this.supportedApis) {
        switch (supportedApi.id) {
          case SupportedApiType.Youtube:
            let youTubeDataService: YoutubeDataService = new YoutubeDataService(
              this.http,
              this.synctubeComponent,
              SupportedApiType.Youtube,
              supportedApi.name
            );
            this.dataServices.set(SupportedApiType.Youtube, youTubeDataService);
            console.log(
              "Successfully generated data-api: " + youTubeDataService.name
            );
            break;
          case SupportedApiType.Dailymotion:
            let dailymotionDataService: DailymotionDataService = new DailymotionDataService(
              this.http,
              this.synctubeComponent,
              SupportedApiType.Dailymotion,
              supportedApi.name
            );
            this.dataServices.set(
              SupportedApiType.Dailymotion,
              dailymotionDataService
            );
            console.log(
              "Successfully generated data-api: " + dailymotionDataService.name
            );
            break;
          case SupportedApiType.DirectLink:

            this.dataServices.set(SupportedApiType.DirectLink, new DirectLinkDataService(this.http,
              this.synctubeComponent,
              SupportedApiType.DirectLink,
              supportedApi.name));
            console.log("Successfully generated data-api: " + supportedApi.name);
            break;



          default:
            break;
        }
      }
      return;
    }
    console.log("Couldn't build Apis");
  }

  registerSyncTubeComponent(synctubeComponent: SyncTubeComponent) {
    this.synctubeComponent = synctubeComponent;
  }

  registerVideoComponent(videoComponent: VideoComponent) {
    this.videoComponent = videoComponent;
  }

  handleCookies(): User {

    //language cookie
    let lang: string = this.cookieService.get('lang');
    if (!lang) {
      this.cookieService.set('lang', 'english', 30, '/');
      lang = 'english';
    }
    this.languageService.selectedLanguageKey = lang;


    //identifier cookie
    let user: User;
    if (this.hasCookie()) {
      user = new User();
      let cookie: AppCookie = this.getCookie();
      user.userId = cookie.userId;
      user.userKey = cookie.userKey;
    } else {
      user = new User();
      user.userId = this.generateUserId();
      user.userKey = this.generateUserKey();
    }
    let cookie = new AppCookie(user.userId, user.userKey);
    this.setCookie(cookie);
    return user;
  }

  alphabet: string[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
    ""
  );

  generateUserKey(): string {
    // 65-90, 97-122
    // return (Math.random() > 0.5d) ?  (Math.random()*26+65) :  (Math.random()*26+97);
    let key: string = "";
    for (let i = 0; i < 16; i++) {
      key += this.getRandomChar();
    }
    return key;
  }

  getRandomChar(): string {
    let index = Math.trunc(Math.random() * this.alphabet.length);
    return this.alphabet[index];
  }

  connect() {
    let user: User = this.handleCookies();
    this.setLocalUser(user);

    this.ws = new SockJS("http://localhost:8080/socket");
    this.stompClient = Stomp.over(this.ws);
    let that = this;

    this.stompClient.connect({}, function () {
      that.stompClient.subscribe("/chat/" + user.userId, messageFromServer =>
        that.handleServerResponse(messageFromServer)
      );

      let raumId: string = that.synctubeComponent.getPathId();
      if (raumId) {
        that.sendJoinRaum(user, raumId);
      } else {
        that.sendRequestPublicRaeume();
        that.synctubeComponent.revealContent = true;
      }

      // that.toastr.success("Video wurde hinzugefügt",'Testnachricht', new ToastrConfig(2000, null, null, null, null, false, false));
      // that.toastr.warning("Video wurde hinzugefügt",'Testnachricht', new ToastrConfig(2000, null, null, null, null, false, false));
      // that.toastr.error("Video wurde hinzugefügt",'Testnachricht', new ToastrConfig(2000, null, null, null, null, false, false));
    });
  }

  handleServerResponse(messageFromServer: any) {
    if (messageFromServer.body) {
      //console.log("[RESPONSE FROM SERVER]: " + messageFromServer.body);
      let message: Message = JSON.parse(messageFromServer.body);
      this.handleMessage(message);
    }
  }

  handleMessage(message: Message) {

    this.displayAsToast(message.toastrMessage);
    console.log("[<<< handling response: " + message.type + " <<<]")
    switch (message.type) {
      case this.messageTypes.CREATE_ROOM:
        this.initResponseMessage = message;
        this.createClient(message);
        this.replaceUrl(message.raumId);
        this.updateVideo(message);
        this.setInitalPlaybackRate(message.currentPlaybackRate);
        //this.retrieveRaumPlaylist();
        break;
      case this.messageTypes.JOIN_ROOM:
        this.initResponseMessage = message;
        this.createClient(message);
        this.replaceUrl(message.raumId);
        this.updateVideo(message);
        this.setInitalPlaybackRate(message.currentPlaybackRate);
        this.retrieveRaumPlaylist();
        this.retrieveHistory();
        this.retrieveToastrMessages();
        this.retrieveChatMessages();
        break;
      case this.messageTypes.UPDATE_CLIENT:
        this.updateClientChat(message);
        this.updateLocalUser(message.user);
        break;
      case this.messageTypes.INSERT_NEW_VIDEO:
        this.switchVideo(message);
        this.synctubeComponent.chatMessages.push(message.chatMessage);
        break;
      case this.messageTypes.CHAT_MESSAGE:
        this.synctubeComponent.addChatMessage(message.chatMessage);
        this.synctubeComponent.forceScrollToChatBottom = true;
        break;
      case this.messageTypes.SEEK_TO_TIMESTAMP:
        this.videoComponent.currentTimestamp = message.video.timestamp;
        this.videoComponent.currentTimeProgressbar = message.video.timestamp;
        this.videoComponent.currentDisplayedTime = message.video.timestamp;
        this.seekTo(this.videoComponent.currentTimestamp, true);
        this.togglePlayVideo(this.getReceivedPlayerState());
        break;
      case this.messageTypes.TOGGLE_PLAY:
        this.videoComponent.currentDisplayedTime = message.video.timestamp;
        this.videoComponent.currentTimeProgressbar = message.video.timestamp;
        this.updateVideo(message);
        this.seekTo(message.video.timestamp, true);
        this.togglePlayVideo(message.playerState);
        break;
      case this.messageTypes.DISCONNECT:
        break;
      case this.messageTypes.ASSIGNED_AS_ADMIN:
        this.assignedAsAdmin(message.user);
        this.updateClientChat(message);
        break;
      case this.messageTypes.TO_PUBLIC_ROOM:
        this.setRaumStatus(message.raumStatus);
        this.updateClientChat(message);
        break;
      case this.messageTypes.TO_PRIVATE_ROOM:
        this.setRaumStatus(message.raumStatus);
        this.updateClientChat(message);
        //this.setLocalUser(message.user);
        break;
      case this.messageTypes.SWITCH_VIDEO:
        this.switchVideo(message);
        this.updateHistory(message);
        break;
      case this.messageTypes.UPDATE_KICKED_USERS:
        this.updateKickedUsers(message);
        break;
      case this.messageTypes.KICKED_USER:
        this.resetClient();
        break;
      case this.messageTypes.UPDATE_PLAYLIST:
        if (message.video) {
          this.updateVideo(message);
          this.switchVideo(message);
          this.updateHistory(message);
        }
        if (message.chatMessage) {
          this.synctubeComponent.chatMessages.push(message.chatMessage);
        }
        this.retrieveRaumPlaylist();
        this.synctubeComponent.displayTab = 2;
        break;
      case this.messageTypes.REQUEST_SYNC_TIMESTAMP:
        let syncVideo: Video = new Video();
        syncVideo.videoId = this.getVideo().videoId;
        syncVideo.timestamp = this.getCurrentTime();
        this.sendCurrentTimeStamp(this.getLocalUser(), this.getRaumId(), syncVideo);
        break;
      case this.messageTypes.REMOVE_VIDEO_PLAYLIST:
        this.synctubeComponent.playlist = this.getLocalPlaylist().filter(
          videoToRemove => videoToRemove.id !== message.playlistVideo.id
        );
        this.updateVideo(message);
        this.switchVideo(message);
        break;
      case this.messageTypes.UPDATE_KICK_CLIENT:
        this.updateKickedUsers(message);
        this.updateClientChat(message);
        this.setRaumId(message.raumId);
        this.replaceUrl(message.raumId);
        break;
      case this.messageTypes.REFRESH_ROOM_ID:
        this.setRaumId(message.raumId);
        this.replaceUrl(message.raumId);
        break;
      case this.messageTypes.REFRESH_USER_AND_LIST:
        this.updateClientChat(message);
        //this.setLocalUser(message.user);
        break;
      case this.messageTypes.REFRESH_USERLIST:
        this.updateClientChat(message);
        break;
      case this.messageTypes.ADDED_VIDEO_TO_PLAYLIST:
        break;
      case this.messageTypes.UPDATE_TITLE_AND_DESCRIPTION:
        this.updateRaumTitleAndDescription(
          message.raumTitle,
          message.raumDescription
        );
        break;
      case this.messageTypes.IMPORTED_PLAYLIST:
        break;
      case this.messageTypes.CHANGED_PLAYBACK_RATE:
        this.setPlaybackRate(message.currentPlaybackRate);
        break;
      case this.messageTypes.MUTE_USER: // TODO:
        this.updateLocalUser(message.user);
        break;
      case this.messageTypes.PARDONED_KICKED_USER:
        // TODO:
        break;
      case this.messageTypes.TOGGLE_PLAYLIST_RUNNING_ORDER:
        this.synctubeComponent.randomOrder = message.randomOrder;
        break;
      case this.messageTypes.TOGGLE_PLAYLIST_LOOP:
        this.synctubeComponent.loop = message.loop;
        break;
      case "error":
        this.toastr.error("error", "ERROR", {
          disableTimeOut: true,
          tapToDismiss: true
        });
        break;
      default:
        this.toastr.warning("unkown behaviour", "warning", {
          disableTimeOut: true,
          tapToDismiss: true
        });
        break;
    }

    if (message.type == "error") {
      console.log("[ERROR from Server]");
      return;
    }
  }

  addToToastrMessages(toastrMessage: ToastrMessage) {
    this.synctubeComponent.toastrMessages.push(toastrMessage);
  }

  displayAsToast(toastrMessage: ToastrMessage) {
    if (toastrMessage) {
      if (!toastrMessage.onlyLogging) {
        // this.toastr.success("Raum #" + this.getRaumId() + " wurde von " + this.getLocalUser().userName + ' erstellt', 'Raum erstellt:', ToastrConfigs.SUCCESS);
        switch (toastrMessage.type) {
          case this.toastrMessageTypes.CREATE_ROOM:
            this.toastr.success(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$created_new_room"),
              ToastrConfigs.SUCCESS
            );
            break;
          case this.toastrMessageTypes.JOIN_ROOM:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$has_joined_room"),
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.DISCONNECT:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$has_left_room"),
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.ASSIGNED_AS_ADMIN:
            this.toastr.success(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$assigned_admin") + " " + toastrMessage.target,
              ToastrConfigs.SUCCESS
            );
            break;
          case this.toastrMessageTypes.TO_PUBLIC_ROOM:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$room_to_public"),
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.TO_PRIVATE_ROOM:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$room_to_private"),
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.KICKED_USER:
            this.toastr.error(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$user_kicked"),
              ToastrConfigs.ERROR
            );
            break;
          case this.toastrMessageTypes.UPDATE_KICK_CLIENT:
            this.toastr.warning(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$user_kicked") + " " + toastrMessage.target,
              ToastrConfigs.WARNING
            );
            break;
          case this.toastrMessageTypes.REFRESH_ROOM_ID:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$refresh_room_id") + " " + toastrMessage.target,
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.ADDED_VIDEO_TO_PLAYLIST:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$added_video") + " " + toastrMessage.target,
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.UPDATE_TITLE_AND_DESCRIPTION:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$changed_room_description") + " " + toastrMessage.target,
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.REMOVE_VIDEO_PLAYLIST:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$removed_video") + " " + toastrMessage.target,
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.IMPORTED_PLAYLIST:
            this.toastr.success(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate(toastrMessage.message),
              ToastrConfigs.SUCCESS
            );
            break;
          case this.toastrMessageTypes.CHANGED_PLAYBACK_RATE:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$changed_playback_rate") + " " + toastrMessage.target,
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.MUTE_USER:
            this.toastr.warning(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate(toastrMessage.message) + " " + toastrMessage.target,
              ToastrConfigs.WARNING
            );
            break;
          case this.toastrMessageTypes.CHANGED_USER_NAME:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$changed_name") + " " + toastrMessage.target,
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.PARDONED_KICKED_USER:
            this.toastr.info(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$pardoned") + " " + toastrMessage.target,
              ToastrConfigs.INFO
            );
            break;
          case this.toastrMessageTypes.DELETED_PLAYLIST:
            this.toastr.warning(
              "",
              toastrMessage.origin + " " + this.languageService.interpolate("$removed_playlist"),
              ToastrConfigs.WARNING
            );
            break;
        }
      }
      this.addToToastrMessages(toastrMessage);
    }
  }

  setRaumId(raumId: string) {
    this.synctubeComponent.raumId = raumId;
  }

  resetClient() {
    //this.synctubeComponent.generateUserId();
    this.synctubeComponent.raumId = undefined;
    this.synctubeComponent.chatMessages = [];
    this.synctubeComponent.raumStatus = undefined;
    this.synctubeComponent.videoDuration = 0;
    this.synctubeComponent.clearRoomVars();
  }

  getReceivedPlayerState(): number {
    return this.synctubeComponent.getReceivedPlayerState();
  }

  replaceUrl(raumId: string) {
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
  }

  waitForSwitchtingVideo: any;
  switchVideo(message: Message) {

    if (message && message.video) {

      this.updateVideo(message);
      this.selectedVideoApiId = message.video.api;
      this.setDisplayedIframe();
      this.loadVideoById({
        videoId: message.video.videoId,
        startSeconds: message.video.timestamp,
        autoplay: message.playerState != Constants.PLAYING ? false : true
      });
      this.videoComponent.currentTimeProgressbar = message.video.timestamp;
      this.videoComponent.currentDisplayedTime = message.video.timestamp;
      this.synctubeComponent.forceScrollToChatBottom = true;

      let that = this;
      if (this.waitForSwitchtingVideo) {
        clearInterval(this.waitForSwitchtingVideo)
        this.waitForSwitchtingVideo = null;
      }
      this.waitForSwitchtingVideo = setInterval(function () {
        let currentPlayerState = that.getPlayerState();
        if (currentPlayerState == Constants.PLAYING) {
          that.setProgressbarVideoDuration(that.currentVideoService.getVideoDuration());
          that.setPlaybackRates(that.currentVideoService.getAvailablePlaybackRates());
          that.setPlaybackRate(message.currentPlaybackRate);
          that.togglePlayVideo(that.getReceivedPlayerState());
          clearInterval(that.waitForSwitchtingVideo);

          /* if room is joined we request additional sync */
          if (message.type = that.messageTypes.JOIN_ROOM) {
            that.sendRequestSyncTimestamp()
          }
        }
      }, 20);
    }
  }

  setDisplayedIframe() {
    this.videoServices.forEach((videoService: IVideoService) => {
      if (videoService.supportedApi.id === this.selectedVideoApiId) {
        videoService.unHide();
      } else {
        videoService.hide();
      }
    });
  }

  /*
  updatePlaylist(playlist: Video[]) {
    this.synctubeComponent.playlist = playlist;
  }*/

  updateHistory(message: Message) {
    if (message && message.video) {
      this.synctubeComponent.history.push(message.video);
    }
  }

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

  generateUserId(): string {
    return (
      Math.floor(Date.now() / 1000) + "" + Math.floor(Math.random() * 10000)
    );
  }

  sendRequestPublicRaeume() {
    console.log("[request public rooms]");
    this.synctubeComponent.publicRaeume = <Observable<Raum[]>>(
      this.http.get(
        "http://localhost:8080/publicrooms/userId/" + this.getUserId(),
        {}
      )
    );
  }

  sendChatMessage(message: Message) {
    //console.log("[send chatmessage... " + message + "]");
    this.stompClient.send(
      "/app/send/chat-message",
      {},
      JSON.stringify(message)
    );
  }

  sendcreateRaum(user: User, raumStatus: Boolean) {
    //console.log("[create Raum...] " + user);
    this.stompClient.send(
      "/app/send/create-room",
      {},
      JSON.stringify({ user: user, raumStatus: raumStatus })
    );
  }

  sendJoinRaum(user: User, raumId: string) {
    console.log("[join-raum:]  " + raumId);
    this.stompClient.send(
      "/app/send/join-room",
      {},
      JSON.stringify({ user: user, raumId: raumId })
    );
  }

  sendChangeUserName(user: User, raumId: string) {
    //console.log("[change-user-name:] " + user.userName + " " + raumId);
    this.stompClient.send(
      "/app/send/change-user-name",
      {},
      JSON.stringify({ user: user, raumId: raumId })
    );
  }

  sendSeekToTimestamp(
    user: User,
    raumId: string,
    videoId: string,
    timestamp: number
  ) {
    //console.log("[seekto-timestamp:] " + timestamp);
    let video: Video = new Video();
    video.videoId = videoId;
    video.timestamp = timestamp;
    this.stompClient.send(
      "/app/send/seekto-timestamp",
      {},
      JSON.stringify({ user: user, raumId: raumId, video: video })
    );
  }

  sendCurrentTimeStamp(user: User, raumId: string, video: Video) {
    //console.log("[seekto-timestamp:] " + video);
    this.stompClient.send(
      "/app/send/current-timestamp",
      {},
      JSON.stringify({ user: user, raumId: raumId, video: video })
    );
  }

  sendNewVideo(user: User, raumId: string, video: Video) {
    //console.log("[send-new-video:] " + video);
    if (video) {
      this.stompClient.send(
        "/app/send/receive-new-video",
        {},
        JSON.stringify({ user: user, raumId: raumId, video: video })
      );
    }
  }

  updateLocalUser(user: User) {
    if (user) {
      let currentUser = this.getLocalUser();
      currentUser.userId = user.userId;
      currentUser.userName = user.userName;
      currentUser.mute = user.mute;
      currentUser.admin = user.admin;
    }
  }

  sendUpdateTitleAndDescription(
    user: User,
    raumId: string,
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

  sendSwitchPlaylistVideo(user: User, raumId: string, playlistVideo: Video) {
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
    raumId: string,
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

  sendAutoNextPlaylistVideo(user: User, raumId: string, playerState: number) {
    this.stompClient.send(
      "/app/send/auto-next-playlist-video",
      {},
      JSON.stringify({ user: user, raumId: raumId, playerState: playerState })
    );
  }

  sendTogglePlaylistLoop(user: User, raumId: string, loop: number) {
    this.stompClient.send(
      "/app/send/toggle-playlist-loop",
      {},
      JSON.stringify({ user: user, raumId: raumId, loop: loop })
    );
  }

  sendTogglePlaylistRunningOrder(
    user: User,
    raumId: string,
    randomOrder: boolean
  ) {
    this.stompClient.send(
      "/app/send/toggle-playlist-running-order",
      {},
      JSON.stringify({ user: user, raumId: raumId, randomOrder: randomOrder })
    );
  }

  sendToggleMuteUser(user: User, raumId: string, assignedUser: User) {
    //console.log(assignedUser);
    this.stompClient.send(
      "/app/send/toggle-mute-user",
      {},
      JSON.stringify({ user: user, raumId: raumId, assignedUser: assignedUser })
    );
  }

  sendPardonKickedUser(user: User, raumId: string, kickedUser: User) {
    this.stompClient.send(
      "/app/send/pardon-kicked-user",
      {},
      JSON.stringify({ user: user, raumId: raumId, assignedUser: kickedUser })
    );
  }

  sendDisconnectMessage(user: User, raumId: string) {
    //console.log("[disconnect-client:] " + user);
    this.stompClient.send(
      "/app/send/disconnect-client",
      {},
      JSON.stringify({ user: user, raumId: raumId })
    );
  }

  sendTogglePlay(
    user: User,
    raumId: string,
    playerState: number,
    video: Video,
    currentTime: number
  ) {
    //console.log("[toggle-play:] " + user);
    let message: Message = new Message();
    video.timestamp = currentTime;
    message.video = video;
    message.user = user;
    message.raumId = raumId;
    message.playerState = playerState;
    this.stompClient.send("/app/send/toggle-play", {}, JSON.stringify(message));
  }

  sendAssignAdmin(raumId: string, user: User, assignedUser: User) {
    //console.log("[assign-as-admin:] " + assignedUser);
    this.stompClient.send(
      "/app/send/assign-admin",
      {},
      JSON.stringify({ raumId: raumId, user: user, assignedUser: assignedUser })
    );
  }

  sendKickUser(raumId: string, user: User, assignedUser: User) {
    //console.log("[kick-user:] " + assignedUser);
    this.stompClient.send(
      "/app/send/kick-user",
      {},
      JSON.stringify({ assignedUser: assignedUser, raumId: raumId, user: user })
    );
  }

  sendToPublicRoomRequest(raumId: string, user: User) {
    //console.log("[switch-to-public-room:] " + user);
    this.stompClient.send(
      '/app/send/to-public-room',
      {},
      JSON.stringify({ raumId: raumId, user: user })
    );
  }

  sendToPrivateRoomRequest(raumId: string, user: User) {
    //console.log("[switch-to-private-room:] " + user);
    this.stompClient.send(
      "/app/send/to-private-room",
      {},
      JSON.stringify({ raumId: raumId, user: user })
    );
  }

  sendRefreshRaumId(raumId: string, user: User) {
    //console.log("[refresh-RaumId:] " + user);
    this.stompClient.send(
      "/app/send/refresh-raumid",
      {},
      JSON.stringify({ raumId: raumId, user: user })
    );
  }

  retrieveRaumPlaylist() {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.http
      .get("http://localhost:8080/room/" + this.getRaumId() + "/playlist", { headers }).subscribe((playlist: Video[]) => {
        //console.log(playlist);
        this.synctubeComponent.playlist = playlist;
        if (this.synctubeComponent.playlist.length == 0) {
          //this.stopVideo();
        }
      });
  }

  retrieveHistory() {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.http
      .get("http://localhost:8080/room/" + this.getRaumId() + "/history", { headers })
      .subscribe((history: Video[]) => {
        //console.log(history);
        this.synctubeComponent.history = history;
      });
  }

  retrieveToastrMessages() {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    let that = this;
    this.http
      .get("http://localhost:8080/room/" + this.getRaumId() + "/user/" + this.getUserId() + "/toastr-messages", { headers }).subscribe((response: ToastrMessage[]) => {
        let incomingToastrMessages: ToastrMessage[] = response;
        for (let itm of incomingToastrMessages) {
          that.synctubeComponent.toastrMessages.push(itm);
        }
        //console.log(that.synctubeComponent.toastrMessages);
      });
  }

  retrieveChatMessages() {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    let that = this;
    this.http.get("http://localhost:8080/room/" + this.getRaumId() + "/user/" + this.getUserId() + "/chat-messages", { headers }).subscribe((response: ChatMessage[]) => {
      that.synctubeComponent.addAllChatMessages(response);
    });
  }


  sendImportPlaylist(
    raumId: string,
    user: User,
    importedPlaylist: ImportedPlaylist
  ) {
    //console.log("[import-playlist:] " + user + " | playlist: " + importedPlaylist);

    if (importedPlaylist) {
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      // /room/{raumId}/playlist/
      importedPlaylist.user = user;
      this.http
        .post(
          "http://localhost:8080/room/" +
          raumId +
          "/playlist",
          importedPlaylist, { headers })
        .subscribe(response => {
          (response);
        });
    }
  }

  sendRemoveVideoFromPlaylist(
    raumId: string,
    user: User,
    playlistVideo: Video
  ) {
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

  sendAddVideoToPlaylist(raumId: string, user: User, playlistvideo: Video) {
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

  sendAddVideoToPlaylistAsNext(raumId: string, user: User, playlistvideo: Video) {
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
    raumId: string,
    user: User,
    playlistvideo: Video
  ) {
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

  sendClearPlaylist(user: User, raumId: string) {
    this.stompClient.send(
      "/app/send/clear-playlist",
      {},
      JSON.stringify({ raumId: raumId, user: user })
    );
  }

  sendRequestSyncTimestamp() {
    console.log("REQUEST SYNC")
    this.stompClient.send(
      "/app/send/request-sync-timestamp",
      {},
      JSON.stringify({ raumId: this.getRaumId(), user: this.getLocalUser() })
    );
  }

  getCurrentTime(): number {
    return this.currentVideoService.getCurrentTime();
  }

  getPlayerState(): number {
    return this.currentVideoService.getPlayerState();
  }

  seekTo(seconds: number, allowSeekAhead: Boolean): void {
    this.currentVideoService.seekTo(seconds, allowSeekAhead);
  }

  pauseVideo(): void {
    this.currentVideoService.pauseVideo();
  }

  stopVideo(): void {
    this.currentVideoService.stopVideo();
  }

  playVideo() {
    this.currentVideoService.playVideo();
  }

  /*
  togglePlayVideo(toggle: number): void {
    this.videoComponent.togglePlayVideo(toggle);
  }*/

  stopUpdatingVideo() {
    clearInterval(this.timer);
  }

  updateVideoContinously(that: SyncService) {
    if (that.timer) {
      clearInterval(that.timer);
      that.timer = null;
    }

    that.timer =
      setInterval(function () {
        that.videoComponent.currentTimeProgressbar += 0.01 * that.getPlaybackRate();
        that.videoComponent.currentDisplayedTime = that.getCurrentTime();
        that.synctubeComponent.video.timestamp = that.videoComponent.currentDisplayedTime;
      }, 10);
  }

  timer: any;
  togglePlayVideo(playerState: number) {
    if (playerState == Constants.PLAYING) {
      this.playVideo();
      this.videoComponent.isPlaying = true;
      this.updateVideoContinously(this);
      return;
    }
    if (playerState == Constants.PAUSED) {
      this.pauseVideo();
      this.videoComponent.isPlaying = false;
      clearInterval(this.timer);
      return;
    }
  }

  loadVideoById(urlObject: any) {
    if (this.currentVideoService) {
      this.currentVideoService.loadVideoById(urlObject);
    }
  }

  setProgressbarVideoDuration(duration: number) {
    this.videoComponent.setProgressbarVideoDuration(duration);
  }


  setPlaybackRates(rates: number[]) {
    this.videoComponent.setPlaybackRates(rates);
  }

  getUserId(): string {
    return this.synctubeComponent.getUserId();
  }

  getLocalUser(): User {
    return this.synctubeComponent.getUser();
  }

  getRaumId(): string {
    return this.synctubeComponent.getRaumId();
  }

  mute(): void {
    this.currentVideoService.mute();
  }

  unMute(): void {
    this.currentVideoService.unMute();
  }

  isMuted(): Boolean {
    return this.currentVideoService.isMuted();
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
    return this.currentVideoService.getVideoDuration();
  }

  getAvailablePlaybackRates(): Array<number> {
    return this.currentVideoService.getAvailablePlaybackRates();
  }

  getPlaybackRate(): number {
    return this.currentVideoService.getPlaybackRate();
  }

  setPlaybackRate(rate: number) {
    if (this.videoComponent) {
      this.currentVideoService.setPlaybackRate(rate);
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

  toggleSubtitle(_module, option, value) { }

  toggleDisplayOptions() {
    this.videoComponent.toggleDisplayOptions();
  }

  toggleFullscreen() {
    this.videoComponent.toggleDisplayFullscreen();
  }

  getCookie(): AppCookie {
    if (this.hasCookie()) {
      return JSON.parse(this.cookieService.get(Constants.COOKIE_KEY));
    }
  }

  hasCookie(): boolean {
    return this.cookieService.check(Constants.COOKIE_KEY);
  }

  setCookie(cookie: AppCookie) {
    //name: string, value: string, expires?: number | Date, path?: string, domain?: string, secure?: boolean, sameSite?: 'Lax' | 'Strict' 
    this.cookieService.set(Constants.COOKIE_KEY, JSON.stringify(cookie), 30, '/');
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
      let raumId: string = this.getRaumId();
      let user: User = this.getLocalUser();
      let videoId: string = this.getVideo().videoId;
      let currentTime: number = this.getCurrentTime();
      this.sendSeekToTimestamp(user, raumId, videoId, currentTime + offset);
    }
  }

  startDisplayingSeconds() {
    this.videoComponent.startDisplayingSeconds();
  }

}
