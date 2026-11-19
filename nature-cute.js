(()=>{'use strict';
const BACKGROUNDS=[
 ['classroom','教室','classroom.png'],
 ['playground','操場','playground-faded-48.png'],
 ['activity','活動中心','activity-center-faded-48.png'],
 ['space','太空','space-faded.png'],
 ['amusement','遊樂園','amusement-faded.png'],
 ['park','公園','park-faded.png'],
 ['mountain','山區','mountain-faded.png'],
 ['beach','海邊','beach-faded.png']
];
const selected=BACKGROUNDS[Math.floor(Math.random()*BACKGROUNDS.length)];
const path='https://by92hpqcrx-cmd.github.io/science-fundesk/backgrounds/'+selected[2];
document.documentElement.style.setProperty('--nature-scene-background','url("'+path+'")');
document.documentElement.dataset.natureScene=selected[0];
function decorate(){
 const header=document.querySelector('.topbar');
 if(!header||document.querySelector('.nature-scene'))return;
 const scene=document.createElement('section');scene.className='nature-scene';scene.setAttribute('aria-label','隨機背景：'+selected[1]+'；班寵裝飾');
 const pets=document.createElement('div');pets.className='nature-pets';pets.setAttribute('aria-label','班寵裝飾');
 for(const [id,emoji,name] of [['dino','🦖','小恐龍'],['bear','🐻','小熊'],['rabbit','🐰','小兔'],['panda','🐼','熊貓'],['cat','🐱','小貓']]){
  const wrapper=document.createElement('span');wrapper.className='nature-pet';wrapper.title=name;
  const img=document.createElement('img');img.src='https://by92hpqcrx-cmd.github.io/science-fundesk/class-pets/'+id+'.svg';img.alt=name;img.width=52;img.height=52;img.loading='lazy';
  img.onerror=()=>{img.remove();wrapper.textContent=emoji};wrapper.append(img);pets.append(wrapper);
 }
 scene.append(pets);header.after(scene);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();
