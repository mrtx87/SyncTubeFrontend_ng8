import { ImportedPlaylist } from './video/playlist';
import { User } from './sync-tube/user';
import { SearchQuery } from './sync-tube/search-query';
import { Video } from './video/video';

export interface IDataService {

    search(searchQuery: SearchQuery) : boolean;

    searchQuery(query: string, normalQuery: boolean, timestamp?: number);

    searchPlaylist(query: string, mode: boolean, nextPageToken?: string, title?: string);
   
    processInput(input: string): SearchQuery;

    mapVideo(item: any): Video;


}