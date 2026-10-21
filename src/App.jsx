import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey:"AIzaSyCjSRgfr4C_SmulPrh7Pk5YxWJ1Ku-DhbI",
  authDomain:"life-roadmap-tracker.firebaseapp.com",
  projectId:"life-roadmap-tracker",
  storageBucket:"life-roadmap-tracker.firebasestorage.app",
  messagingSenderId:"69221915904",
  appId:"1:69221915904:web:5b413139fff08c3424e7e5",
};
const fbApp=initializeApp(firebaseConfig);
const auth=getAuth(fbApp);
const db=getFirestore(fbApp);
const gProvider=new GoogleAuthProvider();

const ADMIN_EMAILS=["info@worshiponair.com"];
const LEADER_CODE="나침반2024";
const START_AGE=0,END_AGE=80,COL_W=44,LABEL_W=170,AGE_STEP=5;
const ROWS=[
  {id:"season",label:"시즌/인생터닝포인트",sub:"",accent:"#C4902A",height:64},
  {id:"family",label:"가족",sub:"(이사,이별 등)",accent:"#C05A5A",height:56},
  {id:"faith",label:"신앙/교회",sub:"(회심,교회봉사,방황 등)",accent:"#7B5EA7",height:56},
  {id:"education",label:"교육",sub:"(학교,교육 등)",accent:"#C47A10",height:48},
  {id:"work",label:"일",sub:"(했던 일,성취,회사 등)",accent:"#2E7DAE",height:48},
  {id:"other",label:"기타",sub:"(이성교제,취미,문화생활 등)",accent:"#4A8A60",height:44},
];
const EVENT_COLORS=["#C4902A","#C05A5A","#7B5EA7","#C47A10","#2E7DAE","#4A8A60","#3BAAC0","#D4706A","#8B6FBA","#5A9E78"];
const P={
  bg:"#F8F6F1",surface:"#FFFFFF",border:"#E2DDD4",borderDark:"#C8C0B4",
  text:"#2A2118",textSub:"#5C5650",textMuted:"#9C968E",
  navy:"#3A2E1E",brown:"#6B4F2A",
  teal:"#4A8F7A",tealLight:"#E8F4F0",tealDark:"#2E6B58",
  green:"#5A7A3A",greenLight:"#EDF4E5",
  gold:"#C4902A",goldLight:"#FDF3E0",
  purple:"#7B5EA7",purpleLight:"#F0EBF8",
  red:"#C05A5A",redLight:"#FDF0F0",
  blue:"#2E7DAE",blueLight:"#E6F1FB",
  input:"#FAFAF8",shadow:"rgba(42,33,24,0.08)",
};
const FONT=`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');`;
const STEP1_SECTIONS=[
  {id:"roadmap",label:"인생 로드맵",icon:"🗺"},
  {id:"word",label:"말씀으로",icon:"📖"},
  {id:"people",label:"사람으로",icon:"👥"},
  {id:"event",label:"사건으로",icon:"⭐"},
];
const STEP2_SECTIONS=[
  {id:"neighbormap",label:"이웃 MAP",icon:"🌏"},
  {id:"neighbor",label:"이웃 찾기",icon:"🔍"},
  {id:"verb",label:"동사 찾기",icon:"✏️"},
  {id:"declaration",label:"교회 선언문",icon:"📜"},
  {id:"plant",label:"교회 개척",icon:"🌱"},
];
const VERB_CATEGORIES=[
  {cat:"손으로 하는/건강한",verbs:["건설하다","개조하다","수선하다","운영하다","보여주다","기초하다","제조하다","설치하다","조종하다","고치다","참가하다","움직이다","춤추다"]},
  {cat:"창조적인/재구성하는①",verbs:["시각화하다","발명하다","디자인하다","개념화하다","창조하다","상상하다","적응시키다","개선하다","고안하다","공식화하다","세우다","기획하다","산하하다"]},
  {cat:"창조적인/재구성하는②",verbs:["조각하다","세밀하게하다","조립하다","조경하다","그리다","채색하다","사진찍다","스케치하다","형성하다","배치하다","연습하다","수행하다","노래부르다","꾸미다"]},
  {cat:"사업하는",verbs:["팔다","장려하다","모집하다","기획하다","협상하다","광고하다","거래하다","설득하다","출판하다","추천하다","만나다","가르치다","분석하다","투자하다","취급하다"]},
  {cat:"리드/관리",verbs:["시작하다","지시하다","감독하다","통제하다","조정하다","계획하다","특파하다","설립하다","대표하다","이끌다","생산하다","고용하다","권고하다","결정하다"]},
  {cat:"돕는/섬기는",verbs:["상담하다","진단하다","촉진하다","들어주다","돕다","지원하다","봉사하다","중재하다","확인하다","공감하다","치료하다","격려하다","협력하다"]},
  {cat:"의사소통",verbs:["연설하다","방송하다","번역하다","편집하다","가르치다","훈련하다","토론하다","듣다","말하다","설명하다","표현하다","알리다","강의하다","공유하다","증거하다"]},
  {cat:"조직/분류",verbs:["조직하다","정의하다","범주화하다","분류하다","세우다","명령하다","통합하다","관리하다","준비하다","유지하다","이끌다"]},
  {cat:"숫자/돈",verbs:["계산하다","검사하다","부기하다","분석하다","예산짜다","관리하다","투자하다","평가하다","예측하다","인식하다"]},
  {cat:"분석적인/요약하는",verbs:["분석하다","평가하다","진단하다","정의하다","해석하다","추론하다","해결하다","검토하다","요약하다","인식하다"]},
  {cat:"일반적",verbs:["부르다","약속하다","시작하다","환대하다","추구하다","기록하다","용서하다","사랑하다","기억하다","회복하다","승인하다","연습하다","연결하다","살다"]},
];
const NEIGHBOR_CATEGORIES={
  "세대별":["유아","미취학 아동","어린이","10대","대학생","싱글 사회인","신혼 부부","부부","아동 양육 부모","청소년 양육 부모","60~70대 장년층","노년층","기타:"],
  "범위별":["친인척","이웃","국내","국외 국가:","민족:","도시:","지역:","사회:","여성","남성","기타:"],
  "영역별":["예술","비지니스","종교","미디어","교육","엔터테인먼트","가정","정부","스포츠","군인","기타:"],
  "사회 상태별":["실업자","노숙자","교육 받지 못한","교육 받은","중산층","부자","경제계 지도자","공적 지도자","기타:"],
  "신앙 상태별":["냉담자","불신자","예배만 참석자","헌신적 성도","선교적 성도","목회자/교회 리더","젊은 리더","사역 리더","기타:"],
  "필요 상태별":["위기에 있는","아픔을 가진","전환기에 있는","미지근한 상태","고립되어 있는","성장하기 원하는","동기부여가 필요한","전문기술이 필요한","자원이 필요한","격려가 필요한","기타:"],
};

