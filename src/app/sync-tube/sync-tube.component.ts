import { AfterViewChecked, AfterViewInit, Component, HostListener, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import { ChatMessage } from "../chat-message";
import { Message } from "../message";
import { Raum } from "../raum";
import { SupportedApi } from "../supported-api";
import { SyncService } from "../sync.service";
import { ToastrMessage } from "../toastr.message";
import { ImportedPlaylist } from "../video/playlist";
import { Video } from "../video/video";
import { SearchQuery } from "./search-query";
import { User } from "./user";
import { Constants } from '../constants';
import { LanguagesService } from '../languages.service';
import { Language } from '../language';
import { ToastrConfigs } from '../toastr.configs';

@Component({
  selector: "app-sync-tube",
  templateUrl: "./sync-tube.component.html",
  styleUrls: ["./sync-tube.component.css"]
})
export class SyncTubeComponent implements OnInit, AfterViewChecked, AfterViewInit {
  ngAfterViewInit(): void {

  }
  //APIS STUFF
  supportedApis: SupportedApi[];
  selectedDataApi: SupportedApi;
  isSelectingApi: boolean = false;

  dailymotionSearchTypeSelection: string = 'video';

  publicRaum: boolean = false;
  privateRaum: boolean = true;

  scrollContent: any;
  scrollChat: any;
  searchResultsContainer: any;
  currentScrollTop: number = 0;
  isLoadingVideos: boolean = false;
  chatInputfield: any;

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
  displayHistory: Boolean = false;
  displayToastrHistory: Boolean = false;
  displaySwitchRoomStatusTooltip: Boolean = false;
  displayRenameRoomTitleTooltip: Boolean = false;
  displayEditRoomDescriptionTooltip: Boolean = false;

  title = "SyncTube";

  //currentUser
  user: User;

  //currentRaum Information
  raumId: string;
  raumDescription: string = "";
  raumTitle: string = "";
  raumDescriptionChange: string = "";
  raumTitleChange: string = "";

  createdAt: string;
  raumStatus: Boolean = true;

  toastrMessages: ToastrMessage[] = [];
  //currentVideo
  video: Video;

  //restliche daten die wir brauchen vom server z.B. users in raum, playlist etc
  users: User[];
  kickedUsers: User[];
  playbackRates: number[];
  chatMessages: ChatMessage[] = [];
  searchResults: Video[] = [];
  playlist: Video[] = [];
  history: Video[] = [];
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
  toClearPlaylist: boolean;
  revealContent: Boolean = false;

  /* Mouse input*/

  /*
  @HostListener("window:mouseup", ["$event"])
  mouseEvent(event: MouseEvent){
    console.log(event)
  }*/


  /* Keyboard controlings */

  @HostListener("window:keyup", ["$event"])
  keyEvent(event: KeyboardEvent) {
    //console.log(event.target);
    let target: any = event.target;
    let tagName: string = (<string>target.localName).toLowerCase();
    if (tagName !== "input" && tagName !== "textarea") {
      switch (event.keyCode) {
        case KEY_CODE.LEFT_ARROW:
          this.syncService.videoComponent.jumpBySeconds(
            Constants.TEN_SEC_BACK
          );
          break;
        case KEY_CODE.RIGHT_ARROW:
          this.syncService.videoComponent.jumpBySeconds(
            Constants.TEN_SEC_FORTH
          );
          break;
        case KEY_CODE.BACKSPACE: //to startpage
          // delete raumId ?
          break;
        case KEY_CODE.KEY_A:
          this.syncService.videoComponent.jumpBySeconds(
            Constants.TEN_SEC_BACK
          );
          break;
        case KEY_CODE.KEY_S:
          this.syncService.videoComponent.triggerTogglePlay();
          this.syncService.retrieveHistory();
          break;
        case KEY_CODE.KEY_D:
          this.syncService.videoComponent.jumpBySeconds(
            Constants.TEN_SEC_FORTH
          );
          break;
        case KEY_CODE.SPACE:
          this.syncService.videoComponent.triggerTogglePlay();
          break;
        case KEY_CODE.KEY_F:
          this.syncService.videoComponent.toggleDisplayFullscreen();
          break;
        case KEY_CODE.KEY_K:
          this.syncService.videoComponent.triggerTogglePlay();
          break;
        case KEY_CODE.KEY_J:
          this.syncService.videoComponent.jumpBySeconds(
            Constants.FIVE_SEC_BACK
          );
          break;
        case KEY_CODE.KEY_L:
          this.syncService.videoComponent.jumpBySeconds(
            Constants.FIVE_SEC_FORTH
          );
          break;
        case KEY_CODE.PERIOD: // increase playback rate
          {
            let playBackRates = this.syncService.currentVideoService.getAvailablePlaybackRates();
            let currentPlaybackRate: number = this.syncService.currentVideoService.getPlaybackRate();
            if (currentPlaybackRate + 0.25 <= 2) {
              this.syncService.videoComponent.sendChangePlaybackRate(
                currentPlaybackRate + 0.25
              );
            }
          }
          break;
        case KEY_CODE.COMMA: // increase playback rate
          {
            let playBackRates = this.syncService.currentVideoService.getAvailablePlaybackRates();
            // playBackRates[(playBackRates.length)-1]; // highest
            let currentPlaybackRate: number = this.syncService.currentVideoService.getPlaybackRate();
            if (currentPlaybackRate - 0.25 > 0) {
              this.syncService.videoComponent.sendChangePlaybackRate(
                currentPlaybackRate - 0.25
              );
            }
          }
          break;
      }
    }
  }

  constructor(private syncService: SyncService, private route: ActivatedRoute, private languageService: LanguagesService) {
    this.syncService.registerSyncTubeComponent(this);
    this.syncService.retrieveSupportedApis();

    this.syncService.connect();

  }

  updateCurrentScrollTop(): void {
    this.currentScrollTop = this.scrollContent.scrollTop;
  }

  ngAfterViewChecked(): void {
    this.scrollChat = document.getElementById("scrollChat");
    this.scrollContent = document.getElementById("scrollContent");
    this.searchResultsContainer = document.getElementById("search-results");

    if (this.forceScrollToSearch) {
      this.scrollToSearchResults();
      this.forceScrollToSearch = false;
    }

    if (this.forceScrollToVideo) {
      this.scrollToSearchVideo();
      this.forceScrollToVideo = false;
    }

    if (!this.isLoadingVideos && false) {
      this.isLoadingVideos = true;
      this.syncService.currentDataService.searchQuery(
        "",
        true,
        null
      );
    }

    if (this.scrollChat && this.forceScrollToChatBottom) {
      this.scrollToBottomOfChat();
      this.forceScrollToChatBottom = false;
    }
  }

  scrollToSearchVideo() {
    this.scrollContent.scrollTop = 0;
  }

  scrollToBottomOfChat() {
    this.scrollChat.scrollTop = this.scrollChat.scrollHeight + 25;
  }

  scrollToSearchResults() {
    this.scrollContent.scrollTop = this.scrollContent.scrollHeight * 0.4;
  }

  @HostListener("window:beforeunload", ["$event"])
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
    this.syncService.sendAddVideoToPlaylistAsNext(
      this.raumId,
      this.user,
      video_
    );
  }

  sendAddVideoToPlaylistAsCurrent(video_: Video) {
    this.syncService.sendAddVideoToPlaylistAsCurrent(
      this.raumId,
      this.user,
      video_
    );
  }

  sendUpdateTitleAndDescription() {
    if (
      this.raumTitleChange !== this.raumTitle ||
      this.raumDescription !== this.raumDescriptionChange
    ) {
      this.syncService.sendUpdateTitleAndDescription(
        this.user,
        this.raumId,
        this.raumTitleChange,
        this.raumDescriptionChange
      );
    }
  }

  sendAutoNextPlaylistVideo() {
    this.syncService.sendAutoNextPlaylistVideo(
      this.getUser(),
      this.getRaumId(),
      1
    );
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
    this.syncService.sendPardonKickedUser(
      this.getUser(),
      this.getRaumId(),
      kickedUser
    );
  }

  sendToggleMuteUser(user: User) {
    this.syncService.sendToggleMuteUser(this.getUser(), this.getRaumId(), user);
  }

  togglePlaylistLoop() {
    this.syncService.sendTogglePlaylistLoop(
      this.getUser(),
      this.getRaumId(),
      this.loop
    );
  }

  togglePlaylistRunningOrder() {
    this.syncService.sendTogglePlaylistRunningOrder(
      this.getUser(),
      this.getRaumId(),
      this.randomOrder
    );
  }

  switchSelectedApi(supportedDataApi_: SupportedApi) {
    this.selectedDataApi = supportedDataApi_;
    this.isSelectingApi = false;
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
    this.users = [];
    this.playbackRates = [];
    this.chatMessages = [];
    this.searchResults = null;
    this.playlist = [];
    this.videoDuration = 0;
    this.receivedPlayerState = 0;
    this.publicRaeume = null;
    this.importedPlaylist = null;
  }

  createRaum() {
    this.syncService.sendcreateRaum(this.user, this.configRaumStatus);
  }

  joinRaum() {
    this.syncService.sendJoinRaum(this.user, this.raumIdText);
  }

  joinRaumById(raumId: string) {
    this.syncService.sendJoinRaum(this.user, raumId);
  }

  sendRemovePlaylistVideo(pvideo_: Video) {
    this.syncService.sendRemoveVideoFromPlaylist(
      this.raumId,
      this.user,
      pvideo_
    );
  }

  sendImportPlaylist() {
    if (this.importedPlaylist && this.user.admin) {
      this.importedPlaylist.mode = 0;
      this.syncService.sendImportPlaylist(
        this.raumId,
        this.user,
        this.importedPlaylist
      );
    }
  }

  sendIntegratePlaylist() {
    if (this.importedPlaylist && this.user.admin) {
      this.importedPlaylist.mode = 1;
      this.syncService.sendImportPlaylist(
        this.raumId,
        this.user,
        this.importedPlaylist
      );
    }
  }

  switchDataApiIfSearchInputApiTypeDiffers() {
    const input: string = this.searchInput;
    if (this.isUrl(input)) {
      let index: number = input.indexOf("//");
      if (index >= 0) {
        index += 2;
        const withoutHttpsInput = input.substring(index);
        if ((withoutHttpsInput.includes("youtube.") || withoutHttpsInput.includes("youtu.be/")) && withoutHttpsInput.includes("/")) {
          this.selectedDataApi = this.supportedApis[0];
          return;
        } else if (withoutHttpsInput.includes("dailymotion.") && withoutHttpsInput.includes("/")) {
          this.selectedDataApi = this.supportedApis[1];
          return;

        } else if (withoutHttpsInput.includes("openload.") && withoutHttpsInput.includes("/")) {
          this.selectedDataApi = this.supportedApis[3];
          return;

        } else if (withoutHttpsInput.includes("verystream.") && withoutHttpsInput.includes("/")) {
          this.selectedDataApi = this.supportedApis[4];
          return;

        } else if (withoutHttpsInput.includes("/") && (withoutHttpsInput.includes(".mp4") || withoutHttpsInput.includes(".webm"))) {
          this.selectedDataApi = this.supportedApis[2];
          return;

        }
      }
    }
  }

  isUrl(input: string) {
    return input.startsWith("http://") || input.startsWith("https://");
  }

  search() {
    this.importedPlaylist = new ImportedPlaylist();
    this.hasImportedPlaylist = false;
    this.searchResults = [];

    this.switchDataApiIfSearchInputApiTypeDiffers();

    let searchQuery: SearchQuery = this.syncService.currentDataService.processInput(
      this.searchInput
    );
    if (searchQuery) {
      this.forceScrollToSearch = this.syncService.currentDataService.search(
        searchQuery
      );
    }
  }

  getReceivedPlayerState(): number {
    return this.receivedPlayerState;
  }

  sendSwitchPlaylistVideo(pvideo_: Video) {
    if (this.user.admin) {
      this.forceScrollToVideo = true;
      this.syncService.sendSwitchPlaylistVideo(
        this.getUser(),
        this.getRaumId(),
        pvideo_
      );
    }
  }

  openPlaylistLink(video_: Video) {
    if (video_.playlistId) {
      this.importedPlaylist = new ImportedPlaylist();
      this.hasImportedPlaylist = false;
      this.searchResults = [];
      this.syncService.currentDataService.searchPlaylist(
        video_.playlistId,
        false,
        null,
        video_.title
      );
    }
  }

  getPathId(): string {
    return this.route.snapshot.paramMap.get("id");
  }

  updatePlaylist(playlist: Video[]) {
    this.playlist = playlist;
  }

  getChatInputfield(): any {
    if (!this.chatInputfield) {
      this.chatInputfield = document.getElementById("chatInput");

    }
    return this.chatInputfield;
  }

  ngOnInit() {

  }

  addChatMessage(chatMessage: ChatMessage) {
    if (!this.chatMessages) {
      this.chatMessages = [];
    }
    this.chatMessages.push(chatMessage);
  }

  addAllChatMessages(allChatMessages: ChatMessage[]) {
    if (!this.chatMessages) {
      this.chatMessages = [];
    }
    allChatMessages.forEach(m => this.chatMessages.push(m));
  }

  sendChatMessage() {
    if (!this.user.mute && this.chatMessageText.length > 0) {
      let message: Message = new Message();
      message.type = "user-chat";
      message.user = this.user;
      message.raumId = this.raumId;
      message.chatMessage = this.createChatMessage();
      this.syncService.sendChatMessage(message);
    }
    this.chatMessageText = "";

    this.getChatInputfield().focus();
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

  getUserId(): string {
    return this.user.userId;
  }

  getRaumId(): string {
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

  clearPlaylist() {
    this.syncService.sendClearPlaylist(this.getUser(), this.getRaumId());
  }

  approvedClear() {
    this.clearPlaylist();
    this.toClearPlaylist = false;
  }

  disapprovedClear() {
    this.toClearPlaylist = false;
  }

  approvedKick() {
    this.syncService.sendKickUser(this.raumId, this.user, this.kickingUser);
    this.kickingUser = null;
  }

  disapprovedKick() {
    this.kickingUser = null;
  }

  approvedAdmin() {
    this.syncService.sendAssignAdmin(
      this.raumId,
      this.user,
      this.designatedAdmin
    );
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
    //console.log("KICKINGUSER:" + designatedUser);
    this.kickingUser = designatedUser;
  }

  copyUrlToClipboard() { }

  getRaumUrl(): string {
    return "localhost:4200/rooms/" + this.getRaumId;
  }

  refreshJoinUrl() {
    this.syncService.sendRefreshRaumId(this.raumId, this.user);
  }

  displayConfigToggle() {
    //console.log(this.configRaumStatus);
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
    this.syncService.jumpBySeconds(offset);
  }

  tenSecBack() {
    this.jumpBySeconds(-10);
    this.syncService.startDisplayingSeconds();
  }

  tenSecForward() {
    this.jumpBySeconds(10);
    this.syncService.startDisplayingSeconds();
  }

  getLocalPlaylist(): Video[] {
    return this.playlist;
  }

  titleOrDescriptionHasChanged() {
    if (this.raumDescriptionChange !== this.raumDescription || this.raumTitleChange !== this.raumTitle) {
      return true;
    }
    return false;
  }

  switchLanguage(lang: Language) {
    this.languageService.selectedLanguageKey = lang.key;
    this.syncService.toastr.success(this.languageService.interpolate('$switched_lang') + ' ' + lang.key, '', ToastrConfigs.SUCCESS)
    this.syncService.cookieService.set('lang', lang.key, 30);
  }

}

export enum KEY_CODE {
  BACKSPACE = 8,
  TAB = 9,
  ENTER = 13,
  SHIFT = 16,
  CTRL = 17,
  ALT = 18,
  PAUSE = 19,
  CAPS_LOCK = 20,
  ESCAPE = 27,
  SPACE = 32,
  PAGE_UP = 33,
  PAGE_DOWN = 34,
  END = 35,
  HOME = 36,
  LEFT_ARROW = 37,
  UP_ARROW = 38,
  RIGHT_ARROW = 39,
  DOWN_ARROW = 40,
  INSERT = 45,
  DELETE = 46,
  KEY_0 = 48,
  KEY_1 = 49,
  KEY_2 = 50,
  KEY_3 = 51,
  KEY_4 = 52,
  KEY_5 = 53,
  KEY_6 = 54,
  KEY_7 = 55,
  KEY_8 = 56,
  KEY_9 = 57,
  KEY_A = 65,
  KEY_B = 66,
  KEY_C = 67,
  KEY_D = 68,
  KEY_E = 69,
  KEY_F = 70,
  KEY_G = 71,
  KEY_H = 72,
  KEY_I = 73,
  KEY_J = 74,
  KEY_K = 75,
  KEY_L = 76,
  KEY_M = 77,
  KEY_N = 78,
  KEY_O = 79,
  KEY_P = 80,
  KEY_Q = 81,
  KEY_R = 82,
  KEY_S = 83,
  KEY_T = 84,
  KEY_U = 85,
  KEY_V = 86,
  KEY_W = 87,
  KEY_X = 88,
  KEY_Y = 89,
  KEY_Z = 90,
  LEFT_META = 91,
  RIGHT_META = 92,
  SELECT = 93,
  NUMPAD_0 = 96,
  NUMPAD_1 = 97,
  NUMPAD_2 = 98,
  NUMPAD_3 = 99,
  NUMPAD_4 = 100,
  NUMPAD_5 = 101,
  NUMPAD_6 = 102,
  NUMPAD_7 = 103,
  NUMPAD_8 = 104,
  NUMPAD_9 = 105,
  MULTIPLY = 106,
  ADD = 107,
  SUBTRACT = 109,
  DECIMAL = 110,
  DIVIDE = 111,
  F1 = 112,
  F2 = 113,
  F3 = 114,
  F4 = 115,
  F5 = 116,
  F6 = 117,
  F7 = 118,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  F12 = 123,
  NUM_LOCK = 144,
  SCROLL_LOCK = 145,
  SEMICOLON = 186,
  EQUALS = 187,
  COMMA = 188,
  DASH = 189,
  PERIOD = 190,
  FORWARD_SLASH = 191,
  GRAVE_ACCENT = 192,
  OPEN_BRACKET = 219,
  BACK_SLASH = 220,
  CLOSE_BRACKET = 221,
  SINGLE_QUOTE = 222
}
