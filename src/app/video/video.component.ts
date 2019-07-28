import { Component, OnInit } from "@angular/core";
import reframe from "reframe.js";
import { SyncService } from "../sync.service";
import { Video } from "./video";
import { User } from "../sync-tube/user";
import { SupportedApiType } from '../supported-api-type';
import { SupportedApi } from '../supported-api';
import { YoutubeDataService } from '../youtube-dataservice';
import { all } from 'q';

@Component({
  selector: "app-video",
  templateUrl: "./video.component.html",
  styleUrls: ["./video.component.css"]
})
export class VideoComponent implements OnInit {
  public YT: any;
  public player: any;
  public reframed: Boolean = false;

  displayOptions: Boolean = false;
  displayPlaybackRatesOptions: Boolean = false;
  displayPlaybackQualityOptions: Boolean = false;
  displaySecondsBack: Boolean = false;
  displaySecondsForward: Boolean = false;
  playbackRates: number[];
  currentPlaybackRate: number;
  displayAllControls: boolean = false;
  displaySubtitle: Boolean = false;
  isPlaying: Boolean = false;
  currentTimestamp: number = 0;
  currentTime: number;
  currentTimeProgressbar: number;
  currentDisplayedTime: number = 0;

  public get currentDisplayingTime(): number {
    return this.hasPlayer() ? this.getCurrentTime() : 0; 
  }


  availableQualitys: string[];
  currentPlaybackQuality: string;
  volumeValue: number = 49;
  videoDuration: number;
  captions: any[];
  timeForSlider: number;
  switchVolumeIcon: number = 1;

  constructor(private syncService: SyncService) {
    this.syncService.registerVideoComponent(this);
  }

  hasPlayer() : any {
    return this.player;
  }

  listenForPlayerState() {
    let that = this;
    setInterval(function () {
      var state = that.player.getPlayerState();
      if (that.getReceivedPlayerState() !== state) {
        if (state === SyncService.FINISHED) {
          that.syncService.synctubeComponent.receivedPlayerState = state;
          that.syncService.sendAutoNextPlaylistVideo(
            that.getLocalUser(),
            that.getRaumId(),
            state
          );
        }
      }

      if (that.currentPlaybackQuality !== that.getPlaybackQuality()) {
        that.currentPlaybackQuality = that.getPlaybackQuality();
      }
      that.currentPlaybackRate = that.getCurrentPlaybackRate();

      if (that.volumeValue < 1) {
        that.switchVolumeIcon = 0;
      } else if (that.volumeValue >= 1 && that.volumeValue < 50) {
        that.switchVolumeIcon = 1;
      } else if (that.volumeValue > 50) {
        that.switchVolumeIcon = 2;
      }
    }, 10);
  }

  // <script src="https://api.dmcdn.net/all.js"></script>

