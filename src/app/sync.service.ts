import { Injectable } from '@angular/core';
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import $ from 'jquery';
import { Raum } from './raum';
import { Message } from './message';
import { VideoComponent } from './video/video.component';
import { SyncTubeComponent } from "./sync-tube/sync-tube.component";
import { ChatMessage } from './chat-message';
import { User } from './sync-tube/user';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video } from './video/video';
import { CookieService } from 'ngx-cookie-service';
import { UrlResolver } from '@angular/compiler';
import * as fs_1 from 'fs';


@Injectable({
  providedIn: 'root'
})
export class SyncService {

  //PLAYERSTATES
  static notStarted: number = -1;
  static finished: number = 0;
  static playing: number = 1;
  static paused: number = 2;
  static buffering: number = 3;
  static placed: number = 5; //video platziert


  static cookieKey: string = 'U_COOKIE'

  /***
   * 
   * add chromecast connection (** laterlater**)

   * add stats page for admins (debug)
   *
   * FOR GORAN
   * kinomodus : player.setSize() iframe api
   * zeit anzeige in "controls" fertig 
   * 
   */

  v: any;
  ws: SockJS;
  private stompClient;

  synctubeComponent: SyncTubeComponent;
  videoComponent: VideoComponent
  cookie: string;

  constructor(private http: HttpClient, private cookieService: CookieService) {
    this.loadDocument();
    /*  this.http.get('http://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=FYH8DsU2WCk&format=json', {'Access-Control-Allow-Origin'})
      .subscribe(w => console.log(w));
  */

    if (this.cookieService.check(SyncService.cookieKey))
      this.cookie = this.cookieService.get(SyncService.cookieKey);
  }

  registerSyncTubeComponent(synctubeComponent: SyncTubeComponent) {
    this.synctubeComponent = synctubeComponent;
  }

  registerVideoComponent(videoComponent: VideoComponent) {
    this.videoComponent = videoComponent;
  }

  connect(user: User) {
    this.ws = new SockJS('http://localhost:8080/socket');
    this.stompClient = Stomp.over(this.ws);
    let that = this;


    this.stompClient.connect({}, function () {
      that.stompClient.subscribe("/chat/" + user.userId, (messageFromServer) => {
        if (messageFromServer.body) {
          console.log("[Response]: " + messageFromServer.body);
          let message: Message = JSON.parse(messageFromServer.body);
          that.handleMessage(message);
        }
      });

      let raumId: number = that.synctubeComponent.getPathId();
      if (raumId) {
        that.sendJoinRaum(user, raumId);
      } else {
        that.sendRequestPublicRaeume(that.getLocalUser());
        that.synctubeComponent.revealContent = true;
      }

    });
  }


