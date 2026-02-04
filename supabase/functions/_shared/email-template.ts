export const generateEmailHtml = (data: {
  companyName: string;
  headline: string;
  firstParagraph: string;
  secondParagraph?: string;
  infoBox?: { label: string; value: string };
  cta?: { text: string; url: string };
  footerText?: string;
}) => {
  const {
    companyName,
    headline,
    firstParagraph,
    secondParagraph,
    infoBox,
    cta,
    footerText,
  } = data;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 40px; text-align: center; }
        .logo-text { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }
        .content { padding: 40px; }
        h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
        p { font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #475569; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { background-color: #ea580c !important; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; mso-padding-alt: 0; text-underline-color: #ea580c; }
        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            .btn { background-color: #ea580c !important; color: #ffffff !important; }
        }
        .info-box { background-color: #f1f5f9; border-left: 4px solid #ea580c; padding: 20px; border-radius: 6px; margin-bottom: 24px; }
        .info-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; }
        .info-value { font-size: 18px; color: #0f172a; font-weight: 600; margin: 0; }
        .footer { background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }
        .secure-badge { display: inline-flex; align-items: center; justify-content: center; margin-top: 16px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <table role="presentation">
            <tr>
                <td>
                    <br><br>
                    <div class="main">
                        <div class="header">
                            <div class="logo-text">${companyName}</div>
                        </div>
                        <div class="content">
                            <h1>${headline}</h1>
                            <p>${firstParagraph}</p>
                            ${secondParagraph ? `<p>${secondParagraph}</p>` : ""}
                            
                            ${
                              infoBox
                                ? `
                            <div class="info-box">
                                <span class="info-label">${infoBox.label}</span>
                                <p class="info-value">${infoBox.value}</p>
                            </div>`
                                : ""
                            }

                            ${
                              cta
                                ? `
                            <div class="btn-container">
                                <a href="${cta.url}" class="btn">${cta.text}</a>
                            </div>`
                                : ""
                            }

                            <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 32px;">
                                Questions? Reply to this email to contact ${companyName} directly.
                            </p>
                        </div>
                        <div class="footer">
                            <p class="footer-text">
                                &copy; ${currentYear} <strong>${companyName}</strong>.<br>
                                Serviced via the Thermoneural Platform.
                            </p>
                            <div class="secure-badge">
                                ⚡ Powered by <strong>Thermoneural</strong>
                            </div>
                        </div>
                    </div>
                    <br><br>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
  `;
};
