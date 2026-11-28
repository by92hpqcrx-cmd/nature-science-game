(()=>{
'use strict';
const $=id=>document.getElementById(id);
const units={'01-01':'動物如何求生存','01-02':'動物具有社會行為嗎','01-03':'動物如何延續生命','02-01':'樂音與噪音有什麼不同','02-02':'樂器如何發出不同的聲音','02-03':'光有什麼特性與現象','03-01':'太陽的位置和四季有關嗎','03-02':'太陽系有哪些成員','03-03':'四季的星空有什麼不一樣','03-04':'補充活動3','04-01':'空氣與燃燒有什麼關係','04-02':'燃燒的條件與如何滅火','04-03':'為何會生鏽與如何防鏽','04-04':'補充活動4'};
const mathUnits={'9-01':'3的乘法','9-02':'6的乘法','9-03':'7的乘法','9-04':'9的乘法','9-05':'乘法的應用','10-01':'平面圖形的邊、角和頂點','10-02':'正三角形、正方形和長方形','10-03':'認識周界、內部和外部','10-04':'認識周長'};
const baseQuestions=[...(window.NATURE_QUESTIONS||[]).map(q=>({...q,subject:'science'})),...(window.NATURE_MATH_QUESTIONS||[]).map(q=>({...q,subject:'math'}))];
let questions=[...baseQuestions];
const token=new URL(location.href).searchParams.get('fundeskToken')||'';
const connectedOrigin=location.origin;
let classes=[],mode='practice',selected=[],round=null,clock=null,connected=false,submitted=false;
const safe=q=>String(q??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const stamp=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
const gameId=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
const getUnits=()=> $('subject').value==='math'?mathUnits:units;
const shuffle=ar=>{const a=[...ar];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function show(id){['setup','game','finished','tabletHost','examHost'].forEach(k=>$(k).classList.toggle('hidden',k!==id));}
const activityPicks={science:new Set(Object.keys(units)),math:new Set(Object.keys(mathUnits))};
const expandedUnits={science:new Set(),math:new Set()};
const unitTitles={'01':'第一單元・動物世界','02':'第二單元・探索聲光世界','03':'第三單元・神祕的天空','04':'第四單元・燃燒與生鏽','9':'第九單元・乘法','10':'第十單元・平面圖形'};
const currentPicks=()=>activityPicks[$('subject').value];
function activitySelection(){return [...currentPicks()]}
function eligible(q){return q.subject===$('subject').value&&Array.isArray(q.options)&&[2,4].includes(q.options.length)&&($('questionType').value==='all'||q.options.length===Number($('questionType').value))&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length}
function pool(){return questions.filter(q=>eligible(q)&&currentPicks().has(String(q.unit)))}
function refreshUnits(){refreshActivities()}
function refreshActivities(){
 const subject=$('subject').value,picks=currentPicks(),open=expandedUnits[subject],groups=new Map(),counts=new Map();
 for(const q of questions)if(eligible(q))counts.set(String(q.unit),(counts.get(String(q.unit))||0)+1);
 for(const [key,name] of Object.entries(getUnits())){const unit=key.split('-')[0];if(!groups.has(unit))groups.set(unit,[]);groups.get(unit).push([key,name])}
 const root=$('activityGroups');root.replaceChildren();
 for(const [unit,items] of groups){
  const details=document.createElement('details');details.className='king-bank-unit';details.open=open.has(unit);
  details.ontoggle=()=>{if(details.open)open.add(unit);else open.delete(unit)};
  const summary=document.createElement('summary');const selectedCount=items.filter(([key])=>picks.has(key)).length;
  summary.innerHTML='<strong>'+safe(unitTitles[unit]||unit)+'</strong><span>'+selectedCount+'/'+items.length+' 活動 · '+items.reduce((n,[key])=>n+(picks.has(key)?counts.get(key)||0:0),0)+' 題</span>';details.append(summary);
  const actions=document.createElement('div');actions.className='king-bank-actions';
  for(const [label,checked] of [['全選本單元',true],['取消本單元',false]]){const btn=document.createElement('button');btn.type='button';btn.textContent=label;btn.onclick=()=>{open.add(unit);for(const [key] of items)checked?picks.add(key):picks.delete(key);refreshActivities()};actions.append(btn)}details.append(actions);
  for(const [key,name] of items){const label=document.createElement('label');label.className='king-bank-activity';const input=document.createElement('input');input.type='checkbox';input.checked=picks.has(key);input.onchange=()=>{open.add(unit);input.checked?picks.add(key):picks.delete(key);refreshActivities()};const title=document.createElement('span');title.textContent=name.startsWith('補充活動')?name:'活動 '+Number(key.split('-')[1])+'　'+name;const count=document.createElement('small');count.textContent=(counts.get(key)||0)+' 題';label.append(input,title,count);details.append(label)}
  root.append(details);
 }
 $('poolInfo').textContent='已選 '+picks.size+' 個活動，共 '+pool().length+' 題'+(picks.size>1?'（混合抽題）':'');
}
function drawQuestions(qs,count){const groups=shuffle(activitySelection()).map(code=>shuffle(qs.filter(q=>String(q.unit)===code))).filter(g=>g.length);const chosen=[];while(chosen.length<count&&groups.some(g=>g.length)){for(const g of groups){if(g.length&&chosen.length<count)chosen.push(g.pop())}}return shuffle(chosen)}

function classList(){return classes.find(c=>c.code===$('classSelect').value);}
function renderPlayers(){
 const c=classList();
 const eligible=c?.students||[];
 selected=selected.filter(id=>eligible.some(s=>String(s.id)===String(id)));
 $('playerPick').classList.toggle('hidden',['tablet','exam'].includes(mode));
 $('tabletClassHint').classList.toggle('hidden',!['tablet','exam'].includes(mode));
 $('playerPick').replaceChildren();
 for(const s of eligible){
  const b=document.createElement('button');b.type='button';b.className='student'+(selected.includes(String(s.id))?' selected':'');
  const img=s.avatar?'<img src="'+safe(s.avatar)+'" alt="">':'<span>👩‍🎓</span>';
  b.innerHTML=img+'<span>'+safe(s.no)+' 號 '+safe(s.name)+'<small>'+(selected.includes(String(s.id))?'✅ 已選取':'點選加入')+'</small></span>';
  b.onclick=()=>{
   const id=String(s.id),has=selected.includes(id);
   if(has)selected=selected.filter(x=>x!==id);
   else if(mode==='score')selected=[id];
   else if(selected.length<4)selected.push(id);
   else{alert('班級競賽最多選擇四位學生');return}
   renderPlayers();
  };
  $('playerPick').append(b);
 }
}
function setMode(m){
 mode=m;selected=[];
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('picked',b.dataset.mode===m));
 $('rosterArea').classList.toggle('hidden',m==='practice');
 $('duration').parentElement.classList.toggle('hidden',m!=='competition'&&m!=='tablet');
 $('connection').textContent=m==='practice'?'🌱 個人練習免登入，成績不寫入 FunDesk。':
 connected?(m==='tablet'?'✅ 已連接 FunDesk。請選班級後建立 QR Code 等待學生加入。':'✅ 已連接 FunDesk。請選班級與學生；結束時儲存成績。'):
 '🔒 請從已登入的 FunDesk「自然科學王」捷徑開啟，才能使用學生計分與競賽。';
 renderPlayers();
}
function rosterFromParent(event){
 if(!token||!window.opener||event.source!==window.opener||event.origin!==connectedOrigin)return;
 const data=event.data;
 if(data?.token!==token||data?.kind!=='fundesk-king-roster')return;
 if(!Array.isArray(data.classes))return;
 classes=data.classes.filter(c=>typeof c.code==='string'&&Array.isArray(c.students)).map(c=>({
  code:c.code,label:String(c.label||c.code),students:c.students.filter(st=>st&&st.id!=null).map(st=>({
   id:String(st.id),no:Number(st.no)||0,name:String(st.name||''),avatar:String(st.avatar||'')
  }))
 }));
 connected=classes.length>0;
 $('classSelect').replaceChildren(...classes.map(c=>new Option(c.label,c.code)));
 setMode(mode);
}
window.addEventListener('message',rosterFromParent);
if(token&&window.opener){
 let ticks=0;
 const ready=()=>{
  if(connected||ticks++>35){clearInterval(handshake);return}
  window.opener.postMessage({kind:'fundesk-king-ready',token},connectedOrigin);
 };
 const handshake=setInterval(ready,700);ready();
}
window.addEventListener('nature:cloud-questions',e=>{
 questions=[...baseQuestions,...(e.detail||[]).map(q=>({...q,subject:'science'}))];
 refreshActivities();
});
function start(){
 if(!pool().length)return alert('請先勾選有可用題目的活動');
 if(mode==='exam'){if(!connected)return alert('請從已登入的 FunDesk 開啟');if(!window.FunDeskKingExam)return alert('測驗模組載入中');const qs=pool();if(!qs.length)return alert('沒有可用題目');const count=Math.min(Number($('count').value)||10,qs.length);const chosen=drawQuestions(qs,count);const picked=prompt('本次試卷共 '+count+' 題。輸入 R 隨機組卷，或輸入題庫題號（逗號分隔）自選題目。\n'+qs.map((q,i)=>(i+1)+'. '+q.question).join('\n'),'R');if(picked===null)return;let paper=chosen;if(picked.trim().toUpperCase()!=='R'){const ids=picked.split(/[,，\s]+/).filter(Boolean).map(Number);if(!ids.length||ids.length>100||new Set(ids).size!==ids.length||ids.some(i=>!Number.isInteger(i)||i<1||i>qs.length))return alert('題號無效');paper=ids.map(i=>qs[i-1])}if(!confirm('確認試卷 '+paper.length+' 題？\n'+paper.map((q,i)=>(i+1)+'. '+q.question).join('\n')))return;window.FunDeskKingExam.start({classroom:classList(),questions:paper,subject:$('subject').value,token,show});return}

 if(mode==='tablet'){
  if(!connected){alert('平板模式請由已登入的 FunDesk 開啟。');return}
  if(!window.FunDeskKingTablet){alert('平板競賽模組仍在載入，請檢查網路後重試。');return}
  window.FunDeskKingTablet.start({classroom:classList(),questions:drawQuestions(pool(),Math.min(Number($('count').value)||10,pool().length)),subject:$('subject').value,duration:Number($('duration').value)||20,token,show});
  return;
 }
 if(mode!=='practice'&&!connected){alert('個人計分與班級競賽需由已登入的 FunDesk 開啟');return;}
 const c=classList();
 if(mode==='score'&&selected.length!==1){alert('請選一位學生');return;}
 if(mode==='competition'&&(selected.length<2||selected.length>4)){alert('請選擇 2～4 位參賽學生');return;}
 const qs=drawQuestions(pool(),Math.min(Number($('count').value)||10,pool().length));
 if(!qs.length){alert('所選條件沒有題目');return;}
 const players=mode==='practice'?[{id:'guest',code:'',no:0,name:'練習者'}]:selected.map(id=>{
  const st=c.students.find(x=>String(x.id)===id);
  return {id,code:c.code,no:st.no,name:st.name,avatar:st.avatar};
 });
 round={id:gameId(),mode,subject:$('subject').value,questions:qs,index:0,players:players.map(p=>({...p,score:0,correct:0,latency:0,answer:null,answeredAt:null})),history:[],locked:false,startedAt:0,remaining:0};
 submitted=false;show('game');renderRound();
}
function endClock(){if(clock){clearInterval(clock);clock=null}}
function renderRound(){
 endClock();round.locked=false;const q=round.questions[round.index];
 round.players.forEach(p=>{p.answer=null;p.answeredAt=null});
 $('modeLabel').textContent=mode==='practice'?'🌱 個人練習':mode==='score'?'🏅 個人計分':'🏆 班級競賽';
 $('progress').textContent=(round.index+1)+' / '+round.questions.length+' 題';
 $('topic').textContent=(getUnits()[q.unit]||q.unit)+'・'+(q.topic||'');
 $('question').textContent=q.question;$('feedback').textContent='';
 $('options').replaceChildren();$('next').classList.add('hidden');
 $('reveal').classList.toggle('hidden',mode!=='competition');
 const multi=mode==='competition';
 q.options.forEach((opt,i)=>{
  const btn=document.createElement('button');btn.type='button';btn.textContent=(i+1)+'. '+opt;
  btn.disabled=multi;btn.onclick=()=>answer(0,i);$('options').append(btn);
 });
 $('contestants').classList.toggle('hidden',!multi);
 renderContestants();
 round.startedAt=performance.now();
 if(multi){
  const limit=Number($('duration').value)||20;round.remaining=limit;
  $('timer').textContent='⏱ '+limit+' 秒';
  clock=setInterval(()=>{
   if(round.locked){endClock();return}
   round.remaining=Math.max(0,limit-(performance.now()-round.startedAt)/1000);
   $('timer').textContent='⏱ '+Math.ceil(round.remaining)+' 秒';
   if(round.remaining<=0)reveal();
  },100);
 }else $('timer').textContent='';
}
function renderContestants(){
 if(mode!=='competition')return;
 $('contestants').replaceChildren();
 round.players.forEach((p,i)=>{
  const box=document.createElement('div');box.className='contestant';
  const buttons=round.questions[round.index].options.map((o,j)=>'<button type="button" data-p="'+i+'" data-o="'+j+'" '+(round.locked||p.answer!==null?'disabled':'')+' class="'+(p.answer===j?'chosen':'')+'">'+(j+1)+'</button>').join('');
  box.innerHTML='<strong>'+safe(p.no)+' 號 '+safe(p.name)+'</strong><small>'+p.score+' 分・'+(p.answer!==null?'✅ 已鎖定':'選擇答案')+'</small><div class="answerBtns">'+buttons+'</div>';
  box.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.p),Number(b.dataset.o)));
  $('contestants').append(box);
 });
}
function answer(pi,choice){
 if(!round||round.locked)return;
 const p=round.players[pi],q=round.questions[round.index];if(!p||p.answer!==null)return;
 p.answer=choice;p.answeredAt=performance.now()-round.startedAt;
 if(mode!=='competition'){reveal();return;}
 renderContestants();
 if(round.players.every(x=>x.answer!==null))reveal();
}
function reveal(){
 if(!round||round.locked)return;round.locked=true;endClock();
 const q=round.questions[round.index];
 const right=round.players.filter(p=>p.answer===q.answer).sort((a,b)=>a.answeredAt-b.answeredAt);
 const speedWinner=right[0]?.id;
 for(const p of round.players){
  const yes=p.answer===q.answer;
  const gain=mode==='competition'?(yes?(p.id===speedWinner?100:60):0):(yes?100:0);
  p.score+=gain;p.correct+=yes?1:0;
  if(yes)p.latency+=p.answeredAt||0;
 }
 round.history.push({questionId:String(q.id),question:q.question,correctAnswer:q.answer,answers:round.players.map(p=>({id:p.id,answer:p.answer})),time:new Date().toISOString()});
 [...$('options').children].forEach((b,i)=>{b.disabled=true;if(i===q.answer)b.classList.add('correct');});
 $('feedback').textContent=(right.length?'🎉 答對了！':'💪 繼續加油！')+'\n正確答案：'+(q.answer+1)+'. '+q.options[q.answer]+(q.explanation?'\n詳解：'+q.explanation:'');
 $('reveal').classList.add('hidden');$('next').classList.remove('hidden');
 $('next').textContent=round.index+1===round.questions.length?'🏆 查看成績':'下一題 ➜';
 renderContestants();
}
function next(){if(!round?.locked)return;if(++round.index<round.questions.length)renderRound();else finish();}
function confetti(){
 const box=$('fireworks');box.replaceChildren();
 for(let i=0;i<70;i++){const e=document.createElement('span');e.style.setProperty('--x',Math.random()*100+'vw');e.style.setProperty('--dx',(Math.random()*160-80)+'px');e.style.setProperty('--c',['#ffd778','#ff84ab','#71dfba','#88caf2'][i%4]);e.style.setProperty('--d',(2+Math.random()*2)+'s');box.append(e);}
 setTimeout(()=>box.replaceChildren(),4400);
}
function finish(){
 endClock();show('finished');confetti();
 const results=[...round.players].sort((a,b)=>b.score-a.score||b.correct-a.correct||a.latency-b.latency||a.no-b.no);
 $('ranking').replaceChildren();
 results.forEach((p,i)=>{
  const div=document.createElement('div');div.className='rankLine';
  div.innerHTML='<strong>'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':'🏅')+' '+safe(p.name)+'</strong><span>'+p.score+' 分｜答對 '+p.correct+'/'+round.questions.length+' 題</span>';
  $('ranking').append(div);
 });
 if(mode==='practice'){$('saveStatus').textContent='🌱 個人練習不儲存學生資料。';return;}
 if(!window.opener||!token||!connected){$('saveStatus').textContent='⚠️ 未連線 FunDesk，成績無法保存。';return;}
 $('saveStatus').textContent='⏳ 正在傳送成績給 FunDesk…';
 if(submitted)return;submitted=true;
 const participants=results.map((p,i)=>({id:p.id,code:p.code,score:p.score,correct:p.correct,place:i+1,latency:Math.round(p.latency)}));
 window.opener.postMessage({kind:'fundesk-king-finish',token,gameId:round.id,mode,subject:round.subject,
  questionCount:round.questions.length,activityCodes:[...new Set(round.questions.map(q=>String(q.unit)))],players:participants,
  winner:mode==='competition'?{id:results[0].id,code:results[0].code,delta:2}:null},connectedOrigin);
}
window.addEventListener('message',event=>{
 if(event.source!==window.opener||event.origin!==connectedOrigin||event.data?.token!==token||event.data?.kind!=='fundesk-king-save-result')return;
 $('saveStatus').textContent=event.data.ok?'✅ 成績已儲存到 FunDesk 學生資料。'+(mode==='competition'?'\n🏆 第一名 +2點':mode==='tablet'?'\n🏆 平板模式名次獎勵：+5／+3／+1點':''):'⚠️ FunDesk 儲存失敗：'+String(event.data.error||'請回到主程式檢查');
});
$('subject').onchange=refreshUnits;
$('bankSelectAll').onclick=()=>{for(const key of Object.keys(getUnits()))currentPicks().add(key);refreshActivities()};
$('bankClearAll').onclick=()=>{currentPicks().clear();refreshActivities()};
$('questionType').onchange=refreshActivities;
$('reloadCloud').onclick=()=>{if(!window.reloadNatureCloud)return;$('cloudInfo').textContent='正在更新線上題庫…';window.reloadNatureCloud()};
window.addEventListener('nature:cloud-status',e=>{$('cloudInfo').textContent='線上補充 '+e.detail.added+' 題'+(e.detail.error?'｜部分讀取失敗：'+e.detail.error:'｜已更新')});

