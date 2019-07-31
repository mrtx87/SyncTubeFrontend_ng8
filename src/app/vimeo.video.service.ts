import { IVideoService } from './ivideo.service';
import { SyncService } from './sync.service';
import { SupportedApi } from './supported-api';

export class VimeoVideoService implements IVideoService {
    name: string;
    iframe: any;
    videoPlayer: any;
    syncService: SyncService;
    supportedApi: SupportedApi;

    constructor(supportedApi: SupportedApi, synService: SyncService, videoPlayer: any,  playerWindow: any) {
        this.iframe = playerWindow;
        this.videoPlayer = videoPlayer;
        this.syncService = synService;
        this.supportedApi= supportedApi;
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