# LabDrop

A lightweight, self-hosted web file manager and source code hub backed by Backblaze B2 (S3-compatible object storage). Built with Next.js 16, React 19, and Tailwind CSS.

---

## Overview

**LabDrop** provides a clean, web-based interface for managing files, organizing directories, previewing source code, and uploading documents directly to Backblaze B2 cloud storage without requiring a database.

Access is secured via a single administrator passphrase. All interactions with Backblaze B2 use the AWS S3 SDK with presigned URLs for client-side uploads and downloads.

---

## Key Features

- **Passphrase-Protected Access**: Single environment-configured admin passphrase with client session persistence in `localStorage`.
- **Direct & Fallback File Uploads**: Uploads request presigned S3 URLs to transfer files directly to B2 with real-time XHR progress tracking. Automatically falls back to multipart server relay if direct storage access encounters network or CORS restrictions.
- **In-Browser Code & Text Previewer**: Modal view for code and text files with line numbers, copy-to-clipboard, raw file view, and signed download links. Includes guardrails against binary files and files larger than 2 MB.
- **Hierarchical & Grouped Views**:
  - *Explorer View*: Directory browsing with breadcrumb navigation, subfolder listing, and drill-down support.
  - *Grouped View*: Flat overview grouping items by folder path with item counts and folder deletion shortcuts.
- **Folder Management**: Create virtual folders via `.keep` markers; recursively delete entire directory prefixes with batched S3 delete operations.
- **Live Search & Filtering**: Instant client-side search across all file keys and directory names.
- **Dark Theme UI**: Clean interface built using Tailwind CSS v4 and custom icons.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Storage Client**: AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **Language**: TypeScript 5
- **Package Manager / Runtime**: Bun (Node.js compatible)

---

## Architecture & How It Works

```
[ Browser Client ]
   │
   ├── 1. Authenticate with passphrase ──> [ Next.js API (/api/auth) ]
   │
   ├── 2. Fetch file & folder list ─────> [ Next.js API (/api/files) ] ──> [ Backblaze B2 ]
   │
   ├── 3. Upload File:
   │       a. Request Presigned URL ────> [ Next.js API (/api/upload) ]
   │       b. PUT file directly ─────────────────────────────────────────> [ Backblaze B2 ]
   │       c. (If CORS fails) Fallback ─> [ Next.js API (PUT /api/upload) ] ──> [ Backblaze B2 ]
   │
   └── 4. Preview / Download:
           a. Text preview (fetch content) -> [ Next.js API (/api/files) ] ──> [ Backblaze B2 ]
           b. Raw / Download (Presigned URL) ───────────────────────────> [ Backblaze B2 ]
```

---

## Environment Configuration

Create a `.env` or `.env.local` file in the root of the project with the following parameters:

```env
# Backblaze B2 S3-Compatible Settings
B2_REGION=us-east-005
B2_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_BUCKET_NAME=your-bucket-name
B2_KEY_ID=your-b2-key-id
B2_APPLICATION_KEY=your-b2-application-key

# Access Authentication
ADMIN_PASSWORD=your-secure-passphrase
```

### Backblaze B2 Configuration Notes

1. **Bucket Creation**: Create a private B2 bucket.
2. **Application Keys**: In the Backblaze B2 console, generate an Application Key with read and write permissions targeting your bucket.
3. **CORS Rules (for direct client uploads)**:
   To enable direct browser-to-bucket uploads via presigned URLs, configure CORS on your B2 bucket:
   ```json
   [
     {
       "corsRuleName": "AllowLabDropUploads",
       "allowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
       "allowedOperations": ["s3_put", "s3_get", "s3_head"],
       "allowedHeaders": ["*"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   *Note: If CORS is not enabled on B2, LabDrop will automatically route the upload through the Next.js server endpoint.*

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) (v20+).

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/username/libdrop.git
cd libdrop
bun install
```

*(If using npm, pnpm, or yarn, use `npm install`, `pnpm install`, or `yarn install`.)*

### Running in Development

```bash
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser and enter your configured `ADMIN_PASSWORD`.

### Building for Production

```bash
bun run build
bun start
```

---

## API Summary

All endpoints require the `x-admin-password` header matching `ADMIN_PASSWORD`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth` | Validates the supplied administrative passphrase. |
| `GET` | `/api/files` | Lists all files and reconstructed folder paths from the bucket. |
| `POST` | `/api/files` | Retrieves presigned URLs for viewing/downloading or returns UTF-8 text content for previewing. |
| `DELETE` | `/api/files` | Deletes an individual object or recursively deletes all objects within a folder prefix. |
| `POST` | `/api/upload` | Generates a presigned PUT URL for direct uploads or creates a virtual folder (`.keep`). |
| `PUT` | `/api/upload` | Fallback handler that receives multipart form data and streams the file to B2. |

---

## Directory Structure

```
├── public/                 # Static assets and icons
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/       # Auth verification endpoint
│   │   │   ├── files/      # S3 listing, signed links, preview, deletion
│   │   │   └── upload/     # Presigned URL generator and fallback upload
│   │   ├── globals.css     # Tailwind styling rules
│   │   ├── layout.tsx      # Main application layout
│   │   └── page.tsx        # Client entry point and auth state gate
│   ├── components/         # UI components
│   │   ├── ExplorerView.tsx   # Breadcrumb & hierarchical folder view
│   │   ├── GroupedView.tsx    # Flat directory breakdown
│   │   ├── Header.tsx         # App bar with actions and logout
│   │   ├── Hub.tsx            # State coordinator for file management
│   │   ├── LoginGate.tsx      # Passphrase authentication dialog
│   │   ├── PreviewModal.tsx   # Source code / text viewer modal
│   │   └── UploadPanel.tsx    # Drag-and-drop file upload interface
│   └── lib/
│       ├── api.ts          # Frontend API client and XHR upload helper
│       ├── b2.ts           # S3 client configuration and auth validator
│       ├── format.ts       # Formatting utilities and regular expressions
│       └── types.ts        # TypeScript data contracts and interfaces
├── package.json
└── tsconfig.json
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](file:///home/mmycin/Work/Projects/libdrop/LICENSE) file for details.
