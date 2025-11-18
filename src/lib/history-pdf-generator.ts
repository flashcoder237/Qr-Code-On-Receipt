// src/lib/history-pdf-generator.ts
import type { DocumentRecord } from '@/components/organisms/document-history/DocumentHistoryManager';

interface HistoryPDFOptions {
  records: DocumentRecord[];
  filterType?: 'releve' | 'attestation';
  startDate?: Date;
  endDate?: Date;
  studentName?: string;
  filterStatus?: 'generated' | 'downloaded' | 'printed';
  filterAcademicYear?: string;
}

/**
 * Génère un PDF de l'historique des documents
 */
export async function generateHistoryPDF(options: HistoryPDFOptions): Promise<Blob> {
  const { records, filterType, startDate, endDate, studentName, filterStatus, filterAcademicYear } = options;

  // Les records sont déjà filtrés par le composant, on les trie juste
  const filteredRecords = [...records];

  // Trier par date (plus récent en premier)
  filteredRecords.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );

  // Générer le HTML avec tous les filtres
  const html = generateHistoryHTML(filteredRecords, {
    filterType,
    startDate,
    endDate,
    studentName,
    filterStatus,
    filterAcademicYear
  });

  // Convertir en PDF via Electron
  if (window.electron?.renderHistoryPDF) {
    const pdfBuffer = await window.electron.renderHistoryPDF(html);
    // Convertir le buffer en Uint8Array si nécessaire
    const uint8Array = new Uint8Array(pdfBuffer);
    return new Blob([uint8Array], { type: 'application/pdf' });
  }

  throw new Error('La génération de PDF n\'est pas disponible');
}

