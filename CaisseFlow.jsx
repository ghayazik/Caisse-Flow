import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

/* ═══════════════════ DATA ═══════════════════ */
const DEFAULT_PRODUCTS=[
{code:"7501001",nom:"Lait Centrale 1L",prix:7.5,categorie:"Produits laitiers",tva:0},
{code:"7501002",nom:"Beurre Centrale 250g",prix:12,categorie:"Produits laitiers",tva:.07},
{code:"7501003",nom:"Yaourt Danone x4",prix:10,categorie:"Produits laitiers",tva:.07},
{code:"7502001",nom:"Pain de mie Bimbo",prix:9.5,categorie:"Boulangerie",tva:.07},
{code:"7502002",nom:"Croissant x6",prix:15,categorie:"Boulangerie",tva:.1},
{code:"7503001",nom:"Huile Lesieur 1L",prix:18,categorie:"Épicerie",tva:.1},
{code:"7503002",nom:"Sucre Cosumar 1kg",prix:7,categorie:"Épicerie",tva:0},
{code:"7503003",nom:"Farine Tria 1kg",prix:5.5,categorie:"Épicerie",tva:0},
{code:"7503004",nom:"Riz Uncle Ben's 1kg",prix:22,categorie:"Épicerie",tva:.1},
{code:"7503005",nom:"Thé Sultan 200g",prix:14,categorie:"Épicerie",tva:.1},
{code:"7504001",nom:"Coca-Cola 1.5L",prix:11,categorie:"Boissons",tva:.1},
{code:"7504002",nom:"Eau Sidi Ali 1.5L",prix:4,categorie:"Boissons",tva:.07},
{code:"7504003",nom:"Jus Valencia 1L",prix:13.5,categorie:"Boissons",tva:.1},
{code:"7505001",nom:"Tide Lessive 3kg",prix:45,categorie:"Hygiène",tva:.2},
{code:"7505002",nom:"Savon Palmolive",prix:8.5,categorie:"Hygiène",tva:.2},
{code:"7505003",nom:"Papier Hyg. Okay x4",prix:12,categorie:"Hygiène",tva:.2},
{code:"7506001",nom:"Chips Lay's 150g",prix:15,categorie:"Snacks",tva:.1},
{code:"7506002",nom:"Biscuits Lu Petit",prix:6.5,categorie:"Snacks",tva:.1},
{code:"7506003",nom:"Chocolat Kinder",prix:8,categorie:"Snacks",tva:.1},
{code:"7507001",nom:"Oeufs x30",prix:42,categorie:"Frais",tva:0},
{code:"7507002",nom:"Fromage Vache QR",prix:25,categorie:"Frais",tva:.07},
{code:"7508001",nom:"Sardines Titus",prix:9,categorie:"Conserves",tva:.07},
{code:"7508002",nom:"Tomate concentrée",prix:5.5,categorie:"Conserves",tva:.07},
{code:"7508003",nom:"Harissa CAP BON",prix:7,categorie:"Conserves",tva:.07},
];

const DEMO_PROMOS=[
{code:"7501001",type:"prix_barre",nouveauPrix:5.9,pourcentage:0,lotQte:0,lotPrix:0,niemeN:2,niemePct:50,texte:"Promo lait"},
{code:"7504001",type:"pourcentage",nouveauPrix:0,pourcentage:20,lotQte:0,lotPrix:0,niemeN:2,niemePct:50,texte:"-20%"},
{code:"7506001",type:"lot",nouveauPrix:0,pourcentage:0,lotQte:2,lotPrix:1,niemeN:2,niemePct:50,texte:"2 au prix de 1"},
{code:"7505002",type:"nieme",nouveauPrix:0,pourcentage:0,lotQte:0,lotPrix:0,niemeN:2,niemePct:50,texte:"2ème à -50%"},
{code:"7503005",type:"texte_libre",nouveauPrix:0,pourcentage:0,lotQte:0,lotPrix:0,niemeN:2,niemePct:50,texte:"Offre Ramadan"},
{code:"7508001",type:"lot",nouveauPrix:0,pourcentage:0,lotQte:3,lotPrix:20,niemeN:2,niemePct:50,texte:"3 pour 20 MAD"},
];

const DEFAULT_USERS=[{id:1,nom:"Admin",login:"admin",password:"1317",role:"admin",actif:true,accesVente:true,accesRapport:true,accesAdmin:true,accesMateriel:true}];

const DEVICE_TYPES=[
{id:"thermal_usb",nom:"Imprimante Thermique USB",icon:"🖨️",marques:["Epson TM-T20","Star TSP100"]},
{id:"thermal_bt",nom:"Imprimante Bluetooth",icon:"📡",marques:["Epson TM-P20","Munbyn"]},
{id:"thermal_net",nom:"Imprimante Réseau",icon:"🌐",marques:["Epson TM-T88VI","Citizen"]},
{id:"cash_drawer",nom:"Tiroir-caisse",icon:"💰",marques:["APG VB320"]},
{id:"barcode_scanner",nom:"Lecteur code-barres",icon:"📊",marques:["Honeywell","Zebra"]},
{id:"display_client",nom:"Afficheur client",icon:"📺",marques:["Epson DM-D30"]},
];
const GUIDES={thermal_usb:["Branchez le câble USB","Installez le driver","Sélectionnez le port","Test impression","Configurez largeur papier"],thermal_bt:["Allumez et activez Bluetooth","Appairez (PIN: 1234)","Sélectionnez dans Paramètres","Test impression"],thermal_net:["Connectez via Ethernet","Notez l'IP","Entrez l'IP","Port: 9100"],cash_drawer:["Connectez via RJ11","Ouverture auto après ticket","Menu → Ouvrir tiroir"],barcode_scanner:["Branchez en USB","Mode HID par défaut","Curseur dans Code article"],display_client:["Branchez USB/série","Sélectionnez port"]};
const CHATBOT_RESPONSES={scanner:"Placez le curseur dans 'Code article' puis scannez.",annuler:"Cliquez ✕ à côté de l'article. Un motif sera demandé.",imprimer:"Ticket auto après validation.",rapport:"Dashboard → CA, ventes, panier moyen.",promo:"Admin → Promotions. Types: prix barré, pourcentage, lot, nième, texte libre.",import:"Admin → Articles ou Promotions → Importer Excel.",prix:"Prix affiché au scan. Promos en rose."};

/* ═══════════════════ PERSISTENCE ═══════════════════ */
const SK={users:"cf_users",products:"cf_products",promos:"cf_promos",ventes:"cf_ventes",dash:"cf_dash"};
function ld(k,fb){try{const d=localStorage.getItem(k);return d?JSON.parse(d):fb}catch{return fb}}
function sv(k,d){try{localStorage.setItem(k,JSON.stringify(d))}catch{}}

