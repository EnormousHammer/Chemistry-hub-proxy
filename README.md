# Chemistry Hub Proxy Server

A simple proxy server for Chemistry Hub that allows the app to make API requests to PubChem, NMRShiftDB, and other external services without CORS issues.

## Why a Proxy Server?

This proxy server solves several problems:

1. **CORS Restrictions**: External APIs (like PubChem and NMRShiftDB) don't always include the necessary CORS headers
2. **Rate Limiting**: Some APIs might rate-limit direct client requests
3. **API Uniformity**: Provides a consistent API interface for your application

## Local Setup

### Requirements

- Node.js 14+ installed

### Installation

```bash
# Navigate to the proxy directory
cd proxy

# Install dependencies
npm install
```

### Running locally

```bash
# Start the server
npm start
```

You should see:
```
✅ Proxy running on http://localhost:3000
📡 Main proxy endpoint: http://localhost:3000/api/proxy?url=...
📡 NMR endpoint: http://localhost:3000/api/nmr?smiles=...&nucleus=...
📡 PubChem endpoint: http://localhost:3000/api/pubchem?name=...
```

## Deploying to Render.com

For a permanent solution that works in production:

1. Create a GitHub repository with the files in this directory
2. Push the files to GitHub
3. Go to [Render.com](https://render.com) and create a new account (if needed)
4. Create a new Web Service
5. Connect your GitHub repository
6. Configure the following settings:
   - **Name**: chemistry-hub-proxy (or any name you prefer)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

After deployment, you'll get a URL like:
```
https://chemistry-hub-proxy.onrender.com
```

## Using the Proxy in your app

Update your application code to point to the proxy:

```javascript
// Local development
const PROXY_URL = "http://localhost:3000/api/proxy";

// or production (when deployed to Render)
// const PROXY_URL = "https://chemistry-hub-proxy.onrender.com/api/proxy";

// Example for fetching SMILES from PubChem
async function fetchSMILES(name) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES/TXT`;
  const res = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
  return res.ok ? (await res.text()).trim() : null;
}

// Example for fetching JCAMP from NMRShiftDB
async function fetchJCAMP(smiles, nucleus = "13C") {
  const url = `https://nmrshiftdb.nmr.uni-koeln.de/NmrshiftdbServlet/nmrshiftdbaction/searchorpredict/smiles/${encodeURIComponent(smiles)}/spectrumtype/${nucleus}/format/jcamp`;
  const res = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
  return res.ok ? await res.text() : null;
}
``` 