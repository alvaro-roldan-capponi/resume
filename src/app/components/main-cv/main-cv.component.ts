import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HtmlToPdfComponent } from '../html-to-pdf/html-to-pdf.component';
import * as expData from '../../../assets/data/experience.json';
import * as eduData from '../../../assets/data/education.json';
import * as extraData from '../../../assets/data/extras.json';

@Component({
    selector: 'app-main-cv',
    templateUrl: './main-cv.component.html',
    styleUrls: ['./main-cv.component.scss'],
    standalone: true,
    imports: [CommonModule, HtmlToPdfComponent]
})
export class MainCvComponent {
  personalImage: string = "assets/images/Alvaro_Roldan_Capponi.webp"
  experienceData: any = expData;
  educationData: any = eduData;
  extrasData: any = extraData;
}
