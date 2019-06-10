import { Component, OnInit } from '@angular/core';
import reframe from 'reframe.js';
import { SyncService } from '../sync.service';
import { Video } from './video';
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


            this.setIframe(e.target.a);
            console.log("!!! " + e.target.a.className + " !!!")

            that.loadVideoById({
              videoId: this.syncService.getVideo().videoId,
              startSeconds: this.syncService.getVideo().timestamp,
              suggestedQuality: 'large'
            });
            let wait = setInterval(function () {
              if (that.getPlayerState() == SyncService.playing) {
                that.setVideoDuration();
                that.togglePlayVideo(that.syncService.synctubeComponent.playerState);
                if(that.syncService.synctubeComponent.users.length > 1) {
                  that.sendRequestSyncTimestamp();
                }
                that.setPlaybackRates();
                clearInterval(wait);
              }
            }, 5)
            /*
            
            that.togglePlayVideo(this.syncService.synctubeComponent.playerState);*/
            that.mute(); //DEBUG
          }
        }
      });

    };
  }

  setIframe(iframe: any) {
    this.syncService.setIframe(iframe);
  }


  getVideoDuration(): number {
    return this.player.getDuration();
  }
  setVideoDuration() {
    this.syncService.setVideoDuration(this.getVideoDuration());
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

  playVideo() {
    this.player.playVideo();
  }
  timer: any;
  togglePlayVideo(playerState: number) {
    if (playerState == SyncService.playing) {
      this.playVideo();
      this.syncService.synctubeComponent.isPlaying = true;
      let that = this;
      this.timer = setInterval(function () {
        that.syncService.synctubeComponent.video.timestamp = that.getCurrentTime();
      }, 500);
      return;
    }
    if (playerState == SyncService.paused) {
      this.pauseVideo();
      this.syncService.synctubeComponent.isPlaying = false;
      clearInterval(this.timer);
      return;
    }
  }

  triggerTogglePlay(): void {
    if (this.getPlayerState() == SyncService.paused || this.getPlayerState() == SyncService.placed || this.getPlayerState() == SyncService.finished) {
      console.log("playvideo")
      this.syncService.sendTogglePlay(this.syncService.getUser(), this.syncService.getRaumId(), SyncService.playing, this.getVideo());
    }
    if (this.getPlayerState() == SyncService.playing) {
      console.log("pausevideo")
      this.syncService.sendTogglePlay(this.syncService.getUser(), this.syncService.getRaumId(), SyncService.paused, this.getVideo());
    }
  }

  loadVideoById(urlObject: any): void {
    this.player.loadVideoById(urlObject);
  }
  loadVideoFromSettings() {
    this.player.loadVideoById({
      videoId: this.syncService.synctubeComponent.video.videoId,
      startSeconds: this.syncService.synctubeComponent.video.timestamp,
      suggestedQuality: 'large'
    })
  }

  setVolume(value: number) {
    this.unMute();
    this.player.setVolume(value);
  }
  setFullscreen() {
    console.log("hallo")
  }


  mute(): void {
    this.player.mute();
  }

  unMute(): void {
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

  toggleSubtitle(_module, option, value) {
    this.setOption(_module, option, value);
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
}