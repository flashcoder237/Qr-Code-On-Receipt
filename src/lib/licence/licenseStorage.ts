import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

const licenseFilePath = path.join(app.getPath('userData'), 'license.json');

export const LicenseStorage = {
  async save(licenseKey: string) {
    const data = JSON.stringify({ license_key: licenseKey });
    await fs.writeFile(licenseFilePath, data);
  },

  async get() {
    try {
      const data = await fs.readFile(licenseFilePath, 'utf-8');
      const { license_key } = JSON.parse(data);
      return license_key;
    } catch (error) {
      console.error('Error reading license file:', error);
      return null;
    }
  },

  async delete() {
    try {
      await fs.unlink(licenseFilePath);
    } catch (error) {
      console.error('Error deleting license file:', error);
    }
  }
};
