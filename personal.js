/* 自然科學王個人挑戰：預設零輸入訪客模式；班級模式保留原有雲端成績功能。 */
const $ = id => document.getElementById(id);
const localQuestions = Array.isArray(window.NATURE_QUESTIONS) ? window.NATURE_QUESTIONS : [];
const units = {'01-01':'動物如何求生存','01-02':'動物具有社會行為嗎','01-03':'動物如何延續生命','02-01':'樂音與噪音有什麼不同','02-02':'樂器如何發出不同的聲音','02-03':'光有什麼特性與現象'};
const sections = ['joinPanel','setupPanel','questionPanel','endPanel'];
let mode='guest', cls=null, student='', qs=[], idx=0,score=0,correct=0,history=[],picked=false;
let cloud=null;
function show(id){sections.forEach(k=>$(k).classList.toggle('hidden', k!==id));}
function msg(v){$('message').textContent=v||'';}
function errText(e){return e?.message||String(e);}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
async function client(){if(cloud)return cloud;cloud=await import('./supabase-client.js');if(!cloud.configured)throw Error('尚未設定 Supabase，班級模式暫時不可使用。');return cloud;}
async function ensureUser(){const {sb,authUser}=await client();let u=await authUser();if(u)return u;const {data,error}=await sb.auth.signInAnonymously();if(error)throw error;return data.user;}
async function fetchPool(){const q=[...localQuestions];if(mode==='class'){
  const {sb}=await client();const {data,error}=await sb.from('nature_questions').select('id,unit,difficulty,topic,question,options,answer,explanation').eq('is_active',true).limit(1000);
  if(error){msg('雲端題目暫時無法載入，改用內建題庫。');}else{const ids=new Set(q.map(x=>String(x.id)));for(const d of data||[])if(!ids.has(String(d.id)))q.push(d);}
 }
 const filter=$('unitFilter').value;
 return q.filter(x=>(filter==='all'||String(x.unit).startsWith(filter))&&Array.isArray(x.options)&&x.options.length===4&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<=3);
}
async function poolStatus(){const pool=await fetchPool();$('poolStatus').textContent=`可用題目：${pool.length} 題`;} 
$('unitFilter').addEventListener('change',()=>poolStatus().catch(e=>msg(errText(e))));
async function startGame(){try{
  const pool=await fetchPool();if(!pool.length)throw Error('目前找不到可用題目，請檢查 questions.js 是否已上傳到網站。');
  const count=Number($('count').value)||10;qs=shuffle(pool).slice(0,count);idx=0;score=0;correct=0;history=[];msg('');show('questionPanel');round();
 }catch(e){msg(errText(e));show('setupPanel');}}
function round(){picked=false;const q=qs[idx];$('progress').textContent=`第 ${idx+1} / ${qs.length} 題`;$('score').textContent=`${score} 分`;
 $('topic').textContent=(units[q.unit]||q.unit)+' · '+(q.topic||'');$('questionText').textContent=q.question;$('feedback').textContent='';
 $('nextBtn').classList.add('hidden');$('options').replaceChildren();q.options.forEach((opt,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1}. ${opt}`;b.addEventListener('click',()=>choose(i));$('options').append(b);});
}
function choose(i){if(picked)return;picked=true;const q=qs[idx];const yes=i===q.answer;score+=yes?100:0;correct+=yes?1:0;
 history.push({question_id:q.id,choice:i+1,correct:yes});[...$('options').children].forEach((b,j)=>{b.disabled=true;if(j===i)b.classList.add('chosen');if(j===q.answer)b.style.borderColor='#67eab1';});
 $('score').textContent=`${score} 分`;$('feedback').textContent=(yes?'✅ 正確！+100 分':`❌ 答錯了。正確答案為 ${q.answer+1}。`)+(q.explanation?' '+q.explanation:'');
 $('nextBtn').textContent=idx+1===qs.length?'查看成績':'下一題';$('nextBtn').classList.remove('hidden');
}
$('nextBtn').addEventListener('click',async()=>{if(!picked)return;if(++idx<qs.length){round();return;}
 show('endPanel');$('result').textContent=`${mode==='guest'?'訪客':student}：${score} 分，答對 ${correct}/${qs.length} 題`;
 if(mode==='guest'){$('saveStatus').textContent='訪客練習：不記錄姓名、班級，也不將成績上傳 Supabase。';return;}
 $('saveStatus').textContent='正在將成績存入班級紀錄…';try{const {sb,authUser}=await client();const u=await authUser();if(!u)throw Error('登入狀態失效，請重新加入班級');
 const {error}=await sb.from('nature_sessions').insert({class_id:cls,mode:'solo',user_id:u.id,display_name:student,score,correct_count:correct,question_count:qs.length,details:history});if(error)throw error;
 $('saveStatus').textContent='✅ 成績已儲存至 Supabase，老師可以在線上查看。';
 }catch(e){$('saveStatus').textContent='⚠ 成績未能儲存：'+errText(e);}
});
$('again').addEventListener('click',()=>{if(mode==='guest')startGame();else show('setupPanel');});
$('playBtn').addEventListener('click',startGame);
$('switchClass').addEventListener('click',()=>{cls=null;mode='class';show('joinPanel');});
$('guestBtn').addEventListener('click',()=>{mode='guest';cls=null;student='';startGame();});
$('classModeBtn').addEventListener('click',()=>{mode='class';show('joinPanel');msg('班級模式需要班級代碼與姓名，成績才會記錄到老師後台。');});
$('backGuestBtn').addEventListener('click',()=>{mode='guest';cls=null;student='';startGame();});
$('joinForm').addEventListener('submit',async e=>{e.preventDefault();$('joinSubmit').disabled=true;msg('正在加入班級…');try{await ensureUser();const {sb}=await client();const {data,error}=await sb.rpc('nature_join_class',{p_code:$('joinCode').value.trim(),p_name:$('studentName').value.trim()});if(error)throw error;
 if(!data?.length)throw Error('查無班級資料');cls=data[0].class_id;student=$('studentName').value.trim();mode='class';$('welcome').textContent=`${student}，歡迎加入 ${data[0].class_name}！`;
 $('playBtn').textContent='開始班級挑戰';show('setupPanel');await poolStatus();msg('成功加入班級');
 }catch(err){msg(errText(err));}finally{$('joinSubmit').disabled=false;}});
/* 不等待 Supabase、不要求暱稱或班級代碼，網站開啟後立即出題。 */
if(!localQuestions.length){msg('題庫檔案尚未載入，請確認 questions.js 與 personal.html 位於同一資料夾。');show('setupPanel');}
else startGame();
