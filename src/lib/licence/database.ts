import CryptoJS from "crypto-js";

const SECRET_KEY = "my-secret-key"; // Clé secrète (remplacez par une clé sécurisée en production)

// Chiffrement
export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

// Déchiffrement
export const decrypt = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const LicenseDB = {
  async save(licenseKey: string): Promise<void> {
    const encryptedLicense = encrypt(licenseKey);
    localStorage.setItem("license", encryptedLicense);
  },
  async get(): Promise<string | null> {
    const encryptedLicense = localStorage.getItem("license");
    return encryptedLicense ? decrypt(encryptedLicense) : null;
  },
  async delete(): Promise<void> {
    localStorage.removeItem("license");
  },
};

export default LicenseDB;
