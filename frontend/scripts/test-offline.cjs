const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const ts=require('typescript');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'dressly-offline-test-'));
const source=fs.readFileSync(path.join(__dirname,'../src/services/offline/offlineStorage.ts'),'utf8');
fs.writeFileSync(path.join(directory,'storage.js'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
fs.copyFileSync(path.join(__dirname,'../tests/offline-storage.html'),path.join(directory,'index.html'));
const {spawn}=require('node:child_process');
const browser=spawn('chromium',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--user-data-dir='+path.join(directory,'profile'),'--remote-debugging-pipe'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
let seq=0,buffer='';const pending=new Map();
browser.stdio[4].on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\0'))>=0){const raw=buffer.slice(0,end);buffer=buffer.slice(end+1);const message=JSON.parse(raw);if(message.id){const handler=pending.get(message.id);pending.delete(message.id);message.error?handler.reject(message.error):handler.resolve(message.result);}}});
function send(method,params={},sessionId){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});browser.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');});}
const timeout=setTimeout(()=>{console.error('FAIL: browser timeout');browser.kill();process.exit(1);},20000);
(async()=>{const {targetId}=await send('Target.createTarget',{url:'file://'+path.join(directory,'index.html')});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await new Promise(r=>setTimeout(r,1000));const result=await send('Runtime.evaluate',{expression:`new Promise(resolve => { const check=()=>{const value=document.body?.textContent||'';if(value.startsWith('PASS:')||value.startsWith('FAIL:'))resolve(value);else setTimeout(check,50);}; check();})`,awaitPromise:true,returnByValue:true},sessionId);console.log(result.result.value);clearTimeout(timeout);browser.kill();process.exit(result.result.value?.startsWith('PASS:')?0:1);})().catch(error=>{console.error(error);clearTimeout(timeout);browser.kill();process.exit(1);});
