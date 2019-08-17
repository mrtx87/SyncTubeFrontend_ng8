import { IVideoService } from './ivideo.service';
import { SyncService } from './sync.service';
import { SupportedApi } from './supported-api';
import reframe from "reframe.js";


export class VimeoVideoService implements IVideoService {
    reframed: boolean;
    name: string;
    iframe: any;
    div : any;
    videoPlayer: any;
    syncService: SyncService;
    supportedApi: SupportedApi;

    constructor(supportedApi: SupportedApi, synService: SyncService, videoPlayer: any, playerWindow: any) {
        this.iframe = playerWindow;
        this.videoPlayer = videoPlayer;
        this.syncService = synService;
        this.supportedApi = supportedApi;
    }

    init() {

    }

    hide(): void {
        this.div.hidden = true;
    }
    unHide(): void {
        this.div.hidden = false;
    }
    isHidden(): boolean {
        return this.iframe.hidden;
    }

    getPlaybackQuality(): string {
        throw new Error("Method not implemented.");
    }

    loadVideoById(urlObject: any): void {
        let that = this;
        this.mute();
        this.videoPlayer.loadVideo(urlObject.videoId).then(function (id) {
            if (!that.reframed) {
                that.reframed = true;
                reframe(that.iframe);
            }
            that.syncService.togglePlayVideo(that.syncService.getReceivedPlayerState());
        })
    }
    mute(): void {
        this.videoPlayer.setVolume(0);
    }
    unMute(): void {
        this.videoPlayer.setVolume(this.syncService.videoComponent.volumeValue)
    }
    playVideo() {
        this.videoPlayer.play().then(function () {
            console.log("video started")
        });
    }
    pauseVideo(): void {
        this.videoPlayer.pause();
    }
    stopVideo(): void {
        this.videoPlayer.stop();
    }
    seekTo(seconds: number, allowSeekAhead: Boolean) {
        this.videoPlayer.setCurrentTime(seconds)
    }
    setVolume(value: number) {
        this.videoPlayer.setVolume(value/100);
    }
    isMuted(): Boolean {
        return this.videoPlayer.getVolume() == 0;
    }
    getVideoDuration(): number {
        return this.videoPlayer.getVideoDuration();
    }
    getCurrentTime(): number {
        let wait: boolean = true;
        let secs: number;
        this.videoPlayer.getCurrentTime().then(function(seconds) {
            secs = seconds;
        });

        return secs;
    }
    getPlayerState(): number {
        return (this.videoPlayer.getPaused() || this.videoPlayer.getEnded()) ? 2 : 1;
    }

    getAvailableQualityLevels(): string[] {
        return ["default"];
    }
    setPlaybackQuality(suggestedQuality: string) {
        console.log('setPlaybackQuality: not supported');
    }
    getAvailablePlaybackRates(): number[] {
        return [1]; //this.videoPlayer
    }
    setPlaybackRate(rate: number) {
        this.videoPlayer.setPlaybackRate(rate);
    }
    getPlaybackRate(): number {
        return this.videoPlayer.getPlaybackRate();
    }
    clearVideo() {
        console.log('clearVideo: not supported');
    }

}