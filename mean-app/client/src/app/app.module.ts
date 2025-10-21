import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CoreModule } from '@core/core.module';
import { SharedModule } from '@shared/shared.module';
import { FeaturesModule } from '@features/features.module';
import { LayoutsModule } from '@layouts/layouts.module';

import { AuthInterceptor } from '@core/interceptors/auth.interceptor';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule,
    CoreModule,
    SharedModule,
    FeaturesModule,
    LayoutsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  //bootstrap: [AppComponent],
})
export class AppModule {}
