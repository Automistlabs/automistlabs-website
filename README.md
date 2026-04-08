# Automist Labs Portfolio

Premium single-page portfolio with a secure contact form backend.

## Contact Form Backend (Node.js + Express + Nodemailer)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy `.env.example` to `.env` and set:

```env
EMAIL_USER=contact@automistlabs.com
EMAIL_PASS=your_hostinger_email_password_here
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
PORT=3000
```

### 3) Run the server

```bash
npm start
```

Open `http://localhost:3000`.

## API

- `POST /api/contact`
- Body fields:
	- `fullName`
	- `email`
	- `businessType`
	- `serviceNeeded`
	- `projectDetails`

The server validates input, sends a professionally formatted HTML email to `EMAIL_USER`, and keeps credentials in environment variables only.
