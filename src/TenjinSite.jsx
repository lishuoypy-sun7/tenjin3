import React, { useMemo, useState, useEffect } from "react";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID || "G-XXXXXXXXX";

function initGA() {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXX") { console.warn("[GA] Measurement ID not set; skipping GA init."); return; }
  if (typeof window === "undefined") return;
  if (window.gtag) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}

function track(event, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag('event', event, params);
}

export default function TenjinSite() {
  const [lang, setLang] = useState("JP");
  const t = useMemo(() => translations[lang], [lang]);
  const [copied, setCopied] = useState(false);

  useEffect(() => { initGA(); }, []);

  const onShare = async () => {
    try {
      const shareData = { title: "MIGNON Tenjin", text: t.heroTagline, url: typeof window !== "undefined" ? window.location.href : "https://tenjin.mignon-mini-croissant.com" };
      track('share_click', { lang });
      if (navigator.share) { await navigator.share(shareData); track('share_native_success', { method: 'navigator.share' }); }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(shareData.url); setCopied(true); setTimeout(() => setCopied(false), 1600); track('share_copy_link', {}); }
    } catch (e) { track('share_error', { message: String(e?.message || e) }); }
  };

  const scrollTo = (id) => { track('nav_click', { target: id, lang }); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <div className="min-h-screen" style={{fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji'}}>
      <header style={{position:'sticky',top:0,zIndex:30,backdropFilter:'blur(6px)',background:'rgba(255,255,255,.8)',borderBottom:'1px solid #e5e7eb'}}>
        <div style={{maxWidth:960,margin:'0 auto',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{height:36,width:36,borderRadius:16,display:'grid',placeItems:'center',background:'#fde68a'}}>🥐</div>
            <div>
              <div style={{fontWeight:800}}>MIGNON Tenjin</div>
              <div style={{fontSize:12,color:'#6b7280'}}>{t.storeName}</div>
            </div>
          </div>
          <nav style={{display:'flex',gap:8}}>
            <button onClick={() => scrollTo("seasonal")}>{t.seasonal}</button>
            <button onClick={() => scrollTo("classic")}>{t.classic}</button>
          </nav>
          <div style={{display:'flex',gap:8}}>
            <LangToggle lang={lang} setLang={(k) => { setLang(k); track('lang_change', { to: k }); }} />
            <button onClick={onShare}>{t.share}</button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:960,margin:'0 auto',padding:'24px 16px'}}>
        <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>{t.heroTitle}</h1>
        <p style={{color:'#6b7280',marginBottom:16}}>{t.heroTagline}</p>

        <section id="seasonal" style={{marginTop:16}}>
          <h2 style={{fontSize:22,fontWeight:800}}>{t.seasonal}</h2>
          <p style={{fontSize:12,color:'#6b7280',margin:'4px 0 8px'}}>{t.voteHint}</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
            {menu.seasonal.map(item => <MenuCard key={item.key} item={item} t={t} />)}
          </div>
        </section>

        <section id="classic" style={{marginTop:16}}>
          <h2 style={{fontSize:22,fontWeight:800}}>{t.classic}</h2>
          <p style={{fontSize:12,color:'#6b7280',margin:'4px 0 8px'}}>{t.voteHint}</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
            {menu.classic.map(item => <MenuCard key={item.key} item={item} t={t} />)}
          </div>
        </section>
      </main>

      {copied && <div style={{position:'fixed',bottom:24,right:24,background:'#111827',color:'#fff',padding:'8px 12px',borderRadius:12,fontSize:12}}>リンクをコピーしました</div>}
    </div>
  );
}

function LangToggle({ lang, setLang }) {
  const langs = ["JP", "EN", "CN", "KR"];
  return (
    <div style={{display:'flex',gap:6,border:'1px solid #e5e7eb',borderRadius:12,padding:4,background:'#fff'}}>
      {langs.map(k => (
        <button key={k} onClick={() => setLang(k)} style={{padding:'4px 8px',borderRadius:8,background: lang===k ? '#111827' : '#fff', color: lang===k ? '#fff' : '#111827'}}>{k}</button>
      ))}
    </div>
  );
}

function VoteButton({ count=0, onClick, label }) {
  return <button onClick={onClick} aria-label={label} title={label} style={{border:'1px solid #e5e7eb',borderRadius:999,padding:'4px 8px',fontSize:12,display:'inline-flex',gap:6,alignItems:'center'}}>👍 <span>{count}</span></button>
}

