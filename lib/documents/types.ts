export type DocumentType = "letter" | "contract";
export type DocumentLang = "ko" | "en";

/**
 * Guest legal data typed by the admin. EPHEMERAL BY DESIGN — React state,
 * sessionStorage draft, and the send request body only. Never persisted.
 */
export interface GuestDocumentForm {
  passportNumber: string;
  nationality: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  /** Contract only. */
  homeAddress: string;
  /** Contract only, free text. */
  specialTerms: string;
  /** YYYY-MM-DD */
  issueDate: string;
}

export const EMPTY_DOCUMENT_FORM: GuestDocumentForm = {
  passportNumber: "",
  nationality: "",
  dateOfBirth: "",
  homeAddress: "",
  specialTerms: "",
  issueDate: "",
};

export interface DocumentField {
  label: string;
  value: string;
}

export interface DocumentSection {
  heading: string;
  fields: DocumentField[];
  paragraphs: string[];
}

export interface DocumentSignature {
  role: string;
  name: string;
  showStamp: boolean;
}

export interface DocumentModel {
  type: DocumentType;
  lang: DocumentLang;
  title: string;
  subtitle: string;
  sections: DocumentSection[];
  /** Body paragraphs rendered after the sections. */
  statement: string[];
  issueDateLine: string;
  signatures: DocumentSignature[];
  /** Labels of required ephemeral fields left blank — warned about on screen, hidden in print. */
  missingFields: string[];
}
