
"use strict";
/* ============ i18n ============ */
const I18N={
ar:{title:"حاسبة التباين والمحفظة المثلى",sub:"ملفات متعددة • نافذة تحليل موحدة • كل خطوة بزرها الخاص",
boxA:"أ: الأسهم",boxB:"ب: المؤشر",boxC:"ج: المعادلة",
upS:"رفع ملفات الأسهم",upI:"رفع ملف المؤشر",label:"الاسم:",freq:"تكرار البيانات:",
calcA:"حساب تباين الأسهم",calcB:"حساب تباين المؤشر",calcC:"حساب المعادلة",
dl:"تحميل Excel",copy:"نسخ الجدول",clr:"مسح",clrAll:"مسح الكل",resetB:"تصفير البيتا",
eqnote:"كل الأرقام من نفس العيّنة داخل النافذة الموحدة. العوائد بسيطة r=P/P₋₁−1 والتباين VAR.S (n−1). مع بيتا مُدخلة: σ²_ei uses the given β, so it can differ from the data-based value",
foot:"المكتبة الخارجية الوحيدة: SheetJS عبر CDN. كل الحسابات تتم محلياً في المتصفح.",
statusNoFile:"لم تُرفع أي ملفات بعد",
emptyA:"ارفع ملف سهم واحد على الأقل (يمكن اختيار عدة ملفات معاً)",emptyB:"ارفع ملف المؤشر",
emptyC:"ارفع الأسهم والمؤشر ثم اضغط «حساب المعادلة»",emptyD:"احسب الصناديق السابقة وأدخل r_f ثم اضغط Calculate",
emptyE:"ارفع المؤشر وسهمين على الأقل وأدخل r_f ثم اضغط Calculate",
needStocks:"ارفع ملف سهم واحد على الأقل",need2Stocks:"ارفع سهمين على الأقل",needIndex:"ارفع ملف المؤشر",
needRf:"أدخل r_f أولاً",needCalc:"احسب النتائج أولاً لتفعيل التحميل",needWin:"لا توجد نافذة تحليل صالحة",
needSmallN:"عدد المشاهدات أقل من 30",needFreq:"وحّد تكرار البيانات في كل الملفات",
freqMismatch:"تحذير: تكرار البيانات غير موحد بين الملفات. وحّد التكرار قبل الحساب.",
banner:"Analysis window: {s} – {e} | n = {n} observations | Frequency: {f} | Limited by: {l}",
bannerCap:"5-year cap",freqNames:{daily:"Daily",weekly:"Weekly",monthly:"Monthly"},
nWarn100:"تحذير: عدد المشاهدات أقل من 100 (n = {n})",nWarn30:"عدد المشاهدات أقل من 30 (n = {n}) — الحساب محظور",
winShort:"النافذة تقلصت بسبب الملف الجديد",noOverlap:"لا توجد تواريخ مشتركة بين كل الملفات.",
missingCol:"أعمدة ناقصة: لم أجد عمود التاريخ (تاريخ/Date) أو عمود السعر (اخر سعر/Price/Close).",
copied:"تم النسخ",copyFail:"تعذّر النسخ التلقائي — حدّد الجدول وانسخه يدوياً",
dlDone:"تم تحميل ملف Excel",loaded:"تم تحميل الملف",calculated:"تم الحساب",cleared:"تم المسح",loadFail:"فشل تحميل الملف",
remove:"إزالة",betaPh:"β (اختياري)",betasReset:"تم تصفير البيتا",
thAB:["Stock","n","Variance","Std dev","Ann. variance","Ann. std"],
chipRange:"النطاق",chipCount:"عدد الأسعار",chipDet:"المكتشف"},
en:{title:"Optimal Portfolio & Risk Calculator",sub:"Multiple files • one unified window • each step has its own button",
boxA:"A: Stocks",boxB:"B: Index",boxC:"C: The Equation",
upS:"Upload stock file(s)",upI:"Upload index file",label:"Label:",freq:"Data frequency:",
calcA:"Calculate stocks variance",calcB:"Calculate index variance",calcC:"Calculate equation",
dl:"Download Excel",copy:"Copy table",clr:"Clear",clrAll:"Clear all",resetB:"Reset betas",
eqnote:"All numbers come from the same sample inside the unified window. Simple returns r=P/P₋₁−1, sample variance VAR.S (n−1). With a given beta: σ²_ei uses the given β, so it can differ from the data-based value",
foot:"Only external script: SheetJS via CDN. All math runs locally in your browser.",
statusNoFile:"No files uploaded yet",
emptyA:"Upload at least one stock file (you can select several at once)",emptyB:"Upload the index file",
emptyC:"Upload stocks and index, then click “Calculate equation”",emptyD:"Calculate the previous boxes and enter r_f, then click Calculate",
emptyE:"Upload the index, at least 2 stocks and enter r_f, then click Calculate",
needStocks:"Upload at least one stock file",need2Stocks:"Upload at least 2 stocks",needIndex:"Upload the index file",
needRf:"Enter r_f first",needCalc:"Calculate results first to enable download",needWin:"No valid analysis window",
needSmallN:"Fewer than 30 observations",needFreq:"Use the same frequency in all files",
freqMismatch:"Warning: files have different frequencies. Align frequencies before calculating.",
banner:"Analysis window: {s} – {e} | n = {n} observations | Frequency: {f} | Limited by: {l}",
bannerCap:"5-year cap",freqNames:{daily:"Daily",weekly:"Weekly",monthly:"Monthly"},
nWarn100:"Warning: fewer than 100 observations (n = {n})",nWarn30:"Fewer than 30 observations (n = {n}) — calculation blocked",
winShort:"The window shrank because of the new file",noOverlap:"No dates common to all files.",
missingCol:"Missing columns: could not find a Date (تاريخ/Date) and a Price (اخر سعر/Price/Close) column.",
copied:"Copied",copyFail:"Auto-copy failed — select the table manually",
dlDone:"Excel file downloaded",loaded:"File loaded",calculated:"Calculated",cleared:"Cleared",loadFail:"Failed to load file",
remove:"Remove",betaPh:"β (optional)",betasReset:"Betas reset",
thAB:["Stock","n","Variance","Std dev","Ann. variance","Ann. std"],
chipRange:"Range",chipCount:"Prices",chipDet:"Detected"}};
let LANG='ar';
const T=k=>I18N[LANG][k]||k;
/* ============ state ============ */
const KMAP={daily:250,weekly:52,monthly:12};
const state={stocks:[],index:null,win:null,prevWin:null,resA:null,resB:null,resC:null,resD:null,resE:null,resF:null,resCmp:null,simView:'per'};
let stockSeq=0;

const _dummyEl = {
  style: {},
  classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  addEventListener(){},
  removeEventListener(){},
  setAttribute(){},
  removeAttribute(){},
  appendChild(){},
  removeChild(){},
  querySelector(){ return null; },
  querySelectorAll(){ return []; },
  focus(){},
  blur(){},
  click(){},
  value: '',
  textContent: '',
  innerHTML: '',
  hidden: false,
  disabled: false
};
function el(id){
  const found = document.getElementById(id);
  if (found) return found;
  return _dummyEl;
}

