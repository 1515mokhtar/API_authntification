"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const firebase_1 = require("./config/firebase");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
// Chargement des variables d'environnement
dotenv_1.default.config();
console.log('CWD:', process.cwd());
console.log('ENV PATH:', path_1.default.resolve('.env'));
console.log('DEBUG ENV:', {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER
});
// Initialisation Firebase
(0, firebase_1.initializeFirebase)();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/user', user_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Auth API listening on port ${PORT}`);
    });
}
exports.default = app;
