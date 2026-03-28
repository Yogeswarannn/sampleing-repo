/**
 * IPFS Utilities for uploading and retrieving files
 * Uses a simple approach - in production, integrate with Pinata or similar
 */

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

/**
 * Mock upload to IPFS - in production, use Pinata or similar
 * Returns a CID (Content Identifier)
 */
export async function uploadToIPFS(file: File | string): Promise<string> {
  try {
    const data = typeof file === 'string' ? file : await file.text();
    
    // In a real implementation, upload to IPFS
    // For now, return a simulated CID based on content hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return a v0 IPFS CID format (Qm prefix)
    return `Qm${hashHex.substring(0, 44)}`;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

/**
 * Upload task description to IPFS
 */
export async function uploadTaskDescription(description: string): Promise<string> {
  const taskData = {
    description,
    timestamp: new Date().toISOString(),
    version: "1.0"
  };
  
  return uploadToIPFS(JSON.stringify(taskData));
}

/**
 * Upload work output to IPFS
 */
export async function uploadWorkOutput(output: string | File): Promise<string> {
  const outputData = typeof output === 'string' 
    ? {
        content: output,
        timestamp: new Date().toISOString(),
        type: 'text'
      }
    : {
        filename: output.name,
        size: output.size,
        timestamp: new Date().toISOString(),
        type: 'file'
      };
  
  return uploadToIPFS(JSON.stringify(outputData));
}

/**
 * Retrieve content from IPFS
 */
export async function getIPFSContent(cid: string): Promise<any> {
  try {
    const response = await fetch(`${IPFS_GATEWAY}${cid}`);
    if (!response.ok) throw new Error('IPFS fetch failed');
    return await response.json();
  } catch (error) {
    console.error('IPFS retrieve error:', error);
    throw new Error('Failed to retrieve from IPFS');
  }
}

/**
 * Create IPFS URL
 */
export function getIPFSUrl(cid: string): string {
  return `${IPFS_GATEWAY}${cid}`;
}

/**
 * Upload verification rubric to IPFS
 */
export async function uploadVerificationRubric(rubric: {
  criteria: string[];
  weights: number[];
  passThreshold: number;
}): Promise<string> {
  const rubricData = {
    ...rubric,
    timestamp: new Date().toISOString(),
    version: "1.0"
  };
  
  return uploadToIPFS(JSON.stringify(rubricData));
}
