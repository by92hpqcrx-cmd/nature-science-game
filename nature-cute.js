(()=>{'use strict';
function decorate(){
 const header=document.querySelector('.topbar');
 if(!header||document.querySelector('.nature-scene'))return;
 document.body.classList.remove('scene-playground','scene-space','scene-seaside');
 const scene=document.createElement('section');scene.className='nature-scene';scene.setAttribute('aria-label','太陽、月亮、星星與班寵裝飾');
 const sky=document.createElement('div');sky.className='nature-sky';sky.setAttribute('aria-hidden','true');sky.textContent='☀️　⭐　🌙　✨　🌟';
 const pets=document.createElement('div');pets.className='nature-pets';pets.setAttribute('aria-label','可愛班寵裝飾');
 const items=[['dino','🦖','小恐龍'],['bear','🐻','小熊'],['rabbit','🐰','小兔'],['panda','🐼','熊貓'],['cat','🐱','小貓']];
 for(const [id,emoji,name] of items){
   const wrapper=document.createElement('span');wrapper.className='nature-pet';wrapper.title=name;
   const img=document.createElement('img');img.alt=name;img.width=52;img.height=52;img.loading='lazy';
   img.src='https://by92hpqcrx-cmd.github.io/science-fundesk/class-pets/'+id+'.svg';
   img.onerror=()=>{img.remove();wrapper.textContent=emoji};
   wrapper.append(img);pets.append(wrapper);
 }
 scene.append(sky,pets);header.after(scene);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();
