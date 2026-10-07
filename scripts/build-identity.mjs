import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const websiteVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
export function identity(mode) {
  let revision='unknown',dirty=true;
  try {revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();dirty=!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim();}catch{}
  return {schema:1,id:randomUUID(),revision,dirty,mode,version:websiteVersion};
}
export function buildMetadata(mode) {
  if(process.env.ODESOS_BUILD_META)return {...JSON.parse(process.env.ODESOS_BUILD_META),version:websiteVersion};
  if(mode==='production')try{return {...JSON.parse(readFileSync(new URL('../.qa-build-identity.json',import.meta.url),'utf8')),version:websiteVersion}}catch{}
  return identity(mode);
}
export function identityPlugin(meta) {
  return {name:'odesos-build-identity',transformIndexHtml(){return [{tag:'meta',attrs:{name:'odesos-build',content:JSON.stringify(meta)},injectTo:'head'}]}};
}
