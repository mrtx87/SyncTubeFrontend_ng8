import { Component, OnInit, HostListener, AfterViewChecked } from '@angular/core';
import { SyncService } from '../sync.service';
import { Raum } from '../raum';
import { ActivatedRoute } from '@angular/router';
import { Message } from '../message';
import { ChatMessage } from '../chat-message';
import { User } from './user';
import { Video } from '../video/video';
import { SearchQuery } from './search-query';
import { ImportedPlaylist } from '../video/playlist';
import { Observable } from 'rxjs';
import { SupportedApi } from '../supported-api';

@Component({
  selector: 'app-sync-tube',
  templateUrl: './sync-tube.component.html',
  styleUrls: ['./sync-tube.component.css']
})


export class SyncTubeComponent implements OnInit, AfterViewChecked {

  //APIS STUFF
  supportedApis: SupportedApi[];
  selectedApi: SupportedApi;

  publicRaum: boolean = false;
  privateRaum: boolean = true;


  scrollContent: any;
  scrollChat: any;

  forceScrollToSearch: boolean = false;
  forceScrollToVideo: boolean = false;
  forceScrollToChatBottom: boolean = true;

  /* controls vars */
  showRaum: boolean = false;
  searchInput: string;
  raumIdText: string;
  chatMessageText: String;

  displayTab: number = 1;


  displayCinemaMode: Boolean = false;
  displayFullscreen: Boolean = false;

  title = 'SyncTube';

  //currentUser
  user: User;

  //currentRaum Information
  raumId: number;
  raumDescription: string = "";
  raumTitle: string = "";
  raumDescriptionChange: string = "";
  raumTitleChange: string = "";

  createdAt: string;
  raumStatus: Boolean = true;


  //currentVideo
  video: Video;

  //restliche daten die wir brauchen vom server z.B. users in raum, playlist etc
  users: User[];
  kickedUsers: User[];
  playbackRates: number[];
  chatMessages: ChatMessage[] = [];
  searchResults: Video[] = [];
  playlist: Video[] = [];
  videoDuration: number;
  receivedPlayerState: number;
  publicRaeume: Observable<Raum[]>;
  importedPlaylist: ImportedPlaylist;
  hasImportedPlaylist: boolean = false;

  initalPlaybackRate: number;

  //playlist controls
  loop: number = 0; //0 noloop, 1 loop all, 2 loop single video
  randomOrder: boolean; //false sequentiell, true random

  configRaumStatus: Boolean = true;
  isMuted: Boolean = false;

  editUserName: Boolean = false;

  //personen die vom admin gekickt oder zum admin ernannt werden
  designatedAdmin: User;
  kickingUser: User;
  revealContent: Boolean = false;

  constructor(private syncService: SyncService, private route: ActivatedRoute) {

    this.syncService.registerSyncTubeComponent(this);

    this.syncService.retrieveSupportedApis();

    this.connect();
  }

  connect() {
    this.syncService.connect();
  }



  ngAfterViewChecked(): void {

    this.scrollChat = document.getElementById("scrollChat")
    this.scrollContent = document.getElementById("scrollContent")

    if (this.forceScrollToSearch) {
      this.scrollToSearchResults();
      this.forceScrollToSearch = false;
    }


    if (this.forceScrollToVideo) {
      this.scrollToSearchVideo();
      this.forceScrollToVideo = false;
    }

    /*
    if (this.scrollChat && this.forceScrollToChatBottom) {
      this.scrollChat.scrollTop = this.scrollChat.scrollHeight;
    }*/


    if (this.scrollChat && this.forceScrollToChatBottom) {
      this.scrollToBottomOfChat();
      this.forceScrollToChatBottom = false;
    }
  }

  scrollToSearchVideo() {
    this.scrollContent.scrollTop = 0;
  }

  scrollToBottomOfChat() {
    //if (Math.abs(this.scrollChat.scrollHeight - this.scrollChat.scrollTop) < 100) {
    this.scrollChat.scrollTop = this.scrollChat.scrollHeight + 25;
    //}
  }

