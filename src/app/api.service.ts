import { IDataService } from './idata-service';
import { IVideoService } from './ivideo.service';

export class ApiService {

    private _id: Number;
    private _name: String;
    private _dataService: IDataService;
    private _videoService: IVideoService;

    public get id(): Number {
        return this._id;
    }
    public set id(value: Number) {
        this._id = value;
    }

    public get name(): String {
        return this._name;
    }
    public set name(value: String) {
        this._name = value;
    }

    public get dataService(): IDataService {
        return this._dataService;
    }
    public set dataService(value: IDataService) {
        this._dataService = value;
    }

    public get videoService(): IVideoService {
        return this._videoService;
    }
    public set videoService(value: IVideoService) {
        this._videoService = value;
    }

    

}