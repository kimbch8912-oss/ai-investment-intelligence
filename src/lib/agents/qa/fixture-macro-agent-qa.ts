import { runMacroAgent } from '../macro/macro-agent.ts';
import { DeterministicMacroFixtureClient } from '../macro/fixture-client.ts';
import type { StructuredLlmClient } from '../llm/types.ts';
import type { M2AnalysisSnapshot } from '../macro/types.ts';
const assert=(v:unknown,m:string)=>{if(!v)throw new Error(m)};
const at='2026-08-20T00:00:00.000Z';
function snapshot(rates:number|null,inflation:number|null,growth:number|null,liquidity:number|null,macro:number|null,market=55,risk=20,partial=false):M2AnalysisSnapshot { const ds=(domain:string,score:number|null)=>({domain,score,label:score===null?null:'NORMAL',status:score===null?'UNKNOWN':partial&&domain==='liquidity'?'UNKNOWN':'VALID',confidence:score===null?0:.8,asOfTime:at,configVersion:'m2c-v1',components:[]}); return {domainScores:[ds('rates',rates),ds('inflation',inflation),ds('growth',growth),ds('liquidity',liquidity),ds('risk',risk)] as any,composites:{macro:{composite:'macro',score:macro,status:macro===null?'UNKNOWN':partial?'PARTIAL':'VALID',coverage:partial ? .75 : 1,confidence:macro===null?0:.8,asOfTime:at,configVersion:'m2d-v1',components:[]},market:{composite:'market',score:market,status:'VALID',coverage:1,confidence:.8,asOfTime:at,configVersion:'m2d-v1',components:[]},risk:{riskScore:risk,riskLevel:risk>=60?'HIGH':'NORMAL',confidence:.8,status:'VALID',components:[]},marketRiskAdjustedScore:market,divergence:macro===null?{status:'UNKNOWN',direction:'UNKNOWN',spread:null,absoluteGap:null}:{status:Math.abs(market-macro)>=15?'DIVERGENCE':'ALIGNED',direction:market>macro?'MARKET_ABOVE_MACRO':market<macro?'MACRO_ABOVE_MARKET':'NONE',spread:market-macro,absoluteGap:Math.abs(market-macro)},asOfTime:at,configVersion:'m2d-v1'} as any,rawRegime:{regime:'NEUTRAL'} as any,stableRegime:{stableRegime:'NEUTRAL'} as any,asOfTime:at,configVersions:['m2b-v1','m2c-v1','m2d-v1','m2e-v1','m2f-v1']}; }
class MutatingClient implements StructuredLlmClient { private readonly mutate:(output:any)=>any; constructor(mutate:(output:any)=>any){this.mutate=mutate;} async generateStructured<T>(input:any):Promise<T>{const base=await new DeterministicMacroFixtureClient().generateStructured<any>(input);return this.mutate(base) as T;} }
async function main(){ const client=new DeterministicMacroFixtureClient();
  const positive=snapshot(75,75,75,75,75); let r=await runMacroAgent(positive,client); assert(r.status==='COMPLETED'&&r.output?.direction==='POSITIVE'&&r.output.positiveFactors.length>0,'positive macro');
  r=await runMacroAgent(snapshot(25,25,25,25,25),client); assert(r.output?.direction==='NEGATIVE'&&r.output.negativeFactors.length>0,'weak macro');
  r=await runMacroAgent(snapshot(25,75,50,75,50),client); assert(r.output?.direction==='NEUTRAL'&&r.output.positiveFactors.length>0&&r.output.negativeFactors.length>0,'mixed macro');
  r=await runMacroAgent(snapshot(30,30,30,30,30,80),client); assert(r.output?.marketImplications.length,'divergence');
  r=await runMacroAgent(snapshot(60,60,60,null,60,55,20,true),client); assert(r.output?.status==='PARTIAL'&&r.output.unknowns.some(x=>x.includes('유동성')),'partial coverage');
  r=await runMacroAgent(snapshot(60,60,60,60,null),client); assert(r.status==='UNKNOWN'&&r.output?.direction==='UNKNOWN','unknown');
  r=await runMacroAgent(snapshot(75,75,75,75,75,55,80),client); assert(r.output?.direction==='POSITIVE'&&r.output.risks.length>0,'high risk independent');
  r=await runMacroAgent(positive,client); assert(JSON.stringify(r.output?.sourceSnapshot)===JSON.stringify({macroScore:75,ratesScore:75,inflationScore:75,growthScore:75,liquidityScore:75,riskScore:20,stableRegime:'NEUTRAL'}),'no recalculation');
  r=await runMacroAgent(positive,new MutatingClient(x=>({...x,evidence:[...x.evidence,{id:'fed_balance_sheet_growth'}]}))); assert(r.errors[0]?.code==='EVIDENCE_MISMATCH','fabricated evidence');
  r=await runMacroAgent(positive,new MutatingClient(()=>({}))); assert(r.errors[0]?.code==='AGENT_OUTPUT_INVALID','invalid output');
  r=await runMacroAgent(positive,new MutatingClient(x=>({...x,summary:'주식을 매수해야 한다'}))); assert(r.errors[0]?.code==='AGENT_OUTPUT_INVALID','recommendation guard');
  console.log('M3-A macro agent QA PASS'); }
main();