/* ═══════════════════ STYLES ═══════════════════ */
const C={bg:"#0B0E11",surface:"#141820",card:"#1E2433",border:"#2A3040",primary:"#00D4AA",primaryDark:"#00B894",primaryGlow:"rgba(0,212,170,0.15)",accent:"#FF6B35",accentGlow:"rgba(255,107,53,0.15)",warning:"#FFB800",danger:"#FF4757",promo:"#E91E63",promoGlow:"rgba(233,30,99,0.12)",text:"#E8ECF1",textMuted:"#8892A4",textDim:"#5A6478",success:"#00D4AA"};
const iSt={width:"100%",padding:"10px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"};
const bP={padding:"12px 24px",borderRadius:10,border:"none",background:C.primary,color:"#000",fontWeight:600,cursor:"pointer",fontSize:13,fontFamily:"inherit"};
const bS={padding:"10px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,fontSize:13,cursor:"pointer",fontFamily:"inherit"};
const aB={padding:"8px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit"};
const tH={padding:"10px 12px",textAlign:"left",color:C.textMuted,fontWeight:600,fontSize:11};
const tD={padding:"10px 12px"};
const qB={width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.bg,color:C.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"};

/* ═══════════════════ UTILS ═══════════════════ */
function promoLabel(p){if(!p)return null;if(p.type==="prix_barre")return p.nouveauPrix?.toFixed(2)+" MAD";if(p.type==="pourcentage")return"-"+p.pourcentage+"%";if(p.type==="lot")return p.texte||p.lotQte+" pour "+p.lotPrix+" MAD";if(p.type==="nieme")return p.texte||p.niemeN+"ème à -"+p.niemePct+"%";return p.texte||"Promo";}

function calcPP(prod,pr,q){
  if(!pr)return{tp:prod.prix*q,rem:0};
  const b=prod.prix;
  if(pr.type==="prix_barre"){const n=pr.nouveauPrix||b;return{tp:n*q,rem:(b-n)*q};}
  if(pr.type==="pourcentage"){const n=b*(1-pr.pourcentage/100);return{tp:n*q,rem:(b-n)*q};}
  if(pr.type==="lot"&&pr.lotQte>0&&pr.lotPrix>0){
    if(pr.lotPrix<=pr.lotQte){const l=Math.floor(q/pr.lotQte),r=q%pr.lotQte,t=l*pr.lotPrix*b+r*b;return{tp:t,rem:b*q-t};}
    const l=Math.floor(q/pr.lotQte),r=q%pr.lotQte,t=l*pr.lotPrix+r*b;return{tp:t,rem:b*q-t};
  }
  if(pr.type==="nieme"){const n=pr.niemeN||2,pc=pr.niemePct||50,l=Math.floor(q/n),f=q-l,t=f*b+l*b*(1-pc/100);return{tp:t,rem:b*q-t};}
  return{tp:b*q,rem:0};
}

function readXL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>{try{const d=new Uint8Array(e.target.result),wb=XLSX.read(d,{type:"array"}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws);res(rows.map(r=>{const o={};Object.keys(r).forEach(k=>{o[k.toLowerCase().trim()]=r[k]});return o}))}catch(e){rej(e)}};r.onerror=()=>rej(new Error("err"));r.readAsArrayBuffer(file)})}
function mapPR(r){const code=String(r.code||r.barcode||r.ean||r.ref||"").trim(),nom=String(r.nom||r.name||r.designation||r.article||r.libelle||"").trim(),prix=parseFloat(r.prix||r.price||r.pu||"0"),cat=String(r.categorie||r.category||r.famille||"Divers").trim();let t=parseFloat(r.tva||r.tax||"0");if(t>1)t/=100;return{code,nom,prix:isNaN(prix)?0:prix,categorie:cat,tva:isNaN(t)?0:t}}
function mapPM(r){return{code:String(r.code||r.ref||"").trim(),type:String(r.type||r.type_promo||"texte_libre").trim().toLowerCase(),nouveauPrix:parseFloat(r.nouveau_prix||r.prix_promo||"0")||0,pourcentage:parseFloat(r.pourcentage||r.pct||r.remise||"0")||0,lotQte:parseInt(r.lot_qte||r.qte_lot||"0")||0,lotPrix:parseFloat(r.lot_prix||r.prix_lot||"0")||0,niemeN:parseInt(r.nieme_n||r.n||"2")||2,niemePct:parseFloat(r.nieme_pct||"50")||50,texte:String(r.texte||r.description||r.label||"").trim()}}

