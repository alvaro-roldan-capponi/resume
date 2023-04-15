import { Component, OnInit } from '@angular/core';
import * as expData from '../../../assets/data/experience.json';
import * as eduData from '../../../assets/data/education.json';
import * as extraData from '../../../assets/data/extras.json';

@Component({
  selector: 'app-main-cv',
  templateUrl: './main-cv.component.html',
  styleUrls: ['./main-cv.component.scss']
})
export class MainCvComponent implements OnInit{

  personalImage: string = "../../../assets/images/Alvaro_Roldan_Capponi.webp"
  experienceData: any = expData;
  educationData: any = eduData;
  extrasData: any = extraData;

  ngOnInit(): void {
    // console.log('Data', this.experienceData.experience);
  }

}