$('classSelect').onchange=()=>{selected=[];renderPlayers()};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$('start').onclick=start;$('reveal').onclick=reveal;$('next').onclick=next;
$('again').onclick=()=>{endClock();if(mode==='tablet')window.FunDeskKingTablet?.stop(false);show('setup');selected=[];renderPlayers();};
$('quitGame').onclick=()=>{
 if(!round||!confirm('確定中斷這次挑戰？這一局不記錄任何成績或獎勵。'))return;
 endClock();round=null;submitted=false;
 show('setup');$('feedback').textContent='';
};

async function toggleKingFullscreen(){
 try{
  if(document.fullscreenElement){await document.exitFullscreen();return}
  const isTablet=!$('tabletHost').classList.contains('hidden');
  await (isTablet?$('tabletHost'):document.documentElement).requestFullscreen();
 }catch(e){alert('目前瀏覽器無法進入全螢幕：'+(e?.message||e))}
}
$('fullBtn').onclick=toggleKingFullscreen;
$('tabletFullBtn').onclick=toggleKingFullscreen;
document.addEventListener('fullscreenchange',()=>{
 const inside=document.fullscreenElement===$('tabletHost');
 $('tabletFullBtn').textContent=inside?'↙ 退出全螢幕':'⛶ 全螢幕';
}); 
refreshUnits();setMode('practice');
})();