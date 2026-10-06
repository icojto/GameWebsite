import type { TurnController } from './rules.ts';
interface FixturePort { controller:TurnController; locked():boolean; startRun():void; finalize():void }
/** Named prerequisites only. A terminal command operates on the existing run. */
export function applyFixture(api:FixturePort,name:string,isolated:boolean):boolean {
  if(api.locked())return false;
  const c=api.controller;
  if(name==='Force Win'||name==='Force Fail'){
    if(!isolated||c.phase!=='PLAYING'||c.state.result)return false;
    if(name==='Force Win')c.state.stability=c.activeConfig.stabilityTarget;else c.state.heat=c.activeConfig.heatMaximum;
    c.reEvaluate();api.finalize();return true;
  }
  const names=['Fresh Run','Near Victory','Near Heat Failure','All Tiers','Near Deadlock','Full Deadlock','Power-Up Test','Resolving Move Setup','Powers Depleted'];
  if(!names.includes(name))return false;
  api.startRun();const s=c.state,cfg=c.activeConfig;
  if(name==='Fresh Run')return true;
  s.board.fill(0);
  switch(name){
    case 'Near Victory':s.board[0]=s.board[1]=4;s.stability=Math.max(0,cfg.stabilityTarget-cfg.stabilityRewardByTier[5]);break;
    case 'Near Heat Failure':s.board[0]=1;s.heat=Math.max(0,cfg.heatMaximum-cfg.baseTurnHeat);break;
    case 'All Tiers':s.board.splice(0,Math.min(5,s.board.length),...[1,2,3,4,5].slice(0,s.board.length));break;
    case 'Near Deadlock':s.board.fill(5);s.board[0]=1;s.board[1]=0;break;
    case 'Full Deadlock':s.board.fill(5);c.reEvaluate();api.finalize();break;
    case 'Power-Up Test':s.board[0]=1;s.heat=Math.min(50,cfg.heatMaximum);s.coolCoreRemaining=1;s.upgradeRemaining=1;break;
    case 'Resolving Move Setup':s.board[0]=1;break;
    case 'Powers Depleted':s.board[0]=1;s.coolCoreRemaining=0;s.upgradeRemaining=0;break;
  }
  return true;
}
