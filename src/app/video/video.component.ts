import { Component, OnInit } from "@angular/core";
import reframe from "reframe.js";
import { SyncService } from "../sync.service";
import { Video } from "./video";
import { User } from "../sync-tube/user";
import { SupportedApiType } from '../supported-api-type';
import { SupportedApi } from '../supported-api';
import { YoutubeDataService } from '../youtube-dataservice';
import { DailymotionDataService } from '../dailymotion.dataservice';
import { VimeoDataService } from '../vimeo.dataservice.';
import { YoutubeVideoService } from '../youtube.video.service';
import { VimeoVideoService } from '../vimeo.video.service';
import { ApiService } from '../api.service';
import { DailymotionVideoService } from '../dailymotion.video.service';
declare const DM: any;
declare const Vimeo: any;


@Component({
  selector: "app-video",
  templateUrl: "./video.component.html",
  styleUrls: ["./video.component.css"]
})
export class VideoComponent implements OnInit {
  
  
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

  hasPlayer(): any {
    return this.syncService.currentApiService.videoService.videoPlayer;
  }

  listenForPlayerState() {
    let that = this;
    setInterval(function () {
      var state = that.syncService.currentApiService.videoService.getPlayerState();
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
          //this.initVimeoPlayer(supportedApi);
          break;

      }
    }
    /*
    let player: HTMLElement = document.getElementById("youtubeplayer");
    console.log(player)
    player.hidden = true;*/

  }


  initYoutubePlayer(supportedApi: SupportedApi): void {
    let that = this;
    let videoPlayer: any;
    let YT: any;
    window["onYouTubeIframeAPIReady"] = e => {
      YT = window["YT"];
      this.reframed = false;
      videoPlayer = new window["YT"].Player(supportedApi.name + "player", {
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
            let apiService: ApiService = this.syncService.getApiServiceByKey(SupportedApiType.Youtube);
            apiService.videoService = new YoutubeVideoService(YT, videoPlayer, this.syncService);
            
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
            that.mute(); //DEBUG */
            
          }
        }
      });
    };
  }


  initDailymotionPlayer(supportedApi: SupportedApi): DailymotionVideoService {
    let videoPlayer = DM.player(document.getElementById(supportedApi.name + "player"), {
      video: "xwr14q",
      width: "100%",
      height: "100%",
      params: {
        autoplay: true,
        mute: true
      }
    });
    return null;
  }

  initVimeoPlayer(supportedApi: SupportedApi): VimeoVideoService {
    let videoPlayer = new Vimeo.Player(document.getElementById(supportedApi.name + "player"));

    videoPlayer.on('play', function () {
      console.log('Played the video');
    });

    videoPlayer.getVideoTitle().then(function (title) {
      console.log('title:', title);
    });
    return null;
  }

  processVideoIfLoaded(that: VideoComponent) {
    let wait = setInterval(function () {
      if (that.syncService.currentApiService.videoService.getPlayerState() == SyncService.playing) {
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
    return this.syncService.currentApiService.videoService.getVideoDuration();
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
    return this.syncService.currentApiService.videoService.getCurrentTime();
  }

  getPlayerState(): number {
    return this.syncService.currentApiService.videoService.getPlayerState();
  }

  seekTo(seconds: number, allowSeekAhead: Boolean): void {
    this.syncService.currentApiService.videoService.seekTo(seconds, allowSeekAhead);
  }

  pauseVideo(): void {
    this.syncService.currentApiService.videoService.pauseVideo();
  }

  stopVideo(): void {
    this.syncService.currentApiService.videoService.stopVideo();
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
    this.syncService.currentApiService.videoService.playVideo();
  }

  clearVideo() {
    this.syncService.currentApiService.videoService.clearVideo();
  }

  getCurrentPlaybackRate() {
    return this.currentPlaybackRate;
  }

  getAvailableQualityLevels(): string[] {
    return this.syncService.currentApiService.videoService.getAvailableQualityLevels();
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
    this.syncService.currentApiService.videoService.loadVideoById(urlObject);
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
    this.syncService.currentApiService.videoService.setVolume();
  }

  mute(): void {
    this.syncService.currentApiService.videoService.mute();

  }

  unMute(): void {
    this.syncService.currentApiService.videoService.unMute();
  }

  isMuted(): Boolean {
    return this.syncService.currentApiService.videoService.isMuted();
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
    return this.syncService.currentApiService.videoService.getAvailablePlaybackRates();
  }

  setPlaybackRate(rate: number) {
    this.syncService.currentApiService.videoService.setPlaybackRate(rate);
  }

  getPlaybackRate(): number {
    return this.syncService.currentApiService.videoService.getPlaybackRate();
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

  setPlaybackRates() {
    this.playbackRates = this.getAvailablePlaybackRates();
  }

  toggleDisplayOptions() {
    this.displayOptions = !this.displayOptions;
  }

  /*
  setSize(width: number, height: number) {
    this.player.setSize(width, height);
  }*/

  getPlaybackQuality() {
    return this.syncService.currentApiService.videoService.getPlaybackQuality();
  }

  setPlaybackQuality(suggestedQuality: string) {
    this.syncService.currentApiService.videoService.setPlaybackQuality(suggestedQuality);
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
