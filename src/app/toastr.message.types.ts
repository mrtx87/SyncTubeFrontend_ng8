export class ToastrMessageTypes {

    CREATE_ROOM: string = "create-room";
    JOIN_ROOM: string = "join-room";
    DISCONNECT: string = "disconnect-client";
    ASSIGNED_AS_ADMIN: string = "assigned-as-admin";
    TO_PUBLIC_ROOM: string = "to-public-room";
    TO_PRIVATE_ROOM: string = "to-private-room";
    KICKED_USER: string = "kicked-user";
    UPDATE_KICK_CLIENT: string = "update-kick-client";
    REFRESH_ROOM_ID: string = "refresh-raumid";
    ADDED_VIDEO_TO_PLAYLIST: string = "added-video-to-playlist";
    UPDATE_TITLE_AND_DESCRIPTION: string = "update-title-and-description";
    REMOVE_VIDEO_PLAYLIST: string = "remove-video-playlist";
    IMPORTED_PLAYLIST: string = "imported-playlist";
    INTEGRATED_PLAYLIST: string = "integrated-playlist";
    CHANGED_PLAYBACK_RATE: string = "change-playback-rate";
    MUTE_USER: string = "mute-user";
    CHANGED_USER_NAME: string = "changed-user-name";
    PARDONED_KICKED_USER: string = "pardon-kicked-user";
    ONLY_LOGGING: string = 'only-logging';




    public static properties = [
        'CREATE_ROOM',
        'JOIN_ROOM',
        'DISCONNECT',
        'ASSIGNED_AS_ADMIN',
        'TO_PUBLIC_ROOM',
        'TO_PRIVATE_ROOM',
        'KICKED_USER',
        'UPDATE_KICK_CLIENT',
        'REFRESH_ROOM_ID',
        'ADDED_VIDEO_TO_PLAYLIST',
        'UPDATE_TITLE_AND_DESCRIPTION',
        'REMOVE_VIDEO_PLAYLIST',
        'IMPORTED_PLAYLIST',
        'INTEGRATED_PLAYLIST',
        'CHANGED_PLAYBACK_RATE',
        'MUTE_USER',
        'CHANGED_USER_NAME',
        'PARDONED_KICKED_USER',
        'ONLY_LOGGING'];

} 