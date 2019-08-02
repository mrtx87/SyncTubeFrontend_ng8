import { IVideoService } from './ivideo.service';
import { SyncService } from './sync.service';
import { SupportedApi } from './supported-api';

export class YoutubeVideoService implements IVideoService {
    reframed: boolean;

    name: string;
    iframe: any;
    videoPlayer: any;
    syncService: SyncService;
    supportedApi: SupportedApi;

    constructor(supportedApi: SupportedApi,synService: SyncService, videoPlayer: any,  playerWindow: any) {
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
    }
    isHidden(): boolean {
        return this.iframe.hidden;
    }

    getPlaybackQuality(): string {
        return this.videoPlayer.getPlaybackQuality();
    }

    loadVideoById(urlObject: any): void {
        this.videoPlayer.loadVideoById(urlObject);
    }
    mute(): void {
        this.syncService.synctubeComponent.isMuted = true;
        this.videoPlayer.mute();
    }
    unMute(): void {
        this.syncService.synctubeComponent.isMuted = false;
        this.videoPlayer.unMute();
    }
    playVideo() {
        this.videoPlayer.playVideo();
    }
    pauseVideo(): void {
        this.videoPlayer.pauseVideo();
    }
    stopVideo(): void {
        this.videoPlayer.stopVideo();
    }
    seekTo(seconds: number, allowSeekAhead: Boolean) {
        this.videoPlayer.seekTo(seconds, allowSeekAhead);
    }
    setVolume(value: number) {
        this.videoPlayer.setVolume(value);
    }
    isMuted(): Boolean {
        return this.videoPlayer.isMuted();
    }
    getVideoDuration(): number {
        return this.videoPlayer.getDuration();
    }
    getCurrentTime(): number {
        return this.videoPlayer.getCurrentTime();
    }
    getPlayerState(): number {
        return this.videoPlayer.getPlayerState();
    }

    getAvailableQualityLevels(): string[] {
        return this.videoPlayer.getAvailableQualityLevels();
    }
    setPlaybackQuality(suggestedQuality: string) {
        this.videoPlayer.setPlaybackQuality(suggestedQuality);
    }
    getAvailablePlaybackRates(): number[] {
        return this.videoPlayer.getAvailablePlaybackRates();
    }
    setPlaybackRate(rate: number) {
        this.videoPlayer.setPlaybackRate(rate);
        this.syncService.videoComponent.currentPlaybackRate = rate;
    }
    getPlaybackRate(): number {
        return this.videoPlayer.getPlaybackRate();
    }
    clearVideo() {
        this.videoPlayer.clearVideo();
    }

}