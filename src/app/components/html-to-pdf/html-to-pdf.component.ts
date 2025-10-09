import { Component } from '@angular/core';
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import * as personalData from '../../../assets/data/personal_data.json';


@Component({
    selector: 'app-html-to-pdf',
    templateUrl: './html-to-pdf.component.html',
    styleUrls: ['./html-to-pdf.component.scss'],
    standalone: false
})
export class HtmlToPdfComponent {
  personal_data = personalData;

  public async exportPDF() {
    try {
      const pdfName = `${this.personal_data.name.split(" ").join("-").toLowerCase()}-cv.pdf`;

      // Prepare DOM for PDF generation
      const { header, footer, originalHeaderDisplay, originalFooterClasses, originalFooterPosition, originalFooterBottom } = await this.prepareDOMForPDF();

      try {
        // Generate the PDF
        await this.generatePDFFromDOM(pdfName);
      } finally {
        // Always restore original styles
        this.restoreOriginalStyles(header, footer, originalHeaderDisplay, originalFooterClasses, originalFooterPosition, originalFooterBottom);
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  }

  private async prepareDOMForPDF() {
    const header = document.querySelector('app-header') as HTMLElement;
    const footer = document.querySelector('app-footer') as HTMLElement;
    const originalHeaderDisplay = header?.style.display;
    const originalFooterClasses = footer?.className;
    const originalFooterPosition = footer?.style.position;
    const originalFooterBottom = footer?.style.bottom;

    // Hide header and make footer static for PDF (include it in the main content)
    if (header) header.style.display = 'none';
    if (footer) {
      footer.className = footer.className.replace('fixed-bottom', '');
      footer.style.position = 'static';
      footer.style.bottom = 'auto';
      footer.style.marginTop = '2rem';
    }

    // Wait longer for DOM changes to take effect and ensure all content is loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    // Force a layout recalculation
    const layoutHeight = document.body.offsetHeight;
    console.log('Forced layout recalculation, body height:', layoutHeight);

    return { header, footer, originalHeaderDisplay, originalFooterClasses, originalFooterPosition, originalFooterBottom };
  }

  private async generatePDFFromDOM(pdfName: string) {
    // Target the main CV content area for better control
    let element = document.querySelector('app-main-cv .container-fluid') as HTMLElement;

    if (!element) {
      // Fallback to the app-main-cv element itself
      element = document.querySelector('app-main-cv') as HTMLElement;
    }

    if (!element) {
      throw new Error('Could not find any suitable element for PDF generation');
    }

    console.log('Found element for PDF generation:', element.tagName, element.className);
    const canvas = await this.createCanvasFromElement(element);
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Failed to generate canvas or canvas is empty');
    }

    // Use standard A4 PDF format
    const pdf = new jsPDF('p', 'mm', 'a4');
    await this.addContentToPDF(pdf, canvas);
    await this.addFooterToPDF(pdf);
    pdf.save(pdfName);
  }

  private async createCanvasFromElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    console.log('Creating canvas from element:', element);
    console.log('Element dimensions:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    });

    // Ensure element is visible and has content
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      throw new Error('Element has no visible dimensions');
    }

    const options = {
      scale: 1.2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      ignoreElements: (element: Element) => {
        // Ignore the PDF button itself and any fixed elements
        return element.classList.contains('html-to-pdf-component') ||
               element.classList.contains('html-to-pdf') ||
               element.tagName === 'APP-HTML-TO-PDF' ||
               getComputedStyle(element).position === 'fixed';
      },
      onclone: (clonedDoc: Document) => {
        console.log('Cloning document for canvas generation');
        // Remove any fixed positioned elements from the clone
        const fixedElements = clonedDoc.querySelectorAll('[style*="position: fixed"], .fixed-top, .fixed-bottom, app-header, app-html-to-pdf');
        fixedElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'none';
        });

        // Ensure all styles are applied
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            htmlEl.style.breakInside = 'auto';
          }
        });
      }
    };

    try {
      const canvas = await html2canvas(element, options);
      console.log('Canvas created successfully:', {
        width: canvas.width,
        height: canvas.height
      });
      return canvas;
    } catch (error) {
      console.error('html2canvas failed with options:', options, error);

      // Try with simpler options as fallback
      console.log('Attempting fallback canvas generation...');
      const fallbackOptions = {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        ignoreElements: (element: Element) => {
          return element.classList.contains('html-to-pdf-component') ||
                 element.classList.contains('html-to-pdf') ||
                 element.tagName === 'APP-HTML-TO-PDF';
        }
      };

      const fallbackCanvas = await html2canvas(element, fallbackOptions);
      console.log('Fallback canvas created:', {
        width: fallbackCanvas.width,
        height: fallbackCanvas.height
      });
      return fallbackCanvas;
    }
  }

  private async addContentToPDF(pdf: jsPDF, canvas: HTMLCanvasElement) {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pdfWidth - (2 * margin);
    const availableHeight = pdfHeight - (2 * margin);

    // Calculate image dimensions
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    console.log('Adding content to PDF:', {
      pdfWidth,
      pdfHeight,
      imgWidth,
      imgHeight,
      availableHeight,
      fitsOnOnePage: imgHeight <= availableHeight
    });

    if (imgHeight <= availableHeight) {
      // Single page - content fits
      this.addImageToPDF(pdf, canvas, margin, margin, imgWidth, imgHeight);
    } else {
      // Multiple pages with intelligent breaking
      await this.addMultiPageContentWithSmartBreaks(pdf, canvas, imgWidth, availableHeight, margin);
    }
  }

  private async addMultiPageContentWithSmartBreaks(pdf: jsPDF, canvas: HTMLCanvasElement, imgWidth: number, availableHeight: number, margin: number) {
    const scale = canvas.width / imgWidth;
    const pageHeight = availableHeight;
    const totalImageHeight = (canvas.height * imgWidth) / canvas.width;
    const totalPages = Math.ceil(totalImageHeight / pageHeight);

    // Calculate smart break points to avoid cutting text
    const breakPoints = this.calculateSmartBreakPoints(canvas, pageHeight, scale, totalPages);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      const { sourceY, sourceHeight } = this.getPageBounds(page, breakPoints, pageHeight, scale, canvas.height);

      if (this.isValidCoordinates(sourceY, sourceHeight, canvas.height)) {
        this.addPageToPDF(pdf, canvas, {
          sourceY,
          sourceHeight,
          imgWidth,
          margin,
          page,
          totalPages,
          scale
        });
      }
    }
  }

  private getPageBounds(page: number, breakPoints: number[], pageHeight: number, scale: number, canvasHeight: number) {
    let sourceY: number;
    let sourceHeight: number;

    if (page < breakPoints.length) {
      // Use smart break points
      sourceY = page === 0 ? 0 : breakPoints[page - 1];
      sourceHeight = (page === breakPoints.length - 1)
        ? canvasHeight - sourceY
        : breakPoints[page] - sourceY;
    } else {
      // Fallback to regular division
      sourceY = page * pageHeight * scale;
      sourceHeight = Math.min(pageHeight * scale, canvasHeight - sourceY);
    }

    return { sourceY, sourceHeight };
  }

  private addPageToPDF(pdf: jsPDF, canvas: HTMLCanvasElement, params: {
    sourceY: number;
    sourceHeight: number;
    imgWidth: number;
    margin: number;
    page: number;
    totalPages: number;
    scale: number;
  }) {
    const pageCanvas = this.createPageCanvas(canvas, params.sourceY, params.sourceHeight);
    const displayHeight = params.sourceHeight / params.scale;

    if (displayHeight > 0 && params.imgWidth > 0) {
      console.log(`Adding page ${params.page + 1}/${params.totalPages} with smart break at sourceY: ${params.sourceY}`);
      this.addImageToPDF(pdf, pageCanvas, params.margin, params.margin, params.imgWidth, displayHeight);
    }
  }

  private calculateSmartBreakPoints(canvas: HTMLCanvasElement, pageHeight: number, scale: number, totalPages: number): number[] {
    const breakPoints: number[] = [];
    const targetPageHeight = pageHeight * scale;

    for (let page = 1; page < totalPages; page++) {
      const idealBreak = page * targetPageHeight;
      const bestBreakPoint = this.findBestBreakPoint(canvas, idealBreak, targetPageHeight);
      breakPoints.push(bestBreakPoint);
    }

    console.log('Smart break points calculated:', breakPoints);
    return breakPoints;
  }

  private findBestBreakPoint(canvas: HTMLCanvasElement, idealBreak: number, targetPageHeight: number): number {
    const searchRange = targetPageHeight * 0.1; // Search 10% around ideal break
    const searchStart = Math.max(0, idealBreak - searchRange);
    const searchEnd = Math.min(canvas.height, idealBreak + searchRange);

    const ctx = canvas.getContext('2d');
    if (!ctx) return idealBreak;

    return this.findWhitespaceBreak(ctx, canvas, searchStart, searchEnd, idealBreak);
  }

  private findWhitespaceBreak(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, searchStart: number, searchEnd: number, idealBreak: number): number {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let bestBreakPoint = idealBreak;
    let maxWhitespace = 0;

    for (let y = searchStart; y < searchEnd; y += 5) {
      const whitespaceCount = this.countWhitespaceInRow(data, canvas.width, y);

      if (whitespaceCount > maxWhitespace) {
        maxWhitespace = whitespaceCount;
        bestBreakPoint = y;
      }
    }

    return bestBreakPoint;
  }

  private countWhitespaceInRow(data: Uint8ClampedArray, canvasWidth: number, y: number): number {
    let whitespaceCount = 0;

    for (let x = 0; x < canvasWidth; x += 10) {
      const pixelIndex = (Math.floor(y) * canvasWidth + x) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];

      // Consider pixel as whitespace if it's light colored
      if (r > 240 && g > 240 && b > 240) {
        whitespaceCount++;
      }
    }

    return whitespaceCount;
  }

  private isValidCoordinates(sourceY: number, sourceHeight: number, canvasHeight: number): boolean {
    return sourceY >= 0 && sourceHeight > 0 && sourceY < canvasHeight;
  }

  private createPageCanvas(sourceCanvas: HTMLCanvasElement, sourceY: number, sourceHeight: number): HTMLCanvasElement {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      throw new Error('Failed to get canvas context');
    }

    tempCanvas.width = sourceCanvas.width;
    tempCanvas.height = sourceHeight;

    tempCtx.drawImage(
      sourceCanvas,
      0, sourceY, sourceCanvas.width, sourceHeight,
      0, 0, sourceCanvas.width, sourceHeight
    );

    return tempCanvas;
  }

  private addImageToPDF(pdf: jsPDF, canvas: HTMLCanvasElement, x: number, y: number, width: number, height: number) {
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.7),
      'JPEG',
      x,
      y,
      width,
      height,
      undefined,
      'FAST'
    );
  }

  private async addFooterToPDF(pdf: jsPDF) {
    const footer = document.querySelector('app-footer') as HTMLElement;
    if (!footer) return;

    const footerCanvas = await html2canvas(footer, {
      scale: 1.2,
      backgroundColor: '#ffffff',
      removeContainer: true
    });

    if (footerCanvas && footerCanvas.width > 0 && footerCanvas.height > 0) {
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const availableWidth = pdfWidth - (2 * margin);
      const footerImgWidth = availableWidth;
      const footerImgHeight = (footerCanvas.height * footerImgWidth) / footerCanvas.width;

      if (footerImgHeight > 0 && footerImgWidth > 0) {
        // Add footer on a new page
        pdf.addPage();
        console.log('Adding footer on new page');
        this.addImageToPDF(pdf, footerCanvas, margin, margin, footerImgWidth, footerImgHeight);
      }
    }
  }

  private restoreOriginalStyles(
    header: HTMLElement | null,
    footer: HTMLElement | null,
    originalHeaderDisplay: string | undefined,
    originalFooterClasses: string | undefined,
    originalFooterPosition?: string,
    originalFooterBottom?: string
  ) {
    if (header) header.style.display = originalHeaderDisplay || '';
    if (footer && originalFooterClasses) {
      footer.className = originalFooterClasses;
      footer.style.position = originalFooterPosition || '';
      footer.style.bottom = originalFooterBottom || '';
      footer.style.marginTop = '';
    }
  }
}
