import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

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
const START_AGE=0,END_AGE=80,COL_W=58,LABEL_W=170,AGE_STEP=5;
const ROWS=[
  {id:"season",label:"시즌/인생터닝포인트",sub:"(사회 중요 이슈)",accent:"#C4902A",height:64},
  {id:"family",label:"가족",sub:"(이사,이별 등)",accent:"#C05A5A",height:56},
  {id:"faith",label:"신앙/교회",sub:"(회심,교회봉사,방황 등)",accent:"#7B5EA7",height:56},
  {id:"education",label:"교육",sub:"(학교,교육 등)",accent:"#C47A10",height:48},
  {id:"work",label:"일",sub:"(했던 일,성취,회사 등)",accent:"#2E7DAE",height:48},
  {id:"other",label:"기타",sub:"(이성교제,취미,문화생활 등)",accent:"#4A8A60",height:44},
];
const EVENT_COLORS=["#C4902A","#C05A5A","#7B5EA7","#C47A10","#2E7DAE","#4A8A60","#3BAAC0","#D4706A","#8B6FBA","#5A9E78"];
const P={
  bg:"var(--c-bg)",surface:"var(--c-surface)",border:"var(--c-border)",borderDark:"var(--c-borderDark)",
  text:"var(--c-text)",textSub:"var(--c-textSub)",textMuted:"var(--c-textMuted)",
  navy:"var(--c-navy)",brown:"var(--c-brown)",
  teal:"#4A8F7A",tealLight:"var(--c-tealLight)",tealDark:"#2E6B58",
  green:"#5A7A3A",greenLight:"var(--c-greenLight)",
  gold:"#C4902A",goldLight:"var(--c-goldLight)",
  purple:"#7B5EA7",purpleLight:"var(--c-purpleLight)",
  red:"#C05A5A",redLight:"var(--c-redLight)",
  blue:"#2E7DAE",blueLight:"var(--c-blueLight)",
  input:"var(--c-input)",shadow:"var(--c-shadow)",
};
const THEME_VARS=`
body{transition:background-color 0.3s ease;}
:root, .theme-light {
  --c-bg:#F8F6F1; --c-surface:#FFFFFF; --c-border:#E2DDD4; --c-borderDark:#C8C0B4;
  --c-text:#2A2118; --c-textSub:#5C5650; --c-textMuted:#9C968E;
  --c-navy:#3A2E1E; --c-brown:#6B4F2A;
  --c-tealLight:#E8F4F0; --c-greenLight:#EDF4E5; --c-goldLight:#FDF3E0;
  --c-purpleLight:#F0EBF8; --c-redLight:#FDF0F0; --c-blueLight:#E6F1FB;
  --c-input:#FAFAF8; --c-shadow:rgba(42,33,24,0.08);
  --c-panel:#F0EDE6; --c-panel2:#F5F0E5;
}
.theme-dark {
  --c-bg:#1A1714; --c-surface:#242019; --c-border:#3A342C; --c-borderDark:#4A4238;
  --c-text:#F0EBE2; --c-textSub:#C4BCAF; --c-textMuted:#8C8478;
  --c-navy:#F0EBE2; --c-brown:#D4A860;
  --c-tealLight:#1E3A32; --c-greenLight:#25301A; --c-goldLight:#3A2E14;
  --c-purpleLight:#2A2338; --c-redLight:#3A2020; --c-blueLight:#1A2E3A;
  --c-input:#2E2A22; --c-shadow:rgba(0,0,0,0.4);
  --c-panel:#2A2620; --c-panel2:#2E2921;
}
`;
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
const STEP3_SECTIONS=[
  {id:"report",label:"전체 리포트",icon:"📋"},
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
        <div style={{fontSize:18,fontWeight:700,color:P.text,lineHeight:1.4}}>{title}</div>
        {sub&&<div style={{fontSize:15,color:P.textMuted,marginTop:3,lineHeight:1.5}}>{sub}</div>}
      </div>
      <div style={{padding:"16px 18px"}}>{children}</div>
    </div>
  );
}
function TA({value,onChange,placeholder,rows=4,color=P.teal}){
  return(
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{width:"100%",padding:"11px 13px",border:`1px solid ${value?color+"55":P.border}`,borderRadius:9,fontSize:18,lineHeight:1.8,fontFamily:"'Noto Sans KR',sans-serif",background:value?`${color}04`:P.input,color:P.text,outline:"none",resize:"vertical",boxSizing:"border-box",transition:"border-color 0.2s"}}
      onFocus={e=>e.target.style.borderColor=`${color}80`} onBlur={e=>e.target.style.borderColor=value?`${color}55`:P.border}/>
  );
}

/* ─── AUTH ─── */
function AuthScreen(){
  const[mode,setMode]=useState("login"); // login | signup | reset
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");
  const[msg,setMsg]=useState("");
  const[email,setEmail]=useState("");
  const[pw,setPw]=useState("");
  const[name,setName]=useState("");
  const[region,setRegion]=useState("");
  const[phone,setPhone]=useState("");

  const errMsg=code=>{
    if(code?.includes("invalid-email"))return"이메일 형식이 올바르지 않습니다.";
    if(code?.includes("user-not-found"))return"등록되지 않은 이메일입니다. 가입을 먼저 해주세요.";
    if(code?.includes("wrong-password")||code?.includes("invalid-credential"))return"이메일 또는 비밀번호가 올바르지 않습니다.";
    if(code?.includes("email-already-in-use"))return"이미 가입된 이메일입니다. 로그인 해주세요.";
    if(code?.includes("weak-password"))return"비밀번호는 6자 이상이어야 합니다.";
    if(code?.includes("too-many-requests"))return"시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
    return"오류가 발생했습니다. 다시 시도해주세요.";
  };

  const googleLogin=async()=>{
    setBusy(true);setErr("");setMsg("");
    try{await signInWithPopup(auth,gProvider);}
    catch(e){setErr(errMsg(e.code));setBusy(false);}
  };

  const emailLogin=async()=>{
    if(!email.trim()||!pw){setErr("이메일과 비밀번호를 입력해주세요.");return;}
    setBusy(true);setErr("");setMsg("");
    try{await signInWithEmailAndPassword(auth,email.trim(),pw);}
    catch(e){setErr(errMsg(e.code));setBusy(false);}
  };

  const emailSignup=async()=>{
    if(!name.trim()){setErr("이름을 입력해주세요.");return;}
    if(!region.trim()){setErr("사는 지역을 입력해주세요.");return;}
    if(!email.trim()){setErr("이메일을 입력해주세요.");return;}
    if(!pw||pw.length<6){setErr("비밀번호는 6자 이상 입력해주세요.");return;}
    setBusy(true);setErr("");setMsg("");
    try{
      const cred=await createUserWithEmailAndPassword(auth,email.trim(),pw);
      await updateProfile(cred.user,{displayName:name.trim()});
      await setDoc(doc(db,"users",cred.user.uid),{
        name:name.trim(),region:region.trim(),email:email.trim(),
        phone:phone.trim()||null,createdAt:Date.now(),
      },{merge:true});
    }catch(e){setErr(errMsg(e.code));setBusy(false);}
  };

  const resetPw=async()=>{
    if(!email.trim()){setErr("가입한 이메일을 입력해주세요.");return;}
    setBusy(true);setErr("");setMsg("");
    try{
      await sendPasswordResetEmail(auth,email.trim());
      setMsg("비밀번호 재설정 이메일을 보냈습니다. 메일함을 확인해주세요.");
      setBusy(false);
    }catch(e){setErr(errMsg(e.code));setBusy(false);}
  };

  const inp={width:"100%",padding:"12px 14px",border:`1px solid ${P.border}`,borderRadius:10,fontSize:19,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none",boxSizing:"border-box",marginBottom:10,transition:"border-color 0.2s"};
  const label={fontSize:17,fontWeight:600,color:P.textSub,display:"block",marginBottom:5,textAlign:"left"};

  const GoogleBtn=(
    <button onClick={googleLogin} disabled={busy} style={{width:"100%",padding:13,borderRadius:12,border:`1px solid ${P.border}`,background:busy?"#f0f0f0":P.surface,color:P.text,fontSize:19,fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif",cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:`0 2px 8px ${P.shadow}`}}>
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Google 계정으로 {mode==="signup"?"시작하기":"로그인"}
    </button>
  );

  const Divider=(
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0"}}>
      <div style={{flex:1,height:1,background:P.border}}/>
      <span style={{fontSize:15,color:P.textMuted}}>또는</span>
      <div style={{flex:1,height:1,background:P.border}}/>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans KR',sans-serif",padding:20}}>
      <style>{`${FONT} input::placeholder{color:${P.textMuted};}`}</style>
      <div style={{background:P.surface,borderRadius:20,padding:"40px 40px 32px",width:"100%",maxWidth:440,textAlign:"center",boxShadow:`0 4px 40px ${P.shadow}`,border:`1px solid ${P.border}`}}>
        <div style={{fontSize:44,marginBottom:10}}>🌱</div>
        <div style={{fontSize:14,letterSpacing:3,color:P.textMuted,textTransform:"uppercase",marginBottom:5}}>일상 교회 개척 스쿨</div>
        <h1 style={{fontFamily:"'Noto Serif KR',serif",fontSize:20,fontWeight:700,color:P.navy,marginBottom:4,lineHeight:1.4}}>"교회로 살면 교회는 개척된다"</h1>
        <p style={{fontSize:17,color:P.textSub,lineHeight:1.7,marginBottom:22}}>나라는 교회 정체성을 찾고 복음 씨앗을 심는 훈련</p>

        {/* 모드 탭 */}
        {mode!=="reset"&&(
          <div style={{display:"flex",border:`1px solid ${P.border}`,borderRadius:12,overflow:"hidden",marginBottom:22}}>
            {[{id:"login",l:"로그인"},{id:"signup",l:"가입하기"}].map(t=>(
              <button key={t.id} onClick={()=>{setMode(t.id);setErr("");setMsg("");}} style={{flex:1,padding:"11px",border:"none",background:mode===t.id?P.tealLight:"transparent",color:mode===t.id?P.tealDark:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:19,fontWeight:mode===t.id?700:400,cursor:"pointer",transition:"all 0.15s"}}>{t.l}</button>
            ))}
          </div>
        )}

        {err&&<div style={{marginBottom:12,padding:"9px 14px",borderRadius:8,background:"#fff5f5",color:P.red,fontSize:19.5,border:`1px solid ${P.red}30`,lineHeight:1.6}}>{err}</div>}
        {msg&&<div style={{marginBottom:12,padding:"9px 14px",borderRadius:8,background:P.tealLight,color:P.tealDark,fontSize:19.5,border:`1px solid ${P.teal}30`,lineHeight:1.6}}>{msg}</div>}

        {/* ═══ 로그인 모드 ═══ */}
        {mode==="login"&&(
          <div>
            <label style={label}>이메일</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" style={inp}/>
            <label style={label}>비밀번호</label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)emailLogin();}} placeholder="비밀번호 입력" style={inp}/>
            <button onClick={emailLogin} disabled={busy} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:busy?P.border:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontSize:19,fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif",cursor:busy?"not-allowed":"pointer",marginTop:4}}>{busy?"로그인 중…":"이메일로 로그인"}</button>
            <button onClick={()=>{setMode("reset");setErr("");setMsg("");}} style={{background:"none",border:"none",color:P.textMuted,fontSize:17,cursor:"pointer",textDecoration:"underline",fontFamily:"inherit",marginTop:12}}>비밀번호를 잊으셨나요?</button>
            {Divider}
            {GoogleBtn}
            <p style={{fontSize:17,color:P.textSub,marginTop:18}}>계정이 없으신가요? <button onClick={()=>{setMode("signup");setErr("");setMsg("");}} style={{background:"none",border:"none",color:P.teal,fontWeight:700,fontSize:17,cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>가입하기</button></p>
          </div>
        )}

        {/* ═══ 가입 모드 ═══ */}
        {mode==="signup"&&(
          <div>
            <label style={label}>이름 <span style={{color:P.red}}>*</span></label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" style={inp}/>
            <label style={label}>사는 지역 <span style={{color:P.red}}>*</span></label>
            <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="예: 서울 강남구, LA, 시드니…" style={inp}/>
            <label style={label}>이메일 <span style={{color:P.red}}>*</span></label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" style={inp}/>
            <label style={label}>전화번호 <span style={{fontWeight:400,color:P.textMuted}}>(선택)</span></label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000" style={inp}/>
            <label style={label}>비밀번호 <span style={{color:P.red}}>*</span> <span style={{fontWeight:400,color:P.textMuted}}>(6자 이상)</span></label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)emailSignup();}} placeholder="비밀번호 입력" style={inp}/>
            <button onClick={emailSignup} disabled={busy} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:busy?P.border:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontSize:19,fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif",cursor:busy?"not-allowed":"pointer",marginTop:4}}>{busy?"가입 중…":"가입하고 시작하기"}</button>
            {Divider}
            {GoogleBtn}
            <p style={{fontSize:17,color:P.textSub,marginTop:18}}>이미 계정이 있으신가요? <button onClick={()=>{setMode("login");setErr("");setMsg("");}} style={{background:"none",border:"none",color:P.teal,fontWeight:700,fontSize:17,cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>로그인</button></p>
          </div>
        )}

        {/* ═══ 비밀번호 재설정 ═══ */}
        {mode==="reset"&&(
          <div>
            <div style={{fontSize:19,fontWeight:700,color:P.navy,marginBottom:6}}>비밀번호 재설정</div>
            <p style={{fontSize:17,color:P.textSub,lineHeight:1.7,marginBottom:16}}>가입한 이메일을 입력하시면<br/>재설정 링크를 보내드립니다</p>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)resetPw();}} placeholder="example@email.com" style={inp}/>
            <button onClick={resetPw} disabled={busy} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:busy?P.border:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontSize:19,fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif",cursor:busy?"not-allowed":"pointer"}}>{busy?"전송 중…":"재설정 이메일 보내기"}</button>
            <button onClick={()=>{setMode("login");setErr("");setMsg("");}} style={{background:"none",border:"none",color:P.textMuted,fontSize:17,cursor:"pointer",textDecoration:"underline",fontFamily:"inherit",marginTop:14}}>← 로그인으로 돌아가기</button>
          </div>
        )}

        <p style={{fontSize:15,color:P.textMuted,marginTop:20,lineHeight:1.7}}>본인의 데이터만 접근 가능하며 타인은 볼 수 없습니다</p>
        <div style={{marginTop:14,display:"flex",justifyContent:"center"}}><ThemeToggle/></div>
      </div>
    </div>
  );
}