function fmtDate(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return `${dd}/${m}/${y}`}
function fmtISO(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${dd}`}
function fmtNum(x,dec=6){if(x==null||!isFinite(x))return '—';return Number(x).toFixed(dec)}
function stripMarks(s){return String(s??'').replace(/[  ‏‬‍﻿\u200F\u200E\u200B\uFEFF]/g,'')}
/* ============ math (verified, do not touch) ============ */
function mean(a){return a.reduce((s,x)=>s+x,0)/a.length}
function svar(a){if(a.length<2)return NaN;const m=mean(a);let s=0;for(const x of a)s+=(x-m)*(x-m);return s/(a.length-1)}
function scov(a,b){if(a.length<2||a.length!==b.length)return NaN;const ma=mean(a),mb=mean(b);let s=0;for(let i=0;i<a.length;i++)s+=(a[i]-ma)*(b[i]-mb);return s/(a.length-1)}
function addMonths(dt,n){const d=new Date(dt.getTime());const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d}
function median(a){const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2}
function detectFreq(dates){if(dates.length<3)return 'daily';const gaps=[];for(let i=1;i<dates.length;i++)gaps.push((dates[i]-dates[i-1])/86400000);const md=median(gaps);if(md<=4)return 'daily';if(md<=10)return 'weekly';return 'monthly'}
function simpleReturns(prices){const r=[];for(let i=1;i<prices.length;i++)r.push(prices[i]/prices[i-1]-1);return r}
/* ============ parsing (verified, do not touch) ============ */
function normCell(s){return stripMarks(s).trim().toLowerCase()}
function findCols(header){
  let di=-1,pi=-1;
  header.forEach((h,i)=>{const n=normCell(h);
    if(di<0&&(n.includes('تاريخ')||n==='date'||n.includes('date')))di=i;
    if(pi<0&&(n.includes('اخر')||n.includes('آخر')||n.includes('سعر')||n.includes('اغلاق')||n.includes('إغلاق')||n==='price'||n.includes('price')||n==='close'||n.includes('close')))pi=i;
  });
  if(di>=0&&pi===di)pi=-1;
  if(di>=0&&pi<0){header.forEach((h,i)=>{if(i===di)return;const n=normCell(h);if(n.includes('price')||n.includes('close')||n.includes('سعر'))pi=i;});}
  return {di,pi};
}
function parseDateStr(s){
  s=stripMarks(s).trim().replace(/"/g,'');if(!s)return null;
  let m=s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if(m){let[_,a,b,c]=m;let y=parseInt(c,10);if(y<100)y+=2000;return new Date(y,parseInt(b,10)-1,parseInt(a,10));}
  m=s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  const d=new Date(s);return isNaN(d)?null:d;
}
function parsePrice(v){
  if(v==null||v==='')return null;
  if(typeof v==='number')return isFinite(v)?v:null;
  let s=stripMarks(v).trim().replace(/,/g,'').replace(/%/g,'').replace(/\s+/g,'');
  if(!s||s==='-'||s==='—')return null;
  const x=parseFloat(s);return isFinite(x)?x:null;
}
function parseWorkbook(wb){
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null});
  if(!rows.length)throw new Error('empty');
  let hIdx=0,best=null;
  for(let i=0;i<Math.min(rows.length,10);i++){const c=findCols((rows[i]||[]).map(x=>x==null?'':String(x)));if(c.di>=0&&c.pi>=0){hIdx=i;best=c;break}}
  if(!best){best=findCols((rows[0]||[]).map(x=>x==null?'':String(x)));if(best.di<0||best.pi<0)throw new Error('missingCol')}
  const {di,pi}=best;const map=new Map();
  for(let i=hIdx+1;i<rows.length;i++){
    const r=rows[i];if(!r)continue;
    const d=parseDateStr(r[di]==null?'':String(r[di]));const p=parsePrice(r[pi]);
    if(!d||p==null)continue;
    const key=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
    map.set(key,{d:new Date(d.getFullYear(),d.getMonth(),d.getDate()),p});
  }
  const arr=[...map.values()].sort((a,b)=>a.d-b.d);
  return arr;
}
async function loadFile(file){const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});return parseWorkbook(wb)}
function cleanName(fn){return String(fn||'file').replace(/\.[^.]+$/,'').replace(/[_\-]+/g,' ').trim().slice(0,40)||'Stock'}
/* ============ unified window ============ */
function allFiles(){
  const f=state.stocks.map(s=>({kind:'stock',id:s.id,label:s.label||s.fileName,entries:s.entries,freq:s.freq}));
  if(state.index)f.push({kind:'index',id:'index',label:el('labelIndex').value||'Index',entries:state.index.entries,freq:state.index.freq});
  return f;
}
function computeWindow(){
  const files=allFiles();
  if(!files.length)return null;
  const fq=[...new Set(files.map(f=>f.freq))];
  if(fq.length>1)return{error:'freqMismatch',freqs:fq};
  const counts=new Map();
  files.forEach(f=>{const seen=new Set();f.entries.forEach(e=>{const k=e.d.getTime();if(!seen.has(k)){seen.add(k);counts.set(k,(counts.get(k)||0)+1)}})});
  const common=[...counts.entries()].filter(([,c])=>c===files.length).map(([k])=>k).sort((a,b)=>a-b);
  if(!common.length)return{error:'noOverlap'};
  const end=new Date(common[common.length-1]),firstCommon=new Date(common[0]);
  const cap=addMonths(end,-60);
  const start=firstCommon>cap?firstCommon:cap;
  let limitedBy;
  if(cap>=firstCommon)limitedBy=T('bannerCap');
  else{let mx=-Infinity;files.forEach(f=>{const t=f.entries[0].d.getTime();if(t>mx){mx=t;limitedBy=f.label}})}
  const dates=common.filter(t=>t>=start.getTime()&&t<=end.getTime());
  const n=dates.length-1;
  const freq=fq[0],k=KMAP[freq];
  return{files,freq,k,start:new Date(start),end:new Date(end),firstCommon,dates,n,limitedBy};
}
function clearResults(){
  state.resA=state.resB=state.resC=state.resD=state.resE=state.resF=state.resCmp=null;
  el('tblAWrap').hidden=true;el('tblAWrap').innerHTML='';
  el('tblBWrap').hidden=true;el('tblBWrap').innerHTML='';
  el('tblCWrap').hidden=true;el('tblCWrap').innerHTML='';
  el('tblDWrap').hidden=true;el('tblDWrap').innerHTML='';
  el('boxEOut').innerHTML='';
  if(el('boxFOut'))el('boxFOut').innerHTML='';
  if(el('boxCmpOut'))el('boxCmpOut').innerHTML='';
  if(el('boxCmp'))el('boxCmp').hidden=true;
}
function refreshWindow(announce){
  const prev=state.win;
  state.win=computeWindow();
  const w=state.win,bn=el('winBanner');
  if(!w){bn.className='idle';bn.id='winBanner';bn.textContent=T('statusNoFile');}
  else if(w.error==='freqMismatch'){bn.className='warn';bn.textContent=T('freqMismatch');}
  else if(w.error==='noOverlap'){bn.className='err';bn.textContent=T('noOverlap');}
  else{
    const txt=T('banner').replace('{s}',fmtDate(w.start)).replace('{e}',fmtDate(w.end)).replace('{n}',w.n).replace('{f}',I18N[LANG].freqNames[w.freq]||w.freq).replace('{l}',w.limitedBy);
    if(w.n<30){bn.className='err';bn.textContent=txt+'  |  '+T('nWarn30').replace('{n}',w.n);}
    else if(w.n<100){bn.className='warn';bn.textContent=txt+'  |  '+T('nWarn100').replace('{n}',w.n);}
    else{bn.className='ok';bn.textContent=txt;}
    if(announce&&prev&&!prev.error&&w.n<prev.n)toast(T('winShort'));
  }
  state.prevWin=prev;
  refreshMeta();renderStocks();refreshButtons();
}
/* ============ core stats (same sample, same formulas everywhere) ============ */
function readBetas(){
  state.stocks.forEach(s=>{
    const inp=document.querySelector(`input.betain[data-id="${s.id}"]`);
    if(inp){s.betaGiven=inp.value.trim()==='' ? null : parseFloat(inp.value);
      if(s.betaGiven!=null&&!isFinite(s.betaGiven))s.betaGiven=null}
    const lb=document.querySelector(`input.lbl[data-id="${s.id}"]`);
    if(lb&&lb.value.trim()!=='')s.label=lb.value;
  });
}
function getRf(){const v=parseFloat(String(el('rfAnnual').value).trim());return isFinite(v)?v:NaN}
function computeCore(needRf){
  const w=state.win;
  const rfAnn=getRf();
  if(needRf&&!isFinite(rfAnn))return{error:'needRf'};
  const k=w.k,rfPer=isFinite(rfAnn)?rfAnn/100/k:NaN;
  const idxMap=new Map(state.index.entries.map(e=>[e.d.getTime(),e.p]));
  const idxP=w.dates.map(t=>idxMap.get(t));
  const rm=simpleReturns(idxP),rbm=mean(rm),vm=svar(rm);
  if(!(vm>0))return{error:'novar'};
  const rows=state.stocks.map(s=>{
    const mp=new Map(s.entries.map(e=>[e.d.getTime(),e.p]));
    const sp=w.dates.map(t=>mp.get(t));
    const ri=simpleReturns(sp);
    const vi=svar(ri),sd=Math.sqrt(vi);
    const cv=scov(ri,rm),betaCalc=cv/vm;
    const given=(s.betaGiven!=null&&isFinite(s.betaGiven))?s.betaGiven:null;
    const beta=(given!=null)?given:betaCalc;
    const b2=beta*beta,b2vm=b2*vm,sei=vi-b2vm;
    const r2=(vi>0)?(cv*cv)/(vi*vm):NaN,pct=(vi!==0)?sei/vi*100:NaN;
    const rbi=mean(ri);
    const exI=rbi-rfPer,exM=rbm-rfPer;
    const alpha=exI-beta*exM;
    const trey=(beta>0)?exI/beta:NaN;
    return{stockId:s.id,label:s.label||s.fileName,n:w.n,vi,sd,annVar:vi*k,annStd:sd*Math.sqrt(k),
      vm,cv,betaCalc,beta,given:given!=null,b2,b2vm,sei,seValid:(sei>0),r2,pct,
      rbi,rbm,rf:rfPer,exI,exM,alpha,trey,prices:sp};
  });
  return{k,rfAnn,rfPer,vm,rbm,idxP,rm,rows};
}
/* ============ Box E: Elton & Gruber (pure, testable) ============ */
function eltonGruber(items,vm){
  const ranked=[...items].sort((a,b)=>b.trey-a.trey).map((r,i)=>({...r,rank:i+1,
    c4:r.exI*r.beta/r.sei,c5:r.beta*r.beta/r.sei}));
  let s6=0,s7=0;
  ranked.forEach(r=>{s6+=r.c4;s7+=r.c5;r.cum6=s6;r.cum7=s7;r.ci=vm*s6/(1+vm*s7)});
  const selected=[];
  for(const r of ranked){if(r.trey>r.ci)selected.push(r);else break}
  const Cstar=selected.length?selected[selected.length-1].ci:NaN;
  let weights=[];
  if(selected.length){
    const zs=selected.map(r=>({r,z:(r.beta/r.sei)*(r.trey-Cstar)}));
    const sz=zs.reduce((s,x)=>s+x.z,0);
    weights=zs.map(x=>({...x.r,z:x.z,w:x.z/sz})).sort((a,b)=>b.w-a.w);
  }
  const bp=weights.reduce((s,r)=>s+r.w*r.beta,0);
  const exP=weights.reduce((s,r)=>s+r.w*r.exI,0);
  return{ranked,selected,Cstar,weights,bp,exP};
}
/* ============ CCM: Constant Correlation Model (Elton & Gruber) — new, SIM untouched ============ */
function rhoBadge(given){return given?'<span class="betabadge given">Given</span>':'<span class="betabadge calc">Calculated</span>'}
function getRhoOverride(){const e=document.getElementById('rhoOverride');if(!e)return NaN;const v=parseFloat(String(e.value).trim());return isFinite(v)?v:NaN}
function alignedStockRets(win,stocks){
  return stocks.map(s=>{
    const mp=new Map(s.entries.map(e=>[e.d.getTime(),e.p]));
    return simpleReturns(win.dates.map(t=>mp.get(t)));
  });
}
function sampleCovMat(rets){
  const n=rets.length,M=[];
  for(let i=0;i<n;i++){M.push([]);for(let j=0;j<n;j++)M[i].push(i===j?svar(rets[i]):scov(rets[i],rets[j]))}
  return M;
}
function avgPairwiseCorr(rets,sds){
  let s=0,c=0;
  for(let i=0;i<rets.length;i++)for(let j=i+1;j<rets.length;j++){
    if(!(sds[i]>0)||!(sds[j]>0))continue;
    const cv=scov(rets[i],rets[j]);
    if(!isFinite(cv))continue;
    s+=cv/(sds[i]*sds[j]);c++;
  }
  return{rho:c?s/c:NaN,pairs:c};
}
function ccmModel(items,rhoBar){
  // items: [{key,label,Rbar,sigma,ex}] — pure, no DOM
  const excluded=[],pool=[];
  items.forEach(it=>{
    const ratio=(it.sigma>0)?it.ex/it.sigma:NaN;
    if(!(it.sigma>0))excluded.push({label:it.label,reason:'\u03C3 = 0'});
    else pool.push({...it,ratio});
  });
  pool.sort((a,b)=>b.ratio-a.ratio);
  const ranked=pool.map((r,i)=>({...r,rank:i+1}));
  let cum=0;
  ranked.forEach((r,i)=>{cum+=r.ratio;r.cum=cum;r.ci=rhoBar/(1-rhoBar+(i+1)*rhoBar)*cum});
  const selected=[];
  for(const r of ranked){
    if(r.ex<0)break; // negative excess never selected
    if(r.ratio>r.ci)selected.push(r);else break;
  }
  const Cstar=selected.length?selected[selected.length-1].ci:NaN;
  let weights=[];
  if(selected.length){
    const denom=(1-rhoBar);
    const zs=selected.map(r=>({r,z:(1/(denom*r.sigma))*(r.ratio-Cstar)}));
    const sz=zs.reduce((s,x)=>s+x.z,0);
    weights=zs.map(x=>({...x.r,z:x.z,w:x.z/sz})).sort((a,b)=>b.w-a.w);
  }
  const exP=weights.reduce((s,r)=>s+r.w*r.ex,0);
  let varM=NaN;
  if(weights.length){
    varM=0;
    for(let i=0;i<weights.length;i++)for(let j=0;j<weights.length;j++){
      varM+=weights[i].w*weights[j].w*(i===j?weights[i].sigma*weights[i].sigma:rhoBar*weights[i].sigma*weights[j].sigma);
    }
  }
  const sdM=isFinite(varM)&&varM>0?Math.sqrt(varM):NaN;
  const sharpeM=(isFinite(exP)&&isFinite(sdM)&&sdM>0)?exP/sdM:NaN;
  return{ranked,selected,Cstar,weights,excluded,exP,varM,sdM,sharpeM};
}
function realizedVarForWeights(weights,covMat,labelToIdx){
  if(!weights.length)return NaN;
  const idx=weights.map(r=>labelToIdx.get(r.label));
  if(idx.some(i=>i==null))return NaN;
  let v=0;
  for(let a=0;a<idx.length;a++)for(let b=0;b<idx.length;b++)v+=weights[a].w*weights[b].w*covMat[idx[a]][idx[b]];
  return v;
}
function simModelVar(weights,byLabel,vm){
  if(!weights.length)return NaN;
  const bp=weights.reduce((s,r)=>s+r.w*(byLabel.get(r.label).beta),0);
  let s=0;
  weights.forEach(r=>{const row=byLabel.get(r.label);s+=r.w*r.w*row.sei});
  return bp*bp*vm+s;
}
function solveLin(A,b){
  const n=A.length,M=A.map((row,i)=>[...row,b[i]]);
  for(let c=0;c<n;c++){
    let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
    if(Math.abs(M[p][c])<1e-15)throw new Error('singular');
    if(p!==c){const t=M[p];M[p]=M[c];M[c]=t}
    const d=M[c][c];
    for(let j=c;j<=n;j++)M[c][j]/=d;
    for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c];for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j]}
  }
  return M.map(r=>r[n]);
}
/* ============ self-tests ============ */
function runMathSelfTest(){
  const ok=(n,c,e,t=1e-6)=>{const p=Math.abs(c-e)<=t;console.log(`[selftest] ${n}: calc=${c} expected=${e} -> ${p?'PASS':'FAIL'}`);return p};
  let all=true;
  all=ok('VAR.S [1,2,3,4]',svar([1,2,3,4]),1.6666666666666667)&&all;
  all=ok('COV.S',scov([1,2,3],[2,4,5]),1.5)&&all;
  all=ok('SLOPE',scov([2,4,6],[1,2,3])/svar([1,2,3]),2)&&all;
  const b2=0.33*0.33;
  all=ok('given-beta b2',b2,0.1089,1e-12)&&all;
  all=ok('given-beta sei',0.000299-b2*0.000133,0.000285,1e-6)&&all;
  console.log(`[selftest] math unit tests ${all?'ALL PASS':'SOME FAIL'}`);
}
function runTextbookTest(){
  const vm=10,trey=[10,8,7,6,6,4,3,2.5,2,1],b2sei=[0.02,0.05625,0.05,0.40,0.025,0.075,0.10,0.04,0.05,0.06];
  const eC6=[0.2,0.65,1.0,3.4,3.55,3.85,4.15,4.25,4.35,4.41];
  const eC7=[0.02,0.07625,0.12625,0.52625,0.55125,0.62625,0.72625,0.76625,0.81625,0.87625];
  const eC=[1.67,3.69,4.42,5.43,5.45,5.30,5.02,4.91,4.75,4.52];
  const items=trey.map((t,i)=>{const beta=Math.sqrt(b2sei[i]);return{label:'S'+(i+1),exI:t*beta,beta,sei:1,trey:t}});
  const out=eltonGruber(items,vm);
  let all=true;
  const chk=(n,c,e,t)=>{const p=Math.abs(c-e)<=t;if(!p)console.log(`[textbook] ${n}: calc=${c} expected=${e} -> FAIL`);return p};
  out.ranked.forEach((r,i)=>{all=chk(`cum6[${i+1}]`,r.cum6,eC6[i],0.01)&&all;all=chk(`cum7[${i+1}]`,r.cum7,eC7[i],0.01)&&all;all=chk(`C[${i+1}]`,r.ci,eC[i],0.01)&&all});
  all=chk('C*',out.Cstar,5.45,0.01)&&all;
  const sel=out.selected.map(r=>r.label).join(',');
  const selOk=(sel==='S1,S2,S3,S4,S5');console.log(`[textbook] selected: ${sel} expected S1..S5 -> ${selOk?'PASS':'FAIL'}`);all=selOk&&all;
  const sw=out.weights.reduce((s,r)=>s+r.w,0);
  const wOk=Math.abs(sw-1)<=1e-9;console.log(`[textbook] weights sum=${sw} -> ${wOk?'PASS':'FAIL'}`);all=wOk&&all;
  console.log(`[textbook] Box E example ${all?'ALL PASS':'SOME FAIL'}`);
}
function checkSAUD(core){
  try{
    const idxL=(el('labelIndex').value||'').toUpperCase();
    const sRow=core.rows.find(r=>/SAUD/.test((r.label||'').toUpperCase()));
    if(!sRow||!/EGX33/.test(idxL))return;
    const w=state.win;
    const ck=(n,c,e,t)=>console.log(`[saud-test] ${n}: calc=${c} expected=${e} tol=${t} -> ${Math.abs(c-e)<=t?'PASS':'FAIL'}`);
    console.log(`[saud-test] window: ${fmtDate(w.start)} – ${fmtDate(w.end)} (expect 13/06/2024 – 01/10/2026, limited by ${w.limitedBy})`);
    ck('n',sRow.n,555,0);ck('vi',sRow.vi,0.000299,1e-6);ck('vm',sRow.vm,0.000133,1e-6);
    if(!sRow.given)ck('beta',sRow.beta,0.617,1e-3);
    ck('sei',sRow.sei,0.000249,1e-6);
    if(sRow.given&&Math.abs(sRow.beta-0.33)<=1e-12){
      ck('given beta',sRow.beta,0.33,1e-12);ck('given b2',sRow.b2,0.1089,1e-12);ck('given sei',sRow.sei,0.000285,1e-6);
      console.log(`[saud-test] badge: ${sRow.given?'Given':'Calculated'} (expect Given)`);
    }
  }catch(e){console.log('[saud-test] error',e)}
}
/* ============ rendering ============ */
let toastTimer=null;
function toast(msg,isErr){const t=el('toast');t.textContent=msg;t.className=isErr?'show err':'show';clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.className=''},2600)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function betaBadge(g){return g?'<span class="betabadge given">Given</span>':'<span class="betabadge calc">Calculated</span>'}
function setFreqOptions(){
  const n=I18N[LANG].freqNames;
  [...document.querySelectorAll('select.freqsel')].forEach(s=>{[...s.options].forEach(o=>{o.text=n[o.value]||o.value})});
  const fi=el('freqIndex');[...fi.options].forEach(o=>{o.text=n[o.value]||o.value});
}
function setLang(l){LANG=l;document.documentElement.lang=l;document.documentElement.dir=(l==='ar'?'rtl':'ltr');
  el('t-title').textContent=T('title');el('t-sub').textContent=T('sub');
  el('t-boxA').textContent=T('boxA');el('t-boxB').textContent=T('boxB');el('t-boxC').textContent=T('boxC');
  el('t-upS').textContent=T('upS');el('t-upI').textContent=T('upI');
  el('t-labelI').textContent=T('label');el('t-freqI').textContent=T('freq');
  el('t-calcA').textContent=T('calcA');el('t-calcB').textContent=T('calcB');el('t-calcC').textContent=T('calcC');
  el('t-resetB').textContent=T('resetB');el('t-clrA').textContent=T('clrAll');el('t-clrB').textContent=T('clr');
  el('t-dl').textContent=T('dl');el('t-copyA').textContent=T('copy');
  el('t-dlB').textContent=T('dl');el('t-copyB').textContent=T('copy');
  el('t-dlC').textContent=T('dl');el('t-copyC').textContent=T('copy');
  el('t-eqnote').textContent=T('eqnote');el('t-foot').textContent=T('foot');
  el('btnLang').textContent=(l==='ar'?'English':'العربية');
  setFreqOptions();refreshWindow(false);renderTables();applyTabLang();
}
function refreshMeta(){
  el('statusStocks').textContent=state.stocks.length?state.stocks.map(s=>s.label||s.fileName).join(' × '):T('statusNoFile');
  el('statusIndex').textContent=state.index?(el('labelIndex').value||'Index')+' — '+state.index.fileName:T('statusNoFile');
  const pair=state.stocks.length&&state.index?state.stocks.map(s=>s.label||s.fileName).join(', ')+' × '+(el('labelIndex').value||'Index'):T('statusNoFile');
  el('statusEq').textContent=pair;el('statusSim').textContent=pair;
  el('statusE').textContent=state.resE?`${state.resE.weights.length} / ${state.resE.total}`:pair;
  if(el('statusF'))el('statusF').textContent=state.resF?`${state.resF.weights.length} / ${state.resF.total}`:(state.stocks.length?state.stocks.map(s=>s.label||s.fileName).join(', '):T('statusNoFile'));
  if(el('statusCmp'))el('statusCmp').textContent=(state.resE&&state.resF)?'SIM + CCM ready':pair;
  const w=state.win;
  el('kIndex').textContent='k = '+(w&&!w.error?KMAP[w.freq]:KMAP[el('freqIndex').value]);
  el('kSim').textContent='k = '+(w&&!w.error?KMAP[w.freq]:250);
  if(el('kCcm'))el('kCcm').textContent='k = '+(w&&!w.error?KMAP[w.freq]:250);
  el('emptyA').textContent=T('emptyA');el('emptyA').hidden=state.stocks.length>0;
  el('emptyB').textContent=T('emptyB');el('emptyB').hidden=!!state.index;
  el('emptyC').textContent=T('emptyC');el('emptyC').hidden=!!(state.resC);
  el('emptyD').textContent=T('emptyD');el('emptyD').hidden=!!(state.resD);
  el('emptyE').textContent=T('emptyE');el('emptyE').hidden=!!(state.resE);
  if(el('emptyF')){el('emptyF').textContent='Upload at least 2 stocks and enter r_f, then click Calculate (index not required)';el('emptyF').hidden=!!(state.resF)}
  if(state.index){
    const e=state.index.entries;
    el('chipsIndex').innerHTML=`<span class="chip">${escapeHtml(T('chipRange'))}: ${fmtDate(e[0].d)} – ${fmtDate(e[e.length-1].d)}</span><span class="chip">${escapeHtml(T('chipCount'))}: ${e.length}</span><span class="chip">${escapeHtml(T('chipDet'))}: ${escapeHtml(I18N[LANG].freqNames[state.index.detected])}</span>`;
  }else el('chipsIndex').innerHTML='';
}
function renderStocks(){
  readBetas();
  const box=el('stockList');box.innerHTML='';
  state.stocks.forEach(s=>{
    const e=s.entries;
    const row=document.createElement('div');row.className='stockrow';
    row.innerHTML=
      `<input type="text" class="lbl" data-id="${s.id}" value="${escapeHtml(s.label||'')}" title="${escapeHtml(s.fileName)}">`+
      `<span class="meta">${fmtDate(e[0].d)} – ${fmtDate(e[e.length-1].d)} | ${e.length} prices | ${escapeHtml(I18N[LANG].freqNames[s.detected]||s.detected)}</span>`+
      `<select class="freqsel" data-id="${s.id}">${['daily','weekly','monthly'].map(f=>`<option value="${f}"${s.freq===f?' selected':''}>${escapeHtml(I18N[LANG].freqNames[f]||f)}</option>`).join('')}</select>`+
      `<input type="number" class="betain" data-id="${s.id}" step="any" placeholder="${escapeHtml(T('betaPh'))}" value="${s.betaGiven!=null?escapeHtml(String(s.betaGiven)):''}">`+
      `<button class="danger rm" type="button" data-rm="${s.id}">${escapeHtml(T('remove'))}</button>`;
    box.appendChild(row);
  });
  box.querySelectorAll('input.lbl').forEach(i=>{i.addEventListener('change',ev=>{const s=state.stocks.find(x=>x.id==ev.target.dataset.id);if(s){s.label=ev.target.value;clearResults();refreshWindow(false);renderTables()}})});
  box.querySelectorAll('select.freqsel').forEach(sel=>{sel.addEventListener('change',ev=>{const s=state.stocks.find(x=>x.id==ev.target.dataset.id);if(s){s.freq=ev.target.value;clearResults();refreshWindow(false)}})});
  box.querySelectorAll('button[data-rm]').forEach(b=>{b.addEventListener('click',ev=>{state.stocks=state.stocks.filter(x=>x.id!=ev.target.dataset.rm);clearResults();refreshWindow(true)})});
}
function varTableHTML(rows,id){
  const H=T('thAB');
  let h=`<table id="${id}"><thead><tr><th>${H[0]}</th><th class="numh">${H[1]}</th><th class="numh">${H[2]}</th><th class="numh">${H[3]}</th><th class="numh">${H[4]}</th><th class="numh">${H[5]}</th></tr></thead><tbody>`;
  rows.forEach(r=>{h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${r.n}</td><td class="num">${fmtNum(r.vi)}</td><td class="num">${fmtNum(r.sd)}</td><td class="num">${fmtNum(r.annVar)}</td><td class="num">${fmtNum(r.annStd)}</td></tr>`});
  return h+'</tbody></table>';
}
const ECH=["Stock","n","σ²_i","σ²_m","Cov(i,m)","β_i","β²_i","β²_i · σ²_m","σ²_ei","R²","σ²_ei / σ²_i (%)"];
const SIMH=["Stock","n","r̄_i","r̄_m","r_f","r̄_i − r_f (excess return, stock)","r̄_m − r_f (excess return, index)","β_i","α_i","σ²_ei","Treynor ratio"];
function renderTables(){renderA();renderB();renderC();renderD();renderE();renderF();renderCmp()}
function renderA(){
  const w=el('tblAWrap');
  if(!state.resA){w.hidden=true;w.innerHTML='';return}
  w.hidden=false;w.innerHTML=varTableHTML(state.resA.rows,'aTable');
}
function renderB(){
  const w=el('tblBWrap');
  if(!state.resB){w.hidden=true;w.innerHTML='';return}
  w.hidden=false;w.innerHTML=varTableHTML([state.resB],'bTable');
}
function renderC(){
  const w=el('tblCWrap');
  if(!state.resC){w.hidden=true;w.innerHTML='';return}
  w.hidden=false;
  let h=`<table id="eqTable"><thead><tr><th>${ECH[0]}</th><th class="numh">${ECH[1]}</th><th class="numh">${ECH[2]}</th><th class="numh">${ECH[3]}</th><th class="numh">${ECH[4]}</th><th class="numh">${ECH[5]}</th><th class="numh">${ECH[6]}</th><th class="numh">${ECH[7]}</th><th class="hlcol">${ECH[8]}</th><th class="numh">${ECH[9]}</th><th class="numh">${ECH[10]}</th></tr></thead><tbody>`;
  state.resC.rows.forEach(r=>{
    const b=r.beta.toFixed(3)+betaBadge(r.given);
    const seiCell=r.seValid?`<td class="num hlcol">${fmtNum(r.sei)}</td>`:`<td class="num inval">invalid (σ²_ei ≤ 0)</td>`;
    h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${r.n}</td><td class="num">${fmtNum(r.vi)}</td><td class="num">${fmtNum(r.vm)}</td><td class="num">${fmtNum(r.cv)}</td><td class="num">${b}</td><td class="num">${fmtNum(r.b2)}</td><td class="num">${fmtNum(r.b2vm)}</td>${seiCell}<td class="num">${isFinite(r.r2)?r.r2.toFixed(4):'—'}</td><td class="num">${isFinite(r.pct)?r.pct.toFixed(2)+'%':'—'}</td></tr>`;
  });
  w.innerHTML=h+'</tbody></table>';
}
function renderD(){
  const w=el('tblDWrap');
  if(!state.resD){w.hidden=true;w.innerHTML='';return}
  w.hidden=false;
  const ann=state.simView==='ann',k=state.resD.k,rfAnn=state.resD.rfAnn/100;
  let h=`<table id="simTable"><thead><tr><th>${SIMH[0]}</th><th class="numh">${SIMH[1]}</th><th class="numh">${SIMH[2]}</th><th class="numh">${SIMH[3]}</th><th class="numh">${SIMH[4]}</th><th class="numh">${SIMH[5]}</th><th class="numh">${SIMH[6]}</th><th class="numh">${SIMH[7]}</th><th class="numh">${SIMH[8]}</th><th class="numh">${SIMH[9]}</th><th class="numh">${SIMH[10]}</th></tr></thead><tbody>`;
  state.resD.rows.forEach(r=>{
    const vBi=ann?r.rbi*k:r.rbi,vBm=ann?r.rbm*k:r.rbm,vRf=ann?rfAnn:r.rf;
    const vExI=ann?(r.rbi*k-rfAnn):r.exI,vExM=ann?(r.rbm*k-rfAnn):r.exM;
    const vAl=ann?r.alpha*k:r.alpha;
    let treyCell;
    if(!(r.beta>0))treyCell=`<td class="num">n/a (β ≤ 0)</td>`;
    else{const vT=ann?((r.rbi*k-rfAnn)/r.beta):r.trey;
      treyCell=(vExI<0)?`<td class="num neg" title="Stock earned less than the risk-free rate">${vT.toFixed(4)}</td>`:`<td class="num">${vT.toFixed(4)}</td>`}
    const seiCell=r.seValid?`<td class="num">${fmtNum(r.sei)}</td>`:`<td class="num inval">invalid (σ²_ei ≤ 0)</td>`;
    h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${r.n}</td><td class="num">${fmtNum(vBi)}</td><td class="num">${fmtNum(vBm)}</td><td class="num">${fmtNum(vRf)}</td><td class="num">${fmtNum(vExI)}</td><td class="num">${fmtNum(vExM)}</td><td class="num">${r.beta.toFixed(3)}${betaBadge(r.given)}</td><td class="num">${fmtNum(vAl)}</td>${seiCell}${treyCell}</tr>`;
  });
  w.innerHTML=h+'</tbody></table>';
}
function renderE(){
  const box=el('boxEOut');box.innerHTML='';
  if(!state.resE)return;
  const E=state.resE,k=E.k;
  let h='';
  h+=`<h3 class="sub">Stocks in the optimal portfolio</h3>`;
  if(E.weights.length){
    h+=`<div class="tablewrap"><table id="finalTable"><thead><tr><th>Stock</th><th class="numh">Weight x_i (%)</th><th class="numh">β_i</th><th class="numh">Treynor ratio</th><th class="numh">σ²_ei</th></tr></thead><tbody>`;
    E.weights.forEach(r=>{h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${(r.w*100).toFixed(2)}%</td><td class="num">${r.beta.toFixed(3)}${betaBadge(r.given)}</td><td class="num">${r.trey.toFixed(4)}</td><td class="num">${fmtNum(r.sei)}</td></tr>`});
    h+=`</tbody></table></div>`;
    h+=`<div class="bigstats">`+
      `<div class="bigstat"><div class="k">Cutoff rate C*</div><div class="v">${E.Cstar.toFixed(4)}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio beta β_p</div><div class="v">${E.bp.toFixed(4)}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio excess (per period)</div><div class="v">${E.exP.toFixed(6)}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio excess (annualized)</div><div class="v">${(E.exP*k).toFixed(4)}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio Treynor (per period)</div><div class="v">${(E.exP/E.bp).toFixed(4)}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio Treynor (annualized)</div><div class="v">${(E.exP*k/E.bp).toFixed(4)}</div></div></div>`;
    h+=`<p class="sent">${E.weights.length} of ${E.total} stocks enter the portfolio: ${E.weights.map(r=>`${r.label} (${(r.w*100).toFixed(1)}%)`).join(', ')}.</p>`;
  }else{
    h+=`<div class="warnbox">No stock enters the portfolio: no Treynor ratio is above its cutoff rate</div>`;
    h+=`<p class="sent">0 of ${E.total} stocks enter the portfolio.</p>`;
  }
  if(E.rejected.length){
    h+=`<ul class="mutedlist">Not selected:`;
    E.rejected.forEach(r=>{h+=`<li>${escapeHtml(r.label)} — ${escapeHtml(r.reason)}</li>`});
    h+=`</ul>`;
  }
  h+=`<h3 class="sub">Stage 1: ranking</h3>`;
  h+=`<div class="tablewrap"><table id="rankTable"><thead><tr><th class="numh">Security No.</th><th>Stock</th><th class="numh">(R̄_i − R_f) / β_i [Treynor]</th><th class="numh">(R̄_i − R_f) · β_i / σ²_ei</th><th class="numh">β²_i / σ²_ei</th><th class="numh">Σ (R̄−R_f)β/σ²_e</th><th class="numh">Σ β²/σ²_e</th><th class="hlcol">C_i</th></tr></thead><tbody>`;
  const selIds=new Set(E.selected.map(r=>r.key));
  E.ranked.forEach(r=>{
    h+=`<tr${selIds.has(r.key)?' class="selrow"':''}><td class="num">${r.rank}</td><td class="per">${escapeHtml(r.label)}</td><td class="num">${r.trey.toFixed(4)}</td><td class="num">${r.c4.toFixed(4)}</td><td class="num">${r.c5.toFixed(4)}</td><td class="num">${r.cum6.toFixed(4)}</td><td class="num">${r.cum7.toFixed(4)}</td><td class="num hlcol">${r.ci.toFixed(4)}</td></tr>`;
  });
  h+=`</tbody></table></div>`;
  if(E.excluded.length){h+=`<ul class="mutedlist">`;E.excluded.forEach(r=>{h+=`<li>${escapeHtml(r.label)} — ${escapeHtml(r.reason)}</li>`});h+=`</ul>`}
  h+=`<h3 class="sub">Stage 2: cutoff and weights</h3>`;
  h+=`<p class="sent">C* = ${isFinite(E.Cstar)?E.Cstar.toFixed(4):'—'} (C_i of the last selected stock). z_i = (β_i / σ²_ei) · (Treynor_i − C*), x_i = z_i / Σ z_j.</p>`;
  if(E.weights.length){
    h+=`<div class="tablewrap"><table id="wTable"><thead><tr><th>Stock</th><th class="numh">z_i</th><th class="numh">Weight x_i (%)</th></tr></thead><tbody>`;
    E.weights.forEach(r=>{h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${r.z.toFixed(4)}</td><td class="num">${(r.w*100).toFixed(2)}%</td></tr>`});
    h+=`</tbody></table></div>`;
  }
  box.innerHTML=h;
}
function winBlocked(){
  const w=state.win;
  if(!w||w.error)return true;
  return w.n<30;
}
function stocksWin(){
  if(!state.stocks.length)return null;
  return computeWindowFor(state.stocks.map(s=>({label:s.label||s.fileName,entries:s.entries,freq:s.freq})));
}
function ccmBlockedStocksOnly(){
  const w=stocksWin();
  if(!w||w.error)return true;
  return w.n<30;
}
function renderF(){
  const box=el('boxFOut');if(!box)return;box.innerHTML='';
  if(!state.resF)return;
  const F=state.resF,k=F.k;
  let h='';
  h+=`<p class="sent">Average correlation rho_bar = ${F.rho.toFixed(4)} ${rhoBadge(F.rhoGiven)} (over ${F.pairs} pairs).</p>`;
  h+=`<h3 class="sub">Stocks in the optimal portfolio</h3>`;
  if(F.weights.length){
    h+=`<div class="tablewrap"><table id="ccmFinalTable"><thead><tr><th>Stock</th><th class="numh">Weight x_i (%)</th><th class="numh">sigma_i</th><th class="numh">(Rbar_i − R_f)/sigma_i</th></tr></thead><tbody>`;
    F.weights.forEach(r=>{h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${(r.w*100).toFixed(2)}%</td><td class="num">${fmtNum(r.sigma)}</td><td class="num">${r.ratio.toFixed(4)}</td></tr>`});
    h+=`</tbody></table></div>`;
    h+=`<div class="bigstats">`+
      `<div class="bigstat"><div class="k">C*</div><div class="v">${F.Cstar.toFixed(4)}</div></div>`+
      `<div class="bigstat"><div class="k">Expected excess (per period)</div><div class="v">${F.exP.toFixed(6)}</div></div>`+
      `<div class="bigstat"><div class="k">Expected excess (annualized)</div><div class="v">${(F.exP*k).toFixed(4)}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio sigma (per period, model)</div><div class="v">${fmtNum(F.sdM)}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio sigma (annualized, model)</div><div class="v">${isFinite(F.sdM)?(F.sdM*Math.sqrt(k)).toFixed(4):'—'}</div></div>`+
      `<div class="bigstat"><div class="k">Sharpe (per period, model)</div><div class="v">${isFinite(F.sharpeM)?F.sharpeM.toFixed(4):'—'}</div></div>`+
      `<div class="bigstat"><div class="k">Sharpe (annualized, model)</div><div class="v">${isFinite(F.sharpeM)?(F.sharpeM*Math.sqrt(k)).toFixed(4):'—'}</div></div>`+
      `<div class="bigstat"><div class="k">Portfolio sigma (annualized, realized)</div><div class="v">${isFinite(F.sdR)?F.sdR.toFixed(4):'—'}</div></div>`+
      `<div class="bigstat"><div class="k">Sharpe (annualized, realized)</div><div class="v">${isFinite(F.sharpeR)?F.sharpeR.toFixed(4):'—'}</div></div>`+
      `<div class="bigstat"><div class="k">rho_bar ${rhoBadge(F.rhoGiven)}</div><div class="v">${F.rho.toFixed(4)}</div></div></div>`;
    h+=`<p class="sent">${F.weights.length} of ${F.total} stocks enter the portfolio: ${F.weights.map(r=>`${r.label} (${(r.w*100).toFixed(1)}%)`).join(', ')}.</p>`;
  }else{
    h+=`<div class="warnbox">No stock enters the portfolio: no ratio is above its cutoff rate</div>`;
    h+=`<p class="sent">0 of ${F.total} stocks enter the portfolio.</p>`;
  }
  if(F.rejected.length){h+=`<ul class="mutedlist">Not selected:`;F.rejected.forEach(r=>{h+=`<li>${escapeHtml(r.label)} — ${escapeHtml(r.reason)}</li>`});h+=`</ul>`}
  h+=`<h3 class="sub">Table 1: Ranking</h3>`;
  h+=`<div class="tablewrap"><table id="ccmRankTable"><thead><tr><th class="numh">Security No.</th><th>Stock</th><th class="numh">(Rbar_i − R_f)/sigma_i</th><th class="numh">SUM_{j&lt;=i} (Rbar_j − R_f)/sigma_j</th><th class="hlcol">C_i</th></tr></thead><tbody>`;
  const selIds=new Set(F.selected.map(r=>r.key));
  F.ranked.forEach(r=>{h+=`<tr${selIds.has(r.key)?' class="selrow"':''}><td class="num">${r.rank}</td><td class="per">${escapeHtml(r.label)}</td><td class="num">${r.ratio.toFixed(4)}</td><td class="num">${r.cum.toFixed(4)}</td><td class="num hlcol">${r.ci.toFixed(4)}</td></tr>`});
  h+=`</tbody></table></div>`;
  if(F.excluded.length){h+=`<ul class="mutedlist">`;F.excluded.forEach(r=>{h+=`<li>${escapeHtml(r.label)} — ${escapeHtml(r.reason)}</li>`});h+=`</ul>`}
  h+=`<h3 class="sub">Table 2: Cutoff and weights</h3>`;
  h+=`<p class="sent">C* = ${isFinite(F.Cstar)?F.Cstar.toFixed(4):'—'} (C_i of the last selected stock). rho_bar = ${F.rho.toFixed(4)} ${rhoBadge(F.rhoGiven)}. z_i = 1/((1-rho_bar)*sigma_i) * [(Rbar_i − R_f)/sigma_i − C*].</p>`;
  if(F.weights.length){
    h+=`<div class="tablewrap"><table id="ccmWTable"><thead><tr><th>Stock</th><th class="numh">sigma_i</th><th class="numh">(Rbar_i − R_f)/sigma_i</th><th class="numh">z_i</th><th class="numh">Weight x_i (%)</th></tr></thead><tbody>`;
    F.weights.forEach(r=>{h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${fmtNum(r.sigma)}</td><td class="num">${r.ratio.toFixed(4)}</td><td class="num">${r.z.toFixed(4)}</td><td class="num">${(r.w*100).toFixed(2)}%</td></tr>`});
    h+=`</tbody></table></div>`;
  }
  box.innerHTML=h;
}
function buildComparison(){
  if(!state.resE||!state.resF)return null;
  const E=state.resE,F=state.resF,k=E.k;
  const eW=new Map(E.weights.map(r=>[r.label,r.w]));
  const fW=new Map(F.weights.map(r=>[r.label,r.w]));
  const labels=[...new Set([...eW.keys(),...fW.keys()])];
  labels.sort((a,b)=>Math.max(fW.get(b)||0,eW.get(b)||0)-Math.max(fW.get(a)||0,eW.get(a)||0));
  const rows=labels.map(l=>({label:l,sim:eW.has(l)?eW.get(l):null,ccm:fW.has(l)?fW.get(l):null,diff:(fW.get(l)||0)-(eW.get(l)||0)}));
  return{E,F,k,rows};
}
function renderCmp(){
  const card=el('boxCmp'),box=el('boxCmpOut');if(!card||!box)return;
  const cmp=buildComparison();
  if(!cmp){card.hidden=true;box.innerHTML='';return}
  card.hidden=false;
  const{E,F,k,rows}=cmp;
  let h='';
  h+=`<h3 class="sub">Weights side-by-side</h3>`;
  h+=`<div class="tablewrap"><table id="cmpWTable"><thead><tr><th>Stock</th><th class="numh">SIM weight (%)</th><th class="numh">CCM weight (%)</th><th class="numh">Difference (pp)</th></tr></thead><tbody>`;
  rows.forEach(r=>{h+=`<tr><td class="per">${escapeHtml(r.label)}</td><td class="num">${r.sim==null?'—':(r.sim*100).toFixed(2)+'%'}</td><td class="num">${r.ccm==null?'—':(r.ccm*100).toFixed(2)+'%'}</td><td class="num">${(r.diff*100).toFixed(2)}</td></tr>`});
  h+=`</tbody></table></div>`;
  const mSim=E,Fm=F;
  const f2=v=>isFinite(v)?v.toFixed(4):'n/a';
  h+=`<h3 class="sub">Metrics</h3>`;
  h+=`<div class="tablewrap"><table id="cmpMTable"><thead><tr><th>Metric</th><th class="numh">Single Index Model</th><th class="numh">Constant Correlation Model</th></tr></thead><tbody>`;
  h+=`<tr><td class="per">Stocks selected</td><td class="num">${mSim.weights.length}</td><td class="num">${Fm.weights.length}</td></tr>`;
  h+=`<tr><td class="per">Cutoff rate C*</td><td class="num">${f2(mSim.Cstar)}</td><td class="num">${f2(Fm.Cstar)}</td></tr>`;
  h+=`<tr><td class="per">Expected excess (annualized)</td><td class="num">${f2(mSim.exP*k)}</td><td class="num">${f2(Fm.exP*k)}</td></tr>`;
  h+=`<tr><td class="per">Portfolio std (annualized, model-implied)</td><td class="num">${isFinite(mSim.sdModelAnn)?mSim.sdModelAnn.toFixed(4):'n/a'}</td><td class="num">${isFinite(Fm.sdM)?(Fm.sdM*Math.sqrt(k)).toFixed(4):'n/a'}</td></tr>`;
  h+=`<tr><td class="per">Portfolio std (annualized, realized)</td><td class="num">${isFinite(mSim.sdRealAnn)?mSim.sdRealAnn.toFixed(4):'n/a'}</td><td class="num">${isFinite(Fm.sdR)?Fm.sdR.toFixed(4):'n/a'}</td></tr>`;
  h+=`<tr><td class="per">Sharpe (annualized, model-implied)</td><td class="num">${isFinite(mSim.sharpeModelAnn)?mSim.sharpeModelAnn.toFixed(4):'n/a'}</td><td class="num">${isFinite(Fm.sharpeM)?(Fm.sharpeM*Math.sqrt(k)).toFixed(4):'n/a'}</td></tr>`;
  h+=`<tr><td class="per">Sharpe (annualized, realized)</td><td class="num">${isFinite(mSim.sharpeRealAnn)?mSim.sharpeRealAnn.toFixed(4):'n/a'}</td><td class="num">${isFinite(Fm.sharpeR)?Fm.sharpeR.toFixed(4):'n/a'}</td></tr>`;
  h+=`<tr><td class="per">Portfolio beta</td><td class="num">${f2(mSim.bp)}</td><td class="num">n/a</td></tr>`;
  h+=`</tbody></table></div>`;
  const sE=new Set(mSim.weights.map(r=>r.label)),sF=new Set(Fm.weights.map(r=>r.label));
  const both=[...sE].filter(l=>sF.has(l)),onlyE=[...sE].filter(l=>!sF.has(l)),onlyF=[...sF].filter(l=>!sE.has(l));
  let verdict;
  if(!onlyE.length&&!onlyF.length)verdict=`Both models select the same ${both.length} stocks${both.length?': '+both.join(', '):''}.`;
  else verdict=`The models agree on ${both.length} stocks${both.length?': '+both.join(', '):''} and differ on: ${[...onlyE.map(l=>l+' (SIM only)'),...onlyF.map(l=>l+' (CCM only)')].join(', ')}.`;
  h+=`<p class="sent">${escapeHtml(verdict)}</p>`;
  box.innerHTML=h;
  state.resCmp=cmp;
}
function refreshButtons(){
  const w=state.win,blocked=winBlocked();
  const nS=state.stocks.length,hasI=!!state.index;
  const rfOk=isFinite(getRf());
  const base=nS>=1&&hasI&&!blocked;
  const baseE=nS>=2&&hasI&&!blocked;
  const missBase=!hasI?T('needIndex'):(!blocked?(nS<1?T('needStocks'):(w.error==='freqMismatch'?T('needFreq'):(w.n<30?T('needSmallN'):T('needWin')))):T('needSmallN'));
  el('btnCalcA').disabled=!base;el('btnCalcA').title=base?'':missBase;
  el('btnCalcB').disabled=!base;el('btnCalcB').title=base?'':missBase;
  el('btnCalcC').disabled=!base;el('btnCalcC').title=base?'':missBase;
  const dReady=base&&rfOk;
  el('btnCalcD').disabled=!dReady;el('btnCalcD').title=dReady?'':(!base?missBase:T('needRf'));
  const eReady=baseE&&rfOk;
  el('btnCalcE').disabled=!eReady;
  el('btnCalcE').title=eReady?'':((!baseE&&!blocked&&hasI&&nS<2)?T('need2Stocks'):(!baseE?missBase:T('needRf')));
  el('btnDlA').disabled=!state.resA;el('btnDlA').title=state.resA?'':T('needCalc');
  el('btnCopyA').disabled=!state.resA;el('btnCopyA').title=state.resA?'':T('needCalc');
  el('btnDlB').disabled=!state.resB;el('btnDlB').title=state.resB?'':T('needCalc');
  el('btnCopyB').disabled=!state.resB;el('btnCopyB').title=state.resB?'':T('needCalc');
  el('btnDlC').disabled=!state.resC;el('btnDlC').title=state.resC?'':T('needCalc');
  el('btnCopyC').disabled=!state.resC;el('btnCopyC').title=state.resC?'':T('needCalc');
  el('btnDlD').disabled=!state.resD;el('btnDlD').title=state.resD?'':T('needCalc');
  el('btnCopyD').disabled=!state.resD;el('btnCopyD').title=state.resD?'':T('needCalc');
  el('btnDlE').disabled=!state.resE;el('btnDlE').title=state.resE?'':T('needCalc');
  el('btnCopyE').disabled=!state.resE;el('btnCopyE').title=state.resE?'':T('needCalc');
  if(el('btnCalcF')){
    const sw=stocksWin(),swBad=!sw||sw.error||sw.n<30;
    const fReady=nS>=2&&rfOk&&!swBad;
    el('btnCalcF').disabled=!fReady;
    el('btnCalcF').title=fReady?'':(nS<2?T('need2Stocks'):(!rfOk?T('needRf'):(sw&&sw.error==='freqMismatch'?T('needFreq'):T('needSmallN'))));
    el('btnCalcBoth').disabled=!(eReady&&fReady);
    el('btnCalcBoth').title=(eReady&&fReady)?'':(!eReady?el('btnCalcE').title:el('btnCalcF').title);
    el('btnDlF').disabled=!state.resF;el('btnDlF').title=state.resF?'':T('needCalc');
    el('btnCopyF').disabled=!state.resF;el('btnCopyF').title=state.resF?'':T('needCalc');
    el('btnDlCmp').disabled=!(state.resE&&state.resF);el('btnDlCmp').title=(state.resE&&state.resF)?'':T('needCalc');
    el('btnCopyCmp').disabled=!(state.resE&&state.resF);el('btnCopyCmp').title=(state.resE&&state.resF)?'':T('needCalc');
  }
  el('btnClearStocks').disabled=!nS;el('btnClearStocks').title=nS?'':T('needStocks');
  el('btnClearIndex').disabled=!hasI;el('btnClearIndex').title=hasI?'':T('needIndex');
  el('btnResetBeta').disabled=!nS;el('btnResetBeta').title=nS?'':T('needStocks');
  const mq=el('msgA');
  if(w&&w.error==='freqMismatch')mq.innerHTML=`<div class="warnbox">${escapeHtml(T('freqMismatch'))}</div>`;
  else mq.innerHTML='';
}
function showMsg(id,txt,isErr){el(id).innerHTML=txt?`<div class="${isErr?'errbox':'warnbox'}">${escapeHtml(txt)}</div>`:''}
/* ============ events ============ */
el('btnLang').onclick=()=>setLang(LANG==='ar'?'en':'ar');
el('btnUpStocks').onclick=()=>el('fileStocks').click();
el('btnUpIndex').onclick=()=>el('fileIndex').click();
el('freqIndex').onchange=e=>{if(state.index){state.index.freq=e.target.value;clearResults();refreshWindow(false)}else{el('kIndex').textContent='k = '+KMAP[e.target.value]}refreshMeta();refreshButtons()};
async function handleStockFiles(list){
  let added=0;
  for(const file of list){
    try{
      const entries=await loadFile(file);
      if(entries.length<2){showMsg('msgA',T('missingCol'),true);continue}
      const det=detectFreq(entries.map(e=>e.d));
      state.stocks.push({id:++stockSeq,fileName:file.name,label:cleanName(file.name),entries,detected:det,freq:det,betaGiven:null});
      added++;
    }catch(err){showMsg('msgA',T('loadFail')+': '+escapeHtml(file.name),true)}
  }
  if(added){showMsg('msgA','',false);clearResults();refreshWindow(true);toast(T('loaded'))}
  refreshMeta();renderStocks();refreshButtons();
}
el('fileStocks').addEventListener('change',e=>{if(e.target.files.length)handleStockFiles([...e.target.files]);e.target.value=''});
el('fileIndex').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{
    const entries=await loadFile(f);
    if(entries.length<2)throw new Error('missingCol');
    const det=detectFreq(entries.map(x=>x.d));
    state.index={entries,detected:det,freq:el('freqIndex').value||det,fileName:f.name};
    if((el('labelIndex').value||'Index')==='Index')el('labelIndex').value=cleanName(f.name);
    showMsg('msgIndex','',false);clearResults();refreshWindow(true);toast(T('loaded'));
  }catch(err){showMsg('msgIndex',T('missingCol'),true);toast(T('loadFail'),true)}
  refreshMeta();refreshButtons();
});
el('labelIndex').addEventListener('change',()=>{clearResults();refreshWindow(false);renderTables()});
el('btnClearStocks').onclick=()=>{state.stocks=[];clearResults();refreshWindow(false);toast(T('cleared'))};
el('btnClearIndex').onclick=()=>{state.index=null;clearResults();refreshWindow(false);toast(T('cleared'))};
el('btnResetBeta').onclick=()=>{state.stocks.forEach(s=>{s.betaGiven=null});renderStocks();state.resC=state.resD=state.resE=null;el('tblCWrap').hidden=true;el('tblCWrap').innerHTML='';el('tblDWrap').hidden=true;el('tblDWrap').innerHTML='';el('boxEOut').innerHTML='';refreshMeta();renderTables();refreshButtons();toast(T('betasReset'))};
el('rhoOverride').addEventListener('change',()=>{state.resF=null;state.resCmp=null;renderF();renderCmp();refreshButtons();refreshMeta()});
function needBase(){
  if(!state.stocks.length||!state.index)return false;
  if(winBlocked())return false;
  return true;
}
el('btnCalcA').onclick=()=>{
  if(!needBase())return;readBetas();
  const core=computeCore(false);if(core.error)return;
  state.resA={rows:core.rows,k:core.k};
  core.rows.forEach(r=>console.log(`[A] ${r.label}: n=${r.n} var=${r.vi.toFixed(9)}`));
  renderTables();refreshButtons();toast(T('calculated'));
};
el('btnCalcB').onclick=()=>{
  if(!needBase())return;
  const core=computeCore(false);if(core.error)return;
  state.resB={label:el('labelIndex').value||'Index',n:core.rows.length?core.rows[0].n:state.win.n,vi:core.vm,sd:Math.sqrt(core.vm),annVar:core.vm*core.k,annStd:Math.sqrt(core.vm)*Math.sqrt(core.k)};
  console.log(`[B] index: n=${state.resB.n} var=${core.vm.toFixed(9)}`);
  renderTables();refreshButtons();toast(T('calculated'));
};
el('btnCalcC').onclick=()=>{
  if(!needBase())return;readBetas();
  const core=computeCore(false);if(core.error)return;
  state.resC={rows:core.rows,k:core.k,vm:core.vm};
  core.rows.forEach(r=>console.log(`[C] ${r.label}: n=${r.n} vi=${r.vi.toFixed(9)} vm=${r.vm.toFixed(9)} cov=${r.cv.toFixed(9)} beta=${r.beta.toFixed(6)}${r.given?' (Given)':' (Calculated)'} sei=${r.sei.toFixed(9)} R2=${isFinite(r.r2)?r.r2.toFixed(6):'n/a'}`));
  checkSAUD(core);
  renderTables();refreshButtons();toast(T('calculated'));
};
el('btnCalcD').onclick=()=>{
  if(!needBase())return;readBetas();
  const core=computeCore(true);if(core.error)return;
  state.resD={rows:core.rows,k:core.k,rfAnn:core.rfAnn};
  core.rows.forEach(r=>console.log(`[D] ${r.label}: rbi=${r.rbi.toFixed(9)} rbm=${r.rbm.toFixed(9)} rf=${r.rf.toFixed(9)} exI=${r.exI.toFixed(9)} alpha=${r.alpha.toFixed(9)} trey=${(r.beta>0)?r.trey.toFixed(6):'n/a'}`));
  core.rows.forEach(r=>{
    const aExp=(r.rbi-r.rf)-r.beta*(r.rbm-r.rf);
    const pa=Math.abs(r.alpha-aExp)<=1e-12;
    const pt=!(r.beta>0)?(!isFinite(r.trey)):Math.abs(r.trey-(r.exI/r.beta))<=1e-12;
    console.log(`[sim-verify] ${r.label}: α -> ${pa?'PASS':'FAIL'} | Treynor -> ${pt?'PASS':'FAIL'}`);
  });
  renderTables();refreshButtons();toast(T('calculated'));
};
el('btnCalcE').onclick=()=>{
  if(state.stocks.length<2||!state.index||winBlocked())return;readBetas();
  const core=computeCore(true);if(core.error)return;
  const items=[],excluded=[],byId=new Map();
  core.rows.forEach((r,i)=>{
    const it={key:r.stockId,label:r.label,exI:r.exI,beta:r.beta,sei:r.sei,trey:r.trey,given:r.given};
    byId.set(r.stockId,it);
    if(!(r.beta>0))excluded.push({label:r.label,reason:'β ≤ 0'});
    else if(!(r.sei>0))excluded.push({label:r.label,reason:'σ²_ei ≤ 0'});
    else items.push(it);
  });
  const out=eltonGruber(items,core.vm);
  const selKeys=new Set(out.selected.map(r=>r.key));
  const rejected=[...excluded];
  out.ranked.forEach(r=>{
    if(selKeys.has(r.key))return;
    if(r.exI<0)rejected.push({label:r.label,reason:'negative excess return'});
    else rejected.push({label:r.label,reason:`Treynor ≤ cutoff (Treynor = ${r.trey.toFixed(4)}, C_i = ${r.ci.toFixed(4)})`});
  });
  state.resE={...out,excluded,rejected,k:core.k,rfAnn:core.rfAnn,vm:core.vm,total:core.rows.length,
    weights:out.weights.map(w=>({...byId.get(w.key),z:w.z,w:w.w}))};
  try{
    const byLbl=new Map(core.rows.map(r=>[r.label,r]));
    const rets=alignedStockRets(state.win,state.stocks);
    const cov=sampleCovMat(rets);
    const l2i=new Map(state.stocks.map((s,i)=>[s.label||s.fileName,i]));
    const vm2=simModelVar(state.resE.weights,byLbl,core.vm);
    state.resE.varModel=vm2;
    state.resE.sdModelAnn=isFinite(vm2)&&vm2>0?Math.sqrt(vm2)*Math.sqrt(core.k):NaN;
    state.resE.sharpeModelAnn=(isFinite(state.resE.exP)&&isFinite(vm2)&&vm2>0)?(state.resE.exP/Math.sqrt(vm2))*Math.sqrt(core.k):NaN;
    const vr=realizedVarForWeights(state.resE.weights,cov,l2i);
    state.resE.varReal=vr;
    state.resE.sdRealAnn=isFinite(vr)&&vr>0?Math.sqrt(vr)*Math.sqrt(core.k):NaN;
    state.resE.sharpeRealAnn=(isFinite(state.resE.exP)&&isFinite(vr)&&vr>0)?(state.resE.exP/Math.sqrt(vr))*Math.sqrt(core.k):NaN;
  }catch(e){console.log('[E-extra] '+String(e&&e.message||e))}
  console.log(`[E] C*=${isFinite(out.Cstar)?out.Cstar.toFixed(6):'n/a'} selected=${out.selected.map(r=>r.label).join(',')||'none'} weights_sum=${out.weights.reduce((s,r)=>s+r.w,0)}`);
  renderTables();refreshButtons();refreshMeta();toast(T('calculated'));
};
function doCalcE(silent){
  if(state.stocks.length<2||!state.index||winBlocked())return false;
  readBetas();
  const core=computeCore(true);if(core.error)return false;
  const items=[],excluded=[],byId=new Map();
  core.rows.forEach((r,i)=>{
    const it={key:r.stockId,label:r.label,exI:r.exI,beta:r.beta,sei:r.sei,trey:r.trey,given:r.given};
    byId.set(r.stockId,it);
    if(!(r.beta>0))excluded.push({label:r.label,reason:'β ≤ 0'});
    else if(!(r.sei>0))excluded.push({label:r.label,reason:'σ²_ei ≤ 0'});
    else items.push(it);
  });
  const out=eltonGruber(items,core.vm);
  const selKeys=new Set(out.selected.map(r=>r.key));
  const rejected=[...excluded];
  out.ranked.forEach(r=>{
    if(selKeys.has(r.key))return;
    if(r.exI<0)rejected.push({label:r.label,reason:'negative excess return'});
    else rejected.push({label:r.label,reason:`Treynor ≤ cutoff (Treynor = ${r.trey.toFixed(4)}, C_i = ${r.ci.toFixed(4)})`});
  });
  state.resE={...out,excluded,rejected,k:core.k,rfAnn:core.rfAnn,vm:core.vm,total:core.rows.length,
    weights:out.weights.map(w=>({...byId.get(w.key),z:w.z,w:w.w}))};
  try{
    const byLbl=new Map(core.rows.map(r=>[r.label,r]));
    const rets=alignedStockRets(state.win,state.stocks);
    const cov=sampleCovMat(rets);
    const l2i=new Map(state.stocks.map((s,i)=>[s.label||s.fileName,i]));
    const vm2=simModelVar(state.resE.weights,byLbl,core.vm);
    state.resE.varModel=vm2;
    state.resE.sdModelAnn=isFinite(vm2)&&vm2>0?Math.sqrt(vm2)*Math.sqrt(core.k):NaN;
    state.resE.sharpeModelAnn=(isFinite(state.resE.exP)&&isFinite(vm2)&&vm2>0)?(state.resE.exP/Math.sqrt(vm2))*Math.sqrt(core.k):NaN;
    const vr=realizedVarForWeights(state.resE.weights,cov,l2i);
    state.resE.varReal=vr;
    state.resE.sdRealAnn=isFinite(vr)&&vr>0?Math.sqrt(vr)*Math.sqrt(core.k):NaN;
    state.resE.sharpeRealAnn=(isFinite(state.resE.exP)&&isFinite(vr)&&vr>0)?(state.resE.exP/Math.sqrt(vr))*Math.sqrt(core.k):NaN;
  }catch(e){console.log('[E-extra] '+String(e&&e.message||e))}
  return true;
}
function doCalcF(silent){
  if(state.stocks.length<2)return false;
  readBetas();
  const rfAnn=getRf();if(!isFinite(rfAnn)){if(!silent)showMsg('msgF',T('needRf'),true);return false}
  const winUse=(state.index&&!winBlocked())?state.win:stocksWin();
  if(!winUse||winUse.error||winUse.n<30){if(!silent)showMsg('msgF',T('needWin'),true);return false}
  const k=winUse.k,rfPer=rfAnn/100/k;
  const rets=alignedStockRets(winUse,state.stocks);
  const sds=rets.map(r=>Math.sqrt(svar(r))),means=rets.map(r=>mean(r));
  const calc=avgPairwiseCorr(rets,sds);
  const ov=getRhoOverride();
  const rho=isFinite(ov)?ov:calc.rho,rhoGiven=isFinite(ov);
  if(!(rho>0&&rho<1)){state.resF=null;renderF();renderCmp();refreshButtons();refreshMeta();
    if(!silent)showMsg('msgF','The constant correlation method needs an average correlation between 0 and 1',true);
    console.log(`[F] rho_bar=${rho} pairs=${calc.pairs} -> BLOCKED (needs 0<rho<1)`);
    return false}
  if(!silent)showMsg('msgF','',false);
  const items=state.stocks.map((s,i)=>({key:s.id,label:s.label||s.fileName,Rbar:means[i],sigma:sds[i],ex:means[i]-rfPer}));
  const out=ccmModel(items,rho);
  const selKeys=new Set(out.selected.map(r=>r.key));
  const rejected=out.excluded.map(r=>({label:r.label,reason:'\u03C3 = 0'}));
  out.ranked.forEach(r=>{
    if(selKeys.has(r.key))return;
    if(r.ex<0)rejected.push({label:r.label,reason:'Negative excess return'});
    else rejected.push({label:r.label,reason:`Ratio \u2264 cutoff (ratio = ${r.ratio.toFixed(4)}, C_i = ${r.ci.toFixed(4)})`});
  });
  const cov=sampleCovMat(rets);
  const l2i=new Map(state.stocks.map((s,i)=>[s.label||s.fileName,i]));
  const vr=realizedVarForWeights(out.weights,cov,l2i);
  const sdRAnn=isFinite(vr)&&vr>0?Math.sqrt(vr)*Math.sqrt(k):NaN;
  const sharpeRAnn=(isFinite(out.exP)&&isFinite(vr)&&vr>0)?(out.exP/Math.sqrt(vr))*Math.sqrt(k):NaN;
  state.resF={...out,rejected,total:state.stocks.length,k,rfAnn,rfPer,rho,rhoGiven,pairs:calc.pairs,
    win:{start:winUse.start,end:winUse.end,n:winUse.n,freq:winUse.freq},means,sds,
    varR:vr,sdR:sdRAnn,sharpeR:sharpeRAnn,sdRAnn,sharpeRAnn,varRPer:vr};
  console.log(`[F] rho_bar=${rho.toFixed(6)}${rhoGiven?' (Given)':' (Calculated)'} pairs=${calc.pairs} C*=${isFinite(out.Cstar)?out.Cstar.toFixed(6):'n/a'} selected=${out.selected.map(r=>r.label).join(',')||'none'}`);
  return true;
}
el('rfAnnual').addEventListener('input',()=>{if(el('rfAnnualF')&&document.activeElement!==el('rfAnnualF'))el('rfAnnualF').value=el('rfAnnual').value;refreshButtons()});
el('simView').onchange=e=>{state.simView=e.target.value;renderD()};
if(el('rfAnnualF')){el('rfAnnualF').addEventListener('input',()=>{el('rfAnnual').value=el('rfAnnualF').value;refreshButtons()});
  el('rhoOverride').addEventListener('input',()=>{refreshButtons()})}
