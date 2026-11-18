import {readdirSync,readFileSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root='/tmp/gta6-clean-repo';
let count=0;
for(const folder of ['game/src','tests'])for(const file of readdirSync(join(root,folder))){
 if(!/\.(m?js)$/.test(file))continue;
 const result=spawnSync(process.execPath,['--check',join(root,folder,file)],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);count++;
}
for(const file of ['main.ts','serve.ts']){
 const result=spawnSync(process.execPath,['--check',join(root,file)],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);count++;
}
console.log(`PASS syntax: ${count} JavaScript/TypeScript modules`);
for(const name of readdirSync(join(root,'screenshots')).sort()){
 const path=join(root,'screenshots',name),bytes=readFileSync(path);
 assert.ok(bytes.length<=262144);assert.equal(bytes.readUInt16BE(0),0xffd8);
 let offset=2,dimensions=null;
 while(offset<bytes.length){
  if(bytes[offset]!==255){offset++;continue;}
  const marker=bytes[offset+1];offset+=2;
  if(marker===0xd9||marker===0xda)break;
  const length=bytes.readUInt16BE(offset);
  if([0xc0,0xc1,0xc2].includes(marker)){dimensions={height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};break;}
  offset+=length;
 }
 assert.deepEqual(dimensions,{height:720,width:1280});
 console.log(`PASS JPEG ${name}: ${statSync(path).size} bytes, ${dimensions.width}x${dimensions.height}`);
}