/* ─── GRID ─── */
function GridCell({cell,rowHeight,onCellClick}){
  const[hov,setHov]=useState(false);
  const dateStr=cell?[cell.dateY,cell.dateM?.padStart(2,"0"),cell.dateD?.padStart(2,"0")].filter(Boolean).join("."):"";
  const allLines=cell?.text?cell.text.split("\n").filter(Boolean):[];
  const title=allLines[0]||"";        // 첫 줄 = 제목
  const hasMore=allLines.length>1||title.length>6;  // 더 볼 내용이 있는지
  return(
    <div onClick={onCellClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:COL_W,minWidth:COL_W,minHeight:rowHeight,borderLeft:`1px solid ${hov?P.borderDark:P.border}`,background:cell?.text?(hov?`${cell.color}44`:`${cell.color}1E`):(hov?`${P.teal}10`:"transparent"),cursor:"pointer",position:"relative",overflow:"visible",transition:"background 0.12s"}}>
      {/* 셀 안: 제목만 */}
      {cell?.text&&<div style={{position:"absolute",top:3,left:2,right:2,background:`${cell.color}EE`,borderRadius:4,padding:"3px 4px",color:"#fff",lineHeight:1.3,overflow:"hidden",maxHeight:rowHeight-8,boxShadow:"0 2px 6px rgba(0,0,0,0.18)",zIndex:1}}>
        <div style={{fontSize:11.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
      </div>}
      {/* 호버 툴팁: 날짜 + 전체 내용 */}
      {cell?.text&&hov&&<div style={{position:"absolute",top:rowHeight-2,left:0,minWidth:180,maxWidth:280,background:P.surface,border:`2px solid ${cell.color}`,borderRadius:10,padding:"10px 13px",boxShadow:`0 8px 28px rgba(0,0,0,0.25)`,zIndex:1000,pointerEvents:"none",whiteSpace:"normal"}}>
        {dateStr&&<div style={{fontSize:12,color:cell.color,fontWeight:700,marginBottom:5,letterSpacing:0.5}}>📅 {dateStr}</div>}
        <div style={{fontSize:14,color:P.text,lineHeight:1.7,wordBreak:"break-word"}}>
          {allLines.map((l,i)=><div key={i} style={{marginBottom:i<allLines.length-1?3:0,fontWeight:i===0?700:400}}>{l}</div>)}
        </div>
      </div>}
      {!cell?.text&&hov&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:19,color:P.teal,opacity:0.6,pointerEvents:"none"}}>+</div>}
    </div>
  );
}

