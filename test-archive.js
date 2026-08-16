async function test() {
  const response = await fetch('https://archive.org/advancedsearch.php?q=collection:(softwarelibrary_flash)+AND+mediatype:(software)&fl[]=identifier,title,subject,downloads&sort[]=downloads+desc&rows=50&output=json');
  const data = await response.json();
  console.log(data.response.docs[0]);
}
test();
