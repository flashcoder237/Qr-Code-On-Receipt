import { google } from "googleapis";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";

const SCOPES = ["https://drive.google.com/file/d/1-0858FemHS93RDtTxtPq18W5vhKfptTl/view?usp=sharing"];
const TOKEN_PATH = "token.json";

export const authenticate = async (): Promise<OAuth2Client> => {
  const credentials = JSON.parse(fs.readFileSync("credentials.json", "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Vérifiez si un token existe déjà
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Générer un nouveau token
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this url:", authUrl);

  return new Promise((resolve, reject) => {
    process.stdin.resume();
    process.stdin.once("data", async (input) => {
      const code = input.toString().trim();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      }
    });
  });
};
