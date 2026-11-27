import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),room=new URL(location.href).searchParams.get('room')||'';
const cfg=window.NATURE_SUPABASE||{};
const id=(()=>{const key='nature-king-client:'+room;let value=sessionStorage.getItem(key);if(!value){value=crypto.randomUUID();sessionStorage.setItem(key,value)}return value})();
let channel,session,joined=false,score=0,questionId='',answered=false,currentNo=0,deadline=0,phase='lobby',leaving=false,leaveTimer=null;
const show=name=>['join','waiting','playing','done'].forEach(s=>$(s).classList.toggle('hidden',s!==name));
const send=async data=>{if(!channel)return;try{await channel.send({type:'broadcast',event:'student',payload:{...data,client:id}})}catch(e){console.warn(e)}};
const message=x=>{$('joinStatus').textContent=x};
async function connect(){
 if(!/^[0-9a-f]{32}$/.test(room)||!cfg.url||!cfg.anonKey){message('教室連結無效，請重新掃老師的 QR Code');return}
 session=createClient(cfg.url,cfg.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 channel=session.channel('nature-king-'+room,{config:{broadcast:{self:false}}});
 channel.on('broadcast',{event:'teacher'},({payload:p})=>{
  if(!p)return;
  if(p.to&&p.to!==id)return;
  if(['left','kicked','rejoin'].includes(p.type)){clearTimeout(leaveTimer);joined=false;leaving=false;currentNo=0;questionId='';answered=false;score=0;phase='lobby';show('join');$('joinButton').disabled=false;message(p.type==='kicked'?'老師已移除你，可重新輸入座號加入':p.type==='left'?'已退出競賽，可重新加入':'連線已逾時，請重新加入');return}
  if(p.type==='admitted'){if(leaving)return;
   if(!p.ok){joined=false;currentNo=0;show('join');message('⚠️ '+(p.error||'加入失敗')+'，可請老師移除舊連線後重試');return}
   joined=true;score=Number(p.score)||0;currentNo=p.no;
   $('studentName').textContent=p.no+' 號 '+p.name;$('mySeat').textContent='👩‍🎓 '+p.no+' 號 '+p.name;
   $('myCurrentScore').textContent='目前 '+score+' 分';
   if(p.question){renderQuestion(p.question);if(p.answered){answered=true;$('endAnswer').disabled=true;[...$('studentOptions').children].forEach(b=>b.disabled=true);$('studentFeedback').textContent='本題已作答，等待下一題'}}else{show('waiting');$('waitMessage').textContent=p.phase==='lobby'?'等待老師開始…':'等待下一題…'}
   return;
  }
  if(p.type==='state'){
   if(joined&&p.question)renderQuestion(p.question);
   return;
  }
  if(p.type==='question'){if(joined)renderQuestion(p.question);return}
  if(p.type==='result'){
   if(p.id!==questionId)return;
   score=p.score;$('studentScore').textContent='目前 '+score+' 分';
   $('studentFeedback').textContent=p.passed?'✅ 已結束本題，不計分；等待下一題。':p.ok?'🎉 答對了！+100 分':'💪 答錯了，下一題加油！';
   $('myCurrentScore').textContent='目前 '+score+' 分';return;
  }
  if(p.type==='reveal'){
   if(p.id!==questionId)return;
   answered=true;$('endAnswer').disabled=true;
   [...$('studentOptions').children].forEach(b=>b.disabled=true);
   $('studentFeedback').textContent+='　正確答案：'+(p.correct+1)+(p.explanation?'。 '+p.explanation:'');
   return;
  }
  if(p.type==='top3'){$('studentTop3').textContent=(p.scores||[]).map((s,i)=>['🥇','🥈','🥉'][i]+s.no+'號 '+s.name+' '+s.score+'分').join('　')||'尚無得分';return}
  if(p.type==='aborted'){phase='aborted';show('done');$('doneMessage').textContent='老師已中斷競賽，本次不計成績';return}
  if(p.type==='ended'){phase='ended';show('done');$('doneMessage').textContent='競賽完成！你本次得到 '+score+' 分';return}
 });
 channel.subscribe(status=>{
  if(status==='SUBSCRIBED'){
   message('✅ 已連上教室，請輸入座號');
   $('joinButton').disabled=false;
   send({type:'sync'});
   if(currentNo)send({type:'join',no:currentNo});
  }else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){
   message('⚠️ 連線失敗：'+status+'，請檢查網路或重新掃碼');
   $('joinButton').disabled=true;
  }
 });
}
function renderQuestion(q){
 if(!q||!joined)return;
 if(q.id===questionId&&answered)return;
 questionId=q.id;phase='running';deadline=q.deadline;answered=false;
 $('studentProgress').textContent='第 '+q.index+'／'+q.total+' 題';
 $('studentQuestion').textContent=q.text;
 $('studentScore').textContent='目前 '+score+' 分';
 $('studentFeedback').textContent='';
 $('studentOptions').replaceChildren();
 (q.options||[]).forEach((o,i)=>{
  const b=document.createElement('button');b.type='button';b.textContent=(i+1)+'. '+o;
  b.onclick=()=>{
   if(answered||Date.now()>deadline)return;
   answered=true;$('endAnswer').disabled=true;b.classList.add('correct');
   [...$('studentOptions').children].forEach(x=>x.disabled=true);
   $('studentFeedback').textContent='✅ 已送出答案，等待老師確認分數…';
   send({type:'answer',questionId,choice:i});
  };
  $('studentOptions').append(b);
 });
 $('endAnswer').disabled=false;
 show('playing');setRemaining();
}
function setRemaining(){
 const scheduledId=questionId;
 const refresh=()=>{
 if(scheduledId!==questionId||$('playing').classList.contains('hidden'))return;
 $('studentRemaining').textContent='⏱ '+Math.max(0,Math.ceil((deadline-Date.now())/1000))+' 秒';
 if(Date.now()<deadline)setTimeout(refresh,250);
 else {answered=true;$('endAnswer').disabled=true;[...$('studentOptions').children].forEach(b=>b.disabled=true);}
 };
 refresh();
}
$('endAnswer').onclick=()=>{
 if(!joined||phase!=='running'||answered||Date.now()>deadline)return;
 if(!confirm('確定結束這一題嗎？這題不計分，仍可繼續參加下一題。'))return;
 answered=true;$('endAnswer').disabled=true;
 [...$('studentOptions').children].forEach(b=>b.disabled=true);
 $('studentFeedback').textContent='✅ 已結束本題，不計分，等待下一題…';
 send({type:'pass',questionId});
};
$('joinForm').onsubmit=e=>{
 e.preventDefault();const no=Number($('seatNumber').value);
 if(!Number.isInteger(no)||no<1||no>99)return message('請輸入正確座號');
 currentNo=no;message('正在請老師端確認座號…');
 send({type:'join',no});
};
async function quit(){
 const completed=phase==='ended',aborted=phase==='aborted';
 if(!completed&&!aborted&&!confirm('確定退出競賽？你的本局成績不會列入競賽排名。'))return;
 if(channel){
  if(!completed&&!aborted){leaving=true;joined=false;currentNo=0;show('join');$('joinButton').disabled=true;message('正在退出競賽…');await send({type:'leave'});if(leaving)leaveTimer=setTimeout(()=>{if(!leaving)return;leaving=false;questionId='';answered=false;score=0;phase='lobby';$('joinButton').disabled=false;message('退出確認逾時，可重新加入；若座號仍鎖定請老師移除')},3500);return}
  await session.removeChannel(channel).catch(()=>{});
 }
 channel=null;joined=false;show('done');$('doneMessage').textContent=completed?'已關閉競賽連線；結算成績仍保留。':'已中斷退出，本局不列入成績。';
}
['studentQuit','waitQuit','playQuit','doneQuit'].forEach(k=>$(k).onclick=quit);
setInterval(()=>{if(joined&&!leaving&&['lobby','running'].includes(phase))send({type:'heartbeat'})},5000);
window.addEventListener('pagehide',e=>{if(!e.persisted&&joined&&!leaving&&['lobby','running'].includes(phase))send({type:'leave'})});
connect().catch(e=>message('連線失敗：'+e.message));