  handleMessage(message: Message) {
    if (message.type == "toggle-play") {
      console.log(message)

      this.videoComponent.currentDisplayedTime = message.video.timestamp;
      this.videoComponent.currentTimeProgressbar = message.video.timestamp;
      this.seekTo(message.video.timestamp, true);
      this.togglePlayVideo(message.playerState);
      this.updateVideo(message);

      return;
    }

    if (message.type == "assigned-as-admin") {
      console.log(message)
      this.assignedAsAdmin(message.user);
      this.updateClientChat(message);
      return;
    }

    if (message.type == "all-chat-messages") {
      console.log(message) //SERVER SENDING ALL ?
      this.synctubeComponent.addAllChatMessages(message.chatMessages);
      this.synctubeComponent.forceScrollToChatBottom = true;
      return;
    }

    if (message.type == "seekto-timestamp") {
      console.log(message)
      this.videoComponent.currentTimestamp = message.video.timestamp;
      this.videoComponent.currentTimeProgressbar = message.video.timestamp;
      this.videoComponent.currentDisplayedTime = message.video.timestamp;
      //this.videoComponent.currentTime = this.videoComponent.currentTimestamp;
      this.seekTo(this.videoComponent.currentTimestamp, true);
      this.togglePlayVideo(this.getReceivedPlayerState());
      return;
    }

    if (message.type == 'chat-message') {
      console.log(message)
      this.synctubeComponent.addChatMessage(message.chatMessage);
      this.synctubeComponent.forceScrollToChatBottom = true;
      return;
    }

    if (message.type == 'update-client') {
      console.log(message);
      this.updateClientChat(message);
      return;
    }

    if (message.type == 'request-sync-timestamp') {
      console.log(message);
      let v: Video = new Video();
      v.videoId = this.getVideo().videoId;
      v.timestamp = this.getCurrentTime();
      this.sendCurrentTimeStamp(this.getLocalUser(), this.getRaumId(), v)
      return;
    }


    if (message.type == 'update-kick-client') {
      console.log(message);
      this.updateClientChat(message);
      this.setRaumId(message.raumId);
      this.replaceUrl(message.raumId);
      return;
    }


    if (message.type == 'to-public-room') {
      console.log("[to public room: ]" + message);
      this.setRaumStatus(message.raumStatus);
      this.updateClientChat(message);
      return;
    }

    if (message.type == 'to-private-room') {
      console.log("[to private room: ]" + message);
      this.setRaumStatus(message.raumStatus);
      this.updateClientChat(message);
      this.setLocalUser(message.user);
      return;
    }
    if (message.type == 'add-video-to-playlist') {
      console.log(message.users);
      this.updatePlaylist(message.playlist)
      return;
    }

    if (message.type == 'create-room') {
      this.createClient(message);
      this.replaceUrl(message.raumId);
      this.updateVideo(message);
      this.updatePlaylist(message.playlist);

      //this.updateVideo(message);
      console.log(message.users);
      return;
    }


    if (message.type == 'join-room') {
      this.createClient(message);
      this.replaceUrl(message.raumId);
      this.updateVideo(message);
      this.updatePlaylist(message.playlist);
      // this.updateVideo(message);
      console.log(message.users);
      return;
    }

    if (message.type == 'insert-new-video') {
      this.updateVideo(message);
      this.loadVideoById({
        videoId: message.video.videoId,
        startSeconds: message.video.timestamp,
        suggestedQuality: 'large'
      });
      this.videoComponent.currentTimeProgressbar = message.video.timestamp;
      this.videoComponent.currentDisplayedTime = message.video.timestamp;
      this.synctubeComponent.chatMessages.push(message.chatMessage)

      //this.setVideoDuration(this.getVideoDuration());
      //this.setPlaybackRates();
      //this.togglePlayVideo(this.synctubeComponent.playerState);
      let that = this;
      let wait = setInterval(function () {
        if (that.getPlayerState() == SyncService.playing) {
          that.setVideoDuration();
          that.togglePlayVideo(that.getReceivedPlayerState())
          clearInterval(wait);
        }
      }, 20);

      return;
    }

    if (message.type == 'request-public-raeume') {
      this.setPublicRaeume(message.publicRaeume);
      console.log(message.publicRaeume)
      return;
    }

    if (message.type == 'kicked-user') {
      console.log(message)
      this.resetClient();
      return;
    }

    if (message.type == 'refresh-raumid') {
      console.log(message)
      this.setRaumId(message.raumId);
      this.replaceUrl(message.raumId);
    }

    if (message.type == 'error') {
      console.log("[ERROR from Server]")
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
    window.history.replaceState({}, '', url);
  }

  updateVideo(message: Message) {
    this.synctubeComponent.video = message.video;
    this.synctubeComponent.receivedPlayerState = message.playerState;
  }

  updatePlaylist(playlist: Video[]) {
    this.synctubeComponent.updatePlaylist(playlist);
  }

  updateClientChat(message: Message) {
    this.synctubeComponent.users = message.users;
    this.synctubeComponent.chatMessages.push(message.chatMessage);
    this.synctubeComponent.forceScrollToChatBottom = true;
  }

  createClient(message: Message) {
    this.synctubeComponent.revealContent = true;
    this.synctubeComponent.user = message.user;
    this.synctubeComponent.video = message.video;
    this.synctubeComponent.raumId = message.raumId;
    this.synctubeComponent.users = message.users;
    this.synctubeComponent.chatMessages = <ChatMessage[]>message.chatMessages;
    this.synctubeComponent.raumStatus = message.raumStatus;
  }

  localCloseConnection() {
    this.ws.close();
  }

  generateUserId() {
    if (!this.getLocalUser()) {
      this.setLocalUser(new User());
    }
    this.getLocalUser().userId = parseInt(Math.floor(Date.now() / 1000) + "" + Math.floor(Math.random() * 10000));
  }

  sendRequestPublicRaeume(user: User) {
    console.log("[request public rooms]");
    this.stompClient.send("/app/send/request-public-raeume", {}, JSON.stringify({ 'user': user }));
  }

  sendChatMessage(message: Message) {
    console.log("[send chatmessage... " + message + "]")
    this.stompClient.send("/app/send/chat-message", {}, JSON.stringify(message));
  }

  sendcreateRaum(user: User, raumStatus: Boolean) {
    console.log("[create Raum...] " + user)
    this.stompClient.send("/app/send/create-room", {}, JSON.stringify({ 'user': user, 'raumStatus': raumStatus }));
  }

  sendJoinRaum(user: User, raumId: number) {
    console.log("[join-raum:] " + user.userId + " " + raumId);
    this.stompClient.send("/app/send/join-room", {}, JSON.stringify({ 'user': user, 'raumId': raumId }));
  }

  sendTimestamp(userId: number, raumId: number, video: Video) {
    console.log("[sync-timestamp:] " + video.timestamp);
    this.stompClient.send("/app/send/sync-timestamp", {}, JSON.stringify({ 'userId': userId, 'raumId': raumId, 'video': video }));
  }

  sendSeekToTimestamp(user: User, raumId: number, videoId: string, timestamp: number) {
    console.log("[seekto-timestamp:] " + timestamp);
    let video: Video = new Video();
    video.videoId = videoId;
    video.timestamp = timestamp;
    this.stompClient.send("/app/send/seekto-timestamp", {}, JSON.stringify({ 'user': user, 'raumId': raumId, 'video': video }));
  }

  sendCurrentTimeStamp(user: User, raumId: number, video: Video) {
    console.log("[seekto-timestamp:] " + video);
    this.stompClient.send("/app/send/current-timestamp", {}, JSON.stringify({ 'user': user, 'raumId': raumId, 'video': video }));
  }


  sendNewVideo(user: User, raumId: number, video: Video) {
    console.log("[send-new-video:] " + video);
    if (video) {
      this.stompClient.send("/app/send/receive-new-video", {}, JSON.stringify({ 'user': user, 'raumId': raumId, 'video': video }));
    }
  }

  sendUpdateTitleAndDescription(user: User, raumId: number, raumTitle: string, raumDescription: string) {
    this.stompClient.send("/app/send/update-title-and-description", {}, JSON.stringify({ 'user': user, 'raumId': raumId, 'raumDescription': raumDescription, 'raumTitle': raumTitle }));
  }

  sendNewVideoAndGetTitleFirst(user: User, raumId: number, video: Video) {
    let that = this;
    this.http.get('https://noembed.com/embed?url=https://www.youtube.com/watch?v=' + video.videoId).subscribe(data => {
      let data_: any = data;
      video.title = data_.title;
      that.sendNewVideo(user, raumId, video);
    });

  }

  loadDocument() {

    fs_1.readFile('apikey.apikey', (err, data) => {
      if (err) throw err;

      console.log(data.toString());
    })
  }

  APIKEY: string;

  search(query: string, mode: boolean, timestamp?: number) {
    let params: HttpParams = new HttpParams();
    params.append('q', query);
    this.http.get('https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&&key=' + this.APIKEY + '&q=' + query).subscribe(response => {
      console.log(response);
      let data: any = response;
      let items: any[] = data.items;
      let vids: Video[] = items.filter(i => (i.id.videoId) ? true : false).map(item => {
        let video: Video = new Video();
        video.videoId = item.id.videoId;
        video.title = item.snippet.title;
        video.description = item.snippet.description;
        video.publishedAt = item.snippet.publishedAt;
        /*this.http.get('https://noembed.com/embed?url=https://www.youtube.com/watch?v=' + video.videoId).subscribe(res => {
          let data_: any = res;
          video.title = data_.title;
        });*/
        return video;
      });
      if (mode) {
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

  sendDisconnectMessage(user: User, raumId: number) {
    console.log("[disconnect-client:] " + user);
    this.stompClient.send("/app/send/disconnect-client", {}, JSON.stringify({ 'user': user, 'raumId': raumId }));
  }


  sendTogglePlay(user: User, raumId: number, playerState: number, video: Video, currentTime: number) {
    console.log("[toggle-play:] " + user);
    let message: Message = new Message();
    video.timestamp = currentTime
    message.video = video;
    message.user = user;
    message.raumId = raumId;
    message.playerState = playerState;
    this.stompClient.send("/app/send/toggle-play", {}, JSON.stringify(message));
  }

  sendAssignAdmin(raumId: number, user: User, assignedUser: User) {
    console.log("[assign-as-admin:] " + assignedUser);
    this.stompClient.send("/app/send/assign-admin", {}, JSON.stringify({ 'raumId': raumId, 'user': user, 'assignedUser': assignedUser }));
  }

  sendKickUser(raumId: number, user: User, assignedUser: User) {
    console.log("[kick-user:] " + assignedUser);
    this.stompClient.send("/app/send/kick-user", {}, JSON.stringify({ 'assignedUser': assignedUser, 'raumId': raumId, 'user': user }));
  }

  sendToPublicRoomRequest(raumId: number, user: User) {
    console.log("[switch-to-public-room:] " + user);
    this.stompClient.send("/app/send/to-public-room", {}, JSON.stringify({ 'raumId': raumId, 'user': user }));
  }


  sendToPrivateRoomRequest(raumId: number, user: User) {
    console.log("[switch-to-private-room:] " + user);
    this.stompClient.send("/app/send/to-private-room", {}, JSON.stringify({ 'raumId': raumId, 'user': user }));
  }

  sendRefreshRaumId(raumId: number, user: User) {
    console.log("[refresh-RaumId:] " + user);
    this.stompClient.send("/app/send/refresh-raumid", {}, JSON.stringify({ 'raumId': raumId, 'user': user }));
  }

  sendAddVideoToPlaylist(raumId: number, user: User, video: Video) {
    console.log("[add-video-to-playlist:] " + user + " | video: " + video.videoId);
    if (video) {
      this.stompClient.send("/app/send/add-video-to-playlist", {}, JSON.stringify({ 'raumId': raumId, 'user': user, 'video': video }));
    }
  }

  sendRequestSyncTimestamp() {
    console.log("[request-sync-timestamp]");
    this.stompClient.send("/app/send/request-sync-timestamp", {}, JSON.stringify({ 'raumId': this.getRaumId(), 'user': this.getLocalUser() }));
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

  togglePlay() {

  }

  toggleMute() {
    if (this.isMuted()) {
      this.unMute();

    } else {
      this.mute();
    }
  }

  setPublicRaeume(publicRaeume: Raum[]) {
    this.synctubeComponent.setPublicRaeume(publicRaeume);
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
    this.videoComponent.setPlaybackRate(rate);
  }

  getOptions() {
    return this.videoComponent.getOptions();
  }

  toggleSubtitle(_module, option, value) {
    this.setOption(_module, option, value);
  }

  setOption(_module, option, value) {
    this.videoComponent.setOption(_module, option, value);

  }

  toggleDisplayOptions() {
    this.videoComponent.toggleDisplayOptions();
  }

  setSize(width: number, height: number) {
    this.videoComponent.setSize(width, height);
  }

  toggleFullscreen() {
    this.videoComponent.toggleDisplayFullscreen();
  }

  setIframe(iframe: any) {
    this.videoComponent.setIframe(iframe);
  }

  getCookie(): string {
    return this.cookie;
  }

  hasCookie(): boolean {
    return (this.cookie) ? true : false;
  }

  setCookie(userId: number) {
    this.cookieService.set(SyncService.cookieKey, "" + userId);
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
    let urlIndex: number = youtubeUrl.search('v=');
    if (urlIndex > -1) {
      let andIndex: number = youtubeUrl.search('&');
      if (andIndex > -1) {

        videoId = youtubeUrl.substring(urlIndex + 2, andIndex);
        console.log('!!!1 ' + andIndex + " | " + videoId);
        youtubeUrl = youtubeUrl.substring(andIndex + 1);

        let listIndex: number = youtubeUrl.search('list=');
        if (listIndex > -1) {
          let youtubeList: string = youtubeUrl.substring(listIndex + 5);
          andIndex = youtubeList.search('&');
          if (andIndex > -1) {
            listlink = youtubeList.substring(listIndex, andIndex)
          } else {
            listlink = youtubeList;
          }
          console.log("YTLIST: " + listlink)
        }

        let timeStampIndex: number = youtubeUrl.search('t=');
        if (timeStampIndex > -1) {
          let youtubeTimeStamp: string = youtubeUrl.substring(timeStampIndex + 2);
          andIndex = youtubeTimeStamp.search('&');
          if (andIndex > -1) {
            timestamp = parseInt(youtubeTimeStamp.substring(timeStampIndex, andIndex));
          } else {
            timestamp = parseInt(youtubeTimeStamp);
          }
          console.log("YTS:" + timestamp)
        }



      } else {
        videoId = youtubeUrl.substring(urlIndex + 2);
        console.log('!!!2 ' + videoId);
      }
    } else {

      let timeStampIndex: number = youtubeUrl.search('t=');
      if (timeStampIndex > -1) {
        let youtubeTimeStamp: string = youtubeUrl.substring(timeStampIndex + 2);
        let andIndex = youtubeTimeStamp.search('&');
        if (andIndex > -1) {
          timestamp = parseInt(youtubeTimeStamp.substring(timeStampIndex, andIndex));
        } else {
          timestamp = parseInt(youtubeTimeStamp);
        }
        videoId = youtubeUrl.substring(0, timeStampIndex - 1);
        console.log("YTS:" + timestamp + "videoId: " + videoId);
      }
    }

    if (videoId || timestamp) {
      let video: Video = new Video();
      video.videoId = videoId;
      video.timestamp = timestamp;
      return video;
    }
    return null;
  }



}