  scrollToSearchResults() {
    this.scrollContent.scrollTop = this.scrollContent.scrollHeight * 0.4;
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler($event: any) {
    this.syncService.sendDisconnectMessage(this.user, this.raumId);
    this.syncService.localCloseConnection();
  }

  setVideoDuration(duration: number) {
    this.videoDuration = duration;
  }

  addToPlaylist(video: Video) {
    this.playlist.push(video);
  }

  sendAddVideoToPlaylist(video_: Video) {
    this.syncService.sendAddVideoToPlaylist(this.raumId, this.user, video_);
  }

  sendAddVideoToPlaylistAsNext(video_: Video) {
    this.syncService.sendAddVideoToPlaylistAsNext(this.raumId, this.user, video_);
  }

  sendAddVideoToPlaylistAsCurrent(video_: Video) {
    this.syncService.sendAddVideoToPlaylistAsCurrent(this.raumId, this.user, video_);
  }

  sendUpdateTitleAndDescription() {
    if (this.raumTitleChange !== this.raumTitle || this.raumDescription !== this.raumDescriptionChange) {
      this.syncService.sendUpdateTitleAndDescription(this.user, this.raumId, this.raumTitleChange, this.raumDescriptionChange);
    }
  }

  sendAutoNextPlaylistVideo() {
    this.syncService.sendAutoNextPlaylistVideo(this.getUser(), this.getRaumId(), 1);
  }

  sendChangeUserName(oldUserName: string) {
    if (this.user.userName !== oldUserName && this.user.userName.length > 0) {
      this.syncService.sendChangeUserName(this.getUser(), this.getRaumId());
    } else {
      this.user.userName = oldUserName;
    }
  }

  createNewRaumWhileInRaum() {
    this.syncService.sendDisconnectMessage(this.user, this.raumId);
    this.clearRoomVars();
    this.createRaum();
  }

  sendPardonKickedUser(kickedUser: User) {
    this.syncService.sendPardonKickedUser(this.getUser(), this.getRaumId(), kickedUser);
  }

  sendToggleMuteUser(user: User) {
    this.syncService.sendToggleMuteUser(this.getUser(), this.getRaumId(), user);

  }

  togglePlaylistLoop() {
    this.syncService.sendTogglePlaylistLoop(this.getUser(), this.getRaumId(), this.loop);
  }

  togglePlaylistRunningOrder() {
    this.syncService.sendTogglePlaylistRunningOrder(this.getUser(), this.getRaumId(), this.randomOrder);
  }

  switchSelectedApi() {
    
    console.log(this.selectedApi);
  }

  clearRoomVars() {
    this.raumId = null;
    this.raumDescription = null;
    this.raumTitle = null;
    this.createdAt = null;
    this.raumStatus = true;
    //currentVideo
    this.video = null;

    //restliche daten die wir brauchen vom server z.B. users in raum, playlist etc
    this.users = null;
    this.playbackRates = null;
    this.chatMessages = [];
    this.searchResults = null;
    this.playlist = [];
    this.videoDuration = 0;
    this.receivedPlayerState = 0;
    this.publicRaeume = null;
    this.importedPlaylist = null;;
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

  sendRemovePlaylistVideo(pvideo_: Video) {
    this.syncService.sendRemoveVideoFromPlaylist(this.raumId, this.user, pvideo_);
  }

  sendImportPlaylist() {
    if (this.importedPlaylist && this.user.admin) {
      this.importedPlaylist.mode = 0;
      this.syncService.sendImportPlaylist(this.raumId, this.user, this.importedPlaylist);
    }
  }

  search() {
    this.importedPlaylist = new ImportedPlaylist();
    this.hasImportedPlaylist = false;
    this.searchResults = [];
    let searchQuery: SearchQuery = this.syncService.currentApiService.dataService.processInput(this.searchInput);
    this.forceScrollToSearch = this.syncService.currentApiService.dataService.search(searchQuery);

    }

  getReceivedPlayerState(): number {
    return this.receivedPlayerState;
  }

  sendSwitchPlaylistVideo(pvideo_: Video) {
    if (this.user.admin) {
      this.forceScrollToVideo = true;
      this.syncService.sendSwitchPlaylistVideo(this.getUser(), this.getRaumId(), pvideo_);
    }
  }

  openPlaylistLink(video_: Video) {
    if (video_.playlistId) {
      this.importedPlaylist = new ImportedPlaylist();
      this.hasImportedPlaylist = false;
      this.searchResults = [];

      this.syncService.currentApiService.dataService.searchPlaylist(video_.playlistId, false, null, video_.title);
    }
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
    if (!this.user.isMute) {
      let message: Message = new Message();
      message.type = "user-chat"
      message.user = this.user;
      message.raumId = this.raumId;
      message.chatMessage = this.createChatMessage();
      this.syncService.sendChatMessage(message);
    }
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

  getAvailablePlaybackRates(): Array<number> {
    return this.syncService.getAvailablePlaybackRates();
  }

  getPlaybackRate(): number {
    return this.syncService.getPlaybackRate();
  }

  setPlaybackRate(rate: number) {
    this.syncService.setPlaybackRate(rate);
  }

  setInitalPlaybackRate(rate: number) {
    this.initalPlaybackRate = rate;
  }

  setPlaybackRates(rates: number[]) {
    this.playbackRates = rates;
  }

  toggleDisplayOptions() {
    this.syncService.toggleDisplayOptions();
  }

  jumpBySeconds(offset: number) {
    this.syncService.jumpBySeconds(offset)
  }

  tenSecBack() {
    this.jumpBySeconds(-10);
    this.syncService.startDisplaylingsecondsBack();
  }

  tenSecForward() {
    this.jumpBySeconds(10);
    this.syncService.startDisplaylingsecondsForward();
  }

  getLocalPlaylist(): Video[] {
    return this.playlist;
  }
}



