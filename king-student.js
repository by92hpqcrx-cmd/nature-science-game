import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),room=new URL(location.href).searchParams.get('room')||'';
const cfg=window.NATURE_SUPABASE||{};
const id=(()=>{const key='nature-king-client:'+room;let value=sessionStorage.getItem(key);if(!value){value=crypto.randomUUID();sessionStorage.setItem(key,value)}return value})();
let channel,session,joined=false,score=0,questionId='',answered=false,currentNo=0,deadline=0,phase='lobby';
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
  if(p.type==='admitted'){
   if(!p.ok){message('⚠️ '+(p.error||'加入失敗'));return}
   joined=true;score=p.score||score;currentNo=p.no;
   $('studentName').textContent=p.no+' 號 '+p.name;$('mySeat').textContent='👩‍🎓 '+p.no+' 號 '+p.name;
   $('myCurrentScore').textContent='目前 '+score+' 分';
   if(p.question)renderQuestion(p.question);else{show('waiting');$('waitMessage').textContent=p.phase==='lobby'?'等待老師開始…':'等待下一題…'}
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
   $('studentFeedback').textContent=p.ok?'🎉 答對了！+100 分':'💪 答錯了，下一題加油！';
   $('myCurrentScore').textContent='目前 '+score+' 分';return;
  }
  if(p.type==='reveal'){
   if(p.id!==questionId)return;
   [...$('studentOptions').children].forEach(b=>b.disabled=true);
   $('studentFeedback').textContent+='　正確答案：'+(p.correct+1)+(p.explanation?'。 '+p.explanation:'');
   return;
  }
  if(p.type==='top3'){$('studentTop3').textContent=(p.scores||[]).map((s,i)=>['🥇','🥈','🥉'][i]+s.no+'號 '+s.name+' '+s.score+'分').join('　')||'尚無得分';return}
  if(p.type==='aborted'){show('done');$('doneMessage').textContent='老師已中斷競賽，本次不計成績';return}
  if(p.type==='ended'){show('done');$('doneMessage').textContent='競賽完成！你本次得到 '+score+' 分';return}
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
   answered=true;b.classList.add('correct');
   [...$('studentOptions').children].forEach(x=>x.disabled=true);
   $('studentFeedback').textContent='✅ 已送出答案，等待老師確認分數…';
   send({type:'answer',questionId,choice:i});
  };
  $('studentOptions').append(b);
 });
 show('playing');setRemaining();
}
function setRemaining(){
 if($('playing').classList.contains('hidden'))return;
 $('studentRemaining').textContent='⏱ '+Math.max(0,Math.ceil((deadline-Date.now())/1000))+' 秒';
 if(Date.now()<deadline)setTimeout(setRemaining,250);
 else [...$('studentOptions').children].forEach(b=>b.disabled=true);
}
$('joinForm').onsubmit=e=>{
 e.preventDefault();const no=Number($('seatNumber').value);
 if(!Number.isInteger(no)||no<1||no>99)return message('請輸入正確座號');
 currentNo=no;message('正在請老師端確認座號…');
 send({type:'join',no});
};
function quit(){
 if(!confirm('確定退出競賽？退出後仍可使用原 QR Code 重新加入。'))return;
 if(channel)session.removeChannel(channel).catch(()=>{});
 channel=null;joined=false;show('done');$('doneMessage').textContent='已離開競賽';
}
['studentQuit','waitQuit','playQuit','doneQuit'].forEach(k=>$(k).onclick=quit);
connect().catch(e=>message('連線失敗：'+e.message));
