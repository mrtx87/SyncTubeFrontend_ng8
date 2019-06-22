import { Component, OnInit } from '@angular/core';
import reframe from 'reframe.js';
import { SyncService } from '../sync.service';
import { Video } from './video';
import { User } from '../sync-tube/user';
@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})


export class VideoComponent implements OnInit {


  public YT: any;
  public video: any;
  public player: any;
  public reframed: Boolean = false;

  displayOptions: Boolean = false;
  displayPlaybackRatesOptions: Boolean = false;
  playbackRates: number[];

  displayAllControls: boolean = false;

  displaySubtitle: Boolean = false;

  isPlaying: Boolean = false;

  iframe: any;

  

  currentTimestamp: number = 0;
  currentTime: number;
  currentTimeProgressbar: number;
  currentDisplayedTime: number;

  volumeValue: number;

  videoDuration: number;


  //iframe: any;

  constructor(private syncService: SyncService) {
    this.syncService.registerVideoComponent(this);
  }


  init() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
  ngOnInit() {
    let that = this;
    this.init();
    this.video = this.syncService.synctubeComponent.video.videoId; //video id
    window['onYouTubeIframeAPIReady'] = (e) => {
      this.YT = window['YT'];
      this.reframed = false;
      this.player = new window['YT'].Player('player', {
        videoId: this.video,
        playerVars: {
          'autoplay': 0,
          'controls': 0,
          'rel': 0,
          'fs': 0,
        },
        events: {
          'onStateChange': this.onPlayerStateChange.bind(this),
          'onError': this.onPlayerError.bind(this),
          'onReady': (e) => {
            if (!this.reframed) {
              this.reframed = true;
              reframe(e.target.a);
            }

            that.processVideoIfLoaded(that);

            that.setIframe(e.target.a);
            console.log("!!! " + e.target.a.className + " !!!")
            that.currentTimeProgressbar = this.syncService.getVideo().timestamp;
            that.loadVideoById({
              videoId: this.syncService.getVideo().videoId,
              startSeconds: this.syncService.getVideo().timestamp,
              suggestedQuality: 'large'
            });

            /*
            
            that.togglePlayVideo(this.syncService.synctubeComponent.playerState);*/
            that.mute(); //DEBUG
          }
        }
      });

    };
  }

  setIframe(iframe: any) {
    this.iframe = iframe;
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
        clearInterval(wait);
      }
    }, 3)
  }

  getVideoDuration(): number {
    return this.player.getDuration();
  }
  setVideoDuration() {
    //this.syncService.setVideoDuration();
    this.videoDuration = this.getVideoDuration();
  }
  onPlayerStateChange(event) {
    console.log(event)
    switch (event.data) {
      case window['YT'].PlayerState.PLAYING:
        if (this.cleanTime() == 0) {
          console.log('started ' + this.cleanTime());
        } else {
          console.log('playing ' + this.cleanTime())
        };
        break;
      case window['YT'].PlayerState.PAUSED:
        if (this.player.getDuration() - this.player.getCurrentTime() != 0) {
          console.log('paused' + ' @ ' + this.cleanTime());
        };
        break;
      case window['YT'].PlayerState.ENDED:
        console.log('ended ');
        break;
    };
  };
  //utility
  cleanTime() {
    return Math.round(this.player.getCurrentTime())
  };
  onPlayerError(event) {
    switch (event.data) {
      case 2:
        console.log('' + this.video)
        break;
      case 100:
        break;
      case 101 || 150:
        break;
    };
  };

  setVideo(id: string) {
    this.video = id;
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
    that.timer = setInterval(function () {
      that.currentTimeProgressbar += 0.1;;
      that.currentDisplayedTime = that.getCurrentTime();
      that.syncService.synctubeComponent.video.timestamp = that.currentTime;
    }, 100);
  }

  stopUpdatingVideo() {
    clearInterval(this.timer);
  }

  playVideo() {
    this.player.playVideo();
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
    if (this.isLocalUserAdmin()) {
      if (this.getPlayerState() == SyncService.paused || this.getPlayerState() == SyncService.placed || this.getPlayerState() == SyncService.finished) {
        console.log("playvideo")
        this.syncService.sendTogglePlay(this.syncService.getLocalUser(), this.syncService.getRaumId(), SyncService.playing, this.getVideo(), this.getCurrentTime());
      }
      if (this.getPlayerState() == SyncService.playing) {
        console.log("pausevideo")
        this.syncService.sendTogglePlay(this.syncService.getLocalUser(), this.syncService.getRaumId(), SyncService.paused, this.getVideo(), this.getCurrentTime());
      }
    }
  }

  loadVideoById(urlObject: any): void {
    this.player.loadVideoById(urlObject);
  }

  onChangeProgressBar() {
    console.log(":::::::: " + this.currentTime)
    this.currentTimeProgressbar;
    this.stopUpdatingVideo();
    this.syncService.sendSeekToTimestamp(this.getLocalUser(), this.getRaumId(), this.getCurrentVideo().videoId, this.currentTimeProgressbar);
  }

  /*loadVideoFromSettings() {
    this.player.loadVideoById({
      videoId: this.syncService.synctubeComponent.video.videoId,
      startSeconds: this.syncService.synctubeComponent.video.timestamp,
      suggestedQuality: 'large'
    })
  }*/

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

  setFullscreen() {
    console.log("hallo")
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

  getAvailablePlaybackRates(): Array<number> {
    return this.player.getAvailablePlaybackRates();
  }

  getPlaybackRate(): number {
    return this.player.getPlaybackRate();
  }

  setPlaybackRate(rate: number) {
    this.player.setPlaybackRate(rate);
  }

  getOptions() {
    return this.player.getOptions();
  }

  toggleDisplayCinemaMode() {
    this.syncService.synctubeComponent.displayCinemaMode = !this.syncService.synctubeComponent.displayCinemaMode;
    //this.iframe.className = 'video'
    this.syncService.synctubeComponent.displayFullscreen = false;
  }

  toggleDisplayFullscreen() {
    this.syncService.synctubeComponent.displayFullscreen = !this.syncService.synctubeComponent.displayFullscreen;
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

  getVideo(): Video {
    return this.syncService.getVideo();
  }

  toggleFullscreen() {
    this.syncService.toggleFullscreen();
  }

  toggleDisplayPlaybackRates() {
    this.displayOptions = false;
    this.displayPlaybackRatesOptions = true;
  }

  returnToOptions() {
    this.displayPlaybackRatesOptions = false;
    this.displayOptions = true;
  }
  time: number = 0;

  startDisplayingAllControls() {
    if (!this.displayAllControls) {
      this.displayAllControls = true;
      let that = this;
      let toastControls = setInterval(function () {
        if (that.time >= 3000) {
          that.displayAllControls = false;
          clearInterval(toastControls);
          that.time = 0;
        }
        that.time += 25;
      }, 25)
    }
  }

  /* Video Controls
  */
  mouseOverSound() {
    console.log("tesetetet")
  }

  toggleSubtitle(_module, option, value) {
    this.displaySubtitle = !this.displaySubtitle;
    console.log("testestset")
    this.syncService.toggleSubtitle('cc', 'reload', this.displaySubtitle);
  }

  toggleMute() {
    this.syncService.toggleMute();
  }
 
  jumpBySeconds(offset : number) {
    this.syncService.jumpBySeconds(offset)
  }

  tenSecBack() {
    this.jumpBySeconds(-10);
    
  }

  tenSecForward() {
    this.jumpBySeconds(10);
  }
}

