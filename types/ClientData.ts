
export interface ClientData {
  name: string;
  email: string;
  phone: string;
  additionalInfo: string;
  beforePhoto?: string;
  afterPhoto?: string;
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
}