
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { ClientData } from '../types/ClientData';

export const generatePDF = async (clientData: ClientData): Promise<string> => {
  console.log('Generating PDF for client:', clientData.name);
  
  try {
    // Convert images to base64 if they exist
    let beforeImageBase64 = '';
    let afterImageBase64 = '';
    
    if (clientData.beforePhoto) {
      try {
        beforeImageBase64 = await FileSystem.readAsStringAsync(clientData.beforePhoto, {
          encoding: 'base64',
        });
      } catch (error) {
        console.error('Error reading before photo:', error);
      }
    }
    
    if (clientData.afterPhoto) {
      try {
        afterImageBase64 = await FileSystem.readAsStringAsync(clientData.afterPhoto, {
          encoding: 'base64',
        });
      } catch (error) {
        console.error('Error reading after photo:', error);
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Client Report - ${clientData.name}</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              margin: 40px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 16px;
              color: #6b7280;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 15px;
              border-left: 4px solid #2563eb;
              padding-left: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .info-label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 5px;
            }
            .info-value {
              color: #1f2937;
            }
            .photos-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin: 20px 0;
            }
            .photo-section {
              text-align: center;
            }
            .photo-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #1f2937;
            }
            .photo {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              border: 2px solid #e5e7eb;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .no-photo {
              background: #f3f4f6;
              border: 2px dashed #d1d5db;
              border-radius: 8px;
              padding: 40px;
              color: #6b7280;
              font-style: italic;
            }
            .questions-section {
              background: #f8fafc;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }
            .question-item {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #e5e7eb;
            }
            .question-item:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .question-label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 8px;
            }
            .question-answer {
              color: #1f2937;
              background: white;
              padding: 10px;
              border-radius: 6px;
              border: 1px solid #d1d5db;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Client Service Report</div>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Client Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${clientData.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${clientData.email}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${clientData.phone}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Additional Information</div>
                <div class="info-value">${clientData.additionalInfo || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Before & After Photos</div>
            <div class="photos-container">
              <div class="photo-section">
                <div class="photo-title">Before</div>
                ${beforeImageBase64 
                  ? `<img src="data:image/jpeg;base64,${beforeImageBase64}" class="photo" alt="Before photo" />`
                  : '<div class="no-photo">No before photo provided</div>'
                }
              </div>
              <div class="photo-section">
                <div class="photo-title">After</div>
                ${afterImageBase64 
                  ? `<img src="data:image/jpeg;base64,${afterImageBase64}" class="photo" alt="After photo" />`
                  : '<div class="no-photo">No after photo provided</div>'
                }
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Client Feedback</div>
            <div class="questions-section">
              <div class="question-item">
                <div class="question-label">What improvements do you see?</div>
                <div class="question-answer">${clientData.questions.improvements || 'No response provided'}</div>
              </div>
              <div class="question-item">
                <div class="question-label">How satisfied are you with the results?</div>
                <div class="question-answer">${clientData.questions.satisfaction || 'No response provided'}</div>
              </div>
              <div class="question-item">
                <div class="question-label">Would you recommend our services?</div>
                <div class="question-answer">${clientData.questions.recommendations || 'No response provided'}</div>
              </div>
              <div class="question-item">
                <div class="question-label">Additional feedback</div>
                <div class="question-answer">${clientData.questions.additionalFeedback || 'No additional feedback provided'}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This report was generated automatically by the Client Service App</p>
            <p>Report ID: ${Date.now()}</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    console.log('PDF generated successfully:', uri);
    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};
