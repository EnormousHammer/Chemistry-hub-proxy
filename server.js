// CORS Proxy Server for Chemistry Hub
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import https from 'https';

const app = express();
app.use(cors());

// Create an agent that ignores SSL certificate errors
// IMPORTANT: Only use for specific trusted domains
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// List of domains that need SSL certificate bypass
const INSECURE_DOMAINS = [
  'nmrshiftdb.nmr.uni-koeln.de'
];

// Helper to determine if a URL should use insecure agent
function shouldUseInsecureAgent(url) {
  try {
    const urlObj = new URL(url);
    return INSECURE_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// Main proxy endpoint
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing URL parameter');
  }
  
  console.log(`Proxying request to: ${url}`);
  
  try {
    // Select appropriate agent based on the URL
    const options = shouldUseInsecureAgent(url) 
      ? { agent: httpsAgent }
      : {};
    
    console.log(`Using ${options.agent ? 'insecure' : 'secure'} connection for: ${url}`);
    
    const response = await fetch(url, options);
    
    // Get content type to properly handle different response formats
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      // For text, JCAMP-DX, and other formats
      const text = await response.text();
      res.set('Content-Type', contentType || 'text/plain');
      res.send(text);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
});

// Specific endpoint for NMRShiftDB
app.get('/api/nmr', async (req, res) => {
  const smiles = req.query.smiles;
  const nucleus = req.query.nucleus || '13C';
  const format = req.query.format || 'jcamp'; // Allow different output formats
  
  if (!smiles) {
    return res.status(400).send('Missing SMILES parameter');
  }
  
  const url = `https://nmrshiftdb.nmr.uni-koeln.de/NmrshiftdbServlet/nmrshiftdbaction/searchorpredict/smiles/${encodeURIComponent(smiles)}/spectrumtype/${nucleus}/format/${format}`;
  
  console.log(`Fetching NMR data for SMILES: ${smiles}, Nucleus: ${nucleus}, Format: ${format}`);
  
  try {
    // Always use the insecure agent for NMRShiftDB
    const response = await fetch(url, { agent: httpsAgent });
    const text = await response.text();
    
    // Set appropriate content type based on format
    if (format === 'jcamp') {
      if (text.includes('##TITLE=')) {
        res.set('Content-Type', 'text/plain');
        res.send(text);
      } else {
        res.status(404).send('No NMR data found for the given SMILES');
      }
    } else if (format === 'json') {
      res.set('Content-Type', 'application/json');
      res.send(text); // The API actually returns XML even when requesting JSON
    } else if (format === 'cml') {
      res.set('Content-Type', 'application/xml');
      res.send(text);
    } else {
      res.set('Content-Type', 'text/plain');
      res.send(text);
    }
  } catch (err) {
    console.error('NMR data fetch error:', err);
    res.status(500).send('Error fetching NMR data: ' + err.message);
  }
});

// Specific endpoint for PubChem
app.get('/api/pubchem', async (req, res) => {
  const name = req.query.name;
  
  if (!name) {
    return res.status(400).send('Missing compound name');
  }
  
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES/TXT`;
  
  console.log(`Fetching SMILES for compound: ${name}`);
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const text = await response.text();
      res.set('Content-Type', 'text/plain');
      res.send(text.trim());
    } else {
      res.status(404).send('Compound not found');
    }
  } catch (err) {
    console.error('PubChem fetch error:', err);
    res.status(500).send('Error fetching from PubChem: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Main proxy endpoint: http://localhost:${PORT}/api/proxy?url=...`);
  console.log(`📡 NMR endpoint: http://localhost:${PORT}/api/nmr?smiles=...&nucleus=...&format=...`);
  console.log(`📡 PubChem endpoint: http://localhost:${PORT}/api/pubchem?name=...`);
}); 
