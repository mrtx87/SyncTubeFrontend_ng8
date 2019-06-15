import { Component, OnInit, HostListener, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { SyncService } from '../sync.service';
import { Raum } from '../raum';
import { ActivatedRoute } from '@angular/router';
import { Message } from '../message';
import { ChatMessage } from '../chat-message';
import { User } from './user';
import { Video } from '../video/video';
import $ from 'jquery';

@Component({
  selector: 'app-sync-tube',
  templateUrl: './sync-tube.component.html',
  styleUrls: ['./sync-tube.component.css']
})


export class SyncTubeComponent implements OnInit, AfterViewChecked {

  ngAfterViewChecked(): void {
    if (!this.scrollChat) {
      this.scrollChat = document.getElementById("scrollChat")
    }

    if (!this.scrollContent) {
      this.scrollContent = document.getElementById("scrollContent")
    }

    this.scrollToBottomOfChat()
    if(this.scrollToBottom) {
      this.scrollToSearchResults();
      this.scrollToBottom = false;
    }
  }

  scrollToBottomOfChat() {
    this.scrollChat.scrollTop = this.scrollChat.scrollHeight;
  }

  scrollToSearchResults() {
    this.scrollContent.scrollTop = this.scrollContent.scrollHeight * 0.3;
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler($event: any) {
    this.syncService.sendDisconnectMessage(this.user, this.raumId);
    this.syncService.localCloseConnection();
    //@TODO  convert youtube link to mediacontenturl
  }

  publicRaum: boolean = false;
  privateRaum: boolean = true;


  scrollContent: any;
  scrollChat: any;

  /* controls vars */
  showRaum: boolean = false;
  query: string;
  raumIdText: string;
  chatMessageText: String;

  displayCinemaMode: Boolean = false;
  displayFullscreen: Boolean = false;

  title = 'SyncTube';

  //currentUser
  user: User;

  //currentRaum Information
  raumId: number;
  raumDescription: string;
  raumTitle: string;
  createdAt: string;
  raumStatus: Boolean = true;


  //currentVideo
  video: Video;

  //restliche daten die wir brauchen vom server z.B. users in raum, playlist etc
  users: User[];
  playbackRates: number[];
  chatMessages: ChatMessage[] = [];
  searchResults: Video[];
  playlist: Video[] = [];
  videoDuration: number;
  receivedPlayerState: number;
  publicRaeume: Raum[];


  configRaumStatus: Boolean = true;
  isMuted: Boolean = false;

  //personen die vom admin gekickt oder zum admin ernannt werden
  designatedAdmin: User;
  kickingUser: User;
  revealContent: Boolean = false;
  constructor(private syncService: SyncService, private route: ActivatedRoute) {

    this.syncService.registerSyncTubeComponent(this);
    // this.syncService.parseYoutubeUrl('https://www.youtube.com/watch?v=luQ0JWcrsWg&feature=youtu.be&list=PLuUrokoVSxlfUJuJB_D8j_wsFR4exaEmy&t=81');
    // this.syncService.parseYoutubeUrl('https://youtu.be/AmAy0KABoX0');
    if (this.syncService.hasCookie()) {
      this.setLocalUser(new User());
      this.user.userId = parseInt(this.syncService.getCookie())
    } else {
      this.syncService.generateUserId();
      this.syncService.setCookie(this.user.userId);
    }
    this.connect();
    //this.syncService.getVideoTitle("dQw4w9WgXcQ");
  }

  connect() {
    this.syncService.connect(this.user);
  }

  setVideoDuration(duration: number) {
    this.videoDuration = duration;
  }

  addToPlaylist(video: Video) {
    this.playlist.push(video);
    console.log(this.playlist.length)

  }

  sendAddVideoToPlaylist(video_ :Video) {
    console.log("SEND VIDEO TO PLAYLIST")
    this.syncService.sendAddVideoToPlaylist(this.raumId, this.user, video_);
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

  scrollToBottom: boolean; 

  search() {

    let video: Video = this.syncService.parseYoutubeUrl(this.query);
    if (video) {
      //this.sendNewVideoLink(video);
      this.syncService.search(this.query, false, video.timestamp);
      this.scrollToBottom = true;
      return;
    }


    this.syncService.search(this.query, true);
    this.scrollToBottom = true;

  }

  getReceivedPlayerState(): number {
    return this.receivedPlayerState;
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

  pauseVideo() {
    this.syncService.pauseVideo();
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

}



