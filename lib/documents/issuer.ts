import { siteConfig } from "../site-data";

export interface Issuer {
  businessNameKo: string;
  businessNameEn: string;
  /** 사업자등록번호 */
  registrationNumber: string;
  representativeKo: string;
  representativeEn: string;
  addressKo: string;
  addressEn: string;
  phone: string;
  email: string;
  /** Path under /public, e.g. "/images/documents/stamp.png". null = no stamp image. */
  stampImagePath: string | null;
}

// PLACEHOLDERS — the owner must replace the marked values with the real
// business registration details before any document is issued to a guest.
// Everything here is public-facing document content; nothing is secret.
export const ISSUER: Issuer = {
  businessNameKo: "스타고시원", // TODO(owner): confirm registered Korean business name
  businessNameEn: siteConfig.name,
  registrationNumber: "000-00-00000", // TODO(owner): real 사업자등록번호
  representativeKo: "홍길동", // TODO(owner): real 대표자명 (Korean)
  representativeEn: "Hong Gil-dong", // TODO(owner): real representative name (romanized)
  addressKo: "서울특별시 동작구 만양로12가길 64", // TODO(owner): confirm Korean address
  addressEn: siteConfig.address,
  phone: siteConfig.phone,
  email: siteConfig.email,
  stampImagePath: null, // TODO(owner): add 직인 image to /public and set the path
};
