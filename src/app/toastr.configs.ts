import { ToastrConfig } from './toastr.config';

export class ToastrConfigs {
    public static SUCCESS: ToastrConfig = new ToastrConfig(2000, null, null, null, null, false, false);
    public static WARNING: ToastrConfig = new ToastrConfig(3000, null, null, null, null, false, false);
    public static INFO: ToastrConfig = new ToastrConfig(2000, null, null, null, null, false, false);
    public static ERROR: ToastrConfig = new ToastrConfig(0, true, true, null, null, false, false);
}