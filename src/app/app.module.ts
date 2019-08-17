import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule} from '@angular/forms'
import { AppComponent } from './app.component';
import { SafePipe } from './safe.pipe';
import { TimePipe } from './time.pipe';
import { VideoComponent } from './video/video.component';
import { AppRoutingModule } from './/app-routing.module';
import { SyncTubeComponent } from './sync-tube/sync-tube.component';
import { HttpClientModule } from '@angular/common/http';
import { NoFloatPipe } from './noFloat.pipe';
import { ChatMessagePipe } from './chatmessage.pipe';
import { CookieService } from 'ngx-cookie-service';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FooterComponent } from './footer/footer.component';




@NgModule({
  declarations: [
    AppComponent,
    SafePipe,
    TimePipe,
    ChatMessagePipe,
    VideoComponent,
    SyncTubeComponent,
    NoFloatPipe,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot()
  
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
