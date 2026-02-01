import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CertificateData {
    projectName: string;
    projectAddress: string;
    technicianName: string;
    date: string;
    checklistItems: { label: string; passed: boolean }[];
    branding?: {
        companyName: string;
        primaryColor: string;
        logoUrl?: string | null;
        financing?: {
            enabled: boolean;
            link?: string | null;
        };
    };
}

// Helper to convert Hex to PDF-Lib RGB
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ) : rgb(0, 0.32, 0.49); // Default ThermoNeural Blue
}

async function drawBrandedHeader(page: any, data: CertificateData, width: number, height: number, boldFont: any, font: any, title: string, subtitle: string) {
    const brandColor = data.branding?.primaryColor ? hexToRgb(data.branding.primaryColor) : rgb(0, 0.32, 0.49);

    // Header Bar
    page.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: brandColor,
    });

    // Logo (if available) - This requires embedding which is async, simplified for now to text fallback or we need to pass doc
    // For this iteration, we focus on Color and Company Name text. 
    // Image embedding requires fetching the blob. To keep this function simple we might skip logo image for this specific 'drawBrandedHeader' helper 
    // or we pass the doc to it.

    // Header Text
    page.drawText(title, {
        x: 50,
        y: height - 50,
        size: 24,
        font: boldFont,
        color: rgb(1, 1, 1),
    });

    page.drawText(subtitle, {
        x: 50,
        y: height - 75,
        size: 14,
        font: font,
        color: rgb(0.9, 0.9, 0.9),
    });
}

function drawBrandedFooter(page: any, headerHeight: number, branding: CertificateData['branding'], font: any, boldFont: any) {
    const footerText = branding?.companyName ? `${branding.companyName} Certified` : 'ThermoNeural Risk Shield™';
    const brandColor = branding?.primaryColor ? hexToRgb(branding.primaryColor) : rgb(0, 0.32, 0.49);

    page.drawText(footerText, {
        x: 50,
        y: 60,
        size: 10,
        font: boldFont,
        color: brandColor
    });

    // Draw Financing Link if enabled (Trident Phase 1)
    if (branding?.financing?.enabled && branding.financing.link) {
        page.drawText(`Apply for Financing: ${branding.financing.link}`, {
            x: 50,
            y: 45, // Below the branding text
            size: 9,
            font: font,
            color: rgb(0, 0.4, 0.8) // Link color
        });
    }
}