function Price({ value }) { const n = Number(value)||0; return <span style={{fontWeight:600}}>¥{n.toLocaleString()}</span>; }

function MenuCard({ item, t }) {
  const k = t._lang || "EN";
  const namePrimary = item.name?.[k] ?? item.name?.EN ?? Object.values(item.name || { EN: "Item" })[0];
  const descPrimary = item.desc?.[k] ?? item.desc?.EN ?? "";
  const [count, setCount] = React.useState(() => { try { return JSON.parse(localStorage.getItem("mignon_votes") || "{}")[item.key] || 0 } catch { return 0 } });
  const aria = `${t.voteAriaPrefix} ${namePrimary}`;
  const vote = () => {
    setCount(c => c + 1);
    try { const raw = localStorage.getItem("mignon_votes"); const obj = raw ? JSON.parse(raw) : {}; obj[item.key] = (obj[item.key] || 0) + 1; localStorage.setItem("mignon_votes", JSON.stringify(obj)); } catch {}
    track('vote', { item_key: item.key, lang: k });
  };
  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:20,overflow:'hidden'}}>
      <div style={{aspectRatio:'4/3',display:'grid',placeItems:'center',background:'#fef3c7',fontSize:40}}>{item.emoji}</div>
      <div style={{padding:12}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,fontWeight:700}}>
          <span title={namePrimary} style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{namePrimary}</span>
          <VoteButton count={count} onClick={vote} label={aria} />
        </div>
        {!!descPrimary && <p style={{color:'#6b7280',fontSize:14,marginTop:6}}>{descPrimary}</p>}
        <div style={{marginTop:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <Price value={item.price} />
          <button onClick={() => { alert(t.alertOrder); track('view_click', { item_key: item.key, lang: k }); }} style={{border:'1px solid #e5e7eb',borderRadius:12,padding:'6px 10px'}}> {t.btnView} </button>
        </div>
      </div>
    </div>
  );
}

const menu = {
  seasonal: [{ key: "matcha", emoji: "🍵🥐", name: { JP: "抹茶クロワッサン", EN: "Matcha", CN: "抹茶牛角包", KR: "말차 크루아상" }, desc: { JP: "今だけの抹茶風味。", EN: "Seasonal matcha flavor.", CN: "季节限定抹茶风味。", KR: "시즌 한정 말차 풍미." }, price: 340, tag: "Limited" }],
  classic: [
    { key: "plain", emoji: "🥐", name: { JP: "プレーン", EN: "Plain", CN: "原味", KR: "플레인" }, desc: { JP: "サクッとふんわりの王道。", EN: "Crispy outside, fluffy inside.", CN: "外酥内软的经典。", KR: "겉바속촉 클래식." }, price: 220 },
    { key: "choco", emoji: "🍫🥐", name: { JP: "チョコレート", EN: "Chocolate", CN: "巧克力", KR: "초콜릿" }, desc: { JP: "とろける甘さ。", EN: "Melty sweetness.", CN: "入口即化的甜味。", KR: "녹아드는 달콤함." }, price: 280 },
    { key: "sweetpotato", emoji: "🍠🥐", name: { JP: "さつま芋", EN: "Sweet Potato", CN: "红薯", KR: "고구마" }, desc: { JP: "ほっくり甘い芋の味わい。", EN: "Cozy sweet potato flavor.", CN: "绵密香甜的红薯味。", KR: "달콤한 고구마 맛." }, price: 320 },
    { key: "mentaiko", emoji: "🍥🥐", name: { JP: "明太子", EN: "Mentaiko", CN: "明太子", KR: "멘타이코" }, desc: { JP: "ピリ辛の明太子。", EN: "Spicy cod roe.", CN: "微辣明太子。", KR: "매콤한 명태알." }, price: 330 },
    { key: "almond", emoji: "🌰🥐", name: { JP: "アーモンド", EN: "Almond", CN: "杏仁", KR: "아몬드" }, desc: { JP: "香ばしいナッツ風味。", EN: "Nutty flavor.", CN: "坚果香味。", KR: "고소한 너트 풍미." }, price: 300 },
    { key: "custard", emoji: "🍮🥐", name: { JP: "カスタード", EN: "Custard", CN: "卡仕达", KR: "커스터드" }, desc: { JP: "やさしい甘さ。", EN: "Gentle sweetness.", CN: "柔和甜味。", KR: "은은한 단맛." }, price: 280 },
    { key: "applepie", emoji: "🍎🥐", name: { JP: "アップルパイ", EN: "Apple Pie", CN: "苹果派", KR: "애플 파이" }, desc: { JP: "りんごの甘酸っぱさ。", EN: "Sweet & tart apple.", CN: "苹果的酸甜。", KR: "사과의 달콤상큼." }, price: 350 },
    { key: "bread", emoji: "🍞", name: { JP: "食パン", EN: "Shokupan", CN: "吐司", KR: "식빵" }, desc: { JP: "ふんわり食感。", EN: "Soft & fluffy.", CN: "松软口感。", KR: "부드럽고 폭신." }, price: 400 },
  ],
};

