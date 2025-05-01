// CORS Proxy Server for Chemistry Hub
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());

// Main proxy endpoint
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing URL parameter');
  }
  
  console.log(`Proxying request to: ${url}`);
  
  try {
    const response = await fetch(url);
    
    // Get content type to properly handle different response formats
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      // For text, JCAMP-DX, and other formats
      const text = await response.text();
      res.set('Content-Type', contentType);
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
  
  if (!smiles) {
    return res.status(400).send('Missing SMILES parameter');
  }
  
  const url = `https://nmrshiftdb.nmr.uni-koeln.de/NmrshiftdbServlet/nmrshiftdbaction/searchorpredict/smiles/${encodeURIComponent(smiles)}/spectrumtype/${nucleus}/format/jcamp`;
  
  console.log(`Fetching NMR data for SMILES: ${smiles}, Nucleus: ${nucleus}`);
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // Check if we received valid JCAMP data
    if (text.includes('##TITLE=')) {
      res.set('Content-Type', 'text/plain');
      res.send(text);
    } else {
      res.status(404).send('No NMR data found for the given SMILES');
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
  console.log(`📡 NMR endpoint: http://localhost:${PORT}/api/nmr?smiles=...&nucleus=...`);
  console.log(`📡 PubChem endpoint: http://localhost:${PORT}/api/pubchem?name=...`);
}); 