el('btnCalcF').onclick=()=>{if(doCalcF(false)){renderTables();refreshButtons();refreshMeta();toast(T('calculated'))}};
el('btnCalcBoth').onclick=()=>{
  const a=doCalcE(true),b=doCalcF(true);
  if(!a&&!b){toast(T('needCalc'),true);return}
  renderTables();refreshButtons();refreshMeta();toast(T('calculated'));
  console.log(`[both] SIM ${a?'ok':'skip'} | CCM ${b?'ok':'skip'}`);
};
el('btnCopyF').onclick=async()=>{
  const parts=[];
  const r=el('ccmRankTable');
  if(r)parts.push([...r.rows].map(tr=>[...tr.cells].map(td=>td.innerText.replace(/\n/g,' ').trim()).join('\t')).join('\n'));
  const w2=el('ccmWTable');
  if(w2)parts.push([...w2.rows].map(tr=>[...tr.cells].map(td=>td.innerText.replace(/\n/g,' ').trim()).join('\t')).join('\n'));
  try{await navigator.clipboard.writeText(parts.join('\n\n'));toast(T('copied'))}
  catch(e){toast(T('copyFail'),true)}
};
el('btnCopyCmp').onclick=async()=>{
  const parts=[];
  const w2=el('cmpWTable');
  if(w2)parts.push([...w2.rows].map(tr=>[...tr.cells].map(td=>td.innerText.replace(/\n/g,' ').trim()).join('\t')).join('\n'));
  const m=el('cmpMTable');
  if(m)parts.push([...m.rows].map(tr=>[...tr.cells].map(td=>td.innerText.replace(/\n/g,' ').trim()).join('\t')).join('\n'));
  try{await navigator.clipboard.writeText(parts.join('\n\n'));toast(T('copied'))}
  catch(e){toast(T('copyFail'),true)}
};
async function copyTable(id){
  const t=el(id);if(!t)return;
  const lines=[...t.rows].map(tr=>[...tr.cells].map(td=>td.innerText.replace(/\n/g,' ').trim()).join('\t')).join('\n');
  try{await navigator.clipboard.writeText(lines);toast(T('copied'))}
  catch(e){toast(T('copyFail'),true)}
}
el('btnCopyA').onclick=()=>copyTable('aTable');
el('btnCopyB').onclick=()=>copyTable('bTable');
el('btnCopyC').onclick=()=>copyTable('eqTable');
el('btnCopyD').onclick=()=>copyTable('simTable');
el('btnCopyE').onclick=async()=>{
  const f=el('finalTable');
  const parts=[];
  if(f)parts.push([...f.rows].map(tr=>[...tr.cells].map(td=>td.innerText.replace(/\n/g,' ').trim()).join('\t')).join('\n'));
  const r=el('rankTable');
  if(r)parts.push([...r.rows].map(tr=>[...tr.cells].map(td=>td.innerText.replace(/\n/g,' ').trim()).join('\t')).join('\n'));
  try{await navigator.clipboard.writeText(parts.join('\n\n'));toast(T('copied'))}
  catch(e){toast(T('copyFail'),true)}
};
/* ============ excel export (live formulas) ============ */
function safeName(s){return String(s||'file').replace(/[\\/:*?"<>|]/g,'_').trim().slice(0,60)||'file'}
function todayISO(){const d=new Date();return fmtISO(d)}
function setRef(ws,c0,r0,c1,r1){ws['!ref']=XLSX.utils.encode_range({s:{c:c0,r:r0},e:{c:c1,r:r1}})}
function colL(c){let s='';c++;while(c>0){const m=(c-1)%26;s=String.fromCharCode(65+m)+s;c=Math.floor((c-1)/26)}return s}
function buildReturns(wb){
  const w=state.win,S=state.stocks,idxL=el('labelIndex').value||'Index';
  const priceCols=S.map((_,i)=>colL(1+i));
  const idxPCol=colL(1+S.length);
  const retCols=S.map((_,i)=>colL(2+S.length+i));
  const idxRCol=colL(2+2*S.length);
  const hdr=['Date',...S.map(s=>s.label||s.fileName),idxL,...S.map(s=>'Ret '+(s.label||s.fileName)),'Ret '+idxL];
  const ws=XLSX.utils.aoa_to_sheet([hdr]);
  const idxMap=new Map(state.index.entries.map(e=>[e.d.getTime(),e.p]));
  const maps=S.map(s=>new Map(s.entries.map(e=>[e.d.getTime(),e.p])));
  w.dates.forEach((t,i)=>{
    const r=i+2;
    ws['A'+r]={t:'s',v:fmtISO(new Date(t))};
    S.forEach((s,j)=>{
      const mp=new Map(s.entries.map(e=>[e.d.getTime(),e.p]));
      ws[priceCols[j]+r]={t:'n',v:mp.get(t)};
    });
    ws[idxPCol+r]={t:'n',v:idxMap.get(t)};
    S.forEach((s,j)=>{
      ws[retCols[j]+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${priceCols[j]}${r}=0,"",${priceCols[j]}${r}/${priceCols[j]}${r-1}-1)`};
    });
    ws[idxRCol+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${idxPCol}${r}=0,"",${idxPCol}${r}/${idxPCol}${r-1}-1)`};
  });
  const last=w.dates.length+1;
  setRef(ws,0,0,hdr.length-1,w.dates.length);
  XLSX.utils.book_append_sheet(wb,ws,'Returns');
  return{priceCols,idxPCol,retCols,idxRCol,first:2,last,retFirst:3,S,maps};
}
function addWindowSheet(wb){
  const w=state.win;
  const ws=XLSX.utils.aoa_to_sheet([['Item','Value'],
    ['Start date',fmtISO(w.start)],['End date',fmtISO(w.end)],['n (return observations)',w.n],
    ['Frequency',w.freq],['k',w.k],['Limiting file',w.limitedBy]]);
  ws['!cols']=[{wch:24},{wch:22}];
  XLSX.utils.book_append_sheet(wb,ws,'Window');
}
function tableRange(retCol,last){return `Returns!${retCol}3:${retCol}${last}`}
el('btnDlA').onclick=()=>{
  try{
    if(!state.resA)return;
    const wb=XLSX.utils.book_new();const R=buildReturns(wb);addWindowSheet(wb);
    const ws=XLSX.utils.aoa_to_sheet([]);
    ws['A1']={t:'s',v:'k (periods per year, editable)'};ws['B1']={t:'n',v:state.resA.k};
    const H=T('thAB');H.forEach((h,c)=>{ws[colL(c)+'3']={t:'s',v:h}});
    state.resA.rows.forEach((r,i)=>{
      const er=i+4,Rg=tableRange(R.retCols[i],R.last);
      ws['A'+er]={t:'s',v:r.label};
      ws['B'+er]={t:'n',f:`COUNT(${Rg})`};ws['C'+er]={t:'n',f:`VAR.S(${Rg})`};
      ws['D'+er]={t:'n',f:`IF(ISNUMBER(C${er}),SQRT(C${er}),"")`};
      ws['E'+er]={t:'n',f:`C${er}*$B$1`};ws['F'+er]={t:'n',f:`D${er}*SQRT($B$1)`};
    });
    setRef(ws,0,0,5,state.resA.rows.length+2);ws['!cols']=[{wch:16},{wch:8},{wch:14},{wch:14},{wch:14},{wch:14}];
    XLSX.utils.book_append_sheet(wb,ws,'Stocks');
    XLSX.writeFile(wb,`stocks_variance_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
};
el('btnDlB').onclick=()=>{
  try{
    if(!state.resB)return;
    const wb=XLSX.utils.book_new();const R=buildReturns(wb);addWindowSheet(wb);
    const ws=XLSX.utils.aoa_to_sheet([]);
    ws['A1']={t:'s',v:'k (periods per year, editable)'};ws['B1']={t:'n',v:state.win.k};
    const H=T('thAB');H.forEach((h,c)=>{ws[colL(c)+'3']={t:'s',v:h}});
    const Rg=tableRange(R.idxRCol,R.last),er=4;
    ws['A'+er]={t:'s',v:state.resB.label};
    ws['B'+er]={t:'n',f:`COUNT(${Rg})`};ws['C'+er]={t:'n',f:`VAR.S(${Rg})`};
    ws['D'+er]={t:'n',f:`IF(ISNUMBER(C${er}),SQRT(C${er}),"")`};
    ws['E'+er]={t:'n',f:`C${er}*$B$1`};ws['F'+er]={t:'n',f:`D${er}*SQRT($B$1)`};
    setRef(ws,0,0,5,3);ws['!cols']=[{wch:16},{wch:8},{wch:14},{wch:14},{wch:14},{wch:14}];
    XLSX.utils.book_append_sheet(wb,ws,'Index');
    XLSX.writeFile(wb,`index_variance_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
};
el('btnDlC').onclick=()=>{
  try{
    if(!state.resC)return;
    const wb=XLSX.utils.book_new();const R=buildReturns(wb);addWindowSheet(wb);
    const ws=XLSX.utils.aoa_to_sheet([]);
    ws['A1']={t:'s',v:'σ²_m (index variance, editable input)'};ws['B1']={t:'n',v:state.resC.vm};
    ECH.forEach((h,c)=>{ws[colL(c)+'3']={t:'s',v:h}});
    ws[colL(11)+'3']={t:'s',v:'Given β (editable, blank = calculated)'};
    state.resC.rows.forEach((r,i)=>{
      const er=i+4,dR=tableRange(R.retCols[i],R.last),eR=tableRange(R.idxRCol,R.last);
      ws['A'+er]={t:'s',v:r.label};
      ws['B'+er]={t:'n',f:`COUNT(${dR})`};ws['C'+er]={t:'n',f:`VAR.S(${dR})`};ws['D'+er]={t:'n',f:`$B$1`};
      ws['E'+er]={t:'n',f:`COVARIANCE.S(${dR},${eR})`};
      ws['F'+er]={t:'n',f:`IF(${colL(11)}${er}<>"",${colL(11)}${er},SLOPE(${dR},${eR}))`};
      ws['G'+er]={t:'n',f:`F${er}^2`};ws['H'+er]={t:'n',f:`G${er}*D${er}`};ws['I'+er]={t:'n',f:`C${er}-H${er}`};
      ws['J'+er]={t:'n',f:`RSQ(${dR},${eR})`};ws['K'+er]={t:'n',f:`IF(C${er}=0,"",I${er}/C${er})`};
      ws[colL(11)+er]=r.given?{t:'n',v:r.beta}:{t:'s',v:''};
    });
    setRef(ws,0,0,11,state.resC.rows.length+2);
    XLSX.utils.book_append_sheet(wb,ws,'Equation');
    XLSX.writeFile(wb,`equation_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
};
el('btnDlD').onclick=()=>{
  try{
    if(!state.resD)return;
    const wb=XLSX.utils.book_new();const R=buildReturns(wb);addWindowSheet(wb);
    const ws=XLSX.utils.aoa_to_sheet([]);
    ws['A1']={t:'s',v:'r_f annual % (editable input)'};ws['B1']={t:'n',v:state.resD.rfAnn};
    ws['C1']={t:'s',v:'k'};ws['D1']={t:'n',v:state.resD.k};
    SIMH.forEach((h,c)=>{ws[colL(c)+'3']={t:'s',v:h}});
    ws[colL(11)+'3']={t:'s',v:'Given β (editable, blank = calculated)'};
    state.resD.rows.forEach((r,i)=>{
      const er=i+4,dR=tableRange(R.retCols[i],R.last),eR=tableRange(R.idxRCol,R.last);
      ws['A'+er]={t:'s',v:r.label};
      ws['B'+er]={t:'n',f:`COUNT(${dR})`};
      ws['C'+er]={t:'n',f:`AVERAGE(${dR})`};ws['D'+er]={t:'n',f:`AVERAGE(${eR})`};
      ws['E'+er]={t:'n',f:`$B$1/100/$D$1`};
      ws['F'+er]={t:'n',f:`C${er}-E${er}`};ws['G'+er]={t:'n',f:`D${er}-E${er}`};
      ws['H'+er]={t:'n',f:`IF(${colL(11)}${er}<>"",${colL(11)}${er},SLOPE(${dR},${eR}))`};
      ws['I'+er]={t:'n',f:`F${er}-H${er}*G${er}`};
      ws['J'+er]={t:'n',f:`VAR.S(${dR})-H${er}^2*VAR.S(${eR})`};
      ws['K'+er]={t:'n',f:`IF(H${er}<=0,"n/a (β ≤ 0)",F${er}/H${er})`};
      ws[colL(11)+er]=r.given?{t:'n',v:r.beta}:{t:'s',v:''};
    });
    setRef(ws,0,0,11,state.resD.rows.length+2);
    XLSX.utils.book_append_sheet(wb,ws,'Single Index Model');
    XLSX.writeFile(wb,`single_index_model_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
};
el('btnDlE').onclick=()=>{
  try{
    if(!state.resE)return;
    const E=state.resE;
    const wb=XLSX.utils.book_new();const R=buildReturns(wb);addWindowSheet(wb);
    const wf=XLSX.utils.aoa_to_sheet([['Stock','Weight x_i (%)','β_i','Treynor ratio','σ²_ei']]);
    E.weights.forEach((r,i)=>{
      const er=i+2;
      wf['A'+er]={t:'s',v:r.label};wf['B'+er]={t:'n',v:r.w};
      wf['C'+er]={t:'n',v:r.beta};wf['D'+er]={t:'n',v:r.trey};wf['E'+er]={t:'n',v:r.sei};
    });
    const br=E.weights.length+3;
    wf['A'+br]={t:'s',v:'C*'};wf['B'+br]={t:'n',v:E.Cstar};
    wf['A'+(br+1)]={t:'s',v:'β_p'};wf['B'+(br+1)]={t:'n',v:E.bp};
    wf['A'+(br+2)]={t:'s',v:'Excess (per period)'};wf['B'+(br+2)]={t:'n',v:E.exP};
    wf['A'+(br+3)]={t:'s',v:'Excess (annualized)'};wf['B'+(br+3)]={t:'n',v:E.exP*E.k};
    wf['A'+(br+4)]={t:'s',v:'Treynor_p (per period)'};wf['B'+(br+4)]={t:'n',v:E.exP/E.bp};
    wf['A'+(br+5)]={t:'s',v:'Treynor_p (annualized)'};wf['B'+(br+5)]={t:'n',v:E.exP*E.k/E.bp};
    wf['!cols']=[{wch:16},{wch:14},{wch:12},{wch:14},{wch:14}];
    XLSX.utils.book_append_sheet(wb,wf,'Final Result');
    const wr=XLSX.utils.aoa_to_sheet([]);
    wr['A1']={t:'s',v:'σ²_m (editable input)'};wr['B1']={t:'n',v:E.vm};
    wr['A2']={t:'s',v:'r_f annual % (editable)'};wr['B2']={t:'n',v:E.rfAnn};
    wr['C2']={t:'s',v:'k'};wr['D2']={t:'n',v:E.k};
    const RH=['Rank','Stock','Treynor','(R−Rf)β/σ²_e','β²/σ²_e','cum Σ(R−Rf)β/σ²_e','cum Σβ²/σ²_e','C_i','ex','beta','sei','Given β'];
    RH.forEach((h,c)=>{wr[colL(c)+'4']={t:'s',v:h}});
    E.ranked.forEach((r,i)=>{
      const er=i+5;
      const si=state.stocks.findIndex(s=>s.id===r.key);
      const dR=tableRange(R.retCols[si],R.last),eR=tableRange(R.idxRCol,R.last);
      wr['A'+er]={t:'n',v:r.rank};wr['B'+er]={t:'s',v:r.label};
      wr['I'+er]={t:'n',f:`AVERAGE(${dR})-$B$2/100/$D$2`};
      wr['L'+er]=r.given?{t:'n',v:r.beta}:{t:'s',v:''};
      wr['J'+er]={t:'n',f:`IF(L${er}<>"",L${er},SLOPE(${dR},${eR}))`};
      wr['K'+er]={t:'n',f:`VAR.S(${dR})-J${er}^2*VAR.S(${eR})`};
      wr['C'+er]={t:'n',f:`IF(J${er}<=0,"n/a",I${er}/J${er})`};
      wr['D'+er]={t:'n',f:`I${er}*J${er}/K${er}`};wr['E'+er]={t:'n',f:`J${er}^2/K${er}`};
      wr['F'+er]={t:'n',f:`SUM(D$5:D${er})`};
      wr['G'+er]={t:'n',f:`SUM(E$5:E${er})`};
      wr['H'+er]={t:'n',f:`$B$1*F${er}/(1+$B$1*G${er})`};
    });
    setRef(wr,0,0,11,E.ranked.length+3);
    XLSX.utils.book_append_sheet(wb,wr,'Ranking');
    const ww=XLSX.utils.aoa_to_sheet([]);
    ww['A1']={t:'s',v:'C* (cutoff, editable)'};ww['B1']={t:'n',v:E.Cstar};
    ['Stock','z_i','Weight x_i'].forEach((h,c)=>{ww[colL(c)+'3']={t:'s',v:h}});
    E.selected.forEach((s,i)=>{
      const er=i+4;
      const rr=E.ranked.findIndex(r=>r.key===s.key)+5;
      ww['A'+er]={t:'s',v:s.label};
      ww['B'+er]={t:'n',f:`Ranking!J${rr}/Ranking!K${rr}*(Ranking!C${rr}-$B$1)`};
      ww['C'+er]={t:'n',f:`B${er}/SUM(B$4:B$${E.selected.length+3})`};
    });
    setRef(ww,0,0,2,E.selected.length+2);
    XLSX.utils.book_append_sheet(wb,ww,'Weights');
    XLSX.writeFile(wb,`optimal_portfolio_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
};
function buildReturnsForWin(wb,winUse,withIndex){
  const S=state.stocks;
  const priceCols=S.map((_,i)=>colL(1+i));
  const idxPCol=withIndex?colL(1+S.length):null;
  const base=withIndex?2+S.length:1+S.length;
  const retCols=S.map((_,i)=>colL(base+i));
  const idxRCol=withIndex?colL(base+S.length):null;
  const hdr=['Date',...S.map(s=>s.label||s.fileName)];
  if(withIndex)hdr.push(el('labelIndex').value||'Index');
  hdr.push(...S.map(s=>'Ret '+(s.label||s.fileName)));
  if(withIndex)hdr.push('Ret '+(el('labelIndex').value||'Index'));
  const ws=XLSX.utils.aoa_to_sheet([hdr]);
  const maps=S.map(s=>new Map(s.entries.map(e=>[e.d.getTime(),e.p])));
  const idxMap=withIndex?new Map(state.index.entries.map(e=>[e.d.getTime(),e.p])):null;
  winUse.dates.forEach((t,i)=>{
    const r=i+2;
    ws['A'+r]={t:'s',v:fmtISO(new Date(t))};
    maps.forEach((mp,j)=>{ws[priceCols[j]+r]={t:'n',v:mp.get(t)}});
    if(withIndex)ws[idxPCol+r]={t:'n',v:idxMap.get(t)};
    retCols.forEach((rc,j)=>{ws[rc+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${priceCols[j]}${r}=0,"",${priceCols[j]}${r}/${priceCols[j]}${r-1}-1)`}});
    if(withIndex)ws[idxRCol+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${idxPCol}${r}=0,"",${idxPCol}${r}/${idxPCol}${r-1}-1)`};
  });
  setRef(ws,0,0,hdr.length-1,winUse.dates.length);
  XLSX.utils.book_append_sheet(wb,ws,'Returns');
  return{retCols,idxRCol,last:winUse.dates.length+1,priceCols};
}
function addCCMSheets(wb,R,winUse,F){
  const wr=XLSX.utils.aoa_to_sheet([]);
  wr['A1']={t:'s',v:'rho_bar (editable input)'};wr['B1']={t:'n',v:F.rho};
  wr['A2']={t:'s',v:'r_f annual % (editable)'};wr['B2']={t:'n',v:F.rfAnn};
  wr['C2']={t:'s',v:'k'};wr['D2']={t:'n',v:F.k};
  const RH=['Rank','Stock','(Rbar-Rf)/sigma','Cum SUM','C_i','Rbar','sigma'];
  RH.forEach((h,c)=>{wr[colL(c)+'4']={t:'s',v:h}});
  F.ranked.forEach((r,i)=>{
    const er=i+5;
    const si=state.stocks.findIndex(s=>(s.label||s.fileName)===r.label);
    const dR=`Returns!${R.retCols[si]}3:${R.retCols[si]}${R.last}`;
    wr['A'+er]={t:'n',v:r.rank};wr['B'+er]={t:'s',v:r.label};
    wr['F'+er]={t:'n',f:`AVERAGE(${dR})`};
    wr['G'+er]={t:'n',f:`STDEV.S(${dR})`};
    wr['C'+er]={t:'n',f:`IF(G${er}=0,"",(F${er}-$B$2/100/$D$2)/G${er})`};
    wr['D'+er]={t:'n',f:`SUM(C$5:C${er})`};
    wr['E'+er]={t:'n',f:`$B$1/(1-$B$1+A${er}*$B$1)*D${er}`};
  });
  setRef(wr,0,0,6,F.ranked.length+3);
  XLSX.utils.book_append_sheet(wb,wr,'CCM Ranking');
  const ww=XLSX.utils.aoa_to_sheet([]);
  ww['A1']={t:'s',v:'C* (cutoff, editable)'};ww['B1']={t:'n',v:F.Cstar};
  ww['A2']={t:'s',v:'rho_bar'};ww['B2']={t:'n',v:F.rho};
  ['Stock','sigma_i','(Rbar-Rf)/sigma','z_i','Weight x_i'].forEach((h,c)=>{ww[colL(c)+'3']={t:'s',v:h}});
  F.selected.forEach((s,i)=>{
    const er=i+4;
    const rr=F.ranked.findIndex(r=>r.key===s.key)+5;
    ww['A'+er]={t:'s',v:s.label};
    ww['B'+er]={t:'n',f:`'CCM Ranking'!G${rr}`};
    ww['C'+er]={t:'n',f:`'CCM Ranking'!C${rr}`};
    ww['D'+er]={t:'n',f:`1/((1-$B$2)*B${er})*(C${er}-$B$1)`};
    ww['E'+er]={t:'n',f:`D${er}/SUM(D$4:D$${F.selected.length+3})`};
  });
  setRef(ww,0,0,4,F.selected.length+2);
  XLSX.utils.book_append_sheet(wb,ww,'CCM Weights');
}
function addComparisonSheet(wb){
  const cmp=buildComparison();if(!cmp)return;
  const{E,F,k,rows}=cmp;
  const ws=XLSX.utils.aoa_to_sheet([['Stock','SIM weight (%)','CCM weight (%)','Difference (pp)']]);
  rows.forEach((r,i)=>{
    const er=i+2;
    ws['A'+er]={t:'s',v:r.label};
    ws['B'+er]=r.sim==null?{t:'s',v:'-'}:{t:'n',v:r.sim};
    ws['C'+er]=r.ccm==null?{t:'s',v:'-'}:{t:'n',v:r.ccm};
    ws['D'+er]={t:'n',f:`IF(C${er}="-","",IF(B${er}="-",C${er},C${er}-B${er}))`};
  });
  let br=rows.length+3;
  const met=[
    ['Stocks selected',E.weights.length,F.weights.length],
    ['Cutoff C*',E.Cstar,F.Cstar],
    ['Expected excess (ann)',E.exP*k,F.exP*k],
    ['Std (ann, model)',E.sdModelAnn,isFinite(F.sdM)?F.sdM*Math.sqrt(k):NaN],
    ['Std (ann, realized)',E.sdRealAnn,F.sdRAnn],
    ['Sharpe (ann, model)',E.sharpeModelAnn,isFinite(F.sharpeM)?F.sharpeM*Math.sqrt(k):NaN],
    ['Sharpe (ann, realized)',E.sharpeRealAnn,F.sharpeRAnn],
    ['Portfolio beta',E.bp,'n/a']
  ];
  ws['A'+br]={t:'s',v:'Metric'};ws['B'+br]={t:'s',v:'Single Index Model'};ws['C'+br]={t:'s',v:'Constant Correlation Model'};br++;
  met.forEach(m=>{
    ws['A'+br]={t:'s',v:m[0]};
    ws['B'+br]=typeof m[1]==='number'?{t:'n',v:m[1]}:{t:'s',v:String(m[1])};
    ws['C'+br]=typeof m[2]==='number'?{t:'n',v:m[2]}:{t:'s',v:String(m[2])};
    br++;
  });
  setRef(ws,0,0,3,br-1);ws['!cols']=[{wch:24},{wch:18},{wch:22},{wch:16}];
  XLSX.utils.book_append_sheet(wb,ws,'Comparison');
}
el('btnDlF').onclick=()=>{
  try{
    if(!state.resF)return;
    const F=state.resF;
    const winUse=(state.index&&state.win&&!state.win.error&&state.win.n>=30)?state.win:(F.win&&F.win.dates?{...F.win,dates:stocksWin().dates}:stocksWin());
    const wReal=stocksWin()&&state.index&&!winBlocked()?state.win:stocksWin();
    const wb=XLSX.utils.book_new();
    const R=buildReturnsForWin(wb,wReal,!!(state.index&&!winBlocked()));
    const ws0=XLSX.utils.aoa_to_sheet([['Item','Value'],['Start date',fmtISO(wReal.start)],['End date',fmtISO(wReal.end)],['n (return observations)',wReal.n],['Frequency',wReal.freq],['k',wReal.k],['Limiting file',wReal.limitedBy||'']]);
    ws0['!cols']=[{wch:24},{wch:22}];
    XLSX.utils.book_append_sheet(wb,ws0,'Window');
    addCCMSheets(wb,R,wReal,F);
    XLSX.writeFile(wb,`ccm_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
};
el('btnDlCmp').onclick=()=>{
  try{
    if(!state.resE||!state.resF)return;
    const E=state.resE,F=state.resF;
    const wb=XLSX.utils.book_new();
    const R=buildReturns(wb);addWindowSheet(wb);
    const wf=XLSX.utils.aoa_to_sheet([['Stock','Weight SIM','beta','Treynor','sei']]);
    E.weights.forEach((r,i)=>{const er=i+2;wf['A'+er]={t:'s',v:r.label};wf['B'+er]={t:'n',v:r.w};wf['C'+er]={t:'n',v:r.beta};wf['D'+er]={t:'n',v:r.trey};wf['E'+er]={t:'n',v:r.sei}});
    XLSX.utils.book_append_sheet(wb,wf,'SIM Final');
    const wr=XLSX.utils.aoa_to_sheet([]);
    wr['A1']={t:'s',v:'sigma2_m'};wr['B1']={t:'n',v:E.vm};
    wr['A2']={t:'s',v:'rf annual %'};wr['B2']={t:'n',v:E.rfAnn};
    wr['C2']={t:'s',v:'k'};wr['D2']={t:'n',v:E.k};
    ['Rank','Stock','Treynor','c4','c5','cum6','cum7','Ci'].forEach((h,c)=>{wr[colL(c)+'4']={t:'s',v:h}});
    E.ranked.forEach((r,i)=>{const er=i+5;wr['A'+er]={t:'n',v:r.rank};wr['B'+er]={t:'s',v:r.label};wr['C'+er]={t:'n',v:r.trey};wr['D'+er]={t:'n',v:r.c4};wr['E'+er]={t:'n',v:r.c5};wr['F'+er]={t:'n',v:r.cum6};wr['G'+er]={t:'n',v:r.cum7};wr['H'+er]={t:'n',v:r.ci}});
    XLSX.utils.book_append_sheet(wb,wr,'SIM Ranking');
    addCCMSheets(wb,{retCols:R.retCols,last:R.last},state.win,F);
    addComparisonSheet(wb);
    XLSX.writeFile(wb,`comparison_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
};
/* ============ new tabs: Portfolio + Sectors (share engine, own files) ============ */
const I18N2={
ar:{tabPf:"المحفظة",tabSec:"اختيار الأفضل لكل قطاع",tabAdv:"متقدم",
pfTitle:"محفظة مبسطة",pfDzS:"اسحب ملفات الأسهم إلى هنا (ملف لكل شركة)، أو",pfUpS:"اختر ملفات الأسهم",
pfDzI:"اسحب ملف المؤشر إلى هنا، أو",pfUpI:"اختر ملف المؤشر",
pfRf:"معدل العائد الخالي من المخاطر (سنوي %):",pfRfHint:"مثال: عائد أذون الخزانة لأجل 91 يوماً في مصر",
pfGo:"احسب محفظتي",pfWin:"الفترة المستخدمة من {s} إلى {e} ({d} يوم)",
pfFreqBad:"أحد الملفات {minor} وباقي الملفات {major}: يرجى رفع ملفات {major}.",
pfNoCommon:"لا توجد تواريخ مشتركة بين الملفات. تحقق من الفترات الزمنية.",
pfSmallN:"البيانات المشتركة غير كافية (n = {n}). جرّب ملفات بفترة مشتركة أطول.",
pfNeed:"أضف ملفي سهمين على الأقل وملف المؤشر ومعدل العائد.",
pfBadFile:"تعذّر قراءة هذا الملف. يرجى تنزيل البيانات CSV أو Excel من Investing.com.",
pdfMsg:"PDF files can't be read reliably. Please download the data as CSV or Excel from Investing.com (Historical Data > Download).",
pfHead:"استثمر في {x} من أصل {y} أسهم",pfNone:"لا يوجد سهم مؤهل للمحفظة خلال هذه الفترة",
pfThS:"السهم",pfThW:"الوزن (%)",pfAnnEx:"العائد الزائد المتوقع سنوياً",pfBeta:"بيتا المحفظة",
pfBetaExp:"تتحرك بنسبة {x}% مقابل كل 1% يتحركه السوق",pfTrey:"نسبة ترينور (سنوية)",
pfNotSel:"الأسهم غير المختارة",pfDl:"تحميل Excel",pfXlsx:"تصدير Excel منسق",pfCopy:"نسخ النتيجة",pfStart:"البدء من جديد",
pfEdit:"تعديل المدخلات",pfDetails:"عرض التفاصيل الكاملة",
pfFoot:"بناءً على بيانات تاريخية. تحليل أكاديمي وليس نصيحة استثمارية.",
pfNoVar:"بيانات السوق ثابتة خلال هذه الفترة ولا يمكن الحساب.",
rNeg:"حقق عائداً أقل من العائد الخالي من المخاطر",rBeta:"يتحرك عكس السوق (بيتا سالبة)",
rCut:"غير جذاب بما يكفي مقارنة بمعدل القطع",
secTitle:"اختيار الأفضل لكل قطاع",secDzI:"اسحب ملف المؤشر إلى هنا، أو",secUpI:"اختر ملف المؤشر",
secRf:"معدل العائد الخالي من المخاطر (سنوي %):",secRfHint:"مثال: عائد أذون الخزانة لأجل 91 يوماً في مصر",
secArea:"القطاعات",secAdd:"إضافة قطاع",secGo:"اعثر على الأفضل في كل قطاع",
secNeed:"أدخل معدل العائد الخالي من المخاطر وأضف قطاعاً واحداً على الأقل يحوي مرشحين أو أكثر.",
secIdxOpt:"ملف المؤشر اختياري — لازم لعمود نموذج المؤشر الواحد فقط.",
secSimReason:"أعلى عائد لكل وحدة مخاطرة سوق بين المرشحين الـ {n}.",
secCcmReason:"أعلى عائد لكل وحدة مخاطرة كلية بين المرشحين الـ {n}.",
secNeedsIdx:"يحتاج ملف المؤشر",
secAgree:"النموذجان متفقان: {w}",
secDisagree:"النموذجان مختلفان في هذا القطاع",
secPickOne:"اختر أحدهما أو اختر يدوياً أدناه",
secFinal:"الاختيار النهائي",
secFollowSim:"اتباع نموذج المؤشر الواحد",
secFollowCcm:"اتباع نموذج الارتباط الثابت",
secManual:"اختيار يدوي",
secApplyAll:"تطبيق على كل القطاعات",
secReset:"تصفير الاختيارات",
secSummary:"{n} قطاعات | متفقان في {a} | مختلفان في {d}",
secNamePh:"اسم القطاع، مثلاً: الأسمنت",secUp:"اختر الملفات",secDz:"اسحب ملفات المرشحين إلى هنا، أو",
secRmSec:"حذف القطاع",secWin:"الفائز: {w}",
secWinReason:"أعلى عائد لكل وحدة مخاطرة سوق بين المرشحين الـ {n}.",secOnly:"المرشح الوحيد في هذا القطاع.",
secNone:"لا يوجد سهم صالح في هذا القطاع",secNoCand:"لا يوجد مرشحون في هذا القطاع.",
secNoData:"البيانات المشتركة غير كافية في هذا القطاع.",
secNote:"تتم مقارنة كل قطاع على تواريخه المشتركة الخاصة، لذا قد يُختار الفائز في قطاع على فترة مختلفة عن قطاع آخر.",
secDl:"تحميل Excel",secCopy:"نسخ الجدول",secSend:"إرسال الفائزين إلى تبويب المحفظة",
secSkipped:"تم تخطي القطاعات بلا فائز: {list}",secSent:"تم تحميل الفائزين في تبويب المحفظة.",
thEx:"Excess return (annualized)",thBeta:"Beta",thTrey:"Treynor (annualized)",thRes:"Result",
thStd:"Std (annualized)",thRatio:"Return/Std (annualized)",thSim:"SIM result",thCcm:"CCM result",
vWin:"Winner",vNot:"Not chosen",vInv:"Not valid",idxTag:"المؤشر"},
en:{tabPf:"Portfolio",tabSec:"Pick best per sector",tabAdv:"Advanced",
pfTitle:"Simple portfolio",pfDzS:"Drag stock files here (one file per company), or",pfUpS:"Choose stock files",
pfDzI:"Drag the market index file here, or",pfUpI:"Choose index file",
pfRf:"Risk-free rate (annual %):",pfRfHint:"e.g. Egypt 91-day T-bill yield",
pfGo:"Get my portfolio",pfWin:"Using {s} to {e} ({d} days)",
pfFreqBad:"One of the files is {minor} and the others are {major}: please upload {major} files.",
pfNoCommon:"The files have no common dates. Please check the date ranges.",
pfSmallN:"Not enough overlapping data (n = {n}). Try files with a longer common history.",
pfNeed:"Add at least 2 stock files, the index file and the risk-free rate.",
pfBadFile:"Could not read this file. Please download CSV or Excel from Investing.com.",
pdfMsg:"PDF files can't be read reliably. Please download the data as CSV or Excel from Investing.com (Historical Data > Download).",
pfHead:"Invest in {x} of the {y} stocks",pfNone:"No stock qualifies for the portfolio over this period",
pfThS:"Stock",pfThW:"Weight (%)",pfAnnEx:"Expected excess return per year",pfBeta:"Portfolio beta",
pfBetaExp:"moves {x}% for every 1% the market moves",pfTrey:"Treynor ratio (annualized)",
pfNotSel:"Stocks not selected",pfDl:"Download Excel",pfXlsx:"Export Excel (formatted)",pfCopy:"Copy result",pfStart:"Start over",
pfEdit:"Edit inputs",pfDetails:"Show full details",
pfFoot:"Based on historical data. Academic analysis, not investment advice.",
pfNoVar:"Market data is flat over this window, calculation is not possible.",
rNeg:"Earned less than the risk-free rate",rBeta:"Moves against the market (negative beta)",
rCut:"Not attractive enough compared with the cutoff rate",
secTitle:"Pick best per sector",secDzI:"Drag the market index file here, or",secUpI:"Choose index file",
secRf:"Risk-free rate (annual %):",secRfHint:"e.g. Egypt 91-day T-bill yield",
secArea:"Sectors",secAdd:"Add sector",secGo:"Find the best in each sector",
secNeed:"Add the risk-free rate and at least one sector with 2 or more candidates.",
secIdxOpt:"Index file is optional — needed only for the Single Index Model column.",
secSimReason:"Highest return per unit of market risk among the {n} candidates.",
secCcmReason:"Highest return per unit of total risk among the {n} candidates.",
secNeedsIdx:"Needs an index file",
secAgree:"Both models agree: {w}",
secDisagree:"The models disagree in this sector",
secPickOne:"Pick one, or choose manually below",
secFinal:"Final choice",
secFollowSim:"Follow Single Index Model",
secFollowCcm:"Follow Constant Correlation Model",
secManual:"Choose manually",
secApplyAll:"Apply to all sectors",
secReset:"Reset choices",
secSummary:"{n} sectors | models agree in {a} | disagree in {d}",
secNamePh:"Sector name, e.g. Cement",secUp:"Choose files",secDz:"Drag candidate files here, or",
secRmSec:"Remove sector",secWin:"Winner: {w}",
secWinReason:"Highest return per unit of market risk among the {n} candidates.",secOnly:"Only candidate in this sector.",
secNone:"No valid stock in this sector",secNoCand:"No candidates uploaded in this sector.",
secNoData:"Not enough common data in this sector.",
secNote:"Each sector is compared on its own common dates, so a sector's winner can be chosen on a different period than another sector's.",
secDl:"Download Excel",secCopy:"Copy table",secSend:"Send winners to the Portfolio tab",
secSkipped:"Skipped sectors with no winner: {list}",secSent:"Winners loaded into the Portfolio tab.",
thEx:"Excess return (annualized)",thBeta:"Beta",thTrey:"Treynor (annualized)",thRes:"Result",
thStd:"Std (annualized)",thRatio:"Return/Std (annualized)",thSim:"SIM result",thCcm:"CCM result",
vWin:"Winner",vNot:"Not chosen",vInv:"Not valid",idxTag:"index"}};
const T2=k=>((I18N2[LANG]&&I18N2[LANG][k])||I18N2.en[k]||k);
/* ---------- tabs ---------- */
function switchTab(name){
  const map={portfolio:['tabBtnPf','tab-portfolio'],sectors:['tabBtnSec','tab-sectors']};
  Object.keys(map).forEach(k=>{
    const btn = document.getElementById(map[k][0]);
    const tab = document.getElementById(map[k][1]);
    if (btn) btn.classList.toggle('active', k === name);
    if (tab) tab.classList.toggle('active', k === name);
  });
}
/* ---------- shared pure helpers (new; engine primitives reused, never modified) ---------- */
function stripArPrefix(fn){return String(fn||'').replace(/^\s*بيانات تاريخية\s*-\s*/,'')}
function cleanName2(fn){return cleanName(stripArPrefix(fn))}
function computeWindowFor(files){
  if(!files.length)return null;
  const fq=[...new Set(files.map(f=>f.freq))];
  if(fq.length>1)return{error:'freqMismatch',freqs:fq};
  const counts=new Map();
  files.forEach(f=>{const seen=new Set();f.entries.forEach(e=>{const k=e.d.getTime();if(!seen.has(k)){seen.add(k);counts.set(k,(counts.get(k)||0)+1)}})});
  const common=[...counts.entries()].filter(([,c])=>c===files.length).map(([k])=>k).sort((a,b)=>a-b);
  if(!common.length)return{error:'noOverlap'};
  const end=new Date(common[common.length-1]),firstCommon=new Date(common[0]);
  const cap=addMonths(end,-60);
  const start=firstCommon>cap?firstCommon:cap;
  let limitedBy;
  if(cap>=firstCommon)limitedBy=T('bannerCap');
  else{let mx=-Infinity;files.forEach(f=>{const t=f.entries[0].d.getTime();if(t>mx){mx=t;limitedBy=f.label}})}
  const dates=common.filter(t=>t>=start.getTime()&&t<=end.getTime());
  const n=dates.length-1;
  const freq=fq[0],k=KMAP[freq];
  return{files,freq,k,start:new Date(start),end:new Date(end),firstCommon,dates,n,limitedBy};
}
function coreFor(win,stocks,idxEntries,rfAnn){
  const k=win.k,rfPer=rfAnn/100/k;
  const idxMap=new Map(idxEntries.map(e=>[e.d.getTime(),e.p]));
  const idxP=win.dates.map(t=>idxMap.get(t));
  const rm=simpleReturns(idxP),rbm=mean(rm),vm=svar(rm);
  if(!(vm>0))return{error:'novar'};
  const rows=stocks.map((s,i)=>{
    const mp=new Map(s.entries.map(e=>[e.d.getTime(),e.p]));
    const sp=win.dates.map(t=>mp.get(t));
    const ri=simpleReturns(sp);
    const vi=svar(ri),cv=scov(ri,rm),beta=cv/vm,b2=beta*beta,sei=vi-b2*vm;
    const rbi=mean(ri),exI=rbi-rfPer,trey=(beta>0)?exI/beta:NaN;
    return{key:i,label:s.label,n:win.n,vi,beta,sei,exI,trey,rbi};
  });
  return{k,rfAnn,rfPer,vm,rbm,rows};
}
function selectPortfolio(rows,vm){
  const items=[],excluded=[];
  rows.forEach((r,i)=>{
    const it={key:i,label:r.label,exI:r.exI,beta:r.beta,sei:r.sei,trey:r.trey};
    if(!(r.beta>0))excluded.push({label:r.label,rc:'beta'});
    else if(!(r.sei>0))excluded.push({label:r.label,rc:'sei'});
    else items.push(it);
  });
  const out=eltonGruber(items,vm);
  const selKeys=new Set(out.selected.map(r=>r.key));
  const rejected=excluded.slice();
  out.ranked.forEach(r=>{
    if(selKeys.has(r.key))return;
    if(r.exI<0)rejected.push({label:r.label,rc:'neg'});
    else rejected.push({label:r.label,rc:'cut',trey:r.trey,ci:r.ci});
  });
  return{...out,excluded,rejected,total:rows.length};
}
function reasonText(r){
  if(r.rc==='beta')return T2('rBeta');
  if(r.rc==='neg')return T2('rNeg');
  return T2('rCut');
}
function pickSectorWinner(cands,idxEntries,idxFreq,rfAnn){
  const files=[...cands.map(c=>({label:c.label,entries:c.entries,freq:c.freq})),{label:'IDX',entries:idxEntries,freq:idxFreq}];
  const win=computeWindowFor(files);
  if(!win||win.error)return{error:win?win.error:'empty',win,freqs:win&&win.freqs};
  if(win.n<30)return{error:'smalln',win};
  const k=win.k,rfPer=rfAnn/100/k;
  const idxMap=new Map(idxEntries.map(e=>[e.d.getTime(),e.p]));
  const idxP=win.dates.map(t=>idxMap.get(t));
  const rm=simpleReturns(idxP),vm=svar(rm);
  if(!(vm>0))return{error:'novar',win};
  const rows=cands.map((c,i)=>{
    const mp=new Map(c.entries.map(e=>[e.d.getTime(),e.p]));
    const ri=simpleReturns(win.dates.map(t=>mp.get(t)));
    const rbi=mean(ri),exI=rbi-rfPer,exAnn=exI*k;
    const cv=scov(ri,rm),beta=cv/vm,trey=(beta>0)?exI/beta:NaN;
    const valid=(beta>0&&exI>0);
    return{key:i,label:c.label,n:win.n,exAnn,beta,trey,treyAnn:(beta>0?exAnn/beta:NaN),valid};
  });
  let winner=null,note=null;
  if(rows.length===1){winner=rows[0];note='only'}
  else{
    const valid=rows.filter(r=>r.valid).sort((a,b)=>{
      if(a.trey!==b.trey)return b.trey-a.trey;
      if(a.n!==b.n)return b.n-a.n;
      return String(a.label).localeCompare(String(b.label));
    });
    if(valid.length)winner=valid[0];
  }
  return{win,rows,winner,note};
}
/* Dual-criterion sector comparison (new; pickSectorWinner above is unchanged) */
function secMaxBy(rows,isValid,val){
  const v=rows.filter(isValid);
  v.sort((a,b)=>{
    const va=val(a),vb=val(b);
    if(vb!==va)return vb-va;
    if(a.n!==b.n)return b.n-a.n;
    return String(a.label).localeCompare(String(b.label));
  });
  return v.length?v[0]:null;
}
function pickSectorBoth(cands,idxEntries,idxFreq,rfAnn){
  const hasIdx=!!(idxEntries&&idxEntries.length);
  const files=cands.map(c=>({label:c.label,entries:c.entries,freq:c.freq}));
  if(hasIdx)files.push({label:'IDX',entries:idxEntries,freq:idxFreq});
  const win=computeWindowFor(files);
  if(!win||win.error)return{error:win?win.error:'empty',win,freqs:win&&win.freqs,simAvailable:hasIdx};
  if(win.n<30)return{error:'smalln',win,simAvailable:hasIdx};
  const k=win.k,rfPer=rfAnn/100/k;
  let rm=null,vm=NaN;
  if(hasIdx){
    const idxMap=new Map(idxEntries.map(e=>[e.d.getTime(),e.p]));
    rm=simpleReturns(win.dates.map(t=>idxMap.get(t)));vm=svar(rm);
  }
  const simAvail=hasIdx&&isFinite(vm)&&vm>0;
  const rows=cands.map((c,i)=>{
    const mp=new Map(c.entries.map(e=>[e.d.getTime(),e.p]));
    const ri=simpleReturns(win.dates.map(t=>mp.get(t)));
    const rbi=mean(ri),sv=svar(ri),sd=Math.sqrt(sv),ex=rbi-rfPer;
    const exAnn=ex*k,stdAnn=sd*Math.sqrt(k);
    let beta=NaN,trey=NaN,treyAnn=NaN,simValid=false,simWhy='';
    if(simAvail){
      beta=scov(ri,rm)/vm;trey=(beta>0)?ex/beta:NaN;treyAnn=(beta>0)?exAnn/beta:NaN;
      if(!(beta>0))simWhy='beta';
      else if(!(ex>0))simWhy='neg';
      else simValid=true;
    }
    const ratio=(sd>0&&isFinite(sd))?ex/sd:NaN,ratioAnn=isFinite(ratio)?ratio*Math.sqrt(k):NaN;
    let ccmValid=false,ccmWhy='';
    if(!(sd>0))ccmWhy='sigma0';
    else if(ex<0)ccmWhy='neg';
    else ccmValid=true;
    return{key:i,label:c.label,n:win.n,exAnn,beta,trey,treyAnn,sd,stdAnn,ratio,ratioAnn,simValid,simWhy,ccmValid,ccmWhy,valid:simValid};
  });
  const simWinner=simAvail?secMaxBy(rows,r=>r.simValid,r=>r.trey):null;
  const ccmWinner=secMaxBy(rows,r=>r.ccmValid,r=>r.ratio);
  return{win,rows,simWinner,ccmWinner,note:null,simAvailable:simAvail};
}
/* ---------- Portfolio tab ---------- */
const PF={stocks:[],index:null,indexLabel:'Index',result:null};
let pfSeq=0;
function pfRf(){const v=parseFloat(String(el('pfRf').value).trim());return isFinite(v)?v:NaN}
function pfFiles(){const f=PF.stocks.map(s=>({label:s.label,entries:s.entries,freq:s.freq}));if(PF.index)f.push({label:PF.indexLabel,entries:PF.index.entries,freq:PF.index.freq});return f}
function splitPdf(files){return{pdf:files.filter(f=>/\.pdf$/i.test(f.name||'')),rest:files.filter(f=>!/\.pdf$/i.test(f.name||''))}}
function warnbox(t){return `<div class="warnbox">${escapeHtml(t)}</div>`}
function pfFlash(t){el('pfMsg').innerHTML+=warnbox(t)}
function chipEl(name,sub,onRm){
  const d=document.createElement('span');d.className='pfchip';
  const t=document.createElement('span');t.textContent=name;d.appendChild(t);
  const sm=document.createElement('small');sm.textContent=sub||'';d.appendChild(sm);
  const b=document.createElement('button');b.type='button';b.textContent='×';b.onclick=onRm;d.appendChild(b);
  return d;
}
function pfFreqName(f){return (I18N[LANG].freqNames&&I18N[LANG].freqNames[f])||f}
function pfWin(){
  const f=pfFiles();
  if(!f.length)return null;
  return computeWindowFor(f);
}
function renderPF(){
  const c=el('pfChips');c.innerHTML='';
  PF.stocks.forEach(s=>{c.appendChild(chipEl(s.label,pfFreqName(s.freq),()=>{PF.stocks=PF.stocks.filter(x=>x.uid!==s.uid);PF.result=null;showPfStep(1);renderPF()}))});
  if(PF.index)c.appendChild(chipEl(PF.indexLabel,pfFreqName(PF.index.freq)+' · '+T2('idxTag'),()=>{PF.index=null;PF.result=null;showPfStep(1);renderPF()}));
  const msg=el('pfMsg');msg.innerHTML='';
  const win=pfWin(),wl=el('pfWinLine');
  const rfOk=isFinite(pfRf());
  if(!win){wl.textContent=''}
  else if(win.error==='freqMismatch'){
    wl.textContent='';
    const cnt={};win&&pfFiles().forEach(f=>{cnt[f.freq]=(cnt[f.freq]||0)+1});
    const major=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
    const minor=win.freqs.find(f=>f!==major)||win.freqs[0];
    msg.innerHTML=warnbox(T2('pfFreqBad').replace('{minor}',pfFreqName(minor)).replace(/\{major\}/g,pfFreqName(major)));
  }
  else if(win.error==='noOverlap'){wl.textContent='';msg.innerHTML=warnbox(T2('pfNoCommon'))}
  else{
    const days=Math.round((win.end-win.start)/864e5).toLocaleString('en-US');
    wl.textContent=T2('pfWin').replace('{s}',fmtDate(win.start)).replace('{e}',fmtDate(win.end)).replace('{d}',days);
    if(win.n<30)msg.innerHTML=warnbox(T2('pfSmallN').replace('{n}',win.n));
  }
  const stocksOnly=PF.stocks.length>=2?computeWindowFor(PF.stocks.map(s=>({label:s.label,entries:s.entries,freq:s.freq}))):null;
  const stocksOk=!!(stocksOnly&&!stocksOnly.error&&stocksOnly.n>=30);
  const go=!!(PF.stocks.length>=2&&rfOk&&stocksOk&&(PF.index?true:true));
  el('pfGo').disabled=!go;
  el('pfGo').title=go?'':T2('pfNeed');
}
function showPfStep(n){el('pf-step1').hidden=(n!==1);el('pf-step2').hidden=(n!==2)}
async function pfAddStocks(files){
  const{pdf,rest}=splitPdf(files);
  if(pdf.length)pfFlash(T2('pdfMsg'));
  for(const f of rest){
    try{
      const entries=await loadFile(f);
      if(entries.length<2){pfFlash(T2('pfBadFile'));continue}
      const det=detectFreq(entries.map(e=>e.d));
      PF.stocks.push({uid:++pfSeq,fileName:f.name,label:cleanName2(f.name),entries,detected:det,freq:det});
    }catch(e){pfFlash(T2('pfBadFile'))}
  }
  PF.result=null;showPfStep(1);renderPF();toast(T('loaded'));
}
async function pfAddIndex(file){
  if(/\.pdf$/i.test(file.name||'')){pfFlash(T2('pdfMsg'));return}
  try{
    const entries=await loadFile(file);
    if(entries.length<2){pfFlash(T2('pfBadFile'));return}
    const det=detectFreq(entries.map(e=>e.d));
    PF.index={entries,detected:det,freq:det,fileName:file.name};
    PF.indexLabel=cleanName2(file.name);
  }catch(e){pfFlash(T2('pfBadFile'));return}
  PF.result=null;showPfStep(1);renderPF();toast(T('loaded'));
}
function pfWeightRows(tbodyId,weights){
  const tb=el(tbodyId);tb.innerHTML='';
  let mx=0;weights.forEach(r=>{mx=Math.max(mx,r.w)});
  weights.forEach(r=>{
    const tr=document.createElement('tr');
    const tdN=document.createElement('td');tdN.className='per';tdN.textContent=r.label;tr.appendChild(tdN);
    const tdW=document.createElement('td');tdW.className='num';tdW.textContent=(r.w*100).toFixed(2)+'%';tr.appendChild(tdW);
    const tdB=document.createElement('td');
    const bar=document.createElement('div');bar.className='wbar';
    const fill=document.createElement('div');fill.style.width=((r.w/(mx||1)*100).toFixed(1))+'%';bar.appendChild(fill);
    tdB.appendChild(bar);tr.appendChild(tdB);
    tb.appendChild(tr);
  });
}
function pfStatCard(boxId,stats){
  const big=el(boxId);big.innerHTML='';
  stats.forEach(([k,v,sub])=>{
    const d=document.createElement('div');d.className='bigstat';
    const dk=document.createElement('div');dk.className='k';dk.textContent=k;d.appendChild(dk);
    const dv=document.createElement('div');dv.className='v';dv.textContent=v;d.appendChild(dv);
    if(sub){const ds=document.createElement('div');ds.className='k';ds.textContent=sub;d.appendChild(ds)}
    big.appendChild(d);
  });
}
function renderPFResult(){
  const R=PF.result;if(!R)return;
  const sel=R.sel,ccm=R.ccm;
  const hasSim=!!sel,hasCcm=!!ccm;
  el('pfSimCol').style.display=hasSim?'':'none';
  el('pfCcmCol').style.display=hasCcm?'':'none';
  if(hasSim){
    const W=sel.weights;
    el('pfSimHeadline').textContent=W.length?T2('pfHead').replace('{x}',W.length).replace('{y}',sel.total):T2('pfNone');
    el('pfSimWrap').hidden=!W.length;
    pfWeightRows('pfTBody',W);
    if(W.length){
      const annEx=sel.exP*sel.k;
      pfStatCard('pfBig',[
        [T2('pfAnnEx'),(annEx*100).toFixed(2)+'%','Extra return above the risk-free rate, per year'],
        [T2('pfBeta'),sel.bp.toFixed(2),T2('pfBetaExp').replace('{x}',(sel.bp*1).toFixed(2))],
        [T2('pfTrey'),(annEx/sel.bp).toFixed(3),'Extra return for each unit of market risk']
      ]);
    }else el('pfBig').innerHTML='';
    el('pfSimNote').textContent='';
  }
  if(hasCcm){
    const W=ccm.weights;
    el('pfCcmHeadline').textContent=W.length?T2('pfHead').replace('{x}',W.length).replace('{y}',ccm.total):T2('pfNone');
    el('pfCcmWrap').hidden=!W.length;
    pfWeightRows('pfCcmBody',W);
    if(W.length){
      const annEx=ccm.exP*ccm.k;
      pfStatCard('pfCcmBig',[
        [T2('pfAnnEx'),(annEx*100).toFixed(2)+'%','Extra return above the risk-free rate, per year'],
        ['Average correlation',ccm.rho.toFixed(3),'Same correlation assumed for every pair'],
        ['Return per unit of risk',isFinite(ccm.sharpeM)?(ccm.sharpeM*Math.sqrt(ccm.k)).toFixed(3):'n/a','Extra return for each unit of portfolio risk']
      ]);
    }else el('pfCcmBig').innerHTML='';
    el('pfCcmNote').textContent='';
  }
  if(!hasSim&&hasCcm)el('pfSimNote').textContent='';
  if(hasSim&&!hasCcm)el('pfCcmNote').textContent='';
  const sumL=el('pfSumLine');
  if(hasSim&&hasCcm){
    const sS=new Set(sel.weights.map(r=>r.label)),sC=new Set(ccm.weights.map(r=>r.label));
    const both=[...sS].filter(l=>sC.has(l));
    const onlyS=[...sS].filter(l=>!sC.has(l)),onlyC=[...sC].filter(l=>!sS.has(l));
    if(!onlyS.length&&!onlyC.length)sumL.textContent=`Both models agree on these ${both.length} stocks: ${both.join(', ')||'—'}`;
    else sumL.textContent=`The models agree on ${both.join(', ')||'—'}, and differ on ${(onlyS.map(l=>l+' (SIM)').concat(onlyC.map(l=>l+' (CCM)'))).join(', ')}.`;
  }else if(!hasSim&&hasCcm)sumL.textContent='Add an index file to also see the Single Index Model';
  else if(hasSim&&!hasCcm)sumL.textContent='The Constant Correlation Model could not be applied to these stocks';
  else sumL.textContent='';
  if(!hasSim&&hasCcm)el('pfCcmNote').textContent='';
  if(hasSim&&!hasCcm){/* SIM-only note handled by summary */}
  const mw=el('pfMergeWrap'),mb=el('pfMergeBody');mb.innerHTML='';
  const eW=new Map(hasSim?sel.weights.map(r=>[r.label,r.w]):[]);
  const cW=new Map(hasCcm?ccm.weights.map(r=>[r.label,r.w]):[]);
  const labels=[...new Set([...eW.keys(),...cW.keys()])];
  labels.sort((a,b)=>Math.max(cW.get(b)||0,eW.get(b)||0)-Math.max(cW.get(a)||0,eW.get(a)||0));
  mw.hidden=!labels.length;
  labels.forEach(l=>{
    const tr=document.createElement('tr');
    const a=document.createElement('td');a.className='per';a.textContent=l;tr.appendChild(a);
    const b=document.createElement('td');b.className='num';b.textContent=eW.has(l)?(eW.get(l)*100).toFixed(2)+'%':'—';tr.appendChild(b);
    const c=document.createElement('td');c.className='num';c.textContent=cW.has(l)?(cW.get(l)*100).toFixed(2)+'%':'—';tr.appendChild(c);
    mb.appendChild(tr);
  });
  el('pfHead').textContent=hasSim?(sel.weights.length?T2('pfHead').replace('{x}',sel.weights.length).replace('{y}',sel.total):T2('pfNone')):'';
  const rej=el('pfRej');rej.innerHTML='';
  if(hasSim)sel.rejected.forEach(r=>{const li=document.createElement('li');li.textContent='SIM: '+r.label+' — '+reasonText(r);rej.appendChild(li)});
  if(hasCcm)ccm.rejected.forEach(r=>{const li=document.createElement('li');const msg=r.rc==='neg'?T2('rNeg'):(r.rc==='sigma0'?'σ = 0':T2('rCut'));li.textContent='CCM: '+r.label+' — '+msg;rej.appendChild(li)});
  el('pfRejBox').open=false;
  if(!hasSim)el('pfSimNote').textContent='';
}
function pfCopyText(){
  const R=PF.result;if(!R)return'';
  const L=['Stock\tSingle Index Model (%)\tConstant Correlation Model (%)'];
  const eW=new Map(R.sel?R.sel.weights.map(r=>[r.label,r.w]):[]);
  const cW=new Map(R.ccm?R.ccm.weights.map(r=>[r.label,r.w]):[]);
  const labels=[...new Set([...eW.keys(),...cW.keys()])];
  labels.sort((a,b)=>Math.max(cW.get(b)||0,eW.get(b)||0)-Math.max(cW.get(a)||0,eW.get(a)||0));
  labels.forEach(l=>L.push(`${l}\t${eW.has(l)?(eW.get(l)*100).toFixed(2)+'%':'—'}\t${cW.has(l)?(cW.get(l)*100).toFixed(2)+'%':'—'}`));
  return L.join('\n');
}
function retSheetPF(wb,stocks,index,win){
  const priceCols=stocks.map((_,i)=>colL(1+i));
  const idxPCol=colL(1+stocks.length);
  const retCols=stocks.map((_,i)=>colL(2+stocks.length+i));
  const idxRCol=colL(2+2*stocks.length);
  const hdr=['Date',...stocks.map(s=>s.label),PF.indexLabel,...stocks.map(s=>'Ret '+s.label),'Ret '+PF.indexLabel];
  const ws=XLSX.utils.aoa_to_sheet([hdr]);
  const idxMap=new Map(index.entries.map(e=>[e.d.getTime(),e.p]));
  const maps=stocks.map(s=>new Map(s.entries.map(e=>[e.d.getTime(),e.p])));
  win.dates.forEach((t,i)=>{
    const r=i+2;
    ws['A'+r]={t:'s',v:fmtISO(new Date(t))};
    maps.forEach((mp,j)=>{ws[priceCols[j]+r]={t:'n',v:mp.get(t)}});
    ws[idxPCol+r]={t:'n',v:idxMap.get(t)};
    retCols.forEach((rc,j)=>{ws[rc+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${priceCols[j]}${r}=0,"",${priceCols[j]}${r}/${priceCols[j]}${r-1}-1)`}});
    ws[idxRCol+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${idxPCol}${r}=0,"",${idxPCol}${r}/${idxPCol}${r-1}-1)`};
  });
  const last=win.dates.length+1;
  setRef(ws,0,0,hdr.length-1,win.dates.length);
  XLSX.utils.book_append_sheet(wb,ws,'Returns');
  return{retCols,idxRCol,last};
}
function downloadResultsSheet(){
  const R=PF.result;if(!R)return;
  try{
    const wb=XLSX.utils.book_new();
    const ws={};
    const thin={style:'thin',color:{rgb:'FFB0B0B0'}};
    const HDR={font:{bold:true},border:{top:thin,bottom:thin,left:thin,right:thin}};
    const BDR={border:{top:thin,bottom:thin,left:thin,right:thin}};
    const n=PF.stocks.length;
    const simW=R.sel?[...R.sel.weights].sort((a,b)=>b.w-a.w):[];
    const ccmW=R.ccm?[...R.ccm.weights].sort((a,b)=>b.w-a.w):[];
    const kc=ccmW.length,ks=simW.length;
    const rf=R.rfAnn/100;
    ws['A1']={t:'s',v:'Constant Correlation Model',s:{font:{bold:true,size:13}}};
    ws['F1']={t:'s',v:'Single Index Model',s:{font:{bold:true,size:13}}};
    ws['A2']=kc>0?{t:'s',f:`"استثمر في "&COUNTA(A4:A${3+kc})&" من أصل ${n} أسهم"`}:{t:'s',v:`استثمر في 0 من أصل ${n} أسهم`};
    ws['F2']=ks>0?{t:'s',f:`"استثمر في "&COUNTA(F4:F${3+ks})&" من أصل ${n} أسهم"`}:{t:'s',v:`استثمر في 0 من أصل ${n} أسهم`};
    ['A3|Stock','B3|Weight (%)','C3|Amount','D3|Total Return'].forEach(h=>{const[c,v]=h.split('|');ws[c]={t:'s',v,s:HDR}});
    ['F3|السهم','G3|الوزن (%)','H3|المبلغ','I3|العائد الكلي'].forEach(h=>{const[c,v]=h.split('|');ws[c]={t:'s',v,s:HDR}});
    const ck=R.ccm?R.ccm.k:NaN, sk=R.sel?R.sel.k:NaN;
    ccmW.forEach((r,i)=>{
      const er=i+4, ex=isFinite(r.ex)&&isFinite(ck)?r.ex*ck:NaN;
      ws['A'+er]={t:'s',v:r.label,s:BDR};ws['B'+er]={t:'n',v:r.w,z:'0.00%',s:BDR};
      ws['C'+er]={t:'n',z:'#,##0.00',s:BDR};
      ws['D'+er]=isFinite(ex)?{t:'n',f:`C${er}*(${ex}+$B$${5+kc})`,z:'#,##0.00',s:BDR}:{t:'s',v:'',s:BDR};
    });
    simW.forEach((r,i)=>{
      const er=i+4, ex=isFinite(r.exI)&&isFinite(sk)?r.exI*sk:NaN;
      ws['F'+er]={t:'s',v:r.label,s:BDR};ws['G'+er]={t:'n',v:r.w,z:'0.00%',s:BDR};
      ws['H'+er]={t:'n',z:'#,##0.00',s:BDR};
      ws['I'+er]=isFinite(ex)?{t:'n',f:`H${er}*(${ex}+$G$${5+ks})`,z:'#,##0.00',s:BDR}:{t:'s',v:'',s:BDR};
    });
    const ltC=4+kc, ltS=4+ks;
    ws['A'+ltC]={t:'s',v:'Total',s:HDR};
    ws['B'+ltC]=kc>0?{t:'n',f:`SUM(B4:B${3+kc})`,z:'0.00%',s:HDR}:{t:'s',v:'',s:HDR};
    ws['C'+ltC]=kc>0?{t:'n',f:`SUM(C4:C${3+kc})`,z:'#,##0.00',s:HDR}:{t:'s',v:'',s:HDR};
    ws['D'+ltC]=kc>0?{t:'n',f:`SUM(D4:D${3+kc})`,z:'#,##0.00',s:HDR}:{t:'s',v:'',s:HDR};
    ws['F'+ltS]={t:'s',v:'الإجمالي',s:HDR};
    ws['G'+ltS]=ks>0?{t:'n',f:`SUM(G4:G${3+ks})`,z:'0.00%',s:HDR}:{t:'s',v:'',s:HDR};
    ws['H'+ltS]=ks>0?{t:'n',f:`SUM(H4:H${3+ks})`,z:'#,##0.00',s:HDR}:{t:'s',v:'',s:HDR};
    ws['I'+ltS]=ks>0?{t:'n',f:`SUM(I4:I${3+ks})`,z:'#,##0.00',s:HDR}:{t:'s',v:'',s:HDR};
    const rfC=5+kc, rfS=5+ks;
    ws['A'+rfC]={t:'s',v:'Risk-free rate (T-bill)',s:BDR};
    ws['B'+rfC]={t:'n',v:rf,z:'0.00%',s:BDR};
    ws['F'+rfS]={t:'s',v:'معدل العائد الخالي من المخاطر (أذون الخزانة)',s:BDR};
    ws['G'+rfS]={t:'n',v:rf,z:'0.00%',s:BDR};
    const mHead=Math.max(rfC,rfS)+2;
    ws['A'+mHead]={t:'s',v:'Metric',s:HDR};ws['B'+mHead]={t:'s',v:'Value',s:HDR};ws['C'+mHead]={t:'s',v:'Description',s:HDR};
    ws['F'+mHead]={t:'s',v:'المقياس',s:HDR};ws['G'+mHead]={t:'s',v:'القيمة',s:HDR};ws['H'+mHead]={t:'s',v:'الوصف',s:HDR};
    const cEx=R.ccm?R.ccm.exP*R.ccm.k:NaN;
    const cSh=R.ccm&&isFinite(R.ccm.sharpeM)?R.ccm.sharpeM*Math.sqrt(R.ccm.k):NaN;
    const cRho=R.ccm?R.ccm.rho:NaN;
    const sEx=R.sel?R.sel.exP*R.sel.k:NaN;
    const sBp=R.sel?R.sel.bp:NaN;
    const num=(v,z)=>isFinite(v)?{t:'n',v,z,s:BDR}:{t:'s',v:'n/a',s:BDR};
    let r1=mHead+1;
    ws['A'+r1]={t:'s',v:'Average correlation',s:BDR};ws['B'+r1]=num(cRho,'0.000');ws['C'+r1]={t:'s',v:'Same correlation assumed for every pair',s:BDR};
    ws['F'+r1]={t:'s',v:'بيتا المحفظة',s:BDR};ws['G'+r1]=num(sBp,'0.00');
    ws['H'+r1]={t:'s',v:isFinite(sBp)?`تتحرك بنسبة ${sBp.toFixed(2)}% مقابل كل 1% يتحركه السوق`:'تتحرك بنسبة — مقابل كل 1% يتحركه السوق',s:BDR};
    let r2=mHead+2;
    ws['A'+r2]={t:'s',v:'العائد الزائد المتوقع سنوياً',s:BDR};ws['B'+r2]=num(cEx,'0.00%');ws['C'+r2]={t:'s',v:'Extra return above the risk-free rate, per year',s:BDR};
    ws['F'+r2]={t:'s',v:'العائد الزائد المتوقع سنوياً',s:BDR};ws['G'+r2]=num(sEx,'0.00%');ws['H'+r2]={t:'s',v:'Extra return above the risk-free rate, per year',s:BDR};
    let r3=mHead+3;
    ws['A'+r3]={t:'s',v:'Return per unit of risk',s:BDR};ws['B'+r3]=num(cSh,'0.000');ws['C'+r3]={t:'s',v:'Extra return for each unit of portfolio risk',s:BDR};
    ws['F'+r3]={t:'s',v:'نسبة ترينور (سنوية)',s:BDR};
    ws['G'+r3]=(isFinite(sEx)&&isFinite(sBp)&&sBp!==0)?{t:'n',f:`G${r2}/G${r1}`,z:'0.000',s:BDR}:{t:'s',v:'n/a',s:BDR};
    ws['H'+r3]={t:'s',v:'Extra return for each unit of market risk',s:BDR};
    let r4=mHead+4;
    ws['A'+r4]={t:'s',v:'Total expected return (excess + risk-free)',s:BDR};
    ws['B'+r4]=isFinite(cEx)?{t:'n',f:`B${r2}+$B$${rfC}`,z:'0.00%',s:BDR}:{t:'s',v:'n/a',s:BDR};
    ws['C'+r4]={t:'s',v:'Total annual return including the T-bill rate',s:BDR};
    ws['F'+r4]={t:'s',v:'العائد الكلي المتوقع (الزائد + الخالي من المخاطر)',s:BDR};
    ws['G'+r4]=isFinite(sEx)?{t:'n',f:`G${r2}+$G$${rfS}`,z:'0.00%',s:BDR}:{t:'s',v:'n/a',s:BDR};
    ws['H'+r4]={t:'s',v:'العائد السنوي الكلي شامل عائد أذون الخزانة',s:BDR};
    const lastRow=r4;
    setRef(ws,0,0,8,lastRow-1);
    ws['!cols']=[{wch:30},{wch:12},{wch:22},{wch:16},{wch:3},{wch:30},{wch:12},{wch:22},{wch:16}];
    XLSX.utils.book_append_sheet(wb,ws,'Results');
    XLSX.writeFile(wb,`portfolio_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
}
function buildResultsPayload(){
  const R=PF.result;if(!R)return null;
  const model=(M,isSim)=>M?{
    k:M.weights.length,
    rho:isSim?undefined:M.rho,
    beta:isSim?M.bp:undefined,
    exAnn:M.exP*M.k,
    sharpeAnn:(!isSim&&isFinite(M.sharpeM))?M.sharpeM*Math.sqrt(M.k):undefined,
    treynorAnn:(isSim&&isFinite(M.exP)&&isFinite(M.bp)&&M.bp!==0)?(M.exP*M.k)/M.bp:undefined,
    stocks:[...M.weights].sort((a,b)=>b.w-a.w).map(r=>({
      ticker:r.label, weight:r.w,
      exAnn:isSim?(isFinite(r.exI)?r.exI*M.k:NaN):(isFinite(r.ex)?r.ex*M.k:NaN)
    }))
  }:null;
  const ccm=model(R.ccm,false), sim=model(R.sel,true);
  if(ccm)delete ccm.beta,delete ccm.treynorAnn;
  if(sim)delete sim.rho,delete sim.sharpeAnn;
  return{n:PF.stocks.length,rfAnn:R.rfAnn,ccm,sim};
}
function buildResultsWorkbook(payload){
  const fin=x=>(typeof x==='number'&&isFinite(x))?x:null;
  const n=parseInt(payload.n,10);
  const rf=Number(payload.rfAnn)/100;
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet('Results',{views:[{state:'normal',showGridLines:false,rightToLeft:true,zoomScale:100,activeCell:'A1'}]});
  [34,14,16,18,4,34,14,16,18].forEach((w,i)=>{ws.getColumn(i+1).width=w});
  const F_BASE={name:'Calibri',size:11};
  const F_BOLD={name:'Calibri',size:11,bold:true};
  const F_TITLE={name:'Calibri',size:14,bold:true};
  const F_ITAL={name:'Calibri',size:11,italic:true};
  const FILL={type:'pattern',pattern:'solid',fgColor:{argb:'00D9D9D9'}};
  const THIN={style:'thin',color:{argb:'FF000000'}};
  const BORD={top:THIN,bottom:THIN,left:THIN,right:THIN};
  const A_RIGHT={horizontal:'right',vertical:'middle',wrapText:true};
  const A_CENTER={horizontal:'center',vertical:'middle',wrapText:true};
  const A_NUM={horizontal:'right',vertical:'middle'};
  const style=(cell,o)=>{o=o||{};
    cell.font=Object.assign({},F_BASE,o.font||{});
    if(o.alignment)cell.alignment=o.alignment;
    if(o.numFmt)cell.numFmt=o.numFmt;
    if(o.fill)cell.fill=FILL;
    if(o.border)cell.border=BORD;
    return cell;};
  const cell=(r,c)=>ws.getRow(r).getCell(c);
  const mergeBord=(r,c0,c1,value,o)=>{o=o||{};
    for(let c=c0;c<=c1;c++)style(cell(r,c),{font:o.font,alignment:o.alignment,numFmt:o.numFmt,fill:o.fill,border:true});
    cell(r,c0).value=value;
    ws.mergeCells(r,c0,r,c1);};
  const tables=[
    {c0:1,model:payload.ccm||null,isSim:false,title:'نموذج الارتباط الثابت',sub:`استثمر في {k} من أصل {n} سهم`,
     headers:['السهم','الوزن (%)','المبلغ','العائد الكلي'],total:'الإجمالي',rfLabel:'معدل العائد الخالي من المخاطر (أذون الخزانة)',align:A_RIGHT},
    {c0:6,model:payload.sim||null,isSim:true,title:'نموذج المؤشر الواحد',sub:`استثمر في {k} من أصل {n} أسهم`,
     headers:['السهم','الوزن (%)','المبلغ','العائد الكلي'],total:'الإجمالي',rfLabel:'معدل العائد الخالي من المخاطر (أذون الخزانة)',align:A_RIGHT}
  ];
  tables.forEach(t=>{
    if(!t.model)return;
    const[c0,cT,cW,cA,cR]=[t.c0,t.c0,t.c0+1,t.c0+2,t.c0+3];
    const stocks=[...t.model.stocks].sort((a,b)=>b.weight-a.weight);
    const k=stocks.length;
    style(cell(1,c0),{font:F_TITLE,alignment:t.align});cell(1,c0).value=t.title;
    ws.mergeCells(1,c0,1,c0+3);
    style(cell(2,c0),{font:F_ITAL,alignment:t.align});cell(2,c0).value=t.sub.replace('{k}',k).replace('{n}',n);
    ws.mergeCells(2,c0,2,c0+3);
    ws.getRow(3).height=6;
    t.headers.forEach((h,i)=>{style(cell(4,c0+i),{font:F_BOLD,alignment:A_CENTER,fill:true,border:true});cell(4,c0+i).value=h;});
    const aCol=String.fromCharCode(64+cA), wCol=String.fromCharCode(64+cW), rfRow=6+k;
    stocks.forEach((s,i)=>{
      const r=5+i, ex=fin(s.exAnn);
      style(cell(r,cT),{alignment:t.align,border:true});cell(r,cT).value=s.ticker;
      style(cell(r,cW),{alignment:A_NUM,border:true});cell(r,cW).value=s.weight;cell(r,cW).numFmt='0.00%';
      style(cell(r,cA),{alignment:A_NUM,border:true});cell(r,cA).numFmt='#,##0.00';
      style(cell(r,cR),{alignment:A_NUM,numFmt:'#,##0.00',border:true});
      if(ex!==null)cell(r,cR).value={formula:`IF(${aCol}${r}="","",${aCol}${r}*(1+${ex}+$${wCol}$${rfRow}))`};
    });
    const trow=5+k;
    style(cell(trow,cT),{font:F_BOLD,alignment:t.align,fill:true,border:true});cell(trow,cT).value=t.total;
    if(k>0){
      const wCol=String.fromCharCode(64+cW);
      style(cell(trow,cW),{font:F_BOLD,alignment:A_NUM,fill:true,border:true});
      cell(trow,cW).value={formula:`SUM(${wCol}5:${wCol}${4+k})`};cell(trow,cW).numFmt='0.00%';
      style(cell(trow,cA),{font:F_BOLD,alignment:A_NUM,fill:true,border:true});
      cell(trow,cA).value={formula:`SUM(${aCol}5:${aCol}${4+k})`};cell(trow,cA).numFmt='#,##0.00;-#,##0.00;""';
      const rCol=String.fromCharCode(64+cR);
      style(cell(trow,cR),{font:F_BOLD,alignment:A_NUM,fill:true,border:true});
      cell(trow,cR).value={formula:`SUM(${rCol}5:${rCol}${4+k})`};cell(trow,cR).numFmt='#,##0.00;-#,##0.00;""';
    }else{
      [cW,cA,cR].forEach(c=>{style(cell(trow,c),{font:F_BOLD,alignment:A_NUM,fill:true,border:true});});
    }
    const rfrow=6+k;
    style(cell(rfrow,cT),{alignment:t.align});cell(rfrow,cT).value=t.rfLabel;
    style(cell(rfrow,cW),{alignment:A_NUM});cell(rfrow,cW).value=rf;cell(rfrow,cW).numFmt='0.00%';
  });
  const kc=payload.ccm?payload.ccm.stocks.length:0, ks=payload.sim?payload.sim.stocks.length:0;
  const kmax=Math.max(kc,ks), mhead=9+kmax, rfC=6+kc, rfS=6+ks;
  const cEx=payload.ccm?fin(payload.ccm.exAnn):null, sEx=payload.sim?fin(payload.sim.exAnn):null;
  const rho=payload.ccm?fin(payload.ccm.rho):null, beta=payload.sim?fin(payload.sim.beta):null;
  const metric=(r,c0,name,value,numFmt,desc,nameAlign)=>{
    style(cell(r,c0),{alignment:nameAlign,border:true});cell(r,c0).value=name;
    style(cell(r,c0+1),{alignment:A_NUM,border:true});
    if(value!==null&&typeof value==='object'){cell(r,c0+1).value=value;}
    else if(value!==null){cell(r,c0+1).value=value;}
    else cell(r,c0+1).value='n/a';
    if(value!==null)cell(r,c0+1).numFmt=numFmt;
    ws.getRow(r).height=32;};
  if(payload.ccm){
    style(cell(mhead,1),{font:F_BOLD,alignment:A_CENTER,fill:true,border:true});cell(mhead,1).value='المقياس';
    style(cell(mhead,2),{font:F_BOLD,alignment:A_CENTER,fill:true,border:true});cell(mhead,2).value='القيمة';
    mergeBord(mhead,3,4,'الوصف',{font:F_BOLD,alignment:A_CENTER,fill:true});
  }
  if(payload.sim){
    style(cell(mhead,6),{font:F_BOLD,alignment:A_CENTER,fill:true,border:true});cell(mhead,6).value='المقياس';
    style(cell(mhead,7),{font:F_BOLD,alignment:A_CENTER,fill:true,border:true});cell(mhead,7).value='القيمة';
    mergeBord(mhead,8,9,'الوصف',{font:F_BOLD,alignment:A_CENTER,fill:true});
  }
  const[r1,r2,r3,r4]=[mhead+1,mhead+2,mhead+3,mhead+4];
  if(payload.ccm){
    metric(r1,1,'متوسط الارتباط',rho,'0.000',null,A_RIGHT);
    mergeBord(r1,3,4,'نفس الارتباط مفترض لكل زوج من الأسهم',{alignment:A_RIGHT});
    metric(r2,1,'العائد الزائد المتوقع سنوياً',cEx,'0.00%',null,A_RIGHT);
    mergeBord(r2,3,4,'العائد الزائد فوق معدل أذون الخزانة، سنوياً',{alignment:A_RIGHT});
    metric(r3,1,'العائد الإضافي مقابل كل وحدة من المخاطر (سنوي)',fin(payload.ccm.sharpeAnn),'0.000',null,A_RIGHT);
    mergeBord(r3,3,4,'العائد الإضافي مقابل كل وحدة من مخاطر المحفظة',{alignment:A_RIGHT});
    metric(r4,1,'العائد الكلي المتوقع',cEx!==null?{formula:`B${r2}+$B$${rfC}`}:null,'0.00%',null,A_RIGHT);
    mergeBord(r4,3,4,'العائد السنوي الكلي شامل عائد أذون الخزانة',{alignment:A_RIGHT});
  }
  if(payload.sim){
    const btxt=beta!==null?`تتحرك بنسبة ${beta.toFixed(2)}% مقابل كل 1% يتحركه السوق`:'n/a';
    metric(r1,6,'بيتا المحفظة',beta,'0.00',null,A_RIGHT);
    mergeBord(r1,8,9,btxt,{alignment:A_RIGHT});
    metric(r2,6,'العائد الزائد المتوقع سنوياً',sEx,'0.00%',null,A_RIGHT);
    mergeBord(r2,8,9,'العائد الزائد فوق معدل أذون الخزانة، سنوياً',{alignment:A_RIGHT});
    metric(r3,6,'نسبة ترينور (سنوية)',(sEx!==null&&beta)?{formula:`G${r2}/G${r1}`}:null,'0.000',null,A_RIGHT);
    mergeBord(r3,8,9,'العائد الإضافي مقابل كل وحدة من مخاطر السوق',{alignment:A_RIGHT});
    metric(r4,6,'العائد الكلي المتوقع',sEx!==null?{formula:`G${r2}+$G$${rfS}`}:null,'0.00%',null,A_RIGHT);
    mergeBord(r4,8,9,'العائد السنوي الكلي شامل عائد أذون الخزانة',{alignment:A_RIGHT});
  }
  return wb;
}
async function downloadResultsXlsx(){
  const p=buildResultsPayload();if(!p)return;
  try{
    const wb=buildResultsWorkbook(p);
    const buffer=await wb.xlsx.writeBuffer();
    const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download=`portfolio_results_${todayISO()}.xlsx`;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
    toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
}
function downloadSimpleExcel(){
  const R=PF.result;if(!R)return;
  try{
    const wb=XLSX.utils.book_new();
    const win=R.win;
    const withIdx=!!(R.sel&&PF.index);
    const priceCols=PF.stocks.map((_,i)=>colL(1+i));
    const idxPCol=withIdx?colL(1+PF.stocks.length):null;
    const base=withIdx?2+PF.stocks.length:1+PF.stocks.length;
    const retCols=PF.stocks.map((_,i)=>colL(base+i));
    const idxRCol=withIdx?colL(base+PF.stocks.length):null;
    const hdr=['Date',...PF.stocks.map(s=>s.label)];
    if(withIdx)hdr.push(PF.indexLabel);
    hdr.push(...PF.stocks.map(s=>'Ret '+s.label));
    if(withIdx)hdr.push('Ret '+PF.indexLabel);
    const ws=XLSX.utils.aoa_to_sheet([hdr]);
    const maps=PF.stocks.map(s=>new Map(s.entries.map(e=>[e.d.getTime(),e.p])));
    const idxMap=withIdx?new Map(PF.index.entries.map(e=>[e.d.getTime(),e.p])):null;
    win.dates.forEach((t,i)=>{
      const r=i+2;
      ws['A'+r]={t:'s',v:fmtISO(new Date(t))};
      maps.forEach((mp,j)=>{ws[priceCols[j]+r]={t:'n',v:mp.get(t)}});
      if(withIdx)ws[idxPCol+r]={t:'n',v:idxMap.get(t)};
      retCols.forEach((rc,j)=>{ws[rc+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${priceCols[j]}${r}=0,"",${priceCols[j]}${r}/${priceCols[j]}${r-1}-1)`}});
      if(withIdx)ws[idxRCol+r]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${idxPCol}${r}=0,"",${idxPCol}${r}/${idxPCol}${r-1}-1)`};
    });
    const last=win.dates.length+1;
    setRef(ws,0,0,hdr.length-1,win.dates.length);
    XLSX.utils.book_append_sheet(wb,ws,'Returns');
    const wws=XLSX.utils.aoa_to_sheet([['Item','Value'],
      ['Start date',fmtISO(win.start)],['End date',fmtISO(win.end)],['n (return observations)',win.n],
      ['Frequency',win.freq],['k',win.k],['Limiting file',win.limitedBy||'']]);
    wws['!cols']=[{wch:24},{wch:22}];
    XLSX.utils.book_append_sheet(wb,wws,'Window');
    if(R.sel){
      const sel=R.sel;
      const wf=XLSX.utils.aoa_to_sheet([['Stock','Weight SIM','beta','Treynor','sei']]);
      sel.weights.forEach((r,i)=>{const er=i+2;wf['A'+er]={t:'s',v:r.label};wf['B'+er]={t:'n',v:r.w};wf['C'+er]={t:'n',v:r.beta};wf['D'+er]={t:'n',v:r.trey};wf['E'+er]={t:'n',v:r.sei}});
      XLSX.utils.book_append_sheet(wb,wf,'SIM Final');
      const wr=XLSX.utils.aoa_to_sheet([]);
      wr['A1']={t:'s',v:'vm'};wr['B1']={t:'n',v:sel.vm};
      wr['A2']={t:'s',v:'rf annual %'};wr['B2']={t:'n',v:sel.rfAnn};
      wr['C2']={t:'s',v:'k'};wr['D2']={t:'n',v:sel.k};
      ['Rank','Stock','Treynor','c4','c5','cum6','cum7','Ci','ex','beta','sei'].forEach((h,c)=>{wr[colL(c)+'4']={t:'s',v:h}});
      sel.ranked.forEach((r,i)=>{
        const er=i+5;
        const dR=`Returns!${retCols[r.key]}3:${retCols[r.key]}${last}`,eR=withIdx?`Returns!${idxRCol}3:${idxRCol}${last}`:'';
        wr['A'+er]={t:'n',v:r.rank};wr['B'+er]={t:'s',v:r.label};
        wr['I'+er]={t:'n',f:`AVERAGE(${dR})-$B$2/100/$D$2`};
        wr['J'+er]=withIdx?{t:'n',f:`SLOPE(${dR},${eR})`}:{t:'n',v:r.beta};
        wr['K'+er]=withIdx?{t:'n',f:`VAR.S(${dR})-J${er}^2*VAR.S(${eR})`}:{t:'n',v:r.sei};
        wr['C'+er]={t:'n',f:`IF(J${er}<=0,"n/a",I${er}/J${er})`};
        wr['D'+er]={t:'n',f:`I${er}*J${er}/K${er}`};wr['E'+er]={t:'n',f:`J${er}^2/K${er}`};
        wr['F'+er]={t:'n',f:`SUM(D$5:D${er})`};wr['G'+er]={t:'n',f:`SUM(E$5:E${er})`};
        wr['H'+er]={t:'n',f:`$B$1*F${er}/(1+$B$1*G${er})`};
      });
      setRef(wr,0,0,10,sel.ranked.length+3);
      XLSX.utils.book_append_sheet(wb,wr,'SIM Ranking');
      const ww2=XLSX.utils.aoa_to_sheet([]);
      ww2['A1']={t:'s',v:'C*'};ww2['B1']={t:'n',v:sel.Cstar};
      ['Stock','z_i','Weight x_i'].forEach((h,c)=>{ww2[colL(c)+'3']={t:'s',v:h}});
      sel.selected.forEach((s,i)=>{
        const er=i+4;
        const rr=sel.ranked.findIndex(r=>r.key===s.key)+5;
        ww2['A'+er]={t:'s',v:s.label};
        ww2['B'+er]={t:'n',f:`'SIM Ranking'!J${rr}/'SIM Ranking'!K${rr}*('SIM Ranking'!C${rr}-$B$1)`};
        ww2['C'+er]={t:'n',f:`B${er}/SUM(B$4:B$${sel.selected.length+3})`};
      });
      setRef(ww2,0,0,2,sel.selected.length+2);
      XLSX.utils.book_append_sheet(wb,ww2,'SIM Weights');
    }
    if(R.ccm){
      const F=R.ccm;
      const wr=XLSX.utils.aoa_to_sheet([]);
      wr['A1']={t:'s',v:'rho_bar'};wr['B1']={t:'n',v:F.rho};
      wr['A2']={t:'s',v:'r_f annual %'};wr['B2']={t:'n',v:F.rfAnn};
      wr['C2']={t:'s',v:'k'};wr['D2']={t:'n',v:F.k};
      ['Rank','Stock','(Rbar-Rf)/sigma','Cum SUM','C_i','Rbar','sigma'].forEach((h,c)=>{wr[colL(c)+'4']={t:'s',v:h}});
      F.ranked.forEach((r,i)=>{
        const er=i+5;
        const dR=`Returns!${retCols[r.key]}3:${retCols[r.key]}${last}`;
        wr['A'+er]={t:'n',v:r.rank};wr['B'+er]={t:'s',v:r.label};
        wr['F'+er]={t:'n',f:`AVERAGE(${dR})`};
        wr['G'+er]={t:'n',f:`STDEV.S(${dR})`};
        wr['C'+er]={t:'n',f:`IF(G${er}=0,"",(F${er}-$B$2/100/$D$2)/G${er})`};
        wr['D'+er]={t:'n',f:`SUM(C$5:C${er})`};
        wr['E'+er]={t:'n',f:`$B$1/(1-$B$1+A${er}*$B$1)*D${er}`};
      });
      setRef(wr,0,0,6,F.ranked.length+3);
      XLSX.utils.book_append_sheet(wb,wr,'CCM Ranking');
      const ww=XLSX.utils.aoa_to_sheet([]);
      ww['A1']={t:'s',v:'C*'};ww['B1']={t:'n',v:F.Cstar};
      ww['A2']={t:'s',v:'rho_bar'};ww['B2']={t:'n',v:F.rho};
      ['Stock','sigma_i','(Rbar-Rf)/sigma','z_i','Weight x_i'].forEach((h,c)=>{ww[colL(c)+'3']={t:'s',v:h}});
      F.selected.forEach((s,i)=>{
        const er=i+4;
        const rr=F.ranked.findIndex(r=>r.key===s.key)+5;
        ww['A'+er]={t:'s',v:s.label};
        ww['B'+er]={t:'n',f:`'CCM Ranking'!G${rr}`};
        ww['C'+er]={t:'n',f:`'CCM Ranking'!C${rr}`};
        ww['D'+er]={t:'n',f:`1/((1-$B$2)*B${er})*(C${er}-$B$1)`};
        ww['E'+er]={t:'n',f:`D${er}/SUM(D$4:D$${F.selected.length+3})`};
      });
      setRef(ww,0,0,4,F.selected.length+2);
      XLSX.utils.book_append_sheet(wb,ww,'CCM Weights');
    }
    const wc=XLSX.utils.aoa_to_sheet([['Stock','Single Index Model (%)','Constant Correlation Model (%)']]);
    const eW=new Map(R.sel?R.sel.weights.map(r=>[r.label,r.w]):[]);
    const cW=new Map(R.ccm?R.ccm.weights.map(r=>[r.label,r.w]):[]);
    const labels=[...new Set([...eW.keys(),...cW.keys()])];
    labels.sort((a,b)=>Math.max(cW.get(b)||0,eW.get(b)||0)-Math.max(cW.get(a)||0,eW.get(a)||0));
    labels.forEach((l,i)=>{const er=i+2;wc['A'+er]={t:'s',v:l};wc['B'+er]=eW.has(l)?{t:'n',v:eW.get(l)}:{t:'s',v:'-'};wc['C'+er]=cW.has(l)?{t:'n',v:cW.get(l)}:{t:'s',v:'-'}});
    let br=labels.length+3;
    wc['A'+br]={t:'s',v:'Metric'};wc['B'+br]={t:'s',v:'Single Index Model'};wc['C'+br]={t:'s',v:'Constant Correlation Model'};br++;
    const met=[
      ['Stocks selected',R.sel?R.sel.weights.length:'n/a',R.ccm?R.ccm.weights.length:'n/a'],
      ['Expected excess (ann)',R.sel?R.sel.exP*R.sel.k:'n/a',R.ccm?R.ccm.exP*R.ccm.k:'n/a'],
      ['Portfolio beta',R.sel?R.sel.bp:'n/a','n/a']
    ];
    met.forEach(m=>{wc['A'+br]={t:'s',v:m[0]};wc['B'+br]=typeof m[1]==='number'?{t:'n',v:m[1]}:{t:'s',v:String(m[1])};wc['C'+br]=typeof m[2]==='number'?{t:'n',v:m[2]}:{t:'s',v:String(m[2])};br++});
    setRef(wc,0,0,2,br-1);
    XLSX.utils.book_append_sheet(wb,wc,'Comparison');
    XLSX.writeFile(wb,`portfolio_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
}
/* ---------- Sectors tab ---------- */
const SEC={index:null,indexLabel:'Index',sectors:[],results:null};
let secSeq=0,secId=0;
function secRf(){const v=parseFloat(String(el('secRf').value).trim());return isFinite(v)?v:NaN}
function wireDrop(zoneId,btnId,input,onFiles){
  el(btnId).onclick=()=>input.click();
  input.addEventListener('change',e=>{if(e.target.files.length)onFiles([...e.target.files]);input.value=''});
  const z=el(zoneId);
  z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('over')});
  z.addEventListener('dragleave',()=>z.classList.remove('over'));
  z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('over');if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length)onFiles([...e.dataTransfer.files])});
}
async function secReadFiles(files){
  const{pdf,rest}=splitPdf(files);
  const out={added:[],pdf:pdf.length>0,bad:0};
  for(const f of rest){
    try{
      const entries=await loadFile(f);
      if(entries.length<2){out.bad++;continue}
      const det=detectFreq(entries.map(e=>e.d));
      out.added.push({uid:++secSeq,fileName:f.name,label:cleanName2(f.name),entries,detected:det,freq:det});
    }catch(e){out.bad++}
  }
  return out;
}
function renderSectors(){
  const box=el('secList');box.innerHTML='';
  SEC.sectors.forEach((sec,idx)=>{
    const d=document.createElement('div');d.className='sector';
    const h=document.createElement('h4');d.appendChild(h);
    const dz0=document.createElement('div');dz0.className='dropzone';d.appendChild(dz0);
    const ch0=document.createElement('div');ch0.className='pfchips';d.appendChild(ch0);
    const nm=document.createElement('input');nm.type='text';nm.className='secname';nm.value=sec.name;nm.placeholder=T2('secNamePh');
    nm.addEventListener('input',()=>{sec.name=nm.value});
    h.appendChild(nm);
    const rm=document.createElement('button');rm.type='button';rm.className='danger linklike';rm.textContent=T2('secRmSec');
    rm.style.marginInlineStart='auto';
    rm.onclick=()=>{SEC.sectors=SEC.sectors.filter(x=>x.id!==sec.id);SEC.results=null;renderSectors();renderSecOut();refreshSecBtn()};
    h.appendChild(rm);
    const dz=dz0;
    const p=document.createElement('p');p.textContent=T2('secDz');dz.appendChild(p);
    const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=T2('secUp');
    dz.appendChild(b);
    const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.accept='.csv,.xlsx,.xls';inp.style.display='none';
    dz.appendChild(inp);
    b.onclick=()=>inp.click();
    inp.addEventListener('change',async e=>{
      if(!e.target.files.length)return;
      const r=await secReadFiles([...e.target.files]);e.target.value='';
      sec.cands.push(...r.added);SEC.results=null;
      if(r.pdf)secFlash(T2('pdfMsg'));
      if(r.bad)secFlash(T2('pfBadFile'));
      renderSectors();renderSecOut();refreshSecBtn();toast(T('loaded'));
    });
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
    dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
    dz.addEventListener('drop',async e=>{
      e.preventDefault();dz.classList.remove('over');
      if(!e.dataTransfer||!e.dataTransfer.files.length)return;
      const r=await secReadFiles([...e.dataTransfer.files]);
      sec.cands.push(...r.added);SEC.results=null;
      if(r.pdf)secFlash(T2('pdfMsg'));
      if(r.bad)secFlash(T2('pfBadFile'));
      renderSectors();renderSecOut();refreshSecBtn();toast(T('loaded'));
    });
    const ch=ch0;
    sec.cands.forEach(c=>{ch.appendChild(chipEl(c.label,pfFreqName(c.freq),()=>{sec.cands=sec.cands.filter(x=>x.uid!==c.uid);SEC.results=null;renderSectors();renderSecOut();refreshSecBtn()}))});
    box.appendChild(d);
  });
  refreshSecBtn();
}
function secFlash(t){el('secMsg').innerHTML+=warnbox(t)}
function sectorFinal(r){
  if(!r||r.error||!r.rows||!r.rows.length)return{label:null,option:((r&&r.choice&&r.choice.mode)||'sim')};
  const m=(r.choice&&r.choice.mode)||'sim';
  if(m==='sim')return r.simWinner?{label:r.simWinner.label,option:'sim'}:{label:null,option:'sim'};
  if(m==='ccm')return r.ccmWinner?{label:r.ccmWinner.label,option:'ccm'}:{label:null,option:'ccm'};
  const c=r.rows.find(x=>x.label===(r.choice&&r.choice.manual));
  if(!c)return{label:null,option:'manual'};
  return (c.simValid||c.ccmValid)?{label:c.label,option:'manual'}:{label:null,option:'manual'};
}
function refreshSecBtn(){
  const rfOk=isFinite(secRf());
  const ok=!!(rfOk&&SEC.sectors.some(s=>s.cands.length>=2));
  el('secGo').disabled=!ok;
  el('secGo').title=ok?'':T2('secNeed');
  const has=!!(SEC.results&&SEC.results.length);
  el('secDl').disabled=!has;el('secCopy').disabled=!has;
  const sendable=!!(SEC.results&&SEC.results.some(r=>sectorFinal(r).label));
  el('secSend').disabled=!sendable;
  el('secSend').title=sendable?'':T2('secNeed');
}
function secSimReason(row){
  if(!row.simValid)return row.simWhy==='beta'?T2('rBeta'):T2('rNeg');
  return'';
}
function secCcmReason(row){
  if(!row.ccmValid)return row.ccmWhy==='sigma0'?'σ = 0':T2('rNeg');
  return'';
}
function renderSecOut(){
  const box=el('secOut');box.innerHTML='';
  if(!SEC.results)return;
  let agree=0,disagree=0;
  SEC.results.forEach(r=>{
    if(r.simWinner&&r.ccmWinner){
      if(r.simWinner.label===r.ccmWinner.label)agree++;else disagree++;
    }
  });
  const sum=document.createElement('p');sum.className='sent';
  sum.textContent=T2('secSummary').replace('{n}',SEC.results.length).replace('{a}',agree).replace('{d}',disagree);
  box.appendChild(sum);
  const gl=document.createElement('div');gl.className='inputsrow';
  const glLab=document.createElement('span');glLab.className='field';
  const glT=document.createElement('label');glT.textContent=T2('secApplyAll');glLab.appendChild(glT);
  const glSel=document.createElement('select');glSel.innerHTML=`<option value="sim">${escapeHtml(T2('secFollowSim'))}</option><option value="ccm">${escapeHtml(T2('secFollowCcm'))}</option>`;
  glLab.appendChild(glSel);gl.appendChild(glLab);
  const glBtn=document.createElement('button');glBtn.type='button';glBtn.className='ghost';glBtn.textContent=T2('secReset');
  glBtn.onclick=()=>{SEC.results.forEach(r=>{r.choice={mode:'sim',manual:null}});renderSecOut();refreshSecBtn()};
  gl.appendChild(glBtn);box.appendChild(gl);
  glSel.onchange=()=>{
    SEC.results.forEach(r=>{if(r.choice.mode!=='manual')r.choice={mode:glSel.value,manual:null}});
    renderSecOut();refreshSecBtn();glSel.value='sim';
  };
  SEC.results.forEach(r=>{
    const d=document.createElement('div');d.className='sector';
    const h=document.createElement('h4');h.textContent=r.name||('Sector '+(r.idx+1));d.appendChild(h);
    if(r.error==='empty'){const p=document.createElement('p');p.className='mutedlist';p.textContent=T2('secNoCand');d.appendChild(p);box.appendChild(d);return}
    if(r.error){
      const p=document.createElement('p');p.className='mutedlist';
      p.textContent=(r.error==='smalln'||r.error==='novar')?T2('secNoData'):((r.error==='freqMismatch'||r.error==='freq')?freqListMsg(r.freqs):T2('secNone'));
      d.appendChild(p);box.appendChild(d);return;
    }
    const cols=document.createElement('div');cols.className='twocol';
    const simC=document.createElement('div');simC.className='simcol';
    const ccmC=document.createElement('div');ccmC.className='ccmcol';
    simC.innerHTML=`<h4 style="margin:0 0 6px">Single Index Model</h4>`;
    ccmC.innerHTML=`<h4 style="margin:0 0 6px">Constant Correlation Model</h4>`;
    if(!r.simAvailable){
      const p=document.createElement('p');p.className='mutedlist';p.textContent=T2('secNeedsIdx');simC.appendChild(p);
    }else if(r.simWinner){
      const w=document.createElement('p');w.className='sent';
      w.textContent=T2('secWin').replace('{w}',r.simWinner.label)+' ';
      const rs=document.createElement('span');rs.className='mutedlist';
      rs.textContent=T2('secSimReason').replace('{n}',r.rows.length);
      w.appendChild(rs);simC.appendChild(w);
    }else{const p=document.createElement('p');p.className='mutedlist';p.textContent=T2('secNone');simC.appendChild(p)}
    if(r.ccmWinner){
      const w=document.createElement('p');w.className='sent';
      w.textContent=T2('secWin').replace('{w}',r.ccmWinner.label)+' ';
      const rs=document.createElement('span');rs.className='mutedlist';
      rs.textContent=T2('secCcmReason').replace('{n}',r.rows.length);
      w.appendChild(rs);ccmC.appendChild(w);
    }else{const p=document.createElement('p');p.className='mutedlist';p.textContent=T2('secNone');ccmC.appendChild(p)}
    cols.appendChild(simC);cols.appendChild(ccmC);d.appendChild(cols);
    if(r.simWinner&&r.ccmWinner){
      if(r.simWinner.label===r.ccmWinner.label){
        const p=document.createElement('p');p.className='sent';
        p.innerHTML=`${escapeHtml(T2('secAgree').replace('{w}',r.simWinner.label))}<span class="wintag">★</span>`;
        d.appendChild(p);
      }else{
        const p=document.createElement('p');p.className='sent';p.style.color='var(--warn)';
        p.textContent=T2('secDisagree')+'. '+T2('secPickOne')+'.';
        d.appendChild(p);
      }
    }
    if(r.rows&&r.rows.length){
      const tw=document.createElement('div');tw.className='tablewrap';
      let htm=`<table style="min-width:0"><thead><tr><th>Stock</th><th class="numh">n</th><th class="numh">${T2('thEx')}</th><th class="numh">${T2('thBeta')}</th><th class="numh">${T2('thTrey')}</th><th class="numh">${T2('thStd')}</th><th class="numh">${T2('thRatio')}</th><th class="numh">${T2('thSim')}</th><th class="numh">${T2('thCcm')}</th></tr></thead><tbody>`;
      r.rows.forEach(c=>{
        const isSW=!!(r.simWinner&&c.key===r.simWinner.key);
        const isCW=!!(r.ccmWinner&&c.key===r.ccmWinner.key);
        let sRes,sTip='';
        if(!r.simAvailable){sRes=T2('secNeedsIdx')}
        else if(isSW){sRes=T2('vWin')}else if(!c.simValid){sRes=T2('vInv');sTip=secSimReason(c)}else{sRes=T2('vNot')}
        let cRes,cTip='';
        if(isCW){cRes=T2('vWin')}else if(!c.ccmValid){cRes=T2('vInv');cTip=secCcmReason(c)}else{cRes=T2('vNot')}
        htm+=`<tr><td class="per">${escapeHtml(c.label)}</td><td class="num">${c.n}</td><td class="num">${(c.exAnn*100).toFixed(2)}%</td><td class="num">${isFinite(c.beta)?c.beta.toFixed(3):'—'}</td><td class="num">${isFinite(c.treyAnn)?c.treyAnn.toFixed(3):'n/a'}</td><td class="num">${isFinite(c.stdAnn)?(c.stdAnn*100).toFixed(2)+'%':'—'}</td><td class="num">${isFinite(c.ratioAnn)?c.ratioAnn.toFixed(3):'n/a'}</td><td class="num"${sTip?` title="${escapeHtml(sTip)}"`:''}>${sRes}${isSW?'<span class="wintag">★</span>':''}</td><td class="num"${cTip?` title="${escapeHtml(cTip)}"`:''}>${cRes}${isCW?'<span class="wintag">★</span>':''}</td></tr>`;
      });
      tw.innerHTML=htm+'</tbody></table>';d.appendChild(tw);
    }
    const fin=document.createElement('div');fin.className='inputsrow';
    const fl=document.createElement('span');fl.className='field';
    const ft=document.createElement('label');ft.textContent=T2('secFinal');fl.appendChild(ft);
    const mode=document.createElement('select');
    mode.innerHTML=`<option value="sim">${escapeHtml(T2('secFollowSim'))}</option><option value="ccm">${escapeHtml(T2('secFollowCcm'))}</option><option value="manual">${escapeHtml(T2('secManual'))}</option>`;
    mode.value=r.choice.mode;fl.appendChild(mode);fin.appendChild(fl);
    const manWrap=document.createElement('span');manWrap.className='field';
    const man=document.createElement('select');
    man.innerHTML=r.rows.map(c=>`<option value="${escapeHtml(c.label)}"${r.choice.manual===c.label?' selected':''}>${escapeHtml(c.label)}</option>`).join('');
    manWrap.appendChild(man);manWrap.style.display=r.choice.mode==='manual'?'':'none';fin.appendChild(manWrap);
    d.appendChild(fin);
    mode.onchange=()=>{r.choice={mode:mode.value,manual:mode.value==='manual'?(r.rows[0]?r.rows[0].label:null):null};renderSecOut();refreshSecBtn()};
    man.onchange=()=>{r.choice.manual=man.value;renderSecOut();refreshSecBtn()};
    const f=sectorFinal(r);
    const fp=document.createElement('p');fp.className='sent';
    fp.textContent=f.label?('Final: '+f.label):T2('secNone');
    d.appendChild(fp);
    box.appendChild(d);
  });
}
function downloadSectorsExcel(){
  if(!SEC.results)return;
  try{
    const rf=secRf();
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.aoa_to_sheet([]);
    ws['A1']={t:'s',v:'r_f annual % (editable input)'};ws['B1']={t:'n',v:rf};
    ['Sector','Stock','Start','End','n','k','Excess return (annualized)','Beta','Treynor (annualized)','Std (annualized)','Return/Std (annualized)','SIM result','CCM result'].forEach((h,c)=>{ws[colL(c)+'3']={t:'s',v:h}});
    XLSX.utils.book_append_sheet(wb,ws,'Sector selection');
    let er=4;
    const finRows=[];
    SEC.results.forEach((r,idx)=>{
      const secName=r.name||('Sector '+(r.idx+1));
      const f0=sectorFinal(r);
      finRows.push([secName,f0.label||'—',f0.option==='sim'?T2('secFollowSim'):(f0.option==='ccm'?T2('secFollowCcm'):T2('secManual'))]);
      if(!r.rows||!r.rows.length||!r.win||!r.win.dates)return;
      const sh=('R'+(idx+1)+'_'+safeName(secName).replace(/'/g,'_')).slice(0,28);
      const nc=r.rows.length;
      const priceCols=r.rows.map((_,j)=>colL(1+j));
      const idxPCol=r.simAvailable?colL(1+nc):null;
      const retBase=r.simAvailable?2+nc:1+nc;
      const retCols=r.rows.map((_,j)=>colL(retBase+j));
      const idxRCol=r.simAvailable?colL(retBase+nc):null;
      const hdr=['Date',...r.rows.map(c=>c.label)];
      if(r.simAvailable)hdr.push(SEC.indexLabel||'Index');
      hdr.push(...r.rows.map(c=>'Ret '+c.label));
      if(r.simAvailable)hdr.push('Ret '+(SEC.indexLabel||'Index'));
      const wsh=XLSX.utils.aoa_to_sheet([hdr]);
      const maps=(r.candFiles||[]).map(cf=>new Map(cf.entries.map(e=>[e.d.getTime(),e.p])));
      const idxMap=r.simAvailable?new Map(SEC.index.entries.map(e=>[e.d.getTime(),e.p])):null;
      r.win.dates.forEach((t,i)=>{
        const rr2=i+2;
        wsh['A'+rr2]={t:'s',v:fmtISO(new Date(t))};
        r.rows.forEach((c,j)=>{wsh[priceCols[j]+rr2]=maps[j]?{t:'n',v:maps[j].get(t)}:{t:'s',v:''}});
        if(r.simAvailable)wsh[idxPCol+rr2]={t:'n',v:idxMap.get(t)};
        r.rows.forEach((c,j)=>{wsh[retCols[j]+rr2]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${priceCols[j]}${rr2}=0,"",${priceCols[j]}${rr2}/${priceCols[j]}${rr2-1}-1)`}});
        if(r.simAvailable)wsh[idxRCol+rr2]=i===0?{t:'n',v:null}:{t:'n',f:`IF(${idxPCol}${rr2}=0,"",${idxPCol}${rr2}/${idxPCol}${rr2-1}-1)`};
      });
      const last=r.win.dates.length+1;
      setRef(wsh,0,0,hdr.length-1,r.win.dates.length);
      XLSX.utils.book_append_sheet(wb,wsh,sh);
      r.rows.forEach((c,j)=>{
        const dR=`'${sh}'!${retCols[j]}3:${retCols[j]}${last}`;
        const eR=r.simAvailable?`'${sh}'!${idxRCol}3:${idxRCol}${last}`:'';
        ws['A'+er]={t:'s',v:secName};ws['B'+er]={t:'s',v:c.label};
        ws['C'+er]={t:'s',v:fmtISO(r.win.start)};ws['D'+er]={t:'s',v:fmtISO(r.win.end)};
        ws['E'+er]={t:'n',v:c.n};ws['F'+er]={t:'n',v:r.k};
        ws['G'+er]={t:'n',f:`(AVERAGE(${dR})-$B$1/100/F${er})*F${er}`};
        if(r.simAvailable)ws['H'+er]={t:'n',f:`SLOPE(${dR},${eR})`};
        else ws['H'+er]={t:'s',v:'n/a (no index)'};
        ws['I'+er]={t:'n',f:`IF(ISTEXT(H${er}),"n/a",IF(H${er}<=0,"n/a",G${er}/H${er}))`};
        ws['J'+er]={t:'n',f:`STDEV.S(${dR})*SQRT(F${er})`};
        ws['K'+er]={t:'n',f:`IF(STDEV.S(${dR})=0,"n/a",(AVERAGE(${dR})-$B$1/100/F${er})/STDEV.S(${dR})*SQRT(F${er}))`};
        const isSW=!!(r.simWinner&&c.key===r.simWinner.key),isCW=!!(r.ccmWinner&&c.key===r.ccmWinner.key);
        ws['L'+er]=!r.simAvailable?{t:'s',v:'Needs an index file'}:{t:'s',v:isSW?'Winner':(!c.simValid?'Not valid':'Not chosen')};
        ws['M'+er]={t:'s',v:isCW?'Winner':(!c.ccmValid?'Not valid':'Not chosen')};
        er++;
      });
    });
    setRef(ws,0,0,12,Math.max(er-1,3));ws['!cols']=[{wch:16},{wch:14},{wch:12},{wch:12},{wch:6},{wch:6},{wch:22},{wch:10},{wch:20},{wch:16},{wch:20},{wch:14},{wch:14}];
    const wf=XLSX.utils.aoa_to_sheet([['Sector','Chosen stock','Option']]);
    finRows.forEach((f,i)=>{
      const rr2=i+2;
      wf['A'+rr2]={t:'s',v:f[0]};wf['B'+rr2]={t:'s',v:f[1]};wf['C'+rr2]={t:'s',v:f[2]};
    });
    setRef(wf,0,0,2,Math.max(finRows.length+1,1));wf['!cols']=[{wch:18},{wch:16},{wch:28}];
    XLSX.utils.book_append_sheet(wb,wf,'Final choice');
    XLSX.writeFile(wb,`sectors_${todayISO()}.xlsx`);toast(T('dlDone'));
  }catch(e){toast(String(e&&e.message||e),true)}
}
/* ---------- new self-tests (a)(b)(c) ---------- */
function synthMarket(){
  let s=123456789;const rnd=()=>((s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff);
  const N=400,dates=[];let d=new Date(2021,9,4);
  for(let i=0;i<=N;i++){dates.push(new Date(d.getTime()));d.setDate(d.getDate()+1)}
  const idxR=[];for(let i=0;i<N;i++)idxR.push(0.001+(rnd()-0.5)*0.008);
  const defs=[{a:0.001,b:1.0},{a:0.0005,b:0.7},{a:0.0,b:1.3},{a:-0.001,b:0.5}];
  const toE=(rets,p0)=>{const out=[{d:dates[0],p:p0}];let p=p0;rets.forEach((r,i)=>{p=p*(1+r);out.push({d:dates[i+1],p})});return out};
  return{idxE:toE(idxR,1000),stockE:defs.map((D,j)=>toE(idxR.map(r=>D.a+D.b*r+(rnd()-0.5)*0.004),100+j*10))};
}
function runTabTests(){
  // (a) Simple pipeline === Box E pipeline on identical synthetic inputs
  try{
    const S=synthMarket(),rf=12,names=['SYN_A','SYN_B','SYN_C','SYN_D'];
    const kS=state.stocks,kI=state.index,kW=state.win;
    const kLbl=el('labelIndex').value,kRf=el('rfAnnual').value;
    state.stocks=S.stockE.map((e,i)=>({id:100+i,fileName:names[i],label:names[i],entries:e,detected:'daily',freq:'daily',betaGiven:null}));
    state.index={entries:S.idxE,detected:'daily',freq:'daily',fileName:'IDX'};
    el('labelIndex').value='Index';el('rfAnnual').value=String(rf);
    state.win=computeWindow();
    const core=computeCore(true);
    const items=[],excluded=[];
    core.rows.forEach(r=>{
      const it={key:r.stockId,label:r.label,exI:r.exI,beta:r.beta,sei:r.sei,trey:r.trey};
      if(!(r.beta>0))excluded.push(it);else if(!(r.sei>0))excluded.push(it);else items.push(it);
    });
    const ref=eltonGruber(items,core.vm);
    const w2=computeWindowFor([...names.map((n,i)=>({label:n,entries:S.stockE[i],freq:'daily'})),{label:'Index',entries:S.idxE,freq:'daily'}]);
    const c2=coreFor(w2,names.map((n,i)=>({label:n,entries:S.stockE[i]})),S.idxE,rf);
    const tst=selectPortfolio(c2.rows,c2.vm);
    let ok=true;
    ok=ok&&state.win.start.getTime()===w2.start.getTime()&&state.win.end.getTime()===w2.end.getTime()&&state.win.n===w2.n;
    core.rows.forEach((r,i)=>{const q=c2.rows[i];
      ok=ok&&r.label===q.label&&Math.abs(r.beta-q.beta)<=1e-12&&Math.abs(r.sei-q.sei)<=1e-12&&Math.abs(r.exI-q.exI)<=1e-12&&Math.abs(r.trey-q.trey)<=1e-12});
    const rw={};ref.weights.forEach(x=>{rw[x.label]=x.w});
    const tw={};tst.weights.forEach(x=>{tw[x.label]=x.w});
    ok=ok&&ref.selected.length===tst.selected.length&&Object.keys(rw).length===Object.keys(tw).length;
    Object.keys(rw).forEach(l=>{ok=ok&&(l in tw)&&Math.abs(rw[l]-tw[l])<=1e-9});
    ok=ok&&Math.abs(ref.bp-tst.bp)<=1e-12&&Math.abs(ref.exP-tst.exP)<=1e-12&&Math.abs((ref.Cstar||0)-(tst.Cstar||0))<=1e-12;
    console.log(`[tabtest-a] Simple tab === Box E (same files+rf): selected=[${tst.weights.map(x=>x.label).join(',')||'none'}] -> ${ok?'PASS':'FAIL'}`);
    state.stocks=kS;state.index=kI;state.win=kW;
    el('labelIndex').value=kLbl;el('rfAnnual').value=kRf;
    refreshWindow(false);
  }catch(e){console.log('[tabtest-a] ERROR -> FAIL',String(e&&e.message||e))}
  // (b) sector winner known
  try{
    const mk=(rets,p0)=>{const out=[];let d=new Date(2022,0,3),p=p0;out.push({d:new Date(d.getTime()),p});rets.forEach(r=>{d=new Date(d.getTime()+864e5);p=p*(1+r);out.push({d:new Date(d.getTime()),p})});return out};
    const idx=[];for(let i=0;i<60;i++)idx.push(i%2?0.000:0.002);
    const A=idx.map(r=>r+0.001),B=idx.map(r=>r-0.0005);
    const cands=[{label:'A',entries:mk(A,100),freq:'daily'},{label:'B',entries:mk(B,50),freq:'daily'}];
    const out=pickSectorWinner(cands,mk(idx,1000),'daily',0);
    const ok=!!out.winner&&out.winner.label==='A';
    console.log(`[tabtest-b] sector winner: got=${out.winner?out.winner.label:'none'} expected=A -> ${ok?'PASS':'FAIL'}`);
  }catch(e){console.log('[tabtest-b] ERROR -> FAIL',String(e&&e.message||e))}
  // (c) all-negative sector
  try{
    const mk=(rets,p0)=>{const out=[];let d=new Date(2022,0,3),p=p0;out.push({d:new Date(d.getTime()),p});rets.forEach(r=>{d=new Date(d.getTime()+864e5);p=p*(1+r);out.push({d:new Date(d.getTime()),p})});return out};
    const idx=[];for(let i=0;i<60;i++)idx.push(i%2?0.000:0.002);
    const cands=[{label:'C1',entries:mk(idx.map(r=>r-0.005),100),freq:'daily'},{label:'C2',entries:mk(idx.map(r=>r-0.003),50),freq:'daily'}];
    const out=pickSectorWinner(cands,mk(idx,1000),'daily',0);
    const ok=!out.winner&&!out.error;
    console.log(`[tabtest-c] all-negative sector -> "${!out.winner?'No valid stock in this sector':'winner?'}" -> ${ok?'PASS':'FAIL'}`);
  }catch(e){console.log('[tabtest-c] ERROR -> FAIL',String(e&&e.message||e))}
}
/* ---------- sector dual-criterion self-tests (a)(b)(c)(d) ---------- */
function runSectorBothTests(){
  const mk=(rets,p0)=>{const out=[];let d=new Date(2022,0,3),p=p0;out.push({d:new Date(d.getTime()),p});rets.forEach(r=>{d=new Date(d.getTime()+864e5);p=p*(1+r);out.push({d:new Date(d.getTime()),p})});return out};
  const cardHTML=res=>{
    const keep=SEC.results;SEC.results=res;renderSecOut();
    const h=el('secOut').innerHTML;SEC.results=keep;renderSecOut();refreshSecBtn();return h;
  };
  const mkRes=(out,name,cands)=>({secId:-1,idx:0,name,win:out.win,rows:out.rows,simWinner:out.simWinner,ccmWinner:out.ccmWinner,simAvailable:out.simAvailable,choice:{mode:'sim',manual:null},candFiles:cands.map(c=>({fileName:c.label,label:c.label,entries:c.entries,detected:'daily',freq:'daily'}))});
  // (a) SIM winner and CCM winner are known and DIFFERENT
  try{
    const idx=[];for(let i=0;i<60;i++)idx.push(i%2?-0.0005:0.002);
    const p4=[],q4=[],A4=[1,1,-1,-1],B4=[1,-1,-1,1];for(let i=0;i<60;i++){p4.push(A4[i%4]);q4.push(B4[i%4])}
    const HI=idx.map((x,i)=>0.0015+1.2*x+0.005*p4[i]);
    const LO=idx.map((x,i)=>0.0009+1.0*x+0.0012*q4[i]);
    const MID=idx.map((x,i)=>0.0005+1.0*x+0.002*p4[i]);
    const cands=[{label:'HI',entries:mk(HI,100),freq:'daily'},{label:'LO',entries:mk(LO,50),freq:'daily'},{label:'MID',entries:mk(MID,80),freq:'daily'}];
    const out=pickSectorBoth(cands,mk(idx,1000),'daily',0);
    const okS=!!out.simWinner&&out.simWinner.label==='HI';
    const okC=!!out.ccmWinner&&out.ccmWinner.label==='LO';
    const h=cardHTML([mkRes(out,'T',cands)]);
    const okD=h.indexOf(T2('secDisagree'))>=0;
    console.log(`[sectest-a] SIM=${out.simWinner?out.simWinner.label:'none'}(expect HI) CCM=${out.ccmWinner?out.ccmWinner.label:'none'}(expect LO) disagree-line=${okD} -> ${(okS&&okC&&okD)?'PASS':'FAIL'}`);
  }catch(e){console.log('[sectest-a] ERROR -> FAIL',String(e&&e.message||e))}
  // (b) both models pick the same stock -> card shows "Both models agree"
  try{
    const idx=[];for(let i=0;i<60;i++)idx.push(i%2?0.000:0.002);
    const A=idx.map(r=>r+0.001),B=idx.map(r=>r-0.0005);
    const cands=[{label:'A',entries:mk(A,100),freq:'daily'},{label:'B',entries:mk(B,50),freq:'daily'}];
    const out=pickSectorBoth(cands,mk(idx,1000),'daily',0);
    const same=!!out.simWinner&&!!out.ccmWinner&&out.simWinner.label===out.ccmWinner.label&&out.simWinner.label==='A';
    const h=cardHTML([mkRes(out,'T',cands)]);
    const okL=h.indexOf(T2('secAgree').replace('{w}','A'))>=0;
    console.log(`[sectest-b] SIM=${out.simWinner?out.simWinner.label:'none'} CCM=${out.ccmWinner?out.ccmWinner.label:'none'} agree-line=${okL} -> ${(same&&okL)?'PASS':'FAIL'}`);
  }catch(e){console.log('[sectest-b] ERROR -> FAIL',String(e&&e.message||e))}
  // (c) no index -> CCM runs, SIM shows "Needs an index file"
  try{
    const idx=[];for(let i=0;i<60;i++)idx.push(i%2?0.000:0.002);
    const A=idx.map(r=>r+0.001),B=idx.map(r=>r-0.0005);
    const cands=[{label:'A',entries:mk(A,100),freq:'daily'},{label:'B',entries:mk(B,50),freq:'daily'}];
    const out=pickSectorBoth(cands,null,null,0);
    const okC=!!out.ccmWinner&&out.ccmWinner.label==='A';
    const h=cardHTML([mkRes(out,'T',cands)]);
    const okS=out.simAvailable===false&&out.simWinner===null&&h.indexOf(T2('secNeedsIdx'))>=0;
    console.log(`[sectest-c] simAvailable=${out.simAvailable} CCM=${out.ccmWinner?out.ccmWinner.label:'none'}(expect A) needs-index-line=${h.indexOf(T2('secNeedsIdx'))>=0} -> ${(okC&&okS)?'PASS':'FAIL'}`);
  }catch(e){console.log('[sectest-c] ERROR -> FAIL',String(e&&e.message||e))}
  // (d) all negative excess -> no valid stock under both models
  try{
    const idx=[];for(let i=0;i<60;i++)idx.push(i%2?0.000:0.002);
    const cands=[{label:'C1',entries:mk(idx.map(r=>r-0.005),100),freq:'daily'},{label:'C2',entries:mk(idx.map(r=>r-0.003),50),freq:'daily'}];
    const out=pickSectorBoth(cands,mk(idx,1000),'daily',0);
    const ok=!out.error&&out.simWinner===null&&out.ccmWinner===null;
    const h=cardHTML([mkRes(out,'T',cands)]);
    const okL=h.indexOf(T2('secNone'))>=0;
    console.log(`[sectest-d] SIM=${out.simWinner?out.simWinner.label:'none'} CCM=${out.ccmWinner?out.ccmWinner.label:'none'} no-valid-line=${okL} -> ${(ok&&okL)?'PASS':'FAIL'}`);
  }catch(e){console.log('[sectest-d] ERROR -> FAIL',String(e&&e.message||e))}
}
function applyTabLang(){
  el('tabBtnPf').textContent=T2('tabPf');el('tabBtnSec').textContent=T2('tabSec');el('tabBtnAdv').textContent=T2('tabAdv');
  el('t-pfTitle').textContent=T2('pfTitle');
  el('t-pfDzS').textContent=T2('pfDzS');el('t-pfUpS').textContent=T2('pfUpS');
  el('t-pfDzI').textContent=T2('pfDzI');el('t-pfUpI').textContent=T2('pfUpI');
  el('t-pfRf').textContent=T2('pfRf');el('t-pfRfHint').textContent=T2('pfRfHint');
  el('t-pfGo').textContent=T2('pfGo');
  el('t-pfThS').textContent=T2('pfThS');el('t-pfThW').textContent=T2('pfThW');
  el('t-pfNotSel').textContent=T2('pfNotSel');
  el('t-pfDl').textContent=T2('pfDl');el('t-pfXlsx').textContent=T2('pfXlsx');el('t-pfCopy').textContent=T2('pfCopy');
  el('t-pfStart').textContent=T2('pfStart');el('t-pfEdit').textContent=T2('pfEdit');
  el('t-pfDetails').textContent=T2('pfDetails');el('t-pfFoot').textContent=T2('pfFoot');
  el('t-secTitle').textContent=T2('secTitle');el('t-secIdxOpt').textContent=T2('secIdxOpt');
  el('t-secDzI').textContent=T2('secDzI');el('t-secUpI').textContent=T2('secUpI');
  el('t-secRf').textContent=T2('secRf');el('t-secRfHint').textContent=T2('secRfHint');
  el('t-secArea').textContent=T2('secArea');el('t-secAdd').textContent=T2('secAdd');
  el('t-secGo').textContent=T2('secGo');el('t-secNote').textContent=T2('secNote');
  el('t-secDl').textContent=T2('secDl');el('t-secCopy').textContent=T2('secCopy');el('t-secSend').textContent=T2('secSend');
  renderPF();renderSectors();renderSecIdx();
  if(PF.result)renderPFResult();
  if(SEC.results)renderSecOut();
  refreshSecBtn();
}
/* ---------- wiring (new tabs) ---------- */
function freqListMsg(freqs){
  const fs=(freqs&&freqs.length?freqs:['?']).map(pfFreqName);
  return T2('pfFreqBad').replace('{minor}',fs.join('/')).replace(/\{major\}/g,fs[0]||'?');
}
function wirePortfolioUI_Part1(){
  el('tabBtnPf').onclick=()=>switchTab('portfolio');
  el('tabBtnSec').onclick=()=>switchTab('sectors');
  wireDrop('pfDropStocks','pfBtnStocks',el('pfFileStocks'),pfAddStocks);
  wireDrop('pfDropIndex','pfBtnIndex',el('pfFileIndex'),f=>{if(f[0])pfAddIndex(f[0])});
  el('pfRf').addEventListener('input',()=>{PF.result=null;if(!el('pf-step2').hidden)showPfStep(1);renderPF()});
}
function pfComputeCCM(win,stocks,rf){
  const k=win.k,rfPer=rf/100/k;
  const rets=stocks.map(s=>{
    const mp=new Map(s.entries.map(e=>[e.d.getTime(),e.p]));
    return simpleReturns(win.dates.map(t=>mp.get(t)));
  });
  const sds=rets.map(r=>Math.sqrt(svar(r))),means=rets.map(r=>mean(r));
  const{rho,pairs}=avgPairwiseCorr(rets,sds);
  if(!(rho>0&&rho<1))return{error:'rho',rho,pairs};
  const items=stocks.map((s,i)=>({key:i,label:s.label,Rbar:means[i],sigma:sds[i],ex:means[i]-rfPer}));
  const out=ccmModel(items,rho);
  const selKeys=new Set(out.selected.map(r=>r.key));
  const rejected=out.excluded.map(r=>({label:r.label,rc:'sigma0'}));
  out.ranked.forEach(r=>{
    if(selKeys.has(r.key))return;
    if(r.ex<0)rejected.push({label:r.label,rc:'neg'});
    else rejected.push({label:r.label,rc:'cut'});
  });
  const cov=sampleCovMat(rets);
  const l2i=new Map(stocks.map((s,i)=>[s.label,i]));
  const vr=realizedVarForWeights(out.weights,cov,l2i);
  let varM=NaN;
  if(out.weights.length){
    varM=0;
    for(let a=0;a<out.weights.length;a++)for(let b=0;b<out.weights.length;b++)
      varM+=out.weights[a].w*out.weights[b].w*(a===b?out.weights[a].sigma*out.weights[a].sigma:rho*out.weights[a].sigma*out.weights[b].sigma);
  }
  return{...out,rejected,total:stocks.length,k,rfAnn:rf,rfPer,rho,rhoGiven:false,pairs,
    exP:out.exP,varM,sdM:isFinite(varM)&&varM>0?Math.sqrt(varM):NaN,
    sharpeM:(isFinite(out.exP)&&isFinite(varM)&&varM>0)?out.exP/Math.sqrt(varM):NaN,
    varR:vr,sdRAnn:isFinite(vr)&&vr>0?Math.sqrt(vr)*Math.sqrt(k):NaN,
    sharpeRAnn:(isFinite(out.exP)&&isFinite(vr)&&vr>0)?(out.exP/Math.sqrt(vr))*Math.sqrt(k):NaN};
}
function wirePortfolioUI_Part2(){
el('pfGo').onclick=()=>{
  const rf=pfRf();
  if(!isFinite(rf)||PF.stocks.length<2)return;
  const winStocks=computeWindowFor(PF.stocks.map(s=>({label:s.label,entries:s.entries,freq:s.freq})));
  if(!winStocks||winStocks.error||winStocks.n<30){pfFlash(winStocks&&winStocks.error==='noOverlap'?T2('pfNoCommon'):T2('pfSmallN').replace('{n}',winStocks?winStocks.n:'?'));return}
  let winFull=null,core=null,sel=null;
  if(PF.index){
    winFull=pfWin();
    if(winFull&&!winFull.error&&winFull.n>=30){
      core=coreFor(winFull,PF.stocks,PF.index.entries,rf);
      if(!core.error){
        sel=selectPortfolio(core.rows,core.vm);
        sel.k=winFull.k;sel.rfAnn=rf;sel.vm=core.vm;
      }else sel=null;
    }else sel=null;
  }
  const ccmWin=(sel&&winFull)?winFull:winStocks;
  const ccm=pfComputeCCM(ccmWin,PF.stocks,rf);
  const ccmOk=!(ccm&&ccm.error);
  if(!sel&&!ccmOk){
    if(ccm&&ccm.error==='rho')pfFlash('The Constant Correlation Model could not be applied to these stocks');
    else pfFlash(T2('pfNoVar'));
    return;
  }
  PF.result={sel,ccm:ccmOk?ccm:null,ccmError:ccmOk?null:ccm,win:ccmWin,winFull,rfAnn:rf,k:ccmWin.k,
    simWin:sel?winFull:null,coreVm:core?core.vm:NaN};
  showPfStep(2);renderPFResult();toast(T('calculated'));
  console.log(`[portfolio] SIM=${sel?sel.weights.map(r=>r.label+':'+(r.w*100).toFixed(2)+'%').join(', ')||'none':'n/a'} | CCM=${ccmOk?ccm.weights.map(r=>r.label+':'+(r.w*100).toFixed(2)+'%').join(', ')||'none':'n/a'}`);
};
el('pfDl').onclick=downloadResultsSheet;
el('pfXlsx').onclick=downloadResultsXlsx;
el('pfCopy').onclick=async()=>{
  try{await navigator.clipboard.writeText(pfCopyText());toast(T('copied'))}
  catch(e){toast(T('copyFail'),true)}
};
el('pfStart').onclick=()=>{PF.stocks=[];PF.index=null;PF.result=null;el('pfRf').value='';showPfStep(1);renderPF();toast(T('cleared'))};
el('pfEdit').onclick=()=>showPfStep(1);
// el('pfDetails').onclick removed
wireDrop('secDropIndex','secBtnIndex',el('secFileIndex'),async f=>{
  if(!f[0])return;
  if(/\.pdf$/i.test(f[0].name||'')){secFlash(T2('pdfMsg'));return}
  try{
    const entries=await loadFile(f[0]);
    if(entries.length<2){secFlash(T2('pfBadFile'));return}
    const det=detectFreq(entries.map(e=>e.d));
    SEC.index={entries,detected:det,freq:det,fileName:f[0].name};
    SEC.indexLabel=cleanName2(f[0].name);
  }catch(e){secFlash(T2('pfBadFile'));return}
  SEC.results=null;renderSecIdx();renderSecOut();refreshSecBtn();toast(T('loaded'));
});
function renderSecIdx(){
  const c=el('secIdxChip');c.innerHTML='';
  if(SEC.index)c.appendChild(chipEl(SEC.indexLabel,pfFreqName(SEC.index.freq)+' · '+T2('idxTag'),()=>{SEC.index=null;SEC.results=null;renderSecIdx();renderSecOut();refreshSecBtn()}));
}
el('secRf').addEventListener('input',()=>{SEC.results=null;renderSecOut();refreshSecBtn()});
el('secAdd').onclick=()=>{SEC.sectors.push({id:++secId,name:'',cands:[]});renderSectors()};
el('secGo').onclick=()=>{
  const rf=secRf();
  if(!isFinite(rf))return;
  const hasIdx=!!SEC.index;
  SEC.results=SEC.sectors.map((sec,idx)=>{
    if(!sec.cands.length)return{secId:sec.id,idx,name:sec.name,error:'empty',rows:[],simWinner:null,ccmWinner:null,choice:{mode:'sim',manual:null},candFiles:[]};
    const out=pickSectorBoth(sec.cands,hasIdx?SEC.index.entries:null,hasIdx?SEC.index.freq:null,rf);
    if(out.error)return{secId:sec.id,idx,name:sec.name,error:out.error,win:out.win,freqs:out.freqs,rows:[],simWinner:null,ccmWinner:null,simAvailable:out.simAvailable,choice:{mode:'sim',manual:null},candFiles:[]};
    const res={secId:sec.id,idx,name:sec.name,win:out.win,rows:out.rows,simWinner:out.simWinner,ccmWinner:out.ccmWinner,simAvailable:out.simAvailable,note:out.note,rfAnn:rf,k:out.win.k,
      candFiles:sec.cands.map(c=>({fileName:c.fileName,label:c.label,entries:c.entries,detected:c.detected,freq:c.freq}))};
    if(res.simWinner&&res.ccmWinner&&res.simWinner.label===res.ccmWinner.label)res.choice={mode:'sim',manual:null};
    else res.choice={mode:'sim',manual:null};
    return res;
  });
  renderSecOut();refreshSecBtn();toast(T('calculated'));
  SEC.results.forEach(r=>console.log(`[sectors] "${r.name||'Sector '+(r.idx+1)}": SIM=${r.simWinner?r.simWinner.label:'none'} CCM=${r.ccmWinner?r.ccmWinner.label:'none'}${r.error?' error='+r.error:''} final=${sectorFinal(r).label||'none'}`));
};
el('secDl').onclick=downloadSectorsExcel;
el('secCopy').onclick=async()=>{
  const parts=[];
  (SEC.results||[]).forEach(r=>{
    const f=sectorFinal(r);
    parts.push((r.name||'Sector')+': SIM='+(r.simWinner?r.simWinner.label:(r.simAvailable?T2('secNone'):T2('secNeedsIdx')))+' CCM='+(r.ccmWinner?r.ccmWinner.label:T2('secNone'))+' Final='+(f.label||T2('secNone')));
    (r.rows||[]).forEach(c=>parts.push(`${c.label}\t${(c.exAnn*100).toFixed(2)}%\t${isFinite(c.beta)?c.beta.toFixed(3):'—'}\t${isFinite(c.treyAnn)?c.treyAnn.toFixed(3):'n/a'}\t${isFinite(c.stdAnn)?(c.stdAnn*100).toFixed(2)+'%':'—'}\t${isFinite(c.ratioAnn)?c.ratioAnn.toFixed(3):'n/a'}`));
  });
  try{await navigator.clipboard.writeText(parts.join('\n'));toast(T('copied'))}
  catch(e){toast(T('copyFail'),true)}
};
el('secSend').onclick=()=>{
  if(!SEC.results)return;
  const wins=[],skipped=[];
  SEC.results.forEach(r=>{
    const f=sectorFinal(r);
    if(f.label){
      const c=(r.candFiles||[]).find(x=>x.label===f.label);
      if(c)wins.push(c);
      else skipped.push(r.name||('Sector '+(r.idx+1)));
    }else if(r.error!=='empty')skipped.push(r.name||('Sector '+(r.idx+1)));
  });
  if(!wins.length)return;
  PF.stocks=wins.map(w=>({uid:++pfSeq,fileName:w.fileName,label:w.label,entries:w.entries,detected:w.detected,freq:w.freq}));
  PF.result=null;showPfStep(1);switchTab('portfolio');renderPF();
  if(skipped.length){pfFlash(T2('secSkipped').replace('{list}',skipped.join(', ')));toast(T2('secSkipped').replace('{list}',skipped.join(', ')),true)}
  else toast(T2('secSent'));
};

}
function runCCMTests(){
  const ok=(n,c,e,t)=>{const p=Math.abs(c-e)<=t;console.log(`[ccm-test] ${n}: calc=${c} expected=${e} -> ${p?'PASS':'FAIL'}`);return p};
  let all=true;
  try{
    const rho=0.5,Rf=5;
    const items=[{key:0,label:'S1',Rbar:15,sigma:10,ex:10},{key:1,label:'S2',Rbar:12,sigma:10,ex:7},{key:2,label:'S3',Rbar:8,sigma:10,ex:3}];
    const out=ccmModel(items,rho);
    all=ok('ratio1',out.ranked[0].ratio,1.0,1e-9)&&all;
    all=ok('ratio2',out.ranked[1].ratio,0.7,1e-9)&&all;
    all=ok('ratio3',out.ranked[2].ratio,0.3,1e-9)&&all;
    all=ok('C1',out.ranked[0].ci,0.5,1e-9)&&all;
    all=ok('C2',out.ranked[1].ci,0.5666666666666667,1e-6)&&all;
    all=ok('C3',out.ranked[2].ci,0.5,1e-9)&&all;
    const selL=out.selected.map(r=>r.label).join(',');
    const selOk=(selL==='S1,S2');
    console.log(`[ccm-test] selected: ${selL} expected S1,S2 -> ${selOk?'PASS':'FAIL'}`);all=selOk&&all;
    all=ok('C*',out.Cstar,0.5666666666666667,1e-6)&&all;
    const wM={};out.weights.forEach(x=>{wM[x.label]=x.w});
    all=ok('w1',wM['S1']*100,76.47058823529412,1e-4)&&all;
    all=ok('w2',wM['S2']*100,23.52941176470588,1e-4)&&all;
    const ex=[10,7],sd=[10,10];
    const Sig=[[100,50],[50,100]];
    const b=solveLin(Sig,ex);
    const sb=b[0]+b[1];
    const e1=b[0]/sb,e2=b[1]/sb;
    all=ok('opt-w1',wM['S1'],e1,1e-9)&&all;
    all=ok('opt-w2',wM['S2'],e2,1e-9)&&all;
    void sd;
    console.log(`[ccm-test] hardcoded example ${all?'ALL PASS':'SOME FAIL'}`);
  }catch(e){console.log('[ccm-test] hardcoded ERROR -> FAIL',String(e&&e.message||e));all=false}
  try{
    if(state.stocks.length>=2&&state.win&&!state.win.error&&state.win.n>=30&&isFinite(getRf())&&state.resF&&state.resF.weights.length){
      const F=state.resF;
      const sel=F.selected;
      const n=sel.length;
      const Sig=[];for(let i=0;i<n;i++){Sig.push([]);for(let j=0;j<n;j++)Sig[i].push(i===j?sel[i].sigma*sel[i].sigma:F.rho*sel[i].sigma*sel[j].sigma)}
      const b=solveLin(Sig,sel.map(r=>r.ex));
      const sb=b.reduce((s,x)=>s+x,0);
      let okc=true;
      const wM={};F.weights.forEach(x=>{wM[x.key]=x.w});
      sel.forEach((r,i)=>{const e=b[i]/sb;const p=Math.abs(wM[r.key]-e)<=1e-8;if(!p)console.log(`[ccm-test] live optimal ${r.label}: calc=${wM[r.key]} expected=${e} -> FAIL`);okc=okc&&p});
      console.log(`[ccm-test] live optimality (all z>0) -> ${okc?'PASS':'FAIL'}`);
      all=okc&&all;
    }else console.log('[ccm-test] live optimality skipped (need 2+ stocks, rf and a calculated CCM)');
  }catch(e){console.log('[ccm-test] live ERROR -> FAIL',String(e&&e.message||e));all=false}
  try{
    let okd=true;
    if(state.resE&&state.resE.weights.length){
      const s=state.resE.weights.reduce((a,r)=>a+r.w,0);
      const p=Math.abs(s-1)<=1e-9;console.log(`[ccm-test] SIM weights sum=${s} -> ${p?'PASS':'FAIL'}`);okd=p&&okd;
    }
    if(state.resF&&state.resF.weights.length){
      const s=state.resF.weights.reduce((a,r)=>a+r.w,0);
      const p=Math.abs(s-1)<=1e-9;console.log(`[ccm-test] CCM weights sum=${s} -> ${p?'PASS':'FAIL'}`);okd=p&&okd;
    }
    const cmp=buildComparison();
    if(cmp){
      let okc=true;
      cmp.rows.forEach(r=>{
        const d=r.diff-((r.ccm||0)-(r.sim||0));
        if(Math.abs(d)>1e-9){console.log(`[ccm-test] diff ${r.label} -> FAIL`);okc=false}
      });
      console.log(`[ccm-test] comparison Difference = CCM - SIM -> ${okc?'PASS':'FAIL'}`);okd=okc&&okd;
    }else console.log('[ccm-test] comparison diff skipped (need both models)');
    all=okd&&all;
  }catch(e){console.log('[ccm-test] weights-sum ERROR -> FAIL',String(e&&e.message||e));all=false}
  try{
    if(PF.result&&(PF.result.sel||PF.result.ccm)&&state.resE&&state.resF){
      let oke=true;
      if(PF.result.sel&&state.resE){
        const aM={};PF.result.sel.weights.forEach(x=>{aM[x.label]=x.w});
        state.resE.weights.forEach(x=>{
          const p=(x.label in aM)&&Math.abs(aM[x.label]-x.w)<=1e-9;
          if(!p){console.log(`[ccm-test] simple-vs-adv SIM ${x.label} -> FAIL`);oke=false}
        });
        if(PF.result.sel.weights.length!==state.resE.weights.length){console.log('[ccm-test] simple-vs-adv SIM count -> FAIL');oke=false}
      }
      if(PF.result.ccm&&state.resF){
        const aM={};PF.result.ccm.weights.forEach(x=>{aM[x.label]=x.w});
        state.resF.weights.forEach(x=>{
          const p=(x.label in aM)&&Math.abs(aM[x.label]-x.w)<=1e-9;
          if(!p){console.log(`[ccm-test] simple-vs-adv CCM ${x.label} -> FAIL`);oke=false}
        });
        if(PF.result.ccm.weights.length!==state.resF.weights.length){console.log('[ccm-test] simple-vs-adv CCM count -> FAIL');oke=false}
      }
      console.log(`[ccm-test] simple tab === advanced boxes -> ${oke?'PASS':'FAIL'}`);
      all=oke&&all;
    }else console.log('[ccm-test] simple-vs-advanced skipped (calculate both tabs first)');
  }catch(e){console.log('[ccm-test] simple-vs-adv ERROR -> FAIL',String(e&&e.message||e));all=false}
  console.log(`[ccm-test] suite ${all?'ALL PASS (ran)':'SOME FAIL / skipped parts'}`);
}
SEC.sectors.push({id:++secId,name:'',cands:[]});

/* ============ init ============ */
window.initPortfolioEngine = function() {
  if (window._portfolioEngineInitialized) {
    if (typeof applyTabLang === 'function') applyTabLang();
    return;
  }
  window._portfolioEngineInitialized = true;
  if (typeof wirePortfolioUI_Part1 === 'function') wirePortfolioUI_Part1();
  if (typeof wirePortfolioUI_Part2 === 'function') wirePortfolioUI_Part2();
  setLang('ar');
  try { runMathSelfTest(); } catch(e) { console.warn(e); }
  try { runTextbookTest(); } catch(e) { console.warn(e); }
  try { runTabTests(); } catch(e) { console.warn(e); }
  try { runCCMTests(); } catch(e) { console.warn(e); }
  try { runSectorBothTests(); } catch(e) { console.warn(e); }
  console.log('[portfolio-engine] Initialized in Meezan.');
};
