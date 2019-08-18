import { IVideoService } from './ivideo.service';
import { SyncService } from './sync.service';
import { SupportedApi } from './supported-api';
import { Constants } from './constants';
import reframe from "reframe.js";




export class NoApiVideoService implements IVideoService {
    reframed: boolean;
    name: string;
    iframe: any;
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
        this.iframe.hidden = true;
    }
    unHide(): void {
        this.iframe.hidden = false;
        //reframe(this.iframe);
    }
    isHidden(): boolean {
        return this.iframe.hidden;
    }

    getPlaybackQuality(): string {
        return this.videoPlayer.quality;
    }
    loadVideoById(urlObject: any): void {
        this.iframe.src= urlObject.videoId;
    }
    mute(): void {
        this.videoPlayer.muted = true;
    }
    unMute(): void {
        this.videoPlayer.mute = false;
    }
    playVideo() {
        this.videoPlayer.play();
    }
    pauseVideo(): void {
        this.videoPlayer.pause();
    }
    stopVideo(): void {
        console.log('stopVideo: not available')
    }
    seekTo(seconds: number, allowSeekAhead: Boolean) {
        this.videoPlayer.seek(seconds);
    }
    setVolume(value: number) {
        this.videoPlayer.setVolume(value);
    }
    isMuted(): Boolean {
        return this.videoPlayer.muted;

    }
    getVideoDuration(): number {
        //    throw new Error("Method not implemented.");
        return this.videoPlayer.duration;

    }
    getCurrentTime(): number {
        //    throw new Error("Method not implemented.");
        return this.videoPlayer.currentTime;

    }
    getPlayerState(): number {
        return (this.videoPlayer.paused) ? Constants.PAUSED : Constants.PLAYING ; // TODO remove 
    }

    getAvailableQualityLevels(): string[] {
        return this.videoPlayer.qualities;

    }
    setPlaybackQuality(suggestedQuality: string) {
        this.videoPlayer.setQuality(suggestedQuality);
    }
    getAvailablePlaybackRates(): number[] {
        console.log('getAvailablePlaybackRates: not available')
        return [];

    }
    setPlaybackRate(rate: number) {
        //console.log('setPlaybackRate: not available')
    }
    getPlaybackRate(): number {
        //console.log('getPlaybackRate: not available')
        return 1;
    }
    clearVideo() {
        //     throw new Error("Method not implemented.");
    }

}