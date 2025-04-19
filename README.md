# Fault Code Analyzer

A web application for analyzing fault codes in various equipment using API integration.

## Features

- Enter equipment type and fault code to get detailed analysis
- Collaborative pixel canvas for users to interact with
- Admin dashboard for monitoring usage and managing the application
- IP logging and tracking for security purposes
- Now uses API integration for more reliable fault code lookups

## Setup

### Quick Setup

The application includes a setup script to help you configure it:

```bash
# Install dependencies
npm install

# Run the setup script
npm run setup
```

The setup script will:
1. Guide you through configuring your fault code API settings
2. Create a `.env` file with your configuration
3. Set up admin credentials
4. Configure server settings

### Manual Setup

If you prefer to set up manually:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following:
   ```
   # Server configuration
   PORT=10000

   # API configuration for fault code lookup
   FAULT_CODE_API_URL=https://your-api-url.com/v1
   FAULT_CODE_API_KEY=your_api_key_here

   # Admin credentials
   ADMIN_USERNAME=Admin
   ADMIN_PASSWORD=YourSecurePassword
   ```

3. Start the application:
   ```bash
   npm start
   ```

## API Integration

The application now uses API integration instead of web scraping for fault code lookups. To use this feature:

1. Obtain API credentials from a fault code provider
2. Configure your `.env` file with the API URL and key
3. The system will automatically use the API for lookups

If the API is unavailable or the key is not configured, the system will fall back to:
1. Local database lookup (for common codes)
2. Web scraping as a last resort (not recommended for production)

## Admin Panel

The application includes an admin panel that allows you to:

- View visitor statistics
- Monitor pixel canvas usage
- Configure application settings
- View system information

Access the admin panel by clicking the lock icon (🔒) in the bottom-right corner of the main page.

Default admin credentials:
- Username: `Admin`
- Password: `Root64`

## Pixel Canvas

The application includes a collaborative pixel canvas feature:

- Users can place colored pixels on a shared canvas
- Each pixel placement has a cooldown period (default: 3 seconds)
- Canvas is updated in real-time across all users
- Hover over pixels to see when they were placed

## Development

For development with automatic restart on file changes:

```bash
npm run dev
```

## License

ISC 