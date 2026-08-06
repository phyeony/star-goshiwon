export type DocumentType = "letter" | "contract" | "receipt";

/** A language a document is actually written in. */
export type BaseLang = "ko" | "en";

/**
 * "bi" renders Korean and English together on one page (영문병기). That is how
 * the official 거주숙소제공확인서 is distributed and what 출입국 officers see
 * most often, so it is the variant to reach for when a guest is filing. It is
 * composed from the ko and en documents rather than written separately, so the
 * two can never drift apart. Only the immigration documents (letter, receipt)
 * offer it; the contract stays single-language.
 */
export type DocumentLang = BaseLang | "bi";

/**
 * Guest legal data typed by the admin. EPHEMERAL BY DESIGN — React state,
 * sessionStorage draft, and the send request body only. Never persisted.
 */
export interface GuestDocumentForm {
  passportNumber: string;
  nationality: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  /**
   * Optional 외국인등록번호. Only guests who already hold an ARC and are filing
   * a 체류지 변경신고 have one; first-time registrants leave it blank.
   */
  alienRegistrationNumber: string;
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
  alienRegistrationNumber: "",
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
