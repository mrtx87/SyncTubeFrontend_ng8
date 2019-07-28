import { IVideoService } from './ivideo.service';
import { SyncService } from './sync.service';

export class VimeoVideoService implements IVideoService {
 
    playerWindow: any;
    videoPlayer: any;
    syncService: SyncService;

    constructor(playerWindow: any, videoPlayer: any) {
        this.playerWindow = playerWindow;
        this.videoPlayer = videoPlayer;
    }

    init() {
       
    }
    getPlaybackQuality(): string {
        throw new Error("Method not implemented.");
    }

    loadVideoById(urlObject: any): void {
        throw new Error("Method not implemented.");
    }
    mute(): void {
        throw new Error("Method not implemented.");
    }
    unMute(): void {
        throw new Error("Method not implemented.");
    }
    playVideo() {
        throw new Error("Method not implemented.");
    }
    pauseVideo(): void {
        throw new Error("Method not implemented.");
    }
    stopVideo(): void {
        throw new Error("Method not implemented.");
    }
    seekTo(seconds: number, allowSeekAhead: Boolean) {
        throw new Error("Method not implemented.");
    }
    setVolume() {
        throw new Error("Method not implemented.");
    }
    isMuted(): Boolean {
        throw new Error("Method not implemented.");
    }
    getVideoDuration(): number {
        throw new Error("Method not implemented.");
    }
    getCurrentTime(): number {
        throw new Error("Method not implemented.");
    }
    getPlayerState(): number {
        throw new Error("Method not implemented.");
    }
    getReceivedPlayerState(): number {
        throw new Error("Method not implemented.");
    }
    getAvailableQualityLevels(): string[] {
        throw new Error("Method not implemented.");
    }
    setPlaybackQuality(suggestedQuality: string) {
        throw new Error("Method not implemented.");
    }
    getAvailablePlaybackRates(): number[] {
        throw new Error("Method not implemented.");
    }
    setPlaybackRate(rate: number) {
        throw new Error("Method not implemented.");
    }
    getPlaybackRate(): number {
        throw new Error("Method not implemented.");
    }
    clearVideo() {
        throw new Error("Method not implemented.");
    }

}