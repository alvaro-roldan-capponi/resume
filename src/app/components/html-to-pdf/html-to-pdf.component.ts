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
      const pdfName = `${this.personal_data.name.split(" ").join("-").toLowerCase()}-cv.pdf`

      const doc = new jsPDF('p', 'mm');
      const contentDataURL = canvas.toDataURL('image/png');

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgHeight = canvas.height * pageWidth / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      doc.addImage(contentDataURL, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(contentDataURL, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      doc.save(`${pdfName}`);
    });
  }
}
