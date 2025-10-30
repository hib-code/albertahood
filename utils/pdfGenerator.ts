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
   logoBase64?: string;
};
const loadLogoBase64 = async (): Promise<string | null> => {
  try {
    const logoAsset = Asset.fromModule(require('../assets/images/Logo.png'));
    await logoAsset.downloadAsync();
    if (logoAsset.localUri) {
      const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri, { encoding: 'base64' });
      return base64;
    }
    return null;
  } catch (e) {
    console.warn('Impossible de charger le logo:', e instanceof Error ? e.message : e);
    return null;
  }
};




//-----------------------------
// supabase
// ----------------------------
const logoUrl = 'https://wxrnyarkeftslssfwvhr.supabase.co/storage/v1/object/public/logo/Logo.png';
// ----------------------------
// Fonction pour encoder une photo
// ----------------------------
type EncodedImage = { base64: string; mime: string };
const encodeImage = async (uri: string): Promise<EncodedImage | null> => {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (manipulated.base64) return { base64: manipulated.base64, mime: 'image/jpeg' };
    return null;
  } catch (e) {
    console.warn('Erreur conversion image:', uri, e);
    return null;
  }
};

const encodeManyImages = async (uris?: string[]): Promise<EncodedImage[]> => {
  if (!uris) return [];
  const out: EncodedImage[] = [];
  for (const u of uris) {
    const enc = await encodeImage(u);
    if (enc) out.push(enc);
  }
  return out;
};

