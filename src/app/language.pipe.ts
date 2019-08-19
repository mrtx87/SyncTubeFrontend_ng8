import { Pipe, PipeTransform } from '@angular/core';
import { LanguagesService } from './languages.service';

@Pipe({
  name: 'tl8',
  pure: false

})
export class LanguagePipe implements PipeTransform {

  constructor(private languageService: LanguagesService) { }

  transform(value: any, args?: any): any {
    if (this.languageService) {
      return this.languageService.interpolate(value);
      //TODO
    }
    return value;
  }

}
