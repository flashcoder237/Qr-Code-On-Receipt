import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeSettingsPayload } from "@/lib/form-schemas/theme-settings";

interface ThemePreviewProps {
  theme: ThemeSettingsPayload;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-lg border" style={{
          width: "100%", 
          height: "200px", 
          borderColor: theme.primaryColor,
          borderWidth: `${theme.borderWidth}px`,
          borderStyle: theme.borderStyle,
        }}>
          {/* En-tête */}
          <div style={{ 
            backgroundColor: "white", 
            padding: "10px",
            fontFamily: theme.headerFont, 
            fontSize: `${theme.headerFontSize / 2}px`,
            borderBottom: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
            color: theme.primaryColor,
            textAlign: "center"
          }}>
            <h3 style={{ 
              fontSize: `${theme.titleFontSize / 2}px`, 
              fontWeight: "bold",
              marginBottom: "5px",
              color: theme.accentColor,
            }}>
              RELEVE DE NOTES / TRANSCRIPT
            </h3>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              fontSize: `${theme.headerFontSize / 2 - 1}px`,
            }}>
              <span>Université de Douala</span>
              <span>Ref: 25/UDO/FMSP/XXX</span>
            </div>
          </div>
          
          {/* Corps */}
          <div style={{
            padding: "5px 10px",
            fontFamily: theme.mainFont,
            fontSize: `${theme.contentFontSize / 2}px`,
            color: theme.primaryColor,
          }}>
            {/* Information étudiant */}
            <div style={{
              display: theme.studentInfoLayout === 'grille' ? 'grid' : 
                        theme.studentInfoLayout === 'colonnes' ? 'flex' : 'block',
              gridTemplateColumns: theme.studentInfoLayout === 'grille' ? '1fr 1fr' : 'auto',
              flexDirection: theme.studentInfoLayout === 'colonnes' ? 'column' : 'row',
              gap: "5px",
              marginBottom: "5px",
            }}>
              <div><strong>NOM:</strong> EXEMPLE Jean</div>
              <div><strong>MATRICULE:</strong> 12345</div>
            </div>
            
            {/* Tableau */}
            <div style={{
              width: "100%",
              overflowX: "auto",
            }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: `${theme.contentFontSize / 2 - 1}px`,
              }}>
                <thead>
                  <tr>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontSize: `${theme.contentFontSize / 2 - 1}px`,
                      fontWeight: theme.tableHeaderFontWeight || 600,
                    }}>
                      CODE
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontSize: `${theme.contentFontSize / 2 - 1}px`,
                      fontWeight: theme.tableHeaderFontWeight || 600,
                    }}>
                      UE
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontSize: `${theme.contentFontSize / 2 - 1}px`,
                      fontWeight: theme.tableHeaderFontWeight || 600,
                    }}>
                      EC
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontSize: `${theme.contentFontSize / 2 - 1}px`,
                      fontWeight: theme.tableHeaderFontWeight || 600,
                    }}>
                      COEF
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontSize: `${theme.contentFontSize / 2 - 1}px`,
                      fontWeight: theme.tableHeaderFontWeight || 600,
                    }}>
                      NOTE
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontSize: `${theme.contentFontSize / 2 - 1}px`,
                      fontWeight: theme.tableHeaderFontWeight || 600,
                    }}>
                      MOY
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontSize: `${theme.contentFontSize / 2 - 1}px`,
                      fontWeight: theme.tableHeaderFontWeight || 600,
                    }}>
                      CREDIT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Première UE avec 2 ECs */}
                  <tr style={{
                    backgroundColor: theme.highlightValidatedUE ? 'rgba(0, 128, 0, 0.1)' : 'transparent',
                  }}>
                    <td rowSpan={2} style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}>
                      INF101
                    </td>
                    <td rowSpan={2} style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      fontWeight: "bold",
                    }}>
                      Programmation
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                    }}>
                      Cours
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                    }}>
                      2
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                    }}>
                      14
                    </td>
                    <td rowSpan={2} style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}>
                      13
                    </td>
                    <td rowSpan={2} style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}>
                      5
                    </td>
                  </tr>
                  <tr style={{
                    backgroundColor: theme.highlightValidatedUE ? 'rgba(0, 128, 0, 0.1)' : 'transparent',
                  }}>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                    }}>
                      TP
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                    }}>
                      1
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                    }}>
                      12
                    </td>
                  </tr>

                  {/* Deuxième UE avec 1 EC */}
                  <tr>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}>
                      MAT102
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      fontWeight: "bold",
                    }}>
                      Mathématiques
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                    }}>
                      Cours
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                    }}>
                      1
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                    }}>
                      11
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}>
                      11
                    </td>
                    <td style={{
                      border: `1px ${theme.borderStyle} ${theme.tableBorderColor}`,
                      padding: `${theme.tableCellPadding / 2}px`,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}>
                      4
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Résultat */}
            <div style={{
              marginTop: "5px",
              padding: "2px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: `${theme.contentFontSize / 2}px`, fontWeight: "bold" }}>
                <span style={{ color: theme.accentColor }}>MOYENNE: 12/20</span>
              </span>
              <div style={{
                display: theme.showQRCode ? "block" : "none",
                width: "30px",
                height: "30px",
                border: `1px solid ${theme.tableBorderColor}`,
                backgroundColor: "#eee",
              }}></div>
            </div>
          </div>
          
          {/* Filigrane */}
          {theme.showWatermark && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: theme.watermarkOpacity,
              pointerEvents: "none",
              fontSize: "40px",
              fontWeight: "bold",
              color: theme.primaryColor,
            }}>
              EXEMPLE
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemePreview;