import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {AppComponent} from './app.component'
import { SyncTubeComponent } from './sync-tube/sync-tube.component';

interface Route {
  path?: string;
  component?: Object |string;
  
}

const routes: Routes = [
  { path: '', component: SyncTubeComponent },
  { path: 'rooms/:id', component: SyncTubeComponent },
  { path: 'rooms', component: SyncTubeComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
