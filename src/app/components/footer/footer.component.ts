import { Component } from '@angular/core';
import * as personalData from '../../../assets/data/personal_data.json';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent {
  personal_data = personalData;
}