function generateHistoryHTML(
  records: DocumentRecord[],
  filters: {
    filterType?: 'releve' | 'attestation';
    startDate?: Date;
    endDate?: Date;
    studentName?: string;
    filterStatus?: 'generated' | 'downloaded' | 'printed';
    filterAcademicYear?: string;
  }
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Statistiques
  const totalDocs = records.length;
  const releves = records.filter(r => r.type === 'releve').length;
  const attestations = records.filter(r => r.type === 'attestation').length;
  const printed = records.filter(r => r.status === 'printed').length;
  const downloaded = records.filter(r => r.status === 'downloaded').length;

  // Générer les lignes du tableau
  const tableRows = records
    .map(
      (record, index) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px; text-align: center;">${index + 1}</td>
        <td style="padding: 8px;">
          ${new Date(record.generatedAt).toLocaleDateString('fr-FR')}
          <br/>
          <span style="font-size: 11px; color: #666;">
            ${new Date(record.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </td>
        <td style="padding: 8px;">
          <span style="
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            background-color: ${record.type === 'releve' ? '#dbeafe' : '#fef3c7'};
            color: ${record.type === 'releve' ? '#1e40af' : '#92400e'};
          ">
            ${record.type === 'releve' ? 'Relevé' : 'Attestation'}
          </span>
        </td>
        <td style="padding: 8px;">
          <strong>${record.studentName}</strong>
          <br/>
          <span style="font-size: 11px; color: #666;">${record.studentMatricule}</span>
        </td>
        <td style="padding: 8px; text-align: center;">${record.academicYear}</td>
        <td style="padding: 8px; text-align: center;">
          ${record.level || '-'}
          ${record.semester ? `<br/><span style="font-size: 11px; color: #666;">S${record.semester}</span>` : ''}
        </td>
        <td style="padding: 8px; text-align: center;">
          ${record.average !== undefined ? `${record.average.toFixed(2)}` : '-'}
          ${record.grade ? `<br/><span style="font-size: 11px; color: #666;">${record.grade}</span>` : ''}
        </td>
        <td style="padding: 8px;">
          <span style="
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            background-color: ${
              record.status === 'printed' ? '#dcfce7' :
              record.status === 'downloaded' ? '#e0e7ff' :
              '#f3f4f6'
            };
            color: ${
              record.status === 'printed' ? '#166534' :
              record.status === 'downloaded' ? '#3730a3' :
              '#374151'
            };
          ">
            ${
              record.status === 'printed' ? 'Imprimé' :
              record.status === 'downloaded' ? 'Téléchargé' :
              'Généré'
            }
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Historique des Documents</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
    }

    .header h1 {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 10px;
    }

    .header .subtitle {
      font-size: 14px;
      color: #666;
    }

    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 8px;
      font-size: 12px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .stat-card {
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }

    .stat-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }

    .stat-card .label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
    }

    .filters {
      margin-bottom: 20px;
      padding: 10px;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      font-size: 12px;
    }

    .filters strong {
      color: #92400e;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 13px;
    }

    thead {
      background-color: #1e40af;
      color: white;
    }

    thead th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }

    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }

    tbody tr:hover {
      background-color: #f3f4f6;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state h2 {
      font-size: 18px;
      margin-bottom: 10px;
      color: #374151;
    }

    @media print {
      body {
        padding: 20px;
      }

      .stat-card {
        break-inside: avoid;
      }

      table {
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      thead {
        display: table-header-group;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>HISTORIQUE DES DOCUMENTS</h1>
    <p class="subtitle">Rapport d'impression des relevés et attestations</p>
  </div>

  <div class="meta-info">
    <div>
      <strong>Date d'impression :</strong> ${dateStr} à ${timeStr}
    </div>
    <div>
      <strong>Total de documents :</strong> ${totalDocs}
    </div>
  </div>

  ${
    filters.filterType || filters.startDate || filters.endDate || filters.studentName || filters.filterStatus || filters.filterAcademicYear
      ? `
  <div class="filters">
    <strong>Filtres appliqués :</strong>
    <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
      ${filters.filterType ? `<div>📄 <strong>Type de document :</strong> ${filters.filterType === 'releve' ? 'Relevés de notes' : 'Attestations'}</div>` : ''}
      ${filters.filterStatus ? `<div>📊 <strong>Statut :</strong> ${
        filters.filterStatus === 'printed' ? 'Imprimés' :
        filters.filterStatus === 'downloaded' ? 'Téléchargés' :
        'Générés'
      }</div>` : ''}
      ${filters.filterAcademicYear ? `<div>📅 <strong>Année académique :</strong> ${filters.filterAcademicYear}</div>` : ''}
      ${filters.studentName ? `<div>👤 <strong>Recherche étudiant :</strong> ${filters.studentName}</div>` : ''}
      ${filters.startDate ? `<div>📅 <strong>Date de début :</strong> ${filters.startDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}</div>` : ''}
      ${filters.endDate ? `<div>📅 <strong>Date de fin :</strong> ${filters.endDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}</div>` : ''}
    </div>
  </div>
  `
      : '<div class="filters" style="background-color: #dbeafe; border-left-color: #3b82f6;"><strong>ℹ️ Aucun filtre appliqué</strong> - Affichage de tous les documents</div>'
  }

  <div class="stats">
    <div class="stat-card">
      <div class="value">${totalDocs}</div>
      <div class="label">Total</div>
    </div>
    <div class="stat-card">
      <div class="value">${releves}</div>
      <div class="label">Relevés</div>
    </div>
    <div class="stat-card">
      <div class="value">${attestations}</div>
      <div class="label">Attestations</div>
    </div>
    <div class="stat-card">
      <div class="value">${printed}</div>
      <div class="label">Imprimés</div>
    </div>
    <div class="stat-card">
      <div class="value">${downloaded}</div>
      <div class="label">Téléchargés</div>
    </div>
  </div>

  ${
    records.length === 0
      ? `
  <div class="empty-state">
    <h2>Aucun document trouvé</h2>
    <p>L'historique est vide ou aucun document ne correspond aux filtres appliqués.</p>
  </div>
  `
      : `
  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th style="width: 100px;">Date</th>
        <th style="width: 80px;">Type</th>
        <th>Étudiant</th>
        <th style="width: 80px; text-align: center;">Année</th>
        <th style="width: 80px; text-align: center;">Niveau</th>
        <th style="width: 80px; text-align: center;">Moyenne</th>
        <th style="width: 90px;">Statut</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  `
  }

  <div class="footer">
    <p>Document généré automatiquement le ${dateStr} à ${timeStr}</p>
    <p>Historique des documents imprimés - Tous droits réservés</p>
  </div>
</body>
</html>
  `.trim();
}
