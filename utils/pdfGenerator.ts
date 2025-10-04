import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { ClientData } from '../types/ClientData';

export type ReportPayload = {
  clientData: ClientData;
  beforePhotos?: string[]; // file:// URIs
  afterPhotos?: string[];  // file:// URIs
  exhaustFanPhotos?: string[];
  ductFanPhotos?: string[];
  canopyPhotos?: string[];
  selectedServices?: string[]; // Services sélectionnés
  hoodType?: { filter: boolean; extractor: boolean; waterWash: boolean };
  damperOperates?: boolean;
  filterConfirming?: boolean;
  fanOptions?: {
    upBlast: boolean; inLine: boolean; utility: boolean; directDrive: boolean; wall: boolean; roof: boolean; fanBelt: boolean; fanType: boolean; roofAccess: boolean;
  };
  preCheck?: Record<string, boolean>;
  servicePerformed?: Record<string, boolean>;
  notCleaned?: Record<string, boolean>;
  ductReasons?: Record<string, boolean>;
  fanReasons?: Record<string, boolean>;
  otherReasons?: Record<string, boolean>;
  postCheck?: Record<string, boolean>;
  comments?: {
    hoodType: string;
    fanType: string;
    preCleaning: string;
    servicePerformed: string;
    areasNotCleaned: string;
    postCleaning: string;
  };
};

export const testLogoLoading = async (): Promise<boolean> => {
  try {
    console.log('Testing logo loading...');
    const logoAsset = Asset.fromModule(require('../assets/images/Logo.png'));
    console.log('Logo asset created:', logoAsset);
    
    await logoAsset.downloadAsync();
    console.log('Logo download completed');
    
    if (logoAsset.localUri) {
      console.log('Logo localUri found:', logoAsset.localUri);
      const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri, { encoding: 'base64' });
      console.log('Logo loaded successfully, base64 length:', base64.length);
      return true;
    } else if (logoAsset.uri) {
      console.log('Logo URI found:', logoAsset.uri);
      const base64 = await FileSystem.readAsStringAsync(logoAsset.uri, { encoding: 'base64' });
      console.log('Logo loaded from URI, base64 length:', base64.length);
      return true;
    }
    
    console.log('No valid URI found for logo');
    return false;
  } catch (error) {
    console.error('Logo loading test failed:', error);
    return false;
  }
};

