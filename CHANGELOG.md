# Changelog - Tax Invoice Generator Pro

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-07

### Added
- Initial release of Tax Invoice Generator Pro
- GST-compliant invoice generation
- PDF export functionality with professional formatting
- Company/Customer lookup by GST number
- Inventory management with item selection
- Invoice item quantity and discount management
- Tax calculation (CGST/SGST for same state, IGST for inter-state)
- Payment terms and due date configuration
- Transport mode and vehicle number tracking
- Bank details display on invoices
- Terms and conditions support
- Notes/remarks section on invoices
- Responsive UI with Tailwind CSS and Shadcn components
- React Router-based navigation
- Toast notifications for user feedback
- Production-ready Vite build configuration
- Netlify deployment support

### Fixed
- PDF generation now uses system fonts (Helvetica) for better compatibility
- Removed external font dependency to prevent CORS issues in production
- Improved error handling in PDF generation with detailed console logging
- Enhanced PDF blob validation before download
- Proper URL cleanup with delayed revocation to ensure downloads complete

### Optimized
- Code splitting for @react-pdf/renderer package
- CSS minification and tree-shaking in production builds
- JavaScript minification with Terser
- Asset caching headers configuration for Netlify
- Removed unused dependencies and build plugins

### Security
- Configured security headers via netlify.toml
- Environment variable support for sensitive data
- No API keys or credentials in source code
- HTTPS enforced on all Netlify deployments

### Documentation
- Comprehensive README with features, setup, and usage instructions
- Detailed DEPLOYMENT.md guide for Netlify deployment
- Troubleshooting section for common issues
- Project structure documentation
- Environment variable configuration guide

### Project Structure
```
src/
├── components/          # React UI components
│   ├── ui/             # Shadcn UI component library
│   ├── InvoicePdf.tsx  # PDF template component
│   ├── InvoiceItems.tsx
│   ├── InvoiceOptions.tsx
│   ├── InvoiceSummary.tsx
│   ├── GstLookup.tsx
│   ├── InventoryList.tsx
│   ├── AddCompanyDialog.tsx
│   └── ...
├── pages/              # Page-level components
│   ├── Index.tsx       # Main application page
│   └── NotFound.tsx    # 404 page
├── data/               # Mock data and constants
│   └── mockData.ts
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── config/             # Configuration files
│   └── env.ts          # Environment configuration
└── App.tsx             # Main application component
```

### Dependencies
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- Tailwind CSS 3.4.17
- Shadcn UI components
- @react-pdf/renderer 4.3.2
- React Hook Form 7.61.1
- React Router 6.30.1
- Zod 3.25.76 (schema validation)

### Known Limitations
- Mock data only (no backend integration)
- No user authentication
- No data persistence (local storage ready for future implementation)
- No real GST API integration (simulated with mock data)

### Future Enhancements
- [ ] Backend API integration
- [ ] Database for persistent storage
- [ ] User authentication and multi-tenant support
- [ ] Real GST lookup API integration
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Invoice templates customization
- [ ] Payment gateway integration
- [ ] Email invoice delivery
- [ ] Bulk invoice generation

### Deployment
- Netlify deployment tested and ready
- Automatic deployments from GitHub
- Build optimization for production
- Security headers configured
- SPA routing configured with redirects

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Notes
- All PDF generation is client-side (no server required)
- Uses mock data for demonstration
- Ready for database and API integration
- No external dependencies for PDF generation (self-contained)

---

## [Unreleased]

### Planned Features
- Backend API for database storage
- User authentication system
- Real GST validation API
- Multiple invoice templates
- Batch invoice generation
- Invoice archival system
- Advanced filtering and search
- Integration with payment gateways
