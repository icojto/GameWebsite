// Four original vector compositions. Run with node scripts/generate-art.mjs.
// Replace public/art/<location>.svg to swap backgrounds; preserve the 1440 × 810 canvas.
import { mkdirSync, writeFileSync } from 'node:fs';
const width = 1440, height = 810;
const common = `<defs>
 <linearGradient id="room" x2="0" y2="1"><stop stop-color="#142b32"/><stop offset="1" stop-color="#09161e"/></linearGradient>
 <linearGradient id="floor" x2="0" y2="1"><stop stop-color="#21353b"/><stop offset="1" stop-color="#0c1b24"/></linearGradient>
 <linearGradient id="screen" x2="0.9" y2="1"><stop stop-color="#245d60"/><stop offset="1" stop-color="#153139"/></linearGradient>
 <linearGradient id="glass" x2="0" y2="1"><stop stop-color="#385663"/><stop offset="1" stop-color="#152932"/></linearGradient>
 <radialGradient id="warm"><stop stop-color="#e6dabb" stop-opacity=".19"/><stop offset="1" stop-color="#e6dabb" stop-opacity="0"/></radialGradient>
 <radialGradient id="cyan"><stop stop-color="#70d4cf" stop-opacity=".18"/><stop offset="1" stop-color="#70d4cf" stop-opacity="0"/></radialGradient>
 <radialGradient id="violet"><stop stop-color="#bd9cff" stop-opacity=".16"/><stop offset="1" stop-color="#bd9cff" stop-opacity="0"/></radialGradient>
 <pattern id="grate" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 2h24M2 0v24" stroke="#637a7a" stroke-opacity=".12" fill="none"/></pattern>
 <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 1h6" stroke="#86b3b3" stroke-opacity=".045"/></pattern>
</defs>`;
const rect = (x,y,w,h,fill,more='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
const path = (d,fill,stroke='',more='') => `<path d="${d}" fill="${fill}" ${stroke ? `stroke="${stroke}"` : ''} ${more}/>`;
const text = (x,y,t,size=14,color='#748d91',more='') => `<text x="${x}" y="${y}" fill="${color}" font-family="monospace" font-size="${size}" letter-spacing="3" ${more}>${t}</text>`;
const circle = (x,y,r,fill,more='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${more}/>`;
const bolts = (x,y,w,h) => [circle(x+12,y+12,3,'#6b7b7c'),circle(x+w-12,y+12,3,'#6b7b7c'),circle(x+12,y+h-12,3,'#6b7b7c'),circle(x+w-12,y+h-12,3,'#6b7b7c')].join('');
const lamp = (x,y,w) => rect(x-8,y-8,w+16,28,'#18282c') + rect(x,y,w,8,'#ddd7b5') + `<ellipse cx="${x+w/2}" cy="${y+100}" rx="${w*1.8}" ry="180" fill="url(#warm)"/>`;
const screen = (x,y,w,h,lines=4) => rect(x-10,y-10,w+20,h+20,'#0a171c','stroke="#496164" stroke-width="2"') + rect(x,y,w,h,'url(#screen)') + Array.from({length:lines},(_,i)=>path(`M${x+12} ${y+18+i*18}h${w*(.3+(i%3)*.17)}`,'none','#75c6c1','stroke-width="2" opacity=".5"')).join('');
const floor = () => path('M0 563H1440V810H0Z','url(#floor)') + path('M0 810L580 563M250 810L645 563M650 810L715 563M1030 810L790 563M1440 810L860 563M0 650H1440M0 750H1440','none','#3c5157','opacity=".45"');
const base = () => rect(0,0,width,height,'url(#room)');
const finish = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810" viewBox="0 0 1440 810">${common}${body}${rect(0,0,1440,810,'url(#scan)')}</svg>`;

let operations = base() + floor();
operations += rect(88,75,980,317,'#09191e','stroke="#496367" stroke-width="9"') + rect(100,87,956,292,'url(#glass)');
operations += path('M102 314L302 211 509 323 635 262 849 333 1058 248V380H100Z','#11262e');
operations += path('M740 320V117M700 170H780M714 208H766M745 117L810 320M734 117L674 320','none','#0b1c24','stroke-width="5"');
operations += Array.from({length:50},(_,i)=>path(`M${115+i*19} ${97+(i*57)%230}l-11 38`,'none','#779aa8','opacity=".19"')).join('');
operations += rect(415,80,14,305,'#15292e') + rect(737,80,14,305,'#15292e') + rect(97,248,969,12,'#15292e');
operations += lamp(257,26,480) + rect(1118,78,229,510,'#1a3035','stroke="#395155" stroke-width="3"');
operations += text(1153,117,'RELAY / 06') + screen(1150,153,160,108,3);
for(let i=0;i<6;i++) operations += rect(1151,298+i*35,158,23,'#10232a','stroke="#40555a"')+circle(1168,309+i*35,3,i===2?'#c7ae79':'#65a89f');
operations += path('M302 479L982 452 1105 639 197 652Z','#344b4f','#53666a','stroke-width="3"') + path('M197 652L1105 639V769L197 790Z','#152a32','#30484d','stroke-width="3"');
operations += rect(334,333,279,194,'#182d33','stroke="#5d7474" stroke-width="3"') + screen(354,352,240,146,5);
operations += rect(644,340,266,183,'#142b31','stroke="#657b79" stroke-width="3"') + screen(665,360,226,139,2);
operations += path('M680 451h25l8-25 15 44 11-24h25l12-17 12 23h76','none','#8dc9bd','stroke-width="2"');
operations += rect(430,563,200,44,'#10242c','transform="skewX(-12)"') + Array.from({length:11},(_,i)=>path(`M${327+i*17} 569v29`,'none','#496265','stroke-width="6"')).join('');
operations += circle(907,582,24,'#13272e','stroke="#a99d72" stroke-width="3"') + rect(942,556,72,34,'#9bb8aa','opacity=".6"');
operations += rect(76,459,198,180,'#1e3439','stroke="#45595b" stroke-width="3"') + rect(103,476,127,97,'#abaf9a','transform="rotate(-7 103 476)"') + text(119,500,'06',23,'#33494c');
operations += circle(753,483,230,'url(#cyan)') + text(81,728,'NORTH RELAY',14) + text(81,754,'AUTOMATED / OCCUPANCY 0',10);
operations += path('M0 0H62V810H0ZM1388 0H1440V810H1388Z','#0a1920');

let yard = rect(0,0,1440,810,'#101f2a') + rect(0,0,1440,535,'url(#glass)');
yard += path('M0 353L142 279 276 340 427 263 549 308 718 243 900 351 1080 271 1308 337 1440 250V620H0Z','#172d37');
yard += path('M0 460L212 422 476 466 792 433 1104 444 1440 411V810H0Z','#0e232d');
yard += path('M0 569L1440 504V810H0Z','url(#floor)') + rect(0,562,1440,248,'url(#grate)');
yard += path('M0 530L1440 465M0 489L1440 424','none','#55717b','stroke-width="5"');
for(let i=0;i<15;i++) yard += path(`M${i*109} ${481-i*4.9}v123`,'none','#3c5864','stroke-width="4"');
const dish = (x,y,scale) => `<g transform="translate(${x} ${y}) scale(${scale})">` + path('M-48 382L-12 95H19L74 382Z','#233d47','#52717a','stroke-width="3"') + path('M-24 304H52M-17 232H40M-8 162H25','none','#62818a','stroke-width="5"') + path('M-196-92Q-86 155 114 150L183-15Q-8 5-196-92Z','#46636e','#8ca4a5','stroke-width="3"') + path('M-177-75Q-69 105 117 133M-120-50Q-40 75 137 91M-48-28L113 148','none','#8fa8ac','opacity=".35" stroke-width="2"') + path('M-167-76L22-141 171-12M23-141L-16 44','none','#9cb3b6','stroke-width="4"') + circle(22,-141,7,'#acc8c4') + '</g>';
yard += dish(1025,236,.64) + dish(530,215,1.04);
yard += path('M0 747L809 612 1440 635','none','#647775','stroke-width="10"') + path('M0 759L809 624 1440 647','none','#0b171e','stroke-width="12"');
yard += rect(750,507,296,209,'#233d47','stroke="#7a9292" stroke-width="3"') + path('M733 508L768 458H1042L1064 508Z','#425c63') + screen(787,531,212,105,3);
yard += text(788,680,'DIRECTION / ARRAY',13,'#b2c4bc') + bolts(750,507,296,209);
yard += path('M1222 158V585','none','#637b83','stroke-width="9"') + lamp(1152,157,143);
yard += Array.from({length:65},(_,i)=>path(`M${(i*97)%1440} ${(i*113)%810}l-18 55`,'none','#9bbbbd','opacity=".12"')).join('');
yard += text(80,712,'EXPOSED DECK',15) + text(80,743,'SKY SWEEP / NO SOURCE',10);

let archive = base() + floor() + lamp(683,43,310);
archive += rect(79,74,400,545,'#182e34','stroke="#566968" stroke-width="4"');
for(let row=0;row<5;row++) { archive += rect(92,169+row*85,370,9,'#697d78'); for(let col=0;col<7;col++) archive += rect(104+col*50,105+row*85,39,64,['#647771','#3c5756','#8d8f78','#536a62'][((row+col)%4)],'stroke="#152c32" stroke-width="3"') + rect(112+col*50,116+row*85,21,9,'#b7b59b','opacity=".5"'); }
archive += text(100,653,'RECORDS / 01—11',13,'#a6b4a5');
archive += rect(568,164,320,394,'#172c32','stroke="#485f61" stroke-width="3"') + screen(609,206,232,132,5);
archive += text(613,380,'AUXILIARY REGISTER',12) + rect(631,402,180,66,'#091b21','stroke="#526764"') + text(658,442,'0.00 V',26,'#aac8af');
archive += rect(958,84,350,522,'#304448','stroke="#6b7a72" stroke-width="4"') + bolts(958,84,350,522);
archive += text(999,130,'TX / POWER SUPPLY',14,'#c5c2a6') + path('M1004 160H1266M1004 188H1266M1004 216H1266','none','#142b31','stroke-width="9"');
archive += rect(1013,260,238,201,'#142a31','stroke="#78887e" stroke-width="3"') + path('M1070 281V429M1190 281V429','none','#9a785e','stroke-width="18"') + path('M1070 330L1174 368','none','#c2c5b4','stroke-width="18"') + circle(1165,365,20,'#963f39');
archive += rect(1008,492,250,70,'#1b3036') + text(1032,519,'MANUAL ISOLATOR',12,'#c8bc92') + text(1032,545,'PULL TO DISCONNECT',10,'#899e9b');
archive += path('M1070 83V14H690V162M1120 83V0','none','#5a7070','stroke-width="12"');
archive += path('M281 661L675 594 789 726 298 791Z','#5c6860','#95a28b','stroke-width="3"') + rect(388,646,161,80,'#c7c5a7','transform="rotate(-8 388 646)"') + text(410,670,'FINAL SHIFT',13,'#3d514f','transform="rotate(-8 410 670)"');
archive += circle(1131,315,255,'url(#warm)') + circle(724,257,190,'url(#cyan)');

let sublevel = base() + floor();
sublevel += path('M0 0H320L467 146V573L220 810H0ZM1440 0H1130L970 146V573L1220 810H1440Z','#1d3037');
sublevel += path('M318 0L468 145H970L1133 0','none','#456064','stroke-width="4"');
sublevel += rect(420,103,588,528,'#0a1b23','stroke="#526768" stroke-width="12"') + rect(452,132,524,470,'#20363d','stroke="#758781" stroke-width="4"');
sublevel += rect(478,155,470,421,'#2c4348','stroke="#102831" stroke-width="8"') + path('M713 164V564M487 365H939','none','#0b1f28','stroke-width="9"');
sublevel += path('M503 185H683V335H503ZM742 185H922V335H742ZM503 396H683V548H503ZM742 396H922V548H742Z','none','#50676a','stroke-width="2"');
sublevel += bolts(478,155,470,421) + rect(628,285,172,151,'#182c35','stroke="#71817d" stroke-width="3"') + rect(649,306,130,88,'#07151f');
for(let i=0;i<6;i++) sublevel += path(`M${655+i*23} 303V399`,'none','#576874','stroke-width="8"');
sublevel += path('M708 318v62M700 334v33M717 330v43','none','#c1a4e2','stroke-width="3" opacity=".8"');
sublevel += text(632,420,'SEAL INTACT',12,'#adae93');
sublevel += text(560,88,'LOWER ACCESS / 06',16,'#b0b7a4');
sublevel += path('M352 0V326L398 374V615M1054 0V368L1090 421V740','none','#5a6e6f','stroke-width="13"');
sublevel += rect(1070,468,247,189,'#263b43','stroke="#758582" stroke-width="3"') + screen(1100,493,186,66,1) + rect(1122,586,146,37,'#192933');
sublevel += circle(1146,605,10,'#718788') + circle(1247,605,10,'#bba6d0') + text(1098,688,'LOWER RELAY',12,'#b9b99e');
sublevel += lamp(148,152,129) + lamp(1160,152,129) + circle(715,360,268,'url(#violet)');
sublevel += path('M593 614L546 661M626 614L579 661M818 614L865 661M851 614L898 661','none','#a69a68','stroke-width="15" opacity=".55"');
sublevel += text(76,739,'NO THROUGH ACCESS',12) + text(76,766,'COMMUNICATION PATH ONLY',10);

mkdirSync(new URL('../public/art/', import.meta.url), {recursive:true});
for (const [name, body] of Object.entries({operations,yard,archive,sublevel})) writeFileSync(new URL(`../public/art/${name}.svg`, import.meta.url),finish(body));
console.log('Generated four original SVG scenes.');
