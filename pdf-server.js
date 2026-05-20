#!/usr/bin/env node

/**
 * PDF Generation Server using Puppeteer
 *
 * Usage: node pdf-server.js
 *
 * This server provides a REST API endpoint for generating PDFs using Puppeteer.
 * It offers much better quality than html2canvas for complex layouts.
 */

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PDF Generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { url, filename = 'document.pdf', options = {} } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Generating PDF for: ${url}`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for fonts and images to load
    await page.evaluateHandle('document.fonts.ready');
    await page.waitForTimeout(2000);

    // Hide PDF download button and other non-printable elements
    await page.addStyleTag({
      content: `
        .html-to-pdf-component,
        app-header,
        .no-print {
          display: none !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
          color: #000;
          background: white;
        }
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `
    });

    // Generate PDF
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      ...options
    };

    const pdfBuffer = await page.pdf(pdfOptions);

    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

    console.log(`PDF generated successfully: ${filename}`);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'PDF Generation Server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Generation Server running on http://localhost:${PORT}`);
  console.log(`📄 API endpoint: POST /api/generate-pdf`);
  console.log(`💚 Health check: GET /health`);
});

module.exports = app;
