import { ImportedPlaylist } from './video/playlist';
import { User } from './sync-tube/user';
import { SearchQuery } from './sync-tube/search-query';
import { Video } from './video/video';
import { HttpClient } from '@angular/common/http';
import { SyncTubeComponent } from './sync-tube/sync-tube.component';

export interface IDataService {

    id: number;
    name: string;
    http: HttpClient;
    synctubeComponent: SyncTubeComponent;
    APIKEY: string;
    nextPageToken: string;

    search(searchQuery: SearchQuery) : boolean;

    searchQuery(query: string, normalQuery: boolean, timestamp?: number, nextPageToken?: string);

    searchPlaylist(query: string, mode: boolean, nextPageToken?: string, title?: string);
   
    processInput(input: string): SearchQuery;

    mapVideo(item: any): Video;


}