export async function generateWinterizationCert(data: CertificateData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header via Helper? No, let's keep it inline to handle async logo potentially later
    const brandColor = data.branding?.primaryColor ? hexToRgb(data.branding.primaryColor) : rgb(0, 0.32, 0.49);

    page.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: brandColor,
    });

    page.drawText('CERTIFICATE OF WINTERIZATION', {
        x: 50,
        y: height - 60,
        size: 24,
        font: boldFont,
        color: rgb(1, 1, 1),
    });

    page.drawText('Risk Mitigation & Compliance Report', {
        x: 50,
        y: height - 90,
        size: 12,
        font: font,
        color: rgb(0.9, 0.9, 0.9), // White/Grey text on colored background
    });

    // Project Details
    page.drawText('PROJECT DETAILS', {
        x: 50,
        y: height - 140,
        size: 14,
        font: boldFont,
    });

    page.drawText(`Project: ${data.projectName}`, { x: 50, y: height - 160, size: 12, font });
    page.drawText(`Address: ${data.projectAddress}`, { x: 50, y: height - 175, size: 12, font });
    page.drawText(`Technician: ${data.technicianName}`, { x: 50, y: height - 190, size: 12, font });
    page.drawText(`Date: ${data.date}`, { x: 50, y: height - 205, size: 12, font });

    // Checklist
    let y = height - 250;
    page.drawText('VERIFICATION CHECKLIST', { x: 50, y, size: 14, font: boldFont });
    y -= 30;

    data.checklistItems.forEach((item) => {
        const statusStart = 450;
        page.drawText(item.label, { x: 50, y, size: 12, font });
        page.drawText(item.passed ? "PASSED" : "FLAGGED", {
            x: statusStart,
            y,
            size: 12,
            font: boldFont,
            color: item.passed ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)
        });
        y -= 25;
    });

    // Footer / Disclaimer
    page.drawText('This certificate confirms that the listed inspections were performed in accordance with standard operating procedures.', {
        x: 50,
        y: 100,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6)
    });

    drawBrandedFooter(page, height, data.branding, font, boldFont);

    // Embed Logo if exists
    if (data.branding?.logoUrl) {
        try {
            // In browser environment, we fetch the blob
            const pngImageBytes = await fetch(data.branding.logoUrl).then((res) => res.arrayBuffer());

            let image;
            if (data.branding.logoUrl.toLowerCase().endsWith('.png')) {
                image = await pdfDoc.embedPng(pngImageBytes);
            } else {
                image = await pdfDoc.embedJpg(pngImageBytes);
            }

            // Scale down
            const logoDims = image.scale(0.5);
            // Verify it fits
            const maxHeight = 80;
            const scale = logoDims.height > maxHeight ? maxHeight / logoDims.height : 1;

            page.drawImage(image, {
                x: width - 50 - (logoDims.width * scale), // Right aligned
                y: height - 90, // Inside the header bar
                width: logoDims.width * scale,
                height: logoDims.height * scale,
            });
        } catch (e) {
            console.error("Failed to embed logo", e);
        }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

export async function generateCommissioningCert(data: CertificateData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header Color Bar
    const brandColor = data.branding?.primaryColor ? hexToRgb(data.branding.primaryColor) : rgb(0.1, 0.1, 0.1);

    page.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: brandColor,
    });

    // Header Text
    page.drawText('SYSTEM COMMISSIONING REPORT', {
        x: 50,
        y: height - 60,
        size: 24,
        font: boldFont,
        color: rgb(1, 1, 1),
    });

    page.drawText('Operational Verification & Start-Up Log', {
        x: 50,
        y: height - 85,
        size: 12,
        font: font,
        color: rgb(0.8, 0.8, 0.8),
    });

    // Project Details
    page.drawText('PROJECT DETAILS', {
        x: 50,
        y: height - 140,
        size: 14,
        font: boldFont,
    });

    page.drawText(`Project: ${data.projectName}`, { x: 50, y: height - 160, size: 12, font });
    page.drawText(`Address: ${data.projectAddress}`, { x: 50, y: height - 175, size: 12, font });
    page.drawText(`Technician: ${data.technicianName}`, { x: 50, y: height - 190, size: 12, font });
    page.drawText(`Date: ${data.date}`, { x: 50, y: height - 205, size: 12, font });

    // Grid for measurements (Visual simulation)
    page.drawRectangle({
        x: 45,
        y: height - 280,
        width: 500,
        height: 60,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
    });

    page.drawText('SYSTEM PERFORMANCE BASELINE', { x: 50, y: height - 240, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
    // Simplified Headers
    page.drawText('Superheat', { x: 60, y: height - 265, size: 10, font });
    page.drawText('Subcooling', { x: 160, y: height - 265, size: 10, font });
    page.drawText('Delta T', { x: 260, y: height - 265, size: 10, font });

    // Placeholder Values
    page.drawText('12.5°F', { x: 60, y: height - 280, size: 12, font: boldFont });
    page.drawText('10.2°F', { x: 160, y: height - 280, size: 12, font: boldFont });
    page.drawText('20.4°F', { x: 260, y: height - 280, size: 12, font: boldFont });

    // Checklist
    let y = height - 340;
    page.drawText('VERIFICATION CHECKLIST', { x: 50, y, size: 14, font: boldFont });
    y -= 30;

    data.checklistItems.forEach((item) => {
        const statusStart = 450;
        // Background strip for passed items
        if (item.passed) {
            page.drawRectangle({
                x: 45,
                y: y - 5,
                width: 500,
                height: 20,
                color: rgb(0.95, 1, 0.95),
            });
        }

        page.drawText(item.label, { x: 50, y, size: 12, font });
        page.drawText(item.passed ? "VERIFIED" : "FLAGGED", {
            x: statusStart,
            y,
            size: 12,
            font: boldFont,
            color: item.passed ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)
        });
        y -= 25;
    });

    // Signature Line
    page.drawLine({
        start: { x: 50, y: 150 },
        end: { x: 250, y: 150 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    page.drawText('Technician Signature', { x: 50, y: 135, size: 10, font });

    // Footer / Disclaimer
    page.drawText('This document certifies that the system has been commissioned according to manufacturer specifications and local code.', {
        x: 50,
        y: 80,
        size: 9,
        font,
        color: rgb(0.6, 0.6, 0.6)
    });

    drawBrandedFooter(page, height, data.branding, font, boldFont);

    // Embed Logo
    if (data.branding?.logoUrl) {
        try {
            const pngImageBytes = await fetch(data.branding.logoUrl).then((res) => res.arrayBuffer());
            let image;
            // Very basic check, normally would assume png for logos but let's try
            if (data.branding.logoUrl.toLowerCase().match(/\.(jpeg|jpg)$/)) {
                image = await pdfDoc.embedJpg(pngImageBytes);
            } else {
                image = await pdfDoc.embedPng(pngImageBytes);
            }
            const logoDims = image.scale(0.5);
            const maxHeight = 80;
            const scale = logoDims.height > maxHeight ? maxHeight / logoDims.height : 1;

            page.drawImage(image, {
                x: width - 50 - (logoDims.width * scale),
                y: height - 90,
                width: logoDims.width * scale,
                height: logoDims.height * scale,
            });
        } catch (e) {
            console.error("Failed to embed logo", e);
        }
    }

    return await pdfDoc.save();
}

export async function generateMaintenanceCert(data: CertificateData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header Color Bar
    const brandColor = data.branding?.primaryColor ? hexToRgb(data.branding.primaryColor) : rgb(0.13, 0.55, 0.13); // Forest Green default

    page.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: brandColor,
    });

    // Header Text
    page.drawText('PREVENTATIVE MAINTENANCE', {
        x: 50,
        y: height - 50,
        size: 24,
        font: boldFont,
        color: rgb(1, 1, 1),
    });

    page.drawText('Scheduled System Health Check', {
        x: 50,
        y: height - 75,
        size: 14,
        font: font,
        color: rgb(0.9, 0.9, 0.9),
    });

    // Project Details
    page.drawText('SITE DETAILS', {
        x: 50,
        y: height - 140,
        size: 14,
        font: boldFont,
    });

    page.drawText(`Location: ${data.projectName}`, { x: 50, y: height - 160, size: 12, font });
    page.drawText(`Address: ${data.projectAddress}`, { x: 50, y: height - 175, size: 12, font });
    page.drawText(`Technician: ${data.technicianName}`, { x: 50, y: height - 190, size: 12, font });
    page.drawText(`Date: ${data.date}`, { x: 50, y: height - 205, size: 12, font });

    // Checklist
    let y = height - 250;
    page.drawText('MAINTENANCE TASKS COMPLETED', { x: 50, y, size: 14, font: boldFont });
    y -= 30;

    data.checklistItems.forEach((item) => {
        const statusStart = 450;
        page.drawText(item.label, { x: 70, y, size: 12, font });

        // Checkbox
        page.drawRectangle({
            x: 50,
            y: y,
            width: 10,
            height: 10,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
        });

        if (item.passed) {
            page.drawLine({ start: { x: 50, y: y }, end: { x: 60, y: y + 10 }, thickness: 1, color: rgb(0, 0, 0) });
            page.drawLine({ start: { x: 50, y: y + 10 }, end: { x: 60, y: y }, thickness: 1, color: rgb(0, 0, 0) });
        }

        page.drawText(item.passed ? "COMPLETED" : "N/A", {
            x: statusStart,
            y,
            size: 10,
            font: boldFont,
            color: item.passed ? rgb(0, 0.4, 0) : rgb(0.5, 0.5, 0.5)
        });
        y -= 25;
    });

    // Recommendations
    y -= 20;
    page.drawText('RECOMMENDATIONS', { x: 50, y, size: 14, font: boldFont });
    y -= 20;
    page.drawText('System is operating within normal parameters. Next service recommended in 6 months.', {
        x: 50, y, size: 11, font, color: rgb(0.3, 0.3, 0.3)
    });

    drawBrandedFooter(page, height, data.branding, font, boldFont);

    // Embed Logo
    if (data.branding?.logoUrl) {
        try {
            const pngImageBytes = await fetch(data.branding.logoUrl).then((res) => res.arrayBuffer());
            let image;
            if (data.branding.logoUrl.toLowerCase().match(/\.(jpeg|jpg)$/)) {
                image = await pdfDoc.embedJpg(pngImageBytes);
            } else {
                image = await pdfDoc.embedPng(pngImageBytes);
            }
            const logoDims = image.scale(0.5);
            const maxHeight = 80;
            const scale = logoDims.height > maxHeight ? maxHeight / logoDims.height : 1;

            page.drawImage(image, {
                x: width - 50 - (logoDims.width * scale),
                y: height - 90,
                width: logoDims.width * scale,
                height: logoDims.height * scale,
            });
        } catch (e) {
            console.error("Failed to embed logo", e);
        }
    }

    return await pdfDoc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
