import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Language } from './language';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class LanguagesService {

  syncService: SyncService;

  /***
   * 
   *  Um eine neue Sprache zu registrieren legst du eine Sprachdatei an (landname.json) -> beispiel: assets/languages/german.json. 
   *  Am besten kopierst du die blank_.json Sprachdatei als Grundlage und tauschst nur die texte aus und passt den Dateinamen an. 
   *  Der Name der Datei ist der key der hier als key hinzugefügt werden muss. Es muss noch ein passendes icon in assets/languages/icons/lang.svg hinterlegt werden.
   *  Damit legst du eine neue Sprache an unter LANGUAGE_LIST. Bsp. new Language('german', 'assets/languages/icons/germany.svg')
   *  Das ist alles was du tun musst um eine neue Sprache hinzuzufügen. 
   * 
   * 
   *  !!! ACHTUNG WER NEUE VARIABLEN ERGÄNZT MUSS DIESE IN DER blank_.json und ALLEN SPRACHDATEIEN HINZUFÜGEN 
   */


  private LANGUAGE_LIST: Language[] = [new Language('german', 'assets/languages/icons/germany.svg'),
   new Language('english', 'assets/languages/icons/united-kingdom.svg'),
   new Language('turkey', 'assets/languages/icons/turkey.svg'),
   new Language('russia', 'assets/languages/icons/russia.svg'),
   new Language('france', 'assets/languages/icons/france.svg'),
   new Language('usa', 'assets/languages/icons/united-states-of-america.svg'),
   new Language('hebrew', 'assets/languages/icons/israel.svg')


  ];


  private LANGUAGES: Map<string, any> = new Map<string, any>();

  private selectedLanguageKey_: string = 'german';

  public get languageList(): any {
    return this.LANGUAGE_LIST;
  }

  private get selectedLanguage(): any {
    return this.LANGUAGES.get(this.selectedLanguageKey);
  }

  public set selectedLanguageKey(key: string) {
    this.selectedLanguageKey_ = key;
  }

  public get selectedLanguageKey(): string {
    return this.selectedLanguageKey_;
  }

  constructor(syncService: SyncService, private httpService: HttpClient) {
    this.parseAllLanguageJsons();
    this.syncService = syncService;
    console.log("parsed all languages")
  }

  private parseAllLanguageJsons() {
    this.languageList
      .forEach(lang => this.parseLanguageJson(lang.key));
  }

  private parseLanguageJson(key: string) {
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
    let resolved: string = this.selectedLanguage ? this.selectedLanguage[key] : null;
    return resolved ? resolved : key;
  }



}