function Ov({children,onClose}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={onClose}><div onClick={e=>e.stopPropagation()}>{children}</div></div>)}
function Bg({label,color}){return(<span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:500,background:color?color+"20":C.primaryGlow,color:color||C.primary}}>{label}</span>)}
function Kpi({label,value,icon,color}){return(<div style={{padding:20,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:16}}><div style={{width:48,height:48,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:color+"18",fontSize:22}}>{icon}</div><div><div style={{fontSize:11,color:C.textMuted,marginBottom:4}}>{label}</div><div style={{fontSize:20,fontWeight:800,color:color}}>{value}</div></div></div>)}

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function CaisseFlow(){
  const[user,setUser]=useState(null);
  const[pg,setPg]=useState("login");
  const[users,setUsers]=useState(()=>ld(SK.users,DEFAULT_USERS));
  const[products,setProducts]=useState(()=>ld(SK.products,DEFAULT_PRODUCTS));
  const[promos,setPromos]=useState(()=>ld(SK.promos,DEMO_PROMOS));
  const[ventes,setVentes]=useState(()=>ld(SK.ventes,[]));
  const[panier,setPanier]=useState([]);
  const[code,setCode]=useState("");
  const[ticket,setTicket]=useState(null);
  const[cancelM,setCancelM]=useState(null);
  const[chat,setChat]=useState([{from:"bot",text:"Bonjour ! Assistant CaisseFlow 🛒"}]);
  const[chatIn,setChatIn]=useState("");
  const[chatOn,setChatOn]=useState(false);
  const[selDev,setSelDev]=useState(null);
  const[aTab,setATab]=useState("users");
  const[editU,setEditU]=useState(null);
  const[sHist,setSHist]=useState("");
  const[dCfg,setDCfg]=useState(()=>ld(SK.dash,{showCA:true,showNbVentes:true,showPanierMoyen:true,showCategories:true,showTopProduits:true}));
  const[notif,setNotif]=useState(null);
  const[editP,setEditP]=useState(null);
  const[pSearch,setPSearch]=useState("");
  const[annul,setAnnul]=useState([]);
  const[promoPreview,setPromoPreview]=useState(null);
  const[editPr,setEditPr]=useState(null);
  const[prSearch,setPrSearch]=useState("");
  const iRef=useRef(null);
  const cRef=useRef(null);
  const fRef=useRef(null);
  const pfRef=useRef(null);
  const[lf,setLf]=useState({login:"",password:""});

  useEffect(()=>{sv(SK.users,users)},[users]);
  useEffect(()=>{sv(SK.products,products)},[products]);
  useEffect(()=>{sv(SK.promos,promos)},[promos]);
  useEffect(()=>{sv(SK.ventes,ventes)},[ventes]);
  useEffect(()=>{sv(SK.dash,dCfg)},[dCfg]);

  const noti=(m,t="success")=>{setNotif({m,t});setTimeout(()=>setNotif(null),3000)};
  const gP=useCallback(c=>promos.find(p=>p.code===c),[promos]);

  const doLogin=()=>{const u=users.find(u=>u.login===lf.login&&u.password===lf.password&&u.actif);if(u){setUser(u);setPg("caisse");noti("Bienvenue "+u.nom+" !")}else noti("Identifiants incorrects","error")};

  const addArt=useCallback(cd=>{const p=products.find(x=>x.code===cd);if(!p){noti("Article non trouvé","error");return}setPanier(prev=>{const ex=prev.find(x=>x.code===cd);if(ex)return prev.map(x=>x.code===cd?{...x,qte:x.qte+1}:x);return[...prev,{...p,qte:1}]});setCode("");noti(p.nom+" ajouté")},[products]);
  const rmArt=cd=>setPanier(p=>p.filter(x=>x.code!==cd));
  const modQ=(cd,d)=>setPanier(p=>p.map(x=>x.code===cd?{...x,qte:Math.max(1,x.qte+d)}:x));
  const clearP=()=>{setPanier([]);noti("Panier vidé")};
  const askCancel=item=>setCancelM({item,motif:""});
  const doCancel=()=>{if(!cancelM)return;setAnnul(p=>[...p,{id:Date.now(),date:new Date().toISOString(),vendeur:user.nom,article:cancelM.item.nom,code:cancelM.item.code,prix:cancelM.item.prix,qte:cancelM.item.qte,motif:cancelM.motif||"—"}]);rmArt(cancelM.item.code);setCancelM(null);noti(cancelM.item.nom+" annulé","warning")};

  const panierP=panier.map(it=>{const pr=gP(it.code);const c=calcPP(it,pr,it.qte);return{...it,promo:pr,pc:c}});
  const totHT=panierP.reduce((s,p)=>s+p.pc.tp,0);
  const totRem=panierP.reduce((s,p)=>s+p.pc.rem,0);
  const totTVA=panierP.reduce((s,p)=>s+p.pc.tp*p.tva,0);

  const valider=()=>{if(!panier.length)return;const v={id:Date.now(),date:new Date().toISOString(),vendeur:user.nom,articles:panierP.map(p=>({nom:p.nom,code:p.code,prix:p.prix,qte:p.qte,categorie:p.categorie,promoLabel:p.promo?promoLabel(p.promo):null,prixPromo:p.pc.tp,remise:p.pc.rem})),total:totHT,tva:totTVA,totalTTC:totHT+totTVA,remise:totRem};setVentes(prev=>[v,...prev]);setTicket(v);setPanier([]);noti("Vente validée ✓")};
  const prevPrix=cd=>{for(const v of ventes){const a=v.articles.find(a=>a.code===cd);if(a)return{prix:a.prix,date:new Date(v.date).toLocaleDateString("fr-FR")}}return null};

  const impArt=async e=>{const f=e.target.files?.[0];if(!f)return;try{const rows=await readXL(f);const m=rows.map(mapPR).filter(r=>r.code&&r.nom);if(!m.length){noti("Aucun article valide","error");return}let a=0,u=0;setProducts(prev=>{const n=[...prev];m.forEach(x=>{const i=n.findIndex(p=>p.code===x.code);if(i>=0){n[i]={...n[i],...x};u++}else{n.push(x);a++}});return n});noti(`Import: ${a} ajouté(s), ${u} mis à jour`)}catch{noti("Erreur lecture","error")}if(fRef.current)fRef.current.value=""};
  const impPromo=async e=>{const f=e.target.files?.[0];if(!f)return;try{const rows=await readXL(f);const m=rows.map(mapPM).filter(r=>r.code);if(!m.length){noti("Aucune promo valide","error");return}setPromoPreview({fn:f.name,promos:m,sel:m.map(()=>true)})}catch{noti("Erreur lecture","error")}if(pfRef.current)pfRef.current.value=""};
  const confPromo=()=>{if(!promoPreview)return;const toI=promoPreview.promos.filter((_,i)=>promoPreview.sel[i]);let a=0,u=0;setPromos(prev=>{const n=[...prev];toI.forEach(p=>{const i=n.findIndex(x=>x.code===p.code);if(i>=0){n[i]=p;u++}else{n.push(p);a++}});return n});setPromoPreview(null);noti(`Promos: ${a} ajoutée(s), ${u} mise(s) à jour`)};

  const updProd=(cd,upd)=>{setProducts(p=>p.map(x=>x.code===cd?{...x,...upd}:x));noti("Article modifié ✓");setEditP(null)};
  const delProd=cd=>{setProducts(p=>p.filter(x=>x.code!==cd));noti("Supprimé")};
  const savePro=p=>{setPromos(prev=>{const i=prev.findIndex(x=>x.code===p.code);if(i>=0){const n=[...prev];n[i]=p;return n}return[...prev,p]});setEditPr(null);noti("Promo enregistrée ✓")};
  const delPro=cd=>{setPromos(p=>p.filter(x=>x.code!==cd));noti("Promo supprimée")};

  const today=new Date().toLocaleDateString("fr-FR");
  const vJ=ventes.filter(v=>new Date(v.date).toLocaleDateString("fr-FR")===today);
  const caJ=vJ.reduce((s,v)=>s+v.totalTTC,0);
  const pmJ=vJ.length?caJ/vJ.length:0;
  const remJ=vJ.reduce((s,v)=>s+(v.remise||0),0);
  const catJ={};vJ.forEach(v=>v.articles.forEach(a=>{catJ[a.categorie||"Divers"]=(catJ[a.categorie||"Divers"]||0)+(a.prixPromo||a.prix*a.qte)}));
  const topP={};vJ.forEach(v=>v.articles.forEach(a=>{topP[a.nom]=(topP[a.nom]||0)+a.qte}));
  const topPA=Object.entries(topP).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const sendC=()=>{if(!chatIn.trim())return;const m=chatIn.toLowerCase();setChat(p=>[...p,{from:"user",text:chatIn}]);let r="Essayez: scanner, imprimer, rapport, annuler, import, promo, prix";for(const[k,v]of Object.entries(CHATBOT_RESPONSES))if(m.includes(k)){r=v;break}setTimeout(()=>setChat(p=>[...p,{from:"bot",text:r}]),400);setChatIn("")};
  useEffect(()=>{cRef.current?.scrollIntoView({behavior:"smooth"})},[chat]);

  const saveU=u=>{if(u.id)setUsers(p=>p.map(x=>x.id===u.id?u:x));else setUsers(p=>[...p,{...u,id:Date.now()}]);setEditU(null);noti("Utilisateur enregistré")};
  const togU=id=>setUsers(p=>p.map(u=>u.id===id?{...u,actif:!u.actif}:u));
  const canA=p=>{if(!user)return false;if(user.role==="admin")return true;const m={caisse:"accesVente",dashboard:"accesRapport",admin:"accesAdmin",materiel:"accesMateriel"};return user[m[p]]!==false};
  const nav=[{id:"caisse",label:"Caisse",icon:"🛒"},{id:"dashboard",label:"Dashboard",icon:"📊"},{id:"materiel",label:"Matériel",icon:"🔧"},{id:"admin",label:"Admin",icon:"⚙️"}];

  /* ── LOGIN PAGE ── */
  if(pg==="login") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 30% 20%,rgba(0,212,170,0.08),transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(255,107,53,0.06),transparent 50%),${C.bg}`,fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{width:400,padding:48,borderRadius:20,background:C.surface,border:`1px solid ${C.border}`,boxShadow:"0 24px 80px rgba(0,0,0,0.4)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:36,fontWeight:800,marginBottom:8}}><span style={{color:C.primary}}>Caisse</span><span style={{color:C.text}}>Flow</span></div>
          <p style={{color:C.textMuted,fontSize:14,margin:0}}>Gestion de caisse intelligente</p>
        </div>
        {notif&&<div style={{padding:"10px 16px",borderRadius:8,marginBottom:16,fontSize:13,background:notif.t==="error"?"rgba(255,71,87,0.1)":"rgba(0,212,170,0.1)",color:notif.t==="error"?C.danger:C.primary}}>{notif.m}</div>}
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,color:C.textMuted,fontWeight:500,marginBottom:6,display:"block"}}>Identifiant</label>
          <input value={lf.login} onChange={e=>setLf(p=>({...p,login:e.target.value}))} placeholder="Votre identifiant" style={{...iSt,fontSize:14}}/>
        </div>
        <div style={{marginBottom:28}}>
          <label style={{fontSize:12,color:C.textMuted,fontWeight:500,marginBottom:6,display:"block"}}>Mot de passe</label>
          <input type="password" value={lf.password} onChange={e=>setLf(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" style={{...iSt,fontSize:14}}/>
        </div>
        <button onClick={doLogin} style={{width:"100%",padding:14,borderRadius:10,border:"none",fontSize:15,fontWeight:700,background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,color:"#000",cursor:"pointer",fontFamily:"inherit"}}>Se connecter</button>
      </div>
    </div>
  );

  /* ── MAIN LAYOUT ── */
  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:22,fontWeight:800}}><span style={{color:C.primary}}>Caisse</span><span>Flow</span></div>
          <div style={{width:1,height:28,background:C.border,margin:"0 8px"}}/>
          <nav style={{display:"flex",gap:4}}>{nav.filter(n=>canA(n.id)).map(n=>(
            <button key={n.id} onClick={()=>setPg(n.id)} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:pg===n.id?C.primaryGlow:"transparent",color:pg===n.id?C.primary:C.textMuted,fontWeight:pg===n.id?600:400,fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}><span>{n.icon}</span>{n.label}</button>
          ))}</nav>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:12,color:C.textMuted}}>{user?.nom} • {user?.role}</span>
          <button onClick={()=>{setUser(null);setPg("login")}} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:C.danger,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Déconnexion</button>
        </div>
      </header>

      {notif&&<div style={{position:"fixed",top:70,right:24,padding:"12px 20px",borderRadius:10,zIndex:200,background:notif.t==="error"?C.danger:notif.t==="warning"?C.warning:C.primary,color:notif.t==="warning"?"#000":"#fff",fontSize:13,fontWeight:500,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",animation:"slideIn 0.3s ease"}}>{notif.m}</div>}

      <main style={{padding:24,maxWidth:1440,margin:"0 auto"}}>
        {pg==="caisse"&&<CaisseP products={products} panier={panierP} code={code} setCode={setCode} addArt={addArt} rmArt={rmArt} modQ={modQ} askCancel={askCancel} clearP={clearP} totHT={totHT} totTVA={totTVA} totRem={totRem} valider={valider} prevPrix={prevPrix} gP={gP} ticket={ticket} setTicket={setTicket} iRef={iRef}/>}
        {pg==="dashboard"&&<DashP vJ={vJ} caJ={caJ} pmJ={pmJ} remJ={remJ} catJ={catJ} topPA={topPA} ventes={ventes} sHist={sHist} setSHist={setSHist} dCfg={dCfg} today={today}/>}
        {pg==="materiel"&&<MatP selDev={selDev} setSelDev={setSelDev}/>}
        {pg==="admin"&&<AdminP users={users} aTab={aTab} setATab={setATab} editU={editU} setEditU={setEditU} saveU={saveU} togU={togU} dCfg={dCfg} setDCfg={setDCfg} products={products} editP={editP} setEditP={setEditP} updProd={updProd} delProd={delProd} pSearch={pSearch} setPSearch={setPSearch} impArt={impArt} fRef={fRef} promos={promos} prSearch={prSearch} setPrSearch={setPrSearch} editPr={editPr} setEditPr={setEditPr} savePro={savePro} delPro={delPro} impPromo={impPromo} pfRef={pfRef} promoPreview={promoPreview} setPromoPreview={setPromoPreview} confPromo={confPromo} noti={noti}/>}
      </main>

      {cancelM&&(<Ov onClose={()=>setCancelM(null)}><div style={{width:420,padding:28,borderRadius:16,background:C.surface,border:`1px solid ${C.danger}40`}}><h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:700}}>🚫 Annuler article</h3><div style={{padding:14,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,marginBottom:16}}><div style={{fontSize:14,fontWeight:600}}>{cancelM.item.nom}</div><div style={{fontSize:12,color:C.textMuted}}>{cancelM.item.prix.toFixed(2)} MAD × {cancelM.item.qte}</div></div><div style={{marginBottom:16}}><label style={{fontSize:12,color:C.textMuted,marginBottom:6,display:"block"}}>Motif *</label><select value={cancelM.motif} onChange={e=>setCancelM(p=>({...p,motif:e.target.value}))} style={{...iSt,cursor:"pointer"}}><option value="">-- Sélectionnez --</option><option value="Erreur de saisie">Erreur de saisie</option><option value="Client changé d'avis">Client changé d'avis</option><option value="Prix incorrect">Prix incorrect</option><option value="Double scan">Double scan</option></select></div><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={()=>setCancelM(null)} style={bS}>Retour</button><button onClick={doCancel} disabled={!cancelM.motif} style={{padding:"10px 24px",borderRadius:8,border:"none",fontFamily:"inherit",background:cancelM.motif?C.danger:C.border,color:cancelM.motif?"#fff":C.textDim,fontWeight:600,cursor:cancelM.motif?"pointer":"default",fontSize:13}}>Confirmer</button></div></div></Ov>)}

      <button onClick={()=>setChatOn(!chatOn)} style={{position:"fixed",bottom:24,right:24,width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,border:"none",cursor:"pointer",boxShadow:`0 4px 20px ${C.primaryGlow}`,fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",zIndex:150}}>{chatOn?"✕":"💬"}</button>
      {chatOn&&(<div style={{position:"fixed",bottom:92,right:24,width:360,height:480,background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:"0 16px 64px rgba(0,0,0,0.4)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:150}}><div style={{padding:"16px 20px",background:C.card,borderBottom:`1px solid ${C.border}`}}><div style={{fontWeight:700,fontSize:15}}>🤖 Assistant CaisseFlow</div></div><div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>{chat.map((m,i)=>(<div key={i} style={{alignSelf:m.from==="user"?"flex-end":"flex-start",maxWidth:"80%",padding:"10px 14px",borderRadius:12,background:m.from==="user"?C.primary:C.card,color:m.from==="user"?"#000":C.text,fontSize:13,lineHeight:1.5}}>{m.text}</div>))}<div ref={cRef}/></div><div style={{padding:12,borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}><input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendC()} placeholder="Votre question..." style={{flex:1,...iSt,borderRadius:10}}/><button onClick={sendC} style={{padding:"10px 16px",borderRadius:10,border:"none",background:C.primary,color:"#000",fontWeight:600,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>↑</button></div></div>)}

      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus{border-color:${C.primary}!important;box-shadow:0 0 0 3px ${C.primaryGlow}!important}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}*{box-sizing:border-box}`}</style>
    </div>
  );
}

