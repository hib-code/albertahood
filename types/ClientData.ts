
export interface ClientData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  technician?: string;
  certification?: string;
  serviceDate?: string;
  nextService?: string;
  scheduledTime?: string;
  arrivalTime?: string;
  departureTime?: string;
  additionalInfo: string;
  beforePhoto?: string;
  afterPhoto?: string;
  fanBeltNumber?: string;
  ladderOrLift?: string;
  ownerRepresentative?: string;
  signature?: string;
  reportDate?: string;
  questions: {
    improvements: string;
    satisfaction: string;
    recommendations: string;
    additionalFeedback: string;
  };
}

export interface PhotoUpload {
  uri: string;
  type: 'before' | 'after';
   uploadedUrl?: string;     
}

// types/ClientData.ts



// --- Structure principale du rapport ---
export type ReportPayload = {
  clientData: ClientData;

  // Dates et info générales
  serviceDate?: string;
  technicianName?: string;
  selectedServices?: string[];

  // Photos (optionnelles)
  beforePhotos?: string[];
  afterPhotos?: string[];
  exhaustFanPhotos?: string[];
  ductFanPhotos?: string[];
  canopyPhotos?: string[];
  signature?: string;

  // Métadonnées optionnelles
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
};
