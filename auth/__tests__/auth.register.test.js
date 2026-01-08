const request = require('supertest');
const app = require('../src/app');
const User = require('../models/user.model');
const testDb = require('../test/setup');

// Setup and teardown
beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clearDatabase();
});

afterAll(async () => {
  await testDb.closeDatabase();
});

describe('POST /auth/register', () => {
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!',
    fullName: {
      firstName: 'Test',
      lastName: 'User'
    },
    role: 'user'
  };

  describe('Success cases', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toMatchObject({
        username: validUserData.username,
        email: validUserData.email,
        role: validUserData.role
      });
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.token).toBeDefined();

      // Verify user is saved in database
      const userInDb = await User.findOne({ email: validUserData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.password).not.toBe(validUserData.password); // Password should be hashed
    });

    it('should register a user without specifying role (default to "user")', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'Password123!',
        fullName: {
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('user');
    });

    it('should register a seller user', async () => {
      const sellerData = {
        ...validUserData,
        username: 'testseller',
        email: 'seller@example.com',
        role: 'seller'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(sellerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('seller');
    });

    it('should register a user with address', async () => {
      const userWithAddress = {
        ...validUserData,
        username: 'testuser3',
        email: 'test3@example.com',
        address: [
          {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA'
          }
        ]
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userWithAddress)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      const userInDb = await User.findById(response.body.data.userId);
      expect(userInDb.address).toHaveLength(1);
      expect(userInDb.address[0].city).toBe('New York');
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when username is missing', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.username;

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });

    it('should return 400 when email is missing', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.email;

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });

    it('should return 400 when password is missing', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.password;

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });

    it('should return 400 when firstName is missing', async () => {
      const invalidData = {
        ...validUserData,
        fullName: { lastName: 'User' }
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });

    it('should return 400 when lastName is missing', async () => {
      const invalidData = {
        ...validUserData,
        fullName: { firstName: 'Test' }
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });
  });

  describe('Duplicate user errors', () => {
    it('should return 409 when email already exists', async () => {
      // Create first user
      await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create another user with same email
      const duplicateEmailData = {
        ...validUserData,
        username: 'differentusername'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(duplicateEmailData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email or username already exists');
    });

    it('should return 409 when username already exists', async () => {
      // Create first user
      await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create another user with same username
      const duplicateUsernameData = {
        ...validUserData,
        email: 'different@example.com'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(duplicateUsernameData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email or username already exists');
    });
  });

  describe('Password hashing', () => {
    it('should hash the password before saving', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      const userInDb = await User.findById(response.body.data.userId);
      
      // Password should not be stored in plain text
      expect(userInDb.password).not.toBe(validUserData.password);
      
      // Password should be a hash (bcrypt hashes start with $2a$ or $2b$)
      expect(userInDb.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('Token generation', () => {
    it('should return a JWT token', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      
      // JWT tokens have 3 parts separated by dots
      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });
  });
});
