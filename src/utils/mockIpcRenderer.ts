// src/utils/mockIpcRenderer.ts - Version corrigée avec support du chiffrement

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
    
    'generate-attestation-pdf': async (params: any) => {
      console.log('Mock attestation PDF generation called with:', params);
      console.log('🔐 Chiffrement dans les paramètres:', params.options?.encryptionEnabled);
      
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
      
      // Implémentation pour le gestionnaire show-preview
      if (channel === 'show-preview') {
        const [htmlContent, title] = args;
        console.log(`[MOCK] Affichage de la prévisualisation avec titre: ${title}`);
        
        // Ouvrir une nouvelle fenêtre avec le contenu
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(htmlContent);
          previewWindow.document.title = title || 'Prévisualisation';
          previewWindow.document.close();
          return true;
        } else {
          console.error('[MOCK] Impossible d\'ouvrir la fenêtre de prévisualisation. Vérifiez que les popups ne sont pas bloqués.');
          return false;
        }
      }
      
      // Handle specific mock implementations
      if (channel === 'generate-transcript-pdf') {
        return await mockPdfGenerator[channel](args[0]);
      }
      
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

  // Mock pour le rendu des attestations avec support du chiffrement
  export const mockAttestationRenderer = {
    async renderHTML(params: any) {
      console.log('[MOCK] Rendering attestation HTML with params:', params);
      console.log('[MOCK] 🔐 Chiffrement activé:', params.options?.encryptionEnabled);
      
      // Essayer d'importer le générateur HTML réel si disponible
      try {
        const { generateAttestationHTML } = await import('../lib/attestation-generator/html-generator');
        const { sanitizeStudentData } = await import('../lib/helpers/qrcode');
        
        console.log('[MOCK] ✅ Utilisation du générateur HTML réel');
        
        // Sanitiser les données de l'étudiant
        const sanitizedStudent = sanitizeStudentData(params.student);
        console.log('[MOCK] 🧹 Données étudiant sanitisées');
        
        return await generateAttestationHTML(sanitizedStudent, params.settings, params.options);
      } catch (importError) {
        console.warn('[MOCK] ⚠️ Générateur HTML réel non disponible, utilisation du fallback:', importError);
        
        // Simuler un délai et retourner un HTML de base pour une attestation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Sanitiser les données dans le fallback
        const sanitizedStudent = {
          ...params.student,
          NOM: params.student.NOM || 'N/D',
          PRENOM: params.student.PRENOM || 'N/D',
          MATRICULE: params.student.MATRICULE || 'N/D',
          'DATE DE NAISSANCE': params.student['DATE DE NAISSANCE'] || 'N/D',
          'LIEU DE NAISSANCE': params.student['LIEU DE NAISSANCE'] || 'N/D',
          PARCOURS: params.student.PARCOURS || 'N/D',
          SPECIALITE: params.student.SPECIALITE || 'N/D',
          OPTION: params.student.OPTION || 'N/D',
          MOYENNE: params.student.MOYENNE || '0.00',
          GRADE: params.student.GRADE || 'N/D',
          MENTION: params.student.MENTION || 'N/D',
          'ANNEE ACADEMIQUE': params.student['ANNEE ACADEMIQUE'] || 'N/D',
          FINALITE: params.student.FINALITE || 'N/D',
          'TOTAL CREDIT': params.student['TOTAL CREDIT'] || 'N/D',
          DOMAINE: params.student.DOMAINE || 'N/D',
          ETABLISSEMENT: params.student.ETABLISSEMENT || params.settings.nameFrench || 'N/D'
        };
        
        const encryptionIndicator = params.options?.encryptionEnabled ? 
          '<div style="position: absolute; top: 10px; right: 10px; background: rgba(0,128,0,0.1); padding: 5px; border-radius: 3px; font-size: 10px; color: #006400; z-index: 1000;">🔐 QR Chiffré</div>' : 
          '<div style="position: absolute; top: 10px; right: 10px; background: rgba(128,128,128,0.1); padding: 5px; border-radius: 3px; font-size: 10px; color: #666; z-index: 1000;">📋 QR Non Chiffré</div>';
        
        // Générer un QR code factice avec indication du chiffrement
        const mockQrCode = params.options?.qrCodeImage || 
          `data:image/svg+xml;base64,${btoa(`
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#eee" stroke="#ccc"/>
              <text x="50" y="40" text-anchor="middle" font-size="8" fill="#666">QR Code</text>
              <text x="50" y="55" text-anchor="middle" font-size="6" fill="#666">${params.options?.encryptionEnabled ? '🔐 Chiffré' : '📋 Standard'}</text>
              <text x="50" y="70" text-anchor="middle" font-size="6" fill="#666">${sanitizedStudent.MATRICULE}</text>
            </svg>
          `)}`;
        
        return `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { 
                  font-family: Times New Roman; 
                  margin: 20px; 
                  position: relative; 
                  background: white;
                }
                .header { text-align: center; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #0066cc; }
                .subtitle { font-size: 18px; font-style: italic; color: #333; }
                .student-info { margin: 30px 0; }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 20px 0; 
                }
                th, td { 
                  border: 1px solid #333; 
                  padding: 8px; 
                  text-align: center; 
                  background-color: #f0f0f0;
                }
                .signatures { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-top: 50px; 
                }
                .disclaimer { 
                  position: absolute; 
                  bottom: 20px; 
                  font-size: 8px; 
                  font-style: italic; 
                  width: 90%;
                }
                .qr-code { 
                  position: absolute;
                  ${params.options?.qrCodePosition ? 
                    `left: ${params.options.qrCodePosition.x}px; top: ${params.options.qrCodePosition.y}px;` : 
                    'right: 50px; top: 250px;'}
                  width: 100px;
                  height: 100px;
                  border: 1px solid #ccc;
                }
                .encryption-indicator {
                  position: absolute;
                  top: 10px;
                  right: 10px;
                  background: rgba(0,128,0,0.1);
                  padding: 5px;
                  border-radius: 3px;
                  font-size: 10px;
                  color: #006400;
                  z-index: 1000;
                }
                .debug-info {
                  position: fixed;
                  bottom: 10px;
                  left: 10px;
                  background: rgba(0,0,0,0.8);
                  color: white;
                  padding: 8px;
                  font-size: 10px;
                  border-radius: 4px;
                  z-index: 9999;
                  max-width: 300px;
                }
              </style>
            </head>
            <body>
              ${encryptionIndicator}
              
              <div class="header">
                <div class="title">Attestation de Réussite</div>
                <div class="subtitle">Attestation of Completion of Studies</div>
                <p>Ref N° ............./24/UDo/FMSP/VDRC/${params.settings.nameAbreviation || 'INSTITUTION'}</p>
              </div>
              
              <div class="student-info">
                <p><strong>Nom:</strong> ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM}</p>
                <p><strong>Matricule:</strong> ${sanitizedStudent.MATRICULE}</p>
                <p><strong>Date de naissance:</strong> ${sanitizedStudent["DATE DE NAISSANCE"]}</p>
                <p><strong>Lieu de naissance:</strong> ${sanitizedStudent["LIEU DE NAISSANCE"]}</p>
                <p><strong>Établissement:</strong> ${sanitizedStudent.ETABLISSEMENT}</p>
              </div>
              
              <table>
                <tr>
                  <th>Domaine</th>
                  <th>Parcours</th>
                  <th>Spécialité</th>
                  <th>Option</th>
                </tr>
                <tr>
                  <td>${sanitizedStudent.DOMAINE}</td>
                  <td>${sanitizedStudent.PARCOURS}</td>
                  <td>${sanitizedStudent.SPECIALITE}</td>
                  <td>${sanitizedStudent.OPTION}</td>
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
                  <td>${sanitizedStudent["TOTAL CREDIT"]}</td>
                  <td>${typeof sanitizedStudent.MOYENNE === 'number' ? 
                        sanitizedStudent.MOYENNE.toFixed(2) : sanitizedStudent.MOYENNE}</td>
                  <td>${sanitizedStudent.MENTION} ${sanitizedStudent.GRADE}</td>
                  <td>${sanitizedStudent["ANNEE ACADEMIQUE"]}</td>
                  <td>${sanitizedStudent.FINALITE}</td>
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
              
              <div class="qr-code">
                <img src="${mockQrCode}" width="100" height="100" alt="QR Code ${params.options?.encryptionEnabled ? '(Chiffré)' : '(Standard)'}">
              </div>
              
              <div class="disclaimer">
                Cette Attestation ne tient pas lieu de Diplôme et n'est délivrée qu'en un seul exemplaire et d'une validité de (6) mois 
                à partir de la date de signature. Le Diplôme lui sera délivré ultérieurement.
                ${params.options?.encryptionEnabled ? '<br><strong>🔐 QR Code sécurisé avec chiffrement pour vérification mobile.</strong>' : '<br><strong>📋 QR Code standard (non chiffré).</strong>'}
              </div>
              
              <div class="debug-info">
                🔧 DEBUG MODE<br>
                🔐 Chiffrement: ${params.options?.encryptionEnabled ? 'Activé' : 'Désactivé'}<br>
                📊 Étudiant: ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM}<br>
                🏢 Établissement: ${sanitizedStudent.ETABLISSEMENT}<br>
                📋 Type: Attestation (Mock)<br>
                🎯 Données sanitisées: ${Object.keys(sanitizedStudent).filter(k => sanitizedStudent[k] !== 'N/D').length}/${Object.keys(sanitizedStudent).length}
              </div>
            </body>
          </html>
        `;
      }
    }
  };
  
  // Initialize the global objects if not already defined (for development environment)
  export function initMockIpc() {
    if (typeof window !== 'undefined') {
      if (!window.ipcRenderer) {
        console.log('[MOCK] 🔧 Initializing mock IPC renderer');
        window.ipcRenderer = mockIpcRenderer;
      }
      
      if (!window.fs) {
        console.log('[MOCK] 📁 Initializing mock fs');
        window.fs = mockFs;
      }
      
      if (!window.transcriptRenderer) {
        console.log('[MOCK] 📄 Initializing mock transcript renderer');
        window.transcriptRenderer = mockTranscriptRenderer;
      }
      
      if (!window.attestationRenderer) {
        console.log('[MOCK] 🎓 Initializing mock attestation renderer with encryption support');
        window.attestationRenderer = mockAttestationRenderer;
      }
      
      // Fonction d'initialisation globale pour faciliter le débogage
      window.initMockIpc = initMockIpc;
      
      console.log('[MOCK] ✅ Mock IPC system initialized with full encryption support and data sanitization');
    }
  }