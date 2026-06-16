// utils/mailer.js — Service d'envoi d'email
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envoie les identifiants de connexion à un étudiant nouvellement inscrit.
 * @param {string} email      - Email de l'étudiant
 * @param {string} nom        - Nom complet de l'étudiant
 * @param {string} matricule  - Matricule généré
 * @param {string} motDePasse - Mot de passe en clair (avant hashage)
 */
const sendCredentialsEmail = async (email, nom, matricule, motDePasse) => {
  const loginUrl = process.env.STUDENT_LOGIN_URL || 'http://localhost:5173/etudiant/login';
  const year = new Date().getFullYear();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'UniGest <noreply@uniggest.mg>',
    to: email,
    subject: 'Vos identifiants de connexion — UniGest',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Identifiants UniGest</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Arial, sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%); padding: 40px 32px; text-align:center;">

              <!-- Logo icon SVG -->
              <div style="margin-bottom:16px;">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"
                     style="display:inline-block; background:rgba(255,255,255,0.12); border-radius:14px; padding:12px;">
                  <path d="M28 8L6 18L28 28L50 18L28 8Z" fill="white" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M6 18V34" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M14 22V38C14 38 19 44 28 44C37 44 42 38 42 38V22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <h1 style="color:#ffffff; margin:0 0 6px; font-size:26px; font-weight:700; letter-spacing:-0.5px;">UniGest</h1>
              <p style="color:#bfdbfe; margin:0; font-size:13px; letter-spacing:1.5px; text-transform:uppercase; font-weight:500;">
                Portail de gestion universitaire
              </p>
            </td>
          </tr>

          <!-- BADGE INSCRIPTION VALIDÉE -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="background:#dcfce7; border:1px solid #bbf7d0; border-radius:8px; padding:12px 16px; margin-top:28px; display:flex; align-items:center;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="28" valign="middle">
                      <!-- Check circle SVG -->
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#16a34a"/>
                        <path d="M7 12.5L10.5 16L17 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </td>
                    <td style="padding-left:10px;">
                      <span style="color:#15803d; font-size:13px; font-weight:600;">Inscription validée par le secrétariat</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 28px 32px 0;">
              <p style="font-size:15px; color:#1e293b; margin:0 0 6px; font-weight:600;">Bonjour ${nom},</p>
              <p style="font-size:14px; color:#64748b; margin:0 0 24px; line-height:1.7;">
                Votre dossier d'inscription a été traité avec succès. Voici vos identifiants personnels
                pour accéder au portail étudiant UniGest.
              </p>
            </td>
          </tr>

          <!-- CREDENTIALS CARD -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">

                <!-- Card header -->
                <tr>
                  <td style="background:#1e40af; padding:12px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <!-- Shield icon SVG -->
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                               style="vertical-align:middle; margin-right:8px;">
                            <path d="M12 3L4 7V13C4 17.4 7.4 21.5 12 22.9C16.6 21.5 20 17.4 20 13V7L12 3Z"
                                  fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="color:white; font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase; vertical-align:middle;">
                          Vos identifiants de connexion
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Matricule -->
                <tr>
                  <td style="padding:20px 20px 12px; border-bottom:1px solid #e2e8f0;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="middle">
                          <!-- ID card icon SVG -->
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                               style="vertical-align:middle; margin-right:10px;">
                            <rect x="2" y="5" width="20" height="14" rx="3" stroke="#94a3b8" stroke-width="1.8"/>
                            <circle cx="8" cy="12" r="2.5" stroke="#94a3b8" stroke-width="1.8"/>
                            <path d="M13 10H19M13 14H17" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"/>
                          </svg>
                          <span style="font-size:12px; color:#94a3b8; font-weight:500; text-transform:uppercase; letter-spacing:0.8px; vertical-align:middle;">
                            Matricule
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:8px;">
                          <span style="font-size:22px; font-weight:700; color:#1e40af; letter-spacing:1px; font-family:'Courier New', monospace;">
                            ${matricule}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Mot de passe -->
                <tr>
                  <td style="padding:16px 20px 20px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="middle">
                          <!-- Key icon SVG -->
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                               style="vertical-align:middle; margin-right:10px;">
                            <circle cx="8" cy="12" r="5" stroke="#94a3b8" stroke-width="1.8"/>
                            <path d="M13 12H22M19 9V12M22 9V12" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"/>
                          </svg>
                          <span style="font-size:12px; color:#94a3b8; font-weight:500; text-transform:uppercase; letter-spacing:0.8px; vertical-align:middle;">
                            Mot de passe temporaire
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:8px;">
                          <span style="font-size:22px; font-weight:700; color:#1e40af; letter-spacing:3px; font-family:'Courier New', monospace;">
                            ${motDePasse}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- AVERTISSEMENT -->
          <tr>
            <td style="padding: 20px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:0;">
                <tr>
                  <td style="padding:14px 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="24" valign="top" style="padding-top:1px;">
                          <!-- Warning icon SVG -->
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3L2 20H22L12 3Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/>
                            <path d="M12 10V14M12 17.5V18" stroke="#92400e" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="margin:0; font-size:13px; color:#92400e; line-height:1.6;">
                            <strong>Important :</strong> Pour votre sécurité, changez votre mot de passe
                            dès votre première connexion. Ne partagez jamais vos identifiants.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding: 32px 32px 0; text-align:center;">
              <a href="${loginUrl}"
                 style="display:inline-block; background:linear-gradient(135deg, #1e40af, #2563eb);
                        color:#ffffff; text-decoration:none; font-size:15px; font-weight:600;
                        padding:15px 40px; border-radius:10px; letter-spacing:0.3px;
                        box-shadow:0 4px 12px rgba(37,99,235,0.35);">
                <!-- Login icon -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                     style="vertical-align:middle; margin-right:8px; margin-top:-2px;">
                  <path d="M15 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H15" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  <path d="M10 17L15 12L10 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 12H3" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Accéder au portail étudiant
              </a>

              <p style="margin:16px 0 0; font-size:12px; color:#94a3b8;">
                Ou copiez ce lien :
                <a href="${loginUrl}" style="color:#2563eb; text-decoration:none; word-break:break-all;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding: 32px 32px 0;">
              <hr style="border:none; border-top:1px solid #f1f5f9; margin:0;" />
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 32px 32px; text-align:center;">
              <p style="margin:0 0 4px; font-size:12px; color:#cbd5e1; font-weight:600; letter-spacing:0.5px;">
                UNIGGEST &mdash; Gestion Universitaire
              </p>
              <p style="margin:0; font-size:11px; color:#e2e8f0; color:#94a3b8;">
                Cet email est généré automatiquement, merci de ne pas y répondre.
              </p>
              <p style="margin:8px 0 0; font-size:11px; color:#cbd5e1;">
                &copy; ${year} UniGest. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendCredentialsEmail };