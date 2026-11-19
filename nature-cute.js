(()=>{'use strict';
const backgrounds=['classroom.png','playground-faded-48.png','activity-center-faded-48.png','space-faded.png','amusement-faded.png','park-faded.png','mountain-faded.png','beach-faded.png'];
const selected=backgrounds[Math.floor(Math.random()*backgrounds.length)];
document.documentElement.style.setProperty('--nature-scene-background','url("https://by92hpqcrx-cmd.github.io/science-fundesk/backgrounds/'+selected+'")');
function initialize(){
 const btn=document.getElementById('fullscreenBtn');if(!btn)return;
 btn.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(e){alert('無法開啟全螢幕，請使用瀏覽器 F11。')}});
 document.addEventListener('fullscreenchange',()=>{let on=!!document.fullscreenElement;document.body.classList.toggle('nature-fullscreen',on);btn.textContent=on?'⛶ 離開全螢幕':'⛶ 全螢幕';btn.setAttribute('aria-pressed',String(on));});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
