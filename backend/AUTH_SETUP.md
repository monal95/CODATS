# Authentication & MongoDB setup

To enable authentication and persist users in MongoDB, add the following environment variables to your `.env` file in the `backend/` folder:

- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb://localhost:27017/codats` or a MongoDB Atlas URI)
- `JWT_SECRET` - A random secret for signing JWT tokens (keep it secret in production)

Signup form requirements enforced by the server:
- firstName, lastName, phone, email, password are required
- Email must be a valid address (e.g., `name@example.com`)
- Phone accepts digits, optional leading +, spaces or dashes (7-15 chars)
- Password must be at least 8 characters and include a special character (e.g., `!@#$%`)

Example `.env`:

```
PORT=5000
AI_PROVIDER=groq
GROQ_API_KEY=your_api_key
MONGODB_URI=mongodb://localhost:27017/codats
JWT_SECRET=super-secret-value
```

After adding the variables, install new dependencies and restart the server:

```
cd backend
npm install
npm run dev
```

If `MONGODB_URI` is not set, the server will start but registration/login will return an error indicating no DB connection.
