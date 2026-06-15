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
 * @param {string} email       - Email de l'étudiant
 * @param {string} nom         - Nom complet de l'étudiant
 * @param {string} matricule   - Matricule généré
 * @param {string} motDePasse  - Mot de passe en clair (avant hashage)
 */
const sendCredentialsEmail = async (email, nom, matricule, motDePasse) => {
  const loginUrl = process.env.STUDENT_LOGIN_URL || 'http://localhost:5173/etudiants/login';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'UniGest <noreply@uniggest.mg>',
    to: email,
    subject: '🎓 Vos identifiants de connexion — UniGest',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1e40af; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎓 UniGest</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0;">Université — Gestion des étudiants</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${nom}</strong>,</p>
          <p style="color: #6b7280;">Votre inscription a été validée par le secrétariat. Voici vos identifiants de connexion au portail étudiant :</p>

          <div style="background: #f0f9ff; border-left: 4px solid #1e40af; border-radius: 6px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 10px;"><strong>📋 Matricule :</strong>
              <span style="font-size: 18px; color: #1e40af; font-weight: bold; margin-left: 8px;">${matricule}</span>
            </p>
            <p style="margin: 0;"><strong>🔑 Mot de passe :</strong>
              <span style="font-size: 18px; color: #1e40af; font-weight: bold; margin-left: 8px;">${motDePasse}</span>
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            ⚠️ Pour votre sécurité, veuillez changer votre mot de passe après votre première connexion.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginUrl}"
               style="background-color: #1e40af; color: white; padding: 14px 32px; border-radius: 6px;
                      text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
              Se connecter au portail
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 13px; text-align: center;">
            Lien direct : <a href="${loginUrl}" style="color: #1e40af;">${loginUrl}</a>
          </p>
        </div>

        <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Cet email a été envoyé automatiquement par UniGest. Ne pas répondre à cet email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendCredentialsEmail };