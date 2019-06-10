import { Component, OnInit, HostListener } from '@angular/core';
import { SyncService } from '../sync.service';
import { Raum } from '../raum';
import { ActivatedRoute } from '@angular/router';
import { Message } from '../message';
import { ChatMessage } from '../chat-message';
import { User } from './user';
import { Video } from '../video/video';

@Component({
  selector: 'app-sync-tube',
  templateUrl: './sync-tube.component.html',
  styleUrls: ['./sync-tube.component.css']
})


export class SyncTubeComponent implements OnInit {


  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler($event: any) {
    this.syncService.sendDisconnectMessage(this.user, this.raumId);
    this.syncService.localCloseConnection();
    //@TODO  convert youtube link to mediacontenturl
  }

  publicRaum: boolean = false;
  privateRaum: boolean = true;


  /* controls vars */
  showRaum: boolean = false;
  query: string;
  raumIdText: string;
  chatMessageText: String;

  playerState: number;

  title = 'SyncTube';

  user: User;
  raumId: number;
  users: User[];
  video: Video;
  playbackRates: number[];
  chatMessages: ChatMessage[] = [];
  searchResults: Video[];
  playlist: Video[] = [];
  videoTime: number;
  volumeValue: number;
  videoDuration: number;
  raumStatus: Boolean = true;
  displaySubtitle: Boolean = false;
  displayOptions: Boolean = false;
  displayCinemaMode: Boolean = false;
  displayFullscreen: Boolean = false;

  configRaumStatus: Boolean = true;
  isMuted: Boolean = false;
  isPlaying: Boolean = false;

  publicRaeume: Raum[];
  designatedAdmin: User;
  kickingUser: User;

  iframe: any;

  revealContent: Boolean = false;
  constructor(private syncService: SyncService, private route: ActivatedRoute) {

    this.syncService.registerSyncTubeComponent(this);
    // this.syncService.parseYoutubeUrl('https://www.youtube.com/watch?v=luQ0JWcrsWg&feature=youtu.be&list=PLuUrokoVSxlfUJuJB_D8j_wsFR4exaEmy&t=81');
    // this.syncService.parseYoutubeUrl('https://youtu.be/AmAy0KABoX0');
    this.generateUserId();
    this.connect();
    //this.syncService.getVideoTitle("dQw4w9WgXcQ");
  }

  connect() {
    this.syncService.connect(this.user);
  }

  setVideoDuration(duration: number) {
    this.videoDuration = duration;
  }

  generateUserId() {
    if (!this.user) {
      this.user = new User();
    }
    this.user.userId = Math.floor(Date.now() / 1000);
  }

  addToPlaylist(video: Video) {
    this.playlist.push(video);
    console.log(this.playlist.length)

  }

  sendAddVideoToPlaylist() {
    console.log("SEND VIDEO TO PLAYLIST")
    this.syncService.sendAddVideoToPlaylist(this.raumId, this.user, this.query);
  }

  onChangeProgressBar() {
    this.syncService.sendSeekToTimestamp(this.user, this.raumId, this.video.videoId, this.video.timestamp);
  }

  createNewRaumWhileInRaum() {
    this.syncService.sendDisconnectMessage(this.user, this.raumId);
    this.createRaum();
  }

  createRaum() {
    this.syncService.sendcreateRaum(this.user, this.configRaumStatus);
  }

  joinRaum() {
    this.syncService.sendJoinRaum(this.user, parseInt(this.raumIdText));
  }

  joinRaumById(raumId: number) {
    this.syncService.sendJoinRaum(this.user, raumId);
  }

  search() {
    let video: Video = this.syncService.parseYoutubeUrl(this.query);

    if(video) {
      this.sendNewVideoLink(video);
      return;
    }

    this.syncService.search(this.query);
  }


  sendNewVideoLink(video: Video) {
    this.syncService.sendNewVideoAndGetTitleFirst(this.user, this.raumId, video);
  }

  getPathId(): number {
    return parseInt(this.route.snapshot.paramMap.get('id'));
  }

  updatePlaylist(playlist: Video[]) {
    this.playlist = playlist;
  }

  parseYoutubeUrl(url: string): Video {
    return this.syncService.parseYoutubeUrl(url);
  }

  ngOnInit() {
  }

  toggleMute() {
    this.syncService.toggleMute();
  }


  addChatMessage(chatMessage: ChatMessage) {
    this.chatMessages.push(chatMessage);
  }

  addAllChatMessages(allChatMessages: ChatMessage[]) {
    allChatMessages.forEach(m => this.chatMessages.push(m));
  }

  sendChatMessage() {
    let message: Message = new Message();
    message.type = "user-chat"
    message.user = this.user;
    message.raumId = this.raumId;
    message.chatMessage = this.createChatMessage();
    this.syncService.sendChatMessage(message);
    this.chatMessageText = "";
  }

  createChatMessage(): ChatMessage {
    let chatMessage: ChatMessage = new ChatMessage();
    chatMessage.user = this.user;
    chatMessage.raumId = this.raumId;
    chatMessage.messageText = this.chatMessageText;
    return chatMessage;
  }

  triggerTogglePlay(): void {
    console.log("PS: " + this.getPlayerState());
    let slider = document.getElementById('myRange')
    console.log(slider)
    if (this.getPlayerState() == SyncService.paused || this.getPlayerState() == SyncService.placed || this.getPlayerState() == SyncService.finished) {
      console.log("playvideo")
      this.syncService.sendTogglePlay(this.syncService.getUser(), this.syncService.getRaumId(), SyncService.playing, this.getVideo());
    }
    if (this.getPlayerState() == SyncService.playing) {
      console.log("pausevideo")
      this.syncService.sendTogglePlay(this.syncService.getUser(), this.syncService.getRaumId(), SyncService.paused, this.getVideo());
    }
  }

  pauseVideo() {
    this.syncService.pauseVideo();
  }

  setVolume() {
    this.syncService.setVolume(this.volumeValue);
  }

  getUserId(): number {
    return this.user.userId;
  }

  getRaumId(): number {
    return this.raumId;
  }

  getPlayerState() {
    return this.syncService.getPlayerState();
  }

  getUser(): User {
    return this.user;
  }

  setPublicRaeume(publicRaeume: Raum[]) {
    this.publicRaeume = publicRaeume;
  }

  toAdmin(designatedUser: User) {
    this.designatedAdmin = designatedUser;
    //this.displayPrompt = true;
  }

  approvedKick() {
    this.syncService.sendKickUser(this.raumId, this.user, this.kickingUser);
    this.kickingUser = null;
  }

  disapprovedKick() {
    this.kickingUser = null;
  }


  approvedAdmin() {
    this.syncService.sendAssignAdmin(this.raumId, this.user, this.designatedAdmin);
    this.designatedAdmin = null;
  }

  disapprovedAdmin() {
    this.designatedAdmin = null;
  }

  setLocalUser(user: User) {
    this.user = user;
  }

  sendToggleRaumStatus(event: any) {
    if (this.raumStatus) {
      this.syncService.sendToPublicRoomRequest(this.raumId, this.user);
    } else {
      this.syncService.sendToPrivateRoomRequest(this.raumId, this.user);
    }
  }

  setRaumstatus(raumStatus: Boolean) {
    this.raumStatus = raumStatus;
  }

  toKick(designatedUser: User) {
    console.log("KICKINGUSER:" + designatedUser)
    this.kickingUser = designatedUser;
  }

  copyUrlToClipboard() {

  }

  getRaumUrl(): string {
    return "localhost:4200/rooms/" + this.getRaumId;
  }

  refreshJoinUrl() {
    this.syncService.sendRefreshRaumId(this.raumId, this.user);
  }

  displayConfigToggle() {
    console.log(this.configRaumStatus)
  }

  getVideo(): Video {
    return this.video;
  }

  mouseOverSound() {
    console.log("tesetetet")
  }

  onChangeChat() {
    console.log("dsfsdf")
    let objDiv = document.getElementById("scrollable-content");
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  getAvailablePlaybackRates(): Array<number> {
    return this.syncService.getAvailablePlaybackRates();
  }

  getPlaybackRate(): number {
    return this.syncService.getPlaybackRate();
  }

  setPlaybackRate(rate: number) {
    this.syncService.setPlaybackRate(rate);
  }

  getOptions() {
    return this.syncService.getOptions();
  }

  toggleSubtitle(_module, option, value) {
    this.displaySubtitle = !this.displaySubtitle;
    console.log("testestset")
    this.syncService.toggleSubtitle('cc', 'reload', this.displaySubtitle);
  }

  setOption(_module, option, value) {
    this.syncService.setOption(_module, option, value);

  }

  setPlaybackRates(rates: number[]) {
    this.playbackRates = rates;
  }

  toggleDisplayOptions() {
    this.syncService.toggleDisplayOptions();
  }

  setSize(width: number, height: number) {
    this.syncService.setSize(width, height);
  }

  toggleDisplayCinemaMode() {
    this.displayCinemaMode = !this.displayCinemaMode;
    this.iframe.className = 'video'
    this.displayFullscreen = false;
  }

  toggleDisplayFullscreen() {
    this.displayFullscreen = !this.displayFullscreen;
    this.displayCinemaMode = false;
    if(this.displayFullscreen) {
      this.iframe.className = 'video-fullscreen'
    }else{
      this.iframe.className = 'video'
    }
  }

  setIframe(iframe: any) {
    this.iframe = iframe;
  }

}



