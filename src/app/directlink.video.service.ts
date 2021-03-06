import { IVideoService } from './ivideo.service';
import { SyncService } from './sync.service';
import { SupportedApi } from './supported-api';
import { Constants } from './constants';
import reframe from "reframe.js";




export class DirectLinkVideoService implements IVideoService {
    reframed: boolean;
    name: string;
    iframe: any;
    videoPlayer: any;
    syncService: SyncService;
    supportedApi: SupportedApi;

    constructor(supportedApi: SupportedApi, synService: SyncService, videoPlayer: any, playerWindow: any) {
        this.iframe = playerWindow;
        this.videoPlayer = playerWindow;
        this.syncService = synService;
        this.supportedApi = supportedApi;
        this.iframe.loop = false;
        this.iframe.muted = true;
    }

    init() {

    }

    hide(): void {
        if (this.iframe) {
            this.iframe.hidden = true;

        }
    }

    unHide(): void {
        if (this.iframe) {
            this.iframe.hidden = false;
            //reframe(this.iframe);
        }
    }
    isHidden(): boolean {
        return this.iframe.hidden;
    }

    getPlaybackQuality(): string {
        return this.videoPlayer.quality;
    }
    loadVideoById(urlObject: any): void {
        this.iframe.src = urlObject.videoId;
        let that = this;
        let waitForLoading = setInterval(function () {
            if (that.iframe.duration) {
                that.seekTo(urlObject.startSeconds, true);
                that.playVideo();
                clearInterval(waitForLoading);
            }

        }, 5);
    }

    mute(): void {
        this.videoPlayer.muted = true;
    }
    unMute(): void {
        this.videoPlayer.muted = false;
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
        this.videoPlayer.currentTime = seconds;
    }
    setVolume(value: number) {
        this.unMute();
        this.videoPlayer.volume = value / 100;
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

        return (this.videoPlayer.ended) ? Constants.FINISHED : ((this.videoPlayer.paused) ? Constants.PAUSED : Constants.PLAYING)
    }

    getAvailableQualityLevels(): string[] {
        return this.videoPlayer.qualities;

    }
    setPlaybackQuality(suggestedQuality: string) {
        this.videoPlayer.setQuality(suggestedQuality);
    }
    getAvailablePlaybackRates(): number[] {
        console.log('getAvailablePlaybackRates: not available')
        return [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25];

    }
    setPlaybackRate(rate: number) {
        this.videoPlayer.playbackRate = rate;
    }
    getPlaybackRate(): number {
        //console.log('getPlaybackRate: not available')
        return this.videoPlayer.playbackRate;
    }
    clearVideo() {
        //     throw new Error("Method not implemented.");
    }

}