import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as personalData from '../../../assets/data/personal_data.json';

@Component({
    selector: 'app-html-to-pdf',
    templateUrl: './html-to-pdf.component.html',
    styleUrls: ['./html-to-pdf.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class HtmlToPdfComponent {
  personal_data = personalData;

  public async exportPDF() {
    return this.exportPDFWithPrint();
  }

  public async exportPDFWithPrint() {
    try {
      // Compress image before printing
      await this.optimizeImagesForPrint();

      const printStyles = `
        @media print {
          body * {
            visibility: hidden;
          }

          /* Show the main CV content */
          app-main-cv,
          app-main-cv *,
          .container-fluid,
          .container-fluid * {
            visibility: visible !important;
          }

          /* Hide the PDF button during print */
          app-html-to-pdf,
          .html-to-pdf-component {
            display: none !important;
          }

          /* Reset positioning and styling for print */
          app-main-cv {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .container-fluid {
            margin-top: 0 !important;
            padding: 15px !important;
            max-width: 100% !important;
          }

          .container {
            max-width: 100% !important;
            padding: 8px !important;
            margin: 0 !important;
          }

          /* Ensure proper page breaks */
          .container:not(:first-child) {
            page-break-before: auto;
          }

          /* Optimize images for print - much smaller size */
          img {
            max-width: 80px !important;
            max-height: 80px !important;
            width: 80px !important;
            height: 80px !important;
            object-fit: cover !important;
            border-radius: 50% !important;
          }

          /* Fix column layouts for better text display */
          .col-md-3 {
            flex: 0 0 30% !important;
            width: 30% !important;
            max-width: 30% !important;
            min-width: 180px !important;
          }

          .col-md-9 {
            flex: 0 0 70% !important;
            width: 70% !important;
            max-width: 70% !important;
          }

          /* Improve text layout in company info */
          .col-md-3 h4 {
            margin-bottom: 0.3rem !important;
            font-size: 1.1rem !important;
            line-height: 1.2 !important;
          }

          .col-md-3 a {
            display: block !important;
            margin-bottom: 0.3rem !important;
            font-size: 0.9rem !important;
            word-break: normal !important;
            overflow-wrap: break-word !important;
          }

          /* Optimize typography for print */
          .display-6 {
            font-size: 1.3rem !important;
            margin: 0.8rem 0 !important;
          }

          /* Reduce padding and margins */
          .p-4 {
            padding: 0.5rem !important;
          }

          .py-4 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }

          .lead {
            font-size: 1rem !important;
            line-height: 1.4 !important;
          }

          /* Page settings - optimize for smaller file size */
          @page {
            size: A4;
            margin: 1.2cm;
          }
        }
      `;

      const styleElement = document.createElement('style');
      styleElement.textContent = printStyles;
      document.head.appendChild(styleElement);

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.head.removeChild(styleElement);
          this.restoreOriginalImages();
        }, 1000);
      }, 100);

      console.log('Browser print dialog opened');

    } catch (error) {
      console.error('Print failed:', error);
      alert('Print failed. Please try again.');
    }
  }

  private async optimizeImagesForPrint(): Promise<void> {
    const images = document.querySelectorAll('img');

    Array.from(images).forEach(async (img) => {
      if (img.src.includes('Alvaro_Roldan_Capponi')) {
        // Store original src
        img.setAttribute('data-original-src', img.src);

        try {
          // Create a compressed version
          const compressedDataUrl = await this.compressImage(img, 100, 100, 0.6);
          img.src = compressedDataUrl;
        } catch (error) {
          console.warn('Failed to compress image:', error);
        }
      }
    });
  }

  private async compressImage(img: HTMLImageElement, maxWidth: number, maxHeight: number, quality: number): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    });
  }

  private restoreOriginalImages(): void {
    const images = document.querySelectorAll('img[data-original-src]');

    Array.from(images).forEach((img) => {
      const originalSrc = img.getAttribute('data-original-src');
      if (originalSrc) {
        (img as HTMLImageElement).src = originalSrc;
        img.removeAttribute('data-original-src');
      }
    });
  }
}
