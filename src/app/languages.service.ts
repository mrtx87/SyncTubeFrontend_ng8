import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Language } from './language';

@Injectable({
  providedIn: 'root'
})
export class LanguagesService {

  /***
   * 
   *  Um eine neue Sprache zu registrieren legst du eine Sprachdatei an (landname.json) -> beispiel: assets/languages/german.json. 
   *  Am besten kopierst du eine vorhandene Sprachdatei als Grundlage und tauschst nur die texte aus und passt den Dateinamen an. 
   *  Der Name der Datei ist der key der hier als key hinzugefügt werden muss. Es muss noch ein passendes icon in assets/languages/icons/lang.svg hinterlegt werden.
   *  Damit legst du eine neue Sprache an unter LANGUAGE_LIST. Bsp. new Language('german', 'assets/languages/icons/germany.svg')
   *  Das ist alles was du tun musst um eine neue Sprache hinzuzufügen. 
   * 
   */

  private LANGUAGE_LIST: Language[] = [new Language('german', 'assets/languages/icons/germany.svg'), new Language('english', 'assets/languages/icons/united-kingdom.svg')];

  private LANGUAGES: Map<string, any> = new Map<string, any>();

  private selectedLanguageKey_: string = 'german';

  public get languageList(): any {
    return this.LANGUAGE_LIST;
  }

  public get selectedLanguage(): any {
    return this.LANGUAGES.get(this.selectedLanguageKey);
  }

  public set selectedLanguageKey(key: string) {
    this.selectedLanguageKey_ = key;
  }

  public get selectedLanguageKey(): string {
    return this.selectedLanguageKey_;
  }

  constructor(private httpService: HttpClient) {
    this.parseAllLanguageJsons();
  }

  parseAllLanguageJsons() {
    this.languageList
      .forEach(lang => this.parseLanguageJson(lang.key));
  }

  parseLanguageJson(key: string) {
    this.httpService.get('assets/languages/' + key + '.json').subscribe(
      data => {
        let language = data;
        this.LANGUAGES.set(key, language)
        console.log('successfully registered: ' + key)
      },
      (err: HttpErrorResponse) => {
        console.log(err.message);
      }
    );
  }

  interpolate(key: string): string {
    let resolved: string = this.selectedLanguage[key]
    return resolved ? resolved : key;
  }
}
