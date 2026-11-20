import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id),cfg=window.NATURE_SUPABASE||{};
let sb,channel,game,tick,phase='idle',members=new Map();
const esc=x=>String(x??'').replace(/[&<>"]/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[a]));
const uuid=()=>crypto.randomUUID(),randomRoom=()=>{let a=new Uint8Array(16);crypto.getRandomValues(a);return[...a].map(n=>n.toString(16).padStart(2,'0')).join('')};
const send=async d=>{if(channel)try{await channel.send({type:'broadcast',event:'teacher',payload:d})}catch(e){console.warn(e)}};
const order=()=>[...members.values()].filter(x=>x.answered).sort((a,b)=>b.score-a.score||b.correct-a.correct||a.latency-b.latency||a.no-b.no);
function ranking(){
 let a=order();$('tabletTop3').innerHTML=a.length?a.slice(0,3).map((p,i)=>'<div class="tabletRank">'+['🥇','🥈','🥉'][i]+' '+esc(p.no)+'號 '+esc(p.name)+' <b>'+p.score+'分</b></div>').join(''):'目前尚無得分';
 $('tabletPlayerCount').textContent='已加入 '+members.size+' 位｜已作答 '+a.length+' 位';
 $('tabletRoster').textContent=[...members.values()].sort((a,b)=>a.no-b.no).map(p=>p.no+'號 '+p.name).join('、');
}
const question=()=>phase==='running'?{id:game.questionId,index:game.index+1,total:game.questions.length,text:game.questions[game.index].question,options:game.questions[game.index].options,deadline:game.deadline}:null;
async function handle(p){
 if(!game||!p||phase==='aborted'||phase==='ended')return;
 const client=String(p.client||'');if(!/^[a-z0-9-]{16,100}$/i.test(client))return;
 if(p.type==='sync'){send({type:'state',to:client,phase,question:question(),label:game.label});return}
 if(p.type==='join'){
  const no=Number(p.no),s=game.students.find(x=>Number(x.no)===no);
  if(!s||!Number.isInteger(no)||members.values().some(x=>x.no===no&&x.client!==client)){
   send({type:'admitted',to:client,ok:false,error:s?'座號已被其他裝置使用':'找不到這個座號'});return;
  }
  if(!members.has(client))members.set(client,{client,id:String(s.id),code:game.code,no,name:s.name,score:0,correct:0,latency:0,answered:0,last:''});
  send({type:'admitted',to:client,ok:true,name:s.name,no,phase,question:question()});
  ranking();$('tabletStatus').textContent='已連線 '+members.size+' 位學生，老師可以隨時開始';
  return;
 }
 if(p.type!=='answer'||phase!=='running'||game.locked||p.questionId!==game.questionId)return;
 const s=members.get(client),q=game.questions[game.index],choice=Number(p.choice);
 if(!s||s.last===game.questionId||!Number.isInteger(choice)||choice<0||choice>=q.options.length||Date.now()>game.deadline)return;
 s.last=game.questionId;s.answered++;
 const yes=choice===q.answer;if(yes){s.score+=100;s.correct++;s.latency+=Date.now()-(game.deadline-game.duration*1000)}
 send({type:'result',to:client,id:game.questionId,ok:yes,score:s.score,delta:yes?100:0});
 ranking();send({type:'top3',scores:order().slice(0,3).map(x=>({name:x.name,no:x.no,score:x.score}))});
}
function drawQuestion(){
 let q=game.questions[game.index];
 $('tabletRound').textContent='第 '+(game.index+1)+'／'+game.questions.length+' 題';
 $('tabletQuestion').textContent=q.question;
 $('tabletAnswers').innerHTML=q.options.map((o,i)=>'<div class="tabletAnswer">'+(i+1)+'. '+esc(o)+'</div>').join('');
 $('tabletExplain').textContent='';
}
function closeRound(){
 if(!game||phase!=='running'||game.locked)return;
 game.locked=true;clearInterval(tick);tick=null;
 const q=game.questions[game.index];
 $('tabletExplain').textContent='✅ 正確答案：'+(q.answer+1)+'. '+q.options[q.answer]+(q.explanation?'\n'+q.explanation:'');
 $('tabletCountdown').textContent='時間到／本題結束';
 $('tabletAnswers').children[q.answer]?.classList.add('right');
 $('tabletNext').classList.remove('hidden');
 $('tabletNext').textContent=game.index+1===game.questions.length?'🏁 結算競賽':'下一題 ➜';
 send({type:'reveal',id:game.questionId,correct:q.answer,explanation:q.explanation||''});
}
function startRound(){
 if(!game||phase==='aborted'||phase==='ended')return;
 if(game.index>=game.questions.length){finish();return}
 phase='running';game.locked=false;game.questionId='q'+game.index+'-'+game.id;
 game.deadline=Date.now()+game.duration*1000;drawQuestion();send({type:'question',question:question()});
 clearInterval(tick);tick=setInterval(()=>{
  const left=Math.max(0,game.deadline-Date.now());
  $('tabletCountdown').textContent='⏱ '+Math.ceil(left/1000)+' 秒';
  if(left===0)closeRound();
 },150);
}
async function finish(){
 if(!game||phase==='ended'||phase==='aborted')return;
 const a=order();if(!a.length){$('tabletStatus').textContent='尚無學生作答，不可結算獎勵';return}
 clearInterval(tick);phase='ended';send({type:'ended',ranking:a.map(x=>({no:x.no,name:x.name,score:x.score}))});
 game.show('finished');
 $('ranking').innerHTML=a.map((p,i)=>'<div class="rankLine"><b>'+(['🥇','🥈','🥉'][i]||'🏅')+' '+esc(p.no)+'號 '+esc(p.name)+'</b><span>'+p.score+'分</span></div>').join('');
 $('saveStatus').textContent='⏳ 正在寫入 FunDesk 並發放名次獎勵…';
 if(!window.opener){$('saveStatus').textContent='⚠️ 無教師連線，成績無法寫入';return}
 const players=a.map((p,i)=>({id:p.id,code:p.code,score:p.score,correct:p.correct,latency:Math.round(p.latency),place:i+1}));
 const winners=a.slice(0,3).map((p,i)=>({id:p.id,code:p.code,rank:i+1,delta:[5,3,1][i]}));
 window.opener.postMessage({kind:'fundesk-king-finish',token:game.token,gameId:game.id,mode:'tablet',subject:game.subject,questionCount:game.questions.length,players,winners,winner:null},location.origin);
}
async function stop(abort){
 clearInterval(tick);tick=null;
 if(abort&&channel)await send({type:'aborted'});
 phase=abort?'aborted':'ended';
 if(channel){await sb.removeChannel(channel).catch(()=>{});channel=null}
 game=null;members.clear();
}
async function start({classroom,questions,subject,duration,token,show}){
 if(!classroom?.students?.length){alert('請選擇有學生的班級');return}
 if(!questions?.length){alert('所選條件沒有可用題目');return}
 if(!cfg.url||!cfg.anonKey){alert('未設定 Supabase Realtime');return}
 if(game)await stop(false);
 sb||=createClient(cfg.url,cfg.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const room=randomRoom(),url=new URL('./king-student.html',location.href);
 url.searchParams.set('room',room);
 game={room,id:uuid(),code:classroom.code,label:classroom.label,students:classroom.students,questions,subject,duration,token,show,index:0,locked:false,questionId:'',deadline:0};
 members.clear();phase='lobby';show('tabletHost');
 $('tabletHostClass').textContent=classroom.label;$('tabletQR').replaceChildren();
 $('tabletJoinURL').textContent=url.href;
 if(window.QRCode)new QRCode($('tabletQR'),{text:url.href,width:156,height:156});
 else $('tabletQR').textContent='QR Code 未載入，請使用下方網址';
 $('tabletStartNow').classList.remove('hidden');$('tabletStartNow').disabled=true;
 $('tabletFinish').disabled=true;$('tabletNext').classList.add('hidden');
 $('tabletQuestion').textContent='等待學生掃碼加入；老師可以隨時開始';
 $('tabletAnswers').replaceChildren();$('tabletExplain').textContent='';$('tabletRound').textContent='準備中';
 $('tabletCountdown').textContent='';ranking();
 channel=sb.channel('nature-king-'+room,{config:{broadcast:{self:false}}});
 channel.on('broadcast',{event:'student'},({payload})=>handle(payload).catch(console.warn));
 channel.subscribe(status=>{
  if(!game||game.room!==room)return;
  $('tabletStatus').textContent=status==='SUBSCRIBED'?'✅ 連線成功，可以掃碼加入':'即時連線：'+status;
  $('tabletStartNow').disabled=status!=='SUBSCRIBED';
 });
}
$('tabletStartNow').onclick=()=>{if(!game||phase!=='lobby')return;$('tabletStartNow').classList.add('hidden');$('tabletFinish').disabled=false;startRound()};
$('tabletNext').onclick=()=>{if(!game||!game.locked)return;$('tabletNext').classList.add('hidden');game.index++;startRound()};
$('tabletFinish').onclick=()=>{if(game&&phase==='running'&&confirm('結束競賽並儲存目前成績？'))finish()};
$('tabletAbort').onclick=async()=>{if(!game||!confirm('中斷競賽後不記錄任何成績或獎勵，確定？'))return;const show=game.show;await stop(true);show('setup')};
window.FunDeskKingTablet={start,stop};
