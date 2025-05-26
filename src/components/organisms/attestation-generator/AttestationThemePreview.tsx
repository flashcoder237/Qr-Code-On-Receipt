// src/components/organisms/attestation-generator/AttestationThemePreview.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AttestationThemeSettingsPayload } from "@/lib/form-schemas/attestation-theme-settings";

interface AttestationThemePreviewProps {
  theme: AttestationThemeSettingsPayload;
}

export const AttestationThemePreview: React.FC<AttestationThemePreviewProps> = ({ theme }) => {
  const getQRCodeSize = () => {
    switch (theme.qrCodeSize) {
      case "small": return "20px";
      case "large": return "40px";
      default: return "30px";
    }
  };

  const getLogoSize = () => {
    switch (theme.logoSize) {
      case "small": return { width: "25px", height: "25px" };
      case "large": return { width: "45px", height: "45px" };
      default: return { width: "35px", height: "35px" };
    }
  };

  const getBorderStyle = () => {
    if (theme.borderStyle === "none") return "none";
    return `${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor}`;
  };

  const getSignatureStyle = () => {
    const baseStyle = {
      fontSize: `${theme.contentFontSize / 3}px`,
      color: theme.primaryColor,
      padding: "2px 4px",
    };

    switch (theme.signatureStyle) {
      case "boxed":
        return {
          ...baseStyle,
          border: `1px solid ${theme.primaryColor}`,
          borderRadius: "2px",
        };
      case "underlined":
        return {
          ...baseStyle,
          borderBottom: `2px solid ${theme.primaryColor}`,
        };
      case "modern":
        return {
          ...baseStyle,
          backgroundColor: theme.tableHeaderBgColor,
          borderRadius: "4px",
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div 
          className="relative overflow-hidden rounded-lg"
          style={{
            width: "100%", 
            height: "300px", 
            border: getBorderStyle(),
            fontFamily: theme.mainFont,
            fontSize: `${theme.contentFontSize / 2.5}px`,
            color: theme.primaryColor,
            backgroundColor: "white",
            padding: `${theme.documentPadding / 4}px`,
          }}
        >
          {/* Filigrane */}
          {theme.showWatermark && (
            <div style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: theme.watermarkOpacity,
              pointerEvents: "none",
              fontSize: "24px",
              fontWeight: "bold",
              color: theme.secondaryColor,
              zIndex: 0,
            }}>
              EXEMPLE
            </div>
          )}

          {/* En-tête avec logos */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            fontSize: `${theme.headerFontSize / 2}px`,
            fontFamily: theme.headerFont,
          }}>
            <div style={{ width: "30%", fontSize: "6px", lineHeight: "1.2" }}>
              <strong>RÉPUBLIQUE DU CAMEROUN</strong><br/>
              <em>Paix - Travail - Patrie</em><br/>
              UNIVERSITÉ DE DOUALA
            </div>
            
            {theme.logoPosition === "header" && (
              <div style={{ 
                display: "flex", 
                gap: "4px", 
                alignItems: "center",
                justifyContent: "center",
                width: "40%"
              }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      ...getLogoSize(),
                      backgroundColor: "#eee",
                      border: `1px solid ${theme.tableBorderColor}`,
                      borderRadius: "2px",
                    }}
                  />
                ))}
              </div>
            )}
            
            <div style={{ width: "30%", fontSize: "6px", lineHeight: "1.2", textAlign: "right" }}>
              <strong>REPUBLIC OF CAMEROON</strong><br/>
              <em>Peace - Work - Fatherland</em><br/>
              UNIVERSITY OF DOUALA
            </div>
          </div>

          {/* Titre */}
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <h1 style={{
              fontSize: `${theme.titleFontSize / 2.5}px`,
              fontWeight: "bold",
              color: theme.accentColor,
              margin: "4px 0",
              fontFamily: theme.headerFont,
            }}>
              {theme.customTitle || "ATTESTATION DE REUSSITE"}
            </h1>
            {theme.showBilingualText && (
              <h2 style={{
                fontSize: `${theme.subtitleFontSize / 2.5}px`,
                fontStyle: "italic",
                color: theme.secondaryColor,
                margin: "2px 0",
              }}>
                {theme.customSubtitle || "ATTESTATION OF COMPLETION OF STUDIES"}
              </h2>
            )}
            <p style={{ fontSize: "8px", margin: "4px 0" }}>
              <strong>Ref N°.../24/UDo/FMSP/VDRC/IUB-SIGMEN</strong>
            </p>
          </div>

          {/* Contenu */}
          <div style={{ marginBottom: "8px", fontSize: `${theme.contentFontSize / 2.5}px` }}>
            <p><strong>M./Mme/Mlle EXEMPLE Jean</strong></p>
            <p>Né(e) le: <strong>01/01/2000</strong> à <strong>Douala</strong></p>
            <p>Matricule: <strong>12345</strong></p>
          </div>

          {/* Tableau académique */}
          {theme.showDomainTable && (
            <div style={{ marginBottom: "8px" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: `${theme.contentFontSize / 3}px`,
                marginBottom: "4px",
              }}>
                <thead>
                  <tr>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: getBorderStyle(),
                      padding: `${theme.tableCellPadding / 4}px`,
                      textAlign: "center",
                      fontSize: "6px",
                    }}>
                      Domaine
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: getBorderStyle(),
                      padding: `${theme.tableCellPadding / 4}px`,
                      textAlign: "center",
                      fontSize: "6px",
                    }}>
                      Parcours
                    </th>
                    <th style={{
                      backgroundColor: theme.tableHeaderBgColor,
                      border: getBorderStyle(),
                      padding: `${theme.tableCellPadding / 4}px`,
                      textAlign: "center",
                      fontSize: "6px",
                    }}>
                      Spécialité
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{
                      border: getBorderStyle(),
                      padding: `${theme.tableCellPadding / 4}px`,
                      textAlign: "center",
                      fontSize: "6px",
                    }}>
                      SCIENCES MEDICO-SANITAIRES
                    </td>
                    <td style={{
                      border: getBorderStyle(),
                      padding: `${theme.tableCellPadding / 4}px`,
                      textAlign: "center",
                      fontSize: "6px",
                    }}>
                      SCIENCES INFIRMIÈRES
                    </td>
                    <td style={{
                      border: getBorderStyle(),
                      padding: `${theme.tableCellPadding / 4}px`,
                      textAlign: "center",
                      fontSize: "6px",
                    }}>
                      SOINS INFIRMIERS
                    </td>
                  </tr>
                </tbody>
              </table>

              {theme.showAcademicDetails && (
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: `${theme.contentFontSize / 3}px`,
                  marginBottom: "4px",
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        backgroundColor: theme.tableHeaderBgColor,
                        border: getBorderStyle(),
                        padding: `${theme.tableCellPadding / 4}px`,
                        textAlign: "center",
                        fontSize: "6px",
                      }}>
                        Crédits
                      </th>
                      <th style={{
                        backgroundColor: theme.tableHeaderBgColor,
                        border: getBorderStyle(),
                        padding: `${theme.tableCellPadding / 4}px`,
                        textAlign: "center",
                        fontSize: "6px",
                      }}>
                        Moyenne
                      </th>
                      <th style={{
                        backgroundColor: theme.tableHeaderBgColor,
                        border: getBorderStyle(),
                        padding: `${theme.tableCellPadding / 4}px`,
                        textAlign: "center",
                        fontSize: "6px",
                      }}>
                        Mention
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{
                        border: getBorderStyle(),
                        padding: `${theme.tableCellPadding / 4}px`,
                        textAlign: "center",
                        fontSize: "6px",
                        fontWeight: "bold",
                      }}>
                        60
                      </td>
                      <td style={{
                        border: getBorderStyle(),
                        padding: `${theme.tableCellPadding / 4}px`,
                        textAlign: "center",
                        fontSize: "6px",
                        fontWeight: "bold",
                        color: theme.accentColor,
                      }}>
                        14.5/20
                      </td>
                      <td style={{
                        border: getBorderStyle(),
                        padding: `${theme.tableCellPadding / 4}px`,
                        textAlign: "center",
                        fontSize: "6px",
                        fontWeight: "bold",
                      }}>
                        Bien B+
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Signatures */}
          <div style={{
            display: theme.signatureLayout === "side-by-side" ? "flex" : "block",
            justifyContent: theme.signatureLayout === "side-by-side" ? "space-between" : "center",
            alignItems: theme.signatureLayout === "side-by-side" ? "flex-start" : "center",
            marginTop: "8px",
            gap: theme.signatureLayout === "side-by-side" ? "8px" : "4px",
          }}>
            <div style={getSignatureStyle()}>
              Le Directeur de l'IUB-SIGMEN
            </div>
            
            {theme.showQRCode && (
              <div style={{
                width: getQRCodeSize(),
                height: getQRCodeSize(),
                backgroundColor: "#eee",
                border: `1px solid ${theme.tableBorderColor}`,
                display: theme.qrCodePosition === "bottom-center" || theme.signatureLayout !== "side-by-side" ? "block" : "inline-block",
                margin: theme.signatureLayout === "side-by-side" ? "0" : "4px auto",
              }}></div>
            )}
            
            <div style={getSignatureStyle()}>
              Le Recteur UDo
            </div>
          </div>

          {/* Pied de page personnalisé */}
          {theme.customFooterText && (
            <div style={{
              position: "absolute",
              bottom: "4px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: `${theme.footerFontSize / 2}px`,
              textAlign: "center",
              color: theme.secondaryColor,
              fontStyle: "italic",
              width: "90%",
            }}>
              {theme.customFooterText}
            </div>
          )}

          {/* Pied de page par défaut */}
          {!theme.customFooterText && (
            <div style={{
              position: "absolute",
              bottom: "2px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: `${theme.footerFontSize / 2.5}px`,
              textAlign: "center",
              color: theme.secondaryColor,
              fontStyle: "italic",
              width: "90%",
            }}>
              Cette attestation ne tient pas lieu de diplôme...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};