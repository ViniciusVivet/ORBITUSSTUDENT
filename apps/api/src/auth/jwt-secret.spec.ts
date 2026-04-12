import { getJwtSecret, isUsingDevJwtSecret } from './jwt-secret';

const originalEnv = process.env;

describe('jwt-secret', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('usa segredo configurado quando JWT_SECRET existe', () => {
    process.env.JWT_SECRET = 'configured-secret';

    expect(getJwtSecret()).toBe('configured-secret');
    expect(isUsingDevJwtSecret()).toBe(false);
  });

  it('permite segredo local apenas fora de producao', () => {
    process.env.NODE_ENV = 'development';

    expect(getJwtSecret()).toBe('orbitus-dev-secret-change-me');
    expect(isUsingDevJwtSecret()).toBe(true);
  });

  it('falha em producao quando JWT_SECRET nao existe', () => {
    process.env.NODE_ENV = 'production';

    expect(() => getJwtSecret()).toThrow('JWT_SECRET must be defined in production.');
    expect(isUsingDevJwtSecret()).toBe(false);
  });
});
