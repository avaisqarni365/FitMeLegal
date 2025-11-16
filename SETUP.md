# 🚀 Quick Setup Guide

Simple step-by-step setup for local development (no Docker needed!)

## Step 1: Install Node.js

1. Go to https://nodejs.org/
2. Download Node.js 20 or higher
3. Install it
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Step 2: Install PostgreSQL

### Windows:
1. Download from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember your password for the `postgres` user!
4. Default port 5432 is fine

### macOS:
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 3: Create Database

Open Terminal/Command Prompt:

```bash
# Connect to PostgreSQL
psql -U postgres

# You'll see: postgres=#
# Now create the database:
CREATE DATABASE fitmelegal_dev;

# Exit (type \q and press Enter)
\q
```

## Step 4: Clone Project

```bash
# Clone the repository
git clone <your-repo-url>
cd FitMeLegal
```

## Step 5: Install Dependencies

```bash
npm install
```

This might take a few minutes. It's installing all the packages we need.

## Step 6: Configure Database Connection

```bash
cd apps/api
cp .env.example .env
```

Now open `apps/api/.env` in your text editor and update this line:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitmelegal_dev?schema=public"
```

Replace `YOUR_PASSWORD` with the PostgreSQL password you set during installation.

**Example:**
If your password is "mypass123", it should look like:
```
DATABASE_URL="postgresql://postgres:mypass123@localhost:5432/fitmelegal_dev?schema=public"
```

## Step 7: Setup Database Schema

Still in the `apps/api` directory:

```bash
npm run prisma:generate
npm run prisma:migrate
```

You should see output about creating tables (users, advisors, questions, etc.)

## Step 8: Start the Server!

Go back to the root directory:

```bash
cd ../..
npm run dev
```

You should see:
```
🚀 API running on http://localhost:3001
📚 API Docs: http://localhost:3001/api/docs
```

## Step 9: Test It!

Open your browser and go to:
- http://localhost:3001/api/docs

You should see the Swagger API documentation!

---

## ✅ Success!

You're now ready to start development!

## 🐛 Troubleshooting

### "psql: command not found"
PostgreSQL is not in your PATH. Find where PostgreSQL is installed and use the full path, or add it to PATH.

**Windows:** Usually in `C:\Program Files\PostgreSQL\16\bin\psql.exe`

### "Connection refused" or "password authentication failed"
- Check if PostgreSQL is running
- Verify your password in the `.env` file
- Check the username (usually `postgres`)

**macOS check:**
```bash
brew services list
```

**Linux check:**
```bash
sudo systemctl status postgresql
```

### "Port 3001 already in use"
Another app is using port 3001. Either:
- Stop that app
- Or change the port in `apps/api/.env`:
  ```
  PORT=3002
  ```

### Database connection error
1. Verify PostgreSQL is running
2. Test connection manually:
   ```bash
   psql -U postgres -d fitmelegal_dev
   ```
3. If this works, your DATABASE_URL in `.env` is incorrect

---

## 📚 Next Steps

- Read [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide
- Read [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for the development plan
- Start coding! Week 2 begins with authentication implementation

## 💡 Tips

- Keep PostgreSQL running in the background
- Use `npm run dev` to start the development server
- Use `npm run prisma:studio` to view database in a GUI
- Check `apps/api/.env` if you have connection issues

---

**Need help?** Open an issue or check the documentation!