/* ─── SHARED ─── */
function Card({title,sub,color,children}){
  return(
    <div style={{background:P.surface,borderRadius:12,border:`1px solid ${P.border}`,borderLeft:`4px solid ${color}`,overflow:"hidden"}}>
      <div style={{padding:"12px 18px",background:`${color}09`,borderBottom:`1px solid ${P.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:P.text,lineHeight:1.4}}>{title}</div>
        {sub&&<div style={{fontSize:11,color:P.textMuted,marginTop:3,lineHeight:1.5}}>{sub}</div>}
      </div>
      <div style={{padding:"16px 18px"}}>{children}</div>
    </div>
  );
}
function TA({value,onChange,placeholder,rows=4,color=P.teal}){
  return(
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{width:"100%",padding:"11px 13px",border:`1px solid ${value?color+"55":P.border}`,borderRadius:9,fontSize:13,lineHeight:1.8,fontFamily:"'Noto Sans KR',sans-serif",background:value?`${color}04`:P.input,color:P.text,outline:"none",resize:"vertical",boxSizing:"border-box",transition:"border-color 0.2s"}}
      onFocus={e=>e.target.style.borderColor=`${color}80`} onBlur={e=>e.target.style.borderColor=value?`${color}55`:P.border}/>
  );
}

/* ─── AUTH ─── */
function AuthScreen(){
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");
  const go=async()=>{setBusy(true);setErr("");try{await signInWithPopup(auth,gProvider);}catch{setErr("로그인에 실패했습니다.");setBusy(false);}};
  return(
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans KR',sans-serif",padding:20}}>
      <style>{FONT}</style>
      <div style={{background:P.surface,borderRadius:20,padding:"48px 44px 40px",width:"100%",maxWidth:420,textAlign:"center",boxShadow:`0 4px 40px ${P.shadow}`,border:`1px solid ${P.border}`}}>
        <div style={{fontSize:48,marginBottom:14}}>🌱</div>
        <div style={{fontSize:10,letterSpacing:3,color:P.textMuted,textTransform:"uppercase",marginBottom:6}}>일상 교회 개척 스쿨</div>
        <h1 style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,fontWeight:700,color:P.navy,marginBottom:6,lineHeight:1.4}}>"교회로 살면<br/>교회는 개척된다"</h1>
        <p style={{fontSize:13,color:P.textSub,lineHeight:1.8,marginBottom:24}}>나라는 교회 정체성을 찾고<br/>복음 씨앗을 심는 훈련 과정입니다</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:28}}>
          {[{n:"STEP 1",t:"나의 복음 씨앗 찾기",c:P.teal,bg:P.tealLight,subs:["인생 로드맵","말씀으로","사람으로","사건으로"]},{n:"STEP 2",t:"나의 복음 씨앗 심기",c:P.green,bg:P.greenLight,subs:["이웃 MAP","이웃 찾기","동사 찾기","교회 선언문"]}].map(s=>(
            <div key={s.n} style={{padding:"12px 10px",background:s.bg,borderRadius:10,border:`1px solid ${s.c}30`,textAlign:"left"}}>
              <div style={{fontSize:9,fontWeight:700,color:s.c,letterSpacing:1,marginBottom:2}}>{s.n}</div>
              <div style={{fontSize:12,fontWeight:600,color:s.c,marginBottom:6}}>{s.t}</div>
              {s.subs.map(sub=><div key={sub} style={{fontSize:10,color:s.c,opacity:0.7,lineHeight:1.7}}>✓ {sub}</div>)}
            </div>
          ))}
        </div>
        {err&&<div style={{marginBottom:12,padding:"9px 14px",borderRadius:8,background:"#fff5f5",color:P.red,fontSize:13,border:`1px solid ${P.red}30`}}>{err}</div>}
        <button onClick={go} disabled={busy} style={{width:"100%",padding:14,borderRadius:12,border:`1px solid ${P.border}`,background:busy?"#f0f0f0":P.surface,color:P.text,fontSize:14,fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif",cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,boxShadow:`0 2px 8px ${P.shadow}`}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {busy?"로그인 중…":"Google 계정으로 로그인"}
        </button>
        <p style={{fontSize:11,color:P.textMuted,marginTop:14,lineHeight:1.7}}>본인의 데이터만 접근 가능합니다</p>
      </div>
    </div>
  );
}

/* ─── GRID ─── */
function GridCell({cell,rowHeight,onCellClick}){
  const[hov,setHov]=useState(false);
  const dateStr=cell?[cell.dateY,cell.dateM?.padStart(2,"0"),cell.dateD?.padStart(2,"0")].filter(Boolean).join("."):"";
  const lines=cell?.text?cell.text.split("\n").filter(Boolean).slice(0,3):[];
  return(
    <div onClick={onCellClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} title={cell?`${dateStr?dateStr+" · ":""}${cell.text}`:"클릭하여 추가"}
      style={{width:COL_W,minWidth:COL_W,minHeight:rowHeight,borderLeft:`1px solid ${hov?P.borderDark:P.border}`,background:cell?.text?(hov?`${cell.color}44`:`${cell.color}1E`):(hov?`${P.teal}10`:"transparent"),cursor:"pointer",position:"relative",overflow:"visible",transition:"background 0.12s"}}>
      {cell?.text&&<div style={{position:"absolute",top:3,left:2,right:2,background:`${cell.color}EE`,borderRadius:4,padding:"3px 4px",color:"#fff",lineHeight:1.3,overflow:"hidden",maxHeight:rowHeight-8,boxShadow:"0 2px 6px rgba(0,0,0,0.18)",zIndex:1}}>
        {dateStr&&<div style={{fontSize:7,opacity:0.8,marginBottom:1}}>{dateStr}</div>}
        {lines.map((l,i)=><div key={i} style={{fontSize:8.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l}</div>)}
      </div>}
      {!cell?.text&&hov&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:14,color:P.teal,opacity:0.6,pointerEvents:"none"}}>+</div>}
    </div>
  );
}

function GridTimeline({cells,onCellClick,onAgeClick,birthYear}){
  const ages=Array.from({length:END_AGE-START_AGE+1},(_,i)=>START_AGE+i);
  const hasYear=birthYear&&birthYear>=1900&&birthYear<=2100;
  const hdrC=(age,content,pad)=>{
    const isMajor=age%AGE_STEP===0,isEarly=age<=5;
    return(
      <div key={age} onClick={()=>onAgeClick(age)} style={{width:COL_W,minWidth:COL_W,borderLeft:isMajor?`1px solid ${P.borderDark}`:`1px solid ${P.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"background 0.1s",background:isEarly?`${P.teal}08`:"transparent",padding:pad}}
        onMouseEnter={e=>e.currentTarget.style.background=`${P.teal}15`}
        onMouseLeave={e=>e.currentTarget.style.background=isEarly?`${P.teal}08`:"transparent"}>
        {content(age,isMajor,isEarly)}
      </div>
    );
  };
  return(
    <div style={{overflowX:"auto",paddingBottom:16}}>
      <div style={{minWidth:LABEL_W+ages.length*COL_W}}>
        <div style={{display:"flex",alignItems:"center",minHeight:20}}>
          <div style={{width:LABEL_W,minWidth:LABEL_W,textAlign:"right",paddingRight:12,fontSize:10,color:P.textMuted,fontStyle:"italic"}}>(사회 중요 이슈)</div>
          <div style={{flex:1,height:1,background:P.border}}/>
        </div>
        <div style={{display:"flex",alignItems:"stretch",borderTop:`2px solid ${P.navy}`,borderBottom:`1px solid ${P.border}`,background:"#F0EDE6"}}>
          <div style={{width:LABEL_W,minWidth:LABEL_W,padding:"6px 16px 6px 0",display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:11,fontWeight:700,color:P.navy,letterSpacing:2}}>나이</div>
          <div style={{display:"flex",flex:1}}>
            {ages.map(age=>hdrC(age,(a,isMajor,isEarly)=>
              isMajor?<span style={{fontSize:11,fontWeight:700,color:isEarly?P.teal:P.navy,pointerEvents:"none"}}>{a}</span>
              :<span style={{fontSize:8,opacity:0.45,color:isEarly?P.teal:P.navy,pointerEvents:"none"}}>{a}</span>
            ,"6px 0"))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"stretch",borderBottom:`2px solid ${P.navy}`,background:"#F5F0E5"}}>
          <div style={{width:LABEL_W,minWidth:LABEL_W,padding:"4px 16px 4px 0",display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:10,fontWeight:600,color:P.gold,letterSpacing:1.5}}>연도</div>
          <div style={{display:"flex",flex:1}}>
            {ages.map(age=>hdrC(age,(a,isMajor,isEarly)=>{
              const yr=hasYear?birthYear+a-1:null;
              return isMajor?<span style={{fontSize:9,fontWeight:600,color:yr?(isEarly?P.teal:P.gold):P.textMuted,opacity:yr?1:0.35,pointerEvents:"none"}}>{yr??"—"}</span>
              :<span style={{fontSize:8,color:yr?(isEarly?P.teal:P.gold):P.textMuted,opacity:yr?0.5:0.25,pointerEvents:"none"}}>{yr??"—"}</span>;
            },"4px 0"))}
          </div>
        </div>
        {ROWS.map((row,ri)=>(
          <div key={row.id} style={{display:"flex",alignItems:"stretch",borderBottom:`1px solid ${P.border}`,background:ri%2===0?P.surface:`${P.bg}99`}}>
            <div style={{width:LABEL_W,minWidth:LABEL_W,padding:"0 16px 0 0",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:7,minHeight:row.height}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:600,color:P.textSub}}>{row.label}</div>
                {row.sub&&<div style={{fontSize:9,color:P.textMuted,lineHeight:1.3}}>{row.sub}</div>}
              </div>
              <div style={{width:6,height:row.height*0.55,borderRadius:2,background:row.accent,flexShrink:0}}/>
            </div>
            <div style={{display:"flex",flex:1,borderLeft:`2px solid ${row.accent}40`}}>
              {ages.map(age=><GridCell key={age} cell={cells[`${row.id}_${age}`]} rowHeight={row.height} onCellClick={()=>onCellClick(row.id,row.label,age)}/>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventModal({cell,onSave,onDelete,onClose,birthYear}){
  const isNew=!cell.rowId;
  const initRow=cell.rowId?ROWS.find(r=>r.id===cell.rowId)||ROWS[0]:null;
  const[selRow,setSelRow]=useState(initRow);
  const[text,setText]=useState(cell.text||"");
  const[color,setColor]=useState(cell.color||initRow?.accent||ROWS[0].accent);
  const[dateY,setDateY]=useState(cell.dateY||(birthYear?String(birthYear+cell.age-1):""));
  const[dateM,setDateM]=useState(cell.dateM||"");
  const[dateD,setDateD]=useState(cell.dateD||"");
  const taRef=useRef(null);
  const accent=selRow?selRow.accent:color;
  const yr=birthYear?birthYear+cell.age-1:null;
  const inp={background:P.input,border:`1px solid ${P.border}`,borderRadius:8,padding:"8px 11px",color:P.text,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:"none",width:"100%",transition:"border-color 0.2s",boxSizing:"border-box"};
  const insertBullet=()=>{const ta=taRef.current;if(!ta)return;const s=ta.selectionStart,v=ta.value,ls=v.lastIndexOf("\n",s-1)+1,le=v.indexOf("\n",s),line=v.substring(ls,le===-1?v.length:le);let nv,c;if(line.startsWith("• ")){nv=v.slice(0,ls)+line.slice(2)+v.slice(le===-1?v.length:le);c=Math.max(ls,s-2);}else{nv=v.slice(0,ls)+"• "+v.slice(ls);c=s+2;}setText(nv);setTimeout(()=>{ta.selectionStart=ta.selectionEnd=c;ta.focus();},0);};
  const hkd=e=>{if(e.key==="Enter"){const ta=taRef.current,s=ta.selectionStart,v=ta.value,ls=v.lastIndexOf("\n",s-1)+1;if(v.substring(ls,s).startsWith("• ")){e.preventDefault();const nv=v.slice(0,s)+"\n• "+v.slice(s);setText(nv);setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+3;},0);}}};
  const handleSave=()=>{const rid=selRow?.id||cell.rowId;if(!rid)return;onSave({text,color,dateY:dateY.trim(),dateM:dateM.trim(),dateD:dateD.trim(),rowId:rid});};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(42,33,24,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:P.surface,borderRadius:16,borderTop:`3px solid ${accent}`,padding:24,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(42,33,24,0.2)",fontFamily:"'Noto Sans KR',sans-serif",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontSize:14,fontWeight:700,color:P.text}}>{isNew?"✨ 새 사건 추가":"✏️ 사건 편집"}</div>
          <div style={{padding:"3px 10px",borderRadius:20,fontSize:12,background:`${accent}18`,color:accent,fontWeight:600}}>{cell.age}세{yr?` · ${yr}년`:""}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:P.textMuted,fontWeight:600,letterSpacing:0.5,marginBottom:8}}>📂 카테고리{isNew&&<span style={{color:P.red}}> *</span>}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {ROWS.map(row=>{const active=selRow?.id===row.id;return(
              <button key={row.id} onClick={()=>{setSelRow(row);if(!cell.color)setColor(row.accent);}} style={{padding:"5px 11px",borderRadius:20,cursor:"pointer",border:`1.5px solid ${active?row.accent:P.border}`,background:active?`${row.accent}18`:"transparent",color:active?row.accent:P.textSub,fontFamily:"'Noto Sans KR',sans-serif",fontSize:11,fontWeight:active?700:400,display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:6,height:6,borderRadius:1,background:active?row.accent:P.border,flexShrink:0}}/>{row.label}
              </button>
            );})}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontSize:11,color:P.textMuted,fontWeight:600}}>✍️ 내용</div>
            <div style={{display:"flex",gap:5}}>
              {[{l:"• 글머리",f:insertBullet},{l:"지우기",f:()=>setText("")}].map(b=><button key={b.l} onClick={b.f} style={{padding:"3px 8px",borderRadius:5,cursor:"pointer",border:`1px solid ${P.border}`,background:P.input,color:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:11}}>{b.l}</button>)}
            </div>
          </div>
          <textarea ref={taRef} autoFocus value={text} onChange={e=>setText(e.target.value)} onKeyDown={hkd} placeholder={"이 시기에 있었던 일을 적어주세요…"} rows={5} style={{...inp,resize:"vertical",lineHeight:1.8}}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:P.textMuted,fontWeight:600,marginBottom:7}}>📅 날짜 <span style={{fontWeight:400,opacity:0.6}}>(선택)</span></div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input type="number" placeholder="연도" min="1900" max="2100" value={dateY} onChange={e=>setDateY(e.target.value)} style={{...inp,textAlign:"center",flex:"2 1 0"}}/>
            <span style={{color:P.textMuted,fontSize:12,flexShrink:0}}>년</span>
            <input type="number" placeholder="월" min="1" max="12" value={dateM} onChange={e=>setDateM(e.target.value)} style={{...inp,textAlign:"center",flex:"1 1 0"}}/>
            <span style={{color:P.textMuted,fontSize:12,flexShrink:0}}>월</span>
            <input type="number" placeholder="일" min="1" max="31" value={dateD} onChange={e=>setDateD(e.target.value)} style={{...inp,textAlign:"center",flex:"1 1 0"}}/>
            <span style={{color:P.textMuted,fontSize:12,flexShrink:0}}>일</span>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:P.textMuted,fontWeight:600,marginBottom:7}}>🎨 색상</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {EVENT_COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${color===c?"#333":"transparent"}`,transition:"all 0.15s"}}/>)}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleSave} disabled={isNew&&!selRow} style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:(isNew&&!selRow)?P.border:`linear-gradient(135deg,${accent},${accent}BB)`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:13,fontWeight:700,cursor:(isNew&&!selRow)?"not-allowed":"pointer"}}>{isNew?"추가하기":"저장"}</button>
          {cell.text&&<button onClick={onDelete} style={{padding:"11px 14px",borderRadius:9,border:`1px solid ${P.red}40`,background:`${P.red}10`,color:P.red,fontFamily:"'Noto Sans KR',sans-serif",fontSize:13,cursor:"pointer"}}>삭제</button>}
          <button onClick={onClose} style={{padding:"11px 14px",borderRadius:9,border:`1px solid ${P.border}`,background:"transparent",color:P.textSub,fontFamily:"'Noto Sans KR',sans-serif",fontSize:13,cursor:"pointer"}}>취소</button>
        </div>
      </div>
    </div>
  );
}

/* ─── STEP 1 SECTIONS ─── */
function WordSection({data,onChange}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <Card title="Q. 내가 경험한 복음 — 당신을 향한 하나님의 포기하지 않는 사랑은 무엇인가요?" sub="인격적인 하나님과의 만남의 이야기를 써보세요" color={P.teal}>
        <TA value={data.gospel_exp} onChange={v=>onChange("gospel_exp",v)} placeholder="인격적인 하나님과의 만남의 이야기를 자유롭게 적어주세요…" rows={6}/>
        <div style={{marginTop:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 44px 1fr",gap:0,alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,color:P.textMuted,marginBottom:6,fontWeight:600}}>Before — 복음 이전의 삶의 모습</div>
              <TA value={data.gospel_before} onChange={v=>onChange("gospel_before",v)} placeholder="복음을 만나기 전 나의 삶…" rows={5}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0}}>
              <div style={{width:1,height:30,background:P.border}}/>
              <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${P.teal},${P.green})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,textAlign:"center",lineHeight:1.2}}>복음</div>
              <div style={{width:1,height:30,background:P.border}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:P.textMuted,marginBottom:6,fontWeight:600}}>After — 복음 이후의 달라진 삶의 모습</div>
              <TA value={data.gospel_after} onChange={v=>onChange("gospel_after",v)} placeholder="복음 이후 달라진 나의 삶…" rows={5}/>
            </div>
          </div>
        </div>
      </Card>
      <Card title="Q. 내 인생의 의미있는 말씀은 무엇인가요?" sub="찬양의 가사나 특정 성경인물의 이야기도 좋습니다" color={P.gold}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[1,2,3].map(i=><TA key={i} value={data[`word_m${i}`]} onChange={v=>onChange(`word_m${i}`,v)} placeholder={`말씀 ${i}`} rows={5} color={P.gold}/>)}
        </div>
      </Card>
      <Card title="Q. 하나님께 드렸던 기억에 남는 고백/기도" sub="시즌 마다 소원했던 것들을 떠올려보세요" color={P.purple}>
        <TA value={data.word_prayer} onChange={v=>onChange("word_prayer",v)} placeholder="시즌별로 하나님께 드렸던 기도와 고백들…" rows={6} color={P.purple}/>
      </Card>
    </div>
  );
}

function PeopleSection({data,onChange}){
  const people=data.people_table||Array(6).fill(null).map(()=>({name:"",belong:"",influence:""}));
  const updateP=(i,field,val)=>{const n=[...people];n[i]={...n[i],[field]:val};onChange("people_table",n);};
  const addRow=()=>onChange("people_table",[...people,{name:"",belong:"",influence:""}]);
  const cs={padding:"7px 10px",border:"none",background:"transparent",color:P.text,fontSize:12,fontFamily:"'Noto Sans KR',sans-serif",outline:"none",width:"100%",boxSizing:"border-box"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <Card title="Q. 나의 삶에 영향을 준 사람은 누구입니까?" sub="영적, 정서적, 사회적, 경제적, 지성적, 육체적 등" color={P.teal}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>
              {["사람","소속/시기","영향 받은 것"].map((h,i)=><th key={h} style={{padding:"8px 10px",background:"#F0EDE6",textAlign:"left",fontWeight:600,color:P.textSub,borderBottom:`2px solid ${P.border}`,width:i===0?"20%":i===1?"25%":"55%"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {people.map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`}}>
                <td><input value={p.name||""} onChange={e=>updateP(i,"name",e.target.value)} placeholder="이름" style={cs}/></td>
                <td style={{borderLeft:`1px solid ${P.border}`}}><input value={p.belong||""} onChange={e=>updateP(i,"belong",e.target.value)} placeholder="소속/시기" style={cs}/></td>
                <td style={{borderLeft:`1px solid ${P.border}`}}><input value={p.influence||""} onChange={e=>updateP(i,"influence",e.target.value)} placeholder="어떤 영향을 받았나요?" style={cs}/></td>
              </tr>)}
            </tbody>
          </table>
          <button onClick={addRow} style={{marginTop:8,padding:"6px 14px",borderRadius:7,border:`1px solid ${P.teal}60`,background:P.tealLight,color:P.tealDark,fontFamily:"'Noto Sans KR',sans-serif",fontSize:12,cursor:"pointer"}}>+ 행 추가</button>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="사람들에게 들은 칭찬, 예언, 격려, 권면의 말" color={P.green}>
          <TA value={data.people_praise} onChange={v=>onChange("people_praise",v)} placeholder="내게 힘이 되었던 말들…" rows={5} color={P.green}/>
        </Card>
        <Card title="사람들에게 받은 상처, 듣기 싫어하는 말" color={P.red}>
          <TA value={data.people_wound} onChange={v=>onChange("people_wound",v)} placeholder="마음에 남아있는 상처의 말들…" rows={5} color={P.red}/>
        </Card>
      </div>
    </div>
  );
}

