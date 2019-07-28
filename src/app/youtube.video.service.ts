import { IVideoService } from './ivideo.service';
import { SyncService } from './sync.service';

export class YoutubeVideoService implements IVideoService {

    playerWindow: any;
    videoPlayer: any;
    syncService: SyncService;

    constructor(videoPlayer: any, synService: SyncService, playerWindow?: any,) {
        this.playerWindow = playerWindow;
        this.videoPlayer = videoPlayer;
        this.syncService = synService;
    }

    init() {

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
    setVolume() {
        if (this.syncService.videoComponent.volumeValue <= 1) {
            this.mute();
            this.videoPlayer.setVolume(0);
        } else {
            this.unMute();
            this.videoPlayer.setVolume(this.syncService.videoComponent.volumeValue);
        }
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