function GridTimeline({cells,onCellClick,onAgeClick,birthYear}){
  const hasYear=birthYear&&birthYear>=1900&&birthYear<=2100;
  // 출생연도가 있으면 현재 나이까지만 표시 (한국 나이 기준: 현재연도 - 출생연도 + 1)
  const curYear=new Date().getFullYear();
  const currentAge=hasYear?Math.min(END_AGE,Math.max(5,curYear-birthYear+1)):END_AGE;
  const maxAge=hasYear?currentAge:END_AGE;
  const ages=Array.from({length:maxAge-START_AGE+1},(_,i)=>START_AGE+i);
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
        <div style={{display:"flex",alignItems:"stretch",borderTop:`2px solid ${P.navy}`,borderBottom:`1px solid ${P.border}`,background:"var(--c-panel)"}}>
          <div style={{width:LABEL_W,minWidth:LABEL_W,padding:"6px 16px 6px 0",display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:15,fontWeight:700,color:P.navy,letterSpacing:2}}>나이</div>
          <div style={{display:"flex",flex:1}}>
            {ages.map(age=>hdrC(age,(a,isMajor,isEarly)=>
              isMajor?<span style={{fontSize:15,fontWeight:700,color:isEarly?P.teal:P.navy,pointerEvents:"none"}}>{a}</span>
              :<span style={{fontSize:12,opacity:0.45,color:isEarly?P.teal:P.navy,pointerEvents:"none"}}>{a}</span>
            ,"6px 0"))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"stretch",borderBottom:`2px solid ${P.navy}`,background:"var(--c-panel2)"}}>
          <div style={{width:LABEL_W,minWidth:LABEL_W,padding:"4px 16px 4px 0",display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:14,fontWeight:600,color:P.gold,letterSpacing:1.5}}>연도</div>
          <div style={{display:"flex",flex:1}}>
            {ages.map(age=>hdrC(age,(a,isMajor,isEarly)=>{
              const yr=hasYear?birthYear+a-1:null;
              return isMajor?<span style={{fontSize:13,fontWeight:600,color:yr?(isEarly?P.teal:P.gold):P.textMuted,opacity:yr?1:0.35,pointerEvents:"none"}}>{yr??"—"}</span>
              :<span style={{fontSize:12,color:yr?(isEarly?P.teal:P.gold):P.textMuted,opacity:yr?0.5:0.25,pointerEvents:"none"}}>{yr??"—"}</span>;
            },"4px 0"))}
          </div>
        </div>
        {ROWS.map((row,ri)=>(
          <div key={row.id} style={{display:"flex",alignItems:"stretch",borderBottom:`1px solid ${P.border}`,background:ri%2===0?P.surface:`${P.bg}99`}}>
            <div style={{width:LABEL_W,minWidth:LABEL_W,padding:"0 16px 0 0",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:7,minHeight:row.height}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:600,color:P.textSub}}>{row.label}</div>
                {row.sub&&<div style={{fontSize:13,color:P.textMuted,lineHeight:1.3}}>{row.sub}</div>}
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
  const inp={background:P.input,border:`1px solid ${P.border}`,borderRadius:8,padding:"8px 11px",color:P.text,fontSize:18,fontFamily:"'Noto Sans KR',sans-serif",outline:"none",width:"100%",transition:"border-color 0.2s",boxSizing:"border-box"};
  const insertBullet=()=>{const ta=taRef.current;if(!ta)return;const s=ta.selectionStart,v=ta.value,ls=v.lastIndexOf("\n",s-1)+1,le=v.indexOf("\n",s),line=v.substring(ls,le===-1?v.length:le);let nv,c;if(line.startsWith("• ")){nv=v.slice(0,ls)+line.slice(2)+v.slice(le===-1?v.length:le);c=Math.max(ls,s-2);}else{nv=v.slice(0,ls)+"• "+v.slice(ls);c=s+2;}setText(nv);setTimeout(()=>{ta.selectionStart=ta.selectionEnd=c;ta.focus();},0);};
  const hkd=e=>{if(e.key==="Enter"){const ta=taRef.current,s=ta.selectionStart,v=ta.value,ls=v.lastIndexOf("\n",s-1)+1;if(v.substring(ls,s).startsWith("• ")){e.preventDefault();const nv=v.slice(0,s)+"\n• "+v.slice(s);setText(nv);setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+3;},0);}}};
  const handleSave=()=>{const rid=selRow?.id||cell.rowId;if(!rid)return;onSave({text,color,dateY:dateY.trim(),dateM:dateM.trim(),dateD:dateD.trim(),rowId:rid});};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(42,33,24,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:P.surface,borderRadius:16,borderTop:`3px solid ${accent}`,padding:24,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(42,33,24,0.2)",fontFamily:"'Noto Sans KR',sans-serif",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontSize:19,fontWeight:700,color:P.text}}>{isNew?"✨ 새 사건 추가":"✏️ 사건 편집"}</div>
          <div style={{padding:"3px 10px",borderRadius:20,fontSize:17,background:`${accent}18`,color:accent,fontWeight:600}}>{cell.age}세{yr?` · ${yr}년`:""}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:15,color:P.textMuted,fontWeight:600,letterSpacing:0.5,marginBottom:8}}>📂 카테고리{isNew&&<span style={{color:P.red}}> *</span>}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {ROWS.map(row=>{const active=selRow?.id===row.id;return(
              <button key={row.id} onClick={()=>{setSelRow(row);if(!cell.color)setColor(row.accent);}} style={{padding:"5px 11px",borderRadius:20,cursor:"pointer",border:`1.5px solid ${active?row.accent:P.border}`,background:active?`${row.accent}18`:"transparent",color:active?row.accent:P.textSub,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,fontWeight:active?700:400,display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:6,height:6,borderRadius:1,background:active?row.accent:P.border,flexShrink:0}}/>{row.label}
              </button>
            );})}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontSize:15,color:P.textMuted,fontWeight:600}}>✍️ 내용</div>
            <div style={{display:"flex",gap:5}}>
              {[{l:"• 글머리",f:insertBullet},{l:"지우기",f:()=>setText("")}].map(b=><button key={b.l} onClick={b.f} style={{padding:"3px 8px",borderRadius:5,cursor:"pointer",border:`1px solid ${P.border}`,background:P.input,color:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15}}>{b.l}</button>)}
            </div>
          </div>
          <textarea ref={taRef} autoFocus value={text} onChange={e=>setText(e.target.value)} onKeyDown={hkd} placeholder={"이 시기에 있었던 일을 적어주세요…"} rows={5} style={{...inp,resize:"vertical",lineHeight:1.8}}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:15,color:P.textMuted,fontWeight:600,marginBottom:7}}>📅 날짜 <span style={{fontWeight:400,opacity:0.6}}>(선택)</span></div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input type="number" placeholder="연도" min="1900" max="2100" value={dateY} onChange={e=>setDateY(e.target.value)} style={{...inp,textAlign:"center",flex:"2 1 0"}}/>
            <span style={{color:P.textMuted,fontSize:17,flexShrink:0}}>년</span>
            <input type="number" placeholder="월" min="1" max="12" value={dateM} onChange={e=>setDateM(e.target.value)} style={{...inp,textAlign:"center",flex:"1 1 0"}}/>
            <span style={{color:P.textMuted,fontSize:17,flexShrink:0}}>월</span>
            <input type="number" placeholder="일" min="1" max="31" value={dateD} onChange={e=>setDateD(e.target.value)} style={{...inp,textAlign:"center",flex:"1 1 0"}}/>
            <span style={{color:P.textMuted,fontSize:17,flexShrink:0}}>일</span>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:15,color:P.textMuted,fontWeight:600,marginBottom:7}}>🎨 색상</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {EVENT_COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${color===c?"#333":"transparent"}`,transition:"all 0.15s"}}/>)}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleSave} disabled={isNew&&!selRow} style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:(isNew&&!selRow)?P.border:`linear-gradient(135deg,${accent},${accent}BB)`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:18,fontWeight:700,cursor:(isNew&&!selRow)?"not-allowed":"pointer"}}>{isNew?"추가하기":"저장"}</button>
          {cell.text&&<button onClick={onDelete} style={{padding:"11px 14px",borderRadius:9,border:`1px solid ${P.red}40`,background:`${P.red}10`,color:P.red,fontFamily:"'Noto Sans KR',sans-serif",fontSize:18,cursor:"pointer"}}>삭제</button>}
          <button onClick={onClose} style={{padding:"11px 14px",borderRadius:9,border:`1px solid ${P.border}`,background:"transparent",color:P.textSub,fontFamily:"'Noto Sans KR',sans-serif",fontSize:18,cursor:"pointer"}}>취소</button>
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
              <div style={{fontSize:15,color:P.textMuted,marginBottom:6,fontWeight:600}}>Before — 복음 이전의 삶의 모습</div>
              <TA value={data.gospel_before} onChange={v=>onChange("gospel_before",v)} placeholder="복음을 만나기 전 나의 삶…" rows={5}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0}}>
              <div style={{width:1,height:30,background:P.border}}/>
              <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${P.teal},${P.green})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700,textAlign:"center",lineHeight:1.2}}>복음</div>
              <div style={{width:1,height:30,background:P.border}}/>
            </div>
            <div>
              <div style={{fontSize:15,color:P.textMuted,marginBottom:6,fontWeight:600}}>After — 복음 이후의 달라진 삶의 모습</div>
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
  const cs={padding:"7px 10px",border:"none",background:"transparent",color:P.text,fontSize:17,fontFamily:"'Noto Sans KR',sans-serif",outline:"none",width:"100%",boxSizing:"border-box"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <Card title="Q. 나의 삶에 영향을 준 사람은 누구입니까?" sub="영적, 정서적, 사회적, 경제적, 지성적, 육체적 등" color={P.teal}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:17}}>
            <thead><tr>
              {["사람","소속/시기","영향 받은 것"].map((h,i)=><th key={h} style={{padding:"8px 10px",background:"var(--c-panel)",textAlign:"left",fontWeight:600,color:P.textSub,borderBottom:`2px solid ${P.border}`,width:i===0?"20%":i===1?"25%":"55%"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {people.map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`}}>
                <td><input value={p.name||""} onChange={e=>updateP(i,"name",e.target.value)} placeholder="이름" style={cs}/></td>
                <td style={{borderLeft:`1px solid ${P.border}`}}><input value={p.belong||""} onChange={e=>updateP(i,"belong",e.target.value)} placeholder="소속/시기" style={cs}/></td>
                <td style={{borderLeft:`1px solid ${P.border}`}}><input value={p.influence||""} onChange={e=>updateP(i,"influence",e.target.value)} placeholder="어떤 영향을 받았나요?" style={cs}/></td>
              </tr>)}
            </tbody>
          </table>
          <button onClick={addRow} style={{marginTop:8,padding:"6px 14px",borderRadius:7,border:`1px solid ${P.teal}60`,background:P.tealLight,color:P.tealDark,fontFamily:"'Noto Sans KR',sans-serif",fontSize:17,cursor:"pointer"}}>+ 행 추가</button>
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
          <div style={{fontSize:15,color:P.textMuted,margin:"10px 0 5px",fontWeight:600}}>이 경험을 통한 인사이트는?</div>
          <TA value={data.ev_grat_i} onChange={v=>onChange("ev_grat_i",v)} placeholder="이 경험에서 발견한 것…" rows={3}/>
        </Card>
        <Card title="어려움, 실패의 경험을 적어보세요" color={P.red}>
          <TA value={data.ev_str} onChange={v=>onChange("ev_str",v)} placeholder="힘들었던 시간들, 실패의 경험들…" rows={4} color={P.red}/>
          <div style={{fontSize:15,color:P.textMuted,margin:"10px 0 5px",fontWeight:600}}>이 경험을 통한 인사이트는?</div>
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
  const[drag,setDrag]=useState(null);
  const[resize,setResize]=useState(null);
  const canvasRef=useRef(null);
  const colors=["#4A8F7A","#C4902A","#2E7DAE","#C05A5A","#7B5EA7","#4A8A60","#C47A10","#3BAAC0"];

  const add=()=>{
    if(!newLabel.trim())return;
    const canvas=canvasRef.current;
    const w=canvas?canvas.offsetWidth:500;
    const h=canvas?canvas.offsetHeight:400;
    const size=90;
    const x=Math.random()*(w-size-20)+10;
    const y=Math.random()*(h-size-20)+10;
    onChange("circles",[...circles,{id:Date.now(),label:newLabel.trim(),color:colors[circles.length%colors.length],size,x,y}]);
    setNewLabel("");
  };

  const remove=id=>onChange("circles",circles.filter(c=>c.id!==id));
  const updateC=(id,upd)=>onChange("circles",circles.map(c=>c.id===id?{...c,...upd}:c));
  const bringToFront=id=>{const c=circles.find(x=>x.id===id);if(!c)return;onChange("circles",[...circles.filter(x=>x.id!==id),c]);};

  /* "나" 원 위치/크기 */
  const meX=data.me_x??20;
  const meY=data.me_y??20;
  const meSize=data.me_size??70;

  const onMouseDownDrag=(e,id)=>{
    e.preventDefault();
    if(id==="me"){setDrag({id:"me",startX:e.clientX,startY:e.clientY,origX:meX,origY:meY});return;}
    const c=circles.find(x=>x.id===id);
    bringToFront(id);
    setDrag({id,startX:e.clientX,startY:e.clientY,origX:c.x||0,origY:c.y||0});
  };
  const onMouseDownResize=(e,id)=>{
    e.preventDefault();e.stopPropagation();
    if(id==="me"){setResize({id:"me",startX:e.clientX,startY:e.clientY,origSize:meSize});return;}
    const c=circles.find(x=>x.id===id);
    setResize({id,startX:e.clientX,startY:e.clientY,origSize:c.size||90});
  };

  // Touch support
  const onTouchStartDrag=(e,id)=>{
    const t=e.touches[0];
    if(id==="me"){setDrag({id:"me",startX:t.clientX,startY:t.clientY,origX:meX,origY:meY});return;}
    const c=circles.find(x=>x.id===id);
    bringToFront(id);
    setDrag({id,startX:t.clientX,startY:t.clientY,origX:c.x||0,origY:c.y||0});
  };
  const onTouchStartResize=(e,id)=>{
    e.stopPropagation();
    const t=e.touches[0];
    if(id==="me"){setResize({id:"me",startX:t.clientX,startY:t.clientY,origSize:meSize});return;}
    const c=circles.find(x=>x.id===id);
    setResize({id,startX:t.clientX,startY:t.clientY,origSize:c.size||90});
  };

  useEffect(()=>{
    const move=e=>{
      const cx=e.clientX??e.touches?.[0]?.clientX;
      const cy=e.clientY??e.touches?.[0]?.clientY;
      if(drag){
        const dx=cx-drag.startX,dy=cy-drag.startY;
        const canvas=canvasRef.current;
        const w=canvas?canvas.offsetWidth:500;
        const h=canvas?canvas.offsetHeight:400;
        if(drag.id==="me"){
          const nx=Math.max(0,Math.min(w-meSize,drag.origX+dx));
          const ny=Math.max(0,Math.min(h-meSize,drag.origY+dy));
          onChange("me_x",nx);onChange("me_y",ny);
        }else{
          const c=circles.find(x=>x.id===drag.id);
          const size=c?.size||90;
          const nx=Math.max(0,Math.min(w-size,drag.origX+dx));
          const ny=Math.max(0,Math.min(h-size,drag.origY+dy));
          updateC(drag.id,{x:nx,y:ny});
        }
      }
      if(resize){
        const dx=cx-resize.startX,dy=cy-resize.startY;
        const delta=(dx+dy)/2;
        const ns=Math.max(50,Math.min(220,resize.origSize+delta));
        if(resize.id==="me")onChange("me_size",ns);
        else updateC(resize.id,{size:ns});
      }
    };
    const up=()=>{setDrag(null);setResize(null);};
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    window.addEventListener("touchmove",move,{passive:true});
    window.addEventListener("touchend",up);
    return()=>{
      window.removeEventListener("mousemove",move);
      window.removeEventListener("mouseup",up);
      window.removeEventListener("touchmove",move);
      window.removeEventListener("touchend",up);
    };
  },[drag,resize,circles,meX,meY,meSize]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card title="삶의 복음 일상 이웃 MAP" sub="공동체를 추가하고 드래그로 위치를 옮기고 ↘ 핸들로 크기를 조절해보세요" color={P.teal}>
        {/* 입력 */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)add();}} placeholder="공동체 이름 입력 (예: 우리 가족, 직장 동료, 이웃 모임…)" style={{flex:1,padding:"9px 14px",border:`1px solid ${P.border}`,borderRadius:9,fontSize:18,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none"}}/>
          <button onClick={add} style={{padding:"9px 18px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:18,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>추가</button>
        </div>
        {/* 안내 */}
        <div style={{display:"flex",gap:12,marginBottom:10,flexWrap:"wrap"}}>
          {[["🖱 드래그","'나'와 모든 원을 이동"],["↘ 핸들","오른쪽 아래로 크기 조절"],["원 겹치기","자유롭게 겹쳐서 관계 표현"]].map(([ic,t])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:5,fontSize:15,color:P.textMuted}}>
              <span style={{fontWeight:600,color:P.tealDark}}>{ic}</span><span>{t}</span>
            </div>
          ))}
        </div>
        {/* 캔버스 */}
        <div ref={canvasRef} style={{position:"relative",width:"100%",height:420,background:"var(--c-panel)",borderRadius:16,border:`2px solid ${P.borderDark}`,overflow:"hidden",userSelect:"none"}}>
          {/* 배경 힌트 */}
          {circles.length===0&&(
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,pointerEvents:"none"}}>
              <div style={{fontSize:32,opacity:0.3}}>🌏</div>
              <div style={{fontSize:18,color:P.textMuted,textAlign:"center",lineHeight:1.8}}>위에서 공동체를 추가하면<br/>여기에 나타납니다</div>
            </div>
          )}
          {/* 기본 원: 나 (드래그 이동 + 크기 조절 가능) */}
          <div style={{position:"absolute",left:meX,top:meY,width:meSize,height:meSize,borderRadius:"50%",border:`2.5px dashed ${P.tealDark}`,background:`${P.teal}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.max(11,Math.min(16,meSize/5)),fontWeight:700,color:P.tealDark,cursor:drag?.id==="me"?"grabbing":"grab",boxShadow:drag?.id==="me"||resize?.id==="me"?`0 8px 24px ${P.teal}50`:`0 2px 8px ${P.teal}30`,zIndex:drag?.id==="me"||resize?.id==="me"?100:9,transition:drag?.id==="me"||resize?.id==="me"?"none":"box-shadow 0.2s",userSelect:"none"}}
            onMouseDown={e=>onMouseDownDrag(e,"me")}
            onTouchStart={e=>onTouchStartDrag(e,"me")}>
            <span style={{pointerEvents:"none"}}>나</span>
            {/* 크기 조절 핸들 */}
            <div onMouseDown={e=>onMouseDownResize(e,"me")} onTouchStart={e=>onTouchStartResize(e,"me")}
              style={{position:"absolute",bottom:-2,right:-2,width:16,height:16,cursor:"se-resize",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 10 L10 2 M6 10 L10 6" stroke={P.tealDark} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          {/* 동그라미들 */}
          {circles.map((c,idx)=>{
            const x=c.x??50+idx*30;
            const y=c.y??50+idx*20;
            const size=c.size||90;
            const isDragging=drag?.id===c.id;
            const isResizing=resize?.id===c.id;
            return(
              <div key={c.id} style={{position:"absolute",left:x,top:y,width:size,height:size,borderRadius:"50%",background:`${c.color}30`,border:`2.5px solid ${c.color}80`,display:"flex",alignItems:"center",justifyContent:"center",cursor:isDragging?"grabbing":"grab",boxShadow:isDragging||isResizing?`0 8px 24px ${c.color}50`:`0 2px 8px ${c.color}30`,zIndex:isDragging||isResizing?100:10+idx,transition:isDragging||isResizing?"none":"box-shadow 0.2s"}}
                onMouseDown={e=>onMouseDownDrag(e,c.id)}
                onTouchStart={e=>onTouchStartDrag(e,c.id)}>
                {/* 라벨 */}
                <span style={{fontSize:Math.max(9,Math.min(13,size/8)),color:c.color,fontWeight:700,textAlign:"center",padding:"0 6px",lineHeight:1.3,pointerEvents:"none",wordBreak:"keep-all"}}>{c.label}</span>
                {/* 삭제 버튼 */}
                <button onMouseDown={e=>{e.stopPropagation();}} onClick={()=>remove(c.id)} style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",border:"none",background:P.red,color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,zIndex:20,lineHeight:1}}>×</button>
                {/* 크기 조절 핸들 (오른쪽 아래) */}
                <div onMouseDown={e=>onMouseDownResize(e,c.id)} onTouchStart={e=>onTouchStartResize(e,c.id)}
                  style={{position:"absolute",bottom:-2,right:-2,width:16,height:16,cursor:"se-resize",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M2 10 L10 2 M6 10 L10 6 M10 10 L10 10" stroke={c.color} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
        {/* 추가된 목록 */}
        {circles.length>0&&(
          <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
            {circles.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:`${c.color}18`,border:`1px solid ${c.color}40`,fontSize:15,color:c.color,fontWeight:600}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0}}/>
                {c.label}
                <button onClick={()=>remove(c.id)} style={{background:"none",border:"none",color:c.color,cursor:"pointer",fontSize:17,padding:0,lineHeight:1,opacity:0.6}}>×</button>
              </div>
            ))}
          </div>
        )}
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
              <div style={{fontSize:14,fontWeight:700,color:P.green,marginBottom:8,borderBottom:`1px solid ${P.border}`,paddingBottom:5}}>{cat}</div>
              {items.map(item=>{
                const k=`${cat}__${item}`,isC=checked[k],isCustom=item.endsWith(":");
                if(isCustom)return(
                  <div key={item} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                    <span style={{fontSize:14,color:P.textMuted,whiteSpace:"nowrap"}}>{item}</span>
                    <input value={data[`nc_c_${cat}`]||""} onChange={e=>onChange(`nc_c_${cat}`,e.target.value)} style={{flex:1,padding:"2px 5px",border:`1px solid ${P.border}`,borderRadius:4,fontSize:14,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none"}}/>
                  </div>
                );
                return(
                  <div key={item} onClick={()=>toggle(cat,item)} style={{display:"flex",alignItems:"center",gap:6,padding:"2px 0",cursor:"pointer"}}>
                    <div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${isC?P.green:P.border}`,background:isC?P.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                      {isC&&<div style={{width:4,height:4,borderRadius:"50%",background:"#fff"}}/>}
                    </div>
                    <span style={{fontSize:14,color:isC?P.green:P.textSub,fontWeight:isC?600:400}}>{item}</span>
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
              <div style={{fontSize:13,fontWeight:700,color:P.tealDark,marginBottom:7,lineHeight:1.4,borderBottom:`1px solid ${P.border}`,paddingBottom:4}}>{cat}</div>
              {verbs.map(v=>{const k=`${cat}__${v}`,isC=checked[k];return(
                <div key={v} onClick={()=>toggle(cat,v)} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0",cursor:"pointer"}}>
                  <div style={{width:11,height:11,borderRadius:2,border:`1.5px solid ${isC?P.teal:P.border}`,background:isC?P.teal:"transparent",flexShrink:0,transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isC&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:14,color:isC?P.tealDark:P.textSub,fontWeight:isC?600:400}}>{v}</span>
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
  const cs={padding:"7px 10px",border:"none",background:"transparent",color:P.text,fontSize:17,fontFamily:"'Noto Sans KR',sans-serif",outline:"none",width:"100%",boxSizing:"border-box"};
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
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:17}}>
            <thead><tr>
              {["훈련자명","교회 이름","기도 내용"].map((h,i)=><th key={h} style={{padding:"8px 10px",background:"var(--c-panel)",textAlign:"left",fontWeight:600,color:P.textSub,borderBottom:`2px solid ${P.border}`,width:i===0?"20%":i===1?"30%":"50%"}}>{h}</th>)}
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

/* ─── STEP 3: 전체 리포트 ─── */
function RSection({num,title,color,children}){
  return(
    <div style={{marginBottom:26,pageBreakInside:"avoid"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,borderBottom:`2px solid ${color}`,paddingBottom:6,marginBottom:12}}>
        <span style={{fontSize:15,fontWeight:700,color:"#fff",background:color,borderRadius:5,padding:"3px 9px",letterSpacing:0.5}}>{num}</span>
        <span style={{fontSize:20,fontWeight:700,color:P.navy,fontFamily:"'Noto Serif KR',serif"}}>{title}</span>
      </div>
      {children}
    </div>
  );
}
function RField({label,value,color=P.teal}){
  if(!value||!String(value).trim())return null;
  return(
    <div style={{marginBottom:10}}>
      <div style={{fontSize:15,fontWeight:700,color,marginBottom:4}}>{label}</div>
      <div style={{fontSize:19.5,color:P.text,lineHeight:1.9,whiteSpace:"pre-wrap",background:"var(--c-input)",borderRadius:8,padding:"10px 13px",border:`1px solid ${P.border}`}}>{value}</div>
    </div>
  );
}
function ReportSection({user,by,s1,s2}){
  const parsedBY=parseInt(by)||null;
  const cells=s1.cells||{};
  const dn=user.displayName||user.email||"";
  const today=new Date();
  const dateStr=`${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;

  /* 로드맵 사건 수집 (나이순) */
  const events=[];
  Object.entries(cells).forEach(([key,cell])=>{
    if(!cell?.text)return;
    const us=key.lastIndexOf("_");
    const rowId=key.slice(0,us),age=parseInt(key.slice(us+1));
    const row=ROWS.find(r=>r.id===rowId);
    events.push({age,rowLabel:row?.label||rowId,accent:row?.accent||P.teal,color:cell.color,text:cell.text,dateY:cell.dateY,dateM:cell.dateM});
  });
  events.sort((a,b)=>a.age-b.age);

  /* 체크 항목 수집 */
  const verbs=Object.entries(s2.verb_checked||{}).filter(([,v])=>v).map(([k])=>k.split("__")[1]);
  const ncChecks={};
  Object.entries(s2.nc_checked||{}).filter(([,v])=>v).forEach(([k])=>{
    const[cat,item]=k.split("__");
    if(!ncChecks[cat])ncChecks[cat]=[];
    ncChecks[cat].push(item);
  });
  const circles=s2.circles||[];
  const partners=(s2.partners||[]).filter(p=>p?.trainer||p?.church||p?.content);
  const people=(s1.people_table||[]).filter(p=>p?.name||p?.belong||p?.influence);

  const churchName=s2.plant_name||"";

  return(
    <div>
      {/* 인쇄 버튼 (인쇄시 숨김) */}
      <div className="no-print" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{fontSize:17,color:P.textMuted,lineHeight:1.7}}>
          💡 아래 리포트를 <strong>인쇄</strong>하거나 <strong>PDF로 저장</strong>할 수 있어요.<br/>
          인쇄 대화상자에서 "PDF로 저장"을 선택하면 파일로 보관됩니다.
        </div>
        <button onClick={()=>window.print()} style={{padding:"11px 24px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${P.gold},#8B5E1A)`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:19,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 14px ${P.gold}50`,whiteSpace:"nowrap"}}>🖨 인쇄 / PDF 저장</button>
      </div>

      {/* ══ 리포트 본문 ══ */}
      <div id="print-report" style={{background:P.surface,borderRadius:16,border:`1px solid ${P.border}`,padding:"36px 40px",maxWidth:800,margin:"0 auto",boxShadow:`0 4px 24px ${P.shadow}`}}>

        {/* 표지 헤더 */}
        <div style={{textAlign:"center",borderBottom:`3px double ${P.navy}`,paddingBottom:24,marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:8}}>🌱</div>
          <div style={{fontSize:14,letterSpacing:4,color:P.textMuted,textTransform:"uppercase",marginBottom:6}}>일상 교회 개척 스쿨</div>
          <h1 style={{fontFamily:"'Noto Serif KR',serif",fontSize:26,fontWeight:700,color:P.navy,marginBottom:4}}>나의 복음 씨앗 리포트</h1>
          <div style={{fontSize:17,color:P.textSub,fontStyle:"italic",marginBottom:16}}>"교회로 살면 교회는 개척된다"</div>
          <div style={{display:"flex",justifyContent:"center",gap:24,fontSize:17,color:P.textSub}}>
            <span><strong style={{color:P.navy}}>작성자</strong> {dn}</span>
            {parsedBY&&<span><strong style={{color:P.navy}}>출생연도</strong> {parsedBY}년</span>}
            <span><strong style={{color:P.navy}}>작성일</strong> {dateStr}</span>
          </div>
          {churchName&&(
            <div style={{marginTop:18,padding:"14px 20px",background:`linear-gradient(135deg,${P.tealLight},${P.goldLight})`,borderRadius:12,border:`1px solid ${P.teal}30`}}>
              <div style={{fontSize:14,color:P.tealDark,fontWeight:700,letterSpacing:2,marginBottom:4}}>MY CHURCH</div>
              <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:24,fontWeight:700,color:P.navy}}>{churchName}</div>
            </div>
          )}
        </div>

        {/* STEP 1 라벨 */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <span style={{display:"inline-block",padding:"5px 18px",borderRadius:20,background:P.tealLight,color:P.tealDark,fontSize:17,fontWeight:700,letterSpacing:1}}>STEP 1 — 나의 복음 씨앗 찾기</span>
        </div>

        {/* 1-1 인생 로드맵 */}
        <RSection num="1-1" title="삶의 기초 · 인생 Road Map" color={P.teal}>
          {events.length===0?<div style={{fontSize:17,color:P.textMuted,fontStyle:"italic"}}>기록된 사건이 없습니다.</div>:(
            <div>
              <div style={{fontSize:15,color:P.textMuted,marginBottom:8}}>총 {events.length}개 사건</div>
              {events.map((ev,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start",pageBreakInside:"avoid"}}>
                  <div style={{minWidth:64,textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:18,fontWeight:700,color:ev.color||ev.accent}}>{ev.age}세</div>
                    {parsedBY&&<div style={{fontSize:13,color:P.textMuted}}>{parsedBY+ev.age-1}년</div>}
                  </div>
                  <div style={{width:4,alignSelf:"stretch",borderRadius:2,background:ev.color||ev.accent,flexShrink:0,minHeight:28}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,color:P.textMuted,marginBottom:1}}>{ev.rowLabel}{ev.dateY?` · ${ev.dateY}${ev.dateM?`.${ev.dateM}`:""}`:""}</div>
                    <div style={{fontSize:19.5,color:P.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{ev.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RSection>

        {/* 1-2 말씀으로 */}
        <RSection num="1-2" title="삶의 기초 · 말씀으로" color={P.teal}>
          <RField label="내가 경험한 복음 — 하나님의 포기하지 않는 사랑" value={s1.gospel_exp}/>
          {(s1.gospel_before||s1.gospel_after)&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:P.textMuted,marginBottom:4}}>Before — 복음 이전</div>
                <div style={{fontSize:19.5,color:P.text,lineHeight:1.9,whiteSpace:"pre-wrap",background:"var(--c-redLight)",borderRadius:8,padding:"10px 13px",border:`1px solid ${P.border}`,minHeight:40}}>{s1.gospel_before||"—"}</div>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:P.teal,marginBottom:4}}>After — 복음 이후</div>
                <div style={{fontSize:19.5,color:P.text,lineHeight:1.9,whiteSpace:"pre-wrap",background:P.tealLight,borderRadius:8,padding:"10px 13px",border:`1px solid ${P.teal}30`,minHeight:40}}>{s1.gospel_after||"—"}</div>
              </div>
            </div>
          )}
          {(s1.word_m1||s1.word_m2||s1.word_m3)&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:15,fontWeight:700,color:P.gold,marginBottom:4}}>내 인생의 의미있는 말씀</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[s1.word_m1,s1.word_m2,s1.word_m3].map((w,i)=>w?(
                  <div key={i} style={{fontSize:17,color:P.text,lineHeight:1.8,whiteSpace:"pre-wrap",background:P.goldLight,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.gold}30`}}>{w}</div>
                ):null)}
              </div>
            </div>
          )}
          <RField label="기억에 남는 고백 / 기도" value={s1.word_prayer} color={P.purple}/>
        </RSection>

        {/* 1-3 사람으로 */}
        <RSection num="1-3" title="삶의 기초 · 사람으로" color={P.teal}>
          {people.length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:700,color:P.teal,marginBottom:5}}>나의 삶에 영향을 준 사람들</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:17}}>
                <thead><tr>
                  {["사람","소속/시기","영향 받은 것"].map((h,i)=><th key={h} style={{padding:"6px 9px",background:"var(--c-panel)",textAlign:"left",fontWeight:600,color:P.textSub,border:`1px solid ${P.border}`,width:i===0?"20%":i===1?"25%":"55%"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {people.map((p,i)=>(
                    <tr key={i}>
                      <td style={{padding:"6px 9px",border:`1px solid ${P.border}`,color:P.text}}>{p.name}</td>
                      <td style={{padding:"6px 9px",border:`1px solid ${P.border}`,color:P.textSub}}>{p.belong}</td>
                      <td style={{padding:"6px 9px",border:`1px solid ${P.border}`,color:P.text,lineHeight:1.6}}>{p.influence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {s1.people_praise&&(
              <div>
                <div style={{fontSize:15,fontWeight:700,color:P.green,marginBottom:4}}>들은 칭찬 · 격려 · 권면</div>
                <div style={{fontSize:19.5,color:P.text,lineHeight:1.9,whiteSpace:"pre-wrap",background:P.greenLight,borderRadius:8,padding:"10px 13px",border:`1px solid ${P.green}30`}}>{s1.people_praise}</div>
              </div>
            )}
            {s1.people_wound&&(
              <div>
                <div style={{fontSize:15,fontWeight:700,color:P.red,marginBottom:4}}>받은 상처의 말</div>
                <div style={{fontSize:19.5,color:P.text,lineHeight:1.9,whiteSpace:"pre-wrap",background:P.redLight,borderRadius:8,padding:"10px 13px",border:`1px solid ${P.red}30`}}>{s1.people_wound}</div>
              </div>
            )}
          </div>
        </RSection>

        {/* 1-4 사건으로 */}
        <RSection num="1-4" title="삶의 기초 · 사건으로" color={P.teal}>
          <RField label="감사한 일 / 성취의 경험" value={s1.ev_grat}/>
          <RField label="↳ 이 경험을 통한 인사이트" value={s1.ev_grat_i}/>
          <RField label="어려움 / 실패의 경험" value={s1.ev_str} color={P.red}/>
          <RField label="↳ 이 경험을 통한 인사이트" value={s1.ev_str_i} color={P.red}/>
          <RField label="어린 시절의 기억 조각들" value={s1.ev_child} color={P.gold}/>
        </RSection>

        {/* STEP 2 라벨 */}
        <div style={{textAlign:"center",margin:"32px 0 20px"}}>
          <span style={{display:"inline-block",padding:"5px 18px",borderRadius:20,background:P.greenLight,color:P.green,fontSize:17,fontWeight:700,letterSpacing:1}}>STEP 2 — 나의 복음 씨앗 심기</span>
        </div>

        {/* 2-1 이웃 MAP */}
        <RSection num="2-1" title="삶의 복음 · 일상 이웃 MAP" color={P.green}>
          {circles.length===0?<div style={{fontSize:17,color:P.textMuted,fontStyle:"italic"}}>기록된 공동체가 없습니다.</div>:(
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {circles.map(c=>(
                <span key={c.id} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:20,background:`${c.color}18`,border:`1.5px solid ${c.color}50`,fontSize:17,fontWeight:600,color:c.color}}>
                  <span style={{width:9,height:9,borderRadius:"50%",background:c.color}}/>
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </RSection>

        {/* 2-2 이웃 찾기 */}
        <RSection num="2-2" title="삶의 복음 · 나의 이웃 찾기" color={P.green}>
          <RField label="마음이 가는 이웃 / 영역" value={s2.nh_heart} color={P.green}/>
          <RField label="그 이웃이 어떻게 되길 원하나요?" value={s2.nh_vision} color={P.gold}/>
          <RField label="이웃을 위해 하고 싶은 것" value={s2.nh_action} color={P.purple}/>
          {Object.keys(ncChecks).length>0&&(
            <div style={{marginTop:6}}>
              <div style={{fontSize:15,fontWeight:700,color:P.green,marginBottom:6}}>"나는 이런 사람이 끌려요"</div>
              {Object.entries(ncChecks).map(([cat,items])=>(
                <div key={cat} style={{display:"flex",gap:8,marginBottom:5,alignItems:"baseline"}}>
                  <span style={{fontSize:15,fontWeight:600,color:P.textSub,minWidth:76,flexShrink:0}}>{cat}</span>
                  <span style={{fontSize:17,color:P.text,lineHeight:1.7}}>{items.join(", ")}</span>
                </div>
              ))}
            </div>
          )}
        </RSection>

        {/* 2-3 동사 */}
        <RSection num="2-3" title="삶의 복음 · 언어 동사 찾기" color={P.green}>
          {verbs.length>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:15,color:P.textMuted,marginBottom:6}}>선택한 동사 {verbs.length}개</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {verbs.map(v=><span key={v} style={{padding:"4px 12px",borderRadius:20,background:P.teal,color:"#fff",fontSize:18.5,fontWeight:600}}>{v}</span>)}
              </div>
            </div>
          )}
          <RField label="특별히 가슴을 뛰게 하는 동사들" value={s2.verb_heart} color={P.gold}/>
        </RSection>

        {/* 2-4 선언문 */}
        <RSection num="2-4" title="삶의 복음 · 나의 교회 선언문" color={P.green}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {s2.decl_kw&&(
              <div>
                <div style={{fontSize:15,fontWeight:700,color:P.teal,marginBottom:4}}>나의 교회 언어 Keyword</div>
                <div style={{fontSize:19.5,color:P.text,lineHeight:1.9,whiteSpace:"pre-wrap",background:P.tealLight,borderRadius:8,padding:"10px 13px",border:`1px solid ${P.teal}30`}}>{s2.decl_kw}</div>
              </div>
            )}
            {s2.decl_concept&&(
              <div>
                <div style={{fontSize:15,fontWeight:700,color:P.gold,marginBottom:4}}>이웃을 향한 나의 교회 Concept</div>
                <div style={{fontSize:19.5,color:P.text,lineHeight:1.9,whiteSpace:"pre-wrap",background:P.goldLight,borderRadius:8,padding:"10px 13px",border:`1px solid ${P.gold}30`}}>{s2.decl_concept}</div>
              </div>
            )}
          </div>
          {s2.decl_stmt&&(
            <div style={{background:`linear-gradient(135deg,${P.greenLight},${P.tealLight})`,borderRadius:12,padding:"18px 20px",border:`1.5px solid ${P.green}40`,textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:P.green,letterSpacing:2,marginBottom:8}}>나의 교회 선언</div>
              <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:19,color:P.navy,lineHeight:2,whiteSpace:"pre-wrap",fontStyle:"italic"}}>"{s2.decl_stmt}"</div>
            </div>
          )}
        </RSection>

        {/* 2-5 교회 개척 */}
        <RSection num="2-5" title="교회로 살면 교회는 개척된다" color={P.gold}>
          <RField label="내 교회의 핵심 말씀 / 약속의 말씀" value={s2.plant_scripture}/>
          {churchName&&(
            <div style={{textAlign:"center",margin:"14px 0",padding:"20px",background:`linear-gradient(135deg,${P.goldLight},${P.tealLight})`,borderRadius:14,border:`2px solid ${P.gold}50`}}>
              <div style={{fontSize:14,fontWeight:700,color:P.gold,letterSpacing:3,marginBottom:6}}>내 교회의 이름</div>
              <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:30,fontWeight:700,color:P.navy}}>{churchName}</div>
            </div>
          )}
          <RField label={`${churchName||"내"} 교회의 첫걸음 이야기 (첫 목표)`} value={s2.plant_first} color={P.green}/>
          {partners.length>0&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:15,fontWeight:700,color:P.purple,marginBottom:5}}>함께 훈련 받은 동역 교회 기도 목록</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:17}}>
                <thead><tr>
                  {["훈련자명","교회 이름","기도 내용"].map((h,i)=><th key={h} style={{padding:"6px 9px",background:"var(--c-panel)",textAlign:"left",fontWeight:600,color:P.textSub,border:`1px solid ${P.border}`,width:i===0?"20%":i===1?"30%":"50%"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {partners.map((p,i)=>(
                    <tr key={i}>
                      <td style={{padding:"6px 9px",border:`1px solid ${P.border}`,color:P.text}}>{p.trainer}</td>
                      <td style={{padding:"6px 9px",border:`1px solid ${P.border}`,color:P.text}}>{p.church}</td>
                      <td style={{padding:"6px 9px",border:`1px solid ${P.border}`,color:P.textSub,lineHeight:1.6}}>{p.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RSection>

        {/* 푸터 */}
        <div style={{textAlign:"center",borderTop:`1px solid ${P.border}`,paddingTop:18,marginTop:8}}>
          <div style={{fontSize:20,marginBottom:6}}>🌱</div>
          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:18,fontWeight:600,color:P.navy,marginBottom:3}}>"교회로 살면 교회는 개척된다"</div>
          <div style={{fontSize:14,color:P.textMuted}}>일상 교회 개척 스쿨 · Moving Church · {dateStr}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── LEADER GATE ─── */
function LeaderGate({onClose,onUnlock,userCode}){
  const[code,setCode]=useState("");
  const[err,setErr]=useState("");
  const try_=()=>{
    const c=code.trim();
    if(c===LEADER_CODE||(userCode&&c===userCode))onUnlock();
    else setErr("코드가 올바르지 않습니다. 리더에게 확인해주세요.");
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(42,33,24,0.6)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:P.surface,borderRadius:20,padding:"36px 32px",width:"100%",maxWidth:420,textAlign:"center",boxShadow:"0 20px 60px rgba(42,33,24,0.25)",fontFamily:"'Noto Sans KR',sans-serif"}}>
        <div style={{fontSize:40,marginBottom:14}}>🌱</div>
        <h2 style={{fontFamily:"'Noto Serif KR',serif",fontSize:20,color:P.navy,marginBottom:10,fontWeight:700}}>1단계 완성을 축하합니다!</h2>
        <p style={{fontSize:18,color:P.textSub,lineHeight:1.8,marginBottom:24}}>리더와 함께 작성한 내용을 충분히 나누어 보세요.<br/>나눔이 끝난 후, 리더로부터 받은 <strong>코드</strong>를 입력하면<br/>2단계로 넘어갈 수 있습니다.</p>
        <div style={{background:P.tealLight,borderRadius:12,padding:16,border:`1px solid ${P.teal}30`,marginBottom:20,textAlign:"left"}}>
          <div style={{fontSize:15,color:P.teal,fontWeight:700,letterSpacing:1,marginBottom:8}}>2단계 잠금 해제 코드</div>
          <input type="text" placeholder="리더에게 받은 코드 입력" value={code} onChange={e=>{setCode(e.target.value);setErr("");}} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)try_();}}
            style={{width:"100%",padding:"10px 12px",border:`1px solid ${err?P.red:P.border}`,borderRadius:8,fontSize:19,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none",boxSizing:"border-box",letterSpacing:2,textAlign:"center"}}/>
          {err&&<div style={{fontSize:17,color:P.red,marginTop:6}}>{err}</div>}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:9,border:`1px solid ${P.border}`,background:"transparent",color:P.textSub,fontFamily:"'Noto Sans KR',sans-serif",fontSize:18,cursor:"pointer"}}>나중에</button>
          <button onClick={try_} style={{flex:2,padding:"11px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:18,fontWeight:700,cursor:"pointer"}}>2단계로 이동 →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── ADMIN ─── */
function AdminScreen({user,isSuper,myGroupId,onSwitchToRoadmap}){
  const[parts,setParts]=useState([]);
  const[codes,setCodes]=useState({});
  const[groups,setGroups]=useState([]);
  const[loading,setLoading]=useState(true);
  const[copied,setCopied]=useState(null);
  const[newGroupName,setNewGroupName]=useState("");
  const[adminInputs,setAdminInputs]=useState({});
  const dn=user.displayName||user.email||"";

  useEffect(()=>{(async()=>{
    try{const s=await getDocs(collection(db,"progress"));setParts(s.docs.map(d=>({id:d.id,...d.data()})));}catch(e){console.error(e);}
    try{const cs=await getDocs(collection(db,"codes"));const m={};cs.docs.forEach(d=>{m[d.id]=d.data().code;});setCodes(m);}catch(e){console.error(e);}
    try{const gs=await getDocs(collection(db,"groups"));setGroups(gs.docs.map(d=>({id:d.id,...d.data()})));}catch(e){console.error(e);}
    setLoading(false);
  })();},[]);

  const timeAgo=ts=>{if(!ts)return"—";const d=Math.floor((Date.now()-ts)/86400000);return d===0?"오늘":d===1?"1일 전":d<7?`${d}일 전`:d<30?`${Math.floor(d/7)}주 전`:`${Math.floor(d/30)}개월 전`;};
  const si=p=>p.stage>=2?{l:"2단계 진행",bg:P.purpleLight,c:P.purple}:p.stage1Completed?{l:"1단계 완성",bg:P.greenLight,c:P.green}:{l:"1단계 진행",bg:P.tealLight,c:P.teal};

  /* 그룹 필터 */
  const myGroup=groups.find(g=>g.id===myGroupId);
  const visibleParts=isSuper?parts:parts.filter(p=>p.groupId===myGroupId);

  /* 개별 코드 생성 */
  const genCode=async(p)=>{
    const chars="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let rand="";for(let i=0;i<4;i++)rand+=chars[Math.floor(Math.random()*chars.length)];
    const code=`씨앗-${rand}`;
    try{
      await setDoc(doc(db,"codes",p.id),{code,displayName:p.displayName||"",email:p.email||"",createdAt:Date.now()});
      setCodes(prev=>({...prev,[p.id]:code}));
    }catch(e){alert("코드 저장 실패: Firestore 규칙을 확인해주세요.");console.error(e);}
  };
  const copyCode=(id,code)=>{navigator.clipboard?.writeText(code).then(()=>{setCopied(id);setTimeout(()=>setCopied(null),1500);});};
  const emailCode=(p,code)=>{
    const subject=encodeURIComponent("[일상 교회 개척 스쿨] 2단계 잠금 해제 코드");
    const body=encodeURIComponent(`${p.displayName||"참가자"}님, 안녕하세요!\n\n1단계 "나의 복음 씨앗 찾기"를 완성하신 것을 축하드립니다. 🌱\n\n리더와의 나눔을 마치셨다면, 아래 코드를 입력하고\n2단계 "나의 복음 씨앗 심기"로 넘어가세요.\n\n━━━━━━━━━━━━━━━\n  2단계 잠금 해제 코드\n\n     ${code}\n━━━━━━━━━━━━━━━\n\n앱 접속: https://woaliferoadmap.vercel.app\n"1단계 완성" 버튼 → 코드 입력 → 2단계 시작!\n\n"교회로 살면 교회는 개척된다"\n일상 교회 개척 스쿨 드림`);
    window.open(`mailto:${p.email}?subject=${subject}&body=${body}`,"_blank");
  };

  /* 그룹 관리 (슈퍼 전용) */
  const createGroup=async()=>{
    const name=newGroupName.trim();if(!name)return;
    const id=`g${Date.now()}`;
    try{
      await setDoc(doc(db,"groups",id),{name,admins:[],createdAt:Date.now()});
      setGroups([...groups,{id,name,admins:[]}]);setNewGroupName("");
    }catch(e){alert("그룹 생성 실패: Firestore 규칙을 확인해주세요.");console.error(e);}
  };
  const deleteGroup=async(g)=>{
    if(!window.confirm(`"${g.name}" 그룹을 삭제할까요?\n참가자들은 미배정 상태가 되고 그룹 관리자 권한도 해제됩니다.`))return;
    try{
      await deleteDoc(doc(db,"groups",g.id));
      for(const em of (g.admins||[])){try{await deleteDoc(doc(db,"admins",em));}catch{}}
      for(const p of parts.filter(x=>x.groupId===g.id)){try{await setDoc(doc(db,"progress",p.id),{groupId:null},{merge:true});}catch{}}
      setGroups(groups.filter(x=>x.id!==g.id));
      setParts(parts.map(p=>p.groupId===g.id?{...p,groupId:null}:p));
    }catch(e){alert("그룹 삭제 실패");console.error(e);}
  };
  const assignGroup=async(uid,groupId)=>{
    try{
      await setDoc(doc(db,"progress",uid),{groupId:groupId||null},{merge:true});
      setParts(parts.map(p=>p.id===uid?{...p,groupId:groupId||null}:p));
    }catch(e){alert("배정 실패: Firestore 규칙을 확인해주세요.");console.error(e);}
  };
  const addGroupAdmin=async(g)=>{
    const email=(adminInputs[g.id]||"").trim().toLowerCase();
    if(!email.includes("@")){alert("올바른 이메일을 입력해주세요.");return;}
    if((g.admins||[]).includes(email)){alert("이미 등록된 관리자입니다.");return;}
    try{
      const newAdmins=[...(g.admins||[]),email];
      await setDoc(doc(db,"groups",g.id),{admins:newAdmins},{merge:true});
      await setDoc(doc(db,"admins",email),{groupId:g.id,groupName:g.name,addedAt:Date.now()});
      setGroups(groups.map(x=>x.id===g.id?{...x,admins:newAdmins}:x));
      setAdminInputs({...adminInputs,[g.id]:""});
    }catch(e){alert("관리자 추가 실패");console.error(e);}
  };
  const removeGroupAdmin=async(g,email)=>{
    if(!window.confirm(`${email} 님의 관리자 권한을 해제할까요?`))return;
    try{
      const newAdmins=(g.admins||[]).filter(a=>a!==email);
      await setDoc(doc(db,"groups",g.id),{admins:newAdmins},{merge:true});
      await deleteDoc(doc(db,"admins",email));
      setGroups(groups.map(x=>x.id===g.id?{...x,admins:newAdmins}:x));
    }catch(e){alert("해제 실패");console.error(e);}
  };

  const groupName=id=>groups.find(g=>g.id===id)?.name||"";

  return(
    <div style={{minHeight:"100vh",background:P.bg,fontFamily:"'Noto Sans KR',sans-serif"}}>
      <style>{FONT}</style>
      <header style={{padding:"12px 32px",background:P.surface,borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 1px 8px ${P.shadow}`,gap:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:22}}>🌱</div>
          <div><div style={{fontSize:13,letterSpacing:2.5,color:P.textMuted,textTransform:"uppercase"}}>일상 교회 개척 스쿨</div>
          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:20,fontWeight:700,color:P.navy}}>{isSuper?"관리자 대시보드":`${myGroup?.name||"그룹"} 관리`}</div></div>
        </div>
        <div style={{padding:"4px 10px",borderRadius:6,background:isSuper?P.goldLight:P.purpleLight,border:`1px solid ${isSuper?P.gold:P.purple}40`,fontSize:15,color:isSuper?P.gold:P.purple,fontWeight:600}}>{isSuper?"🛡 슈퍼 관리자":`👥 그룹 관리자 — ${myGroup?.name||""}`}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {onSwitchToRoadmap&&<button onClick={onSwitchToRoadmap} style={{padding:"7px 15px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:17,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 2px 10px ${P.teal}40`}}>🗺 내 로드맵 하기</button>}
          <ThemeToggle compact/>
          {user.photoURL?<img src={user.photoURL} alt="" style={{width:26,height:26,borderRadius:"50%"}}/>:
          <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${P.teal},${P.green})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff"}}>{dn.charAt(0).toUpperCase()}</div>}
          <span style={{fontSize:17,fontWeight:600,color:P.text}}>{dn}</span>
          <button onClick={()=>signOut(auth)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",color:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,cursor:"pointer"}}>로그아웃</button>
        </div>
      </header>
      <div style={{padding:"24px 32px 48px"}}>
        <div style={{background:P.goldLight,border:`1px solid ${P.gold}40`,borderLeft:`4px solid ${P.gold}`,borderRadius:10,padding:"12px 16px",fontSize:17,color:P.textSub,lineHeight:1.7,marginBottom:24}}>
          🔒 관리자는 참가자의 진행 현황만 확인할 수 있습니다. 실제 기록 내용은 본인만 볼 수 있습니다.<br/>
          🔑 <strong>코드:</strong> 참가자별 개별 코드를 생성하고 이메일로 전달할 수 있습니다.{isSuper&&<> (공용 코드 <strong>{LEADER_CODE}</strong> 도 항상 유효)</>}
        </div>

        {/* 통계 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[{l:"전체 참가자",v:visibleParts.length,c:P.navy,bg:"var(--c-blueLight)"},
            {l:"활동 참가자",v:visibleParts.filter(p=>(p.eventCount||0)>0).length,c:P.teal,bg:P.tealLight},
            {l:"1단계 완성",v:visibleParts.filter(p=>p.stage1Completed).length,c:P.green,bg:P.greenLight},
            {l:"2단계 진행",v:visibleParts.filter(p=>p.stage>=2).length,c:P.purple,bg:P.purpleLight},
          ].map(s=><div key={s.l} style={{background:s.bg,borderRadius:12,padding:"14px 16px",border:`1px solid ${s.c}20`}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c,fontFamily:"'Noto Serif KR',serif",marginBottom:3}}>{s.v}</div>
            <div style={{fontSize:15,color:P.textSub}}>{s.l}</div>
          </div>)}
        </div>

        {/* ══ 그룹 관리 (슈퍼 전용) ══ */}
        {isSuper&&(
          <div style={{background:P.surface,borderRadius:14,border:`1px solid ${P.border}`,overflow:"hidden",marginBottom:24}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{fontSize:20,fontWeight:600,color:P.text}}>👥 그룹 관리</div>
              <div style={{display:"flex",gap:8}}>
                <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)createGroup();}} placeholder="새 그룹 이름 (예: 2025 봄학기 A조)" style={{padding:"8px 13px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:17,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none",minWidth:220}}/>
                <button onClick={createGroup} style={{padding:"8px 16px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:17,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>+ 그룹 만들기</button>
              </div>
            </div>
            {groups.length===0?(
              <div style={{padding:"24px",textAlign:"center",color:P.textMuted,fontSize:18}}>아직 그룹이 없습니다. 위에서 첫 그룹을 만들어보세요!</div>
            ):(
              <div style={{padding:"14px 20px",display:"flex",flexDirection:"column",gap:12}}>
                {groups.map(g=>{
                  const memberCount=parts.filter(p=>p.groupId===g.id).length;
                  return(
                    <div key={g.id} style={{border:`1px solid ${P.border}`,borderLeft:`4px solid ${P.purple}`,borderRadius:10,padding:"12px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:19,fontWeight:700,color:P.navy}}>{g.name}</span>
                          <span style={{fontSize:15,color:P.purple,background:P.purpleLight,borderRadius:12,padding:"2px 10px",fontWeight:600}}>{memberCount}명</span>
                        </div>
                        <button onClick={()=>deleteGroup(g)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${P.red}40`,background:`${P.red}08`,color:P.red,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,cursor:"pointer"}}>그룹 삭제</button>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:15,fontWeight:600,color:P.textSub,marginRight:2}}>그룹 관리자:</span>
                        {(g.admins||[]).length===0&&<span style={{fontSize:15,color:P.textMuted,fontStyle:"italic"}}>아직 없음</span>}
                        {(g.admins||[]).map(em=>(
                          <span key={em} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:14,background:P.purpleLight,border:`1px solid ${P.purple}30`,fontSize:15,color:P.purple,fontWeight:600}}>
                            {em}
                            <button onClick={()=>removeGroupAdmin(g,em)} style={{background:"none",border:"none",color:P.purple,cursor:"pointer",fontSize:17,padding:0,lineHeight:1,opacity:0.6}}>×</button>
                          </span>
                        ))}
                        <input value={adminInputs[g.id]||""} onChange={e=>setAdminInputs({...adminInputs,[g.id]:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)addGroupAdmin(g);}} placeholder="관리자 이메일 추가" style={{padding:"5px 11px",border:`1px solid ${P.border}`,borderRadius:14,fontSize:15,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,color:P.text,outline:"none",width:170}}/>
                        <button onClick={()=>addGroupAdmin(g)} style={{padding:"5px 12px",borderRadius:14,border:`1px solid ${P.purple}50`,background:P.purpleLight,color:P.purple,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer"}}>+ 추가</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ 참가자 테이블 ══ */}
        <div style={{background:P.surface,borderRadius:14,border:`1px solid ${P.border}`,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${P.border}`,fontSize:20,fontWeight:600,color:P.text}}>
            {isSuper?"참가자 현황 & 코드 관리":`${myGroup?.name||"내 그룹"} 참가자`}
          </div>
          {loading?<div style={{padding:40,textAlign:"center",color:P.textMuted}}>불러오는 중…</div>:visibleParts.length===0?<div style={{padding:40,textAlign:"center",color:P.textMuted}}>{isSuper?"참가자 데이터가 없습니다.":"이 그룹에 배정된 참가자가 아직 없습니다.\n슈퍼 관리자에게 배정을 요청해주세요."}</div>:
          <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:18}}>
            <thead><tr style={{background:P.bg}}>
              {["참가자",...(isSuper?["그룹"]:[]),"단계","사건","마지막 접속","진행률","🔑 2단계 코드"].map(h=><th key={h} style={{padding:"9px 14px",textAlign:h==="참가자"?"left":"center",fontWeight:600,color:P.textMuted,borderBottom:`1px solid ${P.border}`,fontSize:15,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {visibleParts.map((p,i)=>{
                const sl=si(p),ov=p.overallProgress||0;
                const init=(p.displayName||p.email||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                const cs=[["#4A8F7A","#7B5EA7"],["#C4902A","#C05A5A"],["#2E7DAE","#4A8A60"],["#C05A5A","#C4902A"]][i%4];
                const pCode=codes[p.id];
                return(<tr key={p.id} style={{borderBottom:`1px solid ${P.border}`}} onMouseEnter={e=>e.currentTarget.style.background=P.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"11px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${cs[0]},${cs[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0}}>{init}</div>
                    <div><div style={{fontWeight:600,color:P.text}}>{p.displayName||"—"}</div><div style={{fontSize:15,color:P.textMuted}}>{p.email||""}</div></div>
                  </div></td>
                  {isSuper&&(
                    <td style={{padding:"11px 14px",textAlign:"center"}}>
                      <select value={p.groupId||""} onChange={e=>assignGroup(p.id,e.target.value)} style={{padding:"5px 8px",border:`1px solid ${p.groupId?P.purple+"50":P.border}`,borderRadius:7,fontSize:15,fontFamily:"'Noto Sans KR',sans-serif",background:p.groupId?P.purpleLight:P.input,color:p.groupId?P.purple:P.textMuted,outline:"none",cursor:"pointer",fontWeight:p.groupId?600:400,maxWidth:130}}>
                        <option value="">미배정</option>
                        {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </td>
                  )}
                  <td style={{padding:"11px 14px",textAlign:"center"}}><span style={{background:sl.bg,color:sl.c,borderRadius:20,padding:"4px 11px",fontSize:15,fontWeight:600,whiteSpace:"nowrap"}}>{sl.l}</span></td>
                  <td style={{padding:"11px 14px",textAlign:"center",fontWeight:600,color:P.text}}>{p.eventCount||0}</td>
                  <td style={{padding:"11px 14px",textAlign:"center",color:P.textSub,fontSize:17,whiteSpace:"nowrap"}}>{timeAgo(p.lastActiveAt)}</td>
                  <td style={{padding:"11px 14px",minWidth:100}}><div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{flex:1,height:6,borderRadius:3,background:P.border,overflow:"hidden",minWidth:44}}><div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${P.teal},${P.green})`,width:`${ov}%`,transition:"width 0.4s"}}/></div>
                    <span style={{fontSize:15,fontWeight:600,minWidth:30,color:P.teal}}>{ov}%</span>
                  </div></td>
                  <td style={{padding:"11px 14px",textAlign:"center"}}>
                    {pCode?(
                      <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
                        <span onClick={()=>copyCode(p.id,pCode)} title="클릭하여 복사" style={{fontFamily:"monospace",fontSize:17,fontWeight:700,color:P.purple,background:P.purpleLight,borderRadius:6,padding:"4px 9px",cursor:"pointer",border:`1px solid ${P.purple}30`,whiteSpace:"nowrap"}}>
                          {copied===p.id?"✓ 복사됨":pCode}
                        </span>
                        {p.email&&<button onClick={()=>emailCode(p,pCode)} title="이메일로 코드 보내기" style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${P.teal}50`,background:P.tealLight,color:P.tealDark,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>📧 전송</button>}
                        <button onClick={()=>genCode(p)} title="새 코드로 재생성" style={{padding:"4px 7px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",color:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,cursor:"pointer"}}>↻</button>
                      </div>
                    ):(
                      <button onClick={()=>genCode(p)} style={{padding:"5px 13px",borderRadius:7,border:"none",background:`linear-gradient(135deg,${P.purple},#5C3F8A)`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>🔑 코드 생성</button>
                    )}
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
          </div>}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
function RoadMapApp({user,onSwitchToAdmin}){
  const[stage,setStage]=useState(1);
  const[sec1,setSec1]=useState("roadmap");
  const[sec2,setSec2]=useState("neighbormap");
  const[by,setBy]=useState("");
  const[s1,setS1]=useState({cells:{}});
  const[s2,setS2]=useState({});
  const[loaded,setLoaded]=useState(false);
  const[modal,setModal]=useState(null);
  const[gate,setGate]=useState(false);
  const[maxStage,setMaxStage]=useState(1);
  const[myCode,setMyCode]=useState(null);
  const[saveStatus,setSaveStatus]=useState("idle"); // idle | pending | saving | saved | error
  const[lastSaved,setLastSaved]=useState(null);
  const saveRef=useRef(null);
  const dn=user.displayName||user.email||"";
  const parsedBY=parseInt(by)||null;

  useEffect(()=>{(async()=>{
    try{
      const snap=await getDoc(doc(db,"roadmaps",user.uid));
      if(snap.exists()){
        const d=snap.data();
        if(d.by)setBy(d.by);
        if(d.stage)setStage(d.stage);
        setMaxStage(d.maxStage||d.stage||1);
        if(d.s1)setS1(d.s1);
        if(d.s2)setS2(d.s2);
      }
    }catch(e){console.error(e);}
    try{
      const cs=await getDoc(doc(db,"codes",user.uid));
      if(cs.exists()&&cs.data().code)setMyCode(cs.data().code);
    }catch(e){/* codes 규칙 미설정 시 무시 */}
    setLoaded(true);
  })();},[user.uid]);

  /* 저장 실행 (자동저장 + 수동저장 공용) */
  const doSave=async()=>{
    setSaveStatus("saving");
    try{
      await setDoc(doc(db,"roadmaps",user.uid),{by,stage,maxStage,s1,s2},{merge:true});
      const ec=Object.values(s1.cells||{}).filter(v=>v?.text).length;
      await setDoc(doc(db,"progress",user.uid),{uid:user.uid,displayName:user.displayName||"",email:user.email||"",stage:maxStage,eventCount:ec,stage1Completed:maxStage>=2,overallProgress:maxStage>=2?Math.min(100,50+Math.round((ec/20)*30)):Math.min(50,Math.round((ec/20)*50)),lastActiveAt:Date.now()},{merge:true});
      setSaveStatus("saved");
      setLastSaved(Date.now());
    }catch(e){console.error(e);setSaveStatus("error");}
  };

  /* 수동 저장: 대기 중인 자동저장 취소하고 즉시 저장 */
  const manualSave=()=>{clearTimeout(saveRef.current);doSave();};

  /* 자동 저장 (1.5초 디바운스) */
  useEffect(()=>{
    if(!loaded)return;
    setSaveStatus("pending");
    clearTimeout(saveRef.current);
    saveRef.current=setTimeout(doSave,1500);
    return()=>clearTimeout(saveRef.current);
  },[by,stage,maxStage,s1,s2,loaded]);

  /* "저장 완료" 표시 3초 후 idle 복귀 */
  useEffect(()=>{
    if(saveStatus==="saved"){
      const t=setTimeout(()=>setSaveStatus("idle"),3000);
      return()=>clearTimeout(t);
    }
  },[saveStatus]);

  const fmtTime=ts=>{if(!ts)return"";const d=new Date(ts);const h=d.getHours(),m=String(d.getMinutes()).padStart(2,"0");return `${h}:${m}`;};

  const openCell=(rowId,rowLabel,age)=>{const k=`${rowId}_${age}`,c=s1.cells?.[k];setModal({rowId,rowLabel,age,key:k,text:c?.text||"",color:c?.color,dateY:c?.dateY||"",dateM:c?.dateM||"",dateD:c?.dateD||""});};
  const openByAge=age=>setModal({rowId:null,rowLabel:null,age,key:null,text:"",color:null,dateY:"",dateM:"",dateD:""});
  const saveCell=({text,color,dateY,dateM,dateD,rowId:nr})=>{const rid=nr||modal.rowId;if(!rid)return;const k=`${rid}_${modal.age}`,n={...(s1.cells||{})};if(!text.trim())delete n[k];else n[k]={text:text.trim(),color,dateY,dateM,dateD};setS1(p=>({...p,cells:n}));setModal(null);};
  const delCell=()=>{if(!modal.key){setModal(null);return;}const n={...(s1.cells||{})};delete n[modal.key];setS1(p=>({...p,cells:n}));setModal(null);};
  const up1=(k,v)=>setS1(p=>({...p,[k]:v}));
  const up2=(k,v)=>setS2(p=>({...p,[k]:v}));

  const curSecs=stage===1?STEP1_SECTIONS:stage===2?STEP2_SECTIONS:STEP3_SECTIONS;
  const curSec=stage===1?sec1:stage===2?sec2:"report";
  const setSec=stage===1?setSec1:stage===2?setSec2:()=>{};
  const sc=stage===1?P.teal:stage===2?P.green:P.gold;
  const secInfo=curSecs.find(s=>s.id===curSec);
  const ec=Object.values(s1.cells||{}).filter(v=>v?.text).length;

  const renderSec=()=>{
    const pad={padding:"20px 32px 48px"};
    if(stage===1){
      if(sec1==="roadmap")return<div style={pad}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{fontSize:15,color:P.textMuted}}>📌 나이/연도 행 클릭 → 사건 추가 &nbsp;|&nbsp; 셀 클릭 → 편집</div>
          <div style={{padding:"3px 10px",borderRadius:20,background:P.tealLight,color:P.tealDark,fontSize:15,border:`1px solid ${P.teal}40`}}>{parsedBY?(()=>{const ca=Math.min(END_AGE,Math.max(5,new Date().getFullYear()-parsedBY+1));return `나이 ${START_AGE}–${ca}세 (${parsedBY}–${parsedBY+ca-1}년) · 현재까지`;})():`나이 ${START_AGE}–${END_AGE}세 · 출생연도 입력 시 현재까지 표시`}</div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
          {ROWS.map(r=><div key={r.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:15,color:P.textSub}}><div style={{width:7,height:7,borderRadius:2,background:r.accent}}/>{r.label}</div>)}
        </div>
        <GridTimeline cells={s1.cells||{}} onCellClick={openCell} onAgeClick={openByAge} birthYear={parsedBY}/>
      </div>;
      if(sec1==="word")return<div style={pad}><WordSection data={s1} onChange={up1}/></div>;
      if(sec1==="people")return<div style={pad}><PeopleSection data={s1} onChange={up1}/></div>;
      if(sec1==="event")return<div style={pad}><EventSection data={s1} onChange={up1}/></div>;
    }else if(stage===2){
      if(sec2==="neighbormap")return<div style={pad}><NeighborMapSection data={s2} onChange={up2}/></div>;
      if(sec2==="neighbor")return<div style={pad}><NeighborFindSection data={s2} onChange={up2}/></div>;
      if(sec2==="verb")return<div style={pad}><VerbSection data={s2} onChange={up2}/></div>;
      if(sec2==="declaration")return<div style={pad}><DeclarationSection data={s2} onChange={up2}/></div>;
      if(sec2==="plant")return<div style={pad}><PlantSection data={s2} onChange={up2}/></div>;
    }else{
      return<div style={pad}><ReportSection user={user} by={by} s1={s1} s2={s2}/></div>;
    }
  };

  return(
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",flexDirection:"column",fontFamily:"'Noto Sans KR',sans-serif"}}>
      <style>{`${FONT}*{box-sizing:border-box;margin:0;padding:0;}html,body{background:${P.bg};}::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-thumb{background:${P.borderDark};border-radius:3px;}textarea::placeholder,input::placeholder{color:${P.textMuted};}input[type=number]::-webkit-inner-spin-button{opacity:0.4;}
@media print{
  .no-print,header.app-header{display:none!important;}
  html,body{background:#fff!important;}
  main{overflow:visible!important;}
  #print-report{box-shadow:none!important;border:none!important;border-radius:0!important;max-width:100%!important;padding:0!important;}
  @page{margin:18mm 14mm;}
}`}</style>

      <header className="app-header" style={{padding:"10px 20px",background:P.surface,borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:500,boxShadow:`0 1px 8px ${P.shadow}`,gap:10,flexWrap:"wrap"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
          <div style={{fontSize:20}}>🌱</div>
          <div><div style={{fontSize:12,letterSpacing:2,color:P.textMuted,textTransform:"uppercase"}}>일상 교회 개척 스쿨</div>
          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:18,fontWeight:700,color:P.navy}}>{stage===1?"나의 복음 씨앗 찾기":stage===2?"나의 복음 씨앗 심기":"나의 복음 씨앗 리포트"}</div></div>
        </div>

        {/* Step tabs */}
        <div className="no-print" style={{display:"flex",alignItems:"center",gap:0,border:`1px solid ${P.border}`,borderRadius:20,overflow:"hidden",flexShrink:0}}>
          {[{n:1,l:"STEP 1 씨앗 찾기",c:P.teal},{n:2,l:"STEP 2 씨앗 심기",c:P.green},{n:3,l:"STEP 3 리포트",c:P.gold}].map((s,i)=>{
            const isA=stage===s.n;
            const isDone=maxStage>s.n||(s.n<stage);
            const canClick=s.n<=maxStage||(s.n===3&&maxStage>=2);
            return<div key={s.n} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:isA?`${s.c}18`:"transparent",borderLeft:i>0?`1px solid ${P.border}`:"none",cursor:canClick?"pointer":"not-allowed",opacity:canClick?1:0.5}} onClick={()=>canClick&&setStage(s.n)}>
              <div style={{width:16,height:16,borderRadius:"50%",background:isA||canClick?s.c:P.border,color:"#fff",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.n===3?"📋":canClick&&!isA?"✓":s.n}</div>
              <span style={{fontSize:15,fontWeight:isA?700:400,color:isA||canClick?s.c:P.textMuted,whiteSpace:"nowrap"}}>{s.l}</span>
            </div>;
          })}
        </div>

        {/* Section nav */}
        <div style={{flex:1,overflowX:"auto",minWidth:0}}>
          <div style={{display:"flex",gap:0,border:`1px solid ${P.border}`,borderRadius:9,overflow:"hidden",width:"max-content"}}>
            {curSecs.map((s,i)=>{const isA=curSec===s.id;return(
              <button key={s.id} onClick={()=>setSec(s.id)} style={{padding:"6px 12px",background:isA?`${sc}18`:"transparent",border:"none",borderLeft:i>0?`1px solid ${P.border}`:"none",color:isA?sc:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,cursor:"pointer",fontWeight:isA?700:400,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                <span>{s.icon}</span>{s.label}
              </button>
            );})}
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {stage===1&&<>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <label style={{fontSize:14,color:P.textMuted,whiteSpace:"nowrap"}}>출생연도</label>
              <input type="number" placeholder="예: 1974" min="1900" max="2100" value={by} onChange={e=>setBy(e.target.value)} style={{width:78,padding:"5px 7px",border:`1px solid ${parsedBY?P.teal:P.border}`,borderRadius:7,color:P.text,fontSize:15,fontFamily:"'Noto Sans KR',sans-serif",background:P.input,outline:"none"}}/>
              <span style={{fontSize:14,color:P.textMuted}}>년</span>
            </div>
            <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:P.teal,fontFamily:"'Noto Serif KR',serif"}}>{ec}</div><div style={{fontSize:13,color:P.textMuted}}>사건</div></div>
            <button onClick={()=>maxStage>=2?setStage(2):setGate(true)} style={{padding:"6px 12px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.teal},${P.tealDark})`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{maxStage>=2?"→ 2단계로":"✓ 1단계 완성"}</button>
          </>}
          {/* 저장 버튼 + 상태 */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={manualSave} disabled={saveStatus==="saving"} title="지금 바로 저장하기" style={{padding:"6px 14px",borderRadius:9,border:saveStatus==="saved"?`1.5px solid ${P.green}`:saveStatus==="error"?`1.5px solid ${P.red}`:`1.5px solid ${P.teal}60`,background:saveStatus==="saved"?P.greenLight:saveStatus==="error"?P.redLight:saveStatus==="saving"?P.border:P.surface,color:saveStatus==="saved"?P.green:saveStatus==="error"?P.red:P.tealDark,fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,fontWeight:700,cursor:saveStatus==="saving"?"wait":"pointer",whiteSpace:"nowrap",transition:"all 0.2s",display:"flex",alignItems:"center",gap:5}}>
              {saveStatus==="saving"?"⏳ 저장 중…":saveStatus==="saved"?"✓ 저장 완료!":saveStatus==="error"?"⚠ 저장 실패 — 재시도":"💾 저장"}
            </button>
            {lastSaved&&saveStatus!=="saving"&&<span style={{fontSize:18.5,color:P.textMuted,whiteSpace:"nowrap"}}>마지막 저장 {fmtTime(lastSaved)}</span>}
          </div>
          {onSwitchToAdmin&&<button onClick={onSwitchToAdmin} style={{padding:"6px 13px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.gold},#8B5E1A)`,color:"#fff",fontFamily:"'Noto Sans KR',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 2px 10px ${P.gold}40`}}>🛡 관리자 페이지</button>}
          <ThemeToggle compact/>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px 4px 5px",border:`1px solid ${P.border}`,borderRadius:20,background:P.bg}}>
            {user.photoURL?<img src={user.photoURL} alt="" style={{width:22,height:22,borderRadius:"50%",objectFit:"cover"}}/>:
            <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${P.teal},${P.green})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff"}}>{dn.charAt(0).toUpperCase()}</div>}
            <span style={{fontSize:15,fontWeight:600,color:P.text,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dn}</span>
            <button onClick={()=>signOut(auth)} style={{padding:"2px 7px",borderRadius:5,border:`1px solid ${P.border}`,background:"transparent",color:P.textMuted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:14,cursor:"pointer"}}>로그아웃</button>
          </div>
        </div>
      </header>

      {/* Section label */}
      <div className="no-print" style={{padding:"7px 20px",background:`${sc}08`,borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",gap:8}}>
        <span>{secInfo?.icon}</span>
        <span style={{fontSize:15,fontWeight:700,color:sc}}>{stage===1?"STEP 1 — 나의 복음 씨앗 찾기":stage===2?"STEP 2 — 나의 복음 씨앗 심기":"STEP 3 — 나의 복음 씨앗 리포트"}</span>
        <span style={{fontSize:15,color:P.textMuted}}>/ {secInfo?.label}</span>
        {stage===2&&<div style={{marginLeft:"auto",fontSize:15,color:P.green,fontWeight:600}}>🔓 2단계 진행 중</div>}
        {stage===3&&<div style={{marginLeft:"auto",fontSize:15,color:P.gold,fontWeight:600}}>📋 전체 기록 요약</div>}
      </div>

      <main style={{flex:1,overflowY:"auto"}}>{renderSec()}</main>
      {modal&&<EventModal cell={modal} onSave={saveCell} onDelete={delCell} onClose={()=>setModal(null)} birthYear={parsedBY}/>}
      {gate&&<LeaderGate userCode={myCode} onClose={()=>setGate(false)} onUnlock={()=>{setStage(2);setMaxStage(m=>Math.max(m,2));setGate(false);setSec2("neighbormap");}}/>}
    </div>
  );
}

/* ─── 다크모드 토글 (전역) ─── */
let _themeListeners=[];
function useTheme(){
  const[theme,setTheme]=useState(()=>{try{return localStorage.getItem("cr_theme")||"light";}catch{return "light";}});
  useEffect(()=>{
    const fn=t=>setTheme(t);
    _themeListeners.push(fn);
    return()=>{_themeListeners=_themeListeners.filter(f=>f!==fn);};
  },[]);
  useEffect(()=>{
    document.body.className=`theme-${theme}`;
    try{localStorage.setItem("cr_theme",theme);}catch{}
  },[theme]);
  const toggle=()=>{const nt=theme==="light"?"dark":"light";setTheme(nt);_themeListeners.forEach(f=>f(nt));};
  return[theme,toggle];
}
function ThemeToggle({compact}){
  const[theme,toggle]=useTheme();
  const isDark=theme==="dark";
  return(
    <button onClick={toggle} title={isDark?"라이트 모드로":"다크 모드로"} style={{padding:compact?"5px 10px":"6px 13px",borderRadius:20,border:`1px solid ${P.border}`,background:P.surface,color:P.text,fontFamily:"'Noto Sans KR',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"all 0.2s"}}>
      <span style={{fontSize:15}}>{isDark?"☀️":"🌙"}</span>{!compact&&<span>{isDark?"라이트":"다크"}</span>}
    </button>
  );
}

/* ─── ROOT ─── */
export default function App(){
  const[user,setUser]=useState(undefined);
  const[role,setRole]=useState(null); // "super" | "group" | "user"
  const[myGroupId,setMyGroupId]=useState(null);
  const[view,setView]=useState("admin"); // 관리자용: "admin" | "roadmap"
  const[theme]=useTheme();

  useEffect(()=>onAuthStateChanged(auth,u=>setUser(u||null)),[]);

  useEffect(()=>{
    if(!user){setRole(null);setMyGroupId(null);setView("admin");return;}
    if(ADMIN_EMAILS.includes(user.email)){setRole("super");return;}
    (async()=>{
      try{
        const a=await getDoc(doc(db,"admins",(user.email||"").toLowerCase()));
        if(a.exists()&&a.data().groupId){setMyGroupId(a.data().groupId);setRole("group");return;}
      }catch(e){/* admins 규칙 미설정 시 일반 사용자 */}
      setRole("user");
    })();
  },[user]);

  const themeStyle=<style>{THEME_VARS}</style>;
  const loadingScreen=<div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans KR',sans-serif"}}>{themeStyle}<style>{FONT}</style><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>🌱</div><div style={{fontSize:18,color:P.textMuted}}>불러오는 중…</div></div></div>;

  if(user===undefined)return loadingScreen;
  if(!user)return<>{themeStyle}<AuthScreen/></>;
  if(role===null)return loadingScreen;
  if(role==="super"||role==="group"){
    if(view==="admin")return<>{themeStyle}<AdminScreen user={user} isSuper={role==="super"} myGroupId={myGroupId} onSwitchToRoadmap={()=>setView("roadmap")}/></>;
    return<>{themeStyle}<RoadMapApp user={user} onSwitchToAdmin={()=>setView("admin")}/></>;
  }
  return<>{themeStyle}<RoadMapApp user={user}/></>;
}