// ----------------------------
// Fonction pour créer une grille d’images
// ----------------------------
const renderGrid = (title: string, items: EncodedImage[], serviceName?: string) => {
  if (!items || items.length === 0) return '';
  const displayTitle = serviceName ? `${serviceName} - ${title}` : title;
  const imgs = items.map((img, i) => {
    const caption = serviceName ? `${serviceName} ${i + 1}` : `${title} ${i + 1}`;
    return `<div style="text-align:center; margin-bottom:10px;">
      <img src="data:${img.mime};base64,${img.base64}" style="width:100%; max-width:300px; height:auto; border:1px solid #ddd; border-radius:4px;" />
      <div>${caption}</div>
    </div>`;
  }).join('');
  return `<h3>${displayTitle}</h3>${imgs}`;
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
  console.log('Signature:', clientData.signature);

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
      .header-left { text-align: left; }
      .header-right { text-align: right; }
      .header-center { flex: 1; text-align: center; }
      .logo {
            max-height: 300px;
            max-width: 300px;
              display: block;  
              margin: 0 auto;
              
            }

     
      .customizable-text { margin-bottom: 5px; font-weight: bold; }
      .report-title {
        font-size: 18px; font-weight: bold; text-transform: uppercase; text-align: center;
      }
      .form-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 11px; }
      .form-row label { margin-right: 10px; min-width: 150px; }
      .form-row input[type="text"], .date-input, .time-input {
        border: 1px solid #000; padding: 2px 5px; font-size: 11px;
      }
      .comments { margin-top: 10px; border: 1px solid #000; height: 40px; padding: 5px; }
      .checkbox { width: 12px; height: 12px; border: 1px solid #000; display: inline-block; margin-right: 5px; }
      .checked { background: #000; }
      .disclaimer { font-size: 9px; margin-top: 30px; text-align: justify; line-height: 1.3; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; }
      .page-number { text-align: center; margin-top: 20px; font-size: 11px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; padding: 15px; }
      .grid-item { text-align: center; border: 1px solid #ddd; padding: 8px; background: #f9f9f9; border-radius: 6px; }
      .grid-item img { width: 100%; height: 200px; object-fit: contain; border-radius: 4px; }
      .signature-section { display: flex; justify-content: space-between; margin-top: 30px; border-top: 2px solid #000; padding-top: 20px; }
      .signature-item { flex: 1; text-align: center; margin: 0 10px; }
      .signature-line { border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px; display: flex; align-items: center; justify-content: center; font-size: 11px; }
      .signature-image { height: auto; max-height: 80px; width: auto; max-width: 200px; border: none; }
      .page-break { page-break-before: always; }

    </style>
  </head>
  <body>

    <!-- REPORT HEADER -->
    <div class="report-header">
      <div class="header-content">
        <div class="header-left">
          <div class="customizable-text">Alberta Hood Cleaning LTD</div>
          <div class="customizable-text">780-710-2273</div>
          <div class="customizable-text">albertahooociee.gmail.com</div>
          <div class="customizable-text">www.alberthoodcleaning.ca</div>
        </div>
        <div class="header-center">
          <img class="logo" src="${logoUrl}" />
        </div>
        <div class="header-right">
          <div class="customizable-text">KITCHEN EXHAUST CLEANING</div>
          <div class="customizable-text">SERVICE REPORT</div>
        </div>
      </div>

    <!-- CLIENT & TECHNICIAN INFO TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th colspan="2" style="background:#f0f0f0; padding:5px;">Client & Technician Info</th></tr>
      <tr>
        <td style="padding:5px; vertical-align:top;">
          <div class="form-row"><label>Client:</label><input type="text" value="${clientData.name}" /></div>
          <div class="form-row"><label>Address:</label><input type="text" value="${clientData.address || ''}" /></div>
          <div class="form-row"><label>City:</label><input type="text" value="${clientData.city || ''}" /></div>
          <div class="form-row"><label>State:</label><input type="text" value="${clientData.state || ''}" /></div>
          <div class="form-row"><label>Zip:</label><input type="text" value="${clientData.zip || ''}" /></div>
          <div class="form-row"><label>Email:</label><input type="text" value="${clientData.email}" /></div>
          <div class="form-row"><label>Phone:</label><input type="text" value="${clientData.phone}" /></div>
        </td>
        <td style="padding:5px; vertical-align:top;">
          <div class="form-row"><label>Technician:</label><input type="text" value="${clientData.technician || ''}" /></div>
          <div class="form-row"><label>Certification:</label><input type="text" value="${clientData.certification || ''}" /></div>
          <div class="form-row">
          <label>Service Date:</label>
          <input type="date" 
          value="${clientData.serviceDate}" /></div>
          <div class="form-row"><label>Next Service:</label><input type="date" value="${clientData.nextService}" /></div>
        </td>
      </tr>
    </table>

    <!-- TIME LOGS TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th colspan="3" style="background:#f0f0f0; padding:5px;">Time Logs</th></tr>
      <tr>
        <td style="padding:5px;"><label>Scheduled Time:</label><input type="time" value="${clientData.scheduledTime || '09:00'}" /></td>
        <td style="padding:5px;"><label>Arrival Time:</label><input type="time" value="${clientData.arrivalTime || '09:00'}" /></td>
        <td style="padding:5px;"><label>Departure Time:</label><input type="time" value="${clientData.departureTime || '17:00'}" /></td>
      </tr>
    </table>

    <!-- HOOD TYPE TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th style="background:#f0f0f0; padding:5px;">Hood Type</th></tr>
      <tr><td style="padding:5px;">
        <div class="form-row">
          <span class="checkbox ${payload.hoodType?.filter ? 'checked' : ''}"></span><label>Filter</label>
          <span class="checkbox ${payload.hoodType?.extractor ? 'checked' : ''}"></span><label>Extractor</label>
          <span class="checkbox ${payload.hoodType?.waterWash ? 'checked' : ''}"></span><label>Water Wash Hood</label>
        </div>
        <div class="form-row">
          <label>Damper operates properly?</label>
          <span class="checkbox ${payload.damperOperates ? 'checked' : ''}"></span><label>Yes</label>
          <span class="checkbox ${!payload.damperOperates ? 'checked' : ''}"></span><label>No</label>
          <span style="margin-left: 20px; font-weight:bold;">Answer: ${payload.damperOperates ? 'Yes' : 'No'}</span>
        </div>
        <div class="form-row">
          <label>Filter confirming and in place?</label>
               <span class="checkbox ${payload.filterConfirming ? 'checked' : ''}"></span><label>Yes</label>
                <span class="checkbox ${!payload.filterConfirming ? 'checked' : ''}"></span><label>No</label>
                <span style="margin-left: 20px; font-weight:bold;">Answer: ${payload.filterConfirming ? 'Yes' : 'No'}</span>
        </div>
        <div class="comments">Comments: ${payload.comments?.hoodType || ''}</div>
      </td></tr>
    </table>

    <!-- FAN TYPE TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th style="background:#f0f0f0; padding:5px;">Fan Type</th></tr>
      <tr><td style="padding:5px;">
        <div class="form-row">
           <span class="checkbox ${payload.fanOptions?.upBlast ? 'checked' : ''}"></span><label>Up blast</label>
           <span class="checkbox ${payload.fanOptions?.inLine ? 'checked' : ''}"></span><label>In-Line</label>
           <span class="checkbox ${payload.fanOptions?.utility ? 'checked' : ''}"></span><label>Utility</label>
           <span class="checkbox ${payload.fanOptions?.directDrive ? 'checked' : ''}"></span><label>Direct Drive</label>
        </div>
        <div class="form-row">
          <label>Fan Termination:</label>
          <span class="checkbox ${payload.fanOptions?.roof ? 'checked' : ''}"></span><label>Roof</label>
      <span class="checkbox ${payload.fanOptions?.wall ? 'checked' : ''}"></span><label>Wall</label>
      <span style="margin-left: 20px; font-weight:bold;">Answer: ${payload.fanOptions?.roof ? 'Roof' : payload.fanOptions?.wall ? 'Wall' : 'N/A'}</span>
        </div>
        <div class="form-row"><label>Fan Belt #:</label><input type="text" value="${clientData.fanBeltNumber || ''}" /></div>
        <div class="comments">Comments: ${payload.comments?.fanType || ''}</div>
      </td></tr>
    </table>
<div class="page-break"></div>
    <!-- PRE-CLEANING CHECK TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th style="background:#f0f0f0; padding:5px;">Pre-Cleaning Check</th></tr>
      <tr><td style="padding:5px;">
        ${[
      { label: "Exhaust Fan Operational", key: "exhaustFanOperational" },
      { label: "Exhaust Fan Noisy/Off Balance", key: "exhaustFanNoisy" },
      { label: "Bare or Exposed Wires/Wires Too Short", key: "bareWires" },
      { label: "Hinge Kit Needed For Fan", key: "hingeKit" },
      { label: "Fan Clean Out Port Required", key: "fanCleanOut" },
      { label: "Hood Lights Operational", key: "hoodLights" },
      { label: "Grease Accumulation On Roof", key: "greaseRoof" }
    ]
      .map(item => `
      <div class="form-row">
        <label>${item.label}</label>
        <span class="checkbox ${payload.preCheck?.[item.key] ? 'checked' : ''}"></span><label>Yes</label>
        <span class="checkbox ${!payload.preCheck?.[item.key] ? 'checked' : ''}"></span><label>No</label>
        <span style="margin-left:20px; font-weight:bold;">Answer: ${payload.preCheck?.[item.key] ? 'Yes' : 'No'}</span>
      </div>`).join('')}
       <div class="comments">Comments: ${payload.comments?.preCleaning || ''}</div>
      </td></tr>
    </table>

    <!-- SERVICE PERFORMED TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th style="background:#f0f0f0; padding:5px;">Service Performed</th></tr>
      <tr><td style="padding:5px;">
       ${[
      { label: "Hood Cleaned", key: "hoodCleaned" },
      { label: "Vertical Duct Cleaned", key: "verticalDuct" },
      { label: "Horizontal Duct Cleaned", key: "horizontalDuct" }
    ]
      .map(item => `
      <div class="form-row">
        <label>${item.label}</label>
        <span class="checkbox ${payload.servicePerformed?.[item.key] ? 'checked' : ''}"></span><label>Yes</label>
        <span class="checkbox ${!payload.servicePerformed?.[item.key] ? 'checked' : ''}"></span><label>No</label>
        <span style="margin-left:20px; font-weight:bold;">Answer: ${payload.servicePerformed?.[item.key] ? 'Yes' : 'No'}</span>
      </div>`).join('')}
    <div class="comments">Comments: ${payload.comments?.servicePerformed || ''}</div>
      </td></tr>
    </table>

    <!-- AREAS NOT CLEANED TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th style="background:#f0f0f0; padding:5px;">Areas Not Cleaned</th></tr>
      <tr><td style="padding:5px;">
        <div class="form-row"><label>Duct:</label><span class="checkbox ${payload.ductReasons?.insufficientAccess ? 'checked' : ''}"></span>Insufficient Access
        <span class="checkbox ${payload.ductReasons?.insufficientTime ? 'checked' : ''}"></span>Insufficient Time
        <span class="checkbox ${payload.ductReasons?.severeWeather ? 'checked' : ''}"></span>Severe Weather
        <span class="checkbox ${payload.ductReasons?.other ? 'checked' : ''}"></span>Other
        </div>
        <div class="form-row"><label>Fan:</label>
        <span class="checkbox ${payload.fanReasons?.notAccessible ? 'checked' : ''}"></span>Unable To Remove/Open
        <span class="checkbox ${payload.fanReasons?.insufficientAccess ? 'checked' : ''}"></span>Insufficient Access
        <span class="checkbox ${payload.fanReasons?.insufficientTime ? 'checked' : ''}"></span>Insufficient Time
        <span class="checkbox ${payload.fanReasons?.severeWeather ? 'checked' : ''}"></span>Severe Weather
        <span class="checkbox ${payload.fanReasons?.other ? 'checked' : ''}"></span>Other
        </div>
        <div class="form-row"><label>Other:</label>
        <span class="checkbox ${payload.otherReasons?.insufficientAccess ? 'checked' : ''}"></span>Insufficient Access
        <span class="checkbox ${payload.otherReasons?.insufficientTime ? 'checked' : ''}"></span>Insufficient Time
        <span class="checkbox ${payload.otherReasons?.severeWeather ? 'checked' : ''}"></span>Severe Weather
        <span class="checkbox ${payload.otherReasons?.other ? 'checked' : ''}"></span>Other
        </div>
        <div class="comments">Comments: ${payload.comments?.areasNotCleaned || ''}</div>
      </td></tr>
    </table>

    <!-- POST-CLEANING CHECK TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th style="background:#f0f0f0; padding:5px;">Post Cleaning Check</th></tr>
      <tr><td style="padding:5px;">
         ${[
      { label: "Any Exhaust System Leaks", key: "leaks" },
      { label: "Exhaust Fan Restarted", key: "fanRestarted" },
      { label: "Pilot Lights Relit", key: "pilotLights" },
      { label: "Ceiling Tiles Replaced", key: "ceilingTiles" },
      { label: "Floors Mopped", key: "floorsMopped" },
      { label: "Water Properly Disposed Of", key: "waterDisposed" },
      { label: "Photos Taken", key: "photosTaken" },
      { label: "Building Properly Secured", key: "buildingSecured" }
    ]
      .map(item => `
      <div class="form-row">
        <label>${item.label}</label>
        <span class="checkbox ${payload.postCheck?.[item.key] ? 'checked' : ''}"></span><label>Yes</label>
        <span class="checkbox ${!payload.postCheck?.[item.key] ? 'checked' : ''}"></span><label>No</label>
        <span style="margin-left:20px; font-weight:bold;">Answer: ${payload.postCheck?.[item.key] ? 'Yes' : 'No'}</span>
      </div>`).join('')}
    <div class="comments">Comments: ${payload.comments?.postCleaning || ''}</div>
      </td></tr>
    </table>
<div class="page-break"></div>
   <!-- PHOTOS TABLE -->
<table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
  <tr><th style="background:#f0f0f0; padding:5px;">Photos</th></tr>
  <tr><td style="padding:5px;">
    <!-- PHOTOS SECTION -->
        ${beforeList.length > 0 ? renderGrid('Before Photos', beforeList) : ''}
        ${payload.selectedServices?.includes('exhaust') && exhaustList.length > 0 ? renderGrid('Photos', exhaustList, 'Exhaust Fan') : ''}
        ${payload.selectedServices?.includes('duct') && ductList.length > 0 ? renderGrid('Photos', ductList, 'Duct Fan') : ''}
        ${payload.selectedServices?.includes('canopy') && canopyList.length > 0 ? renderGrid('Photos', canopyList, 'Canopy') : ''}

        <!-- PAGE NUMBER -->

      

        <!-- AFTER PHOTOS SECTION (PAGE 2) -->
        ${afterList.length > 0 ? renderGrid('After Photos', afterList) : ''}
      </td></tr>
    </table>


    <!-- SIGNATURES TABLE -->
    <table style="width:100%; border:1px solid #000; margin-bottom:20px; border-collapse: collapse;">
      <tr><th colspan="2" style="background:#f0f0f0; padding:5px;">Signatures</th></tr>
      <tr>
        <td style="padding:5px; vertical-align:top;">
          <div class="signature-section">
            <div class="signature-item">
                <label>Signature client:</label>
                <div class="signature-line">${clientData.signature || ''}</div>
            </div>
            <div class="signature-item">
                <label>Signature technician:</label>
                <div class="signature-line">${clientData.ownerRepresentative || '' }</div>
            </div>
             <div class="signature-item">
                <label>date:</label>
                <div class="signature-line">${clientData.reportDate || '' }</div>
            </div> 
          </div>
        </td>
      </tr>
    </table>

    <!-- DISCLAIMER -->
    <div class="disclaimer">
      This report is based on visual observations and the conditions at the time of service. It is not a guarantee of cleanliness or safety, and does not replace regular maintenance, inspections, or compliance with local fire and safety codes. Always follow your facility's guidelines and consult certified professionals for comprehensive safety evaluations.
    </div>

    <div class="page-number">Page 3</div>
  </body>
</html>

    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
    
    });

    console.log('PDF generated successfully:', uri);
    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};