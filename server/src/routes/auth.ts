import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-system-key-2026-logic';

// Helper to sign JWT tokens
const generateToken = (userId: number, username: string, role: string) => {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Middleware to authenticate JWT token
export const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    (req as any).user = decoded;
    next();
  });
};

// POST /api/auth/signup: Registers a new user
router.post('/signup', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // 1. Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields (username, email, password) are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // 2. Check if username or email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, username),
          eq(users.email, email)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      if (existingUser[0].username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // 3. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insert into the database
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        current_streak: 0,
      } as any)
      .returning();

    // 5. Generate token and respond
    const token = generateToken(newUser.id, newUser.username, newUser.role || 'player');

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role || 'player',
        current_streak: newUser.current_streak,
      }
    });

  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login: Authenticates a user
router.post('/login', async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    // 1. Fetch user by username or email
    const userArr = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, usernameOrEmail),
          eq(users.email, usernameOrEmail)
        )
      )
      .limit(1);

    if (userArr.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userArr[0];

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 3. Update last_login
    await db
      .update(users)
      .set({ lastLogin: new Date() } as any)
      .where(eq(users.id, user.id));

    // 4. Generate token and respond
    const token = generateToken(user.id, user.username, user.role || 'player');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'player',
        current_streak: user.current_streak,
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me: Verifies token and returns current user info
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  const decoded = (req as any).user;

  try {
    const userArr = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (userArr.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userArr[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'player',
        current_streak: user.current_streak,
      }
    });

  } catch (error) {
    console.error('Error in /me endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/hash-test: Helper to hash passwords for Neon database
router.get('/hash-test', async (req: Request, res: Response) => {
  const password = (req.query.password as string) || 'password123';
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`\n🔑 [HASH TEST CORE] Generated Bcrypt Hash for "${password}":`);
    console.log(`👉 ${hash}\n`);
    res.json({
      password,
      hash,
      instructions: 'Copy this hash and paste it directly into your Neon dashboard password_hash column.'
    });
  } catch (error) {
    console.error('Error generating hash-test:', error);
    res.status(500).json({ error: 'Failed to generate hash' });
  }
});

export default router;
