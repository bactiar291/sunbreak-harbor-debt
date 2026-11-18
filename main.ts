// Local, deterministic packaging for Sunbreak: Harbor Debt. No network calls.
import {cpSync,existsSync,lstatSync,mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildDossier} from './vendor/makefun-game.ts';

const here=fileURLToPath(new URL('.',import.meta.url));
const out=resolve(process.env.MAKEFUN_OUTPUT_DIR??'/output');
const vendorHash=createHash('sha256').update(readFileSync(join(here,'vendor/makefun-game.ts'))).digest('hex');
if(vendorHash!=='dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129') throw Error('Vendored library changed');
if(!relative(here,out).startsWith('..')) throw Error('Output must be outside the source repository');
if(existsSync(out)&&readdirSync(out).length) throw Error('Output must be new or empty');

function validateTree(folder) {
  for(const entry of readdirSync(folder,{withFileTypes:true})) {
    const path=join(folder,entry.name);
    if(lstatSync(path).isSymbolicLink()) throw Error(`Symlink refused: ${path}`);
    if(entry.isDirectory()) {validateTree(path);continue;}
    if(!['.html','.js','.css','.json','.png','.jpg','.svg','.wav','.ogg'].includes(extname(path))) throw Error(`Unexpected game file: ${path}`);
    if(/(?:^\.|secret|credential|session)/i.test(entry.name)) throw Error(`Private file refused: ${path}`);
    if(extname(path)==='.js') {
      const source=readFileSync(path,'utf8');
      for(const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
        if(!match[1].startsWith('./')) throw Error(`Nonlocal module: ${path}: ${match[1]}`);
        const dependency=resolve(folder,match[1]);
        if(!dependency.startsWith(join(here,'game')+'/')||!existsSync(dependency)) throw Error(`Missing local module: ${dependency}`);
      }
    }
  }
}
validateTree(join(here,'game'));
const shots=readdirSync(join(here,'screenshots')).sort();
if(shots.length!==4||shots.some(n=>!n.endsWith('.jpg'))) throw Error('Exactly four JPEG screenshots required');
for(const name of shots) {
  const bytes=readFileSync(join(here,'screenshots',name));
  if(bytes.length>262144||bytes[0]!==255||bytes[1]!==216) throw Error(`Invalid screenshot: ${name}`);
}
mkdirSync(out,{recursive:true});
cpSync(join(here,'game'),join(out,'game'),{recursive:true});
cpSync(join(here,'screenshots'),join(out,'screenshots'),{recursive:true});
const dossier=buildDossier(out,{
  text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},
  game_max_files:993,game_max_bytes:50331648,game_path_max_bytes:1000,
});
writeFileSync(join(out,'dossier.json'),dossier);
const entries=readdirSync(out).sort();
if(JSON.stringify(entries)!==JSON.stringify(['dossier.json','game','screenshots'])) throw Error('Unexpected output entries');
if(!readFileSync(join(out,'dossier.json')).equals(buildDossier(out,{
  text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},
  game_max_files:993,game_max_bytes:50331648,game_path_max_bytes:1000,
}))) throw Error('Dossier reproducibility check failed');
console.log(`PASS package: ${entries.join(', ')}; 4 JPEGs; vendor SHA-256 verified; dossier reproduced`);
console.log(`Output: ${out}`);