  initScripts() {
    for (let supportedApi of this.syncService.synctubeComponent.supportedApis) {
      if (supportedApi.script) {
        var tag = document.createElement("script");
        tag.src = supportedApi.script;
        var firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }

  ngOnInit() {
    this.initScripts();
    this.initVideoPlayers();

  }

  initVideoPlayers() {
    for (let supportedApi of this.syncService.synctubeComponent.supportedApis) {
      switch (supportedApi.id) {
        case SupportedApiType.Youtube:
          this.initYoutubePlayer(supportedApi);
          break;
        case SupportedApiType.Dailymotion:
          //this.initDailymotionPlayer(supportedApi);
          break;
        case SupportedApiType.Vimeo:
          break;

      }
    }
  }


  initYoutubePlayer(supportedApi: SupportedApi) : YoutubeDataService {
    let that = this;
    let videoPlayer;
    window["onYouTubeIframeAPIReady"] = e => {
      this.YT = window["YT"];
      this.reframed = false;
      this.player = new window["YT"].Player(supportedApi.name + "player", {
        videoId: null,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0
        },
        events: {
          onReady: e => {
            if (!this.reframed) {
              this.reframed = true;
              reframe(e.target.a);
            }

            that.listenForPlayerState();
            if (that.syncService.getVideo()) {
              that.processVideoIfLoaded(that);
              that.currentTimeProgressbar = this.syncService.getVideo().timestamp;
              that.loadVideoById({
                videoId: this.syncService.getVideo().videoId,
                startSeconds: this.syncService.getVideo().timestamp,
                suggestedQuality: "large"
              });
            }
            that.mute(); //DEBUG
          }
        }
      });
    };
    return null;
  }
 DM: any;


  initDailymotionPlayer(supportedApi: SupportedApi) {
    let videoPlayer = this.DM.player(document.getElementById(supportedApi.name + "player"), {
      video: "xwr14q",
      width: "100%",
      height: "100%",
      params: {
          autoplay: true,
          mute: true
      }
  });
  }


  processVideoIfLoaded(that: VideoComponent) {
    let wait = setInterval(function () {
      if (that.player.getPlayerState() == SyncService.playing) {
        that.setVideoDuration();
        that.togglePlayVideo(that.getReceivedPlayerState());
        if (that.syncService.synctubeComponent.users.length > 1) {
          that.sendRequestSyncTimestamp();
        }
        that.setPlaybackRates();
        that.availableQualitys = that.getAvailableQualityLevels();
        that.setPlaybackRate(that.getInitalPlaybackRate());
        clearInterval(wait);
      }
    }, 3);
  }

  getVideoDuration(): number {
    return this.player.getDuration();
  }

  getTimeForSlider() {
    this.timeForSlider = (this.currentTime / this.videoDuration) * 100;
  }

  setVideoDuration() {
    this.videoDuration = this.getVideoDuration();
  }

  getInitalPlaybackRate(): number {
    return this.syncService.getInitalPlaybackRate();
  }

  getCurrentTime(): number {
    return this.player.getCurrentTime();
  }

  getPlayerState(): number {
    return this.player.getPlayerState();
  }

  seekTo(seconds: number, allowSeekAhead: Boolean): void {
    this.player.seekTo(seconds, allowSeekAhead);
  }

  pauseVideo(): void {
    this.player.pauseVideo();
  }

  stopVideo(): void {
    this.player.stopVideo();
  }

  getReceivedPlayerState(): number {
    return this.syncService.getReceivedPlayerState();
  }

  updateVideoContinously(that: VideoComponent) {
    if (that.timer) {
      clearInterval(that.timer);
      that.timer = null;
    }
    that.timer = setInterval(function () {
      that.currentTimeProgressbar += 0.01 * that.getPlaybackRate();
      that.currentDisplayedTime = that.getCurrentTime();
      that.syncService.synctubeComponent.video.timestamp = that.currentTime;
    }, 10);
  }

  stopUpdatingVideo() {
    clearInterval(this.timer);
  }

  playVideo() {
    this.player.playVideo();
  }

  clearVideo() {
    this.player.clearVideo();
  }

  getCurrentPlaybackRate() {
    return this.currentPlaybackRate;
  }

  getAvailableQualityLevels(): string[] {
    return this.player.getAvailableQualityLevels();
  }

  timer: any;
  togglePlayVideo(playerState: number) {
    if (playerState == SyncService.playing) {
      this.playVideo();
      this.isPlaying = true;
      let that = this;
      this.updateVideoContinously(that);
      return;
    }
    if (playerState == SyncService.paused) {
      this.pauseVideo();
      this.isPlaying = false;
      clearInterval(this.timer);
      return;
    }
  }

  isLocalUserAdmin() {
    return this.getLocalUser().admin;
  }

  triggerTogglePlay(): void {
    if (this.isLocalUserAdmin() && this.getCurrentVideo()) {
      if (
        this.getPlayerState() == SyncService.paused ||
        this.getPlayerState() == SyncService.placed ||
        this.getPlayerState() == SyncService.FINISHED
      ) {
        console.log("playvideo");
        this.syncService.sendTogglePlay(
          this.syncService.getLocalUser(),
          this.syncService.getRaumId(),
          SyncService.playing,
          this.getCurrentVideo(),
          this.getCurrentTime()
        );
      } else if (this.getPlayerState() == SyncService.playing) {
        console.log("pausevideo");
        this.syncService.sendTogglePlay(
          this.syncService.getLocalUser(),
          this.syncService.getRaumId(),
          SyncService.paused,
          this.getCurrentVideo(),
          this.getCurrentTime()
        );
      }
    }
  }

  loadVideoById(urlObject: any): void {
    this.player.loadVideoById(urlObject);
  }

  onChangeProgressBar() {
    if (this.getCurrentVideo()) {
      this.currentTimeProgressbar;
      this.stopUpdatingVideo();
      this.syncService.sendSeekToTimestamp(
        this.getLocalUser(),
        this.getRaumId(),
        this.getCurrentVideo().videoId,
        this.currentTimeProgressbar
      );
    }
  }

  getCurrentTimestamp(): number {
    return this.currentTimestamp;
  }

  getLocalUser(): User {
    return this.syncService.getLocalUser();
  }

  getRaumId(): number {
    return this.syncService.getRaumId();
  }

  getCurrentVideo(): Video {
    return this.syncService.getVideo();
  }

  setVolume() {
    if (this.volumeValue <= 1) {
      this.mute();
      this.player.setVolume(0);
    } else {
      this.unMute();
      this.player.setVolume(this.volumeValue);
    }
  }

  mute(): void {
    this.syncService.synctubeComponent.isMuted = true;
    this.player.mute();
  }

  unMute(): void {
    this.syncService.synctubeComponent.isMuted = false;
    this.player.unMute();
  }

  isMuted(): Boolean {
    return this.player.isMuted();
  }

  sendRequestSyncTimestamp() {
    this.syncService.sendRequestSyncTimestamp();
  }

  sendChangePlaybackRate(rate: number) {
    this.syncService.sendChangePlaybackRate(
      this.getLocalUser(),
      this.getRaumId(),
      rate
    );
  }

  getAvailablePlaybackRates(): Array<number> {
    return this.player.getAvailablePlaybackRates();
  }

  setPlaybackRate(rate: number) {
    this.player.setPlaybackRate(rate);
    this.currentPlaybackRate = rate;
  }

  getPlaybackRate(): number {
    return this.player.getPlaybackRate();
  }

  toggleDisplayCinemaMode() {
    this.syncService.synctubeComponent.displayCinemaMode = !this.syncService
      .synctubeComponent.displayCinemaMode;
    //this.iframe.className = 'video'
    this.syncService.synctubeComponent.displayFullscreen = false;
  }

  toggleDisplayFullscreen() {
    this.syncService.synctubeComponent.displayFullscreen = !this.syncService
      .synctubeComponent.displayFullscreen;
    this.syncService.synctubeComponent.displayCinemaMode = false;
    /* if (this.syncService.synctubeComponent.displayFullscreen) {
       this.iframe.className = 'video-fullscreen'
     } else {
       this.iframe.className = 'video'
     }*/
  }

  setOption(_module, option, value) {
    this.player.setOption(_module, option, value);
  }

  setPlaybackRates() {
    this.playbackRates = this.getAvailablePlaybackRates();
  }

  toggleDisplayOptions() {
    this.displayOptions = !this.displayOptions;
  }

  setSize(width: number, height: number) {
    this.player.setSize(width, height);
  }

  getPlaybackQuality() {
    return this.player.getPlaybackQuality();
  }

  setPlaybackQuality(suggestedQuality: string) {
    if (this.player) {
      this.player.setPlaybackQuality(suggestedQuality);
    }
  }

  toggleFullscreen() {
    this.syncService.toggleFullscreen();
  }

  toggleDisplayPlaybackRates() {
    this.displayPlaybackRatesOptions = !this.displayPlaybackRatesOptions;
  }

  time: number = 0;

  startDisplayingAllControls() {
    if (!this.displayAllControls) {
      this.displayAllControls = true;
      let that = this;
      let toastControls = setInterval(function () {
        if (that.time >= 2000000) {
          that.displayAllControls = false;
          clearInterval(toastControls);
          that.time = 0;
        }
        that.time += 25;
      }, 25);
    }
  }

  /* Video Controls
   */
  mouseOverSound() {
    //@TODO
  }

  toggleSubtitle(_module, option, value) {
    this.displaySubtitle = !this.displaySubtitle;
    console.log("testestset");
    this.syncService.toggleSubtitle(
      "captions",
      "tracklist",
      this.displaySubtitle
    );
  }

  toggleMute() {
    this.syncService.toggleMute();
  }

  jumpBySeconds(offset: number) {
    this.syncService.jumpBySeconds(offset);
  }

  tenSecBack() {
    this.jumpBySeconds(-10);
    this.startDisplaylingsecondsBack();
  }

  tenSecForward() {
    this.jumpBySeconds(10);
    this.startDisplaylingsecondsForward();
  }

  intervalSeconds: number = 0;
  startDisplaylingsecondsBack() {
    this.displaySecondsBack = true;
    let that = this;
    let secondsBackTimer = setInterval(function () {
      that.intervalSeconds += 25;
      if (that.intervalSeconds >= 300) {
        that.displaySecondsBack = false;
        that.intervalSeconds = 0;
        clearInterval(secondsBackTimer);
      }
    }, 25);
  }
  startDisplaylingsecondsForward() {
    this.displaySecondsForward = true;
    let that = this;
    let secondsForwardTimer = setInterval(function () {
      that.intervalSeconds += 25;
      if (that.intervalSeconds >= 300) {
        that.displaySecondsForward = false;
        that.intervalSeconds = 0;
        clearInterval(secondsForwardTimer);
      }
    }, 25);
  }
}
