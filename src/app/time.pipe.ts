import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'hhMMss' })
export class TimePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }
  transform(val: number) {
    if (val) {
      let time = val;

      let hrs = ~~(time / 3600);
      let mins = ~~((time % 3600) / 60);
      let seconds = ~~time % 60;

      let ret = "";

      if (hrs > 0) {
        ret += (hrs < 10 ? "0" : "") + hrs + ":" + (mins < 10 ? "0" : "");
      }

      ret += "" + mins + ":" + (seconds < 10 ? "0" : "");
      ret += "" + seconds;
      return ret;
    }
    return ""
  }
} 