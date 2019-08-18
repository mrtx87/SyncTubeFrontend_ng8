import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ProgressAnimationType } from 'ngx-toastr';

@Pipe({ name: 'hhMMss' })
export class ToastrConfig {

  timeOut: number = 0; //millis
  closeButton: boolean = false; //default false
  disableTimeOut: boolean = false;
  easing: string = 'ease-in';
  easeTime: number = 300;
  enableHtml: boolean = false;
  progressBar: boolean = false;
  progressAnimation: ProgressAnimationType = 'increasing';
  tapToDismiss: true;
  positionClass: string = 'toast-top-left';

  constructor(timeOut: number, closeButton?: boolean, disableTimeOut?: boolean, easing?: string, easeTime?: number, enableHtml?: boolean, progressBar?: boolean, progressAnimation?: ProgressAnimationType) {
    this.timeOut = timeOut;
    if(closeButton) {
      this.closeButton = closeButton;
    }
    if(disableTimeOut) {
      this.disableTimeOut = disableTimeOut;
    }
    if(easing) {
      this.easing = easing;
    }
    if(easeTime) {
      this.easeTime = easeTime;
    }
    if(enableHtml) {
      this.enableHtml = enableHtml;
    }
    if(progressBar) {
      this.progressBar = progressBar;
    }
    if(progressAnimation) {
      this.progressAnimation = progressAnimation;
    }
  }

} 