/* ═══════════════════ CAISSE PAGE ═══════════════════ */
function CaisseP({products,panier,code,setCode,addArt,rmArt,modQ,askCancel,clearP,totHT,totTVA,totRem,valider,prevPrix,gP,ticket,setTicket,iRef}){
  const[sCat,setSCat]=useState("Tous");
  const[sPr,setSPr]=useState(false);
  const cats=["Tous",...new Set(products.map(p=>p.categorie))];
  let fl=sCat==="Tous"?products:products.filter(p=>p.categorie===sCat);
  if(sPr)fl=fl.filter(p=>gP(p.code));

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 420px",gap:24,animation:"fadeIn 0.3s ease"}}>
      <div>
        <div style={{display:"flex",gap:12,marginBottom:20,padding:20,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`}}>
          <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16}}>📊</span><input ref={iRef} value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&code)addArt(code)}} placeholder="Scanner ou saisir le code article..." style={{...iSt,paddingLeft:42,fontSize:14}}/></div>
          <button onClick={()=>code&&addArt(code)} style={bP}>Ajouter</button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          {cats.map(c=>(<button key={c} onClick={()=>setSCat(c)} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${sCat===c?C.primary:C.border}`,background:sCat===c?C.primaryGlow:"transparent",color:sCat===c?C.primary:C.textMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:sCat===c?600:400}}>{c}</button>))}
          <div style={{width:1,height:20,background:C.border,margin:"0 4px"}}/>
          <button onClick={()=>setSPr(!sPr)} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${sPr?C.promo:C.border}`,background:sPr?C.promoGlow:"transparent",color:sPr?C.promo:C.textMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:sPr?600:400}}>🏷️ Promos</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
          {fl.map(p=>{const pv=prevPrix(p.code);const pr=gP(p.code);const hp=!!pr;return (
            <button key={p.code} onClick={()=>addArt(p.code)} style={{padding:14,borderRadius:12,border:`1px solid ${hp?C.promo+"60":C.border}`,background:hp?C.promoGlow:C.surface,cursor:"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"inherit",position:"relative",overflow:"hidden"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=hp?C.promo:C.primary;e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor=hp?C.promo+"60":C.border;e.currentTarget.style.transform="translateY(0)"}}>
              {hp&&<div style={{position:"absolute",top:8,right:-24,background:C.promo,color:"#fff",fontSize:9,fontWeight:700,padding:"2px 28px",transform:"rotate(35deg)"}}>PROMO</div>}
              <div style={{fontSize:11,color:C.textMuted,marginBottom:4}}>{p.categorie}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:8,lineHeight:1.3,minHeight:34}}>{p.nom}</div>
              {hp&&(pr.type==="prix_barre"||pr.type==="pourcentage")?(<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,color:C.textDim,textDecoration:"line-through"}}>{p.prix.toFixed(2)}</span><span style={{fontSize:17,fontWeight:800,color:C.promo}}>{pr.type==="prix_barre"?pr.nouveauPrix?.toFixed(2):(p.prix*(1-pr.pourcentage/100)).toFixed(2)}</span><span style={{fontSize:11,color:C.textDim}}>MAD</span></div>):(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,fontWeight:700,color:C.primary}}>{p.prix.toFixed(2)}</span><span style={{fontSize:11,color:C.textDim}}>MAD</span></div>)}
              {hp&&<div style={{marginTop:6,padding:"4px 10px",borderRadius:6,background:C.promoGlow,border:`1px solid ${C.promo}30`,fontSize:11,fontWeight:600,color:C.promo}}>🏷️ {promoLabel(pr)}</div>}
              {pv&&<div style={{marginTop:6,padding:"3px 8px",borderRadius:6,background:"rgba(255,184,0,0.1)",fontSize:10,color:C.warning}}>Dernier: {pv.prix.toFixed(2)} ({pv.date})</div>}
              <div style={{fontSize:10,color:C.textDim,marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>{p.code}</div>
            </button>
          )})}
        </div>
      </div>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:84,height:"calc(100vh - 108px)"}}>
        <div style={{padding:"20px 20px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{margin:0,fontSize:16,fontWeight:700}}>🧾 Panier</h3><span style={{fontSize:12,color:C.textMuted}}>{panier.length} art.</span></div>
        <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
          {panier.length===0?(<div style={{textAlign:"center",padding:40,color:C.textDim}}><div style={{fontSize:40,marginBottom:12}}>🛒</div><div style={{fontSize:13}}>Scannez ou cliquez</div></div>):panier.map(p=>(
            <div key={p.code} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 8px",borderBottom:`1px solid ${C.border}22`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nom}</div>
                <div style={{fontSize:11,color:C.textMuted}}>{p.pc.rem>0?(<><span style={{textDecoration:"line-through"}}>{(p.prix*p.qte).toFixed(2)}</span>{" → "}<span style={{color:C.promo,fontWeight:600}}>{p.pc.tp.toFixed(2)}</span></>):(<span>{p.prix.toFixed(2)} × {p.qte}</span>)}</div>
                {p.promo&&<div style={{fontSize:10,color:C.promo,fontWeight:600,marginTop:2}}>🏷️ {promoLabel(p.promo)}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:3}}><button onClick={()=>modQ(p.code,-1)} style={qB}>−</button><span style={{fontSize:13,fontWeight:600,width:22,textAlign:"center"}}>{p.qte}</span><button onClick={()=>modQ(p.code,1)} style={qB}>+</button></div>
              <div style={{fontSize:14,fontWeight:700,color:p.pc.rem>0?C.promo:C.primary,minWidth:55,textAlign:"right"}}>{p.pc.tp.toFixed(2)}</div>
              <button onClick={()=>askCancel(p)} style={{background:"rgba(255,71,87,0.1)",border:"1px solid rgba(255,71,87,0.2)",borderRadius:6,color:C.danger,cursor:"pointer",fontSize:13,padding:"4px 8px",fontFamily:"inherit",fontWeight:600}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{padding:16,borderTop:`1px solid ${C.border}`,background:C.card}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13,color:C.textMuted}}><span>Sous-total HT</span><span>{totHT.toFixed(2)} MAD</span></div>
          {totRem>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13,color:C.promo,fontWeight:600}}><span>🏷️ Remise promos</span><span>-{totRem.toFixed(2)} MAD</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:13,color:C.textMuted}}><span>TVA</span><span>{totTVA.toFixed(2)} MAD</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,fontSize:20,fontWeight:800,color:C.primary}}><span>TOTAL TTC</span><span>{(totHT+totTVA).toFixed(2)} MAD</span></div>
          <div style={{display:"flex",gap:8}}><button onClick={clearP} style={bS}>🗑️ Vider</button><button onClick={valider} disabled={!panier.length} style={{flex:2,padding:12,borderRadius:10,border:"none",background:panier.length?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:C.border,color:panier.length?"#000":C.textDim,fontSize:14,fontWeight:700,cursor:panier.length?"pointer":"default",fontFamily:"inherit"}}>✓ Valider & Imprimer</button></div>
        </div>
      </div>
      {ticket&&(<Ov onClose={()=>setTicket(null)}><div style={{width:340,background:"#fff",borderRadius:4,padding:"24px 20px",color:"#000",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}><div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:18,fontWeight:700}}>CaisseFlow</div><div style={{fontSize:10,color:"#666"}}>Votre Supérette • ICE: 00123456789012</div><div style={{borderTop:"1px dashed #999",margin:"10px 0"}}/><div style={{fontSize:10}}>Ticket #{String(ticket.id).slice(-6)} • {new Date(ticket.date).toLocaleString("fr-FR")}</div><div style={{fontSize:10,color:"#666"}}>Vendeur: {ticket.vendeur}</div></div><div style={{borderTop:"1px dashed #999",margin:"8px 0"}}/>{ticket.articles.map((a,i)=>(<div key={i} style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span>{a.nom} ×{a.qte}</span><span style={{fontWeight:600}}>{a.prixPromo.toFixed(2)}</span></div>{a.promoLabel&&<div style={{fontSize:9,color:"#E91E63",fontWeight:600,marginTop:1}}>🏷️ {a.promoLabel}{a.remise>0?` (-${a.remise.toFixed(2)})`:""}</div>}</div>))}<div style={{borderTop:"1px dashed #999",margin:"10px 0"}}/>{ticket.remise>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#E91E63",fontWeight:600}}><span>Remise</span><span>-{ticket.remise.toFixed(2)}</span></div>}<div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span>HT</span><span>{ticket.total.toFixed(2)}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span>TVA</span><span>{ticket.tva.toFixed(2)}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800,marginTop:6}}><span>TOTAL TTC</span><span>{ticket.totalTTC.toFixed(2)} MAD</span></div><div style={{borderTop:"1px dashed #999",margin:"10px 0"}}/><div style={{textAlign:"center",fontSize:10,color:"#666"}}>Merci ! À bientôt</div><button onClick={()=>setTicket(null)} style={{width:"100%",marginTop:16,padding:10,borderRadius:6,border:"none",background:"#000",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Fermer</button></div></Ov>)}
    </div>
  );
}

/* ═══════════════════ DASHBOARD ═══════════════════ */
function DashP({vJ,caJ,pmJ,remJ,catJ,topPA,ventes,sHist,setSHist,dCfg,today}){
  const mx=Math.max(...Object.values(catJ),1);
  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:700}}>📊 Rapport du jour</h2>
      <p style={{margin:"0 0 24px",color:C.textMuted,fontSize:13}}>{today}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:24}}>
        {dCfg.showCA&&<Kpi label="CA" value={caJ.toFixed(2)+" MAD"} icon="💰" color={C.primary}/>}
        {dCfg.showNbVentes&&<Kpi label="Ventes" value={vJ.length} icon="🧾" color={C.accent}/>}
        {dCfg.showPanierMoyen&&<Kpi label="Panier moyen" value={pmJ.toFixed(2)+" MAD"} icon="🛒" color={C.warning}/>}
        <Kpi label="Remises" value={"-"+remJ.toFixed(2)} icon="🏷️" color={C.promo}/>
        <Kpi label="Articles vendus" value={vJ.reduce((s,v)=>s+v.articles.reduce((ss,a)=>ss+a.qte,0),0)} icon="📦" color="#a855f7"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        {dCfg.showCategories&&(<div style={{padding:20,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`}}><h4 style={{margin:"0 0 16px",fontSize:14,fontWeight:600,color:C.textMuted}}>Par catégorie</h4>{Object.entries(catJ).sort((a,b)=>b[1]-a[1]).map(([c,v])=>(<div key={c} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>{c}</span><span style={{color:C.primary,fontWeight:600}}>{v.toFixed(2)}</span></div><div style={{height:6,borderRadius:3,background:C.bg}}><div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${C.primary},${C.primaryDark})`,width:`${(v/mx)*100}%`}}/></div></div>))}{!Object.keys(catJ).length&&<div style={{color:C.textDim,fontSize:13}}>Aucune vente</div>}</div>)}
        {dCfg.showTopProduits&&(<div style={{padding:20,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`}}><h4 style={{margin:"0 0 16px",fontSize:14,fontWeight:600,color:C.textMuted}}>Top 5</h4>{topPA.map(([n,q],i)=>(<div key={n} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><span style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,background:i===0?C.primaryGlow:C.bg,color:i===0?C.primary:C.textMuted,border:`1px solid ${C.border}`}}>{i+1}</span><div style={{flex:1,fontSize:12,fontWeight:500}}>{n}</div><span style={{fontSize:13,fontWeight:700,color:C.accent}}>{q}</span></div>))}{!topPA.length&&<div style={{color:C.textDim,fontSize:13}}>Aucune vente</div>}</div>)}
      </div>
      <div style={{padding:20,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h4 style={{margin:0,fontSize:14,fontWeight:600,color:C.textMuted}}>Historique</h4><input value={sHist} onChange={e=>setSHist(e.target.value)} placeholder="Rechercher..." style={{...iSt,width:200,fontSize:12}}/></div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["#","Date","Vendeur","Art.","Remise","TTC"].map(h=>(<th key={h} style={tH}>{h}</th>))}</tr></thead>
          <tbody>{ventes.filter(v=>!sHist||v.vendeur.toLowerCase().includes(sHist.toLowerCase())||v.articles.some(a=>a.nom.toLowerCase().includes(sHist.toLowerCase()))).slice(0,20).map(v=>(<tr key={v.id} style={{borderBottom:`1px solid ${C.border}22`}}><td style={{...tD,fontFamily:"'JetBrains Mono',monospace",color:C.textDim}}>#{String(v.id).slice(-6)}</td><td style={tD}>{new Date(v.date).toLocaleString("fr-FR")}</td><td style={tD}>{v.vendeur}</td><td style={{...tD,color:C.textMuted}}>{v.articles.length}</td><td style={{...tD,color:v.remise>0?C.promo:C.textDim,fontWeight:v.remise>0?600:400}}>{v.remise>0?"-"+v.remise.toFixed(2):"—"}</td><td style={{...tD,fontWeight:700,color:C.primary}}>{v.totalTTC.toFixed(2)}</td></tr>))}{!ventes.length&&<tr><td colSpan={6} style={{padding:24,textAlign:"center",color:C.textDim}}>Aucune vente</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════ MATÉRIEL ═══════════════════ */
function MatP({selDev,setSelDev}){return (
  <div style={{animation:"fadeIn 0.3s ease"}}>
    <h2 style={{margin:"0 0 24px",fontSize:22,fontWeight:700}}>🔧 Matériel</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginBottom:24}}>{DEVICE_TYPES.map(d=>(<button key={d.id} onClick={()=>setSelDev(selDev?.id===d.id?null:d)} style={{padding:20,borderRadius:14,textAlign:"left",cursor:"pointer",fontFamily:"inherit",background:selDev?.id===d.id?C.primaryGlow:C.surface,border:`1px solid ${selDev?.id===d.id?C.primary:C.border}`}}><div style={{fontSize:32,marginBottom:10}}>{d.icon}</div><div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{d.nom}</div><div style={{fontSize:11,color:C.textMuted}}>{d.marques.join(", ")}</div></button>))}</div>
    {selDev&&(<div style={{padding:24,borderRadius:14,background:C.surface,border:`1px solid ${C.primary}`,animation:"fadeIn 0.3s ease"}}><h3 style={{margin:"0 0 16px",fontSize:18,fontWeight:700}}>{selDev.icon} {selDev.nom}</h3><div style={{display:"flex",flexDirection:"column",gap:12}}>{GUIDES[selDev.id]?.map((s,i)=>(<div key={i} style={{display:"flex",gap:14,padding:14,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}><div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:C.primaryGlow,color:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{i+1}</div><div style={{fontSize:13,lineHeight:1.6}}>{s}</div></div>))}</div></div>)}
  </div>
);}

/* ═══════════════════ ADMIN ═══════════════════ */
function AdminP({users,aTab,setATab,editU,setEditU,saveU,togU,dCfg,setDCfg,products,editP,setEditP,updProd,delProd,pSearch,setPSearch,impArt,fRef,promos,prSearch,setPrSearch,editPr,setEditPr,savePro,delPro,impPromo,pfRef,promoPreview,setPromoPreview,confPromo,noti}){
  const tabs=[{id:"users",label:"Utilisateurs",icon:"👤"},{id:"articles",label:"Articles",icon:"📦"},{id:"promos",label:"Promotions",icon:"🏷️"},{id:"dashboard_config",label:"Dashboard",icon:"📊"},{id:"parametres",label:"Paramètres",icon:"⚙️"}];
  const fp=products.filter(p=>!pSearch||p.nom.toLowerCase().includes(pSearch.toLowerCase())||p.code.includes(pSearch));
  const fpr=promos.filter(p=>{if(!prSearch)return true;const s=prSearch.toLowerCase();const pr=products.find(x=>x.code===p.code);return p.code.includes(s)||(pr&&pr.nom.toLowerCase().includes(s))||(p.texte&&p.texte.toLowerCase().includes(s))});

  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <h2 style={{margin:"0 0 24px",fontSize:22,fontWeight:700}}>⚙️ Administration</h2>
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>{tabs.map(t=>(<button key={t.id} onClick={()=>setATab(t.id)} style={{padding:"10px 20px",borderRadius:10,border:`1px solid ${aTab===t.id?(t.id==="promos"?C.promo:C.primary):C.border}`,background:aTab===t.id?(t.id==="promos"?C.promoGlow:C.primaryGlow):"transparent",color:aTab===t.id?(t.id==="promos"?C.promo:C.primary):C.textMuted,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:aTab===t.id?600:400}}>{t.icon} {t.label}</button>))}</div>

      {aTab==="users"&&(<div>
        <button onClick={()=>setEditU({nom:"",login:"",password:"",role:"vendeur",actif:true,accesVente:true,accesRapport:false,accesAdmin:false,accesMateriel:false})} style={{...bP,marginBottom:16}}>+ Utilisateur</button>
        <div style={{display:"grid",gap:12}}>{users.map(u=>(<div key={u.id} style={{padding:20,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",opacity:u.actif?1:0.5}}><div style={{display:"flex",alignItems:"center",gap:16}}><div style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:u.role==="admin"?C.accentGlow:C.primaryGlow,color:u.role==="admin"?C.accent:C.primary,fontSize:18,fontWeight:700}}>{u.nom[0]}</div><div><div style={{fontWeight:600,fontSize:14}}>{u.nom}</div><div style={{fontSize:12,color:C.textMuted}}>@{u.login} • {u.role}</div><div style={{display:"flex",gap:6,marginTop:4}}>{u.accesVente&&<Bg label="Vente"/>}{u.accesRapport&&<Bg label="Rapport"/>}{u.accesAdmin&&<Bg label="Admin"/>}</div></div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setEditU({...u})} style={aB}>Modifier</button><button onClick={()=>togU(u.id)} style={{...aB,color:u.actif?C.danger:C.success}}>{u.actif?"Désactiver":"Activer"}</button></div></div>))}</div>
        {editU&&<UModal user={editU} onSave={saveU} onClose={()=>setEditU(null)}/>}
      </div>)}

      {aTab==="articles"&&(<div>
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}><input type="file" ref={fRef} accept=".xlsx,.xls,.csv" onChange={impArt} style={{display:"none"}}/><button onClick={()=>fRef.current?.click()} style={{padding:"12px 24px",borderRadius:10,border:`2px dashed ${C.primary}`,background:C.primaryGlow,color:C.primary,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>📥 Importer Excel</button><input value={pSearch} onChange={e=>setPSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{...iSt,width:240}}/><span style={{marginLeft:"auto",fontSize:12,color:C.textMuted}}>{products.length} articles</span></div>
        <div style={{borderRadius:14,background:C.surface,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{maxHeight:600,overflowY:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead style={{position:"sticky",top:0,background:C.card,zIndex:2}}><tr><th style={tH}>Code</th><th style={tH}>Nom</th><th style={tH}>Prix</th><th style={tH}>Cat.</th><th style={tH}>TVA</th><th style={tH}>Promo</th><th style={{...tH,textAlign:"center"}}>Actions</th></tr></thead><tbody>{fp.map(p=>{const pr=promos.find(x=>x.code===p.code);return(<tr key={p.code} style={{borderBottom:`1px solid ${C.border}22`}}><td style={{...tD,fontFamily:"'JetBrains Mono',monospace",color:C.textDim}}>{p.code}</td><td style={{...tD,fontWeight:500}}>{p.nom}</td><td style={{...tD,fontWeight:700,color:C.primary}}>{p.prix.toFixed(2)}</td><td style={tD}>{p.categorie}</td><td style={tD}>{(p.tva*100).toFixed(0)}%</td><td style={tD}>{pr?<Bg label={promoLabel(pr)} color={C.promo}/>:<span style={{color:C.textDim}}>—</span>}</td><td style={{...tD,textAlign:"center"}}><button onClick={()=>setEditP({...p})} style={{...aB,padding:"4px 10px",fontSize:11,marginRight:4}}>✏️</button><button onClick={()=>{if(confirm('Supprimer "'+p.nom+'" ?'))delProd(p.code)}} style={{...aB,padding:"4px 10px",fontSize:11,color:C.danger}}>🗑️</button></td></tr>)})}</tbody></table></div></div>
        {editP&&<PModal product={editP} onSave={updProd} onClose={()=>setEditP(null)}/>}
      </div>)}

      {aTab==="promos"&&(<div>
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}><input type="file" ref={pfRef} accept=".xlsx,.xls,.csv" onChange={impPromo} style={{display:"none"}}/><button onClick={()=>pfRef.current?.click()} style={{padding:"12px 24px",borderRadius:10,border:`2px dashed ${C.promo}`,background:C.promoGlow,color:C.promo,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>📥 Importer Promos</button><button onClick={()=>setEditPr({code:"",type:"prix_barre",nouveauPrix:0,pourcentage:0,lotQte:2,lotPrix:1,niemeN:2,niemePct:50,texte:""})} style={{padding:"12px 24px",borderRadius:10,border:"none",background:C.promo,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>+ Promo</button><input value={prSearch} onChange={e=>setPrSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{...iSt,width:240}}/><span style={{marginLeft:"auto",fontSize:12,color:C.textMuted}}>{promos.length} promo(s)</span></div>
        <div style={{padding:16,borderRadius:10,background:C.promoGlow,border:`1px solid ${C.promo}30`,marginBottom:20,fontSize:12,color:C.textMuted,lineHeight:1.7}}><span style={{fontWeight:700,color:C.promo}}>📋 Format :</span> code, type (prix_barre/pourcentage/lot/nieme/texte_libre), nouveau_prix, pourcentage, lot_qte, lot_prix, nieme_n, nieme_pct, texte</div>
        {promoPreview&&(<div style={{padding:24,borderRadius:14,background:C.surface,border:`2px solid ${C.promo}`,marginBottom:24,animation:"fadeIn 0.3s ease"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.promo}}>📥 Aperçu import</h3><p style={{margin:"4px 0 0",fontSize:12,color:C.textMuted}}>{promoPreview.fn} — {promoPreview.promos.length} promos</p></div><div style={{display:"flex",gap:8}}><button onClick={()=>setPromoPreview(null)} style={bS}>Annuler</button><button onClick={confPromo} style={{...bP,background:C.promo,color:"#fff"}}>✓ Importer {promoPreview.sel.filter(Boolean).length}</button></div></div><div style={{maxHeight:300,overflowY:"auto",borderRadius:10,border:`1px solid ${C.border}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead style={{background:C.card}}><tr><th style={tH}><input type="checkbox" checked={promoPreview.sel.every(Boolean)} onChange={e=>setPromoPreview(p=>({...p,sel:p.sel.map(()=>e.target.checked)}))} style={{accentColor:C.promo}}/></th><th style={tH}>Code</th><th style={tH}>Article</th><th style={tH}>Type</th><th style={tH}>Détail</th></tr></thead><tbody>{promoPreview.promos.map((p,i)=>{const pr=products.find(x=>x.code===p.code);return(<tr key={i} style={{opacity:promoPreview.sel[i]?1:0.4,borderBottom:`1px solid ${C.border}22`}}><td style={tD}><input type="checkbox" checked={promoPreview.sel[i]} onChange={e=>setPromoPreview(pv=>({...pv,sel:pv.sel.map((s,j)=>j===i?e.target.checked:s)}))} style={{accentColor:C.promo}}/></td><td style={{...tD,fontFamily:"monospace"}}>{p.code}</td><td style={tD}>{pr?pr.nom:<span style={{color:C.danger}}>⚠ ?</span>}</td><td style={tD}><Bg label={p.type} color={C.promo}/></td><td style={tD}>{promoLabel(p)}</td></tr>)})}</tbody></table></div></div>)}
        <div style={{borderRadius:14,background:C.surface,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{maxHeight:500,overflowY:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead style={{position:"sticky",top:0,background:C.card,zIndex:2}}><tr><th style={tH}>Code</th><th style={tH}>Article</th><th style={tH}>Type</th><th style={tH}>Ancien</th><th style={tH}>Promo</th><th style={{...tH,textAlign:"center"}}>Actions</th></tr></thead><tbody>{fpr.map(p=>{const pr=products.find(x=>x.code===p.code);return(<tr key={p.code} style={{borderBottom:`1px solid ${C.border}22`}}><td style={{...tD,fontFamily:"monospace",color:C.textDim}}>{p.code}</td><td style={{...tD,fontWeight:500}}>{pr?pr.nom:"—"}</td><td style={tD}><Bg label={p.type.replace("_"," ")} color={C.promo}/></td><td style={tD}>{pr?<span style={{textDecoration:p.type==="prix_barre"||p.type==="pourcentage"?"line-through":"none",color:C.textDim}}>{pr.prix.toFixed(2)}</span>:"—"}</td><td style={{...tD,color:C.promo,fontWeight:600}}>{promoLabel(p)}</td><td style={{...tD,textAlign:"center"}}><button onClick={()=>setEditPr({...p})} style={{...aB,padding:"4px 10px",fontSize:11,marginRight:4}}>✏️</button><button onClick={()=>{if(confirm("Supprimer ?"))delPro(p.code)}} style={{...aB,padding:"4px 10px",fontSize:11,color:C.danger}}>🗑️</button></td></tr>)})}{!fpr.length&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:C.textDim}}>Aucune promo</td></tr>}</tbody></table></div></div>
        {editPr&&<PrModal promo={editPr} products={products} onSave={savePro} onClose={()=>setEditPr(null)}/>}
      </div>)}

      {aTab==="dashboard_config"&&(<div style={{padding:24,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`,maxWidth:600}}><h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700}}>Widgets</h3>{[{key:"showCA",label:"CA"},{key:"showNbVentes",label:"Nb ventes"},{key:"showPanierMoyen",label:"Panier moyen"},{key:"showCategories",label:"Catégories"},{key:"showTopProduits",label:"Top produits"}].map(w=>(<div key={w.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}22`}}><span style={{fontSize:13}}>{w.label}</span><button onClick={()=>setDCfg(p=>({...p,[w.key]:!p[w.key]}))} style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",background:dCfg[w.key]?C.primary:C.border,position:"relative"}}><div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:dCfg[w.key]?25:3,transition:"left 0.2s"}}/></button></div>))}</div>)}

      {aTab==="parametres"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={{padding:24,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`}}><h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:700}}>🏪 Boutique</h3>{[{l:"Nom",v:"Ma Supérette"},{l:"Adresse",v:"123 Rue du Commerce"},{l:"ICE",v:"00123456789012"},{l:"Tél",v:"0522-123456"}].map(f=>(<div key={f.l} style={{marginBottom:14}}><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>{f.l}</label><input defaultValue={f.v} style={iSt}/></div>))}</div><div style={{padding:24,borderRadius:14,background:C.surface,border:`1px solid ${C.border}`}}><h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:700}}>🖨️ Imprimante</h3><div style={{marginBottom:14}}><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Connexion</label><select defaultValue="usb" style={{...iSt,cursor:"pointer"}}><option value="usb">USB</option><option value="bluetooth">Bluetooth</option><option value="network">Réseau</option></select></div><button style={{padding:"10px 20px",borderRadius:10,border:"none",background:C.primaryGlow,color:C.primary,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>🖨️ Test</button></div></div>)}
    </div>
  );
}

/* ═══════════════════ MODALS ═══════════════════ */
function PrModal({promo,products,onSave,onClose}){
  const[f,sF]=useState(promo);const u=(k,v)=>sF(p=>({...p,[k]:v}));const pr=products.find(p=>p.code===f.code);
  const TY=[{v:"prix_barre",l:"💲 Prix barré",d:"Ancien barré, nouveau affiché"},{v:"pourcentage",l:"📉 Pourcentage",d:"Remise en %"},{v:"lot",l:"📦 Lot",d:"2+1, 3 pour X MAD"},{v:"nieme",l:"🔢 Nième",d:"2ème à -50%"},{v:"texte_libre",l:"📝 Texte libre",d:"Affichage libre"}];
  return (
    <Ov onClose={onClose}><div style={{width:560,padding:28,borderRadius:16,background:C.surface,border:`1px solid ${C.promo}40`,maxHeight:"90vh",overflowY:"auto"}}>
      <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:700,color:C.promo}}>🏷️ {promo.code?"Modifier":"Nouvelle"} promo</h3>
      <div style={{marginBottom:16}}><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Code article</label><div style={{display:"flex",gap:10,alignItems:"center"}}><input value={f.code} onChange={e=>u("code",e.target.value)} style={{...iSt,flex:1}} placeholder="7501001"/>{pr&&<div style={{padding:"8px 14px",borderRadius:8,background:C.primaryGlow,fontSize:12,color:C.primary,fontWeight:600,whiteSpace:"nowrap"}}>{pr.nom} — {pr.prix.toFixed(2)} MAD</div>}{f.code&&!pr&&<div style={{padding:"8px 14px",borderRadius:8,background:"rgba(255,71,87,0.1)",fontSize:12,color:C.danger}}>⚠ Introuvable</div>}</div></div>
      <div style={{marginBottom:16}}><label style={{fontSize:12,color:C.textMuted,marginBottom:8,display:"block"}}>Type</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{TY.map(t=>(<button key={t.v} onClick={()=>u("type",t.v)} style={{padding:"10px 14px",borderRadius:10,textAlign:"left",cursor:"pointer",fontFamily:"inherit",border:`1px solid ${f.type===t.v?C.promo:C.border}`,background:f.type===t.v?C.promoGlow:"transparent"}}><div style={{fontSize:13,fontWeight:600,color:f.type===t.v?C.promo:C.text}}>{t.l}</div><div style={{fontSize:10,color:C.textDim,marginTop:2}}>{t.d}</div></button>))}</div></div>
      {f.type==="prix_barre"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Ancien prix</label><input value={pr?pr.prix.toFixed(2):"—"} disabled style={{...iSt,opacity:0.5,textDecoration:"line-through"}}/></div><div><label style={{fontSize:12,color:C.promo,marginBottom:4,display:"block",fontWeight:600}}>Nouveau prix</label><input type="number" step="0.01" value={f.nouveauPrix} onChange={e=>u("nouveauPrix",parseFloat(e.target.value)||0)} style={{...iSt,color:C.promo,fontWeight:700,fontSize:16}}/></div></div>)}
      {f.type==="pourcentage"&&(<div style={{marginBottom:16}}><label style={{fontSize:12,color:C.promo,marginBottom:4,display:"block",fontWeight:600}}>Remise (%)</label><input type="number" min="1" max="99" value={f.pourcentage} onChange={e=>u("pourcentage",parseFloat(e.target.value)||0)} style={{...iSt,color:C.promo,fontWeight:700,fontSize:16,width:120}}/>{pr&&<div style={{marginTop:8,fontSize:12,color:C.textMuted}}>Prix promo: <span style={{color:C.promo,fontWeight:700}}>{(pr.prix*(1-f.pourcentage/100)).toFixed(2)} MAD</span></div>}</div>)}
      {f.type==="lot"&&(<div style={{marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Qté lot</label><input type="number" min="2" value={f.lotQte} onChange={e=>u("lotQte",parseInt(e.target.value)||2)} style={iSt}/></div><div><label style={{fontSize:12,color:C.promo,marginBottom:4,display:"block",fontWeight:600}}>Prix/payer</label><input type="number" step="0.01" value={f.lotPrix} onChange={e=>u("lotPrix",parseFloat(e.target.value)||0)} style={{...iSt,color:C.promo,fontWeight:700}}/></div></div><div style={{marginTop:10,padding:12,borderRadius:8,background:C.promoGlow,fontSize:12,color:C.textMuted}}><b style={{color:C.promo}}>Aperçu:</b> {f.lotPrix<=f.lotQte?f.lotQte+" au prix de "+f.lotPrix:f.lotQte+" pour "+f.lotPrix+" MAD"}</div></div>)}
      {f.type==="nieme"&&(<div style={{marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Nième</label><input type="number" min="2" value={f.niemeN} onChange={e=>u("niemeN",parseInt(e.target.value)||2)} style={iSt}/></div><div><label style={{fontSize:12,color:C.promo,marginBottom:4,display:"block",fontWeight:600}}>Réduction %</label><input type="number" min="1" max="100" value={f.niemePct} onChange={e=>u("niemePct",parseFloat(e.target.value)||50)} style={{...iSt,color:C.promo,fontWeight:700}}/></div></div><div style={{marginTop:10,padding:12,borderRadius:8,background:C.promoGlow,fontSize:12,color:C.textMuted}}><b style={{color:C.promo}}>Aperçu:</b> Le {f.niemeN}ème à {f.niemePct===100?"gratuit":"-"+f.niemePct+"%"}</div></div>)}
      <div style={{marginBottom:20}}><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Texte promo</label><input value={f.texte} onChange={e=>u("texte",e.target.value)} placeholder="Ex: Offre Ramadan..." style={iSt}/></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={onClose} style={bS}>Annuler</button><button onClick={()=>onSave(f)} disabled={!f.code} style={{padding:"12px 24px",borderRadius:10,border:"none",background:f.code?C.promo:C.border,color:f.code?"#fff":C.textDim,fontWeight:700,cursor:f.code?"pointer":"default",fontSize:13,fontFamily:"inherit"}}>Enregistrer</button></div>
    </div></Ov>
  );
}

function PModal({product,onSave,onClose}){
  const[f,sF]=useState(product);const u=(k,v)=>sF(p=>({...p,[k]:v}));
  return (
    <Ov onClose={onClose}><div style={{width:500,padding:28,borderRadius:16,background:C.surface,border:`1px solid ${C.border}`}}>
      <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:700}}>✏️ Modifier article</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Code</label><input value={f.code} disabled style={{...iSt,opacity:0.5}}/></div><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Nom</label><input value={f.nom} onChange={e=>u("nom",e.target.value)} style={iSt}/></div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Prix <span style={{color:C.warning,fontSize:10}}>ancien: {product.prix.toFixed(2)}</span></label><input type="number" step="0.01" value={f.prix} onChange={e=>u("prix",parseFloat(e.target.value)||0)} style={{...iSt,fontWeight:700,color:C.primary}}/></div><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Catégorie</label><input value={f.categorie} onChange={e=>u("categorie",e.target.value)} style={iSt}/></div><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>TVA (%)</label><input type="number" value={(f.tva*100).toFixed(0)} onChange={e=>u("tva",(parseFloat(e.target.value)||0)/100)} style={iSt}/></div></div>
      {f.prix!==product.prix&&<div style={{padding:12,borderRadius:8,background:"rgba(255,184,0,0.08)",border:"1px solid rgba(255,184,0,0.2)",marginBottom:16,fontSize:12}}>⚠️ {product.prix.toFixed(2)} → <span style={{color:C.primary,fontWeight:700}}>{f.prix.toFixed(2)} MAD</span></div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={onClose} style={bS}>Annuler</button><button onClick={()=>onSave(f.code,{nom:f.nom,prix:f.prix,categorie:f.categorie,tva:f.tva})} style={bP}>Enregistrer</button></div>
    </div></Ov>
  );
}

function UModal({user,onSave,onClose}){
  const[f,sF]=useState(user);const u=(k,v)=>sF(p=>({...p,[k]:v}));
  return (
    <Ov onClose={onClose}><div style={{width:480,padding:28,borderRadius:16,background:C.surface,border:`1px solid ${C.border}`}}>
      <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:700}}>{f.id?"Modifier":"Nouveau"} utilisateur</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Nom</label><input value={f.nom} onChange={e=>u("nom",e.target.value)} style={iSt}/></div><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Login</label><input value={f.login} onChange={e=>u("login",e.target.value)} style={iSt}/></div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Mot de passe</label><input type="password" value={f.password} onChange={e=>u("password",e.target.value)} style={iSt}/></div><div><label style={{fontSize:12,color:C.textMuted,marginBottom:4,display:"block"}}>Rôle</label><select value={f.role} onChange={e=>u("role",e.target.value)} style={{...iSt,cursor:"pointer"}}><option value="vendeur">Vendeur</option><option value="admin">Admin</option></select></div></div>
      <div style={{marginBottom:20}}><label style={{fontSize:12,color:C.textMuted,marginBottom:8,display:"block",fontWeight:600}}>Droits</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{k:"accesVente",l:"🛒 Caisse"},{k:"accesRapport",l:"📊 Rapports"},{k:"accesAdmin",l:"⚙️ Admin"},{k:"accesMateriel",l:"🔧 Matériel"}].map(a=>(<label key={a.k} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:13}}><input type="checkbox" checked={f[a.k]} onChange={e=>u(a.k,e.target.checked)} style={{accentColor:C.primary}}/>{a.l}</label>))}</div></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={onClose} style={bS}>Annuler</button><button onClick={()=>onSave(f)} style={bP}>Enregistrer</button></div>
    </div></Ov>
  );
}
