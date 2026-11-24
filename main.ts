import{readFileSync as A,readdirSync as B,writeFileSync as W,mkdirSync as M}from"node:fs";import{join as J}from"node:path";
const T=atob("ASKCBQcLDBAAAAAAAAAAAAoKCgoKCgoGCgoKBgoKCgAKCgoAAAAAAAAAAAAAAAAAQUVFQQEAAAAAAAAAAAAAAAYJAAAAAAAAAAAAAAAAAAAFBQIF");
function run(p,i){const n=p.length,D=new Int32Array(256),C=new Int32Array(64),E=new Int32Array(256),o=[];let s=0,t=0,l=0,q=0,u=0,h=0;
for(;;){if(h===1e6)return{stdout:o,exit:10};if(u<0||u>=n)return{stdout:o,exit:9};
const c=p[u],v=T.charCodeAt(c);if(!v)return{stdout:o,exit:5};
const a=(v-1)>>5,b=(v-1>>2)&7,d=(v-1)&3;
if(u+a>=n)return{stdout:o,exit:9};h++;const x=u+1+a;
if(s<b)return{stdout:o,exit:2};if(s-b+d>256)return{stdout:o,exit:3};u=x;
const y=D[s-1],z=D[s-2];let r=0;
switch(c){
case 0:return{stdout:o,exit:0};
case 1:D[s++]=(p[x-1]<<24)>>24;break;
case 2:D[s++]=p[x-4]|p[x-3]<<8|p[x-2]<<16|p[x-1]<<24;break;
case 3:s--;break;
case 4:D[s]=D[s-1];s++;break;
case 5:D[s-1]=D[s-2];D[s-2]=y;break;
case 6:D[s]=D[s-2];s++;break;
case 7:{const w=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=w;break}
case 16:r=z+y|0;break;
case 17:r=z-y|0;break;
case 18:r=Math.imul(z,y);break;
case 19:if(!y)return{stdout:o,exit:4};r=z==-2147483648&&y==-1?z:z/y|0;break;
case 20:if(!y)return{stdout:o,exit:4};r=y==-1?0:z%y|0;break;
case 21:if(!y)return{stdout:o,exit:4};r=Math.floor((z>>>0)/(y>>>0))|0;break;
case 22:if(!y)return{stdout:o,exit:4};r=(z>>>0)%(y>>>0)|0;break;
case 23:D[s-1]=-D[s-1]|0;break;
case 24:r=z&y;break;
case 25:r=z|y;break;
case 26:r=z^y;break;
case 27:D[s-1]=~D[s-1];break;
case 28:r=z<<(y&31);break;
case 29:r=z>>(y&31);break;
case 30:r=(z>>>(y&31))|0;break;
case 32:r=z===y?1:0;break;
case 33:r=z<y?1:0;break;
case 34:r=z>>>0<y>>>0?1:0;break;
case 48:case 49:case 50:{const w=(p[x-2]|p[x-1]<<8)<<16>>16;let g=1;if(c>48){const k=D[--s];g=c==49?k===0:k!==0}if(g)u=x+w;break}
case 51:if(t===64)return{stdout:o,exit:7};C[t++]=x;u=p[x-2]|p[x-1]<<8;break;
case 52:if(!t)return{stdout:o,exit:8};u=C[--t];break;
case 64:if(y<0||y>255)return{stdout:o,exit:6};D[s-1]=E[y];break;
case 65:if(y<0||y>255)return{stdout:o,exit:6};s-=2;E[y]=z;break;
case 80:{const e=Buffer.from(String(D[s-1]));if(l+e.length>65536)return{stdout:o,exit:11};s--;for(let j=0;j<e.length;j++)o[l++]=e[j];break}
case 81:if(l+1>65536)return{stdout:o,exit:11};o[l++]=D[--s]&255;break;
case 82:D[s++]=q<i.length?i[q++]:-1;break;
case 83:return{stdout:o,exit:D[--s]&255};
default:break}
if(c>15&&c<35&&c!=23&&c!=27){s-=2;D[s++]=r}}}
const I=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output";
for(const d of B(I).sort()){if(d[0]===".")continue;const f=J(I,d);let i=Buffer.alloc(0);try{i=A(J(f,"input.bin"))}catch{}
const{stdout:x,exit:e}=run([...A(J(f,"program.bin"))],[...i]);
M(J(O,d),{recursive:!0});W(J(O,d,"stdout.bin"),Buffer.from(x));W(J(O,d,"exit.txt"),e+"\n")}
