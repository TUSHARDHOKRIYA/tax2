# Tax Invoice Generator Pro

A professional GST-compliant invoice generation software built with React, TypeScript, and Vite. Generates PDF invoices with proper tax calculations, company details, and banking information.

## Features

- **GST Compliance**: Automatically calculates CGST/SGST (same state) or IGST (inter-state) based on company locations
- **PDF Generation**: Download invoices as professional PDFs
- **Inventory Management**: Manage and add items to invoices
- **Customer Lookup**: Search customers by GST number
- **Transport Details**: Track transportation mode and vehicle numbers
- **Payment Terms**: Set custom payment terms and due dates
- **Professional Formatting**: Bank details, terms & conditions, and company information

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI Components
- **PDF Generation**: @react-pdf/renderer
- **Build Tool**: Vite
- **Router**: React Router v6
- **Form Handling**: React Hook Form + Zod
- **State Management**: React Query

## Installation

### Prerequisites
- Node.js 16+ (or Bun 1.0+)
- npm or Bun package manager

### Setup

```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd taxprint-pro-main

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:8080`

## Usage

1. **Add Company**: Click "Add Company" and enter customer GST number (will auto-populate from mock data)
2. **Select Items**: Browse inventory on the left and click items to add them to invoice
3. **Adjust Quantities**: Update quantities and discounts as needed
4. **Configure Options**: Set payment terms, due dates, transport mode, and add notes
5. **Generate PDF**: Click "Download PDF" to generate and download the invoice

## Building for Production

```bash
# Build the project
npm run build

# Preview production build locally
npm run preview
```

## Deployment on Netlify

### Option 1: Connect via GitHub

1. Push your code to a GitHub repository
2. Go to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build settings should auto-detect:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Option 2: Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # Shadcn UI components
│   ├── InvoicePdf.tsx    # PDF template component
│   ├── InvoiceItems.tsx  # Invoice items form
│   ├── InvoiceOptions.tsx # Payment & transport options
│   └── ...
├── pages/            # Page components
│   ├── Index.tsx     # Main application page
│   └── NotFound.tsx  # 404 page
├── data/             # Mock data & constants
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
└── App.tsx           # Main app component
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

## Configuration Files

- **vite.config.ts**: Vite build configuration
- **tsconfig.json**: TypeScript configuration
- **tailwind.config.ts**: Tailwind CSS customization
- **netlify.toml**: Netlify deployment configuration

## Known Issues & Fixes

### PDF Generation
- Font rendering now uses system fonts (Helvetica) for better compatibility
- Removed external Google Fonts dependency to avoid CORS issues in production
- All PDF generation is client-side for instant downloads

## Environment Variables

Currently, no environment variables are required. All configuration is in source code.

To add environment variables:
1. Create `.env.local` file
2. Add variables with `VITE_` prefix (e.g., `VITE_API_URL`)
3. Access in code via `import.meta.env.VITE_API_URL`

## Troubleshooting

### PDF not generating
- Check browser console for errors
- Ensure all required fields are filled
- Try clearing browser cache and reload

### Build fails
- Delete `node_modules` and `dist` folders
- Run `npm install` again
- Check Node.js version compatibility

### Issues on Netlify
- Clear build cache in Netlify UI
- Check build logs in Netlify dashboard
- Ensure `dist` folder is published

## License

MIT

## Support

For issues or questions, please check the browser console for error messages and refer to the troubleshooting section above.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
