/**
 * ============================================================
 *  Leeyam Cellphone & Gadget Clinic
 *  Firebase-Connected Inventory System
 * ============================================================
 *  npm install lucide-react firebase
 *  Update firebaseConfig below, then: npm run dev
 * ============================================================
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  X, Plus, Search, Pencil, Trash2, Check, AlertCircle,
  CheckCircle, Info, Package, ShoppingCart,
  History, ChevronDown, Minus, Wifi, WifiOff,
  TrendingDown, ArrowDown, Gift, Smartphone, Loader2,
  BarChart3, Tag, AlertTriangle, Wallet, Lock,
  CreditCard, ArrowUpCircle, ArrowDownCircle, Phone,
  Signal, SendHorizonal, Zap, Landmark, Printer,
} from "lucide-react";

// Firebase imports
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc,
  onSnapshot, addDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy, Timestamp,
} from "firebase/firestore";

// ─────────────────────────────────────────────
//  FIREBASE CONFIG — update with your own
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCdpagb7wzM3RJGpm5_XTJ--_fnDpdE9sQ",
  authDomain: "leeyam-inventory.firebaseapp.com",
  projectId: "leeyam-inventory",
  storageBucket: "leeyam-inventory.firebasestorage.app",
  messagingSenderId: "614598175857",
  appId: "1:614598175857:web:e7d30e4fc7bfd65a72ffd0",
  measurementId: "G-PX68F7C90M"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const stockStatus = (item) => {
  if (item.qty === 0) return "out";
  if (item.qty <= item.low) return "low";
  return "in";
};
const STOCK_LABELS = { in: "In Stock", low: "Low Stock", out: "Out of Stock" };
const fmt = (n) => Number(n || 0).toLocaleString();
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// Build display list of free items (supports old freeTempered + new freeItems)
const getFreeItems = (item) => {
  const list = [...(item.freeItems || [])];
  if (item.freeItemsOther?.trim()) list.push(item.freeItemsOther.trim());
  if (list.length === 0 && item.freeTempered) list.push("Tempered Glass"); // legacy
  return list;
};
const FREE_ITEM_EMOJI = { "Tempered Glass": "🛡️", "Headset": "🎧", "Speaker": "🔊" };
const freeItemEmoji = (name) => FREE_ITEM_EMOJI[name] || "🎁";
// ─────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root {
  --ink:#0D1A14;
  --ink2:#2E4A3E;
  --ink3:#6B8F80;
  --ink4:#A8C4B8;
  --bg:#F2F8F6;
  --surf:#FFFFFF;
  --surf2:#F5FBF8;
  --surf3:#E8F5EF;
  --bdr:rgba(13,158,110,.12);
  --bdr2:rgba(13,158,110,.22);

  --blue:#0D9E6E;
  --blue-lt:#D9F5EC;
  --blue-dk:#065F46;
  --green:#00B87A;
  --green-lt:#E0FBF2;
  --green-dk:#006E49;
  --amber:#F59E0B;
  --amber-lt:#FEF3C7;
  --amber-dk:#92400E;
  --red:#EF4444;
  --red-lt:#FEE2E2;
  --red-dk:#991B1B;
  --purple:#0EA5A0;
  --purple-lt:#CCFAF8;
  --purple-dk:#0F5E5B;

  --accent:#0D9E6E;
  --accent2:#0EA5A0;

  --rad:10px;
  --rad-lg:14px;
  --rad-xl:20px;
  --sh:0 1px 4px rgba(7,31,22,.06),0 0 0 1px rgba(13,158,110,.08);
  --sh-md:0 4px 16px rgba(7,31,22,.1),0 0 0 1px rgba(13,158,110,.1);
  --sh-lg:0 12px 40px rgba(7,31,22,.15),0 0 0 1px rgba(13,158,110,.1);
  --sh-blue:0 4px 20px rgba(13,158,110,.3);

  --sidebar-w:240px;
  --topbar-h:64px;
  --pad:24px;
}

html,body{margin:0;padding:0;width:100%;scroll-behavior:smooth;overflow-x:hidden;}
body{font-family:'Outfit',system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;}
#root{width:100%;min-height:100vh;overflow-x:hidden;}
button,input,select,textarea{font-family:inherit;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-thumb{background:var(--bdr2);border-radius:99px;}

/* ── LAYOUT ── */
.ap-shell{display:flex;min-height:100vh;width:100%;overflow-x:hidden;}

/* Mobile overlay — hidden by default, shown on mobile when sidebar open */
.ap-mob-overlay{display:none;}

/* ── SIDEBAR ── */
.ap-sidebar{
  width:var(--sidebar-w);flex-shrink:0;
  background:#071F16;
  display:flex;flex-direction:column;
  position:fixed;top:0;left:0;bottom:0;z-index:60;
  overflow:hidden;
  transition:transform .25s ease;
}
.ap-sidebar-logo{
  display:flex;align-items:center;gap:12px;
  padding:20px 20px 16px;
  border-bottom:1px solid rgba(255,255,255,.07);
}
.ap-sidebar-logo-icon{
  width:40px;height:40px;border-radius:10px;
  background:linear-gradient(135deg,var(--blue),var(--purple));
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;box-shadow:0 4px 12px rgba(13,158,110,.4);
}
.ap-sidebar-brand{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#fff;line-height:1.2;}
.ap-sidebar-sub{font-size:11px;color:rgba(255,255,255,.4);font-weight:400;}

.ap-sidebar-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;}
.ap-nav-item{
  display:flex;align-items:center;gap:11px;
  padding:11px 12px;border-radius:10px;border:none;
  background:none;color:rgba(255,255,255,.5);
  font-size:14px;font-weight:500;cursor:pointer;
  transition:all .15s;text-align:left;width:100%;position:relative;
}
.ap-nav-item:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.85);}
.ap-nav-item.active{background:rgba(255,255,255,.1);color:#fff;}
.ap-nav-item.active::before{
  content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:3px;height:20px;background:linear-gradient(180deg,var(--blue),var(--purple));
  border-radius:0 3px 3px 0;
}
.ap-nav-badge{
  margin-left:auto;padding:2px 8px;border-radius:99px;
  font-size:11px;font-weight:700;
  background:var(--red);color:#fff;
}
.ap-nav-badge.blue{background:var(--blue);}
.ap-sidebar-divider{height:1px;background:rgba(255,255,255,.06);margin:8px 0;}

.ap-sidebar-sale{
  padding:16px 12px;
}
.ap-sidebar-sale-btn{
  width:100%;display:flex;align-items:center;gap:10px;
  padding:13px 16px;border-radius:var(--rad-lg);border:none;
  background:linear-gradient(135deg,var(--blue),var(--purple));
  color:#fff;font-size:14px;font-weight:700;cursor:pointer;
  transition:all .2s;box-shadow:var(--sh-blue);
}
.ap-sidebar-sale-btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(13,158,110,.5);}
.ap-sidebar-sale-btn:active{transform:scale(.97);}

.ap-sidebar-conn{
  display:flex;align-items:center;gap:8px;
  padding:12px 20px;
  font-size:12px;font-weight:600;
  color:rgba(255,255,255,.3);
  border-top:1px solid rgba(255,255,255,.06);
}
.ap-sidebar-conn.online{color:var(--green);}

/* ── MAIN ── */
.ap-main{
  margin-left:var(--sidebar-w);
  flex:1;display:flex;flex-direction:column;
  min-height:100vh;min-width:0;overflow-x:hidden;
}

/* ── TOPBAR ── */
.ap-topbar{
  height:var(--topbar-h);padding:0 var(--pad);
  background:var(--surf);border-bottom:1px solid var(--bdr);
  display:flex;align-items:center;justify-content:space-between;
  gap:16px;position:sticky;top:0;z-index:40;
}
.ap-topbar-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ap-topbar-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}

/* ── CONTENT ── */
.ap-content{padding:var(--pad);flex:1;max-width:1400px;width:100%;overflow-x:hidden;}

/* ── STATS ROW ── */
.ap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
.ap-stats-wide{grid-template-columns:repeat(2,1fr);margin-bottom:20px;}
.ap-stat{
  background:var(--surf);border-radius:var(--rad-lg);
  border:1px solid var(--bdr);box-shadow:var(--sh);
  padding:18px 20px;transition:all .2s;cursor:default;
}
.ap-stat:hover{box-shadow:var(--sh-md);transform:translateY(-1px);}
.ap-stat-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;}
.ap-stat-icon.blue{background:var(--blue-lt);color:var(--blue);}
.ap-stat-icon.green{background:var(--green-lt);color:var(--green-dk);}
.ap-stat-icon.amber{background:var(--amber-lt);color:var(--amber-dk);}
.ap-stat-icon.red{background:var(--red-lt);color:var(--red-dk);}
.ap-stat-icon.purple{background:var(--purple-lt);color:var(--purple);}
.ap-stat-label{font-size:12px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;}
.ap-stat-val{font-family:'Syne',sans-serif;font-size:28px;font-weight:700;color:var(--ink);line-height:1.1;}
.ap-stat-val.green{color:var(--green-dk);}
.ap-stat-val.amber{color:var(--amber-dk);}
.ap-stat-val.red{color:var(--red-dk);}
.ap-stat-val.blue{color:var(--blue);}
.ap-stat-sub{font-size:12px;color:var(--ink3);margin-top:5px;}

/* ── TOOLBAR ── */
.ap-toolbar{display:flex;gap:10px;align-items:center;margin-bottom:18px;flex-wrap:wrap;}
.ap-search-wrap{position:relative;flex:1;min-width:200px;}
.ap-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ink3);pointer-events:none;}
.ap-search{
  width:100%;padding:11px 12px 11px 40px;
  border:1.5px solid var(--bdr2);border-radius:var(--rad);
  background:var(--surf);color:var(--ink);font-size:14px;
  outline:none;transition:border-color .15s,box-shadow .15s;
}
.ap-search:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(13,158,110,.1);}
.ap-search::placeholder{color:var(--ink3);}
.ap-select{
  padding:11px 36px 11px 12px;border:1.5px solid var(--bdr2);border-radius:var(--rad);
  background:var(--surf);color:var(--ink);font-size:14px;outline:none;cursor:pointer;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238890B0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;
  transition:border-color .15s;min-width:150px;
}
.ap-select:focus{border-color:var(--blue);}

/* ── BUTTONS ── */
.ap-btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:11px 18px;border-radius:var(--rad);font-size:14px;
  font-weight:600;white-space:nowrap;cursor:pointer;
  border:1.5px solid var(--bdr2);background:var(--surf);color:var(--ink);
  transition:all .15s;
}
.ap-btn:hover{background:var(--surf2);border-color:var(--blue);}
.ap-btn:active{transform:scale(.97);}
.ap-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.ap-btn.primary{background:var(--blue);color:#fff;border-color:var(--blue);box-shadow:var(--sh-blue);}
.ap-btn.primary:hover{background:var(--blue-dk);box-shadow:0 6px 20px rgba(13,158,110,.45);}
.ap-btn.danger{background:var(--red);color:#fff;border-color:var(--red);}
.ap-btn.danger:hover{background:var(--red-dk);}
.ap-btn.ghost{background:transparent;border-color:transparent;}
.ap-btn.ghost:hover{background:var(--surf2);}
.ap-btn.sm{padding:8px 12px;font-size:13px;}
.ap-btn.icon{padding:9px;}

/* ── TABLE (Inventory) ── */
.ap-table-wrap{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);box-shadow:var(--sh);overflow:hidden;}
.ap-table{width:100%;border-collapse:collapse;}
.ap-table th{
  padding:12px 16px;font-size:11px;font-weight:700;
  color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;
  background:var(--surf2);border-bottom:1px solid var(--bdr);
  text-align:left;white-space:nowrap;
}
.ap-table td{
  padding:14px 16px;border-bottom:1px solid var(--bdr);
  font-size:14px;color:var(--ink);vertical-align:middle;
}
.ap-table tr:last-child td{border-bottom:none;}
.ap-table tr:hover td{background:var(--surf2);}
.ap-table-sku{
  font-family:'JetBrains Mono',monospace;font-size:11px;
  color:var(--ink3);background:var(--surf3);
  padding:3px 7px;border-radius:5px;border:1px solid var(--bdr);
  display:inline-block;
}
.ap-table-name{font-weight:600;font-size:14px;color:var(--ink);}
.ap-table-brand{font-size:12px;color:var(--ink3);margin-top:2px;}
.ap-table-price{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--green-dk);}
.ap-table-qty{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;}
.ap-table-qty.in{color:var(--ink);}
.ap-table-qty.low{color:var(--amber-dk);}
.ap-table-qty.out{color:var(--red);}
.ap-table-actions{display:flex;align-items:center;gap:6px;}

/* ── BADGES ── */
.ap-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700;}
.ap-badge.in{background:var(--green-lt);color:var(--green-dk);}
.ap-badge.low{background:var(--amber-lt);color:var(--amber-dk);}
.ap-badge.out{background:var(--red-lt);color:var(--red-dk);}
.ap-badge-free{
  display:inline-flex;align-items:center;gap:3px;
  padding:3px 8px;border-radius:99px;font-size:11px;font-weight:700;
  background:var(--purple-lt);color:var(--purple-dk);
  border:1px solid rgba(139,92,246,.2);
}

/* ── EMPTY ── */
.ap-empty{padding:64px 20px;text-align:center;}
.ap-empty-icon{font-size:52px;margin-bottom:14px;opacity:.5;}
.ap-empty-txt{font-size:15px;color:var(--ink3);}

/* ── HISTORY ── */
.ap-history-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
.ap-report{
  background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);
  box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;transition:all .2s;
}
.ap-report:hover{box-shadow:var(--sh-md);border-color:var(--bdr2);}
.ap-report-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;cursor:pointer;user-select:none;gap:12px;
}
.ap-report-head:hover{background:var(--surf2);}
.ap-report-num{
  font-family:'JetBrains Mono',monospace;font-size:11px;
  color:var(--ink3);background:var(--surf3);
  padding:3px 8px;border-radius:6px;margin-bottom:4px;
  display:inline-block;border:1px solid var(--bdr);
}
.ap-report-title{font-weight:700;font-size:15px;color:var(--ink);}
.ap-report-meta{font-size:12px;color:var(--ink3);margin-top:2px;}
.ap-report-total{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--green-dk);}
.ap-report-body{border-top:1px solid var(--bdr);}
.ap-report-row{
  display:flex;align-items:center;gap:12px;
  padding:12px 20px;border-bottom:1px solid var(--bdr);transition:background .1s;
}
.ap-report-row:last-child{border-bottom:none;}
.ap-report-row:hover{background:var(--surf2);}
.ap-report-item-name{font-weight:600;font-size:14px;}
.ap-report-item-sku{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink3);margin-top:2px;}
.ap-stock-delta{
  display:inline-flex;align-items:center;gap:3px;
  padding:3px 9px;border-radius:7px;font-size:11px;font-weight:700;
  background:var(--red-lt);color:var(--red-dk);
}
.ap-report-item-total{font-size:14px;font-weight:700;color:var(--green-dk);}
.ap-report-item-unit{font-size:11px;color:var(--ink3);margin-top:2px;}
.ap-report-summary{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 20px;background:var(--green-lt);border-top:1px solid rgba(0,184,122,.2);
}
.ap-report-summary-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--green-dk);}
.ap-report-summary-val{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--green-dk);}

/* ── MODALS ── */
.ap-overlay{
  position:fixed;inset:0;background:rgba(7,31,22,.6);
  display:flex;align-items:center;justify-content:center;
  z-index:200;padding:20px;animation:apFade .15s ease;
  backdrop-filter:blur(3px);
}
.ap-modal{
  background:var(--surf);border-radius:var(--rad-xl);
  box-shadow:var(--sh-lg);width:100%;max-width:540px;
  max-height:92dvh;overflow-y:auto;animation:apUp .18s ease;
  border:1px solid var(--bdr2);
}
.ap-modal-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 24px;border-bottom:1px solid var(--bdr);
  position:sticky;top:0;background:var(--surf);z-index:1;
  border-radius:var(--rad-xl) var(--rad-xl) 0 0;
}
.ap-modal-head h3{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;}
.ap-modal-body{padding:22px 24px;}
.ap-modal-foot{
  padding:16px 24px;border-top:1px solid var(--bdr);
  display:flex;justify-content:flex-end;gap:10px;
  position:sticky;bottom:0;background:var(--surf);
}

.ap-form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.ap-fg{margin-bottom:16px;}
.ap-fg:last-child{margin-bottom:0;}
.ap-label{display:block;font-size:12px;font-weight:700;color:var(--ink2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;}
.ap-input,.ap-fselect,.ap-textarea{
  width:100%;padding:11px 14px;
  border:1.5px solid var(--bdr2);border-radius:var(--rad);
  background:var(--surf);color:var(--ink);font-size:14px;
  outline:none;transition:border-color .15s,box-shadow .15s;
}
.ap-input:focus,.ap-fselect:focus,.ap-textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(13,158,110,.1);}
.ap-input.err{border-color:var(--red) !important;}
.ap-textarea{resize:vertical;min-height:76px;line-height:1.5;}
.ap-ferr{font-size:12px;color:var(--red);margin-top:4px;font-weight:600;}
.ap-fhint{font-size:12px;color:var(--ink3);margin-top:4px;}
.ap-toggle-row{
  display:flex;align-items:center;gap:12px;
  padding:14px 16px;background:var(--purple-lt);
  border-radius:var(--rad);border:1.5px solid rgba(139,92,246,.25);
  cursor:pointer;user-select:none;transition:all .15s;
}
.ap-toggle-row:hover{border-color:var(--purple);}
.ap-toggle-check{
  width:22px;height:22px;border-radius:6px;
  border:2px solid rgba(139,92,246,.4);background:var(--surf);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:all .15s;
}
.ap-toggle-check.on{background:var(--purple);border-color:var(--purple);}
.ap-toggle-label{font-size:13px;font-weight:700;color:var(--purple-dk);flex:1;}
.ap-toggle-sub{font-size:11px;color:var(--purple);}

.ap-confirm{padding:32px 24px;text-align:center;}
.ap-confirm-icon{width:60px;height:60px;border-radius:50%;background:var(--red-lt);color:var(--red);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
.ap-confirm-title{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;margin-bottom:8px;}
.ap-confirm-msg{font-size:14px;color:var(--ink2);line-height:1.6;margin-bottom:24px;}
.ap-confirm-actions{display:flex;gap:10px;justify-content:center;}

/* ── SALES MODAL ── */
.ap-sales-modal{max-width:620px;}
.ap-sales-item{
  display:flex;align-items:center;gap:12px;
  padding:14px 0;border-bottom:1px solid var(--bdr);
}
.ap-sales-item:last-child{border-bottom:none;}
.ap-sales-name{font-weight:700;font-size:14px;color:var(--ink);}
.ap-sales-meta{font-size:12px;color:var(--ink3);margin-top:2px;}
.ap-sales-price{font-size:13px;font-weight:700;color:var(--green-dk);min-width:72px;text-align:right;flex-shrink:0;}
.ap-qty-btn{
  width:36px;height:36px;border-radius:8px;
  border:1.5px solid var(--bdr2);background:var(--surf);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .12s;flex-shrink:0;
  color:var(--ink2);
}
.ap-qty-btn:hover{background:var(--surf3);border-color:var(--ink2);}
.ap-qty-btn.minus{border-color:var(--red);color:var(--red);background:var(--red-lt);}
.ap-qty-btn.minus:hover{background:var(--red);color:#fff;}
.ap-qty-btn.plus{border-color:var(--green);color:var(--green-dk);background:var(--green-lt);}
.ap-qty-btn.plus:hover{background:var(--green);color:#fff;}
.ap-qty-btn.plus-outline{border-color:var(--blue);color:var(--blue);background:var(--blue-lt);}
.ap-qty-btn.plus-outline:hover{background:var(--blue);color:#fff;}
.ap-qty-input{
  width:52px;text-align:center;padding:7px;
  border:1.5px solid var(--bdr2);border-radius:8px;
  font-size:15px;font-weight:700;outline:none;transition:border-color .15s;
}
.ap-qty-input:focus{border-color:var(--blue);}
.ap-sale-summary{
  background:var(--green-lt);border-radius:var(--rad);
  padding:16px 18px;margin-top:16px;
  display:flex;justify-content:space-between;align-items:center;
  border:1px solid rgba(0,184,122,.2);
}
.ap-sale-summary-label{font-size:12px;color:var(--green-dk);font-weight:700;text-transform:uppercase;letter-spacing:.05em;}
.ap-sale-summary-val{font-family:'Syne',sans-serif;font-size:24px;font-weight:700;color:var(--green-dk);}

/* ── HISTORY TOOLBAR ── */
.ap-history-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.ap-date-select{
  padding:11px 34px 11px 12px;border:1.5px solid var(--bdr2);border-radius:var(--rad);
  background:var(--surf);color:var(--ink);font-size:14px;font-weight:600;
  outline:none;cursor:pointer;appearance:none;flex-shrink:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238890B0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;
  transition:all .15s;
}
.ap-date-select:focus{border-color:var(--blue);}
.ap-date-select.on{border-color:var(--blue);color:var(--blue);background-color:var(--blue-lt);}
.ap-report-del{
  width:36px;height:36px;border-radius:8px;
  border:1px solid transparent;background:transparent;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:var(--ink3);transition:all .12s;flex-shrink:0;
}
.ap-report-del:hover{background:var(--red-lt);color:var(--red);}

/* ── TOASTS ── */
.ap-toasts{position:fixed;bottom:24px;right:24px;z-index:400;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
.ap-toast{
  display:flex;align-items:center;gap:10px;
  padding:12px 20px;border-radius:var(--rad-lg);
  font-size:14px;font-weight:600;color:#fff;
  box-shadow:var(--sh-lg);animation:apUp .2s ease;max-width:340px;
  pointer-events:auto;
}
.ap-toast.success{background:linear-gradient(135deg,var(--green-dk),var(--green));}
.ap-toast.error{background:linear-gradient(135deg,var(--red-dk),var(--red));}
.ap-toast.info{background:linear-gradient(135deg,var(--blue),var(--purple));}

/* ── LOADING ── */
.ap-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:14px;}
.ap-loading-txt{font-size:14px;color:var(--ink3);font-weight:500;}
@keyframes spin{to{transform:rotate(360deg)}}
.ap-spin{animation:spin 1s linear infinite;color:var(--blue);}

/* ── MOBILE BOTTOM NAV (hidden on wide) ── */
.ap-bottom-nav{display:none;}
.ap-mob-fab{display:none;}

@keyframes apFade{from{opacity:0}to{opacity:1}}
@keyframes apUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  :root{--sidebar-w:0px;--pad:18px;}
  .ap-sidebar{transform:translateX(-240px);width:240px;}
  .ap-sidebar.open{transform:translateX(0);}
  .ap-main{margin-left:0;padding-bottom:76px;}
  .ap-mob-overlay{display:none;position:fixed;inset:0;z-index:55;background:rgba(7,31,22,.5);}
  .ap-mob-overlay.vis{display:block;}
  .ap-bottom-nav{
    display:flex;position:fixed;bottom:0;left:0;right:0;
    height:64px;background:var(--surf);border-top:1px solid var(--bdr);
    align-items:center;justify-content:space-around;
    padding:0 4px 6px;z-index:100;
    box-shadow:0 -4px 20px rgba(7,31,22,.08);
  }
  .ap-mob-nav-btn{
    display:flex;flex-direction:column;align-items:center;gap:3px;
    padding:6px 8px;border-radius:10px;border:none;
    background:none;font-size:10px;font-weight:600;color:var(--ink3);
    cursor:pointer;transition:all .15s;position:relative;flex:1;min-width:0;
  }
  .ap-mob-nav-btn:hover{background:var(--surf2);color:var(--blue);}
  .ap-mob-nav-btn.active{background:var(--blue-lt);color:var(--blue);}
  .ap-mob-nav-badge{
    position:absolute;top:2px;right:6px;background:var(--red);
    color:#fff;font-size:9px;font-weight:700;
    min-width:15px;height:15px;padding:0 3px;border-radius:99px;
    display:flex;align-items:center;justify-content:center;
  }
  .ap-mob-fab{
    display:flex;align-items:center;justify-content:center;
    width:46px;height:46px;border-radius:50%;border:none;
    background:linear-gradient(135deg,var(--blue),var(--purple));
    color:#fff;box-shadow:var(--sh-blue);cursor:pointer;
    transition:all .2s;flex-shrink:0;
  }
  .ap-mob-fab:hover{transform:scale(1.07);}
  /* Hide table on tablet, show cards */
  .ap-table-wrap{display:none;}
  .ap-inv-cards{display:flex;flex-direction:column;gap:10px;}
  /* Hide date columns in service txn lists */
  .gcash-txn-date,.load-txn-date,.print-txn-date,.salmon-txn-date{display:none;}
  /* Report rows: wrap gracefully */
  .ap-report-row{flex-wrap:wrap;gap:8px;}
  .ap-report-head{flex-wrap:wrap;}
}

@media(min-width:901px){
  .ap-inv-cards{display:none;}
}

@media(max-width:768px){
  .ap-stats{grid-template-columns:repeat(2,1fr);}
  .ap-history-stats{grid-template-columns:repeat(2,1fr);}
  .ap-toolbar{flex-direction:column;align-items:stretch;}
  .ap-history-toolbar{flex-direction:column;align-items:stretch;}
  .ap-topbar-title{font-size:17px;}
  .ap-capital-stats{grid-template-columns:1fr 1fr;}
  .ap-capital-entry-date{display:none;}
  /* Shrink topbar action button text on tablet */
  .ap-topbar-right .ap-btn span{display:none;}
  .ap-topbar-right .ap-btn{padding:9px 12px;}
  /* Shrink large stat values */
  .ap-stat-val{font-size:22px;}
  .cap-balance-amount{font-size:28px;}
  /* Capital entry amount: remove min-width so it doesn't overflow */
  .ap-capital-entry-amount{min-width:unset;}
}

@media(max-width:560px){
  :root{--pad:12px;}
  .ap-form-row{grid-template-columns:1fr;}
  .ap-overlay{align-items:flex-end;padding:0;}
  .ap-modal{border-radius:var(--rad-xl) var(--rad-xl) 0 0;max-width:100%;max-height:96dvh;}
  .ap-modal-head{border-radius:var(--rad-xl) var(--rad-xl) 0 0;}
  .ap-confirm-actions{flex-direction:column;}
  .ap-confirm-actions .ap-btn{justify-content:center;}
  .ap-history-stats{grid-template-columns:1fr 1fr;}
  .ap-stats{grid-template-columns:1fr 1fr;}
  .ap-stats-wide{grid-template-columns:1fr;}
  .gcash-header{flex-direction:column;align-items:flex-start;gap:12px;}
  .gcash-header-right{align-items:flex-start;}
  .load-header{flex-direction:column;align-items:flex-start;gap:12px;}
  .load-header-right{align-items:flex-start;}
  .ap-toasts{bottom:80px;right:12px;left:12px;}
  .ap-toast{max-width:100%;}
  /* Service headers stack on small phones */
  .print-header,.salmon-header{flex-direction:column;align-items:flex-start;gap:12px;}
  .print-header-right,.salmon-header-right{align-items:flex-start;}
  /* Cap balance header */
  .cap-balance-header{flex-direction:column;align-items:flex-start;gap:12px;}
  /* Stat value font */
  .ap-stat-val{font-size:20px;}
  /* Report row: stack on small screens */
  .ap-report-head{gap:8px;}
  .ap-report-total{font-size:15px;}
  /* Topbar: icon-only add button */
  .ap-topbar-right .ap-btn{padding:9px 10px;}
}

@media(max-width:400px){
  .ap-stats{grid-template-columns:1fr;}
  .ap-mob-nav-btn span{display:none;}
  .ap-mob-nav-btn{padding:8px 6px;}
}
.ap-inv-card{
  background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);
  box-shadow:var(--sh);padding:14px 16px;
  display:flex;flex-direction:column;gap:10px;
}
.ap-inv-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.ap-inv-card-info{flex:1;min-width:0;}
.ap-inv-card-name{font-weight:700;font-size:15px;color:var(--ink);line-height:1.3;}
.ap-inv-card-brand{font-size:12px;color:var(--ink3);margin-top:2px;}
.ap-inv-card-actions{display:flex;gap:6px;flex-shrink:0;}
.ap-inv-card-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
.ap-inv-card-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.ap-inv-card-price{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--green-dk);}
.ap-inv-card-qty{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;}
.ap-inv-card-qty.in{color:var(--ink);}
.ap-inv-card-qty.low{color:var(--amber-dk);}
.ap-inv-card-qty.out{color:var(--red);}
.ap-inv-card-sku{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink3);background:var(--surf3);padding:3px 7px;border-radius:5px;border:1px solid var(--bdr);}

@media(max-width:400px){
  .ap-stats{grid-template-columns:1fr;}
}

/* ── CAPITAL LOCK SCREEN ── */
.ap-capital-lock{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - var(--topbar-h) - 80px);gap:0;text-align:center;
  padding:40px 20px;
}
.ap-capital-lock-card{
  background:var(--surf);border-radius:24px;border:1px solid var(--bdr);
  box-shadow:var(--sh-lg);padding:40px 36px 36px;
  display:flex;flex-direction:column;align-items:center;gap:0;
  width:100%;max-width:360px;
}
.ap-capital-lock-ring{
  width:76px;height:76px;border-radius:50%;
  background:linear-gradient(135deg,var(--blue) 0%,var(--purple) 100%);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 28px rgba(13,158,110,.38);
  margin-bottom:20px;
}
.ap-capital-lock-title{
  font-family:'Syne',sans-serif;font-size:20px;font-weight:800;
  color:var(--ink);margin-bottom:6px;
}
.ap-capital-lock-sub{
  font-size:13px;color:var(--ink3);line-height:1.55;
  margin-bottom:28px;max-width:240px;
}
.ap-capital-pin-dots{
  display:flex;gap:12px;margin-bottom:20px;
}
.ap-capital-pin-dot{
  width:14px;height:14px;border-radius:50%;
  border:2px solid var(--bdr2);background:var(--surf2);
  transition:all .15s;
}
.ap-capital-pin-dot.filled{
  background:linear-gradient(135deg,var(--blue),var(--purple));
  border-color:transparent;
  box-shadow:0 2px 8px rgba(13,158,110,.4);
}
.ap-capital-pin-dot.err{
  background:var(--red);border-color:transparent;
  animation:apShake .35s ease;
}
@keyframes apShake{
  0%,100%{transform:translateX(0);}
  20%{transform:translateX(-4px);}
  40%{transform:translateX(4px);}
  60%{transform:translateX(-4px);}
  80%{transform:translateX(3px);}
}
.ap-capital-pinpad{
  display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
  width:100%;max-width:252px;margin-bottom:14px;
}
.ap-capital-pin-btn{
  height:60px;border-radius:14px;border:1.5px solid var(--bdr2);
  background:var(--surf2);color:var(--ink);
  font-family:'Syne',sans-serif;font-size:20px;font-weight:700;
  cursor:pointer;transition:all .12s;display:flex;
  align-items:center;justify-content:center;flex-direction:column;gap:1px;
  user-select:none;
}
.ap-capital-pin-btn:hover{background:var(--blue-lt);border-color:var(--blue);color:var(--blue);}
.ap-capital-pin-btn:active{transform:scale(.93);background:var(--blue);color:#fff;border-color:var(--blue);}
.ap-capital-pin-btn.del{background:var(--surf);color:var(--ink3);}
.ap-capital-pin-btn.del:hover{background:var(--red-lt);border-color:var(--red);color:var(--red);}
.ap-capital-pin-sub{font-size:8px;font-weight:500;color:var(--ink4);letter-spacing:.08em;line-height:1;}
.ap-capital-pin-unlock{
  width:100%;max-width:252px;height:52px;border-radius:14px;border:none;
  background:linear-gradient(135deg,var(--blue),var(--purple));
  color:#fff;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;
  cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:0 4px 20px rgba(13,158,110,.35);
}
.ap-capital-pin-unlock:hover{box-shadow:0 6px 28px rgba(13,158,110,.5);transform:translateY(-1px);}
.ap-capital-pin-unlock:active{transform:scale(.97);}
.ap-capital-pin-err{font-size:12px;color:var(--red);font-weight:600;margin-top:10px;min-height:18px;}

/* ── CAPITAL TAB ── */
.ap-capital-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
.ap-capital-entries{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);box-shadow:var(--sh);overflow:hidden;}
.ap-capital-entry{
  display:flex;align-items:center;gap:14px;
  padding:16px 20px;border-bottom:1px solid var(--bdr);
  transition:background .12s;
}
.ap-capital-entry:last-child{border-bottom:none;}
.ap-capital-entry:hover{background:var(--surf2);}
.ap-capital-entry-icon{
  width:38px;height:38px;border-radius:10px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:17px;
}
.ap-capital-entry-icon.income{background:var(--green-lt);}
.ap-capital-entry-icon.expense{background:var(--red-lt);}
.ap-capital-entry-label{font-weight:600;font-size:14px;color:var(--ink);}
.ap-capital-entry-note{font-size:12px;color:var(--ink3);margin-top:2px;}
.ap-capital-entry-date{font-size:11px;color:var(--ink4);flex-shrink:0;}
.ap-capital-entry-amount{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;flex-shrink:0;min-width:100px;text-align:right;}
.ap-capital-entry-amount.income{color:var(--green-dk);}
.ap-capital-entry-amount.expense{color:var(--red-dk);}
.ap-capital-actions{display:flex;gap:6px;flex-shrink:0;}

/* ── CAPITAL MODAL ── */
.ap-capital-modal{max-width:480px;}
.ap-capital-type-row{display:flex;gap:10px;margin-bottom:20px;}
.ap-capital-type-btn{
  flex:1;padding:16px 12px;border-radius:var(--rad-lg);border:2px solid var(--bdr2);
  background:var(--surf2);font-size:14px;font-weight:700;cursor:pointer;
  transition:all .15s;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
}
.ap-capital-type-btn .cap-type-icon{
  width:44px;height:44px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;font-size:22px;
  transition:all .15s;background:var(--surf3);
}
.ap-capital-type-btn.income.sel{background:var(--green-lt);border-color:var(--green);}
.ap-capital-type-btn.income.sel .cap-type-icon{background:rgba(0,184,122,.15);}
.ap-capital-type-btn.income.sel .cap-type-label{color:var(--green-dk);}
.ap-capital-type-btn.expense.sel{background:var(--red-lt);border-color:var(--red);}
.ap-capital-type-btn.expense.sel .cap-type-icon{background:rgba(239,68,68,.12);}
.ap-capital-type-btn.expense.sel .cap-type-label{color:var(--red-dk);}
.cap-type-label{font-size:14px;font-weight:700;}
.cap-type-sub{font-size:11px;color:var(--ink3);font-weight:400;}
.ap-capital-type-btn:not(.sel) .cap-type-label{color:var(--ink2);}
.ap-capital-amount-wrap{position:relative;}
.ap-capital-amount-prefix{
  position:absolute;left:14px;top:50%;transform:translateY(-50%);
  font-family:'Syne',sans-serif;font-size:17px;font-weight:700;
  color:var(--ink3);pointer-events:none;
}
.ap-capital-amount-input{
  width:100%;padding:13px 14px 13px 30px;
  border:1.5px solid var(--bdr2);border-radius:var(--rad);
  background:var(--surf);color:var(--ink);
  font-family:'Syne',sans-serif;font-size:20px;font-weight:700;
  outline:none;transition:border-color .15s,box-shadow .15s;
}
.ap-capital-amount-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(13,158,110,.1);}
.ap-capital-amount-input.err{border-color:var(--red);}

.ap-capital-empty{padding:56px 20px;text-align:center;}
.ap-capital-empty-icon{font-size:48px;margin-bottom:12px;opacity:.5;}
.ap-capital-empty-txt{font-size:14px;color:var(--ink3);}

@media(max-width:768px){
  .ap-capital-stats{grid-template-columns:1fr 1fr;}
  .ap-capital-entry-date{display:none;}
}

/* ── GCASH TAB ── */
.gcash-header{
  background:linear-gradient(135deg,#0070e0 0%,#00a8e8 100%);
  border-radius:var(--rad-xl);padding:28px 28px 24px;
  display:flex;align-items:center;justify-content:space-between;
  gap:20px;margin-bottom:20px;color:#fff;
  box-shadow:0 8px 32px rgba(0,112,224,.35);
  flex-wrap:wrap;
}
.gcash-header-left{display:flex;align-items:center;gap:16px;}
.gcash-header-logo{
  width:54px;height:54px;border-radius:16px;
  background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;
  font-size:28px;
  border:2px solid rgba(255,255,255,.3);
}
.gcash-header-label{font-size:12px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.gcash-header-balance{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;line-height:1;}
.gcash-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
.gcash-edit-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:9px 16px;border-radius:var(--rad);border:none;
  background:rgba(255,255,255,.2);color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;
  transition:all .15s;backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,.3);
}
.gcash-edit-btn:hover{background:rgba(255,255,255,.3);}

.gcash-charge-card{
  background:var(--surf);border:1px solid var(--bdr);
  border-radius:var(--rad-lg);box-shadow:var(--sh);
  padding:20px 24px;margin-bottom:20px;
  display:flex;align-items:center;justify-content:space-between;
  gap:16px;flex-wrap:wrap;
}
.gcash-charge-label{font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.gcash-charge-val{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;color:var(--blue);}

.gcash-txn-list{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);box-shadow:var(--sh);overflow:hidden;}
.gcash-txn{
  display:flex;align-items:center;gap:14px;
  padding:16px 20px;border-bottom:1px solid var(--bdr);
  transition:background .12s;
}
.gcash-txn:last-child{border-bottom:none;}
.gcash-txn:hover{background:var(--surf2);}
.gcash-txn-icon{
  width:40px;height:40px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.gcash-txn-icon.cashin{background:#e0f7fa;color:#0070e0;}
.gcash-txn-icon.cashout{background:var(--amber-lt);color:var(--amber-dk);}
.gcash-txn-type{font-weight:700;font-size:14px;color:var(--ink);}
.gcash-txn-sub{font-size:12px;color:var(--ink3);margin-top:2px;}
.gcash-txn-date{font-size:11px;color:var(--ink4);flex-shrink:0;}
.gcash-txn-right{text-align:right;flex-shrink:0;}
.gcash-txn-amount{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;}
.gcash-txn-amount.cashin{color:#0070e0;}
.gcash-txn-amount.cashout{color:var(--amber-dk);}
.gcash-txn-charge{font-size:11px;color:var(--ink3);margin-top:2px;}
.gcash-txn-actions{display:flex;gap:6px;flex-shrink:0;}

/* GCash add sale modal */
.gcash-type-row{display:flex;gap:10px;margin-bottom:20px;}
.gcash-type-btn{
  flex:1;padding:16px 12px;border-radius:var(--rad-lg);border:2px solid var(--bdr2);
  background:var(--surf2);font-size:14px;font-weight:700;cursor:pointer;
  transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:8px;
}
.gcash-type-btn.cashin.sel{background:#e0f7fa;border-color:#0070e0;}
.gcash-type-btn.cashin.sel .gcash-type-icon{background:rgba(0,112,224,.12);}
.gcash-type-btn.cashin.sel .gcash-type-lbl{color:#0070e0;}
.gcash-type-btn.cashout.sel{background:var(--amber-lt);border-color:var(--amber);}
.gcash-type-btn.cashout.sel .gcash-type-icon{background:rgba(245,158,11,.12);}
.gcash-type-btn.cashout.sel .gcash-type-lbl{color:var(--amber-dk);}
.gcash-type-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--surf3);transition:all .15s;}
.gcash-type-lbl{font-size:14px;font-weight:700;color:var(--ink2);}
.gcash-type-sub{font-size:11px;color:var(--ink3);}

.gcash-lock{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - var(--topbar-h) - 80px);padding:40px 20px;text-align:center;
}
.gcash-lock-card{
  background:var(--surf);border-radius:24px;border:1px solid var(--bdr);
  box-shadow:var(--sh-lg);padding:40px 36px 36px;
  display:flex;flex-direction:column;align-items:center;
  width:100%;max-width:360px;
}
.gcash-lock-ring{
  width:76px;height:76px;border-radius:50%;
  background:linear-gradient(135deg,#0070e0,#00a8e8);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 28px rgba(0,112,224,.38);margin-bottom:20px;
  font-size:34px;
}
.gcash-lock-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.gcash-lock-sub{font-size:13px;color:var(--ink3);line-height:1.55;margin-bottom:28px;max-width:240px;}

@media(max-width:768px){
  .gcash-header{padding:20px 18px;}
  .gcash-header-balance{font-size:26px;}
}

/* ── LOAD SERVICE TAB ── */
.load-header{
  background:linear-gradient(135deg,#16a34a 0%,#22c55e 100%);
  border-radius:var(--rad-xl);padding:28px 28px 24px;
  display:flex;align-items:center;justify-content:space-between;
  gap:20px;margin-bottom:20px;color:#fff;
  box-shadow:0 8px 32px rgba(22,163,74,.35);
  flex-wrap:wrap;
}
.load-header-left{display:flex;align-items:center;gap:16px;}
.load-header-logo{
  width:54px;height:54px;border-radius:16px;
  background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;
  font-size:28px;
  border:2px solid rgba(255,255,255,.3);
}
.load-header-label{font-size:12px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.load-header-balance{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;line-height:1;}
.load-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
.load-edit-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:9px 16px;border-radius:var(--rad);border:none;
  background:rgba(255,255,255,.2);color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;
  transition:all .15s;backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,.3);
}
.load-edit-btn:hover{background:rgba(255,255,255,.3);}

.load-profit-card{
  background:var(--surf);border:1px solid var(--bdr);
  border-radius:var(--rad-lg);box-shadow:var(--sh);
  padding:20px 24px;margin-bottom:20px;
  display:flex;align-items:center;justify-content:space-between;
  gap:16px;flex-wrap:wrap;
}
.load-profit-label{font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.load-profit-val{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;color:var(--green-dk);}

.load-txn-list{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);box-shadow:var(--sh);overflow:hidden;}
.load-txn{
  display:flex;align-items:center;gap:14px;
  padding:16px 20px;border-bottom:1px solid var(--bdr);
  transition:background .12s;
}
.load-txn:last-child{border-bottom:none;}
.load-txn:hover{background:var(--surf2);}
.load-txn-icon{
  width:40px;height:40px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.load-txn-icon.regular{background:var(--green-lt);color:var(--green-dk);}
.load-txn-icon.data{background:var(--blue-lt);color:var(--blue);}
.load-txn-icon.promo{background:var(--purple-lt);color:var(--purple);}
.load-txn-type{font-weight:700;font-size:14px;color:var(--ink);}
.load-txn-sub{font-size:12px;color:var(--ink3);margin-top:2px;}
.load-txn-date{font-size:11px;color:var(--ink4);flex-shrink:0;}
.load-txn-right{text-align:right;flex-shrink:0;}
.load-txn-amount{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--ink);}
.load-txn-profit{font-size:11px;color:var(--green-dk);margin-top:2px;font-weight:600;}
.load-txn-actions{display:flex;gap:6px;flex-shrink:0;}

/* Load add modal */
.load-type-row{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
.load-type-btn{
  flex:1;min-width:80px;padding:14px 10px;border-radius:var(--rad-lg);border:2px solid var(--bdr2);
  background:var(--surf2);font-size:13px;font-weight:700;cursor:pointer;
  transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:6px;
}
.load-type-btn.regular.sel{background:var(--green-lt);border-color:var(--green);}
.load-type-btn.regular.sel .load-type-icon{background:rgba(0,184,122,.12);}
.load-type-btn.regular.sel .load-type-lbl{color:var(--green-dk);}
.load-type-btn.data.sel{background:var(--blue-lt);border-color:var(--blue);}
.load-type-btn.data.sel .load-type-icon{background:rgba(13,158,110,.12);}
.load-type-btn.data.sel .load-type-lbl{color:var(--blue);}
.load-type-btn.promo.sel{background:var(--purple-lt);border-color:var(--purple);}
.load-type-btn.promo.sel .load-type-icon{background:rgba(139,92,246,.12);}
.load-type-btn.promo.sel .load-type-lbl{color:var(--purple);}
.load-type-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--surf3);transition:all .15s;}
.load-type-lbl{font-size:13px;font-weight:700;color:var(--ink2);}
.load-type-sub{font-size:10px;color:var(--ink3);}

.load-lock{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - var(--topbar-h) - 80px);padding:40px 20px;text-align:center;
}
.load-lock-card{
  background:var(--surf);border-radius:24px;border:1px solid var(--bdr);
  box-shadow:var(--sh-lg);padding:40px 36px 36px;
  display:flex;flex-direction:column;align-items:center;
  width:100%;max-width:360px;
}
.load-lock-ring{
  width:76px;height:76px;border-radius:50%;
  background:linear-gradient(135deg,#16a34a,#22c55e);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 28px rgba(22,163,74,.38);margin-bottom:20px;
  font-size:34px;
}
.load-lock-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.load-lock-sub{font-size:13px;color:var(--ink3);line-height:1.55;margin-bottom:28px;max-width:240px;}

@media(max-width:768px){
  .load-header{padding:20px 18px;}
  .load-header-balance{font-size:26px;}
}

/* ── CAPITAL BALANCE HEADER ── */
.cap-balance-header{
  background:linear-gradient(135deg,#059669 0%,#34d399 100%);
  border-radius:var(--rad-xl);padding:28px 28px 24px;
  display:flex;align-items:center;justify-content:space-between;
  gap:20px;margin-bottom:20px;color:#fff;
  box-shadow:0 8px 32px rgba(5,150,105,.35);
  flex-wrap:wrap;
}
.cap-balance-left{display:flex;align-items:center;gap:16px;}
.cap-balance-logo{
  width:54px;height:54px;border-radius:16px;
  background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;
  border:2px solid rgba(255,255,255,.3);
}
.cap-balance-label{font-size:12px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.cap-balance-amount{font-family:'Syne',sans-serif;font-size:38px;font-weight:800;line-height:1;}
.cap-balance-sub{font-size:12px;opacity:.75;margin-top:4px;}
.cap-balance-edit-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:9px 16px;border-radius:var(--rad);border:none;
  background:rgba(255,255,255,.2);color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;
  transition:all .15s;backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,.3);
}
.cap-balance-edit-btn:hover{background:rgba(255,255,255,.3);}
@media(max-width:768px){
  .cap-balance-header{padding:20px 18px;}
  .cap-balance-amount{font-size:28px;}
}

/* Capital action PIN gate modal */
.cap-pin-gate{display:flex;flex-direction:column;align-items:center;padding:28px 28px 24px;text-align:center;}
.cap-pin-gate-icon{font-size:38px;margin-bottom:12px;}
.cap-pin-gate-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.cap-pin-gate-sub{font-size:13px;color:var(--ink3);margin-bottom:24px;}
.print-header{
  background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%);
  border-radius:var(--rad-xl);padding:28px 28px 24px;
  display:flex;align-items:center;justify-content:space-between;
  gap:20px;margin-bottom:20px;color:#fff;
  box-shadow:0 8px 32px rgba(124,58,237,.35);
  flex-wrap:wrap;
}
.print-header-left{display:flex;align-items:center;gap:16px;}
.print-header-logo{
  width:54px;height:54px;border-radius:16px;
  background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;
  font-size:28px;
  border:2px solid rgba(255,255,255,.3);
}
.print-header-label{font-size:12px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.print-header-balance{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;line-height:1;}
.print-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
.print-edit-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:9px 16px;border-radius:var(--rad);border:none;
  background:rgba(255,255,255,.2);color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;
  transition:all .15s;backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,.3);
}
.print-edit-btn:hover{background:rgba(255,255,255,.3);}

.print-txn-list{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);box-shadow:var(--sh);overflow:hidden;}
.print-txn{
  display:flex;align-items:center;gap:14px;
  padding:16px 20px;border-bottom:1px solid var(--bdr);
  transition:background .12s;
}
.print-txn:last-child{border-bottom:none;}
.print-txn:hover{background:var(--surf2);}
.print-txn-icon{
  width:40px;height:40px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.print-txn-icon.photocopy{background:var(--amber-lt);color:var(--amber-dk);}
.print-txn-icon.print{background:var(--blue-lt);color:var(--blue);}
.print-txn-icon.laminate{background:var(--purple-lt);color:var(--purple);}
.print-txn-icon.scan{background:var(--green-lt);color:var(--green-dk);}
.print-txn-type{font-weight:700;font-size:14px;color:var(--ink);}
.print-txn-sub{font-size:12px;color:var(--ink3);margin-top:2px;}
.print-txn-date{font-size:11px;color:var(--ink4);flex-shrink:0;}
.print-txn-right{text-align:right;flex-shrink:0;}
.print-txn-amount{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--purple);}
.print-txn-profit{font-size:11px;color:var(--green-dk);margin-top:2px;font-weight:600;}
.print-txn-actions{display:flex;gap:6px;flex-shrink:0;}

/* Print add modal type selector */
.print-type-row{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
.print-type-btn{
  flex:1;min-width:80px;padding:14px 10px;border-radius:var(--rad-lg);border:2px solid var(--bdr2);
  background:var(--surf2);font-size:13px;font-weight:700;cursor:pointer;
  transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:6px;
}
.print-type-btn.photocopy.sel{background:var(--amber-lt);border-color:var(--amber);}
.print-type-btn.photocopy.sel .print-type-icon{background:rgba(245,158,11,.12);}
.print-type-btn.photocopy.sel .print-type-lbl{color:var(--amber-dk);}
.print-type-btn.print.sel{background:var(--blue-lt);border-color:var(--blue);}
.print-type-btn.print.sel .print-type-icon{background:rgba(13,158,110,.12);}
.print-type-btn.print.sel .print-type-lbl{color:var(--blue);}
.print-type-btn.laminate.sel{background:var(--purple-lt);border-color:var(--purple);}
.print-type-btn.laminate.sel .print-type-icon{background:rgba(139,92,246,.12);}
.print-type-btn.laminate.sel .print-type-lbl{color:var(--purple);}
.print-type-btn.scan.sel{background:var(--green-lt);border-color:var(--green);}
.print-type-btn.scan.sel .print-type-icon{background:rgba(0,184,122,.12);}
.print-type-btn.scan.sel .print-type-lbl{color:var(--green-dk);}
.print-type-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--surf3);transition:all .15s;}
.print-type-lbl{font-size:13px;font-weight:700;color:var(--ink2);}
.print-type-sub{font-size:10px;color:var(--ink3);}

