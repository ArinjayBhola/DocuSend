import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.validation.js';
export class AuthController {
    service;
    constructor() {
        this.service = new AuthService();
    }
    register = async (req, res) => {
        const validated = registerSchema.parse(req.body);
        const user = await this.service.register(validated);
        const token = this.service.generateToken(user.id);
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
        });
        res.status(201).json({ user });
    };
    login = async (req, res) => {
        const validated = loginSchema.parse(req.body);
        const user = await this.service.login(validated);
        const token = this.service.generateToken(user.id);
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
        });
        res.json({ user });
    };
    logout = (req, res) => {
        res.clearCookie('token');
        res.json({ ok: true });
    };
    me = (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const { passwordHash: _, ...userWithoutPassword } = req.user;
        res.json({ user: userWithoutPassword });
    };
}
