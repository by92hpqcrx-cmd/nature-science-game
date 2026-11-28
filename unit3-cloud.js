/* Optional public Supabase question-bank bridge (unit 3 only).
   No secret/service-role key. Fail closed if table policies deny reads. */
(()=>{'use strict';
const cfg=window.NATURE_SUPABASE;
if(!cfg?.url||!cfg?.anonKey)return;
const unitNames=['03-01','03-02','03-03','03-04','04-04'];
const field=(r,...keys)=>{for(const k of keys)if(r[k]!==undefined&&r[k]!==null&&String(r[k]).trim()!=='')return r[k];return null};
function choices(row){const v=field(row,'options','choices','answers','option_list');if(Array.isArray(v))return v.map(x=>typeof x==='object'?String(x.text??x.label??x.value??''):String(x));if(typeof v==='string'){try{const p=JSON.parse(v);if(Array.isArray(p))return choices({...row,options:p})}catch(_){}if(v.includes('|'))return v.split('|').map(x=>x.trim())}return ['a','b','c','d'].map((x,i)=>field(row,'option_'+x,'choice_'+x,x)).filter(x=>x!=null).map(String)}
function activity(row){const explicit=String(row.activity||'');if(['03-04','04-04'].includes(explicit))return explicit;const source=[field(row,'source','source_name'),field(row,'unit','unit_name','unit_title','unit_code','chapter','chapter_name','category'),field(row,'activity','activity_code','activity_no','section','topic')].filter(x=>x!=null).join(' ');
const m=source.match(/0?3\s*[-_／/]\s*0?([123])/)||source.match(/活動\s*([一二三123])/);
if(m)return '03-0'+({'一':1,'二':2,'三':3}[m[1]]||m[1]);
if(!/第三單元|神祕的天空|天空|太陽|星空|星座|天文|^0?3$/.test(source))return '';
if(/太陽系|八大行星|行星|衛星/.test(source))return '03-02';
if(/星星|星空|星座|北極星|星座盤/.test(source))return '03-03';
return '03-01'}
function normalize(row,index){const unit=activity(row);if(!unitNames.includes(unit))return null;const question=field(row,'question','question_text','question_content','question_title','prompt','question_body','question_stem','title','text','q','題目','題幹');const options=choices(row);if(!question||![2,4].includes(options.length)||options.some(x=>!x.trim()))return null;const raw=field(row,'correct_answer','correct_option','correct','answer','answer_index','correct_index');let answer=-1;
if(typeof raw==='number'){answer=raw>=0&&raw<options.length?raw:raw===options.length?raw-1:-1}
else if(raw!=null){const v=String(raw).trim();if(/^[A-Da-d]$/.test(v))answer=v.toUpperCase().charCodeAt(0)-65;else if(/^\d+$/.test(v)){const n=Number(v);answer=n>=0&&n<options.length?n:n===options.length?n-1:-1}else answer=options.indexOf(v)}
if(answer<0||answer>=options.length)return null;
return {id:'cloud3-'+String(field(row,'id','question_id','qid')??index),unit,type:options.length===2?'true_false':'choice',difficulty:String(field(row,'difficulty')??'中'),topic:String(field(row,'topic','source_name','source')??'第三單元'),question:String(question),options,answer,explanation:String(field(row,'explanation','explain','analysis','solution','reason')??'')}}
let loading=false;
async function load(){if(loading)return;loading=true;try{const root=cfg.url.replace(/\/+$/,'');const existing=new Set((window.NATURE_QUESTIONS||[]).map(x=>x.unit+'|'+x.question.replace(/\s+/g,'')));const results=[];let reason='';
for(const table of ['quiz_questions','nature_questions','fundesk_supplement_questions']){for(let offset=0;true;offset+=500){try{const url=root+'/rest/v1/'+table+'?select=*&'+(table==='nature_questions'?'is_active':'active')+'=eq.true&order=id.asc&limit=500&offset='+offset;const r=await fetch(url,{headers:{apikey:cfg.anonKey,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok){reason=table+' HTTP '+r.status;break}const page=await r.json();if(!Array.isArray(page))break;for(let i=0;i<page.length;i++){const q=normalize(page[i],table+'-'+offset+'-'+i);if(q){const identity=q.unit+'|'+q.question.replace(/\s+/g,'');if(!existing.has(identity)){q.id=table+':'+q.id;results.push(q);existing.add(identity)}}}if(page.length<500)break}catch(e){reason=String(e?.message||e);break}}}
if(!reason||results.length){window.NATURE_CLOUD_QUESTIONS=results;window.dispatchEvent(new CustomEvent('nature:cloud-questions',{detail:results}))}window.dispatchEvent(new CustomEvent('nature:cloud-status',{detail:{added:results.length,error:reason}}))}finally{loading=false}}
window.reloadNatureCloud=load;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load().catch(()=>{}),{once:true});else load().catch(()=>{});
})();
