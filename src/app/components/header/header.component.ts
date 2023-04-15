import { Component } from '@angular/core';
import * as personalData from '../../../assets/data/personal_data.json';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  personal_data = personalData;
}
