import { Component } from '@angular/core';
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import * as personalData from '../../../assets/data/personal_data.json';


@Component({
  selector: 'app-html-to-pdf',
  templateUrl: './html-to-pdf.component.html',
  styleUrls: ['./html-to-pdf.component.scss']
})
export class HtmlToPdfComponent {
  personal_data = personalData;

  public async  exportPDF() {

    html2canvas(document.body).then(canvas => {
      const pdfName = `${this.personal_data.name.split(" ").join("-").toLowerCase()}-cv.pdf`;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let pageHeightLeft = imgHeight;

      while (pageHeightLeft > 0) {
          pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          pageHeightLeft -= pdf.internal.pageSize.getHeight();
          position -= pdf.internal.pageSize.getHeight();
          if (pageHeightLeft > 0) {
              pdf.addPage();
          }
      }

      pdf.save(pdfName);
    });
  }
}