function EventSection({data,onChange}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="감사한 일 / 성취의 경험을 적어보세요" color={P.teal}>
          <TA value={data.ev_grat} onChange={v=>onChange("ev_grat",v)} placeholder="감사했던 일들, 성취의 경험들…" rows={4}/>
          <div style={{fontSize:11,color:P.textMuted,margin:"10px 0 5px",fontWeight:600}}>이 경험을 통한 인사이트는?</div>
          <TA value={data.ev_grat_i} onChange={v=>onChange("ev_grat_i",v)} placeholder="이 경험에서 발견한 것…" rows={3}/>
        </Card>
        <Card title="어려움, 실패의 경험을 적어보세요" color={P.red}>
          <TA value={data.ev_str} onChange={v=>onChange("ev_str",v)} placeholder="힘들었던 시간들, 실패의 경험들…" rows={4} color={P.red}/>
          <div style={{fontSize:11,color:P.textMuted,margin:"10px 0 5px",fontWeight:600}}>이 경험을 통한 인사이트는?</div>
          <TA value={data.ev_str_i} onChange={v=>onChange("ev_str_i",v)} placeholder="이 경험에서 배운 것…" rows={3} color={P.red}/>
        </Card>
      </div>
      <Card title="어린 시절의 기억들의 조각을 모아보세요" sub="좋은 사건, 나쁜 사건 등 기억나는 일들 적어보기" color={P.gold}>
        <TA value={data.ev_child} onChange={v=>onChange("ev_child",v)} placeholder="어린 시절 기억나는 일들…" rows={5} color={P.gold}/>
      </Card>
    </div>
  );
}

