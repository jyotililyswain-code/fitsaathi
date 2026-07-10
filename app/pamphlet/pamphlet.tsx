"use client";

/* eslint-disable @next/next/no-img-element -- QR is generated in-browser and embedded in the downloaded poster. */

import { toPng } from "html-to-image";
import {
  BadgeCheck, CalendarCheck, Camera, Check, Download, Dumbbell,
  Handshake, Headphones, Medal, QrCode, ShieldCheck, ShoppingBag,
  Sparkles, Store, Target, Trophy, UserRoundCheck, UsersRound,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

const customerItems = [
  "Find verified coaches and dojos",
  "Book Martial Arts, Yoga, Gymnastics, Fitness, Self Defense and Traditional Arts",
  "Easy booking system",
  "Smart attendance scanner",
  "Progress and rewards system",
  "Demo shows and events",
  "Dojo refund policy for first package only",
  "No refund for home/private coaching classes",
];

const coachItems = [
  "Register as Home Coach or Dojo",
  "Grow your coaching business",
  "Manage bookings from your dashboard",
  "Attendance scanner mandatory for home coaches",
  "Phone number and Aadhaar verification required",
  "Fair earning model",
];

const otherItems = [
  [Trophy, "Tournaments", "For coaches and dojos"],
  [ShoppingBag, "Marketplace", "Equipment, supplements & healthy food"],
  [Store, "Trusted sellers", "Verified sellers you can rely on"],
  [ShieldCheck, "Safe & secure", "A protected fitness platform"],
  [Target, "Multiple categories", "Something for every fitness goal"],
  [Headphones, "Help & support", "Support when you need it"],
] as const;

function TickList({ items, color }: { items: string[]; color: string }) {
  return <ul className="space-y-[7px]">{items.map((item) => (
    <li key={item} className="flex gap-2 text-[12.5px] font-medium leading-[1.35] text-slate-700">
      <span className={`mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full ${color}`}><Check className="h-2.5 w-2.5 stroke-[3]" /></span>
      <span>{item}</span>
    </li>
  ))}</ul>;
}

export function Pamphlet() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    QRCode.toDataURL("https://fitsaathi.vercel.app/", { width: 360, margin: 1, errorCorrectionLevel: "H", color: { dark: "#0f2744", light: "#ffffff" } }).then(setQr);
  }, []);

  async function download() {
    if (!posterRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = "FitSaathi-Pamphlet.png";
      link.href = dataUrl;
      link.click();
    } finally { setDownloading(false); }
  }

  return (
    <main className="pamphlet-page min-h-screen bg-[#eaf1f7] px-3 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="pamphlet-toolbar mx-auto mb-5 flex max-w-[794px] items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Promotional poster</p><h1 className="text-xl font-black text-slate-900">FitSaathi Pamphlet</h1></div>
        <button onClick={download} disabled={downloading || !qr} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60">
          <Download className="h-4 w-4" /> {downloading ? "Preparing…" : "Download Pamphlet"}
        </button>
      </div>

      <div className="mx-auto max-w-[794px] overflow-auto rounded-md shadow-2xl shadow-slate-900/20 print:shadow-none">
        <div ref={posterRef} className="fitsaathi-poster relative h-[1123px] w-[794px] overflow-hidden bg-white text-slate-900">
          <div className="absolute -right-20 -top-36 h-[360px] w-[360px] rounded-full border-[55px] border-white/10" />
          <header className="relative h-[205px] overflow-hidden bg-[#0b4ca3] px-12 pb-8 pt-9 text-white">
            <div className="absolute inset-y-0 right-0 w-[44%] bg-gradient-to-br from-[#087f5b] to-[#0a9b6d] [clip-path:polygon(30%_0,100%_0,100%_100%,0_100%)]" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 shadow-lg"><Dumbbell className="h-7 w-7" /></span><div className="text-[35px] font-black leading-none tracking-[-.04em]">Fit<span className="text-[#a8f000]">Saathi</span></div></div>
                <p className="mt-6 text-[24px] font-black leading-tight">Your Fitness. Your Journey.<br/><span className="text-[#ffbd59]">Our Saathi.</span></p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[.2em] text-blue-100">India&apos;s fitness & wellness community</p>
              </div>
              <div className="relative mt-2 grid h-[118px] w-[118px] place-items-center rounded-full border-[3px] border-white/30 bg-white/10"><UsersRound className="h-14 w-14"/><Sparkles className="absolute right-2 top-1 h-6 w-6 text-[#ffbd59]"/></div>
            </div>
          </header>

          <div className="grid grid-cols-[1.08fr_.92fr] gap-5 px-10 pb-4 pt-7">
            <section className="rounded-3xl border border-blue-100 bg-[#f1f7ff] p-5">
              <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><UserRoundCheck className="h-5 w-5"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">Discover • Book • Progress</p><h2 className="text-[20px] font-black text-[#123663]">For Customers</h2></div></div>
              <TickList items={customerItems} color="bg-blue-600 text-white" />
            </section>
            <section className="rounded-3xl border border-orange-100 bg-[#fff8ef] p-5">
              <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white"><Handshake className="h-5 w-5"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-orange-600">Teach • Manage • Grow</p><h2 className="text-[20px] font-black text-[#73360b]">For Coaches</h2></div></div>
              <TickList items={coachItems} color="bg-orange-500 text-white" />
              <div className="mt-4 border-t border-orange-200 pt-3"><p className="mb-2 text-[10px] font-black uppercase tracking-[.15em] text-orange-700">Earn your badge</p><div className="flex gap-1.5">{[["Verified","bg-blue-600"],["Elite","bg-emerald-600"],["Legendary","bg-orange-500"]].map(([x,c])=><span key={x} className={`${c} flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-extrabold text-white`}><BadgeCheck className="h-2.5 w-2.5"/>{x}</span>)}</div></div>
            </section>
          </div>

          <section className="mx-10 mt-1">
            <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-600">More ways to thrive</p><h2 className="text-[20px] font-black text-[#123663]">Everything Your Fitness Journey Needs</h2></div><Medal className="h-8 w-8 text-orange-500"/></div>
            <div className="grid grid-cols-3 gap-2.5">{otherItems.map(([Icon,title,desc])=><div key={title} className="flex min-h-[66px] items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Icon className="h-[18px] w-[18px]"/></span><div><h3 className="text-[11px] font-extrabold text-slate-800">{title}</h3><p className="mt-0.5 text-[8.5px] font-medium leading-tight text-slate-500">{desc}</p></div></div>)}</div>
          </section>

          <footer className="absolute inset-x-0 bottom-0 h-[198px] overflow-hidden bg-[#102b4e] px-10 py-6 text-white">
            <div className="absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-blue-500 via-orange-500 to-emerald-500" />
            <div className="flex h-full items-center justify-between">
              <div className="max-w-[475px]"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#a8f000]">One platform. Every fitness goal.</p><h2 className="mt-2 text-[25px] font-black leading-tight">Ready to find your<br/>fitness Saathi?</h2><div className="mt-4 flex gap-5 text-[10px] font-semibold text-blue-100"><span className="flex items-center gap-1.5"><CalendarCheck className="h-4 w-4 text-orange-400"/>Easy booking</span><span className="flex items-center gap-1.5"><Camera className="h-4 w-4 text-orange-400"/>Smart attendance</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-orange-400"/>Verified community</span></div></div>
              <div className="flex items-center gap-4 rounded-2xl bg-white p-3 text-[#102b4e] shadow-xl">{qr ? <img src={qr} alt="QR code to visit fitsaathi.vercel.app" className="h-[112px] w-[112px]"/> : <QrCode className="h-[112px] w-[112px]"/>}<div className="w-[125px]"><p className="text-[13px] font-black leading-tight">Scan to Visit<br/>FitSaathi Now!</p><p className="mt-2 break-all text-[10px] font-bold text-blue-700">fitsaathi.vercel.app</p></div></div>
            </div>
          </footer>
        </div>
      </div>
      <p className="pamphlet-toolbar mx-auto mt-4 max-w-[794px] text-center text-xs text-slate-500">A4-ready • High-resolution PNG • For digital sharing and print</p>
    </main>
  );
}
