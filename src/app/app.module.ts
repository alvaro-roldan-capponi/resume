import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainCvComponent } from './components/main-cv/main-cv.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HtmlToPdfComponent } from './components/html-to-pdf/html-to-pdf.component';

@NgModule({
  declarations: [
    AppComponent,
    MainCvComponent,
    HeaderComponent,
    FooterComponent,
    HtmlToPdfComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
