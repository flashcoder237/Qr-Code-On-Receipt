// src/utils/mockIpcRenderer.ts - Mise à jour pour ajouter le support des attestations
// This file provides a mock implementation of the IPC renderer for development

class MockInvocationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'MockInvocationError';
    }
  }
  
  // Create mock implementations of PDF generation functionality
  const mockPdfGenerator = {
    'generate-transcript-pdf': async (params: any) => {
      console.log('Mock transcript PDF generation called with:', params);
      
      // Simulate PDF generation with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock PDF data (as Uint8Array)
      const mockPdfData = new Uint8Array(1000).fill(0xFF);
      return mockPdfData;
    },
    
    // Ajout du support pour la génération d'attestations
    'generate-attestation-pdf': async (params: any) => {
      console.log('Mock attestation PDF generation called with:', params);
      
      // Simulate PDF generation with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock PDF data (as Uint8Array)
      const mockPdfData = new Uint8Array(1000).fill(0xFF);
      return mockPdfData;
    }
  };
  
  // Create a mock ipcRenderer for development/testing
  export const mockIpcRenderer = {
    on(channel: string, listener: (...args: any[]) => void) {
      console.log(`[MOCK] Registering listener for channel: ${channel}`);
      // In a real implementation, we would store the listener
      return () => {
        console.log(`[MOCK] Removing listener for channel: ${channel}`);
      };
    },
    
    once(channel: string, listener: (...args: any[]) => void) {
      console.log(`[MOCK] Registering one-time listener for channel: ${channel}`);
    },
    
    off(channel: string, listener?: (...args: any[]) => void) {
      console.log(`[MOCK] Removing ${listener ? 'specific' : 'all'} listeners for channel: ${channel}`);
    },
    
    send(channel: string, ...args: any[]) {
      console.log(`[MOCK] Sending to channel: ${channel}`, args);
    },
    
    async invoke(channel: string, ...args: any[]) {
      console.log(`[MOCK] Invoking channel: ${channel}`, args);
      
      // Simulate a delay to mimic async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Handle specific mock implementations
      if (channel === 'generate-transcript-pdf') {
        return await mockPdfGenerator[channel](args[0]);
      }
      
      // Ajout du support pour les attestations
      if (channel === 'generate-attestation-pdf') {
        return await mockPdfGenerator[channel](args[0]);
      }
      
      if (channel === 'render-attestation-html') {
        return await mockAttestationRenderer.renderHTML(args[0]);
      }
      
      if (channel === 'fs:readFile') {
        const [filePath, options] = args;
        console.log(`[MOCK] Reading file: ${filePath}`, options);
        return new Uint8Array(100);
      }
      
      // Default behavior for unhandled channels
      console.warn(`[MOCK] No mock implementation for channel: ${channel}`);
      throw new MockInvocationError(`No mock implementation for channel: ${channel}`);
    }
  };
  
  // Create a mock fs for development/testing
  export const mockFs = {
    async readFile(filePath: string, options?: { encoding?: string }) {
      console.log(`[MOCK] Reading file: ${filePath}`, options);
      
      if (options?.encoding === 'utf8') {
        return 'Mock file content';
      }
      
      return new Uint8Array(100);
    }
  };
  
  // Initialize the global objects if not already defined (for development environment)
  export function initMockIpc() {
    if (typeof window !== 'undefined') {
      if (!window.ipcRenderer) {
        console.log('[MOCK] Initializing mock IPC renderer');
        window.ipcRenderer = mockIpcRenderer;
      }
      
      if (!window.fs) {
        console.log('[MOCK] Initializing mock fs');
        window.fs = mockFs;
      }
      
      if (!window.transcriptRenderer) {
        console.log('[MOCK] Initializing mock transcript renderer');
        window.transcriptRenderer = mockTranscriptRenderer;
      }
    }
  }

  export const mockTranscriptRenderer = {
    async renderHTML(params: any) {
      console.log('[MOCK] Rendering HTML with params:', params);
      
      // Simuler un délai et retourner un HTML de base
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .student-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relevé de Notes</h1>
              <p>Université de Douala</p>
            </div>
            <div class="student-info">
              <p><strong>Nom:</strong> ${params.student.NOM}</p>
              <p><strong>Prénom:</strong> ${params.student.PRENOM}</p>
              <p><strong>Matricule:</strong> ${params.student.MATRICULE}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Unité d'Enseignement</th>
                  <th>Note</th>
                  <th>Crédit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>UE1</td>
                  <td>Exemple d'UE</td>
                  <td>15/20</td>
                  <td>5</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;
    }
  };

  // Ajout d'un mock pour le rendu des attestations
  export const mockAttestationRenderer = {
    async renderHTML(params: any) {
      console.log('[MOCK] Rendering attestation HTML with params:', params);
      
      // Simuler un délai et retourner un HTML de base pour une attestation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Times New Roman; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
              .subtitle { font-size: 18px; font-style: italic; }
              .student-info { margin: 30px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #333; padding: 8px; text-align: center; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
              .disclaimer { position: absolute; bottom: 20px; font-size: 8px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Attestation de Réussite</div>
              <div class="subtitle">Attestation of Completion of Studies</div>
              <p>Ref N° ............./24/UDo/FMSP/VDRC/${params.settings.nameAbreviation}</p>
            </div>
            
            <div class="student-info">
              <p><strong>Nom:</strong> ${params.student.NOM} ${params.student.PRENOM}</p>
              <p><strong>Matricule:</strong> ${params.student.MATRICULE}</p>
              <p><strong>Date de naissance:</strong> ${params.student["DATE DE NAISSANCE"]}</p>
              <p><strong>Lieu de naissance:</strong> ${params.student["LIEU DE NAISSANCE"]}</p>
            </div>
            
            <table>
              <tr>
                <th>Domaine</th>
                <th>Parcours</th>
                <th>Spécialité</th>
                <th>Option</th>
              </tr>
              <tr>
                <td>SCIENCES MEDICO-SANITAIRES</td>
                <td>${params.student.PARCOURS || "SCIENCES INFIRMIERES"}</td>
                <td>${params.student.SPECIALITE || "SCIENCES INFIRMIERES"}</td>
                <td>${params.student.OPTION || "SCIENCES INFIRMIERES"}</td>
              </tr>
            </table>
            
            <table>
              <tr>
                <th>Total de crédits</th>
                <th>Moyenne</th>
                <th>Mention</th>
                <th>Année académique</th>
                <th>Finalité/Voie</th>
              </tr>
              <tr>
                <td>60</td>
                <td>${typeof params.student.MOYENNE === 'number' ? 
                      params.student.MOYENNE.toFixed(2) : params.student.MOYENNE}</td>
                <td>${params.student.MENTION || "Bien"} ${params.student.GRADE || "B+"}</td>
                <td>${params.student["ANNEE ACADEMIQUE"] || "2023/2024"}</td>
                <td>LICENCE PROFESSIONNELLE</td>
              </tr>
            </table>
            
            <div class="signatures">
              <div>
                <p>Le Directeur de L'Institut</p>
                <p>The Director of the Institute</p>
              </div>
              <div>
                <p>Douala, le</p>
                <p>Le Recteur de l'Université de Douala</p>
                <p>The Rector of the University of Douala</p>
              </div>
            </div>
            
            <div class="disclaimer">
              Cette Attestation ne tient pas lieu de Diplôme et n'est délivrée qu'en un seul exemplaire et d'une validité de (6) mois 
              à partir de la date de signature. Le Diplôme lui sera délivré ultérieurement.
              Only one copy of this Attestation shall be delivered and is not a certificate. 
              This Attestation is valid for (6) six months from the date of signature. The Certificate will be issued at a later date.
            </div>
          </body>
        </html>
      `;
    }
  };