.print-lock{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - var(--topbar-h) - 80px);padding:40px 20px;text-align:center;
}
.print-lock-card{
  background:var(--surf);border-radius:24px;border:1px solid var(--bdr);
  box-shadow:var(--sh-lg);padding:40px 36px 36px;
  display:flex;flex-direction:column;align-items:center;
  width:100%;max-width:360px;
}
.print-lock-ring{
  width:76px;height:76px;border-radius:50%;
  background:linear-gradient(135deg,#7c3aed,#a78bfa);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 28px rgba(124,58,237,.38);margin-bottom:20px;
  font-size:34px;
}
.print-lock-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.print-lock-sub{font-size:13px;color:var(--ink3);line-height:1.55;margin-bottom:28px;max-width:240px;}

@media(max-width:768px){
  .print-header{padding:20px 18px;}
  .print-header-balance{font-size:26px;}
}

/* ── SALMON SERVICE TAB ── */
.salmon-header{
  background:linear-gradient(135deg,#e05c00 0%,#ff8c42 100%);
  border-radius:var(--rad-xl);padding:28px 28px 24px;
  display:flex;align-items:center;justify-content:space-between;
  gap:20px;margin-bottom:20px;color:#fff;
  box-shadow:0 8px 32px rgba(224,92,0,.35);
  flex-wrap:wrap;
}
.salmon-header-left{display:flex;align-items:center;gap:16px;}
.salmon-header-logo{
  width:54px;height:54px;border-radius:16px;
  background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;
  border:2px solid rgba(255,255,255,.3);
  font-size:28px;
}
.salmon-header-label{font-size:12px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.salmon-header-balance{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;line-height:1;}
.salmon-header-sub{font-size:12px;opacity:.75;margin-top:4px;}
.salmon-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
.salmon-edit-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:9px 16px;border-radius:var(--rad);
  background:rgba(255,255,255,.2);color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;
  transition:all .15s;border:1px solid rgba(255,255,255,.3);
}
.salmon-edit-btn:hover{background:rgba(255,255,255,.3);}
.salmon-txn-list{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rad-lg);box-shadow:var(--sh);overflow:hidden;}
.salmon-txn{
  display:flex;align-items:center;gap:14px;
  padding:16px 20px;border-bottom:1px solid var(--bdr);
  transition:background .12s;
}
.salmon-txn:last-child{border-bottom:none;}
.salmon-txn:hover{background:var(--surf2);}
.salmon-txn-icon{
  width:40px;height:40px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:#fff0e8;color:#e05c00;font-size:20px;
}
.salmon-txn-label{font-weight:700;font-size:14px;color:var(--ink);}
.salmon-txn-sub{font-size:12px;color:var(--ink3);margin-top:2px;}
.salmon-txn-date{font-size:11px;color:var(--ink4);flex-shrink:0;}
.salmon-txn-right{text-align:right;flex-shrink:0;}
.salmon-txn-amount{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#e05c00;}
.salmon-txn-fee{font-size:11px;color:var(--green-dk);margin-top:2px;font-weight:600;}
.salmon-lock{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - var(--topbar-h) - 80px);padding:40px 20px;text-align:center;
}
.salmon-lock-card{
  background:var(--surf);border-radius:24px;border:1px solid var(--bdr);
  box-shadow:var(--sh-lg);padding:40px 36px 36px;
  display:flex;flex-direction:column;align-items:center;
  width:100%;max-width:360px;
}
.salmon-lock-ring{
  width:76px;height:76px;border-radius:50%;
  background:linear-gradient(135deg,#e05c00,#ff8c42);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 28px rgba(224,92,0,.38);margin-bottom:20px;
  font-size:34px;
}
.salmon-lock-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.salmon-lock-sub{font-size:13px;color:var(--ink3);line-height:1.55;margin-bottom:28px;max-width:240px;}
@media(max-width:768px){.salmon-header{padding:20px 18px;}.salmon-header-balance{font-size:26px;}}
`;

// ─────────────────────────────────────────────
//  STYLE INJECTOR
// ─────────────────────────────────────────────
function useStyles() {
  useEffect(() => {
    const id = "ap-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    document.documentElement.style.cssText = "margin:0;padding:0;width:100%;";
    document.body.style.cssText = "margin:0;padding:0;width:100%;";
    const root = document.getElementById("root");
    if (root) root.style.cssText = "width:100%;min-height:100vh;margin:0;padding:0;";
  }, []);
}

// ─────────────────────────────────────────────
//  TOAST HOOK
// ─────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "success") => {
    const id = Math.random().toString(36).slice(2, 10);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}

// ─────────────────────────────────────────────
//  FIREBASE INVENTORY HOOK
// ─────────────────────────────────────────────
function useInventory(toast) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setOnline(true);
      },
      (err) => {
        console.error(err);
        setOnline(false);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const addItem = useCallback(async (form) => {
    try {
      await addDoc(collection(db, "inventory"), {
        sku: (form.sku || "").trim().toUpperCase(),
        name: form.name.trim(),
        brand: (form.brand || "").trim(),
        price: Math.round(+form.price),
        qty: Math.max(0, Math.round(+form.qty)),
        low: Math.max(1, Math.round(+form.low) || 3),
        desc: form.desc?.trim() || "",
        freeItems: form.freeItems || [],
        freeItemsOther: form.freeItemsOther?.trim() || "",
        imeis: (form.imeis || []).map((v) => (v || "").trim()),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      toast?.("Failed to add part: " + e.message, "error");
    }
  }, [toast]);

  const updateItem = useCallback(async (form) => {
    try {
      const ref = doc(db, "inventory", form.id);
      await updateDoc(ref, {
        sku: (form.sku || "").trim().toUpperCase(),
        name: form.name.trim(),
        brand: (form.brand || "").trim(),
        price: Math.round(+form.price),
        qty: Math.max(0, Math.round(+form.qty)),
        low: Math.max(1, Math.round(+form.low) || 3),
        desc: form.desc?.trim() || "",
        freeItems: form.freeItems || [],
        freeItemsOther: form.freeItemsOther?.trim() || "",
        imeis: (form.imeis || []).map((v) => (v || "").trim()),
      });
    } catch (e) {
      toast?.("Failed to update: " + e.message, "error");
    }
  }, [toast]);

  const deleteItem = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "inventory", id));
    } catch (e) {
      toast?.("Failed to delete: " + e.message, "error");
    }
  }, [toast]);

  const deductQty = useCallback(async (saleItems) => {
    try {
      await Promise.all(
        saleItems.map((s) => {
          const updates = {
            qty: Math.max(0, s.currentQty - s.qty),
            updatedAt: serverTimestamp(),
          };
          // Accessories go to their own collection, no IMEI tracking
          if (s._isAccessory) {
            return updateDoc(doc(db, "accessories", s.id), updates);
          }
          // Remove sold units from the imeis array (by index if available, else by value)
          if (s.soldIdxs && s.soldIdxs.length > 0) {
            const item = items.find((i) => i.id === s.id);
            const remaining = (item?.imeis || []).filter((_, i) => !s.soldIdxs.includes(i));
            updates.imeis = remaining;
          } else if (s.soldImeis && s.soldImeis.length > 0) {
            const item = items.find((i) => i.id === s.id);
            const remaining = (item?.imeis || []).filter((imei) => !s.soldImeis.includes(imei));
            updates.imeis = remaining;
          }
          return updateDoc(doc(db, "inventory", s.id), updates);
        })
      );
    } catch (e) {
      toast?.("Failed to deduct stock: " + e.message, "error");
    }
  }, [toast, items]);

  return { items, loading, online, addItem, updateItem, deleteItem, deductQty };
}

// ─────────────────────────────────────────────
//  FIREBASE ACCESSORIES HOOK
// ─────────────────────────────────────────────
function useAccessories(toast) {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "accessories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAccessories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const addAccessory = useCallback(async (form) => {
    try {
      await addDoc(collection(db, "accessories"), {
        name: form.name.trim(),
        brand: (form.brand || "").trim(),
        price: Math.round(+form.price),
        qty: Math.max(0, Math.round(+form.qty)),
        low: Math.max(1, Math.round(+form.low) || 3),
        desc: form.desc?.trim() || "",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      toast?.("Failed to add accessory: " + e.message, "error");
    }
  }, [toast]);

  const updateAccessory = useCallback(async (form) => {
    try {
      const ref = doc(db, "accessories", form.id);
      await updateDoc(ref, {
        name: form.name.trim(),
        brand: (form.brand || "").trim(),
        price: Math.round(+form.price),
        qty: Math.max(0, Math.round(+form.qty)),
        low: Math.max(1, Math.round(+form.low) || 3),
        desc: form.desc?.trim() || "",
      });
    } catch (e) {
      toast?.("Failed to update accessory: " + e.message, "error");
    }
  }, [toast]);

  const deleteAccessory = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "accessories", id));
    } catch (e) {
      toast?.("Failed to delete accessory: " + e.message, "error");
    }
  }, [toast]);

  return { accessories, loading, addAccessory, updateAccessory, deleteAccessory };
}

// ─────────────────────────────────────────────
//  FIREBASE SALES HISTORY HOOK
// ─────────────────────────────────────────────
function useSalesHistory(toast) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("soldAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addSaleReport = useCallback(async (saleItems, paymentInfo = {}) => {
    const total = saleItems.reduce((s, i) => s + i.price * i.qty, 0);
    // Sanitize: remove any undefined fields so Firestore doesn't reject
    const cleanItems = saleItems.map((i) => {
      const obj = {};
      Object.entries(i).forEach(([k, v]) => { if (v !== undefined) obj[k] = v; });
      return obj;
    });
    try {
      await addDoc(collection(db, "sales"), {
        items: cleanItems,
        total,
        soldAt: serverTimestamp(),
        paymentMethod: paymentInfo.paymentMethod || "cash",
        downpayment: paymentInfo.downpayment || 0,
        balance: paymentInfo.balance || 0,
        charge: paymentInfo.charge || 0,
      });
    } catch (e) {
      toast?.("Failed to save sale: " + e.message, "error");
    }
  }, [toast]);

  const deleteSaleReport = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "sales", id));
    } catch (e) {
      toast?.("Failed to delete record: " + e.message, "error");
    }
  }, [toast]);

  const updateSaleReport = useCallback(async (id, updatedItems) => {
    const total = updatedItems.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      await updateDoc(doc(db, "sales", id), { items: updatedItems, total });
    } catch (e) {
      toast?.("Failed to update sale: " + e.message, "error");
    }
  }, [toast]);

  return { reports, loading, addSaleReport, deleteSaleReport, updateSaleReport };
}

// ─────────────────────────────────────────────
//  FIREBASE CAPITAL HOOK
// ─────────────────────────────────────────────
function useCapital(toast) {
  const [entries, setEntries] = useState([]);
  const [capitalBalance, setCapitalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to balance doc
    const balUnsub = onSnapshot(doc(db, "capitalMeta", "balance"), (snap) => {
      if (snap.exists()) {
        setCapitalBalance(snap.data().amount || 0);
      } else {
        import("firebase/firestore").then(({ setDoc }) =>
          setDoc(doc(db, "capitalMeta", "balance"), { amount: 0 })
        ).catch(() => { });
      }
    }, (err) => { console.error(err); });

    const q = query(collection(db, "capital"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => { balUnsub(); unsub(); };
  }, []);

  const setBalance = useCallback(async (amount) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "capitalMeta", "balance"), { amount: Math.round(amount) });
    } catch (e) {
      toast?.("Failed to update capital balance: " + e.message, "error");
    }
  }, [toast]);

  const addEntry = useCallback(async (form, currentBalance) => {
    try {
      const amount = Math.round(+form.amount);
      await addDoc(collection(db, "capital"), {
        label: form.label.trim(),
        amount,
        capitalCost: form.capitalCost ? Math.round(+form.capitalCost) : 0,
        type: form.type, // "income" | "expense"
        note: form.note?.trim() || "",
        autoSale: !!form.autoSale,
        autoPrint: !!form.autoPrint,
        createdAt: serverTimestamp(),
      });
      // Only update running balance for real entries (not autoPrint view-only)
      if (!form.autoPrint && currentBalance !== undefined) {
        const newBal = form.type === "income"
          ? currentBalance + amount
          : currentBalance - amount;
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "capitalMeta", "balance"), { amount: Math.round(newBal) });
      }
    } catch (e) {
      toast?.("Failed to add entry: " + e.message, "error");
    }
  }, [toast]);

  const updateEntry = useCallback(async (form, oldEntry, currentBalance) => {
    try {
      const ref = doc(db, "capital", form.id);
      const newAmount = Math.round(+form.amount);
      await updateDoc(ref, {
        label: form.label.trim(),
        amount: newAmount,
        capitalCost: form.capitalCost ? Math.round(+form.capitalCost) : 0,
        type: form.type,
        note: form.note?.trim() || "",
        updatedAt: serverTimestamp(),
      });
      // Adjust balance: reverse old, apply new (skip autoPrint)
      if (!form.autoPrint && !oldEntry?.autoPrint && currentBalance !== undefined) {
        const oldAmt = oldEntry?.amount || 0;
        const oldType = oldEntry?.type || form.type;
        // Reverse old effect
        let bal = oldType === "income" ? currentBalance - oldAmt : currentBalance + oldAmt;
        // Apply new effect
        bal = form.type === "income" ? bal + newAmount : bal - newAmount;
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "capitalMeta", "balance"), { amount: Math.round(bal) });
      }
    } catch (e) {
      toast?.("Failed to update entry: " + e.message, "error");
    }
  }, [toast]);

  const deleteEntry = useCallback(async (id, entry, currentBalance) => {
    try {
      await deleteDoc(doc(db, "capital", id));
      // Reverse balance effect (skip autoPrint)
      if (!entry?.autoPrint && currentBalance !== undefined) {
        const amt = entry?.amount || 0;
        const bal = entry?.type === "income"
          ? currentBalance - amt
          : currentBalance + amt;
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "capitalMeta", "balance"), { amount: Math.round(Math.max(0, bal)) });
      }
    } catch (e) {
      toast?.("Failed to delete entry: " + e.message, "error");
    }
  }, [toast]);

  return { entries, capitalBalance, loading, addEntry, updateEntry, deleteEntry, setBalance };
}

// ─────────────────────────────────────────────
//  FIREBASE GCASH HOOK
// ─────────────────────────────────────────────
function useGCash(toast) {
  const [gcashData, setGcashData] = useState({ balance: 0, charge: 0 });
  const [gcashTxns, setGcashTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for wallet doc
    const walletUnsub = onSnapshot(doc(db, "gcash", "wallet"), (snap) => {
      if (snap.exists()) {
        setGcashData({ balance: snap.data().balance || 0, charge: snap.data().charge || 0 });
      } else {
        // Create initial doc
        import("firebase/firestore").then(({ setDoc }) =>
          setDoc(doc(db, "gcash", "wallet"), { balance: 0, charge: 0 })
        ).catch(() => { });
      }
    }, (err) => { console.error(err); });

    // Listen for transactions
    const txnUnsub = onSnapshot(
      query(collection(db, "gcashTxns"), orderBy("createdAt", "desc")),
      (snap) => {
        setGcashTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );

    return () => { walletUnsub(); txnUnsub(); };
  }, []);

  const updateWallet = useCallback(async (balance, charge) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "gcash", "wallet"), { balance, charge });
    } catch (e) {
      toast?.("Failed to update wallet: " + e.message, "error");
    }
  }, [toast]);

  const addTxn = useCallback(async (form, currentBalance, currentCharge) => {
    try {
      const amount = Math.round(+form.amount);
      const charge = Math.round(+form.charge);
      const newBalance = form.type === "cashin"
        ? currentBalance + amount
        : currentBalance - amount;
      const newCharge = currentCharge + charge;

      await addDoc(collection(db, "gcashTxns"), {
        type: form.type,
        amount,
        charge,
        phone: form.phone.trim(),
        createdAt: serverTimestamp(),
      });

      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "gcash", "wallet"), { balance: newBalance, charge: newCharge });
    } catch (e) {
      toast?.("Failed to record GCash transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const deleteTxn = useCallback(async (txn, currentBalance, currentCharge) => {
    try {
      // Reverse the effect on balance & charge
      const newBalance = txn.type === "cashin"
        ? currentBalance - txn.amount
        : currentBalance + txn.amount;
      const newCharge = Math.max(0, currentCharge - txn.charge);

      await deleteDoc(doc(db, "gcashTxns", txn.id));
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "gcash", "wallet"), { balance: newBalance, charge: newCharge });
    } catch (e) {
      toast?.("Failed to delete transaction: " + e.message, "error");
    }
  }, [toast]);

  const resetTxns = useCallback(async (keepBalance) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      // Keep all transaction history — only reset running totals
      await setDoc(doc(db, "gcash", "wallet"), { balance: keepBalance, charge: 0 });
    } catch (e) {
      toast?.("Failed to reset GCash: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const updateTxn = useCallback(async (txn, newForm, currentBalance, currentCharge) => {
    try {
      // Reverse old txn effect
      const oldBalance = txn.type === "cashin"
        ? currentBalance - txn.amount
        : currentBalance + txn.amount;
      const oldCharge = Math.max(0, currentCharge - txn.charge);
      // Apply new txn effect
      const newAmount = Math.round(+newForm.amount);
      const newCharge = Math.round(+newForm.charge);
      const newBalance = newForm.type === "cashin"
        ? oldBalance + newAmount
        : oldBalance - newAmount;
      const finalCharge = oldCharge + newCharge;

      await updateDoc(doc(db, "gcashTxns", txn.id), {
        type: newForm.type,
        amount: newAmount,
        charge: newCharge,
        phone: newForm.phone.trim(),
      });
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "gcash", "wallet"), { balance: newBalance, charge: finalCharge });
    } catch (e) {
      toast?.("Failed to update GCash transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  return { gcashData, gcashTxns, loading, updateWallet, addTxn, updateTxn, deleteTxn, resetTxns };
}

// ─────────────────────────────────────────────
//  FIREBASE LOAD SERVICE HOOK
// ─────────────────────────────────────────────
// Helper: map network name to wallet key
const networkToWalletKey = (network) => {
  const n = (network || "").toLowerCase();
  if (n === "smart" || n === "tnt") return "smartTnt";
  if (n === "globe" || n === "tm") return "globeTm";
  return "dito";
};

function useLoadService(toast) {
  const [loadData, setLoadData] = useState({ smartTnt: 0, globeTm: 0, dito: 0, totalProfit: 0 });
  const [loadTxns, setLoadTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const walletUnsub = onSnapshot(doc(db, "load", "wallet"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setLoadData({
          smartTnt: d.smartTnt ?? d.balance ?? 0,
          globeTm: d.globeTm ?? 0,
          dito: d.dito ?? 0,
          totalProfit: d.totalProfit || 0,
        });
      } else {
        import("firebase/firestore").then(({ setDoc }) =>
          setDoc(doc(db, "load", "wallet"), { smartTnt: 0, globeTm: 0, dito: 0, totalProfit: 0 })
        ).catch(() => { });
      }
    }, (err) => { console.error(err); });

    const txnUnsub = onSnapshot(
      query(collection(db, "loadTxns"), orderBy("createdAt", "desc")),
      (snap) => {
        setLoadTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );

    return () => { walletUnsub(); txnUnsub(); };
  }, []);

  const updateWallet = useCallback(async (smartTnt, globeTm, dito, totalProfit) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "load", "wallet"), { smartTnt, globeTm, dito, totalProfit });
    } catch (e) {
      toast?.("Failed to update load wallet: " + e.message, "error");
    }
  }, [toast]);

  const addTxn = useCallback(async (form, currentData) => {
    try {
      const cost = Math.round(+form.cost);
      const sellingPrice = Math.round(+form.sellingPrice);
      const profit = sellingPrice - cost;
      const walletKey = networkToWalletKey(form.network);
      const newWallet = {
        smartTnt: currentData.smartTnt,
        globeTm: currentData.globeTm,
        dito: currentData.dito,
        totalProfit: currentData.totalProfit + profit,
      };
      newWallet[walletKey] = currentData[walletKey] - cost;

      await addDoc(collection(db, "loadTxns"), {
        type: form.type,
        network: form.network.trim(),
        phone: form.phone.trim(),
        cost,
        sellingPrice,
        profit,
        note: form.note?.trim() || "",
        createdAt: serverTimestamp(),
      });

      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "load", "wallet"), newWallet);
    } catch (e) {
      toast?.("Failed to record load transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const deleteTxn = useCallback(async (txn, currentData) => {
    try {
      const walletKey = networkToWalletKey(txn.network);
      const newWallet = {
        smartTnt: currentData.smartTnt,
        globeTm: currentData.globeTm,
        dito: currentData.dito,
        totalProfit: Math.max(0, currentData.totalProfit - txn.profit),
      };
      newWallet[walletKey] = currentData[walletKey] + txn.cost;
      await deleteDoc(doc(db, "loadTxns", txn.id));
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "load", "wallet"), newWallet);
    } catch (e) {
      toast?.("Failed to delete load transaction: " + e.message, "error");
    }
  }, [toast]);

  const resetTxns = useCallback(async (keepData) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "load", "wallet"), {
        smartTnt: keepData.smartTnt,
        globeTm: keepData.globeTm,
        dito: keepData.dito,
        totalProfit: 0,
      });
    } catch (e) {
      toast?.("Failed to reset Load Service: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const updateTxn = useCallback(async (txn, newForm, currentData) => {
    try {
      const oldKey = networkToWalletKey(txn.network);
      const newKey = networkToWalletKey(newForm.network);
      const newCost = Math.round(+newForm.cost);
      const newSellingPrice = Math.round(+newForm.sellingPrice);
      const newProfit = newSellingPrice - newCost;

      // Reverse old txn
      const newWallet = {
        smartTnt: currentData.smartTnt,
        globeTm: currentData.globeTm,
        dito: currentData.dito,
        totalProfit: Math.max(0, currentData.totalProfit - txn.profit) + newProfit,
      };
      newWallet[oldKey] = newWallet[oldKey] + txn.cost;
      // Apply new txn (handle same key case)
      newWallet[newKey] = newWallet[newKey] - newCost;

      await updateDoc(doc(db, "loadTxns", txn.id), {
        type: newForm.type,
        network: newForm.network.trim(),
        phone: newForm.phone.trim(),
        cost: newCost,
        sellingPrice: newSellingPrice,
        profit: newProfit,
        note: newForm.note?.trim() || "",
      });
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "load", "wallet"), newWallet);
    } catch (e) {
      toast?.("Failed to update load transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  return { loadData, loadTxns, loading, updateWallet, addTxn, updateTxn, deleteTxn, resetTxns };
}

// ─────────────────────────────────────────────
//  FIREBASE PRINT SERVICE HOOK
// ─────────────────────────────────────────────
function usePrintService(toast) {
  const [printData, setPrintData] = useState({ totalRevenue: 0, totalProfit: 0 });
  const [printTxns, setPrintTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const walletUnsub = onSnapshot(doc(db, "print", "stats"), (snap) => {
      if (snap.exists()) {
        setPrintData({ totalRevenue: snap.data().totalRevenue || 0, totalProfit: snap.data().totalProfit || 0 });
      } else {
        import("firebase/firestore").then(({ setDoc }) =>
          setDoc(doc(db, "print", "stats"), { totalRevenue: 0, totalProfit: 0 })
        ).catch(() => { });
      }
    }, (err) => { console.error(err); });

    const txnUnsub = onSnapshot(
      query(collection(db, "printTxns"), orderBy("createdAt", "desc")),
      (snap) => {
        setPrintTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );

    return () => { walletUnsub(); txnUnsub(); };
  }, []);

  const updateStats = useCallback(async (totalRevenue, totalProfit) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "print", "stats"), { totalRevenue, totalProfit });
    } catch (e) {
      toast?.("Failed to update print stats: " + e.message, "error");
    }
  }, [toast]);

  const addTxn = useCallback(async (form, currentRevenue, currentProfit) => {
    try {
      const sellingPrice = Math.round(+form.sellingPrice);
      const cost = Math.round(+form.cost);
      const profit = sellingPrice - cost;
      const qty = Math.max(1, Math.round(+form.qty));
      const totalForTxn = sellingPrice * qty;
      const costForTxn = cost * qty;
      const profitForTxn = totalForTxn - costForTxn;

      await addDoc(collection(db, "printTxns"), {
        type: form.type, // "photocopy"|"print"|"laminate"|"scan"
        subtype: form.subtype || "",
        qty,
        sellingPrice,
        cost,
        totalAmount: totalForTxn,
        totalCost: costForTxn,
        profit: profitForTxn,
        note: form.note?.trim() || "",
        createdAt: serverTimestamp(),
      });

      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "print", "stats"), {
        totalRevenue: currentRevenue + totalForTxn,
        totalProfit: currentProfit + profitForTxn,
      });
    } catch (e) {
      toast?.("Failed to record print transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const deleteTxn = useCallback(async (txn, currentRevenue, currentProfit) => {
    try {
      const newRevenue = Math.max(0, currentRevenue - txn.totalAmount);
      const newProfit = Math.max(0, currentProfit - txn.profit);
      await deleteDoc(doc(db, "printTxns", txn.id));
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "print", "stats"), { totalRevenue: newRevenue, totalProfit: newProfit });
    } catch (e) {
      toast?.("Failed to delete print transaction: " + e.message, "error");
    }
  }, [toast]);

  const resetTxns = useCallback(async () => {
    try {
      const { setDoc } = await import("firebase/firestore");
      // Keep all transaction history — only reset running totals
      await setDoc(doc(db, "print", "stats"), { totalRevenue: 0, totalProfit: 0 });
    } catch (e) {
      toast?.("Failed to reset Print Service: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const updateTxn = useCallback(async (txn, newForm, currentRevenue, currentProfit) => {
    try {
      const oldRevenue = Math.max(0, currentRevenue - txn.totalAmount);
      const oldProfit = Math.max(0, currentProfit - txn.profit);
      const newSellingPrice = Math.round(+newForm.sellingPrice);
      const newCost = Math.round(+newForm.cost);
      const newQty = Math.max(1, Math.round(+newForm.qty));
      const newTotalAmount = newSellingPrice * newQty;
      const newTotalCost = newCost * newQty;
      const newProfitForTxn = newTotalAmount - newTotalCost;

      await updateDoc(doc(db, "printTxns", txn.id), {
        type: newForm.type,
        subtype: newForm.subtype || "",
        qty: newQty,
        sellingPrice: newSellingPrice,
        cost: newCost,
        totalAmount: newTotalAmount,
        totalCost: newTotalCost,
        profit: newProfitForTxn,
        note: newForm.note?.trim() || "",
      });
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "print", "stats"), {
        totalRevenue: oldRevenue + newTotalAmount,
        totalProfit: oldProfit + newProfitForTxn,
      });
    } catch (e) {
      toast?.("Failed to update print transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  return { printData, printTxns, loading, updateStats, addTxn, updateTxn, deleteTxn, resetTxns };
}

// ─────────────────────────────────────────────
//  FIREBASE SALMON SERVICE HOOK
// ─────────────────────────────────────────────
// Business logic:
//   - Customer has utang kay Salmon (buy-now-pay-later)
//   - Customer pays US (the store) their Salmon balance
//   - We pay Salmon via bank/bills payment on their behalf
//   - We charge 2% fee on top of the payment amount (our earnings)
//   - salmonFund = our running "on-hand" fund received from customers
//   - Each txn records: customerName, utangAmount (full Salmon balance),
//     amountPaid (what customer paid us), fee (2% of amountPaid), note
function useSalmonService(toast) {
  const [salmonData, setSalmonData] = useState({ fund: 0, totalFees: 0 });
  const [salmonTxns, setSalmonTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const walletUnsub = onSnapshot(doc(db, "salmon", "stats"), (snap) => {
      if (snap.exists()) {
        setSalmonData({ fund: snap.data().fund || 0, totalFees: snap.data().totalFees || 0 });
      } else {
        import("firebase/firestore").then(({ setDoc }) =>
          setDoc(doc(db, "salmon", "stats"), { fund: 0, totalFees: 0 })
        ).catch(() => { });
      }
    }, (err) => { console.error(err); });

    const txnUnsub = onSnapshot(
      query(collection(db, "salmonTxns"), orderBy("createdAt", "desc")),
      (snap) => {
        setSalmonTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );

    return () => { walletUnsub(); txnUnsub(); };
  }, []);

  const updateStats = useCallback(async (fund, totalFees) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "salmon", "stats"), { fund, totalFees });
    } catch (e) {
      toast?.("Failed to update Salmon stats: " + e.message, "error");
    }
  }, [toast]);

  const addTxn = useCallback(async (form, currentFund, currentFees) => {
    try {
      const amountPaid = Math.round(+form.amountPaid);
      const feeRate = Math.max(0, +form.feeRate || 2) / 100;
      const fee = Math.round(amountPaid * feeRate);
      const utangAmount = Math.round(+form.utangAmount);

      await addDoc(collection(db, "salmonTxns"), {
        billerType: form.billerType || "salmon",
        customerName: form.customerName.trim(),
        utangAmount,   // full balance of customer
        amountPaid,    // amount customer paid us
        feeRate: +form.feeRate || 2,
        fee,           // our earnings (2% of amountPaid)
        note: form.note?.trim() || "",
        createdAt: serverTimestamp(),
      });

      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "salmon", "stats"), {
        fund: currentFund + amountPaid,
        totalFees: currentFees + fee,
      });
    } catch (e) {
      toast?.("Failed to record Salmon transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const deleteTxn = useCallback(async (txn, currentFund, currentFees) => {
    try {
      const newFund = Math.max(0, currentFund - txn.amountPaid);
      const newFees = Math.max(0, currentFees - txn.fee);
      await deleteDoc(doc(db, "salmonTxns", txn.id));
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "salmon", "stats"), { fund: newFund, totalFees: newFees });
    } catch (e) {
      toast?.("Failed to delete Salmon transaction: " + e.message, "error");
    }
  }, [toast]);

  const resetTxns = useCallback(async (keepFund) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      // Keep all transaction history — only reset running totals
      await setDoc(doc(db, "salmon", "stats"), { fund: keepFund, totalFees: 0 });
    } catch (e) {
      toast?.("Failed to reset Bills Service: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  const updateTxn = useCallback(async (txn, newForm, currentFund, currentFees) => {
    try {
      const oldFund = Math.max(0, currentFund - txn.amountPaid);
      const oldFees = Math.max(0, currentFees - txn.fee);
      const newAmountPaid = Math.round(+newForm.amountPaid);
      const newFeeRate = Math.max(0, +newForm.feeRate || 2) / 100;
      const newFee = Math.round(newAmountPaid * newFeeRate);
      const newUtangAmount = Math.round(+newForm.utangAmount);

      await updateDoc(doc(db, "salmonTxns", txn.id), {
        billerType: newForm.billerType || "salmon",
        customerName: newForm.customerName.trim(),
        utangAmount: newUtangAmount,
        amountPaid: newAmountPaid,
        feeRate: +newForm.feeRate || 2,
        fee: newFee,
        note: newForm.note?.trim() || "",
      });
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "salmon", "stats"), {
        fund: oldFund + newAmountPaid,
        totalFees: oldFees + newFee,
      });
    } catch (e) {
      toast?.("Failed to update Salmon transaction: " + e.message, "error");
      throw e;
    }
  }, [toast]);

  return { salmonData, salmonTxns, loading, updateStats, addTxn, updateTxn, deleteTxn, resetTxns };
}

// ─────────────────────────────────────────────
//  DATE FILTER HELPERS
// ─────────────────────────────────────────────
const DATE_FILTERS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "last", label: "Last Month" },
];

function matchesDateFilter(ts, key) {
  if (!ts) return key === "all";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  if (key === "all") return true;
  if (key === "today") return d.toDateString() === now.toDateString();
  if (key === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (key === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (key === "last") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return d >= lastMonth && d <= lastMonthEnd;
  }
  return true;
}

// ─────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────
function StatCard({ label, value, color, sub, icon: Icon }) {
  return (
    <div className="ap-stat">
      {Icon && (
        <div className={`ap-stat-icon ${color || "blue"}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
      <div className="ap-stat-label">{label}</div>
      <div className={`ap-stat-val${color ? ` ${color}` : ""}`}>{value}</div>
      {sub && <div className="ap-stat-sub">{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  INVENTORY TAB — with Units / Accessories sub-tabs
// ─────────────────────────────────────────────
function InventoryTab({ items, loading, onAdd, onEdit, onDelete, accessories, accLoading, onAddAcc, onEditAcc, onDeleteAcc, subTab, setSubTab }) {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const stats = useMemo(() => ({
    total: items.length,
    in: items.filter((i) => stockStatus(i) === "in").length,
    low: items.filter((i) => stockStatus(i) === "low").length,
    out: items.filter((i) => stockStatus(i) === "out").length,
    value: items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0),
    units: items.reduce((s, i) => s + (Number(i.qty) || 0), 0),
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      const matchQ = !q || [item.name, item.brand, item.desc].some((v) => v?.toLowerCase().includes(q));
      const matchS = !stockFilter || stockStatus(item) === stockFilter;
      return matchQ && matchS;
    });
  }, [items, search, stockFilter]);

  const alertCount = useMemo(
    () => items.filter((i) => stockStatus(i) === "low" || stockStatus(i) === "out").length,
    [items]
  );
  const accAlertCount = useMemo(
    () => accessories.filter((i) => stockStatus(i) === "low" || stockStatus(i) === "out").length,
    [accessories]
  );

  return (
    <>
      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid var(--bdr)", paddingBottom: 0 }}>
        <button
          onClick={() => setSubTab("units")}
          style={{
            padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            border: "none", background: "none",
            color: subTab === "units" ? "var(--blue)" : "var(--ink3)",
            borderBottom: subTab === "units" ? "2px solid var(--blue)" : "2px solid transparent",
            marginBottom: -2, transition: "all .15s", display: "flex", alignItems: "center", gap: 7,
          }}
        >
          <Smartphone size={15} strokeWidth={1.8} /> Units
          {alertCount > 0 && (
            <span style={{ background: "var(--red)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{alertCount}</span>
          )}
        </button>
        <button
          onClick={() => setSubTab("accessories")}
          style={{
            padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            border: "none", background: "none",
            color: subTab === "accessories" ? "var(--blue)" : "var(--ink3)",
            borderBottom: subTab === "accessories" ? "2px solid var(--blue)" : "2px solid transparent",
            marginBottom: -2, transition: "all .15s", display: "flex", alignItems: "center", gap: 7,
          }}
        >
          🎧 Accessories
          {accAlertCount > 0 && (
            <span style={{ background: "var(--red)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{accAlertCount}</span>
          )}
        </button>
      </div>

      {subTab === "units" ? (
        <>
          {loading ? (
            <div className="ap-loading">
              <Loader2 size={32} className="ap-spin" />
              <div className="ap-loading-txt">Loading inventory from Firebase…</div>
            </div>
          ) : (
            <>
              <div className="ap-stats">
                <StatCard label="Total Units" value={stats.total} icon={Package} color="blue" />
                <StatCard label="In Stock" value={stats.in} color="green" sub={`${stats.in} of ${stats.total} units`} icon={CheckCircle} />
                <StatCard label="Low Stock" value={stats.low} color="amber" sub="Need restocking" icon={AlertTriangle} />
                <StatCard label="Out of Stock" value={stats.out} color="red" sub="Unavailable" icon={AlertCircle} />
              </div>
              <div className="ap-stats ap-stats-wide">
                <StatCard label="Inventory Value" value={`₱${fmt(stats.value)}`} color="blue" sub="Total stock worth" icon={BarChart3} />
                <StatCard label="Total Units" value={fmt(stats.units)} sub="Units in stock" icon={Tag} color="green" />
              </div>

              <div className="ap-toolbar">
                <div className="ap-search-wrap">
                  <span className="ap-search-icon"><Search size={16} strokeWidth={1.8} /></span>
                  <input
                    className="ap-search"
                    placeholder="Search by name, brand…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select className="ap-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                  <option value="">All Stock Levels</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
                <button className="ap-btn primary" onClick={onAdd}>
                  <Plus size={15} strokeWidth={2.2} /> Add
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className="ap-empty">
                  <div className="ap-empty-icon">📦</div>
                  <div className="ap-empty-txt">No parts found. Try adjusting your filters.</div>
                </div>
              ) : (
                <>
                  {/* ── Desktop/Tablet Table ── */}
                  <div className="ap-table-wrap">
                    <table className="ap-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((item) => {
                          const s = stockStatus(item);
                          return (
                            <tr key={item.id}>
                              <td>
                                <div className="ap-table-name">{item.name}</div>
                                <div className="ap-table-brand">{item.brand || "—"}</div>
                                {getFreeItems(item).length > 0 && (
                                  <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {getFreeItems(item).map((fi, fii) => (
                                      <span key={fii} className="ap-badge-free">
                                        <Gift size={10} strokeWidth={2} /> {freeItemEmoji(fi)} {fi}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div className="ap-table-price">₱{fmt(item.price)}</div>
                              </td>
                              <td>
                                <span className={`ap-table-qty ${s}`}>{item.qty}</span>
                              </td>
                              <td>
                                <span className={`ap-badge ${s}`}>
                                  {s === "low" && <TrendingDown size={10} strokeWidth={2.5} />}
                                  {STOCK_LABELS[s]}
                                </span>
                              </td>
                              <td>
                                <div className="ap-table-actions" style={{ justifyContent: "flex-end" }}>
                                  <button className="ap-btn ghost sm icon" title="Edit" onClick={() => onEdit(item)}>
                                    <Pencil size={15} strokeWidth={1.8} />
                                  </button>
                                  <button className="ap-btn ghost sm icon" title="Delete" style={{ color: "var(--red)" }} onClick={() => onDelete(item)}>
                                    <Trash2 size={15} strokeWidth={1.8} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Mobile Cards ── */}
                  <div className="ap-inv-cards">
                    {filtered.map((item) => {
                      const s = stockStatus(item);
                      return (
                        <div className="ap-inv-card" key={item.id}>
                          <div className="ap-inv-card-top">
                            <div className="ap-inv-card-info">
                              <div className="ap-inv-card-name">{item.name}</div>
                              <div className="ap-inv-card-brand">{item.brand || "—"}</div>
                              {getFreeItems(item).length > 0 && (
                                <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {getFreeItems(item).map((fi, fii) => (
                                    <span key={fii} className="ap-badge-free" style={{ display: "inline-flex" }}>
                                      <Gift size={10} strokeWidth={2} /> {freeItemEmoji(fi)} {fi}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="ap-inv-card-actions">
                              <button
                                className="ap-btn ghost sm icon"
                                title="Edit"
                                onClick={() => onEdit(item)}
                                style={{ background: "var(--blue-lt)", color: "var(--blue)", border: "1.5px solid rgba(13,158,110,.2)" }}
                              >
                                <Pencil size={15} strokeWidth={1.8} />
                              </button>
                              <button
                                className="ap-btn ghost sm icon"
                                title="Delete"
                                onClick={() => onDelete(item)}
                                style={{ background: "var(--red-lt)", color: "var(--red)", border: "1.5px solid rgba(239,68,68,.2)" }}
                              >
                                <Trash2 size={15} strokeWidth={1.8} />
                              </button>
                            </div>
                          </div>
                          <div className="ap-inv-card-bottom">
                            <div className="ap-inv-card-meta">
                              <span className="ap-inv-card-price">₱{fmt(item.price)}</span>
                              <span className={`ap-inv-card-qty ${s}`}>{item.qty} units</span>
                            </div>
                            <span className={`ap-badge ${s}`}>
                              {s === "low" && <TrendingDown size={10} strokeWidth={2.5} />}
                              {STOCK_LABELS[s]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <AccessoriesTab
          accessories={accessories}
          loading={accLoading}
          onAdd={onAddAcc}
          onEdit={onEditAcc}
          onDelete={onDeleteAcc}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  HISTORY TAB
// ─────────────────────────────────────────────
function HistoryTab({ reports, loading, onDeleteReport, onUpdateReport, requirePasscode }) {
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return reports.filter((r) => {
      const matchDate = matchesDateFilter(r.soldAt, dateFilter);
      const matchQ = !q || r.items.some((i) => i.name?.toLowerCase().includes(q));
      return matchDate && matchQ;
    });
  }, [reports, search, dateFilter]);

  const totalRevenue = useMemo(() => filtered.reduce((s, r) => s + (r.total || 0), 0), [filtered]);
  const totalSold = useMemo(() => filtered.reduce((s, r) => s + r.items.reduce((ss, i) => ss + i.qty, 0), 0), [filtered]);

  const handleDeleteClick = (e, report) => {
    e.stopPropagation();
    requirePasscode("Delete Sale Record", () => setDeleteTarget(report));
  };

  const handleEditClick = (e, report) => {
    e.stopPropagation();
    requirePasscode("Edit Sale Record", () => setEditTarget(report));
  };

  const handleDeleteConfirm = () => {
    onDeleteReport(deleteTarget);
    if (expanded === deleteTarget.id) setExpanded(null);
    setDeleteTarget(null);
  };

  if (loading) return (
    <div className="ap-loading">
      <Loader2 size={32} className="ap-spin" />
      <div className="ap-loading-txt">Loading sales history from Firebase…</div>
    </div>
  );

  return (
    <>
      <div className="ap-history-stats">
        <StatCard label="Transactions" value={filtered.length} sub={DATE_FILTERS.find(f => f.key === dateFilter)?.label} icon={History} color="blue" />
        <StatCard label="Revenue" value={`₱${fmt(totalRevenue)}`} color="green" sub={DATE_FILTERS.find(f => f.key === dateFilter)?.label} icon={BarChart3} />
        <StatCard label="Units Sold" value={fmt(totalSold)} color="blue" sub={DATE_FILTERS.find(f => f.key === dateFilter)?.label} icon={Tag} />
      </div>

      <div className="ap-history-toolbar">
        <select
          className={`ap-date-select${dateFilter !== "all" ? " on" : ""}`}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          {DATE_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        <div className="ap-search-wrap">
          <span className="ap-search-icon"><Search size={16} strokeWidth={1.8} /></span>
          <input
            className="ap-search"
            placeholder="Search by product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-icon">📋</div>
          <div className="ap-empty-txt">
            {reports.length === 0
              ? "Wala pang sales history. I-process ang sale gamit ang Process Sale button."
              : "No transactions match your filters."}
          </div>
        </div>
      ) : (
        filtered.map((report) => {
          const isOpen = expanded === report.id;
          const totalUnits = report.items.reduce((s, i) => s + i.qty, 0);
          const saleNum = reports.length - reports.findIndex(r => r.id === report.id);
          return (
            <div key={report.id} className="ap-report">
              <div className="ap-report-head" onClick={() => setExpanded(isOpen ? null : report.id)}>
                <div style={{ flex: 1 }}>
                  <div className="ap-report-num">Sale #{saleNum}</div>
                  <div className="ap-report-title">{report.items.map(i => i.name).join(", ").slice(0, 60)}{report.items.map(i => i.name).join(", ").length > 60 ? "…" : ""}</div>
                  <div className="ap-report-meta">{fmtDate(report.soldAt)} · {report.items.length} product{report.items.length !== 1 ? "s" : ""} · {totalUnits} unit{totalUnits !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {report.paymentMethod && (() => {
                    const pm = PAYMENT_METHODS.find(p => p.key === report.paymentMethod);
                    return pm ? (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: pm.color,
                        background: pm.bg, padding: "3px 9px", borderRadius: 99,
                        border: `1px solid ${pm.border}`,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {pm.icon === "landmark" ? <Landmark size={12} strokeWidth={2} style={{ color: pm.color }} /> : pm.emoji} {pm.label}
                        {(pm.key === "homecredit" || pm.key === "salmon") && report.balance > 0 && (
                          <span style={{ marginLeft: 2, background: "var(--amber-lt)", color: "var(--amber-dk)", padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>
                            ₱{fmt(report.balance)} utang
                          </span>
                        )}
                      </span>
                    ) : null;
                  })()}
                  <div className="ap-report-total">₱{fmt(report.total)}</div>
                  <button
                    className="ap-btn ghost sm icon"
                    title="Edit record"
                    style={{ color: "var(--blue)" }}
                    onClick={(e) => handleEditClick(e, report)}
                  >
                    <Pencil size={14} strokeWidth={1.8} />
                  </button>
                  <button
                    className="ap-report-del"
                    title="Delete record"
                    onClick={(e) => handleDeleteClick(e, report)}
                  >
                    <Trash2 size={15} strokeWidth={1.8} />
                  </button>
                  <ChevronDown size={17} strokeWidth={1.8} style={{ color: "var(--ink3)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </div>
              </div>

              {isOpen && (
                <div className="ap-report-body">
                  {report.items.map((item, i) => {
                    const afterQty = item.currentQty - item.qty;
                    return (
                      <div key={i} className="ap-report-row">
                        <div style={{ flex: 1 }}>
                          <div className="ap-report-item-name">{item.name}</div>
                          {getFreeItems(item).length > 0 && (
                            <div style={{ marginTop: 3, display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {getFreeItems(item).map((fi, fii) => (
                                <span key={fii} className="ap-badge-free">
                                  <Gift size={10} /> {freeItemEmoji(fi)} {fi}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.soldImeis && item.soldImeis.length > 0 && (
                            <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {item.soldImeis.map((imei, ii) => imei && (
                                <span key={ii} style={{
                                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                                  background: "var(--blue-lt)", color: "var(--blue-dk)",
                                  border: "1px solid rgba(13,158,110,.2)",
                                  padding: "2px 8px", borderRadius: 6,
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                  <Smartphone size={9} strokeWidth={2} />
                                  {imei}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span className="ap-stock-delta">
                            <ArrowDown size={10} strokeWidth={2.5} />
                            −{item.qty} unit{item.qty !== 1 ? "s" : ""}
                          </span>
                          {item.currentQty !== undefined && (
                            <span style={{ fontSize: 12, color: "var(--ink3)", whiteSpace: "nowrap" }}>
                              {item.currentQty} → {Math.max(0, afterQty)}
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="ap-report-item-total">₱{fmt(item.price * item.qty)}</div>
                          <div className="ap-report-item-unit">₱{fmt(item.price)} × {item.qty}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="ap-report-summary">
                    <div>
                      <div className="ap-report-summary-label">Sale Total</div>
                      <div style={{ fontSize: 12, color: "var(--green-dk)", marginTop: 2 }}>
                        {totalUnits} unit{totalUnits !== 1 ? "s" : ""} across {report.items.length} product{report.items.length !== 1 ? "s" : ""}
                      </div>
                      {/* Payment Method */}
                      {report.paymentMethod && (() => {
                        const pm = PAYMENT_METHODS.find(p => p.key === report.paymentMethod);
                        return pm ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <span style={{ fontSize: 14 }}>{pm.icon === "landmark" ? <Landmark size={14} strokeWidth={2} style={{ color: pm.color, verticalAlign: "middle" }} /> : pm.emoji}</span>
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: pm.color,
                              background: pm.bg, padding: "3px 10px", borderRadius: 99,
                              border: `1px solid ${pm.border}`,
                            }}>{pm.label}</span>
                          </div>
                        ) : null;
                      })()}
                      {/* Downpayment & Balance (for Home Credit & Salmon) */}
                      {(report.paymentMethod === "homecredit" || report.paymentMethod === "salmon") && report.downpayment > 0 && (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                            <span style={{ color: "var(--green-dk)", fontWeight: 600 }}>Downpayment:</span>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--green-dk)" }}>₱{fmt(report.downpayment)}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                            <span style={{ color: report.balance > 0 ? "var(--amber-dk)" : "var(--green-dk)", fontWeight: 600 }}>Balance / Utang:</span>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: report.balance > 0 ? "var(--amber-dk)" : "var(--green-dk)" }}>₱{fmt(report.balance)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ap-report-summary-val">₱{fmt(report.total)}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
              <div className="ap-confirm-title">Delete Sale Record?</div>
              <div className="ap-confirm-msg">
                Sale #{reports.length - reports.findIndex(r => r.id === deleteTarget.id)}<br />
                <strong>₱{fmt(deleteTarget.total)}</strong> — {fmtDate(deleteTarget.soldAt)}<br />
                <span style={{ fontSize: 13, color: "var(--red)", marginTop: 8, display: "block" }}>This only deletes the record. Stock is not restored.</span>
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="ap-btn danger" onClick={handleDeleteConfirm}>
                  <Trash2 size={14} strokeWidth={1.8} /> Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit sale modal */}
      {editTarget && (
        <EditSaleModal
          report={editTarget}
          onSave={(updatedItems) => {
            onUpdateReport(editTarget.id, updatedItems);
            setEditTarget(null);
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  EDIT SALE MODAL
// ─────────────────────────────────────────────
function EditSaleModal({ report, onSave, onClose }) {
  const [items, setItems] = useState(report.items.map(i => ({ ...i, soldImeis: i.soldImeis || [] })));
  const [saving, setSaving] = useState(false);

  const setItemField = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const updateImei = (itemIdx, imeiIdx, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== itemIdx) return it;
      const updated = [...(it.soldImeis || [])];
      updated[imeiIdx] = val;
      return { ...it, soldImeis: updated };
    }));
  };

  const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    await onSave(items);
    setSaving(false);
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 560 }}>
        <div className="ap-modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--blue-lt)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pencil size={16} strokeWidth={2} style={{ color: "var(--blue)" }} />
            </div>
            <h3>Edit Sale Record</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div className="ap-modal-body">
          <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 16, padding: "10px 14px", background: "var(--amber-lt)", borderRadius: 8, border: "1px solid rgba(245,158,11,.25)" }}>
            ⚠️ I-edit ang detalye ng sale. Hindi nito mababago ang stock inventory.
          </div>

          {items.map((item, idx) => (
            <div key={idx} style={{ background: "var(--surf2)", border: "1.5px solid var(--bdr2)", borderRadius: 12, padding: "16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 12 }}>{item.name}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: item.soldImeis?.length ? 12 : 0 }}>
                <div className="ap-fg" style={{ marginBottom: 0 }}>
                  <label className="ap-label">Price (₱)</label>
                  <input
                    className="ap-input"
                    type="number" min="0"
                    value={item.price}
                    onChange={(e) => setItemField(idx, "price", Math.round(+e.target.value) || 0)}
                  />
                </div>
                <div className="ap-fg" style={{ marginBottom: 0 }}>
                  <label className="ap-label">Qty Sold</label>
                  <input
                    className="ap-input"
                    type="number" min="1"
                    value={item.qty}
                    onChange={(e) => setItemField(idx, "qty", Math.max(1, Math.round(+e.target.value) || 1))}
                  />
                </div>
              </div>

              {/* IMEI edit — only if item has soldImeis */}
              {item.soldImeis && item.soldImeis.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <label className="ap-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                    <Smartphone size={12} strokeWidth={2} style={{ color: "var(--blue)" }} />
                    Sold IMEI Numbers
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {item.soldImeis.map((imei, ii) => (
                      <div key={ii} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--ink3)", minWidth: 42, fontFamily: "'JetBrains Mono',monospace" }}>#{ii + 1}</span>
                        <input
                          className="ap-input"
                          style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}
                          value={imei}
                          placeholder="IMEI"
                          onChange={(e) => updateImei(idx, ii, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: "var(--green-lt)", borderRadius: 10,
            border: "1px solid rgba(0,184,122,.2)",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-dk)" }}>New Total</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--green-dk)" }}>₱{fmt(total)}</span>
          </div>
        </div>

        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ap-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} strokeWidth={2.2} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  ITEM MODAL (Add / Edit)
// ─────────────────────────────────────────────
const FREE_ITEM_PRESETS = ["Tempered Glass", "Headset", "Speaker"];
const EMPTY_FORM = { name: "", brand: "", price: "", qty: "", low: "3", desc: "", freeItems: [], freeItemsOther: "", imeis: [] };

function ItemModal({ item, onSave, onClose, existingSKUs }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState(
    item
      ? { ...item, price: String(item.price), qty: String(item.qty), low: String(item.low), freeItems: item.freeItems || (item.freeTempered ? ["Tempered Glass"] : []), freeItemsOther: item.freeItemsOther || "", imeis: item.imeis || [] }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.price || isNaN(+form.price) || +form.price < 0) e.price = "Enter a valid price";
    if (form.qty === "" || isNaN(+form.qty) || +form.qty < 0) e.qty = "Enter a valid quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal">
        <div className="ap-modal-head">
          <h3>{isEdit ? "Edit Unit" : "Add New Unit"}</h3>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div className="ap-modal-body">
          <div className="ap-fg">
            <label className="ap-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Gift size={13} strokeWidth={2} style={{ color: "var(--purple)" }} />
              Free Items Included
              <span style={{ fontWeight: 400, textTransform: "none", color: "var(--ink3)" }}>(optional)</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {FREE_ITEM_PRESETS.map((preset) => {
                const active = (form.freeItems || []).includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const cur = form.freeItems || [];
                      set("freeItems", active ? cur.filter(x => x !== preset) : [...cur, preset]);
                    }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${active ? "var(--purple)" : "var(--bdr2)"}`,
                      background: active ? "var(--purple-lt)" : "var(--surf2)",
                      color: active ? "var(--purple-dk)" : "var(--ink2)",
                      cursor: "pointer", transition: "all .15s",
                    }}
                  >
                    {active && <Check size={11} strokeWidth={3} />}
                    {preset === "Tempered Glass" ? "🛡️" : preset === "Headset" ? "🎧" : "🔊"} {preset}
                  </button>
                );
              })}
              {/* Others toggle */}
              {(() => {
                const othersActive = !!(form.freeItemsOther?.trim());
                const showOthers = form._showOthers || othersActive;
                return (
                  <button
                    type="button"
                    onClick={() => set("_showOthers", !showOthers)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${othersActive ? "var(--amber)" : "var(--bdr2)"}`,
                      background: othersActive ? "var(--amber-lt)" : "var(--surf2)",
                      color: othersActive ? "var(--amber-dk)" : "var(--ink2)",
                      cursor: "pointer", transition: "all .15s",
                    }}
                  >
                    ➕ Others
                  </button>
                );
              })()}
            </div>
            {(form._showOthers || form.freeItemsOther?.trim()) && (
              <input
                className="ap-input"
                value={form.freeItemsOther || ""}
                placeholder="e.g. Case, Charger, USB Cable…"
                onChange={(e) => set("freeItemsOther", e.target.value)}
              />
            )}
            {(form.freeItems?.length > 0 || form.freeItemsOther?.trim()) && (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--purple-dk)", display: "flex", alignItems: "center", gap: 5 }}>
                <Gift size={11} strokeWidth={2} />
                Free: {[...(form.freeItems || []), ...(form.freeItemsOther?.trim() ? [form.freeItemsOther.trim()] : [])].join(", ")}
              </div>
            )}
          </div>

          <div className="ap-fg">
            <label className="ap-label">Brand</label>
            <input ref={firstRef} className="ap-input" value={form.brand} placeholder="e.g. Apple, Samsung" onChange={(e) => set("brand", e.target.value)} />
          </div>

          <div className="ap-fg">
            <label className="ap-label">Unit Name *</label>
            <input className={`ap-input${errors.name ? " err" : ""}`} value={form.name} placeholder="e.g. iPhone 14 OLED Screen" onChange={(e) => set("name", e.target.value)} />
            {errors.name && <div className="ap-ferr">{errors.name}</div>}
          </div>

          <div className="ap-form-row">
            <div className="ap-fg">
              <label className="ap-label">Price (₱) *</label>
              <input className={`ap-input${errors.price ? " err" : ""}`} type="number" min="0" value={form.price} placeholder="0" onChange={(e) => set("price", e.target.value)} />
              {errors.price && <div className="ap-ferr">{errors.price}</div>}
            </div>
            <div className="ap-fg">
              <label className="ap-label">Stock Quantity *</label>
              <input className={`ap-input${errors.qty ? " err" : ""}`} type="number" min="0" value={form.qty} placeholder="0" onChange={(e) => {
                const newQty = e.target.value;
                set("qty", newQty);
                // Resize imeis array to match qty
                const n = Math.max(0, Math.round(+newQty) || 0);
                setForm((f) => {
                  const cur = f.imeis || [];
                  if (n > cur.length) return { ...f, qty: newQty, imeis: [...cur, ...Array(n - cur.length).fill("")] };
                  return { ...f, qty: newQty, imeis: cur.slice(0, n) };
                });
              }} />
              {errors.qty && <div className="ap-ferr">{errors.qty}</div>}
            </div>
          </div>

          {/* IMEI fields — one per stock unit */}
          {(Math.round(+form.qty) || 0) > 0 && (
            <div className="ap-fg">
              <label className="ap-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Smartphone size={13} strokeWidth={2} style={{ color: "var(--blue)" }} />
                IMEI Numbers <span style={{ fontWeight: 400, textTransform: "none", color: "var(--ink3)" }}>({Math.round(+form.qty)} unit{Math.round(+form.qty) !== 1 ? "s" : ""})</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: Math.round(+form.qty) || 0 }).map((_, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--ink3)", minWidth: 52, fontFamily: "'JetBrains Mono',monospace" }}>Unit {idx + 1}</span>
                    <input
                      className="ap-input"
                      style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}
                      value={(form.imeis || [])[idx] || ""}
                      placeholder={`IMEI ng Unit ${idx + 1}`}
                      onChange={(e) => {
                        const updated = [...(form.imeis || [])];
                        updated[idx] = e.target.value;
                        set("imeis", updated);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="ap-fhint">I-type ang IMEI ng bawat unit para sa tracking</div>
            </div>
          )}

          <div className="ap-fg">
            <label className="ap-label">Low Stock Alert Threshold</label>
            <input className="ap-input" type="number" min="1" value={form.low} placeholder="3" onChange={(e) => set("low", e.target.value)} />
            <div className="ap-fhint">Mag-aalert kapag qty ≤ threshold na ito</div>
          </div>

          <div className="ap-fg">
            <label className="ap-label">Description / Notes</label>
            <textarea className="ap-textarea" value={form.desc} placeholder="Optional specs or notes…" onChange={(e) => set("desc", e.target.value)} />
          </div>
        </div>

        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ap-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} strokeWidth={2.2} />}
            {isEdit ? "Update " : "Save "}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  DELETE MODAL
// ─────────────────────────────────────────────
function DeleteModal({ item, onConfirm, onClose }) {
  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 380 }}>
        <div className="ap-confirm">
          <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
          <div className="ap-confirm-title">Delete Unit?</div>
          <div className="ap-confirm-msg"><strong>{item.name}</strong><br />This action cannot be undone.</div>
          <div className="ap-confirm-actions">
            <button className="ap-btn" onClick={onClose}>Cancel</button>
            <button className="ap-btn danger" onClick={onConfirm}>
              <Trash2 size={14} strokeWidth={1.8} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  ACCESSORY MODAL (Add / Edit) — No IMEI, No Free Items
// ─────────────────────────────────────────────
const EMPTY_ACC_FORM = { name: "", brand: "", price: "", qty: "", low: "3", desc: "" };

function AccessoryModal({ item, onSave, onClose }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState(
    item
      ? { ...item, price: String(item.price), qty: String(item.qty), low: String(item.low) }
      : EMPTY_ACC_FORM
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.price || isNaN(+form.price) || +form.price < 0) e.price = "Enter a valid price";
    if (form.qty === "" || isNaN(+form.qty) || +form.qty < 0) e.qty = "Enter a valid quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal">
        <div className="ap-modal-head">
          <h3>{isEdit ? "Edit Accessory" : "Add New Accessory"}</h3>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div className="ap-modal-body">
          <div className="ap-fg">
            <label className="ap-label">Brand</label>
            <input ref={firstRef} className="ap-input" value={form.brand} placeholder="e.g. Baseus, Anker, JBL" onChange={(e) => set("brand", e.target.value)} />
          </div>

          <div className="ap-fg">
            <label className="ap-label">Accessory Name *</label>
            <input className={`ap-input${errors.name ? " err" : ""}`} value={form.name} placeholder="e.g. Type-C Cable, Airpods Case" onChange={(e) => set("name", e.target.value)} />
            {errors.name && <div className="ap-ferr">{errors.name}</div>}
          </div>

          <div className="ap-form-row">
            <div className="ap-fg">
              <label className="ap-label">Price (₱) *</label>
              <input className={`ap-input${errors.price ? " err" : ""}`} type="number" min="0" value={form.price} placeholder="0" onChange={(e) => set("price", e.target.value)} />
              {errors.price && <div className="ap-ferr">{errors.price}</div>}
            </div>
            <div className="ap-fg">
              <label className="ap-label">Stock Quantity *</label>
              <input className={`ap-input${errors.qty ? " err" : ""}`} type="number" min="0" value={form.qty} placeholder="0" onChange={(e) => set("qty", e.target.value)} />
              {errors.qty && <div className="ap-ferr">{errors.qty}</div>}
            </div>
          </div>

          <div className="ap-fg">
            <label className="ap-label">Low Stock Alert Threshold</label>
            <input className="ap-input" type="number" min="1" value={form.low} placeholder="3" onChange={(e) => set("low", e.target.value)} />
            <div className="ap-fhint">Mag-aalert kapag qty ≤ threshold na ito</div>
          </div>

          <div className="ap-fg">
            <label className="ap-label">Description / Notes</label>
            <textarea className="ap-textarea" value={form.desc} placeholder="Optional specs or notes…" onChange={(e) => set("desc", e.target.value)} />
          </div>
        </div>

        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ap-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} strokeWidth={2.2} />}
            {isEdit ? "Update " : "Save "}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  ACCESSORIES TAB
// ─────────────────────────────────────────────
function AccessoriesTab({ accessories, loading, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const stats = useMemo(() => ({
    total: accessories.length,
    in: accessories.filter((i) => stockStatus(i) === "in").length,
    low: accessories.filter((i) => stockStatus(i) === "low").length,
    out: accessories.filter((i) => stockStatus(i) === "out").length,
    value: accessories.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0),
    units: accessories.reduce((s, i) => s + (Number(i.qty) || 0), 0),
  }), [accessories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return accessories.filter((item) => {
      const matchQ = !q || [item.name, item.brand, item.desc].some((v) => v?.toLowerCase().includes(q));
      const matchS = !stockFilter || stockStatus(item) === stockFilter;
      return matchQ && matchS;
    });
  }, [accessories, search, stockFilter]);

  if (loading) return (
    <div className="ap-loading">
      <Loader2 size={32} className="ap-spin" />
      <div className="ap-loading-txt">Loading accessories from Firebase…</div>
    </div>
  );

  return (
    <>
      <div className="ap-stats">
        <StatCard label="Total Items" value={stats.total} icon={Package} color="blue" />
        <StatCard label="In Stock" value={stats.in} color="green" sub={`${stats.in} of ${stats.total} items`} icon={CheckCircle} />
        <StatCard label="Low Stock" value={stats.low} color="amber" sub="Need restocking" icon={AlertTriangle} />
        <StatCard label="Out of Stock" value={stats.out} color="red" sub="Unavailable" icon={AlertCircle} />
      </div>
      <div className="ap-stats ap-stats-wide">
        <StatCard label="Accessories Value" value={`₱${fmt(stats.value)}`} color="blue" sub="Total stock worth" icon={BarChart3} />
        <StatCard label="Total Units" value={fmt(stats.units)} sub="Units in stock" icon={Tag} color="green" />
      </div>

      <div className="ap-toolbar">
        <div className="ap-search-wrap">
          <span className="ap-search-icon"><Search size={16} strokeWidth={1.8} /></span>
          <input
            className="ap-search"
            placeholder="Search accessories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="ap-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="">All Stock Levels</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <button className="ap-btn primary" onClick={onAdd}>
          <Plus size={15} strokeWidth={2.2} /> Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-icon">🎧</div>
          <div className="ap-empty-txt">No accessories found. Try adjusting your filters.</div>
        </div>
      ) : (
        <>
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const s = stockStatus(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="ap-table-name">{item.name}</div>
                        <div className="ap-table-brand">{item.brand || "—"}</div>
                      </td>
                      <td>
                        <div className="ap-table-price">₱{fmt(item.price)}</div>
                      </td>
                      <td>
                        <span className={`ap-table-qty ${s}`}>{item.qty}</span>
                      </td>
                      <td>
                        <span className={`ap-badge ${s}`}>
                          {s === "low" && <TrendingDown size={10} strokeWidth={2.5} />}
                          {STOCK_LABELS[s]}
                        </span>
                      </td>
                      <td>
                        <div className="ap-table-actions" style={{ justifyContent: "flex-end" }}>
                          <button className="ap-btn ghost sm icon" title="Edit" onClick={() => onEdit(item)}>
                            <Pencil size={15} strokeWidth={1.8} />
                          </button>
                          <button className="ap-btn ghost sm icon" title="Delete" style={{ color: "var(--red)" }} onClick={() => onDelete(item)}>
                            <Trash2 size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="ap-inv-cards">
            {filtered.map((item) => {
              const s = stockStatus(item);
              return (
                <div className="ap-inv-card" key={item.id}>
                  <div className="ap-inv-card-top">
                    <div className="ap-inv-card-info">
                      <div className="ap-inv-card-name">{item.name}</div>
                      <div className="ap-inv-card-brand">{item.brand || "—"}</div>
                    </div>
                    <div className="ap-inv-card-actions">
                      <button
                        className="ap-btn ghost sm icon"
                        title="Edit"
                        onClick={() => onEdit(item)}
                        style={{ background: "var(--blue-lt)", color: "var(--blue)", border: "1.5px solid rgba(13,158,110,.2)" }}
                      >
                        <Pencil size={15} strokeWidth={1.8} />
                      </button>
                      <button
                        className="ap-btn ghost sm icon"
                        title="Delete"
                        onClick={() => onDelete(item)}
                        style={{ background: "var(--red-lt)", color: "var(--red)", border: "1.5px solid rgba(239,68,68,.2)" }}
                      >
                        <Trash2 size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div className="ap-table-price">₱{fmt(item.price)}</div>
                    <span className={`ap-badge ${s}`}>
                      {s === "low" && <TrendingDown size={10} strokeWidth={2.5} />}
                      {STOCK_LABELS[s]} · {item.qty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  SALES MODAL
// ─────────────────────────────────────────────
const PAYMENT_METHODS = [
  { key: "cash", label: "Cash", emoji: "💵", color: "var(--green-dk)", bg: "var(--green-lt)", border: "rgba(0,184,122,.35)" },
  { key: "gcash", label: "GCash", emoji: "📱", color: "#0070e0", bg: "#e8f4ff", border: "rgba(0,112,224,.35)" },
  { key: "homecredit", label: "Home Credit", emoji: "🏦", color: "var(--purple-dk)", bg: "var(--purple-lt)", border: "rgba(139,92,246,.35)" },
  { key: "salmon", label: "Salmon", icon: "landmark", color: "#e05c00", bg: "#fff0e8", border: "rgba(224,92,0,.35)" },
];

function SalesModal({ items, onClose, onConfirm }) {
  const [quantities, setQuantities] = useState({});
  const [selectedImeis, setSelectedImeis] = useState({}); // { itemId: [imei1, imei2, ...] }
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  // Payment step
  const [step, setStep] = useState("items"); // "items" | "payment"
  const [paymentMethod, setPaymentMethod] = useState("");
  const [downpayment, setDownpayment] = useState("");

  const setQty = (id, val) => {
    const item = items.find((i) => i.id === id);
    const hasRealImeis = item?.imeis?.some((v) => v && v.trim() !== "");
    const realImeiCount = hasRealImeis ? item.imeis.filter((v) => v && v.trim() !== "").length : 0;
    const max = hasRealImeis ? realImeiCount : (item?.qty || 0);
    const n = Math.max(0, Math.min(max > 0 ? max : (item?.qty || 0), Number(val) || 0));
    setQuantities((q) => ({ ...q, [id]: n }));
    if (hasRealImeis) {
      setSelectedImeis((prev) => {
        const cur = prev[id] || [];
        return { ...prev, [id]: cur.slice(0, n) };
      });
    }
  };

  // selectedImeis stores indices (not values) so units can be individually tracked
  const toggleImeiIdx = (itemId, idx) => {
    const item = items.find((i) => i.id === itemId);
    const realImeiCount = (item?.imeis || []).filter((v) => v && v.trim() !== "").length;
    setSelectedImeis((prev) => {
      const cur = prev[itemId] || [];
      if (cur.includes(idx)) {
        const next = cur.filter((x) => x !== idx);
        setQuantities((q) => ({ ...q, [itemId]: next.length }));
        return { ...prev, [itemId]: next };
      } else {
        if (cur.length < realImeiCount) {
          const next = [...cur, idx];
          setQuantities((q) => ({ ...q, [itemId]: next.length }));
          return { ...prev, [itemId]: next };
        }
        return prev; // already at max
      }
    });
  };

  const inStockItems = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((i) => i.qty > 0)
      .filter((i) => !q || i.name?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q));
  }, [items, search]);

  const selectedItems = items.filter((i) => (quantities[i.id] || 0) > 0);
  const total = selectedItems.reduce((s, i) => s + i.price * (quantities[i.id] || 0), 0);

  const imeiValid = selectedItems.every((i) => {
    if (!i.imeis || !i.imeis.some((v) => v && v.trim() !== "")) return true;
    return (selectedImeis[i.id] || []).length === (quantities[i.id] || 0);
  });

  const needsDownpayment = paymentMethod === "homecredit" || paymentMethod === "salmon";
  const dpNum = Math.round(+downpayment) || 0;
  const chargeNum = 0;
  const balance = needsDownpayment ? Math.max(0, total - dpNum) : 0;

  const handleConfirm = async () => {
    if (selectedItems.length === 0 || saving || !imeiValid) return;
    if (!paymentMethod) { setStep("payment"); return; }
    setSaving(true);
    await onConfirm(
      selectedItems.map((i) => ({
        id: i.id || "",
        sku: i.sku || "",
        name: i.name || "",
        price: i.price || 0,
        qty: quantities[i.id] || 1,
        currentQty: i.qty || 0,
        freeItems: i.freeItems || [],
        freeItemsOther: i.freeItemsOther || "",
        soldImeis: (selectedImeis[i.id] || []).map((idx) => (i.imeis || [])[idx] || ""),
        soldIdxs: selectedImeis[i.id] || [],
        _isAccessory: i._isAccessory || false,
      })),
      { paymentMethod, downpayment: needsDownpayment ? dpNum : 0, balance: needsDownpayment ? balance : 0, charge: 0 }
    );
    setSaving(false);
    onClose();
  };

  // Payment step proceed
  const handleGoToPayment = () => {
    if (selectedItems.length === 0 || !imeiValid) return;
    setStep("payment");
  };

  const handlePaymentConfirm = async () => {
    if (!paymentMethod) return;
    if (needsDownpayment && dpNum <= 0) return;
    setSaving(true);
    await onConfirm(
      selectedItems.map((i) => ({
        id: i.id || "",
        sku: i.sku || "",
        name: i.name || "",
        price: i.price || 0,
        qty: quantities[i.id] || 1,
        currentQty: i.qty || 0,
        freeItems: i.freeItems || [],
        freeItemsOther: i.freeItemsOther || "",
        soldImeis: (selectedImeis[i.id] || []).map((idx) => (i.imeis || [])[idx] || ""),
        soldIdxs: selectedImeis[i.id] || [],
        _isAccessory: i._isAccessory || false,
      })),
      { paymentMethod, downpayment: needsDownpayment ? dpNum : 0, balance: needsDownpayment ? balance : 0, charge: 0 }
    );
    setSaving(false);
    onClose();
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal ap-sales-modal" role="dialog">
        <div className="ap-modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === "payment" && (
              <button className="ap-btn ghost icon" onClick={() => setStep("items")} title="Bumalik" style={{ marginRight: 2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              </button>
            )}
            <h3>{step === "items" ? "Process Sale" : "Mode of Payment"}</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {step === "items" ? (
          <>
            <div className="ap-modal-body">
              <div style={{ position: "relative", marginBottom: 16 }}>
                <span className="ap-search-icon"><Search size={15} strokeWidth={1.8} /></span>
                <input className="ap-search" placeholder="Filter products…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {inStockItems.length === 0 ? (
                <div className="ap-empty" style={{ padding: "32px 0" }}>
                  <div className="ap-empty-icon">📭</div>
                  <div className="ap-empty-txt">Walang items in stock para ibenta.</div>
                </div>
              ) : (
                inStockItems.map((item) => {
                  const hasImeis = !!(item.imeis && item.imeis.some((v) => v && v.trim() !== ""));
                  const chosenIdxs = selectedImeis[item.id] || [];
                  const qty = quantities[item.id] || 0;
                  return (
                    <div key={item.id} className="ap-sales-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ap-sales-name">{item.name}</div>
                          <div className="ap-sales-meta">Stock: {item.qty} · ₱{fmt(item.price)}</div>
                          {getFreeItems(item).length > 0 && (
                            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {getFreeItems(item).map((fi, fii) => (
                                <span key={fii} className="ap-badge-free">
                                  <Gift size={10} strokeWidth={2} /> {freeItemEmoji(fi)} {fi}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Only show +/- for non-IMEI products */}
                        {!hasImeis && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <button className="ap-qty-btn minus" onClick={() => setQty(item.id, qty - 1)} disabled={qty === 0}>
                              <Minus size={13} strokeWidth={2.5} />
                            </button>
                            <input
                              className="ap-qty-input"
                              type="number" min="0" max={item.qty}
                              value={qty}
                              onChange={(e) => setQty(item.id, e.target.value)}
                            />
                            <button className="ap-qty-btn plus" onClick={() => setQty(item.id, qty + 1)} disabled={qty >= item.qty}>
                              <Plus size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                        {/* For IMEI products: show a single + button when qty is 0 */}
                        {hasImeis && qty === 0 && (
                          <div style={{ flexShrink: 0 }}>
                            <button className="ap-qty-btn plus-outline" onClick={() => setQty(item.id, 1)} title="Magdagdag sa sale">
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                        <div className="ap-sales-price">
                          {qty > 0 ? `₱${fmt(item.price * qty)}` : "—"}
                        </div>
                      </div>

                      {/* IMEI / unit picker — only visible once qty > 0 */}
                      {hasImeis && qty > 0 && (
                        <div style={{ background: "var(--surf2)", borderRadius: 10, padding: "12px 14px", border: "1.5px solid var(--blue)", boxShadow: "0 0 0 3px rgba(13,158,110,.07)" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                            <Smartphone size={12} strokeWidth={2} style={{ color: "var(--blue)" }} />
                            Piliin ang unit na ibebenta
                            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ color: chosenIdxs.length === qty ? "var(--green-dk)" : "var(--amber-dk)", fontFamily: "'JetBrains Mono',monospace" }}>
                                {chosenIdxs.length}/{qty} napili
                              </span>
                              <button
                                onClick={() => setQty(item.id, 0)}
                                title="I-cancel"
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 6, border: "1.5px solid var(--red)", background: "var(--red-lt)", color: "var(--red)", cursor: "pointer", flexShrink: 0 }}
                              >
                                <X size={12} strokeWidth={2.5} />
                              </button>
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {item.imeis.map((imei, idx) => {
                              if (!imei || !imei.trim()) return null;
                              const isChosen = chosenIdxs.includes(idx);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => toggleImeiIdx(item.id, idx)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                                    border: `1.5px solid ${isChosen ? "var(--blue)" : "var(--bdr2)"}`,
                                    background: isChosen ? "var(--blue-lt)" : "var(--surf)",
                                    color: isChosen ? "var(--blue)" : "var(--ink2)",
                                    fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                                    fontWeight: 600, transition: "all .15s",
                                    textAlign: "left",
                                  }}
                                >
                                  <div style={{
                                    width: 18, height: 18, borderRadius: 5, border: `2px solid ${isChosen ? "var(--blue)" : "var(--bdr2)"}`,
                                    background: isChosen ? "var(--blue)" : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                  }}>
                                    {isChosen && <Check size={11} color="#fff" strokeWidth={3} />}
                                  </div>
                                  <span style={{ flex: 1 }}>
                                    {imei && imei.trim()
                                      ? imei
                                      : <span style={{ color: "var(--ink4)", fontStyle: "italic" }}>Unit {idx + 1} — walang IMEI</span>
                                    }
                                  </span>
                                  {isChosen && <span style={{ fontSize: 11, background: "var(--blue)", color: "#fff", padding: "2px 7px", borderRadius: 99 }}>IBEBENTA</span>}
                                </button>
                              );
                            })}
                          </div>
                          {chosenIdxs.length < qty && (
                            <div style={{ fontSize: 12, color: "var(--amber-dk)", marginTop: 8, fontWeight: 600 }}>
                              ⚠️ Pumili ng {qty - chosenIdxs.length} pang unit para ma-confirm ang sale
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {selectedItems.length > 0 && (
                <div className="ap-sale-summary">
                  <div>
                    <div className="ap-sale-summary-label">Total Sale</div>
                    <div style={{ fontSize: 12, color: "var(--green-dk)", marginTop: 4 }}>
                      {selectedItems.length} product{selectedItems.length !== 1 ? "s" : ""} · {selectedItems.reduce((s, i) => s + (quantities[i.id] || 0), 0)} units
                    </div>
                  </div>
                  <div className="ap-sale-summary-val">₱{fmt(total)}</div>
                </div>
              )}
            </div>

            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={handleGoToPayment} disabled={selectedItems.length === 0 || !imeiValid}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                {selectedItems.length > 0 ? `Susunod · ₱${fmt(total)}` : "Susunod"}
              </button>
            </div>
          </>
        ) : (
          /* ── PAYMENT STEP ── */
          <>
            <div className="ap-modal-body">
              {/* Sale summary mini */}
              <div style={{ background: "var(--green-lt)", border: "1.5px solid rgba(0,184,122,.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green-dk)", textTransform: "uppercase", letterSpacing: ".05em" }}>Total na Babayaran</div>
                  <div style={{ fontSize: 11, color: "var(--green-dk)", opacity: .8, marginTop: 2 }}>
                    {selectedItems.length} product{selectedItems.length !== 1 ? "s" : ""} · {selectedItems.reduce((s, i) => s + (quantities[i.id] || 0), 0)} units
                  </div>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "var(--green-dk)" }}>₱{fmt(total)}</div>
              </div>

              {/* Payment method cards */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Piliin ang Mode of Payment</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {PAYMENT_METHODS.map((pm) => {
                  const sel = paymentMethod === pm.key;
                  return (
                    <button
                      key={pm.key}
                      onClick={() => { setPaymentMethod(pm.key); setDownpayment(""); }}
                      style={{
                        padding: "16px 14px", borderRadius: 12, border: `2px solid ${sel ? pm.border : "var(--bdr2)"}`,
                        background: sel ? pm.bg : "var(--surf2)", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        transition: "all .15s", boxShadow: sel ? `0 0 0 3px ${pm.border}40` : "none",
                      }}
                    >
                      {pm.icon === "landmark"
                        ? <Landmark size={26} strokeWidth={1.8} style={{ color: sel ? pm.color : "var(--ink3)" }} />
                        : <span style={{ fontSize: 26 }}>{pm.emoji}</span>
                      }
                      <span style={{ fontSize: 14, fontWeight: 700, color: sel ? pm.color : "var(--ink2)" }}>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Downpayment + fields — only for Home Credit & Salmon */}
              {(paymentMethod === "homecredit" || paymentMethod === "salmon") && (
                <div style={{ background: "var(--surf2)", border: "1.5px solid var(--bdr2)", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    {paymentMethod === "salmon" ? "🏦 Detalye ng Salmon" : "🏦 Detalye ng Home Credit"}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div className="ap-fg" style={{ marginBottom: 0 }}>
                      <label className="ap-label">Downpayment (₱) *</label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                        <input
                          className="ap-input"
                          type="number" min="0" max={total}
                          value={downpayment}
                          onChange={(e) => setDownpayment(e.target.value)}
                          placeholder="0"
                          style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700 }}
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                  {dpNum > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "var(--ink3)", fontWeight: 600 }}>Total:</span>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>₱{fmt(total)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "var(--green-dk)", fontWeight: 600 }}>Downpayment:</span>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--green-dk)" }}>₱{fmt(dpNum)}</span>
                      </div>
                      <div style={{ height: 1, background: "var(--bdr)" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span style={{ color: "var(--amber-dk)", fontWeight: 700 }}>Balance / Utang:</span>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: balance > 0 ? "var(--amber-dk)" : "var(--green-dk)" }}>₱{fmt(balance)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={() => setStep("items")} disabled={saving}>Bumalik</button>
              <button
                className="ap-btn primary"
                onClick={handlePaymentConfirm}
                disabled={!paymentMethod || (needsDownpayment && dpNum <= 0) || saving}
              >
                {saving ? <Loader2 size={14} className="ap-spin" /> : <Check size={14} strokeWidth={2.2} />}
                {saving ? "Saving…" : `Confirm Sale · ₱${fmt(total)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CAPITAL MODAL (Add / Edit) — Improved UI
// ─────────────────────────────────────────────
const EMPTY_CAPITAL = { label: "", amount: "", capitalCost: "", type: "income", note: "" };

function CapitalModal({ entry, onSave, onClose, capitalBalance = 0, allEntries = [] }) {
  const isEdit = !!entry?.id;
  const [form, setForm] = useState(
    entry
      ? { ...entry, amount: String(entry.amount), capitalCost: String(entry.capitalCost || "") }
      : EMPTY_CAPITAL
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.label.trim()) e.label = "Label is required";
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = "Enter a valid amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const isIncome = form.type === "income";

  // Income breakdown: all entries except autoPrint (view-only)
  const incomeEntries = allEntries.filter(e => e.type === "income" && !e.autoPrint);
  const totalIncome = incomeEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const saleEntries = incomeEntries.filter(e => e.autoSale);
  const manualEntries = incomeEntries.filter(e => !e.autoSale);
  const totalSaleIncome = saleEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const totalManualIncome = manualEntries.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal ap-capital-modal">
        {/* Header with colored accent */}
        <div className="ap-modal-head" style={{
          background: isIncome
            ? "linear-gradient(135deg,var(--green-lt),var(--surf))"
            : "linear-gradient(135deg,var(--red-lt),var(--surf))",
          borderBottom: `1px solid ${isIncome ? "rgba(0,184,122,.2)" : "rgba(239,68,68,.15)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isIncome ? "var(--green-lt)" : "var(--red-lt)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
              {isIncome ? "💰" : "📤"}
            </div>
            <h3 style={{ color: isIncome ? "var(--green-dk)" : "var(--red-dk)" }}>
              {isEdit ? "Edit Capital Entry" : "Add Capital Entry"}
            </h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div className="ap-modal-body">
          {/* Type selector — big cards */}
          <div className="ap-capital-type-row">
            <button
              className={`ap-capital-type-btn income${form.type === "income" ? " sel" : ""}`}
              onClick={() => set("type", "income")}
            >
              <div className="cap-type-icon">💰</div>
              <div className="cap-type-label">Income</div>
              <div className="cap-type-sub">Money in</div>
            </button>
            <button
              className={`ap-capital-type-btn expense${form.type === "expense" ? " sel" : ""}`}
              onClick={() => set("type", "expense")}
            >
              <div className="cap-type-icon">📤</div>
              <div className="cap-type-label">Expense</div>
              <div className="cap-type-sub">Money out</div>
            </button>
          </div>

          {/* Amount — big & prominent */}
          <div className="ap-fg">
            <label className="ap-label">Amount (₱) *</label>
            <div className="ap-capital-amount-wrap">
              <span className="ap-capital-amount-prefix">₱</span>
              <input
                className={`ap-capital-amount-input${errors.amount ? " err" : ""}`}
                type="number" min="0"
                value={form.amount}
                placeholder="0"
                onChange={(e) => set("amount", e.target.value)}
                style={{ color: isIncome ? "var(--green-dk)" : "var(--red-dk)" }}
              />
            </div>
            {errors.amount && <div className="ap-ferr">{errors.amount}</div>}
          </div>

          {/* Capital Cost — only for Income */}
          {isIncome && (
            <div className="ap-fg">
              <label className="ap-label">Capital / Halaga ng Binili <span style={{ fontWeight: 400, textTransform: "none", color: "var(--ink3)" }}>(optional)</span></label>
              <div className="ap-capital-amount-wrap">
                <span className="ap-capital-amount-prefix" style={{ color: "var(--amber-dk)" }}>₱</span>
                <input
                  className="ap-capital-amount-input"
                  type="number" min="0"
                  value={form.capitalCost}
                  placeholder="0"
                  onChange={(e) => set("capitalCost", e.target.value)}
                  style={{ color: "var(--amber-dk)" }}
                />
              </div>
              <div className="ap-fhint">Halaga na ibinayad mo para sa item na ito (cost/capital).</div>
            </div>
          )}

          {/* Income Profit Preview */}
          {isIncome && +form.amount > 0 && +form.capitalCost > 0 && (
            <div style={{
              background: "linear-gradient(135deg,var(--green-lt),#e8faf3)",
              borderRadius: "var(--rad)", border: "1px solid rgba(0,184,122,.25)",
              padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "stretch",
            }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>💵 Selling Price</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>₱{fmt(+form.amount)}</div>
              </div>
              <div style={{ width: 1, background: "rgba(0,184,122,.2)" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--amber-dk)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>📦 Capital</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "var(--amber-dk)" }}>₱{fmt(+form.capitalCost)}</div>
              </div>
              <div style={{ width: 1, background: "rgba(0,184,122,.2)" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green-dk)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>✅ Income</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: +form.amount - +form.capitalCost >= 0 ? "var(--green-dk)" : "var(--red)" }}>
                  ₱{fmt(Math.abs(+form.amount - +form.capitalCost))}
                  {+form.amount - +form.capitalCost < 0 && <span style={{ fontSize: 11, fontWeight: 600 }}> (loss)</span>}
                </div>
              </div>
            </div>
          )}

          {/* Label */}
          <div className="ap-fg">
            <label className="ap-label">Label *</label>
            <input
              ref={firstRef}
              className={`ap-input${errors.label ? " err" : ""}`}
              value={form.label}
              placeholder={isIncome ? "e.g. Initial Capital, Sales Revenue…" : "e.g. Restock Budget, Overhead…"}
              onChange={(e) => set("label", e.target.value)}
            />
            {errors.label && <div className="ap-ferr">{errors.label}</div>}
          </div>

          {/* Note */}
          <div className="ap-fg" style={{ marginBottom: 0 }}>
            <label className="ap-label">Note <span style={{ fontWeight: 400, textTransform: "none", color: "var(--ink3)" }}>(optional)</span></label>
            <textarea
              className="ap-textarea"
              value={form.note}
              placeholder="Add any extra details…"
              onChange={(e) => set("note", e.target.value)}
              style={{ minHeight: 68 }}
            />
          </div>

          {/* ── Capital Balance Card (Income type only) ── */}
          {isIncome && (
            <div style={{ marginTop: 20 }}>
              {/* Tappable balance card */}
              <button
                onClick={() => setShowIncomeBreakdown(v => !v)}
                style={{
                  width: "100%", border: "none", cursor: "pointer", textAlign: "left",
                  background: "linear-gradient(135deg,var(--green-lt),#e8faf3)",
                  borderRadius: "var(--rad-lg)", padding: "16px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, transition: "all .15s",
                  boxShadow: "0 1px 6px rgba(0,184,122,.12)",
                  outline: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "rgba(0,184,122,.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Wallet size={20} color="var(--green-dk)" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green-dk)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>
                      Kasalukuyang Capital
                    </div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "var(--green-dk)", lineHeight: 1 }}>
                      ₱{fmt(capitalBalance)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--green-dk)", fontWeight: 600, opacity: .75 }}>
                    {showIncomeBreakdown ? "Hide" : "View Income"}
                  </span>
                  <ChevronDown size={16} color="var(--green-dk)"
                    style={{ transform: showIncomeBreakdown ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </div>
              </button>

              {/* Income breakdown — expands on click */}
              {showIncomeBreakdown && (
                <div style={{
                  marginTop: 8, background: "var(--surf2)",
                  borderRadius: "var(--rad-lg)", border: "1px solid var(--bdr)",
                  overflow: "hidden",
                }}>
                  {/* Summary row */}
                  <div style={{
                    padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap",
                    borderBottom: "1px solid var(--bdr)", background: "var(--surf)",
                  }}>
                    <div style={{
                      flex: 1, minWidth: 100, background: "var(--green-lt)", borderRadius: 8,
                      padding: "8px 12px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green-dk)", textTransform: "uppercase", letterSpacing: ".05em" }}>🛒 Sale Income</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--green-dk)" }}>₱{fmt(totalSaleIncome)}</div>
                      <div style={{ fontSize: 10, color: "var(--green-dk)", opacity: .7 }}>{saleEntries.length} entries</div>
                    </div>
                    <div style={{
                      flex: 1, minWidth: 100, background: "var(--blue-lt)", borderRadius: 8,
                      padding: "8px 12px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: ".05em" }}>✏️ Manual</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--blue)" }}>₱{fmt(totalManualIncome)}</div>
                      <div style={{ fontSize: 10, color: "var(--blue)", opacity: .7 }}>{manualEntries.length} entries</div>
                    </div>
                    <div style={{
                      flex: 1, minWidth: 100, background: "var(--surf3)", borderRadius: 8,
                      padding: "8px 12px", textAlign: "center", border: "1px solid var(--bdr)",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: ".05em" }}>Total</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>₱{fmt(totalIncome)}</div>
                      <div style={{ fontSize: 10, color: "var(--ink3)" }}>{incomeEntries.length} entries</div>
                    </div>
                  </div>

                  {/* Entry list */}
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {incomeEntries.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--ink3)" }}>
                        Wala pang income entries.
                      </div>
                    ) : (
                      incomeEntries.map(e => (
                        <div key={e.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 16px", borderBottom: "1px solid var(--bdr)",
                          fontSize: 13,
                        }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>
                            {e.autoSale ? "🛒" : "💰"}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {e.label}
                            </div>
                            {e.autoSale && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                                background: "var(--blue-lt)", color: "var(--blue)",
                                border: "1px solid rgba(13,158,110,.2)",
                              }}>AUTO · SALE</span>
                            )}
                          </div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--green-dk)", flexShrink: 0 }}>
                            +₱{fmt(e.amount)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="ap-btn primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: isIncome
                ? "linear-gradient(135deg,var(--green-dk),var(--green))"
                : "linear-gradient(135deg,var(--red-dk),var(--red))",
              borderColor: "transparent",
              boxShadow: isIncome
                ? "0 4px 16px rgba(0,184,122,.35)"
                : "0 4px 16px rgba(239,68,68,.3)",
            }}
          >
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} strokeWidth={2.2} />}
            {isEdit ? "Update Entry" : `Save ${isIncome ? "Income" : "Expense"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CAPITAL TAB
// ─────────────────────────────────────────────
function CapitalTab({ entries, capitalBalance, loading, onAdd, onEdit, onDelete, onEditBalance }) {
  const [filter, setFilter] = useState("all"); // "all" | "sale" | "print" | "manual"
  const [expandedId, setExpandedId] = useState(null);

  const stats = useMemo(() => {
    // Exclude autoPrint entries from net capital calculation (view-only)
    const realEntries = entries.filter(e => !e.autoPrint);
    const income = realEntries.filter(e => e.type === "income").reduce((s, e) => s + (e.amount || 0), 0);
    const expense = realEntries.filter(e => e.type === "expense").reduce((s, e) => s + (e.amount || 0), 0);
    const saleIncome = realEntries.filter(e => e.autoSale).reduce((s, e) => s + (e.amount || 0), 0);
    const printIncome = entries.filter(e => e.autoPrint).reduce((s, e) => s + (e.amount || 0), 0);
    return { income, expense, net: income - expense, saleIncome, printIncome };
  }, [entries]);

  const filtered = useMemo(() => {
    if (filter === "sale") return entries.filter(e => e.autoSale);
    if (filter === "print") return entries.filter(e => e.autoPrint);
    if (filter === "manual") return entries.filter(e => !e.autoSale && !e.autoPrint);
    return entries;
  }, [entries, filter]);

  if (loading) return (
    <div className="ap-loading">
      <Loader2 size={32} className="ap-spin" />
      <div className="ap-loading-txt">Loading capital from Firebase…</div>
    </div>
  );

  return (
    <>
      {/* Capital Balance Header */}
      <div className="cap-balance-header">
        <div className="cap-balance-left">
          <div className="cap-balance-logo">
            <Wallet size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <div className="cap-balance-label">Kasalukuyang Capital</div>
            <div className="cap-balance-amount">₱{fmt(capitalBalance)}</div>
            <div className="cap-balance-sub">Actual na pera sa kamay / bangko</div>
          </div>
        </div>
        <button className="cap-balance-edit-btn" onClick={onEditBalance}>
          <Pencil size={14} /> Baguhin
        </button>
      </div>

      <div className="ap-capital-stats">
        <StatCard label="Total Income" value={`₱${fmt(stats.income)}`} color="green" icon={CheckCircle} sub="Excl. print service" />
        <StatCard label="Total Expenses" value={`₱${fmt(stats.expense)}`} color="red" icon={TrendingDown} sub="All expense entries" />
        <StatCard
          label="Net Capital"
          value={`₱${fmt(Math.abs(stats.net))}`}
          color={stats.net >= 0 ? "green" : "red"}
          icon={Wallet}
          sub={stats.net >= 0 ? "Positive balance" : "Negative balance"}
        />
        <StatCard label="From Sales" value={`₱${fmt(stats.saleIncome)}`} color="blue" icon={ShoppingCart} sub="Auto-generated income" />
      </div>

      {/* Print service visibility note */}
      {stats.printIncome > 0 && (
        <div style={{
          background: "var(--purple-lt)", border: "1px solid rgba(139,92,246,.2)",
          borderRadius: "var(--rad)", padding: "10px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--purple-dk)",
        }}>
          <span style={{ fontSize: 16 }}>🖨️</span>
          <span><strong>₱{fmt(stats.printIncome)}</strong> mula sa Print & Laminate service ang visible dito pero <strong>hindi kasama sa Net Capital</strong>.</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["all", "Lahat"], ["sale", "🛒 Sale"], ["print", "🖨️ Print"], ["manual", "✏️ Manual"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${filter === val ? "var(--blue)" : "var(--bdr2)"}`,
                background: filter === val ? "var(--blue-lt)" : "var(--surf2)",
                color: filter === val ? "var(--blue)" : "var(--ink2)",
                transition: "all .15s",
              }}
            >{label}</button>
          ))}
        </div>
        <button className="ap-btn primary" onClick={onAdd}>
          <Plus size={15} strokeWidth={2.2} /> Add Entry
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="ap-capital-empty">
          <div className="ap-capital-empty-icon">💼</div>
          <div className="ap-capital-empty-txt">
            {filter === "sale" ? "Wala pang auto-generated na entries mula sa sale." : "No capital entries yet. Add your first entry."}
          </div>
        </div>
      ) : (
        <div className="ap-capital-entries">
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const hasBreakdown = entry.type === "income" && entry.capitalCost > 0;
            const profit = hasBreakdown ? entry.amount - entry.capitalCost : null;
            return (
              <div key={entry.id} className="ap-capital-entry" style={{ flexDirection: "column", alignItems: "stretch", cursor: hasBreakdown ? "pointer" : "default", gap: 0 }}
                onClick={() => hasBreakdown && setExpandedId(isExpanded ? null : entry.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
                  <div className={`ap-capital-entry-icon ${entry.type}`}>
                    {entry.autoSale ? "🛒" : entry.autoPrint ? "🖨️" : entry.type === "income" ? "💰" : "📤"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <div className="ap-capital-entry-label">{entry.label}</div>
                      {entry.autoSale && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                          background: "var(--blue-lt)", color: "var(--blue)",
                          border: "1px solid rgba(13,158,110,.2)", flexShrink: 0,
                        }}>AUTO · SALE</span>
                      )}
                      {entry.autoPrint && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                          background: "var(--purple-lt)", color: "var(--purple-dk)",
                          border: "1px solid rgba(139,92,246,.2)", flexShrink: 0,
                        }}>🖨️ PRINT · VIEW ONLY</span>
                      )}
                      {hasBreakdown && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                          background: profit >= 0 ? "var(--green-lt)" : "var(--red-lt)",
                          color: profit >= 0 ? "var(--green-dk)" : "var(--red-dk)",
                          border: `1px solid ${profit >= 0 ? "rgba(0,184,122,.25)" : "rgba(239,68,68,.2)"}`, flexShrink: 0,
                        }}>
                          {profit >= 0 ? `+₱${fmt(profit)} income` : `-₱${fmt(Math.abs(profit))} loss`}
                        </span>
                      )}
                    </div>
                    {entry.note && <div className="ap-capital-entry-note">{entry.note}</div>}
                  </div>
                  <div className="ap-capital-entry-date">{fmtDate(entry.createdAt)}</div>
                  <div className={`ap-capital-entry-amount ${entry.type}`}>
                    {entry.type === "income" ? "+" : "−"}₱{fmt(entry.amount)}
                  </div>
                  {hasBreakdown && (
                    <ChevronDown size={16} color="var(--ink3)"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
                  )}
                  <div className="ap-capital-actions" onClick={e => e.stopPropagation()}>
                    <button className="ap-btn ghost sm icon" title="Edit" onClick={() => onEdit(entry)}>
                      <Pencil size={14} strokeWidth={1.8} />
                    </button>
                    <button className="ap-btn ghost sm icon" title="Delete" style={{ color: "var(--red)" }} onClick={() => onDelete(entry)}>
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
                {isExpanded && hasBreakdown && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--bdr)", paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 90, background: "var(--surf2)", borderRadius: 8, padding: "10px 14px", textAlign: "center", border: "1px solid var(--bdr)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>💵 Selling Price</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>₱{fmt(entry.amount)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 90, background: "var(--amber-lt)", borderRadius: 8, padding: "10px 14px", textAlign: "center", border: "1px solid rgba(245,158,11,.2)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--amber-dk)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>📦 Capital</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "var(--amber-dk)" }}>₱{fmt(entry.capitalCost)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 90, background: profit >= 0 ? "var(--green-lt)" : "var(--red-lt)", borderRadius: 8, padding: "10px 14px", textAlign: "center", border: `1px solid ${profit >= 0 ? "rgba(0,184,122,.2)" : "rgba(239,68,68,.15)"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: profit >= 0 ? "var(--green-dk)" : "var(--red-dk)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>✅ Income</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: profit >= 0 ? "var(--green-dk)" : "var(--red-dk)" }}>
                        {profit >= 0 ? "" : "−"}₱{fmt(Math.abs(profit))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  GCASH LOCK SCREEN
// ─────────────────────────────────────────────
function GCashLockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const PASSCODE = "101660";
  const MAX = PASSCODE.length;

  const press = (key) => {
    if (key === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= MAX) return;
    const next = pin + key;
    setPin(next);
    if (next.length === MAX) {
      setTimeout(() => {
        if (next === PASSCODE) { onUnlock(); }
        else {
          setShake(true); setErrMsg("Wrong passcode. Try again.");
          setTimeout(() => { setShake(false); setPin(""); setErrMsg(""); }, 900);
        }
      }, 120);
    }
  };

  return (
    <div className="gcash-lock">
      <div className="gcash-lock-card">
        <div className="gcash-lock-ring">💙</div>
        <div className="gcash-lock-title">GCash is Locked</div>
        <div className="gcash-lock-sub">Enter your 6-digit passcode to access GCash records.</div>
        <div className="ap-capital-pin-dots">
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} className={`ap-capital-pin-dot${pin.length > i ? (shake ? " err" : " filled") : ""}`} />
          ))}
        </div>
        <div className="ap-capital-pinpad">
          {PIN_KEYS.map(([digit, letters], idx) => {
            if (digit === null) return <div key={idx} />;
            return (
              <button key={idx} className={`ap-capital-pin-btn${digit === "⌫" ? " del" : ""}`} onClick={() => press(digit)}>
                <span>{digit}</span>
                {letters !== undefined && letters !== "" && <span className="ap-capital-pin-sub">{letters}</span>}
              </button>
            );
          })}
        </div>
        <div className="ap-capital-pin-err">{errMsg}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  GCASH EDIT WALLET MODAL (balance & charge)
// ─────────────────────────────────────────────
function GCashEditWalletModal({ gcashData, onSave, onClose }) {
  const [balance, setBalance] = useState(String(gcashData.balance));
  const [charge, setCharge] = useState(String(gcashData.charge));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [step, setStep] = useState("pin"); // pin | edit
  const PASSCODE = "101660";

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const validate = () => {
    const e = {};
    if (balance === "" || isNaN(+balance)) e.balance = "Enter a valid balance";
    if (charge === "" || isNaN(+charge) || +charge < 0) e.charge = "Enter a valid charge";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(Math.round(+balance), Math.round(+charge));
    setSaving(false);
    onClose();
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 420 }}>
        <div className="ap-modal-head">
          <h3>💙 Edit GCash Wallet</h3>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>Enter passcode to edit wallet.</div>
            <input
              type="password"
              className={`ap-input${passErr ? " err" : ""}`}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode"
              style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
              maxLength={10}
              autoFocus
            />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Incorrect passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div className="ap-fg">
                <label className="ap-label">GCash Balance (₱)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                  <input
                    className={`ap-input${errors.balance ? " err" : ""}`}
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#0070e0" }}
                    autoFocus
                  />
                </div>
                {errors.balance && <div className="ap-ferr">{errors.balance}</div>}
              </div>
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Total Charges Earned (₱)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                  <input
                    className={`ap-input${errors.charge ? " err" : ""}`}
                    type="number"
                    value={charge}
                    onChange={(e) => setCharge(e.target.value)}
                    style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--blue)" }}
                  />
                </div>
                {errors.charge && <div className="ap-ferr">{errors.charge}</div>}
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  GCASH EDIT TRANSACTION MODAL
// ─────────────────────────────────────────────
function GCashEditTxnModal({ txn, gcashData, onSave, onClose }) {
  const [step, setStep] = useState("pin");
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [form, setForm] = useState({ type: txn.type, amount: String(txn.amount), charge: String(txn.charge), phone: txn.phone || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const PASSCODE = "101660";

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = "Enter a valid amount";
    if (!form.charge || isNaN(+form.charge) || +form.charge < 0) e.charge = "Enter a valid charge amount";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { /* handled */ }
    setSaving(false);
  };

  const isCashIn = form.type === "cashin";

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 480 }}>
        <div className="ap-modal-head" style={{
          background: isCashIn ? "linear-gradient(135deg,#e0f7fa,var(--surf))" : "linear-gradient(135deg,var(--amber-lt),var(--surf))",
          borderBottom: `1px solid ${isCashIn ? "rgba(0,112,224,.2)" : "rgba(245,158,11,.2)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: isCashIn ? "#e0f7fa" : "var(--amber-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✏️</div>
            <h3 style={{ color: isCashIn ? "#0070e0" : "var(--amber-dk)" }}>Edit GCash Transaction</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>I-enter ang passcode para i-edit ang transaction.</div>
            <input type="password" className={`ap-input${passErr ? " err" : ""}`}
              value={passcode} onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode" style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
              maxLength={10} autoFocus />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Mali ang passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#0070e0,#00a8e8)", borderColor: "transparent" }}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div className="gcash-type-row">
                <button className={`gcash-type-btn cashin${form.type === "cashin" ? " sel" : ""}`} onClick={() => set("type", "cashin")}>
                  <div className="gcash-type-icon"><ArrowDownCircle size={22} /></div>
                  <div className="gcash-type-lbl">Cash In</div>
                  <div className="gcash-type-sub">Dagdag sa GCash</div>
                </button>
                <button className={`gcash-type-btn cashout${form.type === "cashout" ? " sel" : ""}`} onClick={() => set("type", "cashout")}>
                  <div className="gcash-type-icon"><ArrowUpCircle size={22} /></div>
                  <div className="gcash-type-lbl">Cash Out</div>
                  <div className="gcash-type-sub">Bawas sa GCash</div>
                </button>
              </div>
              <div className="ap-form-row">
                <div className="ap-fg">
                  <label className="ap-label">Amount (₱) *</label>
                  <input className={`ap-input${errors.amount ? " err" : ""}`} type="number" min="0"
                    value={form.amount} onChange={(e) => set("amount", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} autoFocus />
                  {errors.amount && <div className="ap-ferr">{errors.amount}</div>}
                </div>
                <div className="ap-fg">
                  <label className="ap-label">Charge (₱) *</label>
                  <input className={`ap-input${errors.charge ? " err" : ""}`} type="number" min="0"
                    value={form.charge} onChange={(e) => set("charge", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  {errors.charge && <div className="ap-ferr">{errors.charge}</div>}
                </div>
              </div>
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label"><Phone size={12} style={{ display: "inline", marginRight: 4 }} />Phone Number *</label>
                <input className={`ap-input${errors.phone ? " err" : ""}`} type="tel"
                  value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09XX XXX XXXX" />
                {errors.phone && <div className="ap-ferr">{errors.phone}</div>}
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving}
                style={{ background: isCashIn ? "linear-gradient(135deg,#0070e0,#00a8e8)" : "linear-gradient(135deg,var(--amber-dk),var(--amber))", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />} Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  GCASH ADD TRANSACTION MODAL
// ─────────────────────────────────────────────
function GCashAddTxnModal({ gcashData, onSave, onClose }) {
  const [form, setForm] = useState({ type: "cashin", amount: "", charge: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = "Enter a valid amount";
    if (!form.charge || isNaN(+form.charge) || +form.charge < 0) e.charge = "Enter a valid charge amount";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (form.type === "cashout" && +form.amount > gcashData.balance) e.amount = "Insufficient GCash balance";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) { /* error shown by hook */ }
    setSaving(false);
  };

  const isCashIn = form.type === "cashin";
  const previewBalance = form.amount
    ? (isCashIn ? gcashData.balance + +form.amount : gcashData.balance - +form.amount)
    : gcashData.balance;

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 480 }}>
        <div className="ap-modal-head" style={{
          background: isCashIn ? "linear-gradient(135deg,#e0f7fa,var(--surf))" : "linear-gradient(135deg,var(--amber-lt),var(--surf))",
          borderBottom: `1px solid ${isCashIn ? "rgba(0,112,224,.2)" : "rgba(245,158,11,.2)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: isCashIn ? "#e0f7fa" : "var(--amber-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {isCashIn ? "💙" : "🟡"}
            </div>
            <h3 style={{ color: isCashIn ? "#0070e0" : "var(--amber-dk)" }}>Record GCash Transaction</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {/* Type selector */}
        <div className="ap-modal-body">
          <div className="gcash-type-row">
            <button className={`gcash-type-btn cashin${form.type === "cashin" ? " sel" : ""}`} onClick={() => set("type", "cashin")}>
              <div className="gcash-type-icon"><ArrowDownCircle size={22} /></div>
              <div className="gcash-type-lbl">Cash In</div>
              <div className="gcash-type-sub">Dagdag sa GCash</div>
            </button>
            <button className={`gcash-type-btn cashout${form.type === "cashout" ? " sel" : ""}`} onClick={() => set("type", "cashout")}>
              <div className="gcash-type-icon"><ArrowUpCircle size={22} /></div>
              <div className="gcash-type-lbl">Cash Out</div>
              <div className="gcash-type-sub">Bawas sa GCash</div>
            </button>
          </div>

          {/* Current balance preview */}
          <div style={{
            background: isCashIn ? "#e0f7fa" : "var(--amber-lt)",
            borderRadius: "var(--rad)", padding: "12px 16px", marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: `1px solid ${isCashIn ? "rgba(0,112,224,.2)" : "rgba(245,158,11,.2)"}`,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: isCashIn ? "#0070e0" : "var(--amber-dk)", textTransform: "uppercase", letterSpacing: ".05em" }}>Current Balance</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: isCashIn ? "#0070e0" : "var(--amber-dk)" }}>₱{fmt(gcashData.balance)}</div>
            </div>
            {form.amount && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em" }}>After</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: previewBalance < 0 ? "var(--red)" : (isCashIn ? "#0070e0" : "var(--amber-dk)") }}>
                  ₱{fmt(previewBalance)}
                </div>
              </div>
            )}
          </div>

          <div className="ap-form-row">
            <div className="ap-fg">
              <label className="ap-label">Amount (₱) *</label>
              <input
                className={`ap-input${errors.amount ? " err" : ""}`}
                type="number" min="0"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0"
                autoFocus
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
              {errors.amount && <div className="ap-ferr">{errors.amount}</div>}
            </div>
            <div className="ap-fg">
              <label className="ap-label">Charge (₱) *</label>
              <input
                className={`ap-input${errors.charge ? " err" : ""}`}
                type="number" min="0"
                value={form.charge}
                onChange={(e) => set("charge", e.target.value)}
                placeholder="0"
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
              {errors.charge && <div className="ap-ferr">{errors.charge}</div>}
              <div className="ap-fhint">Dagdag sa total charges</div>
            </div>
          </div>

          <div className="ap-fg" style={{ marginBottom: 0 }}>
            <label className="ap-label"><Phone size={12} style={{ display: "inline", marginRight: 4 }} />Phone Number *</label>
            <input
              className={`ap-input${errors.phone ? " err" : ""}`}
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="09XX XXX XXXX"
            />
            {errors.phone && <div className="ap-ferr">{errors.phone}</div>}
          </div>
        </div>
        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="ap-btn primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: isCashIn ? "linear-gradient(135deg,#0070e0,#00a8e8)" : "linear-gradient(135deg,var(--amber-dk),var(--amber))",
              borderColor: "transparent",
            }}
          >
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
            {isCashIn ? "Record Cash In" : "Record Cash Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  GCASH TAB
// ─────────────────────────────────────────────
function GCashTab({ gcashData, gcashTxns, loading, onAddTxn, onDeleteTxn, onEditTxn, onEditWallet, onReset }) {
  const [subTab, setSubTab] = useState("overview");
  const [deletingTxn, setDeletingTxn] = useState(null);
  const [deletePin, setDeletePin] = useState("");
  const [deletePinErr, setDeletePinErr] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetPinErr, setResetPinErr] = useState(false);
  const [resetting, setResetting] = useState(false);
  // History filters
  const [histSearch, setHistSearch] = useState("");
  const [histDateFilter, setHistDateFilter] = useState("all");
  const [histTypeFilter, setHistTypeFilter] = useState("all");
  const PASSCODE = "101660";

  const totalCashIn = gcashTxns.filter(t => t.type === "cashin").reduce((s, t) => s + t.amount, 0);
  const totalCashOut = gcashTxns.filter(t => t.type === "cashout").reduce((s, t) => s + t.amount, 0);

  const filteredTxns = useMemo(() => {
    const q = histSearch.toLowerCase().trim();
    return gcashTxns.filter(t => {
      const matchDate = matchesDateFilter(t.createdAt, histDateFilter);
      const matchType = histTypeFilter === "all" || t.type === histTypeFilter;
      const matchQ = !q || t.phone?.toLowerCase().includes(q);
      return matchDate && matchType && matchQ;
    });
  }, [gcashTxns, histSearch, histDateFilter, histTypeFilter]);

  const filtTotalCashIn = filteredTxns.filter(t => t.type === "cashin").reduce((s, t) => s + t.amount, 0);
  const filtTotalCashOut = filteredTxns.filter(t => t.type === "cashout").reduce((s, t) => s + t.amount, 0);
  const filtTotalCharges = filteredTxns.reduce((s, t) => s + (t.charge || 0), 0);

  const handleDeleteConfirm = () => {
    if (deletePin === PASSCODE) {
      onDeleteTxn(deletingTxn);
      setDeletingTxn(null);
      setDeletePin("");
    } else {
      setDeletePinErr(true);
      setDeletePin("");
      setTimeout(() => setDeletePinErr(false), 1500);
    }
  };

  const handleResetConfirm = async () => {
    if (resetPin === PASSCODE) {
      setResetting(true);
      try { await onReset(); } catch (e) { /* handled */ }
      setResetting(false);
      setResetOpen(false);
      setResetPin("");
    } else {
      setResetPinErr(true);
      setResetPin("");
      setTimeout(() => setResetPinErr(false), 1500);
    }
  };

  if (loading) return (
    <div className="ap-loading">
      <Loader2 size={32} className="ap-spin" />
      <div className="ap-loading-txt">Loading GCash data from Firebase…</div>
    </div>
  );

  return (
    <>
      {/* Header / Balance Card */}
      <div className="gcash-header">
        <div className="gcash-header-left">
          <div className="gcash-header-logo">💙</div>
          <div>
            <div className="gcash-header-label">GCash Balance</div>
            <div className="gcash-header-balance">₱{fmt(gcashData.balance)}</div>
          </div>
        </div>
        <div className="gcash-header-right">
          <button className="gcash-edit-btn" onClick={onEditWallet}>
            <Pencil size={14} /> Edit Wallet
          </button>
          <button
            className="gcash-edit-btn"
            onClick={() => { setResetOpen(true); setResetPin(""); setResetPinErr(false); }}
            style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", border: "1px solid rgba(239,68,68,.35)", marginLeft: 6 }}
            title="Restart — clear all transactions (keeps balance)"
          >
            🔄 Restart
          </button>
          <div style={{ fontSize: 12, opacity: .7 }}>
            {gcashTxns.length} transaction{gcashTxns.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid var(--bdr)", paddingBottom: 0 }}>
        {[{ key: "overview", label: "Overview", emoji: "💙" }, { key: "history", label: "History", emoji: "📋" }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            border: "none", background: "none",
            color: subTab === t.key ? "#0070e0" : "var(--ink3)",
            borderBottom: subTab === t.key ? "2px solid #0070e0" : "2px solid transparent",
            marginBottom: -2, transition: "all .15s", display: "flex", alignItems: "center", gap: 7,
          }}>
            <span>{t.emoji}</span> {t.label}
            {t.key === "history" && gcashTxns.length > 0 && (
              <span style={{ background: "#0070e0", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{gcashTxns.length}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === "overview" ? (
        <>
          {/* Stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
            <StatCard label="Total Cash In" value={`₱${fmt(totalCashIn)}`} color="blue" icon={ArrowDownCircle} sub="All cash-in" />
            <StatCard label="Total Cash Out" value={`₱${fmt(totalCashOut)}`} color="amber" icon={ArrowUpCircle} sub="All cash-out" />
            <StatCard label="Charges Earned" value={`₱${fmt(gcashData.charge)}`} color="green" icon={CreditCard} sub="Total charges" />
          </div>
          {/* Charge card */}
          <div className="gcash-charge-card">
            <div>
              <div className="gcash-charge-label">Total Charges Collected</div>
              <div className="gcash-charge-val">₱{fmt(gcashData.charge)}</div>
            </div>
            <CreditCard size={28} color="var(--blue)" strokeWidth={1.5} />
          </div>
          {/* Add button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="ap-btn primary" onClick={onAddTxn} style={{ background: "linear-gradient(135deg,#0070e0,#00a8e8)", borderColor: "transparent" }}>
              <Plus size={15} /> New Transaction
            </button>
          </div>
          {/* Recent transactions preview */}
          {gcashTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">💙</div>
              <div className="ap-empty-txt">Wala pang GCash transactions. I-click ang "New Transaction" para magsimula.</div>
            </div>
          ) : (
            <div className="gcash-txn-list">
              {gcashTxns.slice(0, 5).map((txn) => (
                <div key={txn.id} className="gcash-txn">
                  <div className={`gcash-txn-icon ${txn.type}`}>
                    {txn.type === "cashin" ? <ArrowDownCircle size={18} strokeWidth={2} /> : <ArrowUpCircle size={18} strokeWidth={2} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="gcash-txn-type">{txn.type === "cashin" ? "Cash In" : "Cash Out"}</div>
                    <div className="gcash-txn-sub"><Phone size={10} style={{ display: "inline", marginRight: 3 }} />{txn.phone}</div>
                  </div>
                  <div className="gcash-txn-date">{fmtDate(txn.createdAt)}</div>
                  <div className="gcash-txn-right">
                    <div className={`gcash-txn-amount ${txn.type}`}>{txn.type === "cashin" ? "+" : "−"}₱{fmt(txn.amount)}</div>
                    <div className="gcash-txn-charge">Charge: ₱{fmt(txn.charge)}</div>
                  </div>
                </div>
              ))}
              {gcashTxns.length > 5 && (
                <div style={{ padding: "12px 20px", textAlign: "center" }}>
                  <button className="ap-btn sm" onClick={() => setSubTab("history")} style={{ color: "#0070e0" }}>
                    <History size={13} /> View all {gcashTxns.length} transactions →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* History filtered stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <StatCard label="Transactions" value={filteredTxns.length} color="blue" icon={History} sub={DATE_FILTERS.find(f => f.key === histDateFilter)?.label} />
            <StatCard label="Cash In" value={`₱${fmt(filtTotalCashIn)}`} color="blue" icon={ArrowDownCircle} sub="Filtered period" />
            <StatCard label="Charges" value={`₱${fmt(filtTotalCharges)}`} color="green" icon={CreditCard} sub="Filtered period" />
          </div>

          {/* Filters */}
          <div className="ap-toolbar" style={{ marginBottom: 14 }}>
            <select className={`ap-select${histDateFilter !== "all" ? " on" : ""}`} value={histDateFilter} onChange={e => setHistDateFilter(e.target.value)}>
              {DATE_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <select className="ap-select" value={histTypeFilter} onChange={e => setHistTypeFilter(e.target.value)} style={{ minWidth: 130 }}>
              <option value="all">All Types</option>
              <option value="cashin">Cash In</option>
              <option value="cashout">Cash Out</option>
            </select>
            <div className="ap-search-wrap">
              <span className="ap-search-icon"><Search size={16} strokeWidth={1.8} /></span>
              <input className="ap-search" placeholder="Search phone number…" value={histSearch} onChange={e => setHistSearch(e.target.value)} />
            </div>
          </div>

          {filteredTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">💙</div>
              <div className="ap-empty-txt">{gcashTxns.length === 0 ? "Wala pang transactions." : "Walang match sa filters."}</div>
            </div>
          ) : (
            <div className="gcash-txn-list">
              {filteredTxns.map((txn) => (
                <div key={txn.id} className="gcash-txn">
                  <div className={`gcash-txn-icon ${txn.type}`}>
                    {txn.type === "cashin" ? <ArrowDownCircle size={18} strokeWidth={2} /> : <ArrowUpCircle size={18} strokeWidth={2} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="gcash-txn-type">{txn.type === "cashin" ? "Cash In" : "Cash Out"}</div>
                    <div className="gcash-txn-sub"><Phone size={10} style={{ display: "inline", marginRight: 3 }} />{txn.phone}</div>
                  </div>
                  <div className="gcash-txn-date">{fmtDate(txn.createdAt)}</div>
                  <div className="gcash-txn-right">
                    <div className={`gcash-txn-amount ${txn.type}`}>{txn.type === "cashin" ? "+" : "−"}₱{fmt(txn.amount)}</div>
                    <div className="gcash-txn-charge">Charge: ₱{fmt(txn.charge)}</div>
                  </div>
                  <div className="gcash-txn-actions">
                    <button className="ap-btn ghost sm icon" title="Edit" style={{ color: "var(--blue)" }}
                      onClick={() => setEditingTxn(txn)}>
                      <Pencil size={14} strokeWidth={1.8} />
                    </button>
                    <button className="ap-btn ghost sm icon" title="Delete" style={{ color: "var(--red)" }}
                      onClick={() => { setDeletingTxn(txn); setDeletePin(""); setDeletePinErr(false); }}>
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editingTxn && (
        <GCashEditTxnModal
          txn={editingTxn}
          gcashData={gcashData}
          onSave={(form) => onEditTxn(editingTxn, form)}
          onClose={() => setEditingTxn(null)}
        />
      )}

      {/* Delete confirm modal with passcode */}
      {deletingTxn && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setDeletingTxn(null)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
              <div className="ap-confirm-title">Delete Transaction?</div>
              <div className="ap-confirm-msg">
                <strong>{deletingTxn.type === "cashin" ? "Cash In" : "Cash Out"} — ₱{fmt(deletingTxn.amount)}</strong><br />
                <span style={{ fontSize: 12, color: "var(--ink3)" }}>Phone: {deletingTxn.phone}</span><br />
                <span style={{ fontSize: 12, color: "var(--red)", display: "block", marginTop: 6 }}>This will reverse the balance and charge effects.</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="password" className={`ap-input${deletePinErr ? " err" : ""}`}
                  value={deletePin} onChange={(e) => setDeletePin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }} autoFocus maxLength={10} />
                {deletePinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setDeletingTxn(null)}>Cancel</button>
                <button className="ap-btn danger" onClick={handleDeleteConfirm}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {resetOpen && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setResetOpen(false)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon" style={{ background: "var(--red-lt)", color: "var(--red)" }}>🔄</div>
              <div className="ap-confirm-title">Restart GCash?</div>
              <div className="ap-confirm-msg">
                Ang <strong>charges</strong> ay ibabalik sa zero.<br />
                <span style={{ color: "var(--green-dk)", fontWeight: 700 }}>GCash Balance (₱{fmt(gcashData.balance)}) ay mananatili.</span><br />
                <span style={{ fontSize: 12, color: "var(--green-dk)", display: "block", marginTop: 6 }}>✅ Ang lahat ng {gcashTxns.length} transactions ay mananatili sa history — hindi mabubura.</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="password" className={`ap-input${resetPinErr ? " err" : ""}`}
                  value={resetPin} onChange={(e) => setResetPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }} autoFocus maxLength={10} />
                {resetPinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setResetOpen(false)} disabled={resetting}>Cancel</button>
                <button className="ap-btn danger" onClick={handleResetConfirm} disabled={resetting}>
                  {resetting ? <Loader2 size={14} className="ap-spin" /> : "🔄"} Restart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// ─────────────────────────────────────────────
function LoadLockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const PASSCODE = "101660";
  const MAX = PASSCODE.length;

  const press = (key) => {
    if (key === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= MAX) return;
    const next = pin + key;
    setPin(next);
    if (next.length === MAX) {
      setTimeout(() => {
        if (next === PASSCODE) { onUnlock(); }
        else {
          setShake(true); setErrMsg("Wrong passcode. Try again.");
          setTimeout(() => { setShake(false); setPin(""); setErrMsg(""); }, 900);
        }
      }, 120);
    }
  };

  return (
    <div className="load-lock">
      <div className="load-lock-card">
        <div className="load-lock-ring">📶</div>
        <div className="load-lock-title">Load Service is Locked</div>
        <div className="load-lock-sub">Enter your 6-digit passcode to access load service records.</div>
        <div className="ap-capital-pin-dots">
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} className={`ap-capital-pin-dot${pin.length > i ? (shake ? " err" : " filled") : ""}`} />
          ))}
        </div>
        <div className="ap-capital-pinpad">
          {PIN_KEYS.map(([digit, letters], idx) => {
            if (digit === null) return <div key={idx} />;
            return (
              <button key={idx} className={`ap-capital-pin-btn${digit === "⌫" ? " del" : ""}`} onClick={() => press(digit)}>
                <span>{digit}</span>
                {letters !== undefined && letters !== "" && <span className="ap-capital-pin-sub">{letters}</span>}
              </button>
            );
          })}
        </div>
        <div className="ap-capital-pin-err">{errMsg}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  LOAD EDIT WALLET MODAL
// ─────────────────────────────────────────────
function LoadEditWalletModal({ loadData, onSave, onClose }) {
  const [smartTnt, setSmartTnt] = useState(String(loadData.smartTnt ?? 0));
  const [globeTm, setGlobeTm] = useState(String(loadData.globeTm ?? 0));
  const [dito, setDito] = useState(String(loadData.dito ?? 0));
  const [totalProfit, setTotalProfit] = useState(String(loadData.totalProfit));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [step, setStep] = useState("pin");
  const PASSCODE = "101660";

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const validate = () => {
    const e = {};
    if (smartTnt === "" || isNaN(+smartTnt)) e.smartTnt = "Enter a valid balance";
    if (globeTm === "" || isNaN(+globeTm)) e.globeTm = "Enter a valid balance";
    if (dito === "" || isNaN(+dito)) e.dito = "Enter a valid balance";
    if (totalProfit === "" || isNaN(+totalProfit) || +totalProfit < 0) e.totalProfit = "Enter a valid profit amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(Math.round(+smartTnt), Math.round(+globeTm), Math.round(+dito), Math.round(+totalProfit));
    setSaving(false);
    onClose();
  };

  const BalanceField = ({ label, emoji, value, onChange, errKey }) => (
    <div className="ap-fg">
      <label className="ap-label">{emoji} {label} Balance (₱)</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
        <input
          className={`ap-input${errors[errKey] ? " err" : ""}`}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "#16a34a" }}
        />
      </div>
      {errors[errKey] && <div className="ap-ferr">{errors[errKey]}</div>}
    </div>
  );

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 440 }}>
        <div className="ap-modal-head">
          <h3>📶 Edit Load Wallets</h3>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>Enter passcode to edit load wallets.</div>
            <input
              type="password"
              className={`ap-input${passErr ? " err" : ""}`}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode"
              style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
              maxLength={10}
              autoFocus
            />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Incorrect passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", borderColor: "transparent" }}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div style={{ background: "var(--surf2)", borderRadius: "var(--rad)", padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "var(--ink3)", border: "1px solid var(--bdr)" }}>
                💡 Bawat network group ay may sariling balance. Awtomatikong nagde-deduct sa tamang wallet kapag nag-record ng load.
              </div>
              <BalanceField label="Smart / TNT" emoji="🔴" value={smartTnt} onChange={setSmartTnt} errKey="smartTnt" />
              <BalanceField label="Globe / TM" emoji="🔵" value={globeTm} onChange={setGlobeTm} errKey="globeTm" />
              <BalanceField label="DITO" emoji="🟣" value={dito} onChange={setDito} errKey="dito" />
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Total Profit Earned (₱)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                  <input
                    className={`ap-input${errors.totalProfit ? " err" : ""}`}
                    type="number"
                    value={totalProfit}
                    onChange={(e) => setTotalProfit(e.target.value)}
                    style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "var(--green-dk)" }}
                  />
                </div>
                {errors.totalProfit && <div className="ap-ferr">{errors.totalProfit}</div>}
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving} style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  LOAD ADD TRANSACTION MODAL
// ─────────────────────────────────────────────
const NETWORKS = ["Globe", "TM", "Smart", "TNT", "DITO"];
const LOAD_TYPES = [
  { key: "regular", label: "Regular", sub: "Regular load", icon: <Signal size={20} /> },
  { key: "data", label: "Data", sub: "Data pack", icon: <Zap size={20} /> },
  { key: "promo", label: "Promo", sub: "Promo/combo", icon: <SendHorizonal size={20} /> },
];

function LoadEditTxnModal({ txn, loadData, onSave, onClose }) {
  const [step, setStep] = useState("pin");
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [form, setForm] = useState({ type: txn.type, network: txn.network, phone: txn.phone, cost: String(txn.cost), sellingPrice: String(txn.sellingPrice), note: txn.note || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const PASSCODE = "101660";

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const validate = () => {
    const e = {};
    if (!form.network.trim()) e.network = "Network is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.cost || isNaN(+form.cost) || +form.cost < 0) e.cost = "Enter valid cost";
    if (!form.sellingPrice || isNaN(+form.sellingPrice) || +form.sellingPrice <= 0) e.sellingPrice = "Enter valid selling price";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { /* handled */ }
    setSaving(false);
  };

  const profit = (+form.sellingPrice || 0) - (+form.cost || 0);

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 480 }}>
        <div className="ap-modal-head" style={{ background: "linear-gradient(135deg,var(--green-lt),var(--surf))", borderBottom: "1px solid rgba(22,163,74,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--green-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✏️</div>
            <h3 style={{ color: "#16a34a" }}>Edit Load Transaction</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>I-enter ang passcode para i-edit ang transaction.</div>
            <input type="password" className={`ap-input${passErr ? " err" : ""}`}
              value={passcode} onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode" style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
              maxLength={10} autoFocus />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Mali ang passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", borderColor: "transparent" }}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div className="ap-fg">
                <label className="ap-label">Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {LOAD_TYPES.map(t => (
                    <button key={t.key} onClick={() => set("type", t.key)} style={{
                      flex: 1, padding: "10px 8px", borderRadius: 10, border: `2px solid ${form.type === t.key ? "#16a34a" : "var(--bdr2)"}`,
                      background: form.type === t.key ? "var(--green-lt)" : "var(--surf2)", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700,
                      color: form.type === t.key ? "#16a34a" : "var(--ink2)", transition: "all .15s",
                    }}>
                      {t.icon}<span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="ap-form-row">
                <div className="ap-fg">
                  <label className="ap-label">Network</label>
                  <select className="ap-select" value={form.network} onChange={(e) => set("network", e.target.value)} style={{ width: "100%" }}>
                    {["Globe", "TM", "Smart", "TNT", "DITO"].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="ap-fg">
                  <label className="ap-label"><Phone size={12} style={{ display: "inline", marginRight: 4 }} />Phone *</label>
                  <input className={`ap-input${errors.phone ? " err" : ""}`} type="tel"
                    value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09XX XXX XXXX" autoFocus />
                  {errors.phone && <div className="ap-ferr">{errors.phone}</div>}
                </div>
              </div>
              <div className="ap-form-row">
                <div className="ap-fg">
                  <label className="ap-label">Selling Price (₱) *</label>
                  <input className={`ap-input${errors.sellingPrice ? " err" : ""}`} type="number" min="0"
                    value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  {errors.sellingPrice && <div className="ap-ferr">{errors.sellingPrice}</div>}
                </div>
                <div className="ap-fg">
                  <label className="ap-label">Cost (₱) *</label>
                  <input className={`ap-input${errors.cost ? " err" : ""}`} type="number" min="0"
                    value={form.cost} onChange={(e) => set("cost", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  {errors.cost && <div className="ap-ferr">{errors.cost}</div>}
                </div>
              </div>
              {form.sellingPrice && form.cost && (
                <div style={{ background: profit >= 0 ? "var(--green-lt)" : "var(--red-lt)", borderRadius: "var(--rad)", padding: "10px 14px", marginBottom: 8, fontSize: 13, fontWeight: 700, color: profit >= 0 ? "var(--green-dk)" : "var(--red-dk)", border: `1px solid ${profit >= 0 ? "rgba(0,184,122,.2)" : "rgba(239,68,68,.2)"}` }}>
                  Profit: {profit >= 0 ? "+" : ""}₱{fmt(profit)}
                </div>
              )}
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Note (optional)</label>
                <input className="ap-input" type="text" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. promo details…" />
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving}
                style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />} Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadAddTxnModal({ loadData, onSave, onClose }) {
  const [form, setForm] = useState({ type: "regular", network: "Globe", phone: "", cost: "", sellingPrice: "", note: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const profit = form.cost && form.sellingPrice ? (+form.sellingPrice - +form.cost) : null;

  // Per-network balance
  const walletKey = networkToWalletKey(form.network);
  const networkBalance = loadData[walletKey] ?? 0;
  const NETWORK_EMOJI = { smartTnt: "🔴", globeTm: "🔵", dito: "🟣" };
  const NETWORK_LABEL = { smartTnt: "Smart / TNT", globeTm: "Globe / TM", dito: "DITO" };

  const validate = () => {
    const e = {};
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.cost || isNaN(+form.cost) || +form.cost <= 0) e.cost = "Enter a valid cost";
    if (!form.sellingPrice || isNaN(+form.sellingPrice) || +form.sellingPrice <= 0) e.sellingPrice = "Enter a valid selling price";
    if (+form.cost > networkBalance) e.cost = `Insufficient ${NETWORK_LABEL[walletKey]} balance`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) { /* error shown by hook */ }
    setSaving(false);
  };

  const typeColors = { regular: "#16a34a", data: "var(--blue)", promo: "var(--purple)" };
  const activeColor = typeColors[form.type];

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 500 }}>
        <div className="ap-modal-head" style={{
          background: `linear-gradient(135deg,${form.type === "regular" ? "var(--green-lt)" : form.type === "data" ? "var(--blue-lt)" : "var(--purple-lt)"},var(--surf))`,
          borderBottom: `1px solid rgba(0,0,0,.07)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: form.type === "regular" ? "var(--green-lt)" : form.type === "data" ? "var(--blue-lt)" : "var(--purple-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              📶
            </div>
            <h3 style={{ color: activeColor }}>Record Load Transaction</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div className="ap-modal-body">
          {/* Type selector */}
          <div className="load-type-row">
            {LOAD_TYPES.map(({ key, label, sub, icon }) => (
              <button
                key={key}
                className={`load-type-btn ${key}${form.type === key ? " sel" : ""}`}
                onClick={() => set("type", key)}
              >
                <div className="load-type-icon">{icon}</div>
                <div className="load-type-lbl">{label}</div>
                <div className="load-type-sub">{sub}</div>
              </button>
            ))}
          </div>

          {/* Balance preview */}
          <div style={{
            background: "var(--green-lt)", borderRadius: "var(--rad)", padding: "12px 16px", marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: "1px solid rgba(22,163,74,.2)",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".05em" }}>
                {NETWORK_EMOJI[walletKey]} {NETWORK_LABEL[walletKey]} Balance
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#16a34a" }}>₱{fmt(networkBalance)}</div>
            </div>
            {form.cost && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em" }}>After</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: networkBalance - +form.cost < 0 ? "var(--red)" : "#16a34a" }}>
                  ₱{fmt(networkBalance - +form.cost)}
                </div>
              </div>
            )}
          </div>

          {/* Network selector */}
          <div className="ap-fg">
            <label className="ap-label">Network *</label>
            <select
              className="ap-select"
              value={form.network}
              onChange={(e) => set("network", e.target.value)}
              style={{ width: "100%" }}
            >
              {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Phone */}
          <div className="ap-fg">
            <label className="ap-label"><Phone size={12} style={{ display: "inline", marginRight: 4 }} />Phone Number *</label>
            <input
              className={`ap-input${errors.phone ? " err" : ""}`}
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="09XX XXX XXXX"
              autoFocus
            />
            {errors.phone && <div className="ap-ferr">{errors.phone}</div>}
          </div>

          {/* Cost & Selling Price */}
          <div className="ap-form-row">
            <div className="ap-fg">
              <label className="ap-label">Cost / Load Amount (₱) *</label>
              <input
                className={`ap-input${errors.cost ? " err" : ""}`}
                type="number" min="0"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
                placeholder="0"
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
              {errors.cost && <div className="ap-ferr">{errors.cost}</div>}
              <div className="ap-fhint">Halagang binayad mo sa load</div>
            </div>
            <div className="ap-fg">
              <label className="ap-label">Selling Price (₱) *</label>
              <input
                className={`ap-input${errors.sellingPrice ? " err" : ""}`}
                type="number" min="0"
                value={form.sellingPrice}
                onChange={(e) => set("sellingPrice", e.target.value)}
                placeholder="0"
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
              {errors.sellingPrice && <div className="ap-ferr">{errors.sellingPrice}</div>}
              <div className="ap-fhint">Halagang binayad ng customer</div>
            </div>
          </div>

          {/* Profit preview */}
          {profit !== null && (
            <div style={{
              background: profit >= 0 ? "var(--green-lt)" : "var(--red-lt)",
              borderRadius: "var(--rad)", padding: "10px 14px", marginBottom: 12,
              border: `1px solid ${profit >= 0 ? "rgba(0,184,122,.2)" : "rgba(239,68,68,.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: profit >= 0 ? "var(--green-dk)" : "var(--red-dk)" }}>
                {profit >= 0 ? "Profit" : "Loss"}
              </span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: profit >= 0 ? "var(--green-dk)" : "var(--red-dk)" }}>
                {profit >= 0 ? "+" : ""}₱{fmt(profit)}
              </span>
            </div>
          )}

          {/* Note (optional) */}
          <div className="ap-fg" style={{ marginBottom: 0 }}>
            <label className="ap-label">Note (optional)</label>
            <input
              className="ap-input"
              type="text"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. GoSurf50, GoTyme promo…"
            />
          </div>
        </div>

        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="ap-btn primary"
            onClick={handleSave}
            disabled={saving}
            style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", borderColor: "transparent" }}
          >
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
            Record Load
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  LOAD SERVICE TAB
// ─────────────────────────────────────────────
function LoadServiceTab({ loadData, loadTxns, loading, onAddTxn, onDeleteTxn, onEditTxn, onEditWallet, onReset }) {
  const [subTab, setSubTab] = useState("overview");
  const [deletingTxn, setDeletingTxn] = useState(null);
  const [deletePin, setDeletePin] = useState("");
  const [deletePinErr, setDeletePinErr] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetPinErr, setResetPinErr] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [histSearch, setHistSearch] = useState("");
  const [histDateFilter, setHistDateFilter] = useState("all");
  const [histTypeFilter, setHistTypeFilter] = useState("all");
  const PASSCODE = "101660";

  const totalSold = loadTxns.reduce((s, t) => s + t.sellingPrice, 0);
  const totalCost = loadTxns.reduce((s, t) => s + t.cost, 0);

  const handleDeleteConfirm = () => {
    if (deletePin === PASSCODE) {
      onDeleteTxn(deletingTxn);
      setDeletingTxn(null);
      setDeletePin("");
    } else {
      setDeletePinErr(true);
      setDeletePin("");
      setTimeout(() => setDeletePinErr(false), 1500);
    }
  };

  const handleResetConfirm = async () => {
    if (resetPin === PASSCODE) {
      setResetting(true);
      try { await onReset(); } catch (e) { /* handled */ }
      setResetting(false);
      setResetOpen(false);
      setResetPin("");
    } else {
      setResetPinErr(true);
      setResetPin("");
      setTimeout(() => setResetPinErr(false), 1500);
    }
  };

  if (loading) return (
    <div className="ap-loading">
      <Loader2 size={32} className="ap-spin" />
      <div className="ap-loading-txt">Loading Load Service data…</div>
    </div>
  );

  const TYPE_LABELS = { regular: "Regular Load", data: "Data Pack", promo: "Promo / Combo" };

  const filteredTxns = loadTxns.filter(t => {
    const matchDate = matchesDateFilter(t.createdAt, histDateFilter);
    const matchType = histTypeFilter === "all" || t.type === histTypeFilter;
    const q = histSearch.toLowerCase().trim();
    const matchQ = !q || t.phone?.toLowerCase().includes(q) || t.network?.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q);
    return matchDate && matchType && matchQ;
  });
  const filtTotalSold = filteredTxns.reduce((s, t) => s + t.sellingPrice, 0);
  const filtTotalProfit = filteredTxns.reduce((s, t) => s + t.profit, 0);

  const TxnRow = ({ txn }) => (
    <div className="load-txn">
      <div className={`load-txn-icon ${txn.type}`}>
        {txn.type === "regular" ? <Signal size={18} strokeWidth={2} />
          : txn.type === "data" ? <Zap size={18} strokeWidth={2} />
            : <SendHorizonal size={18} strokeWidth={2} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="load-txn-type">{TYPE_LABELS[txn.type] || txn.type}</div>
        <div className="load-txn-sub">
          <span style={{ fontWeight: 600 }}>{txn.network}</span>
          <span style={{ margin: "0 4px" }}>·</span>
          <Phone size={10} style={{ display: "inline", marginRight: 3 }} />{txn.phone}
          {txn.note ? <><span style={{ margin: "0 4px" }}>·</span>{txn.note}</> : null}
        </div>
      </div>
      <div className="load-txn-date">{fmtDate(txn.createdAt)}</div>
      <div className="load-txn-right">
        <div className="load-txn-amount">₱{fmt(txn.sellingPrice)}</div>
        <div className="load-txn-profit">+₱{fmt(txn.profit)} profit</div>
      </div>
      <div className="load-txn-actions">
        <button className="ap-btn ghost sm icon" title="Edit" style={{ color: "var(--blue)" }}
          onClick={() => setEditingTxn(txn)}>
          <Pencil size={14} strokeWidth={1.8} />
        </button>
        <button className="ap-btn ghost sm icon" title="Delete" style={{ color: "var(--red)" }}
          onClick={() => { setDeletingTxn(txn); setDeletePin(""); setDeletePinErr(false); }}>
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Header card */}
      <div className="load-header">
        <div className="load-header-left" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="load-header-logo">📶</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div className="load-header-label" style={{ fontSize: 10 }}>🔴 Smart / TNT</div>
              <div className="load-header-balance" style={{ fontSize: 22 }}>₱{fmt(loadData.smartTnt)}</div>
            </div>
            <div>
              <div className="load-header-label" style={{ fontSize: 10 }}>🔵 Globe / TM</div>
              <div className="load-header-balance" style={{ fontSize: 22 }}>₱{fmt(loadData.globeTm)}</div>
            </div>
            <div>
              <div className="load-header-label" style={{ fontSize: 10 }}>🟣 DITO</div>
              <div className="load-header-balance" style={{ fontSize: 22 }}>₱{fmt(loadData.dito)}</div>
            </div>
          </div>
        </div>
        <div className="load-header-right">
          <button className="load-edit-btn" onClick={onEditWallet}>
            <Pencil size={14} /> Edit Wallet
          </button>
          <button
            className="load-edit-btn"
            onClick={() => { setResetOpen(true); setResetPin(""); setResetPinErr(false); }}
            style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", border: "1px solid rgba(239,68,68,.35)", marginLeft: 6 }}
            title="Restart — clear all transactions (keeps balance)"
          >
            🔄 Restart
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid var(--bdr)", paddingBottom: 0 }}>
        {[{ key: "overview", label: "Overview", emoji: "📶" }, { key: "history", label: "History", emoji: "📋" }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            border: "none", background: "none",
            color: subTab === t.key ? "#16a34a" : "var(--ink3)",
            borderBottom: subTab === t.key ? "2px solid #16a34a" : "2px solid transparent",
            marginBottom: -2, transition: "all .15s", display: "flex", alignItems: "center", gap: 7,
          }}>
            <span>{t.emoji}</span> {t.label}
            {t.key === "history" && loadTxns.length > 0 && (
              <span style={{ background: "#16a34a", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{loadTxns.length}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === "overview" ? (
        <>
          {/* Stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
            <StatCard label="Total Transactions" value={loadTxns.length} color="blue" icon={Signal} sub="All load sales" />
            <StatCard label="Total Sold" value={`₱${fmt(totalSold)}`} color="green" icon={Zap} sub="Selling price total" />
            <StatCard label="Total Profit" value={`₱${fmt(loadData.totalProfit)}`} color="green" icon={SendHorizonal} sub="Net earnings" />
          </div>
          {/* Add button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="ap-btn primary" onClick={onAddTxn} style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", borderColor: "transparent" }}>
              <Plus size={15} /> New Load Sale
            </button>
          </div>
          {loadTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">📶</div>
              <div className="ap-empty-txt">Wala pang load transactions. I-click ang "New Load Sale" para magsimula.</div>
            </div>
          ) : (
            <div className="load-txn-list">
              {loadTxns.slice(0, 5).map((txn) => <TxnRow key={txn.id} txn={txn} />)}
              {loadTxns.length > 5 && (
                <div style={{ padding: "12px 20px", textAlign: "center" }}>
                  <button className="ap-btn sm" onClick={() => setSubTab("history")} style={{ color: "#16a34a" }}>
                    <History size={13} /> View all {loadTxns.length} transactions →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* History filtered stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <StatCard label="Transactions" value={filteredTxns.length} color="blue" icon={History} sub={DATE_FILTERS.find(f => f.key === histDateFilter)?.label} />
            <StatCard label="Total Sold" value={`₱${fmt(filtTotalSold)}`} color="green" icon={Zap} sub="Filtered period" />
            <StatCard label="Total Profit" value={`₱${fmt(filtTotalProfit)}`} color="green" icon={SendHorizonal} sub="Filtered period" />
          </div>
          {/* Filters */}
          <div className="ap-toolbar" style={{ marginBottom: 14 }}>
            <select className={`ap-select${histDateFilter !== "all" ? " on" : ""}`} value={histDateFilter} onChange={e => setHistDateFilter(e.target.value)}>
              {DATE_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <select className="ap-select" value={histTypeFilter} onChange={e => setHistTypeFilter(e.target.value)} style={{ minWidth: 140 }}>
              <option value="all">All Types</option>
              <option value="regular">Regular Load</option>
              <option value="data">Data Pack</option>
              <option value="promo">Promo / Combo</option>
            </select>
            <div className="ap-search-wrap">
              <span className="ap-search-icon"><Search size={16} strokeWidth={1.8} /></span>
              <input className="ap-search" placeholder="Search phone, network…" value={histSearch} onChange={e => setHistSearch(e.target.value)} />
            </div>
          </div>
          {filteredTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">📶</div>
              <div className="ap-empty-txt">{loadTxns.length === 0 ? "Wala pang transactions." : "Walang match sa filters."}</div>
            </div>
          ) : (
            <div className="load-txn-list">
              {filteredTxns.map((txn) => <TxnRow key={txn.id} txn={txn} />)}
            </div>
          )}
        </>
      )}

      {editingTxn && (
        <LoadEditTxnModal
          txn={editingTxn}
          loadData={loadData}
          onSave={(form) => onEditTxn(editingTxn, form)}
          onClose={() => setEditingTxn(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deletingTxn && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setDeletingTxn(null)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
              <div className="ap-confirm-title">Delete Load Transaction?</div>
              <div className="ap-confirm-msg">
                <strong>{deletingTxn.network} · {TYPE_LABELS[deletingTxn.type]}</strong><br />
                <span style={{ fontSize: 12, color: "var(--ink3)" }}>Phone: {deletingTxn.phone}</span><br />
                <span style={{ fontSize: 12, color: "var(--red)", display: "block", marginTop: 6 }}>This will reverse the balance and profit effects.</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="password" className={`ap-input${deletePinErr ? " err" : ""}`}
                  value={deletePin} onChange={(e) => setDeletePin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }} autoFocus maxLength={10} />
                {deletePinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setDeletingTxn(null)}>Cancel</button>
                <button className="ap-btn danger" onClick={handleDeleteConfirm}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {resetOpen && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setResetOpen(false)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon" style={{ background: "var(--red-lt)", color: "var(--red)" }}>🔄</div>
              <div className="ap-confirm-title">Restart Load Service?</div>
              <div className="ap-confirm-msg">
                Ang <strong>total profit</strong> ay ibabalik sa zero.<br />
                <span style={{ color: "var(--green-dk)", fontWeight: 700 }}>
                  Balanse: 🔴 ₱{fmt(loadData.smartTnt)} · 🔵 ₱{fmt(loadData.globeTm)} · 🟣 ₱{fmt(loadData.dito)} — mananatili.
                </span><br />
                <span style={{ fontSize: 12, color: "var(--green-dk)", display: "block", marginTop: 6 }}>✅ Ang lahat ng {loadTxns.length} transactions ay mananatili sa history — hindi mabubura.</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="password" className={`ap-input${resetPinErr ? " err" : ""}`}
                  value={resetPin} onChange={(e) => setResetPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }} autoFocus maxLength={10} />
                {resetPinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setResetOpen(false)} disabled={resetting}>Cancel</button>
                <button className="ap-btn danger" onClick={handleResetConfirm} disabled={resetting}>
                  {resetting ? <Loader2 size={14} className="ap-spin" /> : "🔄"} Restart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  PRINT SERVICE LOCK SCREEN
// ─────────────────────────────────────────────
function PrintLockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const PASSCODE = "101660";
  const MAX = PASSCODE.length;

  const press = (key) => {
    if (key === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= MAX) return;
    const next = pin + key;
    setPin(next);
    if (next.length === MAX) {
      setTimeout(() => {
        if (next === PASSCODE) { onUnlock(); }
        else {
          setShake(true); setErrMsg("Wrong passcode. Try again.");
          setTimeout(() => { setShake(false); setPin(""); setErrMsg(""); }, 900);
        }
      }, 120);
    }
  };

  return (
    <div className="print-lock">
      <div className="print-lock-card">
        <div className="print-lock-ring">🖨️</div>
        <div className="print-lock-title">Print Service is Locked</div>
        <div className="print-lock-sub">Enter your 6-digit passcode to access print service records.</div>
        <div className="ap-capital-pin-dots">
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} className={`ap-capital-pin-dot${pin.length > i ? (shake ? " err" : " filled") : ""}`} />
          ))}
        </div>
        <div className="ap-capital-pinpad">
          {PIN_KEYS.map(([digit, letters], idx) => {
            if (digit === null) return <div key={idx} />;
            return (
              <button key={idx} className={`ap-capital-pin-btn${digit === "⌫" ? " del" : ""}`} onClick={() => press(digit)}>
                <span>{digit}</span>
                {letters !== undefined && letters !== "" && <span className="ap-capital-pin-sub">{letters}</span>}
              </button>
            );
          })}
        </div>
        <div className="ap-capital-pin-err">{errMsg}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PRINT EDIT STATS MODAL
// ─────────────────────────────────────────────
function PrintEditStatsModal({ printData, onSave, onClose }) {
  const [totalRevenue, setTotalRevenue] = useState(String(printData.totalRevenue));
  const [totalProfit, setTotalProfit] = useState(String(printData.totalProfit));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [step, setStep] = useState("pin");
  const PASSCODE = "101660";

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const validate = () => {
    const e = {};
    if (totalRevenue === "" || isNaN(+totalRevenue) || +totalRevenue < 0) e.totalRevenue = "Enter a valid amount";
    if (totalProfit === "" || isNaN(+totalProfit)) e.totalProfit = "Enter a valid amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(Math.round(+totalRevenue), Math.round(+totalProfit));
    setSaving(false);
    onClose();
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 420 }}>
        <div className="ap-modal-head">
          <h3>🖨️ Edit Print Stats</h3>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>Enter passcode to edit print stats.</div>
            <input
              type="password"
              className={`ap-input${passErr ? " err" : ""}`}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode"
              style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
              maxLength={10}
              autoFocus
            />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Incorrect passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div className="ap-fg">
                <label className="ap-label">Total Revenue (₱)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                  <input
                    className={`ap-input${errors.totalRevenue ? " err" : ""}`}
                    type="number"
                    value={totalRevenue}
                    onChange={(e) => setTotalRevenue(e.target.value)}
                    style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--purple)" }}
                    autoFocus
                  />
                </div>
                {errors.totalRevenue && <div className="ap-ferr">{errors.totalRevenue}</div>}
              </div>
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Total Profit (₱)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                  <input
                    className={`ap-input${errors.totalProfit ? " err" : ""}`}
                    type="number"
                    value={totalProfit}
                    onChange={(e) => setTotalProfit(e.target.value)}
                    style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--green-dk)" }}
                  />
                </div>
                {errors.totalProfit && <div className="ap-ferr">{errors.totalProfit}</div>}
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PRINT ADD TRANSACTION MODAL
// ─────────────────────────────────────────────
const PRINT_SERVICES = {
  photocopy: {
    label: "Photocopy",
    emoji: "📋",
    subtypes: [
      { key: "long", label: "Long", price: 5, cost: 2 },
      { key: "short", label: "Short", price: 3, cost: 1.5 },
    ],
  },
  print: {
    label: "Print",
    emoji: "🖨️",
    subtypes: [
      { key: "bw_long", label: "B&W Long", price: 8, cost: 3 },
      { key: "bw_short", label: "B&W Short", price: 5, cost: 2 },
      { key: "colored_long", label: "Colored Long (Text)", price: 15, cost: 7 },
      { key: "colored_short", label: "Colored Short (Text)", price: 10, cost: 5 },
      { key: "pic_long", label: "w/ Picture Long", price: 25, cost: 12 },
      { key: "pic_short", label: "w/ Picture Short", price: 20, cost: 10 },
    ],
  },
  laminate: {
    label: "Laminate",
    emoji: "🪪",
    subtypes: [
      { key: "wallet", label: "Wallet Size", price: 20, cost: 8 },
      { key: "id", label: "ID Size", price: 30, cost: 12 },
      { key: "4r", label: "4R", price: 30, cost: 12 },
      { key: "short", label: "Short Bond Paper", price: 70, cost: 30 },
      { key: "a4", label: "A4 Bond Paper", price: 80, cost: 35 },
    ],
  },
  scan: {
    label: "Scan",
    emoji: "📠",
    subtypes: [
      { key: "scan_page", label: "Per Page", price: 10, cost: 3 },
    ],
  },
};

function PrintEditTxnModal({ txn, printData, onSave, onClose }) {
  const [step, setStep] = useState("pin");
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [form, setForm] = useState({
    type: txn.type, subtype: txn.subtype, qty: String(txn.qty),
    sellingPrice: String(txn.sellingPrice), cost: String(txn.cost), note: txn.note || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const PASSCODE = "101660";

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const selectSubtype = (type, subtypeKey) => {
    const sub = PRINT_SERVICES[type]?.subtypes.find(s => s.key === subtypeKey);
    setForm(f => ({ ...f, type, subtype: subtypeKey, sellingPrice: sub ? String(sub.price) : f.sellingPrice, cost: sub ? String(sub.cost) : f.cost }));
  };
  const selectType = (type) => {
    const firstSub = PRINT_SERVICES[type]?.subtypes[0];
    setForm(f => ({ ...f, type, subtype: firstSub?.key || "", sellingPrice: firstSub ? String(firstSub.price) : f.sellingPrice, cost: firstSub ? String(firstSub.cost) : f.cost }));
  };

  const qty = Math.max(1, parseInt(form.qty) || 1);
  const totalAmount = (+form.sellingPrice || 0) * qty;
  const totalCost = (+form.cost || 0) * qty;
  const profit = totalAmount - totalCost;

  const validate = () => {
    const e = {};
    if (!form.sellingPrice || isNaN(+form.sellingPrice) || +form.sellingPrice <= 0) e.sellingPrice = "Enter selling price";
    if (!form.cost || isNaN(+form.cost) || +form.cost < 0) e.cost = "Enter cost";
    if (!form.qty || parseInt(form.qty) < 1) e.qty = "Enter quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave({ ...form, qty: String(qty) }); onClose(); }
    catch (e) { /* handled */ }
    setSaving(false);
  };

  const svc = PRINT_SERVICES[form.type];

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 500 }}>
        <div className="ap-modal-head" style={{ background: "linear-gradient(135deg,var(--purple-lt),var(--surf))", borderBottom: "1px solid rgba(139,92,246,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--purple-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✏️</div>
            <h3 style={{ color: "var(--purple-dk)" }}>Edit Print / Laminate</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>I-enter ang passcode para i-edit ang transaction.</div>
            <input type="password" className={`ap-input${passErr ? " err" : ""}`}
              value={passcode} onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode" style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
              maxLength={10} autoFocus />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Mali ang passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div className="ap-fg">
                <label className="ap-label">Service Type</label>
                <div className="print-type-row">
                  {Object.entries(PRINT_SERVICES).map(([key, svcDef]) => (
                    <button key={key} className={`print-type-btn ${key}${form.type === key ? " sel" : ""}`} onClick={() => selectType(key)}>
                      <div className="print-type-icon">{svcDef.emoji}</div>
                      <div className="print-type-lbl">{svcDef.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="ap-fg">
                <label className="ap-label">Subtype / Size</label>
                <select className="ap-select" value={form.subtype} onChange={(e) => selectSubtype(form.type, e.target.value)} style={{ width: "100%" }}>
                  {svc.subtypes.map(s => <option key={s.key} value={s.key}>{s.label} — ₱{s.price}</option>)}
                </select>
              </div>
              <div className="ap-form-row">
                <div className="ap-fg">
                  <label className="ap-label">Qty / Pages *</label>
                  <input className={`ap-input${errors.qty ? " err" : ""}`} type="number" min="1"
                    value={form.qty} onChange={(e) => set("qty", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} autoFocus />
                  {errors.qty && <div className="ap-ferr">{errors.qty}</div>}
                </div>
                <div className="ap-fg">
                  <label className="ap-label">Selling Price (₱) / pc *</label>
                  <input className={`ap-input${errors.sellingPrice ? " err" : ""}`} type="number" min="0"
                    value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  {errors.sellingPrice && <div className="ap-ferr">{errors.sellingPrice}</div>}
                </div>
                <div className="ap-fg">
                  <label className="ap-label">Cost (₱) / pc *</label>
                  <input className={`ap-input${errors.cost ? " err" : ""}`} type="number" min="0"
                    value={form.cost} onChange={(e) => set("cost", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  {errors.cost && <div className="ap-ferr">{errors.cost}</div>}
                </div>
              </div>
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Note (optional)</label>
                <input className="ap-input" type="text" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. thesis, resume…" />
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />} Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PrintAddTxnModal({ printData, onSave, onClose }) {
  const [form, setForm] = useState({
    type: "photocopy",
    subtype: "long",
    qty: "1",
    sellingPrice: "",
    cost: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-fill price/cost when subtype changes
  const selectSubtype = (type, subtypeKey) => {
    const sub = PRINT_SERVICES[type]?.subtypes.find(s => s.key === subtypeKey);
    setForm(f => ({
      ...f,
      type,
      subtype: subtypeKey,
      sellingPrice: sub ? String(sub.price) : "",
      cost: sub ? String(sub.cost) : "",
    }));
  };

  // When type changes, auto-select first subtype
  const selectType = (type) => {
    const firstSub = PRINT_SERVICES[type]?.subtypes[0];
    setForm(f => ({
      ...f,
      type,
      subtype: firstSub?.key || "",
      sellingPrice: firstSub ? String(firstSub.price) : "",
      cost: firstSub ? String(firstSub.cost) : "",
    }));
  };

  // Init with first subtype prices
  useEffect(() => {
    const firstSub = PRINT_SERVICES["photocopy"].subtypes[0];
    if (firstSub) setForm(f => ({ ...f, sellingPrice: String(firstSub.price), cost: String(firstSub.cost) }));
  }, []);

  const qty = Math.max(1, parseInt(form.qty) || 1);
  const totalAmount = (+form.sellingPrice || 0) * qty;
  const totalCost = (+form.cost || 0) * qty;
  const profit = totalAmount - totalCost;

  const validate = () => {
    const e = {};
    if (!form.sellingPrice || isNaN(+form.sellingPrice) || +form.sellingPrice <= 0) e.sellingPrice = "Enter selling price";
    if (!form.cost || isNaN(+form.cost) || +form.cost < 0) e.cost = "Enter cost";
    if (!form.qty || parseInt(form.qty) < 1) e.qty = "Enter quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ ...form, qty: String(qty) });
      onClose();
    } catch (e) { /* handled */ }
    setSaving(false);
  };

  const svc = PRINT_SERVICES[form.type];

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 500 }}>
        <div className="ap-modal-head" style={{ background: "linear-gradient(135deg,var(--purple-lt),var(--surf))", borderBottom: "1px solid rgba(139,92,246,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--purple-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖨️</div>
            <h3 style={{ color: "var(--purple-dk)" }}>Record Print / Laminate</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div className="ap-modal-body">
          {/* Service type */}
          <div className="ap-fg">
            <label className="ap-label">Service Type</label>
            <div className="print-type-row">
              {Object.entries(PRINT_SERVICES).map(([key, svcDef]) => (
                <button
                  key={key}
                  className={`print-type-btn ${key}${form.type === key ? " sel" : ""}`}
                  onClick={() => selectType(key)}
                >
                  <div className="print-type-icon">{svcDef.emoji}</div>
                  <div className="print-type-lbl">{svcDef.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subtype */}
          <div className="ap-fg">
            <label className="ap-label">Subtype / Size</label>
            <select
              className="ap-select"
              value={form.subtype}
              onChange={(e) => selectSubtype(form.type, e.target.value)}
              style={{ width: "100%" }}
            >
              {svc.subtypes.map(s => (
                <option key={s.key} value={s.key}>{s.label} — ₱{s.price}</option>
              ))}
            </select>
          </div>

          {/* Qty + Price + Cost */}
          <div className="ap-form-row">
            <div className="ap-fg">
              <label className="ap-label">Qty / Pages *</label>
              <input
                className={`ap-input${errors.qty ? " err" : ""}`}
                type="number" min="1"
                value={form.qty}
                onChange={(e) => set("qty", e.target.value)}
                autoFocus
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
              {errors.qty && <div className="ap-ferr">{errors.qty}</div>}
            </div>
            <div className="ap-fg">
              <label className="ap-label">Selling Price (₱) / pc *</label>
              <input
                className={`ap-input${errors.sellingPrice ? " err" : ""}`}
                type="number" min="0"
                value={form.sellingPrice}
                onChange={(e) => set("sellingPrice", e.target.value)}
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
              {errors.sellingPrice && <div className="ap-ferr">{errors.sellingPrice}</div>}
            </div>
            <div className="ap-fg">
              <label className="ap-label">Cost (₱) / pc *</label>
              <input
                className={`ap-input${errors.cost ? " err" : ""}`}
                type="number" min="0"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
              {errors.cost && <div className="ap-ferr">{errors.cost}</div>}
              <div className="ap-fhint">Gastos sa papel/tinta</div>
            </div>
          </div>

          {/* Note */}
          <div className="ap-fg" style={{ marginBottom: 0 }}>
            <label className="ap-label">Note (optional)</label>
            <input
              className="ap-input"
              type="text"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. thesis, resume, ID photo…"
            />
          </div>
        </div>

        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="ap-btn primary"
            onClick={handleSave}
            disabled={saving}
            style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}
          >
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
            Record Service
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PRINT SERVICE TAB
// ─────────────────────────────────────────────
function PrintServiceTab({ printData, printTxns, loading, onAddTxn, onDeleteTxn, onEditTxn, onEditStats, onReset }) {
  const [subTab, setSubTab] = useState("overview");
  const [deletingTxn, setDeletingTxn] = useState(null);
  const [deletePin, setDeletePin] = useState("");
  const [deletePinErr, setDeletePinErr] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetPinErr, setResetPinErr] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [histSearch, setHistSearch] = useState("");
  const [histDateFilter, setHistDateFilter] = useState("all");
  const [histTypeFilter, setHistTypeFilter] = useState("all");
  const PASSCODE = "101660";

  const totalTxns = printTxns.length;

  const handleDeleteConfirm = () => {
    if (deletePin === PASSCODE) {
      onDeleteTxn(deletingTxn);
      setDeletingTxn(null);
      setDeletePin("");
    } else {
      setDeletePinErr(true);
      setDeletePin("");
      setTimeout(() => setDeletePinErr(false), 1500);
    }
  };

  const handleResetConfirm = async () => {
    if (resetPin === PASSCODE) {
      setResetting(true);
      try { await onReset(); } catch (e) { /* handled */ }
      setResetting(false);
      setResetOpen(false);
      setResetPin("");
    } else {
      setResetPinErr(true);
      setResetPin("");
      setTimeout(() => setResetPinErr(false), 1500);
    }
  };

  if (loading) return (
    <div className="ap-loading">
      <Loader2 size={32} className="ap-spin" />
      <div className="ap-loading-txt">Loading Print Service data…</div>
    </div>
  );

  const TYPE_LABELS = { photocopy: "Photocopy", print: "Print", laminate: "Laminate", scan: "Scan" };
  const TYPE_EMOJI = { photocopy: "📋", print: "🖨️", laminate: "🪪", scan: "📠" };

  const filteredTxns = printTxns.filter(t => {
    const matchDate = matchesDateFilter(t.createdAt, histDateFilter);
    const matchType = histTypeFilter === "all" || t.type === histTypeFilter;
    const q = histSearch.toLowerCase().trim();
    const matchQ = !q || t.type?.toLowerCase().includes(q) || t.subtype?.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q);
    return matchDate && matchType && matchQ;
  });
  const filtTotalRevenue = filteredTxns.reduce((s, t) => s + t.totalAmount, 0);
  const filtTotalProfit = filteredTxns.reduce((s, t) => s + t.profit, 0);

  const TxnRow = ({ txn }) => (
    <div className="print-txn">
      <div className={`print-txn-icon ${txn.type}`}>
        {txn.type === "photocopy" ? <span style={{ fontSize: 18 }}>📋</span>
          : txn.type === "print" ? <Printer size={18} strokeWidth={2} />
            : txn.type === "laminate" ? <span style={{ fontSize: 18 }}>🪪</span>
              : <span style={{ fontSize: 18 }}>📠</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="print-txn-type">{TYPE_LABELS[txn.type] || txn.type}</div>
        <div className="print-txn-sub">
          {txn.subtype && <span style={{ fontWeight: 600 }}>{txn.subtype.replace(/_/g, " ")}</span>}
          <span style={{ margin: "0 4px" }}>·</span>
          <span>{txn.qty} pc{txn.qty > 1 ? "s" : ""}</span>
          {txn.note ? <><span style={{ margin: "0 4px" }}>·</span>{txn.note}</> : null}
        </div>
      </div>
      <div className="print-txn-date">{fmtDate(txn.createdAt)}</div>
      <div className="print-txn-right">
        <div className="print-txn-amount">₱{fmt(txn.totalAmount)}</div>
        <div className="print-txn-profit">+₱{fmt(txn.profit)} profit</div>
      </div>
      <div className="print-txn-actions">
        <button
          className="ap-btn ghost sm icon"
          title="Edit"
          style={{ color: "var(--blue)" }}
          onClick={() => setEditingTxn(txn)}
        >
          <Pencil size={14} strokeWidth={1.8} />
        </button>
        <button
          className="ap-btn ghost sm icon"
          title="Delete"
          style={{ color: "var(--red)" }}
          onClick={() => { setDeletingTxn(txn); setDeletePin(""); setDeletePinErr(false); }}
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          <div className="print-header-logo">🖨️</div>
          <div>
            <div className="print-header-label">Total Revenue</div>
            <div className="print-header-balance">₱{fmt(printData.totalRevenue)}</div>
          </div>
        </div>
        <div className="print-header-right">
          <button className="print-edit-btn" onClick={onEditStats}>
            <Pencil size={14} /> Edit Stats
          </button>
          <button
            className="print-edit-btn"
            onClick={() => { setResetOpen(true); setResetPin(""); setResetPinErr(false); }}
            style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", border: "1px solid rgba(239,68,68,.35)", marginLeft: 6 }}
            title="Restart — clear all transactions and stats"
          >
            🔄 Restart
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid var(--bdr)", paddingBottom: 0 }}>
        {[{ key: "overview", label: "Overview", emoji: "🖨️" }, { key: "history", label: "Sale History", emoji: "📋" }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            border: "none", background: "none",
            color: subTab === t.key ? "var(--purple-dk)" : "var(--ink3)",
            borderBottom: subTab === t.key ? "2px solid var(--purple)" : "2px solid transparent",
            marginBottom: -2, transition: "all .15s", display: "flex", alignItems: "center", gap: 7,
          }}>
            <span>{t.emoji}</span> {t.label}
            {t.key === "history" && printTxns.length > 0 && (
              <span style={{ background: "var(--purple)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{printTxns.length}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === "overview" ? (
        <>
          {/* Stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
            <StatCard label="Total Transactions" value={totalTxns} color="purple" icon={Printer} sub="All print/laminate jobs" />
            <StatCard label="Total Revenue" value={`₱${fmt(printData.totalRevenue)}`} color="blue" icon={BarChart3} sub="Gross income" />
            <StatCard label="Total Profit" value={`₱${fmt(printData.totalProfit)}`} color="green" icon={CheckCircle} sub="Net earnings" />
          </div>

          {/* Note about capital */}
          <div style={{
            background: "var(--purple-lt)", border: "1px solid rgba(139,92,246,.2)",
            borderRadius: "var(--rad)", padding: "12px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--purple-dk)",
          }}>
            <Info size={15} strokeWidth={2} />
            <span>Ang kita dito ay <strong>nire-record sa Capital</strong> bilang income para sa visibility, pero <strong>hindi ito nagdadagdag</strong> sa Capital balance.</span>
          </div>

          {/* Add button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="ap-btn primary" onClick={onAddTxn} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}>
              <Plus size={15} /> New Service
            </button>
          </div>

          {/* Recent transactions preview */}
          {printTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">🖨️</div>
              <div className="ap-empty-txt">Wala pang print/laminate transactions. I-click ang "New Service" para magsimula.</div>
            </div>
          ) : (
            <div className="print-txn-list">
              {printTxns.slice(0, 5).map((txn) => <TxnRow key={txn.id} txn={txn} />)}
              {printTxns.length > 5 && (
                <div style={{ padding: "12px 20px", textAlign: "center" }}>
                  <button className="ap-btn sm" onClick={() => setSubTab("history")} style={{ color: "var(--purple-dk)" }}>
                    <History size={13} /> View all {printTxns.length} transactions →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* History filtered stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <StatCard label="Transactions" value={filteredTxns.length} color="purple" icon={History} sub={DATE_FILTERS.find(f => f.key === histDateFilter)?.label} />
            <StatCard label="Total Revenue" value={`₱${fmt(filtTotalRevenue)}`} color="blue" icon={BarChart3} sub="Filtered period" />
            <StatCard label="Total Profit" value={`₱${fmt(filtTotalProfit)}`} color="green" icon={CheckCircle} sub="Filtered period" />
          </div>

          {/* Filters */}
          <div className="ap-toolbar" style={{ marginBottom: 14 }}>
            <select className={`ap-select${histDateFilter !== "all" ? " on" : ""}`} value={histDateFilter} onChange={e => setHistDateFilter(e.target.value)}>
              {DATE_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <select className="ap-select" value={histTypeFilter} onChange={e => setHistTypeFilter(e.target.value)} style={{ minWidth: 140 }}>
              <option value="all">All Types</option>
              <option value="photocopy">Photocopy</option>
              <option value="print">Print</option>
              <option value="laminate">Laminate</option>
              <option value="scan">Scan</option>
            </select>
            <div className="ap-search-wrap">
              <Search size={15} className="ap-search-icon" />
              <input className="ap-search" placeholder="Search note, subtype…" value={histSearch} onChange={e => setHistSearch(e.target.value)} />
            </div>
          </div>

          {/* Add button in history tab */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="ap-btn primary" onClick={onAddTxn} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}>
              <Plus size={15} /> New Service
            </button>
          </div>

          {filteredTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">🔍</div>
              <div className="ap-empty-txt">Walang transactions na nahanap para sa filter na ito.</div>
            </div>
          ) : (
            <div className="print-txn-list">
              {filteredTxns.map((txn) => <TxnRow key={txn.id} txn={txn} />)}
            </div>
          )}
        </>
      )}

      {editingTxn && (
        <PrintEditTxnModal
          txn={editingTxn}
          printData={printData}
          onSave={(form) => onEditTxn(editingTxn, form)}
          onClose={() => setEditingTxn(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deletingTxn && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setDeletingTxn(null)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
              <div className="ap-confirm-title">Delete Print Transaction?</div>
              <div className="ap-confirm-msg">
                <strong>{TYPE_LABELS[deletingTxn.type]} · {deletingTxn.subtype?.replace(/_/g, " ")}</strong><br />
                <span style={{ fontSize: 12, color: "var(--ink3)" }}>Qty: {deletingTxn.qty} · ₱{fmt(deletingTxn.totalAmount)}</span><br />
                <span style={{ fontSize: 12, color: "var(--red)", display: "block", marginTop: 6 }}>
                  Ire-reverse ang revenue at profit.
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="password"
                  className={`ap-input${deletePinErr ? " err" : ""}`}
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }}
                  autoFocus
                  maxLength={10}
                />
                {deletePinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setDeletingTxn(null)}>Cancel</button>
                <button className="ap-btn danger" onClick={handleDeleteConfirm}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {resetOpen && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setResetOpen(false)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon" style={{ background: "var(--red-lt)", color: "var(--red)" }}>🔄</div>
              <div className="ap-confirm-title">Restart Print Service?</div>
              <div className="ap-confirm-msg">
                Ang <strong>total revenue</strong> at <strong>total profit</strong> ay ibabalik sa zero.<br />
                <span style={{ fontSize: 12, color: "var(--green-dk)", display: "block", marginTop: 6 }}>✅ Ang lahat ng {printTxns.length} transactions ay mananatili sa history — hindi mabubura.</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="password" className={`ap-input${resetPinErr ? " err" : ""}`}
                  value={resetPin} onChange={(e) => setResetPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }} autoFocus maxLength={10} />
                {resetPinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setResetOpen(false)} disabled={resetting}>Cancel</button>
                <button className="ap-btn danger" onClick={handleResetConfirm} disabled={resetting}>
                  {resetting ? <Loader2 size={14} className="ap-spin" /> : "🔄"} Restart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




// ─────────────────────────────────────────────
//  SALMON LOCK SCREEN
// ─────────────────────────────────────────────
function SalmonLockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const PASSCODE = "101660";
  const MAX = PASSCODE.length;

  const press = (key) => {
    if (key === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= MAX) return;
    const next = pin + key;
    setPin(next);
    if (next.length === MAX) {
      setTimeout(() => {
        if (next === PASSCODE) { onUnlock(); }
        else {
          setShake(true); setErrMsg("Wrong passcode. Try again.");
          setTimeout(() => { setShake(false); setPin(""); setErrMsg(""); }, 900);
        }
      }, 120);
    }
  };

  return (
    <div className="salmon-lock">
      <div className="salmon-lock-card">
        <div className="salmon-lock-ring">🏦</div>
        <div className="salmon-lock-title">Salmon Service is Locked</div>
        <div className="salmon-lock-sub">Enter your 6-digit passcode to access Salmon payment records.</div>
        <div className="ap-capital-pin-dots">
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} className={`ap-capital-pin-dot${pin.length > i ? (shake ? " err" : " filled") : ""}`} />
          ))}
        </div>
        <div className="ap-capital-pinpad">
          {PIN_KEYS.map(([digit, letters], idx) => {
            if (digit === null) return <div key={idx} />;
            return (
              <button key={idx} className={`ap-capital-pin-btn${digit === "⌫" ? " del" : ""}`} onClick={() => press(digit)}>
                <span>{digit}</span>
                {letters !== undefined && letters !== "" && <span className="ap-capital-pin-sub">{letters}</span>}
              </button>
            );
          })}
        </div>
        <div className="ap-capital-pin-err">{errMsg}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SALMON EDIT STATS MODAL
// ─────────────────────────────────────────────
function SalmonEditStatsModal({ salmonData, onSave, onClose }) {
  const [fund, setFund] = useState(String(salmonData.fund));
  const [totalFees, setTotalFees] = useState(String(salmonData.totalFees));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [step, setStep] = useState("pin");
  const PASSCODE = "101660";

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const validate = () => {
    const e = {};
    if (fund === "" || isNaN(+fund) || +fund < 0) e.fund = "Enter a valid amount";
    if (totalFees === "" || isNaN(+totalFees) || +totalFees < 0) e.totalFees = "Enter a valid amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(Math.round(+fund), Math.round(+totalFees));
    setSaving(false);
    onClose();
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 420 }}>
        <div className="ap-modal-head" style={{ background: "linear-gradient(135deg,#fff0e8,var(--surf))", borderBottom: "1px solid rgba(224,92,0,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>
            <h3 style={{ color: "#e05c00" }}>Edit Salmon Stats</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>Enter passcode to edit Salmon stats.</div>
            <input type="password" className={`ap-input${passErr ? " err" : ""}`} value={passcode}
              onChange={(e) => setPasscode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode" style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }} maxLength={10} autoFocus />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Incorrect passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div className="ap-fg">
                <label className="ap-label">Salmon Fund — Collected from Customers (₱)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                  <input className={`ap-input${errors.fund ? " err" : ""}`} type="number" value={fund}
                    onChange={(e) => setFund(e.target.value)}
                    style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#e05c00" }} autoFocus />
                </div>
                {errors.fund && <div className="ap-ferr">{errors.fund}</div>}
              </div>
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Total Fees Earned — 2% charges (₱)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none" }}>₱</span>
                  <input className={`ap-input${errors.totalFees ? " err" : ""}`} type="number" value={totalFees}
                    onChange={(e) => setTotalFees(e.target.value)}
                    style={{ paddingLeft: 28, fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--green-dk)" }} />
                </div>
                {errors.totalFees && <div className="ap-ferr">{errors.totalFees}</div>}
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving}
                style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />} Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SALMON ADD TRANSACTION MODAL
// ─────────────────────────────────────────────
function SalmonEditTxnModal({ txn, salmonData, onSave, onClose }) {
  const [step, setStep] = useState("pin");
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [form, setForm] = useState({
    billerType: txn.billerType || "salmon",
    customerName: txn.customerName || "",
    utangAmount: String(txn.utangAmount),
    amountPaid: String(txn.amountPaid),
    feeRate: String(txn.feeRate || 2),
    note: txn.note || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const PASSCODE = "101660";

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const amountPaid = +form.amountPaid || 0;
  const feeRate = Math.max(0, +form.feeRate || 2);
  const fee = Math.round(amountPaid * (feeRate / 100));
  const billerLabel = form.billerType === "homecredit" ? "Home Credit" : "Salmon";

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = "Ilagay ang pangalan ng customer";
    if (!form.utangAmount || isNaN(+form.utangAmount) || +form.utangAmount <= 0) e.utangAmount = `Ilagay ang buong utang sa ${billerLabel}`;
    if (!form.amountPaid || isNaN(+form.amountPaid) || +form.amountPaid <= 0) e.amountPaid = "Ilagay ang binayad ng customer";
    if (isNaN(feeRate) || feeRate < 0) e.feeRate = "Invalid fee rate";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { /* handled by hook */ }
    setSaving(false);
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 500 }}>
        <div className="ap-modal-head" style={{ background: "linear-gradient(135deg,#fff0e8,var(--surf))", borderBottom: "1px solid rgba(224,92,0,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✏️</div>
            <h3 style={{ color: "#e05c00" }}>Edit Payment Record</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {step === "pin" ? (
          <div className="ap-modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 16 }}>I-enter ang passcode para i-edit ang transaction.</div>
            <input type="password" className={`ap-input${passErr ? " err" : ""}`}
              value={passcode} onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode" style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
              maxLength={10} autoFocus />
            {passErr && <div className="ap-ferr" style={{ marginTop: 8 }}>Mali ang passcode.</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}><Check size={15} /> Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div className="ap-fg">
                <label className="ap-label">Biller / Creditor</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
                  {[
                    { key: "salmon", label: "Salmon", color: "#e05c00", bg: "#fff0e8", border: "rgba(224,92,0,.35)" },
                    { key: "homecredit", label: "Home Credit", color: "var(--purple-dk)", bg: "var(--purple-lt)", border: "rgba(139,92,246,.35)" },
                  ].map((b) => {
                    const sel = form.billerType === b.key;
                    return (
                      <button key={b.key} onClick={() => set("billerType", b.key)} style={{
                        padding: "14px 12px", borderRadius: 12, border: `2px solid ${sel ? b.border : "var(--bdr2)"}`,
                        background: sel ? b.bg : "var(--surf2)", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
                      }}>
                        <span style={{ fontSize: 22 }}>🏦</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: sel ? b.color : "var(--ink2)" }}>{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="ap-fg">
                <label className="ap-label">Pangalan ng Customer *</label>
                <input className={`ap-input${errors.customerName ? " err" : ""}`} type="text"
                  value={form.customerName} onChange={(e) => set("customerName", e.target.value)}
                  placeholder="e.g. Juan dela Cruz" autoFocus />
                {errors.customerName && <div className="ap-ferr">{errors.customerName}</div>}
              </div>
              <div className="ap-form-row">
                <div className="ap-fg">
                  <label className="ap-label">Buong Utang sa {billerLabel} (₱) *</label>
                  <input className={`ap-input${errors.utangAmount ? " err" : ""}`} type="number" min="0"
                    value={form.utangAmount} onChange={(e) => set("utangAmount", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  {errors.utangAmount && <div className="ap-ferr">{errors.utangAmount}</div>}
                </div>
                <div className="ap-fg">
                  <label className="ap-label">Binayad ng Customer (₱) *</label>
                  <input className={`ap-input${errors.amountPaid ? " err" : ""}`} type="number" min="0"
                    value={form.amountPaid} onChange={(e) => set("amountPaid", e.target.value)}
                    style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  {errors.amountPaid && <div className="ap-ferr">{errors.amountPaid}</div>}
                </div>
              </div>
              <div className="ap-fg">
                <label className="ap-label">Fee Rate (%)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input className={`ap-input${errors.feeRate ? " err" : ""}`} type="number" min="0" max="100" step="0.5"
                    value={form.feeRate} onChange={(e) => set("feeRate", e.target.value)}
                    style={{ width: 100, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
                  <span style={{ fontSize: 13, color: "var(--ink3)" }}>% — Fee: ₱{fmt(fee)}</span>
                </div>
                {errors.feeRate && <div className="ap-ferr">{errors.feeRate}</div>}
              </div>
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Note (optional)</label>
                <input className="ap-input" type="text" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. partial payment…" />
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving}
                style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />} Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SalmonAddTxnModal({ salmonData, onSave, onClose }) {
  const [form, setForm] = useState({ billerType: "salmon", customerName: "", utangAmount: "", amountPaid: "", feeRate: "2", note: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const amountPaid = +form.amountPaid || 0;
  const feeRate = Math.max(0, +form.feeRate || 2);
  const fee = Math.round(amountPaid * (feeRate / 100));
  const totalToPaySalmon = amountPaid; // we forward exactly what customer paid

  const billerLabel = form.billerType === "homecredit" ? "Home Credit" : "Salmon";
  const billerEmoji = form.billerType === "homecredit" ? "🏦" : "🏦";
  const billerColor = form.billerType === "homecredit" ? "var(--purple-dk)" : "#e05c00";

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = "Ilagay ang pangalan ng customer";
    if (!form.utangAmount || isNaN(+form.utangAmount) || +form.utangAmount <= 0) e.utangAmount = `Ilagay ang buong utang sa ${billerLabel}`;
    if (!form.amountPaid || isNaN(+form.amountPaid) || +form.amountPaid <= 0) e.amountPaid = "Ilagay ang binayad ng customer";
    if (isNaN(feeRate) || feeRate < 0) e.feeRate = "Invalid fee rate";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { /* handled by hook */ }
    setSaving(false);
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 500 }}>
        <div className="ap-modal-head" style={{ background: "linear-gradient(135deg,#fff0e8,var(--surf))", borderBottom: "1px solid rgba(224,92,0,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>
            <h3 style={{ color: "#e05c00" }}>Record Payment</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div className="ap-modal-body">
          {/* Biller type selector */}
          <div className="ap-fg">
            <label className="ap-label">Biller / Creditor</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
              {[
                { key: "salmon", label: "Salmon", emoji: "🏦", color: "#e05c00", bg: "#fff0e8", border: "rgba(224,92,0,.35)" },
                { key: "homecredit", label: "Home Credit", emoji: "🏦", color: "var(--purple-dk)", bg: "var(--purple-lt)", border: "rgba(139,92,246,.35)" },
              ].map((b) => {
                const sel = form.billerType === b.key;
                return (
                  <button key={b.key} onClick={() => set("billerType", b.key)} style={{
                    padding: "14px 12px", borderRadius: 12, border: `2px solid ${sel ? b.border : "var(--bdr2)"}`,
                    background: sel ? b.bg : "var(--surf2)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
                    boxShadow: sel ? `0 0 0 3px ${b.border}40` : "none",
                  }}>
                    <span style={{ fontSize: 22 }}>{b.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: sel ? b.color : "var(--ink2)" }}>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* How it works explainer */}
          <div style={{
            background: "#fff0e8", border: "1px solid rgba(224,92,0,.2)",
            borderRadius: "var(--rad)", padding: "12px 14px", marginBottom: 18,
            fontSize: 13, color: "#a34400", lineHeight: 1.6,
          }}>
            <strong>🏦 Paano gumagana:</strong> Ang customer ay may utang kay <strong>{billerLabel}</strong>. Nagbabayad sila sa amin, tapos kami ang nagbabayad sa {billerLabel} via bank/bills payment. Kumikita tayo ng <strong>{feeRate}% fee</strong> sa bawat bayad.
          </div>

          {/* Customer name */}
          <div className="ap-fg">
            <label className="ap-label">Pangalan ng Customer *</label>
            <input className={`ap-input${errors.customerName ? " err" : ""}`} type="text"
              value={form.customerName} onChange={(e) => set("customerName", e.target.value)}
              placeholder="e.g. Juan dela Cruz" autoFocus />
            {errors.customerName && <div className="ap-ferr">{errors.customerName}</div>}
          </div>

          {/* Utang + Amount paid */}
          <div className="ap-form-row">
            <div className="ap-fg">
              <label className="ap-label">Buong Utang sa {billerLabel} (₱) *</label>
              <input className={`ap-input${errors.utangAmount ? " err" : ""}`} type="number" min="0"
                value={form.utangAmount} onChange={(e) => set("utangAmount", e.target.value)}
                placeholder="0" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
              {errors.utangAmount && <div className="ap-ferr">{errors.utangAmount}</div>}
              <div className="ap-fhint">Kabuuang balance ng customer kay {billerLabel}</div>
            </div>
            <div className="ap-fg">
              <label className="ap-label">Binayad ng Customer sa Amin (₱) *</label>
              <input className={`ap-input${errors.amountPaid ? " err" : ""}`} type="number" min="0"
                value={form.amountPaid} onChange={(e) => set("amountPaid", e.target.value)}
                placeholder="0" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
              {errors.amountPaid && <div className="ap-ferr">{errors.amountPaid}</div>}
              <div className="ap-fhint">Ito ang ibibigay natin sa Salmon</div>
            </div>
          </div>

          {/* Fee rate */}
          <div className="ap-fg">
            <label className="ap-label">Fee Rate (%)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input className={`ap-input${errors.feeRate ? " err" : ""}`} type="number" min="0" max="100" step="0.5"
                value={form.feeRate} onChange={(e) => set("feeRate", e.target.value)}
                style={{ width: 100, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }} />
              <span style={{ fontSize: 13, color: "var(--ink3)" }}>% ng binayad ng customer</span>
            </div>
            {errors.feeRate && <div className="ap-ferr">{errors.feeRate}</div>}
          </div>

          {/* Preview */}
          {amountPaid > 0 && (
            <div style={{
              background: "var(--green-lt)", border: "1px solid rgba(0,184,122,.2)",
              borderRadius: "var(--rad)", padding: "12px 16px", marginBottom: 8,
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Ibabayad sa {billerLabel}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "#e05c00" }}>₱{fmt(totalToPaySalmon)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Ating Kita ({feeRate}%)</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "var(--green-dk)" }}>+₱{fmt(fee)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Bagong Fund Total</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>₱{fmt(salmonData.fund + amountPaid)}</div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="ap-fg" style={{ marginBottom: 0 }}>
            <label className="ap-label">Note (optional)</label>
            <input className="ap-input" type="text" value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. partial payment, September installment…" />
          </div>
        </div>

        <div className="ap-modal-foot">
          <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ap-btn primary" onClick={handleSave} disabled={saving}
            style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}>
            {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SALMON SERVICE TAB
// ─────────────────────────────────────────────
function SalmonServiceTab({ salmonData, salmonTxns, loading, onAddTxn, onDeleteTxn, onEditTxn, onEditStats, onReset }) {
  const [subTab, setSubTab] = useState("overview");
  const [deletingTxn, setDeletingTxn] = useState(null);
  const [deletePin, setDeletePin] = useState("");
  const [deletePinErr, setDeletePinErr] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetPinErr, setResetPinErr] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [histSearch, setHistSearch] = useState("");
  const [histDateFilter, setHistDateFilter] = useState("all");
  const [histBillerFilter, setHistBillerFilter] = useState("all");
  const PASSCODE = "101660";

  const handleDeleteConfirm = () => {
    if (deletePin === PASSCODE) {
      onDeleteTxn(deletingTxn);
      setDeletingTxn(null);
      setDeletePin("");
    } else {
      setDeletePinErr(true);
      setDeletePin("");
      setTimeout(() => setDeletePinErr(false), 1500);
    }
  };

  const handleResetConfirm = async () => {
    if (resetPin === PASSCODE) {
      setResetting(true);
      try { await onReset(); } catch (e) { /* handled */ }
      setResetting(false);
      setResetOpen(false);
      setResetPin("");
    } else {
      setResetPinErr(true);
      setResetPin("");
      setTimeout(() => setResetPinErr(false), 1500);
    }
  };

  if (loading) return (
    <div className="ap-loading">
      <Loader2 size={32} className="ap-spin" />
      <div className="ap-loading-txt">Loading Salmon data…</div>
    </div>
  );

  const totalPayments = salmonTxns.reduce((s, t) => s + t.amountPaid, 0);
  const totalFees = salmonTxns.reduce((s, t) => s + t.fee, 0);

  const filteredTxns = salmonTxns.filter(t => {
    const matchDate = matchesDateFilter(t.createdAt, histDateFilter);
    const matchBiller = histBillerFilter === "all" || t.billerType === histBillerFilter;
    const q = histSearch.toLowerCase().trim();
    const matchQ = !q || t.customerName?.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q);
    return matchDate && matchBiller && matchQ;
  });
  const filtTotalCollected = filteredTxns.reduce((s, t) => s + t.amountPaid, 0);
  const filtTotalFees = filteredTxns.reduce((s, t) => s + t.fee, 0);

  const TxnRow = ({ txn }) => {
    const isHC = txn.billerType === "homecredit";
    return (
      <div className="salmon-txn">
        <div className="salmon-txn-icon">🏦</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="salmon-txn-label">
            {txn.customerName}
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 700,
              background: isHC ? "var(--purple-lt)" : "#fff0e8",
              color: isHC ? "var(--purple-dk)" : "#e05c00",
              padding: "2px 8px", borderRadius: 99,
              border: `1px solid ${isHC ? "rgba(139,92,246,.25)" : "rgba(224,92,0,.25)"}`,
            }}>{isHC ? "Home Credit" : "Salmon"}</span>
          </div>
          <div className="salmon-txn-sub">
            Utang: ₱{fmt(txn.utangAmount)}
            <span style={{ margin: "0 5px", opacity: .4 }}>·</span>
            Bayad: ₱{fmt(txn.amountPaid)}
            {txn.note ? <><span style={{ margin: "0 5px", opacity: .4 }}>·</span>{txn.note}</> : null}
          </div>
        </div>
        <div className="salmon-txn-date">{fmtDate(txn.createdAt)}</div>
        <div className="salmon-txn-right">
          <div className="salmon-txn-amount">₱{fmt(txn.amountPaid)}</div>
          <div className="salmon-txn-fee">+₱{fmt(txn.fee)} fee ({txn.feeRate}%)</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button className="ap-btn ghost sm icon" title="Edit" style={{ color: "var(--blue)" }}
            onClick={() => setEditingTxn(txn)}>
            <Pencil size={14} strokeWidth={1.8} />
          </button>
          <button className="ap-btn ghost sm icon" title="Delete" style={{ color: "var(--red)" }}
            onClick={() => { setDeletingTxn(txn); setDeletePin(""); setDeletePinErr(false); }}>
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="salmon-header">
        <div className="salmon-header-left">
          <div className="salmon-header-logo">🏦</div>
          <div>
            <div className="salmon-header-label">Bills Fund</div>
            <div className="salmon-header-balance">₱{fmt(salmonData.fund)}</div>
            <div className="salmon-header-sub">Collected from customers — to be paid to biller</div>
          </div>
        </div>
        <div className="salmon-header-right">
          <button className="salmon-edit-btn" onClick={onEditStats}>
            <Pencil size={14} /> Edit Stats
          </button>
          <button
            className="salmon-edit-btn"
            onClick={() => { setResetOpen(true); setResetPin(""); setResetPinErr(false); }}
            style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", border: "1px solid rgba(239,68,68,.35)", marginLeft: 6 }}
            title="Restart — clear all transactions (keeps fund)"
          >
            🔄 Restart
          </button>
          <div style={{ fontSize: 12, opacity: .75 }}>
            {salmonTxns.length} payment{salmonTxns.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid var(--bdr)", paddingBottom: 0 }}>
        {[{ key: "overview", label: "Overview", emoji: "🏦" }, { key: "history", label: "Sale History", emoji: "📋" }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            border: "none", background: "none",
            color: subTab === t.key ? "#e05c00" : "var(--ink3)",
            borderBottom: subTab === t.key ? "2px solid #e05c00" : "2px solid transparent",
            marginBottom: -2, transition: "all .15s", display: "flex", alignItems: "center", gap: 7,
          }}>
            <span>{t.emoji}</span> {t.label}
            {t.key === "history" && salmonTxns.length > 0 && (
              <span style={{ background: "#e05c00", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{salmonTxns.length}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === "overview" ? (
        <>
          {/* Stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
            <StatCard label="Total Collected" value={`₱${fmt(totalPayments)}`} color="amber" icon={Wallet} sub="Galing sa customers" />
            <StatCard label="Total Fees Earned" value={`₱${fmt(salmonData.totalFees)}`} color="green" icon={CheckCircle} sub="Ating kita (2%)" />
            <StatCard label="Transactions" value={salmonTxns.length} color="blue" icon={BarChart3} sub="Total bill payments" />
          </div>

          {/* How it works card */}
          <div style={{
            background: "#fff0e8", border: "1px solid rgba(224,92,0,.2)",
            borderRadius: "var(--rad-lg)", padding: "14px 18px", marginBottom: 16,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>🏦</span>
            <div style={{ fontSize: 13, color: "#a34400", lineHeight: 1.65 }}>
              <strong>Paano gumagana ang Payment Bill Service:</strong><br />
              Customer may utang kay Salmon o Home Credit → nagbabayad sila sa atin → kami nagbabayad sa biller via bank/bills payment → kumikita tayo ng <strong>2% fee</strong> sa bawat transaksyon.
            </div>
          </div>

          {/* Add button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="ap-btn primary" onClick={onAddTxn}
              style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}>
              <Plus size={15} /> Record Payment
            </button>
          </div>

          {/* Recent transactions */}
          {salmonTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">🏦</div>
              <div className="ap-empty-txt">Wala pang bill payments. I-click ang "Record Payment" para magsimula.</div>
            </div>
          ) : (
            <div className="salmon-txn-list">
              {salmonTxns.slice(0, 5).map((txn) => <TxnRow key={txn.id} txn={txn} />)}
              {salmonTxns.length > 5 && (
                <div style={{ padding: "12px 20px", textAlign: "center" }}>
                  <button className="ap-btn sm" onClick={() => setSubTab("history")} style={{ color: "#e05c00" }}>
                    <History size={13} /> View all {salmonTxns.length} payments →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* History filtered stats */}
          <div className="ap-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <StatCard label="Transactions" value={filteredTxns.length} color="blue" icon={History} sub={DATE_FILTERS.find(f => f.key === histDateFilter)?.label} />
            <StatCard label="Total Collected" value={`₱${fmt(filtTotalCollected)}`} color="amber" icon={Wallet} sub="Filtered period" />
            <StatCard label="Total Fees" value={`₱${fmt(filtTotalFees)}`} color="green" icon={CheckCircle} sub="Filtered period" />
          </div>

          {/* Filters */}
          <div className="ap-toolbar" style={{ marginBottom: 14 }}>
            <select className={`ap-select${histDateFilter !== "all" ? " on" : ""}`} value={histDateFilter} onChange={e => setHistDateFilter(e.target.value)}>
              {DATE_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <select className="ap-select" value={histBillerFilter} onChange={e => setHistBillerFilter(e.target.value)} style={{ minWidth: 140 }}>
              <option value="all">All Billers</option>
              <option value="salmon">Salmon</option>
              <option value="homecredit">Home Credit</option>
            </select>
            <div className="ap-search-wrap">
              <Search size={15} className="ap-search-icon" />
              <input className="ap-search" placeholder="Search customer, note…" value={histSearch} onChange={e => setHistSearch(e.target.value)} />
            </div>
          </div>

          {/* Add button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="ap-btn primary" onClick={onAddTxn}
              style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}>
              <Plus size={15} /> Record Payment
            </button>
          </div>

          {filteredTxns.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">🔍</div>
              <div className="ap-empty-txt">Walang payments na nahanap para sa filter na ito.</div>
            </div>
          ) : (
            <div className="salmon-txn-list">
              {filteredTxns.map((txn) => <TxnRow key={txn.id} txn={txn} />)}
            </div>
          )}
        </>
      )}

      {editingTxn && (
        <SalmonEditTxnModal
          txn={editingTxn}
          salmonData={salmonData}
          onSave={(form) => onEditTxn(editingTxn, form)}
          onClose={() => setEditingTxn(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deletingTxn && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setDeletingTxn(null)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
              <div className="ap-confirm-title">Delete Salmon Payment?</div>
              <div className="ap-confirm-msg">
                <strong>{deletingTxn.customerName}</strong><br />
                <span style={{ fontSize: 12, color: "var(--ink3)" }}>Bayad: ₱{fmt(deletingTxn.amountPaid)} · Fee: ₱{fmt(deletingTxn.fee)}</span><br />
                <span style={{ fontSize: 12, color: "var(--red)", display: "block", marginTop: 6 }}>
                  Ire-reverse ang fund at fees.
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="password" className={`ap-input${deletePinErr ? " err" : ""}`}
                  value={deletePin} onChange={(e) => setDeletePin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }} autoFocus maxLength={10} />
                {deletePinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setDeletingTxn(null)}>Cancel</button>
                <button className="ap-btn danger" onClick={handleDeleteConfirm}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {resetOpen && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setResetOpen(false)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon" style={{ background: "var(--red-lt)", color: "var(--red)" }}>🔄</div>
              <div className="ap-confirm-title">Restart Bills Service?</div>
              <div className="ap-confirm-msg">
                Ang <strong>total fees</strong> ay ibabalik sa zero.<br />
                <span style={{ color: "var(--green-dk)", fontWeight: 700 }}>Bills Fund (₱{fmt(salmonData.fund)}) ay mananatili.</span><br />
                <span style={{ fontSize: 12, color: "var(--green-dk)", display: "block", marginTop: 6 }}>✅ Ang lahat ng {salmonTxns.length} payments ay mananatili sa history — hindi mabubura.</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="password" className={`ap-input${resetPinErr ? " err" : ""}`}
                  value={resetPin} onChange={(e) => setResetPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetConfirm()}
                  placeholder="Enter passcode to confirm"
                  style={{ textAlign: "center", letterSpacing: "0.2em" }} autoFocus maxLength={10} />
                {resetPinErr && <div className="ap-ferr" style={{ marginTop: 6 }}>Incorrect passcode.</div>}
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setResetOpen(false)} disabled={resetting}>Cancel</button>
                <button className="ap-btn danger" onClick={handleResetConfirm} disabled={resetting}>
                  {resetting ? <Loader2 size={14} className="ap-spin" /> : "🔄"} Restart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

function PasscodeModal({ onSuccess, onClose, title = "Enter Passcode" }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  const PASSCODE = "101660";

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => {
    if (code === PASSCODE) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setCode("");
      setTimeout(() => setError(false), 1800);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 360 }}>
        <div className="ap-modal-head">
          <h3>🔒 {title}</h3>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        <div className="ap-modal-body" style={{ textAlign: "center", paddingTop: 28, paddingBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🔐</div>
          <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 20, lineHeight: 1.5 }}>
            Enter the passcode to continue.
          </div>
          <input
            ref={inputRef}
            type="password"
            className={`ap-input${error ? " err" : ""}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Passcode"
            style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18, maxWidth: 220 }}
            maxLength={10}
          />
          {error && (
            <div className="ap-ferr" style={{ marginTop: 8 }}>Incorrect passcode. Try again.</div>
          )}
          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="ap-btn" onClick={onClose}>Cancel</button>
            <button className="ap-btn primary" onClick={handleSubmit}>
              <Check size={15} strokeWidth={2.2} /> Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CAPITAL INLINE LOCK SCREEN — PIN PAD
// ─────────────────────────────────────────────
const PIN_KEYS = [
  ["1", "ABC"], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  [null], ["0", ""], ["⌫"],
];

// ─────────────────────────────────────────────
//  CAPITAL EDIT BALANCE MODAL
// ─────────────────────────────────────────────
function CapitalEditBalanceModal({ currentBalance, onSave, onClose }) {
  const [step, setStep] = useState("pin");
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [amount, setAmount] = useState(String(currentBalance));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const PASSCODE = "101660";

  const submitPin = () => {
    if (passcode === PASSCODE) { setStep("edit"); setPassErr(false); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  const handleSave = async () => {
    if (amount === "" || isNaN(+amount)) { setErr("Mag-input ng valid na halaga."); return; }
    setSaving(true);
    await onSave(Math.round(+amount));
    setSaving(false);
    onClose();
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 400 }}>
        <div className="ap-modal-head" style={{ background: "linear-gradient(135deg,var(--green-lt),var(--surf))", borderBottom: "1px solid rgba(5,150,105,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--green-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💰</div>
            <h3 style={{ color: "var(--green-dk)" }}>Edit Capital Balance</h3>
          </div>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {step === "pin" ? (
          <div className="cap-pin-gate">
            <div className="cap-pin-gate-icon">🔐</div>
            <div className="cap-pin-gate-title">Passcode Required</div>
            <div className="cap-pin-gate-sub">I-enter ang passcode para mabago ang capital balance.</div>
            <input
              type="password"
              className={`ap-input${passErr ? " err" : ""}`}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="Passcode"
              style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18, width: "100%", marginBottom: 8 }}
              maxLength={10}
              autoFocus
            />
            {passErr && <div className="ap-ferr" style={{ marginBottom: 12 }}>Mali ang passcode.</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
              <button className="ap-btn" onClick={onClose}>Cancel</button>
              <button className="ap-btn primary" onClick={submitPin} style={{ background: "linear-gradient(135deg,#059669,#34d399)", borderColor: "transparent" }}>
                <Check size={15} /> Unlock
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="ap-modal-body">
              <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, background: "var(--surf2)", borderRadius: "var(--rad)", padding: "12px 14px" }}>
                Ang pagbago dito ay <strong>direktang magse-set</strong> ng capital balance. Hindi ito nagdadagdag ng entry sa listahan.
              </div>
              <div className="ap-fg" style={{ marginBottom: 0 }}>
                <label className="ap-label">Capital Balance (₱) *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "var(--ink3)", pointerEvents: "none", fontSize: 18 }}>₱</span>
                  <input
                    className={`ap-input${err ? " err" : ""}`}
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErr(""); }}
                    style={{ paddingLeft: 30, fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: "var(--green-dk)" }}
                    autoFocus
                  />
                </div>
                {err && <div className="ap-ferr">{err}</div>}
              </div>
            </div>
            <div className="ap-modal-foot">
              <button className="ap-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ap-btn primary" onClick={handleSave} disabled={saving} style={{ background: "linear-gradient(135deg,#059669,#34d399)", borderColor: "transparent" }}>
                {saving ? <Loader2 size={15} className="ap-spin" /> : <Check size={15} />}
                Set Balance
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CAPITAL ACTION PIN GATE (for Add/Edit/Delete)
// ─────────────────────────────────────────────
function CapitalActionPinGate({ title, onSuccess, onClose }) {
  const [passcode, setPasscode] = useState("");
  const [passErr, setPassErr] = useState(false);
  const PASSCODE = "101660";

  const submit = () => {
    if (passcode === PASSCODE) { onSuccess(); }
    else { setPassErr(true); setPasscode(""); setTimeout(() => setPassErr(false), 1500); }
  };

  return (
    <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 360 }}>
        <div className="ap-modal-head">
          <h3>🔐 {title}</h3>
          <button className="ap-btn ghost icon" onClick={onClose}><X size={18} strokeWidth={1.8} /></button>
        </div>
        <div className="cap-pin-gate">
          <div className="cap-pin-gate-icon">🔒</div>
          <div className="cap-pin-gate-title">Passcode Required</div>
          <div className="cap-pin-gate-sub">I-enter ang passcode para magpatuloy.</div>
          <input
            type="password"
            className={`ap-input${passErr ? " err" : ""}`}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Passcode"
            style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 18, width: "100%", marginBottom: 8 }}
            maxLength={10}
            autoFocus
          />
          {passErr && <div className="ap-ferr" style={{ marginBottom: 8 }}>Mali ang passcode.</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="ap-btn" onClick={onClose}>Cancel</button>
            <button className="ap-btn primary" onClick={submit}>
              <Check size={15} /> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CapitalLockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const PASSCODE = "101660";
  const MAX = PASSCODE.length;

  const press = (key) => {
    if (key === "⌫") {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (pin.length >= MAX) return;
    const next = pin + key;
    setPin(next);
    if (next.length === MAX) {
      setTimeout(() => {
        if (next === PASSCODE) {
          onUnlock();
        } else {
          setShake(true);
          setErrMsg("Wrong passcode. Try again.");
          setTimeout(() => { setShake(false); setPin(""); setErrMsg(""); }, 900);
        }
      }, 120);
    }
  };

  return (
    <div className="ap-capital-lock">
      <div className="ap-capital-lock-card">
        <div className="ap-capital-lock-ring">
          <Lock size={32} color="#fff" strokeWidth={1.8} />
        </div>
        <div className="ap-capital-lock-title">Capital is Locked</div>
        <div className="ap-capital-lock-sub">Enter your 6-digit passcode to access capital records.</div>

        {/* PIN dots */}
        <div className="ap-capital-pin-dots">
          {Array.from({ length: MAX }).map((_, i) => (
            <div
              key={i}
              className={`ap-capital-pin-dot${pin.length > i ? (shake ? " err" : " filled") : ""}`}
            />
          ))}
        </div>

        {/* PIN pad */}
        <div className="ap-capital-pinpad">
          {PIN_KEYS.map(([digit, letters], idx) => {
            if (digit === null) return <div key={idx} />;
            return (
              <button key={idx} className={`ap-capital-pin-btn${digit === "⌫" ? " del" : ""}`} onClick={() => press(digit)}>
                <span>{digit}</span>
                {letters !== undefined && letters !== "" && (
                  <span className="ap-capital-pin-sub">{letters}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="ap-capital-pin-err">{errMsg}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TOAST STACK
// ─────────────────────────────────────────────
function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  const icons = {
    success: <CheckCircle size={15} strokeWidth={2} />,
    error: <AlertCircle size={15} strokeWidth={2} />,
    info: <Info size={15} strokeWidth={2} />,
  };
  return (
    <div className="ap-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`ap-toast ${t.type}`}>{icons[t.type]}{t.msg}</div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
export default function LeeyamClinicInventory() {
  useStyles();

  const { toasts, toast } = useToast();
  const { items, loading: invLoading, online, addItem, updateItem, deleteItem, deductQty } = useInventory(toast);
  const { accessories, loading: accLoading, addAccessory, updateAccessory, deleteAccessory } = useAccessories(toast);
  const { reports, loading: histLoading, addSaleReport, deleteSaleReport, updateSaleReport } = useSalesHistory(toast);
  const { entries, capitalBalance, loading: capLoading, addEntry, updateEntry, deleteEntry, setBalance: setCapitalBalanceFn } = useCapital(toast);
  const { gcashData, gcashTxns, loading: gcashLoading, updateWallet, addTxn, updateTxn: updateGCashTxn, deleteTxn, resetTxns: resetGCashTxns } = useGCash(toast);
  const { loadData, loadTxns, loading: loadLoading, updateWallet: updateLoadWallet, addTxn: addLoadTxn, updateTxn: updateLoadTxn, deleteTxn: deleteLoadTxn, resetTxns: resetLoadTxns } = useLoadService(toast);
  const { printData, printTxns, loading: printLoading, updateStats: updatePrintStats, addTxn: addPrintTxn, updateTxn: updatePrintTxn, deleteTxn: deletePrintTxn, resetTxns: resetPrintTxns } = usePrintService(toast);
  const { salmonData, salmonTxns, loading: salmonLoading, updateStats: updateSalmonStats, addTxn: addSalmonTxn, updateTxn: updateSalmonTxn, deleteTxn: deleteSalmonTxn, resetTxns: resetSalmonTxns } = useSalmonService(toast);

  const [tab, setTab] = useState("inventory");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [salesOpen, setSalesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Accessories state
  const [accAddOpen, setAccAddOpen] = useState(false);
  const [editAccessory, setEditAccessory] = useState(null);
  const [deleteAccTarget, setDeleteAccTarget] = useState(null);

  // Inventory sub-tab state (lifted so topbar Add button can know which sub-tab is active)
  const [invSubTab, setInvSubTab] = useState("units");

  // Capital state
  const [capitalUnlocked, setCapitalUnlocked] = useState(false);
  const [capAddOpen, setCapAddOpen] = useState(false);
  const [capEditEntry, setCapEditEntry] = useState(null);
  const [capDeleteTarget, setCapDeleteTarget] = useState(null);
  const [capEditBalanceOpen, setCapEditBalanceOpen] = useState(false);
  const [capActionPin, setCapActionPin] = useState(null); // { action: "add"|"edit"|"delete", resolve: fn }

  // GCash state
  const [gcashAddOpen, setGcashAddOpen] = useState(false);
  const [gcashEditWalletOpen, setGcashEditWalletOpen] = useState(false);

  // Load Service state
  const [loadUnlocked, setLoadUnlocked] = useState(false);
  const [loadAddOpen, setLoadAddOpen] = useState(false);
  const [loadEditWalletOpen, setLoadEditWalletOpen] = useState(false);

  // Print Service state
  const [printUnlocked, setPrintUnlocked] = useState(false);
  const [printAddOpen, setPrintAddOpen] = useState(false);
  const [printEditStatsOpen, setPrintEditStatsOpen] = useState(false);

  // Salmon Service state
  const [salmonUnlocked, setSalmonUnlocked] = useState(false);
  const [salmonAddOpen, setSalmonAddOpen] = useState(false);
  const [salmonEditStatsOpen, setSalmonEditStatsOpen] = useState(false);

  // Passcode gate state (for inventory edit/delete/add)
  const [passcodeRequest, setPasscodeRequest] = useState(null);

  const requirePasscode = (title, action) => {
    setPasscodeRequest({ title, action });
  };

  const handlePasscodeSuccess = () => {
    if (passcodeRequest) {
      passcodeRequest.action();
    }
    setPasscodeRequest(null);
  };

  // Navigate to capital tab — lock on every visit
  const goToCapital = () => {
    setCapitalUnlocked(false);
    setTab("capital");
    setSidebarOpen(false);
  };

  const goToGCash = () => {
    setTab("gcash");
    setSidebarOpen(false);
  };

  const goToLoad = () => {
    setLoadUnlocked(false);
    setTab("load");
    setSidebarOpen(false);
  };

  const goToPrint = () => {
    setPrintUnlocked(true);
    setTab("print");
    setSidebarOpen(false);
  };

  const goToSalmon = () => {
    setSalmonUnlocked(true);
    setTab("salmon");
    setSidebarOpen(false);
  };

  const alertCount = useMemo(
    () => items.filter((i) => stockStatus(i) === "low" || stockStatus(i) === "out").length
      + accessories.filter((i) => stockStatus(i) === "low" || stockStatus(i) === "out").length,
    [items, accessories]
  );

  const existingSKUs = useMemo(
    () => items.filter((i) => i.id !== editItem?.id).map((i) => i.sku),
    [items, editItem]
  );

  // Inventory handlers
  const handleAdd = async (form) => { await addItem(form); setAddOpen(false); toast("Unit added!", "success"); };
  const handleUpdate = async (form) => { await updateItem(form); setEditItem(null); toast("Unit updated!", "success"); };
  const handleDelete = async () => { await deleteItem(deleteTarget.id); toast(`"${deleteTarget.name}" deleted.`, "error"); setDeleteTarget(null); };

  // Accessories handlers
  const handleAccAdd = async (form) => { await addAccessory(form); setAccAddOpen(false); toast("Accessory added!", "success"); };
  const handleAccUpdate = async (form) => { await updateAccessory(form); setEditAccessory(null); toast("Accessory updated!", "success"); };
  const handleAccDelete = async () => { await deleteAccessory(deleteAccTarget.id); toast(`"${deleteAccTarget.name}" deleted.`, "error"); setDeleteAccTarget(null); };
  const handleDeleteReport = async (id) => { await deleteSaleReport(id); toast("Sale record deleted.", "error"); };
  const handleUpdateReport = async (id, updatedItems) => { await updateSaleReport(id, updatedItems); toast("Sale record updated!", "success"); };
  const requestDeleteReport = (report) => requirePasscode("Delete Sale Record", () => handleDeleteReport(report.id));
  const requestEditReport = (report, cb) => requirePasscode("Edit Sale Record", cb);

  // Passcode-gated inventory triggers
  const requestAdd = () => requirePasscode("Add Unit", () => setAddOpen(true));
  const requestEdit = (item) => requirePasscode("Edit Unit", () => setEditItem(item));
  const requestDelete = (item) => requirePasscode("Delete Unit", () => setDeleteTarget(item));

  // Passcode-gated accessory triggers
  const requestAccAdd = () => requirePasscode("Add Accessory", () => setAccAddOpen(true));
  const requestAccEdit = (acc) => requirePasscode("Edit Accessory", () => setEditAccessory(acc));
  const requestAccDelete = (acc) => requirePasscode("Delete Accessory", () => setDeleteAccTarget(acc));

  // Capital handlers (already inside locked page, but also gate modal actions)
  const handleCapAdd = async (form) => { await addEntry(form, capitalBalance); setCapAddOpen(false); toast("Capital entry added!", "success"); };
  const handleCapUpdate = async (form) => { await updateEntry(form, capEditEntry, capitalBalance); setCapEditEntry(null); toast("Capital entry updated!", "success"); };
  const handleCapDelete = async () => { await deleteEntry(capDeleteTarget.id, capDeleteTarget, capitalBalance); toast("Capital entry deleted.", "error"); setCapDeleteTarget(null); };
  const handleCapSetBalance = async (amount) => { await setCapitalBalanceFn(amount); toast("Capital balance updated!", "success"); };

  // GCash handlers
  const handleGCashAddTxn = async (form) => {
    await addTxn(form, gcashData.balance, gcashData.charge);
    const isCashIn = form.type === "cashin";
    toast(`${isCashIn ? "Cash In" : "Cash Out"} recorded! ₱${fmt(form.amount)}`, "success");
  };
  const handleGCashEditTxn = async (txn, form) => {
    await updateGCashTxn(txn, form, gcashData.balance, gcashData.charge);
    toast(`Transaction updated! ₱${fmt(form.amount)}`, "success");
  };
  const handleGCashDeleteTxn = async (txn) => {
    await deleteTxn(txn, gcashData.balance, gcashData.charge);
    toast("Transaction deleted.", "error");
  };
  const handleGCashUpdateWallet = async (balance, charge) => {
    await updateWallet(balance, charge);
    toast("Wallet updated!", "success");
  };

  // Load Service handlers
  const handleLoadAddTxn = async (form) => {
    await addLoadTxn(form, loadData);
    toast(`Load recorded! ₱${fmt(form.sellingPrice)} sale.`, "success");
  };
  const handleLoadEditTxn = async (txn, form) => {
    await updateLoadTxn(txn, form, loadData);
    toast(`Load transaction updated!`, "success");
  };
  const handleLoadDeleteTxn = async (txn) => {
    await deleteLoadTxn(txn, loadData);
    toast("Load transaction deleted.", "error");
  };
  const handleLoadUpdateWallet = async (smartTnt, globeTm, dito, totalProfit) => {
    await updateLoadWallet(smartTnt, globeTm, dito, totalProfit);
    toast("Load wallets updated!", "success");
  };

  // Print Service handlers
  const handlePrintAddTxn = async (form) => {
    const qty = Math.max(1, parseInt(form.qty) || 1);
    const sellingPrice = Math.round(+form.sellingPrice);
    const totalForTxn = sellingPrice * qty;
    const profit = totalForTxn - Math.round(+form.cost) * qty;
    await addPrintTxn(form, printData.totalRevenue, printData.totalProfit);
    // Record to capital as income (visible only, not added to balance)
    const svcLabel = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} — ${form.subtype?.replace(/_/g, " ")} ×${qty}`;
    await addEntry({
      label: `Print Service: ${svcLabel}`,
      amount: String(totalForTxn),
      type: "income",
      note: `Auto-generated from Print/Laminate service. Revenue: ₱${fmt(totalForTxn)} | Profit: ₱${fmt(profit)}${form.note ? " | " + form.note : ""}. (Para lang sa visibility — hindi nagdadagdag sa capital balance.)`,
      autoSale: false,
      autoPrint: true,
    }, capitalBalance);
    toast(`Recorded! ₱${fmt(totalForTxn)} — ${svcLabel}`, "success");
  };
  const handlePrintEditTxn = async (txn, form) => {
    await updatePrintTxn(txn, form, printData.totalRevenue, printData.totalProfit);
    toast(`Print transaction updated!`, "success");
  };
  const handlePrintDeleteTxn = async (txn) => {
    await deletePrintTxn(txn, printData.totalRevenue, printData.totalProfit);
    toast("Print transaction deleted.", "error");
  };
  const handlePrintUpdateStats = async (totalRevenue, totalProfit) => {
    await updatePrintStats(totalRevenue, totalProfit);
    toast("Print stats updated!", "success");
  };

  // Salmon Service handlers
  const handleSalmonAddTxn = async (form) => {
    await addSalmonTxn(form, salmonData.fund, salmonData.totalFees);
    const fee = Math.round((+form.amountPaid) * ((+form.feeRate || 2) / 100));
    toast(`Recorded! ₱${fmt(+form.amountPaid)} collected · +₱${fmt(fee)} fee`, "success");
  };
  const handleSalmonEditTxn = async (txn, form) => {
    await updateSalmonTxn(txn, form, salmonData.fund, salmonData.totalFees);
    toast(`Payment record updated!`, "success");
  };
  const handleSalmonDeleteTxn = async (txn) => {
    await deleteSalmonTxn(txn, salmonData.fund, salmonData.totalFees);
    toast("Salmon transaction deleted.", "error");
  };
  const handleSalmonUpdateStats = async (fund, totalFees) => {
    await updateSalmonStats(fund, totalFees);
    toast("Salmon stats updated!", "success");
  };

  // ── RESET handlers (keep balances/funds, zero out txns + profit/stats)
  const handleGCashReset = async () => {
    await resetGCashTxns(gcashData.balance);
    toast("GCash transactions reset. Balance kept.", "success");
  };
  const handleLoadReset = async () => {
    await resetLoadTxns(loadData);
    toast("Load transactions reset. Balance kept.", "success");
  };
  const handlePrintReset = async () => {
    await resetPrintTxns();
    toast("Print transactions reset to zero.", "success");
  };
  const handleSalmonReset = async () => {
    await resetSalmonTxns(salmonData.fund);
    toast("Bills transactions reset. Fund kept.", "success");
  };

  const handleSale = async (saleItems, paymentInfo = {}) => {
    await deductQty(saleItems);
    await addSaleReport(saleItems, paymentInfo);
    const total = saleItems.reduce((s, i) => s + i.price * i.qty, 0);
    const saleNum = reports.length + 1;
    const itemNames = saleItems.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ");
    const isInstallment = paymentInfo.paymentMethod === "homecredit" || paymentInfo.paymentMethod === "salmon";
    const pmLabel = paymentInfo.paymentMethod === "homecredit" ? "Home Credit" : paymentInfo.paymentMethod === "salmon" ? "Salmon" : paymentInfo.paymentMethod === "gcash" ? "GCash" : "Cash";
    // For HC/Salmon: only the downpayment goes to capital (actual cash received)
    const capitalAmount = isInstallment ? paymentInfo.downpayment : total;
    const capitalNote = isInstallment
      ? `Auto-generated from sale. Payment: ${pmLabel}. Total: ₱${fmt(total)} | Downpayment: ₱${fmt(paymentInfo.downpayment)} | Balance/Utang: ₱${fmt(paymentInfo.balance)}${paymentInfo.charge > 0 ? ` | Charge: ₱${fmt(paymentInfo.charge)}` : ""}.`
      : `Auto-generated from sale. Payment: ${pmLabel}. Items: ${itemNames}. Total: ₱${fmt(total)}.`;
    await addEntry({
      label: `Sale #${saleNum} — ${itemNames}`,
      amount: String(capitalAmount),
      type: "income",
      note: capitalNote,
      autoSale: true,
    }, capitalBalance);
    toast(`Sale recorded! ₱${fmt(total)} total. Auto-added sa Capital.`, "success");
  };

  const PAGE_TITLES = { inventory: "Inventory", history: "Sales History", capital: "Capital", gcash: "GCash Service", load: "Load Service", print: "Print & Laminate", salmon: "Payment Bill Service" };

  return (
    <div className="ap-shell">
      {/* Sidebar overlay for mobile */}
      <div
        className={`ap-mob-overlay${sidebarOpen ? " vis" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <aside className={`ap-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="ap-sidebar-logo">
          <div className="ap-sidebar-logo-icon">
            <Smartphone size={20} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div className="ap-sidebar-brand">Leeyam Clinic</div>
            <div className="ap-sidebar-sub">Cellphone & Gadget Clinic</div>
          </div>
        </div>

        <nav className="ap-sidebar-nav">
          <button
            className={`ap-nav-item${tab === "inventory" ? " active" : ""}`}
            onClick={() => { setTab("inventory"); setSidebarOpen(false); }}
          >
            <Package size={17} strokeWidth={1.8} />
            Inventory
            {alertCount > 0 && <span className="ap-nav-badge">{alertCount}</span>}
          </button>

          <div className="ap-sidebar-divider" />

          <button
            className={`ap-nav-item${tab === "history" ? " active" : ""}`}
            onClick={() => { setTab("history"); setSidebarOpen(false); }}
          >
            <History size={17} strokeWidth={1.8} />
            Sales History
            {reports.length > 0 && <span className="ap-nav-badge blue">{reports.length}</span>}
          </button>

          <div className="ap-sidebar-divider" />

          <button
            className={`ap-nav-item${tab === "capital" ? " active" : ""}`}
            onClick={goToCapital}
          >
            <Wallet size={17} strokeWidth={1.8} />
            Capital
            <Lock size={12} strokeWidth={2} style={{ marginLeft: "auto", opacity: 0.5 }} />
          </button>

          <div className="ap-sidebar-divider" />

          <button
            className={`ap-nav-item${tab === "gcash" ? " active" : ""}`}
            onClick={goToGCash}
          >
            <CreditCard size={17} strokeWidth={1.8} />
            GCash Service
            <Lock size={12} strokeWidth={2} style={{ marginLeft: "auto", opacity: 0.5 }} />
          </button>

          <div className="ap-sidebar-divider" />

          <button
            className={`ap-nav-item${tab === "load" ? " active" : ""}`}
            onClick={goToLoad}
          >
            <Signal size={17} strokeWidth={1.8} />
            Load Service
          </button>

          <div className="ap-sidebar-divider" />

          <button
            className={`ap-nav-item${tab === "print" ? " active" : ""}`}
            onClick={goToPrint}
          >
            <Printer size={17} strokeWidth={1.8} />
            Print & Laminate
          </button>

          <div className="ap-sidebar-divider" />

          <button
            className={`ap-nav-item${tab === "salmon" ? " active" : ""}`}
            onClick={goToSalmon}
          >
            <Landmark size={17} strokeWidth={1.8} />
            Payment Bill Service
          </button>
        </nav>

        <div className="ap-sidebar-sale">
          <button className="ap-sidebar-sale-btn" onClick={() => { setSalesOpen(true); setSidebarOpen(false); }}>
            <ShoppingCart size={17} strokeWidth={2} />
            Process Sale
          </button>
        </div>

        <div className={`ap-sidebar-conn${online ? " online" : ""}`}>
          {online
            ? <><Wifi size={13} /> Connected to Firebase</>
            : <><WifiOff size={13} /> Offline — check connection</>
          }
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="ap-main">
        {/* Topbar */}
        <header className="ap-topbar">
          {/* Hamburger for mobile */}
          <button
            className="ap-btn ghost icon"
            style={{ display: "none" }}
            id="ap-ham"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="ap-topbar-title">{PAGE_TITLES[tab]}</div>
          <div className="ap-topbar-right">
            {tab === "inventory" && (
              <button
                className="ap-btn primary"
                onClick={invSubTab === "accessories" ? requestAccAdd : requestAdd}
              >
                <Plus size={15} strokeWidth={2.2} /> <span>Add</span>
              </button>
            )}
            {tab === "capital" && capitalUnlocked && (
              <button className="ap-btn primary" onClick={() => setCapActionPin({ label: "Add Entry", cb: () => setCapAddOpen(true) })}>
                <Plus size={15} strokeWidth={2.2} /> <span>Add Entry</span>
              </button>
            )}
            {tab === "gcash" && (
              <button className="ap-btn primary" onClick={() => setGcashAddOpen(true)} style={{ background: "linear-gradient(135deg,#0070e0,#00a8e8)", borderColor: "transparent" }}>
                <Plus size={15} strokeWidth={2.2} /> <span>New Transaction</span>
              </button>
            )}
            {tab === "load" && (
              <button className="ap-btn primary" onClick={() => setLoadAddOpen(true)} style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", borderColor: "transparent" }}>
                <Plus size={15} strokeWidth={2.2} /> <span>New Load Sale</span>
              </button>
            )}
            {tab === "print" && printUnlocked && (
              <button className="ap-btn primary" onClick={() => setPrintAddOpen(true)} style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderColor: "transparent" }}>
                <Plus size={15} strokeWidth={2.2} /> <span>New Service</span>
              </button>
            )}
            {tab === "salmon" && salmonUnlocked && (
              <button className="ap-btn primary" onClick={() => setSalmonAddOpen(true)} style={{ background: "linear-gradient(135deg,#e05c00,#ff8c42)", borderColor: "transparent" }}>
                <Plus size={15} strokeWidth={2.2} /> <span>Record Payment</span>
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="ap-content">
          {tab === "inventory" ? (
            <InventoryTab
              items={items}
              loading={invLoading}
              onAdd={requestAdd}
              onEdit={requestEdit}
              onDelete={requestDelete}
              accessories={accessories}
              accLoading={accLoading}
              onAddAcc={requestAccAdd}
              onEditAcc={requestAccEdit}
              onDeleteAcc={requestAccDelete}
              subTab={invSubTab}
              setSubTab={setInvSubTab}
            />
          ) : tab === "history" ? (
            <HistoryTab
              reports={reports}
              loading={histLoading}
              onDeleteReport={requestDeleteReport}
              onUpdateReport={handleUpdateReport}
              requirePasscode={requirePasscode}
            />
          ) : tab === "capital" ? (
            capitalUnlocked ? (
              <CapitalTab
                entries={entries}
                capitalBalance={capitalBalance}
                loading={capLoading}
                onAdd={() => setCapActionPin({ label: "Add Entry", cb: () => setCapAddOpen(true) })}
                onEdit={(entry) => setCapActionPin({ label: "Edit Entry", cb: () => setCapEditEntry(entry) })}
                onDelete={(entry) => setCapActionPin({ label: "Delete Entry", cb: () => setCapDeleteTarget(entry) })}
                onEditBalance={() => setCapEditBalanceOpen(true)}
              />
            ) : (
              <CapitalLockScreen onUnlock={() => setCapitalUnlocked(true)} />
            )
          ) : tab === "gcash" ? (
            <GCashTab
              gcashData={gcashData}
              gcashTxns={gcashTxns}
              loading={gcashLoading}
              onAddTxn={() => setGcashAddOpen(true)}
              onDeleteTxn={handleGCashDeleteTxn}
              onEditTxn={handleGCashEditTxn}
              onEditWallet={() => setGcashEditWalletOpen(true)}
              onReset={handleGCashReset}
            />
          ) : tab === "load" ? (
            <LoadServiceTab
              loadData={loadData}
              loadTxns={loadTxns}
              loading={loadLoading}
              onAddTxn={() => setLoadAddOpen(true)}
              onDeleteTxn={handleLoadDeleteTxn}
              onEditTxn={handleLoadEditTxn}
              onEditWallet={() => setLoadEditWalletOpen(true)}
              onReset={handleLoadReset}
            />
          ) : tab === "print" ? (
            printUnlocked ? (
              <PrintServiceTab
                printData={printData}
                printTxns={printTxns}
                loading={printLoading}
                onAddTxn={() => setPrintAddOpen(true)}
                onDeleteTxn={handlePrintDeleteTxn}
                onEditTxn={handlePrintEditTxn}
                onEditStats={() => setPrintEditStatsOpen(true)}
                onReset={handlePrintReset}
              />
            ) : (
              <PrintLockScreen onUnlock={() => setPrintUnlocked(true)} />
            )
          ) : tab === "salmon" ? (
            salmonUnlocked ? (
              <SalmonServiceTab
                salmonData={salmonData}
                salmonTxns={salmonTxns}
                loading={salmonLoading}
                onAddTxn={() => setSalmonAddOpen(true)}
                onDeleteTxn={handleSalmonDeleteTxn}
                onEditTxn={handleSalmonEditTxn}
                onEditStats={() => setSalmonEditStatsOpen(true)}
                onReset={handleSalmonReset}
              />
            ) : (
              <SalmonLockScreen onUnlock={() => setSalmonUnlocked(true)} />
            )
          ) : null}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="ap-bottom-nav">
        <button
          className={`ap-mob-nav-btn${tab === "inventory" ? " active" : ""}`}
          onClick={() => setTab("inventory")}
        >
          <Package size={20} strokeWidth={1.8} />
          <span>Inventory</span>
          {alertCount > 0 && <span className="ap-mob-nav-badge">{alertCount}</span>}
        </button>

        <button className="ap-mob-fab" onClick={() => setSalesOpen(true)} title="Process Sale">
          <ShoppingCart size={22} strokeWidth={2} />
        </button>

        <button
          className={`ap-mob-nav-btn${tab === "history" ? " active" : ""}`}
          onClick={() => setTab("history")}
        >
          <History size={20} strokeWidth={1.8} />
          <span>History</span>
          {reports.length > 0 && <span className="ap-mob-nav-badge" style={{ background: "var(--blue)" }}>{reports.length}</span>}
        </button>

        <button
          className={`ap-mob-nav-btn${tab === "capital" ? " active" : ""}`}
          onClick={goToCapital}
        >
          <Wallet size={20} strokeWidth={1.8} />
          <span>Capital</span>
        </button>

        <button
          className={`ap-mob-nav-btn${tab === "gcash" ? " active" : ""}`}
          onClick={goToGCash}
        >
          <CreditCard size={20} strokeWidth={1.8} />
          <span>GCash</span>
        </button>

        <button
          className={`ap-mob-nav-btn${tab === "load" ? " active" : ""}`}
          onClick={goToLoad}
        >
          <Signal size={20} strokeWidth={1.8} />
          <span>Load</span>
        </button>

        <button
          className={`ap-mob-nav-btn${tab === "print" ? " active" : ""}`}
          onClick={goToPrint}
        >
          <Printer size={20} strokeWidth={1.8} />
          <span>Print</span>
        </button>

        <button
          className={`ap-mob-nav-btn${tab === "salmon" ? " active" : ""}`}
          onClick={goToSalmon}
        >
          <Landmark size={20} strokeWidth={1.8} />
          <span>Bills</span>
        </button>
      </nav>

      {/* Inject hamburger visibility via inline style */}
      <style>{`
        @media(max-width:900px){
          #ap-ham{display:flex !important;}
        }
      `}</style>

      {/* Modals */}
      {passcodeRequest && (
        <PasscodeModal
          title={passcodeRequest.title}
          onSuccess={handlePasscodeSuccess}
          onClose={() => setPasscodeRequest(null)}
        />
      )}
      {addOpen && <ItemModal item={null} onSave={handleAdd} onClose={() => setAddOpen(false)} existingSKUs={existingSKUs} />}
      {editItem && <ItemModal item={editItem} onSave={handleUpdate} onClose={() => setEditItem(null)} existingSKUs={existingSKUs} />}
      {deleteTarget && <DeleteModal item={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
      {salesOpen && <SalesModal items={[...items, ...accessories.map(a => ({ ...a, _isAccessory: true }))]} onClose={() => setSalesOpen(false)} onConfirm={(saleItems, paymentInfo) => handleSale(saleItems, paymentInfo)} />}

      {/* Accessories modals */}
      {accAddOpen && <AccessoryModal item={null} onSave={handleAccAdd} onClose={() => setAccAddOpen(false)} />}
      {editAccessory && <AccessoryModal item={editAccessory} onSave={handleAccUpdate} onClose={() => setEditAccessory(null)} />}
      {deleteAccTarget && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteAccTarget(null)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
              <div className="ap-confirm-title">Delete Accessory?</div>
              <div className="ap-confirm-msg"><strong>{deleteAccTarget.name}</strong><br />This action cannot be undone.</div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setDeleteAccTarget(null)}>Cancel</button>
                <button className="ap-btn danger" onClick={handleAccDelete}>
                  <Trash2 size={14} strokeWidth={1.8} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capital modals */}
      {capActionPin && (
        <CapitalActionPinGate
          title={capActionPin.label}
          onSuccess={() => { capActionPin.cb(); setCapActionPin(null); }}
          onClose={() => setCapActionPin(null)}
        />
      )}
      {capEditBalanceOpen && (
        <CapitalEditBalanceModal
          currentBalance={capitalBalance}
          onSave={handleCapSetBalance}
          onClose={() => setCapEditBalanceOpen(false)}
        />
      )}
      {capAddOpen && <CapitalModal entry={null} onSave={handleCapAdd} onClose={() => setCapAddOpen(false)} capitalBalance={capitalBalance} allEntries={entries} />}
      {capEditEntry && <CapitalModal entry={capEditEntry} onSave={handleCapUpdate} onClose={() => setCapEditEntry(null)} capitalBalance={capitalBalance} allEntries={entries} />}
      {capDeleteTarget && (
        <div className="ap-overlay" onClick={(e) => e.target === e.currentTarget && setCapDeleteTarget(null)}>
          <div className="ap-modal" style={{ maxWidth: 380 }}>
            <div className="ap-confirm">
              <div className="ap-confirm-icon"><Trash2 size={24} strokeWidth={1.8} /></div>
              <div className="ap-confirm-title">Delete Capital Entry?</div>
              <div className="ap-confirm-msg">
                <strong>{capDeleteTarget.label}</strong><br />
                <span style={{ color: capDeleteTarget.type === "income" ? "var(--green-dk)" : "var(--red-dk)" }}>
                  {capDeleteTarget.type === "income" ? "+" : "−"}₱{fmt(capDeleteTarget.amount)}
                </span>
                <br />This action cannot be undone.
              </div>
              <div className="ap-confirm-actions">
                <button className="ap-btn" onClick={() => setCapDeleteTarget(null)}>Cancel</button>
                <button className="ap-btn danger" onClick={handleCapDelete}>
                  <Trash2 size={14} strokeWidth={1.8} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} />

      {/* GCash modals */}
      {gcashAddOpen && (
        <GCashAddTxnModal
          gcashData={gcashData}
          onSave={handleGCashAddTxn}
          onClose={() => setGcashAddOpen(false)}
        />
      )}
      {gcashEditWalletOpen && (
        <GCashEditWalletModal
          gcashData={gcashData}
          onSave={handleGCashUpdateWallet}
          onClose={() => setGcashEditWalletOpen(false)}
        />
      )}

      {/* Load Service modals */}
      {loadAddOpen && (
        <LoadAddTxnModal
          loadData={loadData}
          onSave={handleLoadAddTxn}
          onClose={() => setLoadAddOpen(false)}
        />
      )}
      {loadEditWalletOpen && (
        <LoadEditWalletModal
          loadData={loadData}
          onSave={handleLoadUpdateWallet}
          onClose={() => setLoadEditWalletOpen(false)}
        />
      )}

      {/* Print Service modals */}
      {printAddOpen && (
        <PrintAddTxnModal
          printData={printData}
          onSave={handlePrintAddTxn}
          onClose={() => setPrintAddOpen(false)}
        />
      )}
      {printEditStatsOpen && (
        <PrintEditStatsModal
          printData={printData}
          onSave={handlePrintUpdateStats}
          onClose={() => setPrintEditStatsOpen(false)}
        />
      )}

      {/* Salmon Service modals */}
      {salmonAddOpen && (
        <SalmonAddTxnModal
          salmonData={salmonData}
          onSave={handleSalmonAddTxn}
          onClose={() => setSalmonAddOpen(false)}
        />
      )}
      {salmonEditStatsOpen && (
        <SalmonEditStatsModal
          salmonData={salmonData}
          onSave={handleSalmonUpdateStats}
          onClose={() => setSalmonEditStatsOpen(false)}
        />
      )}
    </div>
  );
}