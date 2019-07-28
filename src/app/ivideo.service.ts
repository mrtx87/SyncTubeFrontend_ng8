export interface IVideoService{


    init();
    loadVideoById(urlObject: any): void;

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
    getReceivedPlayerState(): number;
    getAvailableQualityLevels(): string[];
    setPlaybackQuality(suggestedQuality: string);
    getAvailablePlaybackRates(): Array<number>;
    setPlaybackRate(rate: number);
    getPlaybackRate(): number;

    clearVideo();
}