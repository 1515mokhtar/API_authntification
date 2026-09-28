"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_URL = exports.EMAIL_FROM = void 0;
exports.getMailTransport = getMailTransport;
const nodemailer_1 = __importDefault(require("nodemailer"));
function getMailTransport() {
    return nodemailer_1.default.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false // pour ignorer l'erreur de certificat en dev
        }
    });
}
exports.EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;
exports.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
