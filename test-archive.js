// Manual probe: prints the first result of the Archive.org Flash software search that
// server.ts uses, to check whether the upstream API is reachable and still shaped the same.
// Run with: node test-archive.js
const SEARCH_URL =
  'https://archive.org/advancedsearch.php?q=collection:(softwarelibrary_flash)+AND+mediatype:(software)' +
  '&fl[]=identifier,title,subject,downloads&sort[]=downloads+desc&rows=50&output=json';

async function test() {
  const response = await fetch(SEARCH_URL);
  if (!response.ok) {
    throw new Error(`Archive.org responded with ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const docs = data?.response?.docs || [];
  console.log(`Received ${docs.length} results.`);
  console.log(docs[0] || 'No documents returned.');
}

test().catch(err => {
  console.error('Archive.org probe failed:', err.message);
  process.exitCode = 1;
});
