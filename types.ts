export enum AppMode {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  RESULT = 'RESULT',
  COLLECTION = 'COLLECTION'
}

export enum NatureCategory {
  FLORA = 'Flora',
  FAUNA = 'Fauna',
  MINERAL = 'Mineral',
  OTHER = 'Lainnya'
}

export interface IdentificationResult {
  name: string;
  scientificName: string;
  description: string;
  funFact: string;
  category: NatureCategory;
  dangerLevel: 'Aman' | 'Hati-hati' | 'Berbahaya';
  timestamp: number;
  imageUrl?: string; // Base64 of the captured image
}

export interface CollectionItem extends IdentificationResult {
  id: string;
}