export const generatePDF = async (payload: ReportPayload): Promise<string> => {
  const { clientData } = payload;
  console.log('Generating PDF for client:', clientData.name);

  // Fonction pour formater les dates
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Fonction pour formater les heures
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  try {
    // Load logo from assets as base64 (best-effort)
    let logoBase64 = '';
    let logoLoaded = false;
    
    // Try multiple approaches to load the logo
    const loadLogo = async () => {
      try {
        // Approach 1: Using require with Asset.fromModule (most reliable for Expo)
        console.log('Attempting to load logo from assets/images/Logo.png');
        const logoAsset = Asset.fromModule(require('../assets/images/Logo.png'));
        console.log('Logo asset created:', logoAsset);
        
        await logoAsset.downloadAsync();
        console.log('Logo download completed');
        
        if (logoAsset.localUri) {
          console.log('Logo localUri found:', logoAsset.localUri);
          logoBase64 = await FileSystem.readAsStringAsync(logoAsset.localUri, { encoding: 'base64' });
          logoLoaded = true;
          console.log('Logo loaded successfully, base64 length:', logoBase64.length);
          return true;
        } else {
          console.log('No localUri found, trying uri directly');
          if (logoAsset.uri) {
            console.log('Logo URI found:', logoAsset.uri);
            logoBase64 = await FileSystem.readAsStringAsync(logoAsset.uri, { encoding: 'base64' });
            logoLoaded = true;
            console.log('Logo loaded from URI, base64 length:', logoBase64.length);
            return true;
          }
        }
      } catch (e) {
        console.warn('Approach 1 failed:', e instanceof Error ? e.message : String(e));
      }
      
      try {
        // Approach 2: Try using Asset.resolveAsync (if available)
        const logoAsset = Asset.fromModule(require('../assets/images/Logo.png'));
        const assetAny = logoAsset as any;
        if (assetAny.resolveAsync) {
          const resolvedUri = await assetAny.resolveAsync();
          if (resolvedUri) {
            console.log('Logo resolved URI:', resolvedUri);
            logoBase64 = await FileSystem.readAsStringAsync(resolvedUri, { encoding: 'base64' });
            logoLoaded = true;
            console.log('Logo loaded from resolved URI');
            return true;
          }
        }
      } catch (e) {
        console.warn('Approach 2 failed:', e instanceof Error ? e.message : String(e));
      }
      
      try {
        // Approach 3: Try using Asset.uri directly
        const logoAsset = Asset.fromModule(require('../assets/images/Logo.png'));
        if (logoAsset.uri) {
          console.log('Logo URI found:', logoAsset.uri);
          logoBase64 = await FileSystem.readAsStringAsync(logoAsset.uri, { encoding: 'base64' });
          logoLoaded = true;
          console.log('Logo loaded from URI');
          return true;
        }
      } catch (e) {
        console.warn('Approach 3 failed:', e instanceof Error ? e.message : String(e));
      }
      
      try {
        // Approach 4: Try direct file path
        const fsAny = FileSystem as any;
        const directPath = (fsAny.documentDirectory || fsAny.cacheDirectory || '') + 'Logo.png';
        const fileInfo = await FileSystem.getInfoAsync(directPath);
        if (fileInfo.exists) {
          logoBase64 = await FileSystem.readAsStringAsync(directPath, { encoding: 'base64' });
          logoLoaded = true;
          console.log('Logo loaded from direct path');
          return true;
        }
      } catch (e) {
        console.warn('Approach 4 failed:', e instanceof Error ? e.message : String(e));
      }
      
      return false;
    };
    
    await loadLogo();
    
    if (!logoLoaded) {
      console.warn('All logo loading approaches failed, proceeding without logo');
      console.warn('This might be due to:');
      console.warn('1. Logo.png not being bundled properly');
      console.warn('2. Expo asset resolution issues');
      console.warn('3. File system permissions');
      console.warn('4. Asset path resolution problems');
      console.warn('5. Check if Logo.png exists in assets/images/ directory');
    } else {
      console.log('Logo successfully loaded and will be displayed in PDF');
      console.log('Logo base64 length:', logoBase64.length);
    }

    // Normalize URI to readable file path (handles content:// on Android)
    const toReadablePath = async (uri: string): Promise<string> => {
      try {
        if (uri.startsWith('content://')) {
          const filename = uri.split('/').pop() || `image-${Date.now()}.jpg`;
          const fsAny = FileSystem as unknown as { cacheDirectory?: string; documentDirectory?: string };
          const baseDir = fsAny.cacheDirectory || fsAny.documentDirectory || '';
          if (!baseDir) return uri;
          const dest = `${baseDir}tmp-${Date.now()}-${Math.random()}-${filename}`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          return dest;
        }
        return uri;
      } catch (e) {
        console.warn('normalize uri failed, fallback to raw uri', uri);
        return uri;
      }
    };

    // Read multiple photos as base64
    type EncodedImage = { base64: string; mime: string };
    const getMimeFromPath = (path: string): string => {
      const lower = path.split('?')[0].toLowerCase();
      if (lower.endsWith('.png')) return 'image/png';
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
      if (lower.endsWith('.webp')) return 'image/webp';
      if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
      return 'application/octet-stream';
    };

    const encodeOne = async (uri: string): Promise<EncodedImage | null> => {
      try {
        // Always attempt to generate a reasonably sized JPEG base64 for embedding
        const readable = await toReadablePath(uri);
        const manipulated = await ImageManipulator.manipulateAsync(
          readable,
          [{ resize: { width: 1280 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (manipulated.base64) {
          return { base64: manipulated.base64, mime: 'image/jpeg' };
        }
        // Fallback raw read
        const b64 = await FileSystem.readAsStringAsync(readable, { encoding: 'base64' });
        return { base64: b64, mime: 'image/jpeg' };
      } catch (e) {
        console.warn('Unable to read/convert image:', uri);
        return null;
      }
    };

    const readMany = async (uris?: string[]): Promise<EncodedImage[]> => {
      const list = uris || [];
      const out: EncodedImage[] = [];
      for (const u of list) {
        const enc = await encodeOne(u);
        if (enc) out.push(enc);
      }
      return out;
    };

    // Fallback: support legacy single photo fields from clientData
    const beforeList = await readMany(
      (payload.beforePhotos && payload.beforePhotos.length > 0)
        ? payload.beforePhotos
        : (clientData.beforePhoto ? [clientData.beforePhoto] : [])
    );
    const afterList = await readMany(
      (payload.afterPhotos && payload.afterPhotos.length > 0)
        ? payload.afterPhotos
        : (clientData.afterPhoto ? [clientData.afterPhoto] : [])
    );
    const exhaustList = await readMany(payload.exhaustFanPhotos);
    const ductList = await readMany(payload.ductFanPhotos);
    const canopyList = await readMany(payload.canopyPhotos);

    const renderChecklist = (title: string, entries?: Record<string, boolean>) => {
      if (!entries) return '';
      const rows = Object.keys(entries).map(key => {
        const checked = entries[key];
        return `<tr><td class="c-key">${key}</td><td class="c-val">${checked ? 'Yes' : 'No'}</td></tr>`;
      }).join('');
      return `
      <div class="section">
        <div class="section-title">${title}</div>
        <table class="check-table">
          <thead><tr><th>Item</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    };

    const renderGrid = (title: string, items: EncodedImage[], serviceName?: string) => {
      if (!items || items.length === 0) return '';
      const displayTitle = serviceName ? `${serviceName} - ${title}` : title;
      const isBeforePhotos = title.toLowerCase().includes('before');
      const isAfterPhotos = title.toLowerCase().includes('after');
      const gridClass = isBeforePhotos ? 'grid before-photos' : isAfterPhotos ? 'grid after-photos' : 'grid';
      
      const imgs = items.map((img, i) => {
        const caption = serviceName ? `${serviceName} ${i+1}` : `${title} ${i+1}`;
        return `<div class="grid-item">
          <img src="data:${img.mime};base64,${img.base64}" alt="${caption}"/>
          <div class="cap">${caption}</div>
        </div>`;
      }).join('');
      return `
      <div class="section photo-section">
        <div class="section-title">${displayTitle}</div>
        <div class="${gridClass}">${imgs}</div>
      </div>`;
    };

    // Fonction pour afficher les services sélectionnés
    const renderSelectedServices = (services?: string[]) => {
      if (!services || services.length === 0) return '';
      const serviceNames = services.map(service => {
        switch(service) {
          case 'exhaust': return 'Exhaust Fan';
          case 'duct': return 'Duct Fan';
          case 'canopy': return 'Canopy';
          default: return service;
        }
      });
      return `
      <div class="section">
        <div class="section-title">Services Sélectionnés</div>
        <div class="services-list">
          ${serviceNames.map(service => `<div class="service-item">✅ ${service}</div>`).join('')}
        </div>
      </div>`;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>KITCHEN EXHAUST CLEANING SERVICE REPORT</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 20px;
              color: #000000;
              background: #ffffff;
              line-height: 1.4;
              font-size: 12px;
            }
            .report-header {
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            .header-left, .header-right {
              flex: 1;
              font-size: 11px;
            }
            .header-left {
              text-align: left;
            }
            .header-right {
              text-align: right;
            }
            .header-center {
              flex: 1;
              text-align: center;
            }
            .logo {
              max-height: 60px;
              max-width: 200px;
            }
            .logo-placeholder {
              font-size: 24px;
              font-weight: bold;
              color: #ccc;
              border: 2px dashed #ccc;
              padding: 20px;
              display: inline-block;
            }
            .customizable-text {
              margin-bottom: 5px;
              font-weight: bold;
            }
            .report-title {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              text-align: center;
            }
            .client-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .client-info {
              flex: 1;
            }
            .technician-info {
              flex: 1;
              text-align: right;
            }
            .time-logs {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .time-item {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .checkbox {
              width: 12px;
              height: 12px;
              border: 1px solid #000;
              display: inline-block;
              margin-right: 5px;
            }
            .checked {
              background: #000;
            }
            .section {
              margin-bottom: 15px;
              border: 1px solid #000;
            }
            .section.photo-section {
              margin-bottom: 5px;
            }
            .section-title {
              background: #f0f0f0;
              font-weight: bold;
              padding: 5px 10px;
              border-bottom: 1px solid #000;
              font-size: 13px;
            }
            .section-content {
              padding: 10px;
            }
            .form-row {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
              font-size: 11px;
            }
            .form-row label {
              margin-right: 10px;
              min-width: 150px;
            }
            .form-row input[type="checkbox"] {
              margin-right: 5px;
            }
            .form-row input[type="text"] {
              border: 1px solid #000;
              padding: 2px 5px;
              width: 100px;
            }
            .comments {
              margin-top: 10px;
              border: 1px solid #000;
              height: 40px;
              padding: 5px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .signature-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 200px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              width: 100%;
              height: 20px;
              margin-bottom: 5px;
            }
            .disclaimer {
              font-size: 10px;
              margin-top: 20px;
              text-align: justify;
              line-height: 1.3;
            }
            .page-number {
              text-align: center;
              margin-top: 20px;
              font-size: 11px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              padding: 15px;
            }
            .grid.before-photos {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 10px;
              padding: 10px;
              margin-bottom: 5px;
            }
            .grid.after-photos {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              padding: 15px;
              margin-top: 5px;
            }
            .grid-item {
              text-align: center;
              border: 1px solid #ddd;
              padding: 8px;
              background: #f9f9f9;
              border-radius: 6px;
            }
            .grid-item img {
              width: 100%;
              height: 200px;
              object-fit: contain;
              border-radius: 4px;
            }
            .before-photos .grid-item img {
              height: 150px;
            }
            .after-photos .grid-item img {
              height: 200px;
            }
            .cap {
              font-size: 9px;
              font-weight: bold;
              margin-top: 3px;
              color: #333;
              text-align: center;
            }
            .services-list {
              padding: 10px;
            }
            .service-item {
              margin-bottom: 5px;
              font-size: 11px;
            }
            .date-time-input {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .date-input {
              border: 1px solid #000;
              padding: 2px 5px;
              width: 100px;
              font-size: 11px;
            }
            .time-input {
              border: 1px solid #000;
              padding: 2px 5px;
              width: 60px;
              font-size: 11px;
            }
            .calendar-icon {
              width: 16px;
              height: 16px;
              cursor: pointer;
              background: #f0f0f0;
              border: 1px solid #ccc;
              display: inline-block;
              text-align: center;
              line-height: 14px;
              font-size: 10px;
            }
            .time-picker {
              display: flex;
              align-items: center;
              gap: 3px;
            }
            .time-separator {
              font-weight: bold;
            }
            .page-break {
              page-break-before: always;
            }
            .subsection {
              margin-bottom: 10px;
              padding-left: 20px;
            }
            .subsection .form-row {
              margin-bottom: 5px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              border-top: 2px solid #000;
              padding-top: 20px;
            }
            .signature-item {
              flex: 1;
              text-align: center;
              margin: 0 10px;
            }
            .signature-item label {
              display: block;
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 12px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              height: 30px;
              margin-bottom: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
            }
            .disclaimer {
              font-size: 9px;
              margin-top: 30px;
              text-align: justify;
              line-height: 1.3;
              padding: 15px;
              border: 1px solid #ccc;
              background-color: #f9f9f9;
            }
          </style>
        </head>
        <body>
          <!-- REPORT HEADER WITH LOGO CENTERED -->
          <div class="report-header">
            <div class="header-content">
              <div class="header-left">
                <div class="customizable-text">albertahooociee.gmail.com</div>
                <div class="customizable-text">Your Company Info</div>
              </div>
              <div class="header-center">
                ${logoLoaded ? `<img src="data:image/png;base64,${logoBase64}" alt="Company Logo" class="logo" />` : '<div class="logo-placeholder">LOGO</div>'}
                ${!logoLoaded ? '<div style="font-size: 10px; color: #999; margin-top: 5px;">Logo not loaded - check console for details</div>' : ''}
              </div>
              <div class="header-right">
                <div class="customizable-text">SERVICE REPORT</div>
                <div class="customizable-text">Your Right Info</div>
              </div>
            </div>
            <div class="report-title">KITCHEN EXHAUST CLEANING SERVICE REPORT</div>
          </div>

          <!-- CLIENT & TECHNICIAN INFO -->
          <div class="client-section">
            <div class="client-info">
              <div class="form-row">
                <label>Client:</label>
                <input type="text" value="${clientData.name}" />
              </div>
              <div class="form-row">
                <label>Address:</label>
                <input type="text" value="${clientData.address || ''}" />
              </div>
              <div class="form-row">
                <label>City:</label>
                <input type="text" value="${clientData.city || ''}" />
              </div>
              <div class="form-row">
                <label>State:</label>
                <input type="text" value="${clientData.state || ''}" />
              </div>
              <div class="form-row">
                <label>Zip:</label>
                <input type="text" value="${clientData.zip || ''}" />
              </div>
              <div class="form-row">
                <label>Email:</label>
                <input type="text" value="${clientData.email}" />
              </div>
              <div class="form-row">
                <label>Phone:</label>
                <input type="text" value="${clientData.phone}" />
              </div>
            </div>
            <div class="technician-info">
              <div class="form-row">
                <label>Technician:</label>
                <input type="text" value="${clientData.technician || ''}" />
              </div>
              <div class="form-row">
                <label>Certification:</label>
                <input type="text" value="${clientData.certification || ''}" />
              </div>
              <div class="form-row">
                <label>Service Date:</label>
                <div class="date-time-input">
                  <input type="date" class="date-input" value="${clientData.serviceDate || new Date().toISOString().split('T')[0]}" />
                  <span class="calendar-icon" title="Select Date">📅</span>
                  <span style="font-size: 10px; color: #666;">(${formatDate(new Date())})</span>
                </div>
              </div>
              <div class="form-row">
                <label>Next Service:</label>
                <div class="date-time-input">
                  <input type="date" class="date-input" value="${clientData.nextService || ''}" />
                  <span class="calendar-icon" title="Select Next Service Date">📅</span>
                </div>
              </div>
            </div>
          </div>

          <!-- TIME LOGS -->
          <div class="time-logs">
            <div class="time-item">
              <label>Time Jobs Scheduled:</label>
              <div class="time-picker">
                <input type="time" class="time-input" value="${clientData.scheduledTime || '09:00'}" />
                <span class="checkbox"></span>
                <label>AM</label>
                <span class="checkbox"></span>
                <label>PM</label>
              </div>
            </div>
            <div class="time-item">
              <label>Arrival Time:</label>
              <div class="time-picker">
                <input type="time" class="time-input" value="${clientData.arrivalTime || '09:00'}" />
                <span class="checkbox"></span>
                <label>AM</label>
                <span class="checkbox"></span>
                <label>PM</label>
              </div>
            </div>
            <div class="time-item">
              <label>Departure Time:</label>
              <div class="time-picker">
                <input type="time" class="time-input" value="${clientData.departureTime || '17:00'}" />
                <span class="checkbox"></span>
                <label>AM</label>
                <span class="checkbox"></span>
                <label>PM</label>
              </div>
            </div>
          </div>

          <!-- HOOD TYPE SECTION -->
          <div class="section">
            <div class="section-title">Hood Type</div>
            <div class="section-content">
              <div class="form-row">
                <span class="checkbox ${payload.hoodType?.filter ? 'checked' : ''}"></span>
                <label>Filter</label>
                <span class="checkbox ${payload.hoodType?.extractor ? 'checked' : ''}"></span>
                <label>Extractor</label>
                <span class="checkbox ${payload.hoodType?.waterWash ? 'checked' : ''}"></span>
                <label>Water Wash Hood</label>
              </div>
              <div class="form-row">
                <label>Damper operates properly?</label>
                <span class="checkbox ${payload.damperOperates ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.damperOperates ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.damperOperates ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Filter confirming and in place?</label>
                <span class="checkbox ${payload.filterConfirming ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.filterConfirming ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.filterConfirming ? 'Yes' : 'No'}</span>
              </div>
              <div class="comments">Comments: ${payload.comments?.hoodType || ''}</div>
            </div>
          </div>

          <!-- FAN TYPE SECTION -->
          <div class="section">
            <div class="section-title">Fan Type</div>
            <div class="section-content">
              <div class="form-row">
                <span class="checkbox ${payload.fanOptions?.upBlast ? 'checked' : ''}"></span>
                <label>Up blast</label>
                <span class="checkbox ${payload.fanOptions?.inLine ? 'checked' : ''}"></span>
                <label>In-Line</label>
                <span class="checkbox ${payload.fanOptions?.utility ? 'checked' : ''}"></span>
                <label>Utility</label>
                <span class="checkbox ${payload.fanOptions?.directDrive ? 'checked' : ''}"></span>
                <label>Direct Drive</label>
              </div>
              <div class="form-row">
                <label>Fan Termination:</label>
                <span class="checkbox ${payload.fanOptions?.roof ? 'checked' : ''}"></span>
                <label>Roof</label>
                <span class="checkbox ${payload.fanOptions?.wall ? 'checked' : ''}"></span>
                <label>Wall</label>
              </div>
              <div class="form-row">
                <label>Fan Belt #:</label>
                <input type="text" value="${clientData.fanBeltNumber || ''}" />
              </div>
              <div class="form-row">
                <label>Fan type able or interior is accessible:</label>
                <span class="checkbox ${payload.fanOptions?.fanType ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.fanOptions?.fanType ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.fanOptions?.fanType ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Roof Access:</label>
                <span class="checkbox ${payload.fanOptions?.roofAccess ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.fanOptions?.roofAccess ? 'checked' : ''}"></span>
                <label>No</label>
                <span class="checkbox"></span>
                <label>Ladder or Lift</label>
                <input type="text" value="${clientData.ladderOrLift || ''}" style="width: 50px;" />
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.fanOptions?.roofAccess ? 'Yes' : 'No'}</span>
              </div>
              <div class="comments">Comments: ${payload.comments?.fanType || ''}</div>
            </div>
          </div>

          <!-- PRE-CLEANING CHECK SECTION -->
          <div class="section">
            <div class="section-title">Pre-Cleaning Check</div>
            <div class="section-content">
              <div class="form-row">
                <label>Exhaust Fan Operational</label>
                <span class="checkbox ${payload.preCheck?.exhaustFanOperational ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.preCheck?.exhaustFanOperational ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.preCheck?.exhaustFanOperational ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Exhaust Fan Noisy/Off Balance</label>
                <span class="checkbox ${payload.preCheck?.exhaustFanNoisy ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.preCheck?.exhaustFanNoisy ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.preCheck?.exhaustFanNoisy ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Bare or Exposed Wires/Wires Too Short</label>
                <span class="checkbox ${payload.preCheck?.bareWires ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.preCheck?.bareWires ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.preCheck?.bareWires ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Hinge Kit Needed For Fan</label>
                <span class="checkbox ${payload.preCheck?.hingeKit ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.preCheck?.hingeKit ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.preCheck?.hingeKit ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Fan Clean Out Port Required</label>
                <span class="checkbox ${payload.preCheck?.fanCleanOut ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.preCheck?.fanCleanOut ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.preCheck?.fanCleanOut ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Hood Lights Operational</label>
                <span class="checkbox ${payload.preCheck?.hoodLights ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.preCheck?.hoodLights ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.preCheck?.hoodLights ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Grease Accumulation On Roof</label>
                <span class="checkbox ${payload.preCheck?.greaseRoof ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.preCheck?.greaseRoof ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.preCheck?.greaseRoof ? 'Yes' : 'No'}</span>
              </div>
              <div class="comments">Comments: ${payload.comments?.preCleaning || ''}</div>
            </div>
          </div>

          <!-- SERVICE PERFORMED SECTION -->
          <div class="section">
            <div class="section-title">Service Performed</div>
            <div class="section-content">
              <div class="form-row">
                <label>Hood Cleaned</label>
                <span class="checkbox ${payload.servicePerformed?.hoodCleaned ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.servicePerformed?.hoodCleaned ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.servicePerformed?.hoodCleaned ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Vertical Duct Cleaned</label>
                <span class="checkbox ${payload.servicePerformed?.verticalDuct ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.servicePerformed?.verticalDuct ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.servicePerformed?.verticalDuct ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Horizontal Duct Cleaned</label>
                <span class="checkbox ${payload.servicePerformed?.horizontalDuct ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.servicePerformed?.horizontalDuct ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.servicePerformed?.horizontalDuct ? 'Yes' : 'No'}</span>
              </div>
              <div class="comments">Comments: ${payload.comments?.servicePerformed || ''}</div>
            </div>
          </div>

          <!-- AREAS NOT CLEANED SECTION -->
          <div class="section">
            <div class="section-title">Areas not Cleaned</div>
            <div class="section-content">
              <div class="subsection">
                <div class="form-row">
                  <label>Duct:</label>
                  <span class="checkbox ${payload.ductReasons?.insufficientAccess ? 'checked' : ''}"></span>
                  <label>Insufficient Access</label>
                  <span class="checkbox ${payload.ductReasons?.insufficientTime ? 'checked' : ''}"></span>
                  <label>Insufficient time</label>
                  <span class="checkbox ${payload.ductReasons?.severeWeather ? 'checked' : ''}"></span>
                  <label>Severe weather</label>
                  <span class="checkbox ${payload.ductReasons?.other ? 'checked' : ''}"></span>
                  <label>Other</label>
                </div>
              </div>
              <div class="subsection">
                <div class="form-row">
                  <label>Fan:</label>
                  <span class="checkbox ${payload.fanReasons?.notAccessible ? 'checked' : ''}"></span>
                  <label>Unable To Remove/Open Fan</label>
                  <span class="checkbox ${payload.fanReasons?.insufficientAccess ? 'checked' : ''}"></span>
                  <label>Insufficient Access</label>
                  <span class="checkbox ${payload.fanReasons?.insufficientTime ? 'checked' : ''}"></span>
                  <label>Insufficient time</label>
                  <span class="checkbox ${payload.fanReasons?.severeWeather ? 'checked' : ''}"></span>
                  <label>Severe weather</label>
                  <span class="checkbox ${payload.fanReasons?.other ? 'checked' : ''}"></span>
                  <label>Other</label>
                </div>
              </div>
              <div class="subsection">
                <div class="form-row">
                  <label>Other:</label>
                  <span class="checkbox ${payload.otherReasons?.insufficientAccess ? 'checked' : ''}"></span>
                  <label>Insufficient Access</label>
                  <span class="checkbox ${payload.otherReasons?.insufficientTime ? 'checked' : ''}"></span>
                  <label>Insufficient time</label>
                  <span class="checkbox ${payload.otherReasons?.severeWeather ? 'checked' : ''}"></span>
                  <label>Severe weather</label>
                  <span class="checkbox ${payload.otherReasons?.other ? 'checked' : ''}"></span>
                  <label>Other</label>
                </div>
              </div>
              <div class="comments">Comments: ${payload.comments?.areasNotCleaned || ''}</div>
            </div>
          </div>

          <!-- POST CLEANING CHECK SECTION -->
          <div class="section">
            <div class="section-title">Post Cleaning Check</div>
            <div class="section-content">
              <div class="form-row">
                <label>Any Exhaust System Leaks</label>
                <span class="checkbox ${payload.postCheck?.leaks ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.leaks ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.leaks ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Exhaust Fan Restarted</label>
                <span class="checkbox ${payload.postCheck?.fanRestarted ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.fanRestarted ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.fanRestarted ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Pilot Lights Relit</label>
                <span class="checkbox ${payload.postCheck?.pilotLights ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.pilotLights ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.pilotLights ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Ceiling Tiles Replaced</label>
                <span class="checkbox ${payload.postCheck?.ceilingTiles ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.ceilingTiles ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.ceilingTiles ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Floors Mopped</label>
                <span class="checkbox ${payload.postCheck?.floorsMopped ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.floorsMopped ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.floorsMopped ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Water Properly Disposed Of</label>
                <span class="checkbox ${payload.postCheck?.waterDisposed ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.waterDisposed ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.waterDisposed ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Photos Taken</label>
                <span class="checkbox ${payload.postCheck?.photosTaken ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.photosTaken ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.photosTaken ? 'Yes' : 'No'}</span>
              </div>
              <div class="form-row">
                <label>Building Properly Secured</label>
                <span class="checkbox ${payload.postCheck?.buildingSecured ? 'checked' : ''}"></span>
                <label>Yes</label>
                <span class="checkbox ${!payload.postCheck?.buildingSecured ? 'checked' : ''}"></span>
                <label>No</label>
                <span style="margin-left: 20px; font-weight: bold;">Answer: ${payload.postCheck?.buildingSecured ? 'Yes' : 'No'}</span>
              </div>
              <div class="comments">Comments: ${payload.comments?.postCleaning || ''}</div>
            </div>
          </div>

          <!-- SELECTED SERVICES SECTION -->
          ${renderSelectedServices(payload.selectedServices)}

          <!-- PHOTOS SECTION -->
          ${beforeList.length > 0 ? renderGrid('Before Photos', beforeList) : ''}
          ${payload.selectedServices?.includes('exhaust') && exhaustList.length > 0 ? renderGrid('Photos', exhaustList, 'Exhaust Fan') : ''}
          ${payload.selectedServices?.includes('duct') && ductList.length > 0 ? renderGrid('Photos', ductList, 'Duct Fan') : ''}
          ${payload.selectedServices?.includes('canopy') && canopyList.length > 0 ? renderGrid('Photos', canopyList, 'Canopy') : ''}
          
          <!-- PAGE NUMBER -->
          <div class="page-number">1 of 2</div>
          
          <!-- PAGE BREAK FOR AFTER PHOTOS -->
          <div class="page-break"></div>
          
          <!-- AFTER PHOTOS SECTION (PAGE 2) -->
          ${afterList.length > 0 ? renderGrid('After Photos', afterList) : ''}
          
          <!-- SIGNATURE SECTION -->
          <div class="signature-section">
            <div class="signature-item">
              <label>Owner Representative:</label>
              <div class="signature-line">${clientData.ownerRepresentative || ''}</div>
            </div>
            <div class="signature-item">
              <label>Signature:</label>
              <div class="signature-line">${clientData.signature || ''}</div>
            </div>
            <div class="signature-item">
              <label>Date:</label>
              <div class="signature-line">${clientData.reportDate || ''}</div>
            </div>
          </div>
          
          <!-- DISCLAIMER -->
          <div class="disclaimer">
            <p><strong>DISCLAIMER:</strong> This report is provided as a service to our customers. The information contained herein is based on observations made during the service visit. While we strive for accuracy, we cannot guarantee that all conditions were identified or that all recommendations will resolve all issues. Customers are advised to consult with qualified professionals for any concerns regarding their exhaust systems. This report does not constitute a warranty or guarantee of any kind.</p>
          </div>
          
          <!-- PAGE NUMBER -->
          <div class="page-number">2 of 2</div>
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
