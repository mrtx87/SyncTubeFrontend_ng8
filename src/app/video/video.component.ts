import { Component, OnInit } from "@angular/core";
import reframe from "reframe.js";
import { SyncService } from "../sync.service";
import { Video } from "./video";
import { User } from "../sync-tube/user";
import { SupportedApiType } from "../supported-api-type";
import { SupportedApi } from "../supported-api";
import { YoutubeDataService } from "../youtube-dataservice";
import { DailymotionDataService } from "../dailymotion.dataservice";
import { YoutubeVideoService } from "../youtube.video.service";
import { DailymotionVideoService } from "../dailymotion.video.service";
import { IVideoService } from "../ivideo.service";
import { Constants } from '../constants';
import { LanguagesService } from '../languages.service';
import { DirectLinkVideoService } from '../directlink.video.service';
import { DirectLinkDataService } from '../directlink.dataservice';
declare const DM: any;

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
  volumeValue: number = 0;
  videoDuration: number;
  captions: any[];
  timeForSlider: number;
  switchVolumeIcon: number = 1;

  constructor(private syncService: SyncService, private languages: LanguagesService) {
    this.syncService.registerVideoComponent(this);
  }

  hasPlayer(): any {
    return this.syncService.currentVideoService.videoPlayer;
  }

  currentState: number = -999;
  listenForPlayerState() {
    let that = this;
    let listenForPlayerState = setInterval(function () {
      if (that.syncService.currentVideoService) {
        let state: number = that.syncService.currentVideoService.getPlayerState();

        if (state !== that.currentState) {
          console.log("state changed from " + that.currentState + " to " + state)
          that.currentState = state;
          //TODO TICKET: Werbung bei Videos nicht überspringbar?
        }


          if (state === Constants.FINISHED) {
            that.syncService.synctubeComponent.receivedPlayerState = state;
            that.syncService.sendAutoNextPlaylistVideo(
              that.getLocalUser(),
              that.getRaumId(),
              state
            );
          }

        if (that.currentPlaybackQuality !== that.getPlaybackQuality()) {
          that.currentPlaybackQuality = that.getPlaybackQuality();
        }
        that.currentPlaybackRate = that.getCurrentPlaybackRate();

      }

      if (that.volumeValue < 1) {
        that.switchVolumeIcon = 0;
      } else if (that.volumeValue >= 1 && that.volumeValue < 50) {
        that.switchVolumeIcon = 1;
      } else if (that.volumeValue > 50) {
        that.switchVolumeIcon = 2;
      }
    }, 10);
  }

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
    this.syncService.videoServices = new Map<string, IVideoService>();
    for (let supportedApi of this.syncService.synctubeComponent.supportedApis) {
      switch (supportedApi.id) {
        case SupportedApiType.Youtube:
          if (!this.syncService.videoServices.has(SupportedApiType.Youtube)) {
            this.initYoutubePlayer(supportedApi);
          }
          break;
        case SupportedApiType.Dailymotion:
          if (!this.syncService.videoServices.has(SupportedApiType.Dailymotion)) {
            this.initDailymotionPlayer(supportedApi);
          }
          break;
        case SupportedApiType.DirectLink:
          if (!this.syncService.videoServices.has(SupportedApiType.DirectLink)) {
            this.initNoApiIFrame(supportedApi);
          }
          break;
      }
    }
  }

  initNoApiIFrame(supportedApi: SupportedApi) {
    let iframe = document.getElementById("directlinkplayer");
    if (!this.reframed) {
      this.reframed = true;
      reframe(iframe);
    }
    this.syncService.videoServices.set(
      supportedApi.id,
      new DirectLinkVideoService(
        supportedApi,
        this.syncService,
        iframe,
        iframe
      )
    );
    console.log("onReady: nopapi iframe ready");
    this.syncService.hasSuccessfullyRegisteredAllVideoApis(supportedApi);
    this.syncService.addToLoadedVideoPlayers(supportedApi);
  }

  initYoutubePlayer(supportedApi: SupportedApi): void {
    let that = this;
    let videoPlayer: any;
    let YT: any;
    let iframe: any;
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
          'onStateChange': event => {
            console.log("EVENT!!!")
            console.log(event)
          },
          'onReady': e => {
            console.log("onReady: youtube player ready");
            if (!this.reframed) {
              this.reframed = true;
              reframe(e.target.a);
            }
            iframe = e.target.a;

            let iframe_: HTMLElement = iframe;

            let ytVideoService: YoutubeVideoService = this.syncService.videoServices.get(supportedApi.id);
            ytVideoService.videoPlayer = videoPlayer;
            ytVideoService.iframe = iframe;
            videoPlayer.mute();
            this.syncService.addToLoadedVideoPlayers(supportedApi);
          }
        }
      });
    };
    that.syncService.videoServices.set(
      supportedApi.id,
      new YoutubeVideoService(
        supportedApi,
        this.syncService,
        videoPlayer,
        iframe
      )
    );
    this.syncService.hasSuccessfullyRegisteredAllVideoApis(supportedApi);

  }

  initDailymotionPlayer(supportedApi: SupportedApi): void {
    let that = this;
    let iframe = DM.player(
      document.getElementById(supportedApi.name + "player"),
      {
        video: "",
        width: "500px",
        height: "300px",
        params: {
          autoplay: false,
          mute: true,
          controls: false,
          api: 1
        }
      }
    );
    let videoPlayer = DM.Player;
    iframe.addEventListener("apiready", function (event) {
      console.log("onReady: dailymotion player ready");
      this.reframed = false;
      if (!this.reframed) {
        this.reframed = true;
        reframe(event.target);
      }
      that.syncService.addToLoadedVideoPlayers(supportedApi);

    });
    this.syncService.videoServices.set(
      supportedApi.id,
      new DailymotionVideoService(
        supportedApi,
        this.syncService,
        iframe,
        iframe
      )
    );
    this.syncService.hasSuccessfullyRegisteredAllVideoApis(supportedApi);
    iframe.hidden = true;
  }

  getVideoDuration(): number {
    return this.syncService.currentVideoService.getVideoDuration();
  }

  getTimeForSlider() {
    this.timeForSlider = (this.currentTime / this.videoDuration) * 100;
  }

  setProgressbarVideoDuration(duration: number) {
    this.videoDuration = duration;
  }

  getInitalPlaybackRate(): number {
    return this.syncService.getInitalPlaybackRate();
  }

  getCurrentTime(): number {
    return this.syncService.currentVideoService.getCurrentTime();
  }

  getPlayerState(): number {
    return this.syncService.currentVideoService.getPlayerState();
  }

  seekTo(seconds: number, allowSeekAhead: Boolean): void {
    this.syncService.currentVideoService.seekTo(seconds, allowSeekAhead);
  }

  pauseVideo(): void {
    this.syncService.currentVideoService.pauseVideo();
  }

  stopVideo(): void {
    this.syncService.currentVideoService.stopVideo();
  }

  getReceivedPlayerState(): number {
    return this.syncService.getReceivedPlayerState();
  }

  playVideo() {
    this.syncService.currentVideoService.playVideo();
  }

  clearVideo() {
    this.syncService.currentVideoService.clearVideo();
  }

  getCurrentPlaybackRate() {
    return this.currentPlaybackRate;
  }

  getAvailableQualityLevels(): string[] {
    return this.syncService.currentVideoService.getAvailableQualityLevels();
  }

  isLocalUserAdmin() {
    return this.getLocalUser().admin;
  }

  triggerTogglePlay(): void {
    if (this.isLocalUserAdmin() && this.getCurrentVideo()) {
      if (
        this.getPlayerState() == Constants.PAUSED ||
        this.getPlayerState() == Constants.PLACED ||
        this.getPlayerState() == Constants.FINISHED
      ) {
        this.syncService.sendTogglePlay(
          this.syncService.getLocalUser(),
          this.syncService.getRaumId(),
          Constants.PLAYING,
          this.getCurrentVideo(),
          this.getCurrentTime()
        );
      } else if (this.getPlayerState() == Constants.PLAYING) {
        this.syncService.sendTogglePlay(
          this.syncService.getLocalUser(),
          this.syncService.getRaumId(),
          Constants.PAUSED,
          this.getCurrentVideo(),
          this.getCurrentTime()
        );
      }
    }
  }

  onChangeProgressBar() {
    if (this.getCurrentVideo()) {
      this.syncService.stopUpdatingVideo();
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

  getRaumId(): string {
    return this.syncService.getRaumId();
  }

  getCurrentVideo(): Video {
    return this.syncService.getVideo();
  }

  setVolume() {
    if (this.syncService.videoComponent.volumeValue <= 1) {
      this.mute();
      this.syncService.currentVideoService.setVolume(0);
    } else {
      this.unMute();
      this.syncService.currentVideoService.setVolume(
        this.syncService.videoComponent.volumeValue
      );
    }
  }

  mute(): void {
    this.syncService.currentVideoService.mute();
  }

  unMute(): void {
    this.syncService.currentVideoService.unMute();
  }

  isMuted(): Boolean {
    return this.syncService.currentVideoService.isMuted();
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
    return this.syncService.currentVideoService.getAvailablePlaybackRates();
  }

  setPlaybackRate(rate: number) {
    this.syncService.currentVideoService.setPlaybackRate(rate);
  }

  getPlaybackRate(): number {
    return this.syncService.currentVideoService.getPlaybackRate();
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

  setPlaybackRates(rates: number[]) {
    this.playbackRates = rates;
  }

  toggleDisplayOptions() {
    this.displayOptions = !this.displayOptions;
  }

  /*
  setSize(width: number, height: number) {
    this.player.setSize(width, height);
  }*/

  getPlaybackQuality() {
    return this.syncService.currentVideoService.getPlaybackQuality();
  }

  setPlaybackQuality(suggestedQuality: string) {
    this.syncService.currentVideoService.setPlaybackQuality(suggestedQuality);
  }

  toggleFullscreen() {
    this.syncService.toggleFullscreen();
  }

  toggleDisplayPlaybackRates() {
    if (this.playbackRates && this.playbackRates.length > 0) {
      this.displayPlaybackRatesOptions = !this.displayPlaybackRatesOptions;
    }
  }

  time: number = 0;

  startDisplayingAllControls() {
    if (!this.displayAllControls) {
      this.displayAllControls = true;
      let that = this;
      let toastControls = setInterval(function () {
        if (that.time >= Constants.displayControlsLength) {
          that.displayAllControls = false;
          that.time = 0;
          clearInterval(toastControls);
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

  private jumpBySeconds_(offset: number) {
    this.syncService.jumpBySeconds(offset);
  }

  jumpBySeconds(seconds: number) {
    this.jumpBySeconds_(seconds);
    this.startDisplayingSeconds();
  }


  intervalSeconds: number = 0;
  startDisplayingSeconds() {
    this.displaySecondsBack = true;
    let that = this;
    let secondsOffsetTimer = setInterval(function () {
      that.intervalSeconds += 25;
      if (that.intervalSeconds >= 300) {
        that.displaySecondsBack = false;
        that.intervalSeconds = 0;
        clearInterval(secondsOffsetTimer);
      }
    }, 25);
  }
}
