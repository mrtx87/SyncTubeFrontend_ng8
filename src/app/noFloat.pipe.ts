import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'noFloat' })
export class NoFloatPipe implements PipeTransform {
  constructor() { }
  transform(val: number) {
    
    return Math.round(val) | 0;
  }
} 