// ecosystem.config.js
module.exports = {
	apps: [
	{
		name: 'anubis',
		cwd: 'C:\\Users\\product_user\\.www\\backend',
		script: 'dist\\main.js',
		instances: 1,
		exec_mode: 'cluster',
		autorestart: true,
		watch: false,
		env_production: {
			NODE_ENV: 'production',
			PORT: 9080,
			ENCRYPTION_KEY: 'F0R7UNA53CR3TKEYF0R53CUR1NGW3BAP1',
			OLLAMA_API: 'http://127.0.0.1:11434/api/generate',

			// Frontend
			FRONTEND_URL: 'http://127.0.0.1:8090',

			// Security 
			HASHING_ROUNDS: '10',
	
			// Mailer Configuration
			MAIL_HOST: 'smtp.zoho.com',
			MAIL_PORT: 465,
			MAIL_USER: '234-9020464737.505@zohomail.com',
			MAIL_PASS: 'FuiAyNrufmja',
			MAIL_FROM: '234-9020464737.505@zohomail.com',

			// Database Configuration
			DB_TYPE: 'mssql',
			DB_HOST: '127.0.0.1',
			DB_PORT: 1433,
			DB_USERNAME: 'sa',
			DB_PASSWORD: 'Admin@123456789!',
			DB_NAME: 'FortunaRosabon',
			DB_SYNC: true,
			DB_ENCRYPT: true,
			DB_TRUST_CERT: true,
		}
	}
	],
}