const translations = {
  JP: { _lang: "JP", storeName: "ミニヨン 天神", heroTitle: "サクサク×もっちり。天神だけの特別を。", heroTagline: "季節限定や定番メニューをゆったり選べるデジタルメニュー。", heroNote: "イメージ / 画像は差し替え可", badgeFresh: "焼きたて", seasonal: "季節限定", classic: "定番メニュー", descSeasonal: "今だけの限定フレーバー", descClassic: "人気と定番のラインナップ", subtitleSeasonal: "季節の味をピックアップ", subtitleClassic: "定番商品のご紹介", ctaSeeLimited: "限定を見る", ctaSeeClassic: "定番を見る", btnView: "見る", alertOrder: "店頭でご注文ください（オンライン注文は準備中）", share: "シェア", address: "住所", hours: "営業時間", openMap: "Googleマップで開く", notice: "※ 写真・価格はサンプルです。", rights: "All rights reserved.", copied: "リンクをコピーしました", voteHint: "※ お好きな商品に投票してください", voteAriaPrefix: "投票" },
  EN: { _lang: "EN", storeName: "MIGNON Tenjin", heroTitle: "Crispy × Chewy. Only in Tenjin.", heroTagline: "Browse seasonal and classic items with ease.", heroNote: "Mock visuals / Replace with real photos", badgeFresh: "Fresh-baked", seasonal: "Seasonal", classic: "Classics", descSeasonal: "Current seasonal flavor", descClassic: "Popular and classic lineup", subtitleSeasonal: "Seasonal pick", subtitleClassic: "Classic items", ctaSeeLimited: "See Limited", ctaSeeClassic: "See Classics", btnView: "View", alertOrder: "Please order at the counter (online coming soon)", share: "Share", address: "Address", hours: "Hours", openMap: "Open in Google Maps", notice: "* Images & prices are samples.", rights: "All rights reserved.", copied: "Link copied", voteHint: "* Tap to vote for your favorite", voteAriaPrefix: "Vote for" },
  CN: { _lang: "CN", storeName: "MIGNON 天神店", heroTitle: "外酥内软，只在天神。", heroTagline: "轻松选择季节限定与定番款。", heroNote: "示意图 / 上线前替换实拍", badgeFresh: "现烤出炉", seasonal: "季节限定", classic: "定番菜单", descSeasonal: "当季限定口味", descClassic: "人气与定番组合", subtitleSeasonal: "精选当季风味", subtitleClassic: "定番商品介绍", ctaSeeLimited: "查看限定", ctaSeeClassic: "查看定番", btnView: "查看", alertOrder: "请到柜台点单（线上订购开发中）", share: "分享", address: "地址", hours: "营业时间", openMap: "在 Google 地图打开", notice: "* 图片与价格为示例。", rights: "保留所有权利", copied: "链接已复制", voteHint: "※ 给你喜欢的商品投票吧", voteAriaPrefix: "为以下商品投票" },
  KR: { _lang: "KR", storeName: "미뇽 텐진점", heroTitle: "겉바속촉, 텐진 한정.", heroTagline: "시즌 한정과 클래스를 편하게 고르세요.", heroNote: "샘플 이미지 / 실제 사진으로 교체", badgeFresh: "갓 구움", seasonal: "시즌 한정", classic: "클래식", descSeasonal: "이번 시즌 한정 메뉴", descClassic: "인기와 클래식 구성", subtitleSeasonal: "시즌 맛 소개", subtitleClassic: "클래식 상품 소개", ctaSeeLimited: "한정 보기", ctaSeeClassic: "클래식 보기", btnView: "보기", alertOrder: "매장에서 주문해 주세요 (온라인 준비 중)", share: "공유", address: "주소", hours: "영업시간", openMap: "Google 지도에서 열기", notice: "* 이미지/가격은 예시입니다.", rights: "All rights reserved.", copied: "링크 복사됨", voteHint: "* 좋아하는 메뉴에 투표하세요", voteAriaPrefix: "투표" },
};
