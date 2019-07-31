import { SyncService } from './sync.service';
import { SupportedApi } from './supported-api';

export interface IVideoService{

    name:string;
    iframe: any;
    videoPlayer: any;
    syncService: SyncService;
    supportedApi: SupportedApi;

    init();
    loadVideoById(urlObject: any): void;
    hide(): void;
    unHide(): void;
    isHidden(): boolean;


    mute(): void ;
    unMute(): void;
    playVideo();
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: Boolean);
    setVolume();
    isMuted(): Boolean;

    getVideoDuration(): number;
    getCurrentTime(): number;
    getPlayerState(): number
    getAvailableQualityLevels(): string[];
    setPlaybackQuality(suggestedQuality: string);
    getPlaybackQuality(): string;
    getAvailablePlaybackRates(): Array<number>;
    setPlaybackRate(rate: number);
    getPlaybackRate(): number;

    clearVideo();
}