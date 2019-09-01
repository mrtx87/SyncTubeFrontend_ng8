export class Constants {

    //PLAYERSTATES
    static NOTSTARTED: number = -1;
    static FINISHED: number = 0;
    static PLAYING: number = 1;
    static PAUSED: number = 2;
    static BUFFERING: number = 3;
    static PLACED: number = 5; //video platziert
    // jump rates for video.components
    static FIVE_SEC_FORTH: number = 5;
    static FIVE_SEC_BACK: number = -5;
    static TEN_SEC_FORTH: number = 10;
    static TEN_SEC_BACK: number = -10;

    //MAX RESULTS BY SEARCH REQUEST
    static MAX_RESULTS: number = 25;

    //COOKIE KEY
    static COOKIE_KEY: string = "U_COOKIE";

    //URLS

    //DATA VALUES
    static displayControlsLength = 2000000; //in milliseconds

    //static BASEURL: string = "http://localhost:8080"; 
    static BASEURL: string = "https://tubesync1.herokuapp.com";


}