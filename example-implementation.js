// Example implementation for updating your application to use the proxy

// 1. Create a proxy URL constant for easy switching between local and deployed proxy
export const PROXY_URL = "http://localhost:3000/api/proxy";
// For production, use your deployed proxy URL:
// export const PROXY_URL = "https://your-proxy-name.onrender.com/api/proxy";

// 2. Function to fetch SMILES from PubChem via the proxy
export async function fetchSMILES(name) {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES/TXT`;
    const res = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
    return res.ok ? (await res.text()).trim() : null;
  } catch (error) {
    console.error("Error fetching SMILES:", error);
    return null;
  }
}

// 3. Function to fetch JCAMP from NMRShiftDB via the proxy
export async function fetchJCAMP(smiles, nucleus = "13C") {
  try {
    const url = `https://nmrshiftdb.nmr.uni-koeln.de/NmrshiftdbServlet/nmrshiftdbaction/searchorpredict/smiles/${encodeURIComponent(smiles)}/spectrumtype/${nucleus}/format/jcamp`;
    const res = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
    return res.ok ? await res.text() : null;
  } catch (error) {
    console.error("Error fetching JCAMP:", error);
    return null;
  }
}

// 4. More complex example with error handling and response parsing
export async function getCompoundInfo(name) {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES,IUPACName,MolecularFormula,InChI,InChIKey/JSON`;
    const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      console.error(`Error fetching compound info: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data?.PropertyTable?.Properties?.[0]) {
      console.error("Invalid response format");
      return null;
    }
    
    return data.PropertyTable.Properties[0];
  } catch (error) {
    console.error("Error getting compound info:", error);
    return null;
  }
}

// 5. Example of how to update your existing code in src/lib/pubchem.ts:
/*
import { PROXY_URL } from '../config'; // Create a config file with the proxy URL

export async function getSmilesFromName(name: string): Promise<string | null> {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/IsomericSMILES/TXT`;
    const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) return null;
    return (await response.text()).trim();
  } catch (error) {
    console.error('Error fetching SMILES from PubChem:', error);
    return null;
  }
}
*/

// 6. Example of how to update your existing code in src/lib/nmrshift.ts:
/*
import { PROXY_URL } from '../config';

export async function fetchNMRJCAMP(smiles: string, nucleus: string = "13C"): Promise<string | null> {
  try {
    const url = `https://nmrshiftdb.nmr.uni-koeln.de/NmrshiftdbServlet/nmrshiftdbaction/searchorpredict/smiles/${encodeURIComponent(smiles)}/spectrumtype/${nucleus}/format/jcamp`;
    
    const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      console.log(`NMRShiftDB2 API returned status: ${response.status}`);
      return null;
    }
    
    const jcampData = await response.text();
    
    // Check if we got valid JCAMP data (should contain ##TITLE=)
    if (!jcampData.includes('##TITLE=')) {
      console.log('Response does not appear to be valid JCAMP data');
      return null;
    }
    
    return jcampData;
  } catch (error) {
    console.error('Error fetching NMR JCAMP from NMRShiftDB2:', error);
    return null;
  }
}
*/ 