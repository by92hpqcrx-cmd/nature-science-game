import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const c=window.NATURE_SUPABASE||{};
export const configured=Boolean(c.url&&c.anonKey);
export const sb=configured?createClient(c.url,c.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export const $=id=>document.getElementById(id);
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
export const errorText=e=>e?.message||String(e);
export async function authUser(){if(!sb)return null;const {data,error}=await sb.auth.getUser();if(error)return null;return data.user;}
export async function isTeacher(){const u=await authUser();if(!u)return false;const {data,error}=await sb.from('nature_teacher_roles').select('user_id').eq('user_id',u.id).maybeSingle();if(error)throw error;return Boolean(data);}
export const units={'01-01':'動物如何求生存','01-02':'動物具有社會行為嗎','01-03':'動物如何延續生命','02-01':'樂音與噪音有什麼不同','02-02':'樂器如何發出不同的聲音','02-03':'光有什麼特性與現象'};
