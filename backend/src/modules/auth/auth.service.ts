import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError, BadRequestError, UnauthorizedError } from '../../core/errors/AppError.js';
import { AuthRepository } from './auth.repository.js';
import { LoginInput, RegisterInput } from './auth.validation.js';
import { AuthPayload, User } from './auth.types.js';

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(input: RegisterInput): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const result = await this.repository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const user = await this.repository.findById(Number(result.lastInsertRowid));
    if (!user) {
      throw new Error('Failed to create user');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(input: LoginInput): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.repository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  generateToken(userId: number): string {
    return jwt.sign({ userId } as AuthPayload, env.JWT_SECRET, { expiresIn: '30d' });
  }
}