/* ─── STEP 2 SECTIONS ─── */
function NeighborMapSection({data,onChange}){
  const circles=data.circles||[];
  const[newLabel,setNewLabel]=useState("");
  const colors=["#4A8F7A","#C4902A","#2E7DAE","#C05A5A","#7B5EA7","#4A8A60","#C47A10","#3BAAC0"];
  const add=()=>{if(!newLabel.trim())return;onChange("circles",[...circles,{id:Date.now(),label:newLabel.trim(),color:colors[circles.length%colors.length],size:70+Math.floor(Math.random()*50)}]);setNewLabel("");};
  const remove=id=>onChange("circles",circles.filter(c=>c.id!==id));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card title="삶의 복음 일상 이웃 MAP" sub="가족, 지인, 직장, 모임 등 사회적으로 소속되어 있는 공동체를 동그라미로 그려봅시다" color={P.teal}>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="공동체 이름 입력 (예: 우리 가족, 직장 동료, 이웃 모임, 교회 친구…)" style={{flex:1,padding:"9px 14px",border:`1px solid ${P.border}`,borderRadius:9,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none"}}/>
          <button onClick={add} style={{padding:"9px 18px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>추가</button>
        </div>
        <div style={{position:"relative",background:"#F0EDE6",borderRadius:"50%",width:"100%",paddingBottom:"56%",border:`2px solid ${P.borderDark}`,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:14,padding:28}}>
            <div style={{width:76,height:76,borderRadius:"50%",border:`2px dashed ${P.borderDark}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:P.textMuted,flexShrink:0}}>우리 가족</div>
            {circles.map(c=>(
              <div key={c.id} style={{position:"relative",width:c.size,height:c.size,borderRadius:"50%",background:`${c.color}28`,border:`2px solid ${c.color}60`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:10,color:c.color,fontWeight:600,textAlign:"center",padding:4,lineHeight:1.3}}>{c.label}</span>
                <button onClick={()=>remove(c.id)} style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",border:"none",background:P.red,color:"#fff",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
              </div>
            ))}
            {circles.length===0&&<div style={{fontSize:12,color:P.textMuted,textAlign:"center",lineHeight:1.8,pointerEvents:"none"}}>위에서 공동체를 추가하면<br/>여기에 나타납니다</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function NeighborFindSection({data,onChange}){
  const checked=data.nc_checked||{};
  const toggle=(cat,item)=>{const k=`${cat}__${item}`,n={...checked};n[k]=!n[k];onChange("nc_checked",n);};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Q. 나는 어떤 이웃 또는 영역에 마음이 가나요?" color={P.teal}>
          <TA value={data.nh_heart} onChange={v=>onChange("nh_heart",v)} placeholder="마음이 가는 이웃 또는 영역…" rows={4}/>
        </Card>
        <Card title="Q. 나는 나의 이웃 또는 그 영역이 어떻게 되길 원하나요?" color={P.gold}>
          <TA value={data.nh_vision} onChange={v=>onChange("nh_vision",v)} placeholder="그 이웃/영역에 대한 나의 바람…" rows={4} color={P.gold}/>
        </Card>
      </div>
      <Card title="Q. 나는 나의 이웃 또는 마음이 가는 영역을 위해서 무엇을 하고 싶나요?" color={P.purple}>
        <TA value={data.nh_action} onChange={v=>onChange("nh_action",v)} placeholder="이웃을 위해 하고 싶은 것들…" rows={4} color={P.purple}/>
      </Card>
      <Card title='"나는 이런 사람이 끌려요~"' sub="각 칼럼에서 1개 이상 체크해보세요" color={P.green}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {Object.entries(NEIGHBOR_CATEGORIES).map(([cat,items])=>(
            <div key={cat} style={{background:P.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
              <div style={{fontSize:10,fontWeight:700,color:P.green,marginBottom:8,borderBottom:`1px solid ${P.border}`,paddingBottom:5}}>{cat}</div>
              {items.map(item=>{
                const k=`${cat}__${item}`,isC=checked[k],isCustom=item.endsWith(":");
                if(isCustom)return(
                  <div key={item} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                    <span style={{fontSize:10,color:P.textMuted,whiteSpace:"nowrap"}}>{item}</span>
                    <input value={data[`nc_c_${cat}`]||""} onChange={e=>onChange(`nc_c_${cat}`,e.target.value)} style={{flex:1,padding:"2px 5px",border:`1px solid ${P.border}`,borderRadius:4,fontSize:10,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none"}}/>
                  </div>
                );
                return(
                  <div key={item} onClick={()=>toggle(cat,item)} style={{display:"flex",alignItems:"center",gap:6,padding:"2px 0",cursor:"pointer"}}>
                    <div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${isC?P.green:P.border}`,background:isC?P.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                      {isC&&<div style={{width:4,height:4,borderRadius:"50%",background:"#fff"}}/>}
                    </div>
                    <span style={{fontSize:10,color:isC?P.green:P.textSub,fontWeight:isC?600:400}}>{item}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function VerbSection({data,onChange}){
  const checked=data.verb_checked||{};
  const toggle=(cat,v)=>{const k=`${cat}__${v}`,n={...checked};n[k]=!n[k];onChange("verb_checked",n);};
  const total=Object.values(checked).filter(Boolean).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card title="삶의 복음 언어 동사 찾기 도구" sub={`끌리는 단어에 모두 체크를 해보세요 · 현재 ${total}개 선택됨`} color={P.teal}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {VERB_CATEGORIES.map(({cat,verbs})=>(
            <div key={cat} style={{background:P.bg,borderRadius:8,padding:"9px 11px",border:`1px solid ${P.border}`}}>
              <div style={{fontSize:9,fontWeight:700,color:P.tealDark,marginBottom:7,lineHeight:1.4,borderBottom:`1px solid ${P.border}`,paddingBottom:4}}>{cat}</div>
              {verbs.map(v=>{const k=`${cat}__${v}`,isC=checked[k];return(
                <div key={v} onClick={()=>toggle(cat,v)} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0",cursor:"pointer"}}>
                  <div style={{width:11,height:11,borderRadius:2,border:`1.5px solid ${isC?P.teal:P.border}`,background:isC?P.teal:"transparent",flexShrink:0,transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isC&&<span style={{color:"#fff",fontSize:7,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:10,color:isC?P.tealDark:P.textSub,fontWeight:isC?600:400}}>{v}</span>
                </div>
              );})}
            </div>
          ))}
        </div>
      </Card>
      <Card title="특별히 내게 가슴을 뛰게 하는 동사들을 적어보세요" color={P.gold}>
        <TA value={data.verb_heart} onChange={v=>onChange("verb_heart",v)} placeholder="체크한 동사들 중 특별히 가슴 뛰는 것들, 또는 목록에 없는 나만의 동사들…" rows={3} color={P.gold}/>
      </Card>
    </div>
  );
}

function DeclarationSection({data,onChange}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="나의 교회 언어 Keyword" sub="체크한 동사들, 이웃의 특징들을 바탕으로" color={P.teal}>
          <TA value={data.decl_kw} onChange={v=>onChange("decl_kw",v)} placeholder="나의 교회를 표현하는 핵심 단어들…" rows={5}/>
        </Card>
        <Card title="이웃을 향한 나의 교회 Concept" color={P.gold}>
          <TA value={data.decl_concept} onChange={v=>onChange("decl_concept",v)} placeholder="내가 꿈꾸는 교회의 모습과 방향…" rows={5} color={P.gold}/>
        </Card>
      </div>
      <Card title="이웃을 향한 나의 교회 선언 적어보세요" color={P.green}>
        <TA value={data.decl_stmt} onChange={v=>onChange("decl_stmt",v)} placeholder="나의 교회는… 나는… 우리는…" rows={8} color={P.green}/>
      </Card>
    </div>
  );
}

function PlantSection({data,onChange}){
  const partners=data.partners||Array(8).fill(null).map(()=>({trainer:"",church:"",content:""}));
  const updateP=(i,field,val)=>{const n=[...partners];n[i]={...n[i],[field]:val};onChange("partners",n);};
  const cs={padding:"7px 10px",border:"none",background:"transparent",color:P.text,fontSize:12,fontFamily:"'Noto Sans KR',sans-serif",outline:"none",width:"100%",boxSizing:"border-box"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card title="내 교회의 핵심 말씀, 또는 약속의 말씀은 무엇인가요?" color={P.teal}>
        <TA value={data.plant_scripture} onChange={v=>onChange("plant_scripture",v)} placeholder="내 교회를 세우는 말씀…" rows={4}/>
      </Card>
      <Card title="내 교회의 이름을 지어보세요" sub="크게 적어보세요" color={P.gold}>
        <input value={data.plant_name||""} onChange={e=>onChange("plant_name",e.target.value)} placeholder="교회 이름을 지어보세요" style={{width:"100%",padding:"16px 20px",border:`2px solid ${data.plant_name?P.gold:P.border}`,borderRadius:12,fontSize:data.plant_name?22:16,fontFamily:"'Noto Serif KR',serif",fontWeight:700,color:P.navy,background:P.input,outline:"none",boxSizing:"border-box",textAlign:"center",transition:"all 0.2s"}}/>
      </Card>
      <Card title={`${data.plant_name||"_______"} 교회의 첫걸음 이야기는 무엇인가요?`} sub="교회의 첫 목표" color={P.green}>
        <TA value={data.plant_first} onChange={v=>onChange("plant_first",v)} placeholder="교회의 첫 목표와 첫걸음 이야기…" rows={5} color={P.green}/>
      </Card>
      <Card title="함께 훈련 받은 동역 교회의 이름과 의미를 적어보고 함께 기도합시다" color={P.purple}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>
              {["훈련자명","교회 이름","기도 내용"].map((h,i)=><th key={h} style={{padding:"8px 10px",background:"#F0EDE6",textAlign:"left",fontWeight:600,color:P.textSub,borderBottom:`2px solid ${P.border}`,width:i===0?"20%":i===1?"30%":"50%"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {partners.map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`}}>
                <td><input value={p.trainer||""} onChange={e=>updateP(i,"trainer",e.target.value)} placeholder="이름" style={cs}/></td>
                <td style={{borderLeft:`1px solid ${P.border}`}}><input value={p.church||""} onChange={e=>updateP(i,"church",e.target.value)} placeholder="교회 이름" style={cs}/></td>
                <td style={{borderLeft:`1px solid ${P.border}`}}><input value={p.content||""} onChange={e=>updateP(i,"content",e.target.value)} placeholder="기도 내용" style={cs}/></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─── LEADER GATE ─── */
function LeaderGate({onClose,onUnlock}){
  const[code,setCode]=useState("");
  const[err,setErr]=useState("");
  const try_=()=>code.trim()===LEADER_CODE?onUnlock():setErr("코드가 올바르지 않습니다. 리더에게 확인해주세요.");
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(42,33,24,0.6)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:P.surface,borderRadius:20,padding:"36px 32px",width:"100%",maxWidth:420,textAlign:"center",boxShadow:"0 20px 60px rgba(42,33,24,0.25)",fontFamily:"'Noto Sans KR',sans-serif"}}>
        <div style={{fontSize:40,marginBottom:14}}>🌱</div>
        <h2 style={{fontFamily:"'Noto Serif KR',serif",fontSize:20,color:P.navy,marginBottom:10,fontWeight:700}}>1단계 완성을 축하합니다!</h2>
        <p style={{fontSize:13,color:P.textSub,lineHeight:1.8,marginBottom:24}}>리더와 함께 작성한 내용을 충분히 나누어 보세요.<br/>나눔이 끝난 후, 리더로부터 받은 <strong>코드</strong>를 입력하면<br/>2단계로 넘어갈 수 있습니다.</p>
        <div style={{background:P.tealLight,borderRadius:12,padding:16,border:`1px solid ${P.teal}30`,marginBottom:20,textAlign:"left"}}>
          <div style={{fontSize:11,color:P.teal,fontWeight:700,letterSpacing:1,marginBottom:8}}>2단계 잠금 해제 코드</div>
          <input type="text" placeholder="리더에게 받은 코드 입력" value={code} onChange={e=>{setCode(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&try_()}
            style={{width:"100%",padding:"10px 12px",border:`1px solid ${err?P.red:P.border}`,borderRadius:8,fontSize:14,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none",boxSizing:"border-box",letterSpacing:2,textAlign:"center"}}/>
          {err&&<div style={{fontSize:12,color:P.red,marginTop:6}}>{err}</div>}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:9,border:`1px solid ${P.border}`,background:"transparent",color:P.textSub,fontFamily:"'Noto Sans KR',sans-serif",fontSize:13,cursor:"pointer"}}>나중에</button>
          <button onClick={try_} style={{flex:2,padding:"11px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>2단계로 이동 →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── ADMIN ─── */
function AdminScreen({user}){
  const[parts,setParts]=useState([]);
  const[loading,setLoading]=useState(true);
  const dn=user.displayName||user.email||"";
  useEffect(()=>{(async()=>{try{const s=await getDocs(collection(db,"progress"));setParts(s.docs.map(d=>({id:d.id,...d.data()})));}catch(e){console.error(e);}setLoading(false);})();},[]);
  const timeAgo=ts=>{if(!ts)return"—";const d=Math.floor((Date.now()-ts)/86400000);return d===0?"오늘":d===1?"1일 전":d<7?`${d}일 전`:d<30?`${Math.floor(d/7)}주 전`:`${Math.floor(d/30)}개월 전`;};
  const si=p=>p.stage===2?{l:"2단계 진행",bg:P.purpleLight,c:P.purple}:p.stage1Completed?{l:"1단계 완성",bg:P.greenLight,c:P.green}:{l:"1단계 진행",bg:P.tealLight,c:P.teal};
  return(
    <div style={{minHeight:"100vh",background:P.bg,fontFamily:"'Noto Sans KR',sans-serif"}}>
      <style>{FONT}</style>
      <header style={{padding:"12px 32px",background:P.surface,borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 1px 8px ${P.shadow}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:22}}>🌱</div>
          <div><div style={{fontSize:9,letterSpacing:2.5,color:P.textMuted,textTransform:"uppercase"}}>일상 교회 개척 스쿨</div>
          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:15,fontWeight:700,color:P.navy}}>관리자 대시보드</div></div>
        </div>
        <div style={{padding:"4px 10px",borderRadius:6,background:P.goldLight,border:`1px solid ${P.gold}40`,fontSize:11,color:P.gold,fontWeight:600}}>🛡 관리자 모드</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {user.photoURL?<img src={user.photoURL} alt="" style={{width:26,height:26,borderRadius:"50%"}}/>:
          <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${P.teal},${P.green})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{dn.charAt(0).toUpperCase()}</div>}
          <span style={{fontSize:12,fontWeight:600,color:P.text}}>{dn}</span>
          <button onClick={()=>signOut(auth)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",color:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:11,cursor:"pointer"}}>로그아웃</button>
        </div>
      </header>
      <div style={{padding:"24px 32px 48px"}}>
        <div style={{background:P.goldLight,border:`1px solid ${P.gold}40`,borderLeft:`4px solid ${P.gold}`,borderRadius:10,padding:"12px 16px",fontSize:12,color:P.textSub,lineHeight:1.7,marginBottom:24}}>
          🔒 관리자는 참가자의 진행 현황만 확인할 수 있습니다. 실제 기록 내용은 본인만 볼 수 있습니다.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[{l:"전체 참가자",v:parts.length,c:P.navy,bg:"#EEF2F8"},
            {l:"활동 참가자",v:parts.filter(p=>(p.eventCount||0)>0).length,c:P.teal,bg:P.tealLight},
            {l:"1단계 완성",v:parts.filter(p=>p.stage1Completed).length,c:P.green,bg:P.greenLight},
            {l:"2단계 진행",v:parts.filter(p=>p.stage===2).length,c:P.purple,bg:P.purpleLight},
          ].map(s=><div key={s.l} style={{background:s.bg,borderRadius:12,padding:"14px 16px",border:`1px solid ${s.c}20`}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c,fontFamily:"'Noto Serif KR',serif",marginBottom:3}}>{s.v}</div>
            <div style={{fontSize:11,color:P.textSub}}>{s.l}</div>
          </div>)}
        </div>
        <div style={{background:P.surface,borderRadius:14,border:`1px solid ${P.border}`,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${P.border}`,fontSize:15,fontWeight:600,color:P.text}}>참가자 현황</div>
          {loading?<div style={{padding:40,textAlign:"center",color:P.textMuted}}>불러오는 중…</div>:parts.length===0?<div style={{padding:40,textAlign:"center",color:P.textMuted}}>참가자 데이터가 없습니다.</div>:
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:P.bg}}>
              {["참가자","단계","사건 기록","마지막 접속","진행률"].map(h=><th key={h} style={{padding:"9px 16px",textAlign:h==="참가자"?"left":"center",fontWeight:600,color:P.textMuted,borderBottom:`1px solid ${P.border}`,fontSize:11}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {parts.map((p,i)=>{
                const sl=si(p),ov=p.overallProgress||0;
                const init=(p.displayName||p.email||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                const cs=[["#4A8F7A","#7B5EA7"],["#C4902A","#C05A5A"],["#2E7DAE","#4A8A60"],["#C05A5A","#C4902A"]][i%4];
                return(<tr key={p.id} style={{borderBottom:`1px solid ${P.border}`}} onMouseEnter={e=>e.currentTarget.style.background=P.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${cs[0]},${cs[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{init}</div>
                    <div><div style={{fontWeight:600,color:P.text}}>{p.displayName||"—"}</div><div style={{fontSize:11,color:P.textMuted}}>{p.email||""}</div></div>
                  </div></td>
                  <td style={{padding:"12px 16px",textAlign:"center"}}><span style={{background:sl.bg,color:sl.c,borderRadius:20,padding:"4px 11px",fontSize:11,fontWeight:600}}>{sl.l}</span></td>
                  <td style={{padding:"12px 16px",textAlign:"center",fontWeight:600,color:P.text}}>{p.eventCount||0}<span style={{fontSize:10,color:P.textMuted,fontWeight:400}}> 건</span></td>
                  <td style={{padding:"12px 16px",textAlign:"center",color:P.textSub,fontSize:12}}>{timeAgo(p.lastActiveAt)}</td>
                  <td style={{padding:"12px 20px"}}><div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:6,borderRadius:3,background:P.border,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${P.teal},${P.green})`,width:`${ov}%`,transition:"width 0.4s"}}/></div>
                    <span style={{fontSize:11,fontWeight:600,minWidth:30,color:P.teal}}>{ov}%</span>
                  </div></td>
                </tr>);
              })}
            </tbody>
          </table>}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
function RoadMapApp({user}){
  const[stage,setStage]=useState(1);
  const[sec1,setSec1]=useState("roadmap");
  const[sec2,setSec2]=useState("neighbormap");
  const[by,setBy]=useState("");
  const[s1,setS1]=useState({cells:{}});
  const[s2,setS2]=useState({});
  const[loaded,setLoaded]=useState(false);
  const[modal,setModal]=useState(null);
  const[gate,setGate]=useState(false);
  const saveRef=useRef(null);
  const dn=user.displayName||user.email||"";
  const parsedBY=parseInt(by)||null;

  useEffect(()=>{(async()=>{try{const snap=await getDoc(doc(db,"roadmaps",user.uid));if(snap.exists()){const d=snap.data();if(d.by)setBy(d.by);if(d.stage)setStage(d.stage);if(d.s1)setS1(d.s1);if(d.s2)setS2(d.s2);}}catch(e){console.error(e);}setLoaded(true);})();},[user.uid]);

  useEffect(()=>{
    if(!loaded)return;
    clearTimeout(saveRef.current);
    saveRef.current=setTimeout(async()=>{
      try{
        await setDoc(doc(db,"roadmaps",user.uid),{by,stage,s1,s2},{merge:true});
        const ec=Object.values(s1.cells||{}).filter(v=>v?.text).length;
        await setDoc(doc(db,"progress",user.uid),{uid:user.uid,displayName:user.displayName||"",email:user.email||"",stage,eventCount:ec,stage1Completed:stage>=2,overallProgress:stage===2?Math.min(100,50+Math.round((ec/20)*30)):Math.min(50,Math.round((ec/20)*50)),lastActiveAt:Date.now()},{merge:true});
      }catch(e){console.error(e);}
    },1500);
    return()=>clearTimeout(saveRef.current);
  },[by,stage,s1,s2,loaded]);

  const openCell=(rowId,rowLabel,age)=>{const k=`${rowId}_${age}`,c=s1.cells?.[k];setModal({rowId,rowLabel,age,key:k,text:c?.text||"",color:c?.color,dateY:c?.dateY||"",dateM:c?.dateM||"",dateD:c?.dateD||""});};
  const openByAge=age=>setModal({rowId:null,rowLabel:null,age,key:null,text:"",color:null,dateY:"",dateM:"",dateD:""});
  const saveCell=({text,color,dateY,dateM,dateD,rowId:nr})=>{const rid=nr||modal.rowId;if(!rid)return;const k=`${rid}_${modal.age}`,n={...(s1.cells||{})};if(!text.trim())delete n[k];else n[k]={text:text.trim(),color,dateY,dateM,dateD};setS1(p=>({...p,cells:n}));setModal(null);};
  const delCell=()=>{if(!modal.key){setModal(null);return;}const n={...(s1.cells||{})};delete n[modal.key];setS1(p=>({...p,cells:n}));setModal(null);};
  const up1=(k,v)=>setS1(p=>({...p,[k]:v}));
  const up2=(k,v)=>setS2(p=>({...p,[k]:v}));

  const curSecs=stage===1?STEP1_SECTIONS:STEP2_SECTIONS;
  const curSec=stage===1?sec1:sec2;
  const setSec=stage===1?setSec1:setSec2;
  const sc=stage===1?P.teal:P.green;
  const secInfo=curSecs.find(s=>s.id===curSec);
  const ec=Object.values(s1.cells||{}).filter(v=>v?.text).length;

  const renderSec=()=>{
    const pad={padding:"20px 32px 48px"};
    if(stage===1){
      if(sec1==="roadmap")return<div style={pad}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{fontSize:11,color:P.textMuted}}>📌 나이/연도 행 클릭 → 사건 추가 &nbsp;|&nbsp; 셀 클릭 → 편집</div>
          <div style={{padding:"3px 10px",borderRadius:20,background:P.tealLight,color:P.tealDark,fontSize:11,border:`1px solid ${P.teal}40`}}>나이 {START_AGE}–{END_AGE}세{parsedBY?` (${parsedBY}–${parsedBY+END_AGE}년)`:""}</div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
          {ROWS.map(r=><div key={r.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:P.textSub}}><div style={{width:7,height:7,borderRadius:2,background:r.accent}}/>{r.label}</div>)}
        </div>
        <GridTimeline cells={s1.cells||{}} onCellClick={openCell} onAgeClick={openByAge} birthYear={parsedBY}/>
      </div>;
      if(sec1==="word")return<div style={pad}><WordSection data={s1} onChange={up1}/></div>;
      if(sec1==="people")return<div style={pad}><PeopleSection data={s1} onChange={up1}/></div>;
      if(sec1==="event")return<div style={pad}><EventSection data={s1} onChange={up1}/></div>;
    }else{
      if(sec2==="neighbormap")return<div style={pad}><NeighborMapSection data={s2} onChange={up2}/></div>;
      if(sec2==="neighbor")return<div style={pad}><NeighborFindSection data={s2} onChange={up2}/></div>;
      if(sec2==="verb")return<div style={pad}><VerbSection data={s2} onChange={up2}/></div>;
      if(sec2==="declaration")return<div style={pad}><DeclarationSection data={s2} onChange={up2}/></div>;
      if(sec2==="plant")return<div style={pad}><PlantSection data={s2} onChange={up2}/></div>;
    }
  };

  return(
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",flexDirection:"column",fontFamily:"'Noto Sans KR',sans-serif"}}>
      <style>{`${FONT}*{box-sizing:border-box;margin:0;padding:0;}html,body{background:${P.bg};}::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-thumb{background:${P.borderDark};border-radius:3px;}textarea::placeholder,input::placeholder{color:${P.textMuted};}input[type=number]::-webkit-inner-spin-button{opacity:0.4;}`}</style>

      <header style={{padding:"10px 20px",background:P.surface,borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:500,boxShadow:`0 1px 8px ${P.shadow}`,gap:10,flexWrap:"wrap"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
          <div style={{fontSize:20}}>🌱</div>
          <div><div style={{fontSize:8,letterSpacing:2,color:P.textMuted,textTransform:"uppercase"}}>일상 교회 개척 스쿨</div>
          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:13,fontWeight:700,color:P.navy}}>나의 복음 씨앗 {stage===1?"찾기":"심기"}</div></div>
        </div>

        {/* Step tabs */}
        <div style={{display:"flex",alignItems:"center",gap:0,border:`1px solid ${P.border}`,borderRadius:20,overflow:"hidden",flexShrink:0}}>
          {[{n:1,l:"STEP 1 씨앗 찾기",c:P.teal},{n:2,l:"STEP 2 씨앗 심기",c:P.green}].map((s,i)=>{
            const isA=stage===s.n,isDone=stage>s.n;
            return<div key={s.n} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:isA?`${s.c}18`:"transparent",borderLeft:i>0?`1px solid ${P.border}`:"none",cursor:isDone||isA?"pointer":"not-allowed",opacity:!isDone&&!isA?0.5:1}} onClick={()=>(isDone||isA)&&setStage(s.n)}>
              <div style={{width:16,height:16,borderRadius:"50%",background:isA?s.c:isDone?s.c:P.border,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{isDone?"✓":s.n}</div>
              <span style={{fontSize:11,fontWeight:isA?700:400,color:isA?s.c:isDone?s.c:P.textMuted,whiteSpace:"nowrap"}}>{s.l}</span>
            </div>;
          })}
        </div>

        {/* Section nav */}
        <div style={{flex:1,overflowX:"auto",minWidth:0}}>
          <div style={{display:"flex",gap:0,border:`1px solid ${P.border}`,borderRadius:9,overflow:"hidden",width:"max-content"}}>
            {curSecs.map((s,i)=>{const isA=curSec===s.id;return(
              <button key={s.id} onClick={()=>setSec(s.id)} style={{padding:"6px 12px",background:isA?`${sc}18`:"transparent",border:"none",borderLeft:i>0?`1px solid ${P.border}`:"none",color:isA?sc:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:11,cursor:"pointer",fontWeight:isA?700:400,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                <span>{s.icon}</span>{s.label}
              </button>
            );})}
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {stage===1&&<>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <label style={{fontSize:10,color:P.textMuted,whiteSpace:"nowrap"}}>출생연도</label>
              <input type="number" placeholder="예: 1974" min="1900" max="2100" value={by} onChange={e=>setBy(e.target.value)} style={{width:78,padding:"5px 7px",border:`1px solid ${parsedBY?P.teal:P.border}`,borderRadius:7,color:P.text,fontSize:11,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,outline:"none"}}/>
              <span style={{fontSize:10,color:P.textMuted}}>년</span>
            </div>
            <div style={{textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:P.teal,fontFamily:"'Noto Serif KR',serif"}}>{ec}</div><div style={{fontSize:9,color:P.textMuted}}>사건</div></div>
            <button onClick={()=>setGate(true)} style={{padding:"6px 12px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>✓ 1단계 완성</button>
          </>}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px 4px 5px",border:`1px solid ${P.border}`,borderRadius:20,background:P.bg}}>
            {user.photoURL?<img src={user.photoURL} alt="" style={{width:22,height:22,borderRadius:"50%",objectFit:"cover"}}/>:
            <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${P.teal},${P.green})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{dn.charAt(0).toUpperCase()}</div>}
            <span style={{fontSize:11,fontWeight:600,color:P.text,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dn}</span>
            <button onClick={()=>signOut(auth)} style={{padding:"2px 7px",borderRadius:5,border:`1px solid ${P.border}`,background:"transparent",color:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:10,cursor:"pointer"}}>로그아웃</button>
          </div>
        </div>
      </header>

      {/* Section label */}
      <div style={{padding:"7px 20px",background:`${sc}08`,borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",gap:8}}>
        <span>{secInfo?.icon}</span>
        <span style={{fontSize:11,fontWeight:700,color:sc}}>{stage===1?"STEP 1 — 나의 복음 씨앗 찾기":"STEP 2 — 나의 복음 씨앗 심기"}</span>
        <span style={{fontSize:11,color:P.textMuted}}>/ {secInfo?.label}</span>
        {stage===2&&<div style={{marginLeft:"auto",fontSize:11,color:P.green,fontWeight:600}}>🔓 2단계 진행 중</div>}
      </div>

      <main style={{flex:1,overflowY:"auto"}}>{renderSec()}</main>
      {modal&&<EventModal cell={modal} onSave={saveCell} onDelete={delCell} onClose={()=>setModal(null)} birthYear={parsedBY}/>}
      {gate&&<LeaderGate onClose={()=>setGate(false)} onUnlock={()=>{setStage(2);setGate(false);setSec2("neighbormap");}}/>}
    </div>
  );
}

/* ─── ROOT ─── */
export default function App(){
  const[user,setUser]=useState(undefined);
  useEffect(()=>onAuthStateChanged(auth,u=>setUser(u||null)),[]);
  if(user===undefined)return<div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans KR',sans-serif"}}><style>{FONT}</style><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>🌱</div><div style={{fontSize:13,color:P.textMuted}}>불러오는 중…</div></div></div>;
  if(!user)return<AuthScreen/>;
  if(ADMIN_EMAILS.includes(user.email))return<AdminScreen user={user}/>;
  return<RoadMapApp user={user}/>;
}
