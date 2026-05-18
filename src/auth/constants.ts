const secret = process.env.JWT_SECRET || 'F0R7UNA53CR3TKEYF0R53CUR1NGW3BAP1';
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET env var not set. Using fallback secret - DO NOT USE IN PRODUCTION');
}

export const jwtConstants = {
  secret,
  expiresIn: '60m',
};
