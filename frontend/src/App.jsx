import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminProducts from "./AdminProducts.jsx";

const TOKEN_KEY = "living_space_token";
const LEGACY_TOKEN_KEY = "northline_token";
const PRODUCT_CATEGORIES = [
  "Kitchen Essentials",
  "Living Room (Sala)",
  "Bedroom Essentials",
  "Bathroom Essentials",
  "Cleaning Supplies",
  "Home Appliances",
  "Dining Room Essentials",
  "Home Decorations",
  "Laundry Essentials",
];
const paymentDemoFields = {
  gcash: [
    { name: "accountName", label: "Demo account name", placeholder: "e.g. Alex Sample", type: "text" },
    { name: "mobileNumber", label: "Demo mobile number", placeholder: "e.g. 09xx xxx xxxx", type: "tel" },
  ],
  maya: [
    { name: "accountName", label: "Demo account name", placeholder: "e.g. Alex Sample", type: "text" },
    { name: "mobileNumber", label: "Demo mobile number", placeholder: "e.g. 09xx xxx xxxx", type: "tel" },
  ],
  card: [
    { name: "cardholderName", label: "Cardholder name (demo)", placeholder: "e.g. Alex Sample", type: "text" },
    { name: "lastFour", label: "Last 4 digits only", placeholder: "0000", type: "text", inputMode: "numeric", pattern: "[0-9]{4}", maxLength: 4 },
  ],
  online_banking: [
    { name: "bank", label: "Demo bank", type: "select", options: ["BDO", "BPI", "Land Bank", "Metrobank", "UnionBank", "Other"] },
    { name: "accountName", label: "Demo account name", placeholder: "e.g. Alex Sample", type: "text" },
  ],
  qrph: [
    { name: "payerName", label: "Demo payer name", placeholder: "e.g. Alex Sample", type: "text" },
    { name: "reference", label: "Demo payment reference", placeholder: "e.g. DEMO-12345", type: "text" },
  ],
};
const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  return legacyToken || "";
}

async function api(path, options = {}, token) {
  const headers = { Accept: "application/json", ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new Error("Could not reach the store. Check your connection and try again.");
  }
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const detail = data?.detail || data?.message || data?.error ||
      (data && typeof data === "object" ? Object.values(data).flat().join(" ") : "");
    const error = new Error(detail || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const idOf = (value) => value?.id ?? value?.UniqueID ?? value?.unique_id ?? value?.product_id ?? value?.productId;
const productName = (product) => product?.name ?? product?.title ?? "Product";
const productPrice = (product) => Number(product?.price ?? product?.unit_price ?? 0);
const productImage = (product) => product?.thumbnail || product?.image || product?.image_url || "";
const unwrapList = (data, keys) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.results)) return data.results;
  return [];
};
const asProduct = (product) => ({
  ...product,
  id: idOf(product),
  name: productName(product),
  price: productPrice(product),
  thumbnail: productImage(product),
  stock: product?.stock == null ? Number.POSITIVE_INFINITY : Number(product.stock),
});

const styles = {
  siteShell: "mx-auto min-w-[320px] w-[calc(100%-80px)] max-w-[1440px] bg-[#f6f5f1] text-[15px] text-[#29332c] antialiased [font-family:Outfit,sans-serif] max-[900px]:w-[calc(100%-40px)] max-[620px]:w-[calc(100%-28px)]",
  announcement: "relative flex h-[38px] items-center justify-center rounded-t-[22px] bg-[#dce8df] text-[12px] tracking-[0.02em] text-[#425b49] max-[620px]:h-[34px] max-[620px]:text-[11px]",
  announcementNote: "absolute right-5 text-[10px] uppercase tracking-[0.1em] text-[#627a68] max-[760px]:hidden",
  siteHeader: "sticky top-2 z-10 grid h-[76px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-[22px] border border-white/80 bg-white/65 px-6 shadow-[0_8px_32px_rgba(54,75,60,0.08)] backdrop-blur-xl max-[1000px]:gap-1.5 max-[900px]:px-4 max-[760px]:h-[68px] max-[760px]:grid-cols-[1fr_auto] max-[620px]:rounded-[18px]",
  wordmark: "w-fit text-[22px] font-semibold tracking-[-0.06em] text-[#344b3b] [font-family:Outfit,sans-serif] max-[620px]:text-[20px]",
  mainNav: "flex justify-center gap-4 whitespace-nowrap text-[13px] text-[#5d6b60] [&>button]:cursor-pointer [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-inherit [&>button]:transition-colors [&>button]:duration-150 [&>button]:hover:text-[#52765d] max-[1100px]:gap-2 max-[760px]:fixed max-[760px]:bottom-4 max-[760px]:left-1/2 max-[760px]:z-20 max-[760px]:-translate-x-1/2 max-[760px]:gap-1 max-[760px]:rounded-full max-[760px]:border max-[760px]:border-white/80 max-[760px]:bg-white/90 max-[760px]:p-1.5 max-[760px]:shadow-lg max-[760px]:backdrop-blur-xl [&>button]:rounded-full [&>button]:px-4 [&>button]:py-2 max-[760px]:[&>button]:text-[12px]",
  headerActions: "flex min-w-0 items-center justify-end gap-5 max-[1100px]:gap-3 max-[900px]:gap-2 max-[620px]:gap-3",
  searchBox: "store-search flex w-[clamp(110px,13vw,180px)] shrink items-center gap-2 border-b border-[#cbd6ca] px-1 py-2 transition-colors focus-within:border-[#718f76] max-[760px]:hidden",
  mobileSearch: "store-search mb-4 flex items-center gap-2 border-b border-[#cbd6ca] px-1 py-3 transition-colors focus-within:border-[#718f76] min-[761px]:hidden",
  icon: "h-[17px] w-[17px] shrink-0 fill-none stroke-current stroke-[1.4] [stroke-linecap:round] [stroke-linejoin:round]",
  iconArrow: "h-[17px] w-[17px] shrink-0 fill-none stroke-current stroke-[1.3] transition-transform duration-150 group-hover:translate-x-[3px] [stroke-linecap:round] [stroke-linejoin:round]",
  searchInput: "store-search-input min-w-0 w-full flex-1 border-0 bg-transparent py-0.5 text-[13px] text-[#29332c] outline-none placeholder:text-[#849087]",
  accountActions: "flex items-center gap-4 whitespace-nowrap max-[1100px]:gap-2 max-[900px]:gap-1.5 max-[620px]:gap-2",
  textButton: "cursor-pointer border-0 bg-transparent p-0 text-[12px] text-[#536558] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#52765d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#91a995] active:scale-95 max-[620px]:text-[11px]",
  bagButton: "flex cursor-pointer items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-2 text-[12px] shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91a995] active:scale-95 max-[620px]:gap-1.5 max-[620px]:px-2.5",
  bagLabel: "max-[620px]:hidden",
  bagCount: "grid h-[22px] w-[22px] place-items-center rounded-full bg-[#dce8df] text-[11px] text-[#425b49]",
  hero: "relative grid min-h-[480px] grid-cols-[0.9fr_1.1fr] gap-5 py-10 pb-[58px] max-[900px]:min-h-[420px] max-[760px]:grid-cols-1 max-[760px]:gap-7 max-[760px]:py-8 max-[760px]:pb-[60px] min-[1441px]:min-h-[540px]",
  heroCopy: "flex flex-col items-start justify-center rounded-[28px] border border-white/75 bg-white/45 px-[8.5%] py-8 shadow-[0_12px_36px_rgba(76,92,76,0.06)] backdrop-blur-lg max-[900px]:px-[6%] max-[760px]:px-7 max-[620px]:rounded-[22px] max-[620px]:px-5 max-[620px]:py-6",
  eyebrow: "m-0 text-[10px] font-semibold tracking-[0.13em] text-[#718174]",
  heroTitle: "mb-5 mt-5 text-[clamp(48px,5.4vw,76px)] font-medium leading-[1.02] tracking-[-0.055em] text-[#2f3c32] [font-family:Outfit,sans-serif] max-[760px]:text-[clamp(48px,10vw,70px)] max-[620px]:my-4 max-[620px]:text-[clamp(44px,12vw,62px)]",
  heroDescription: "mb-7 max-w-[360px] text-[15px] leading-[1.75] text-[#748076] max-[620px]:mb-6 max-[620px]:max-w-[320px] max-[620px]:text-[14px]",
  primaryLink: "group inline-flex items-center gap-3 rounded-full border border-[#9eafa0] bg-white/55 px-5 py-3 text-[13px] text-[#45634d] shadow-sm backdrop-blur transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#75907a] hover:bg-white/85 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#91a995] active:translate-y-0 active:scale-[0.98]",
  heroFootnote: "mt-10 flex items-center gap-[9px] text-[11px] text-[#79867b] max-[760px]:hidden",
  footnoteLine: "h-px w-[21px] bg-[#b5c2b5]",
  heroImage: "before:absolute before:inset-0 before:bg-[rgba(47,65,50,0.10)] relative flex min-h-[382px] items-end justify-between overflow-hidden rounded-[28px] bg-[#e8e1d4] bg-cover bg-[center_51%] p-6 shadow-[0_18px_48px_rgba(61,74,60,0.12)] [background-image:linear-gradient(180deg,transparent_68%,rgb(37_52_42_/_42%)_100%),url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=90')] max-[900px]:min-h-[330px] max-[760px]:min-h-[360px] max-[620px]:min-h-[280px] max-[620px]:rounded-[22px] max-[620px]:bg-center max-[620px]:p-4 min-[1441px]:min-h-[440px]",
  imageCaption: "relative z-[1] flex w-full justify-between text-[10px] tracking-[0.1em] text-white",
  heroStamp: "absolute right-6 top-6 grid h-[68px] w-[68px] rotate-[12deg] place-content-center rounded-full border border-white/75 bg-white/10 text-center text-[8px] leading-[1.6] tracking-[0.1em] text-white backdrop-blur-sm",
  heroIndex: "absolute bottom-5 left-[8.5%] flex gap-3 text-[10px] tracking-[0.1em] text-[#758176] max-[900px]:left-[6%] max-[760px]:left-7 max-[620px]:bottom-5 max-[620px]:left-5",
  collection: "border-t border-[#dfe4da] py-[58px] pb-[76px] max-[620px]:py-10 max-[620px]:pb-12",
  collectionHeading: "flex items-end justify-between max-[760px]:block",
  collectionTitle: "mt-4 text-[clamp(36px,4.2vw,52px)] font-medium leading-[1.1] tracking-[-0.045em] text-[#344137] [font-family:Outfit,sans-serif] max-[620px]:mt-3 max-[620px]:text-[clamp(32px,8vw,42px)]",
  mobileBreak: "hidden max-[620px]:inline",
  textLink: "group mb-2 inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-[#cbd6ca] bg-white/50 px-4 py-2.5 text-[12px] text-[#526c57] shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#aebfae] hover:bg-white/85 hover:text-[#3e6047] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#91a995] active:translate-y-0 active:scale-[0.98] max-[760px]:mt-4",
  collectionTools: "mb-5 mt-8 flex items-center justify-between border-b border-[#dfe4da] pb-4 max-[620px]:mt-6",
  productTotal: "text-[10px] tracking-[0.1em] text-[#79877b]",
  categoryFilters: "mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]",
  categoryChip: "shrink-0 cursor-pointer rounded-full border border-[#d6dfd5] bg-white/55 px-4 py-2 text-[12px] text-[#56685a] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9eafa0] hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91a995]",
  categoryChipActive: "border-[#91a995] bg-[#dce8df] text-[#344b3b] shadow-sm",
  categorySection: "mb-12 last:mb-0",
  categoryHeading: "mb-4 flex items-end justify-between border-b border-[#dfe4da] pb-3",
  categoryTitle: "m-0 text-[22px] font-medium tracking-[-0.03em] text-[#344137] [font-family:Outfit,sans-serif] max-[620px]:text-[18px]",
  categoryCount: "text-[11px] text-[#78857a]",
  inlineError: "mt-4 rounded-2xl border border-[#ead4c9] bg-[#fff6f1]/80 px-4 py-3 text-[13px] leading-[1.5] text-[#893c2e] backdrop-blur",
  emptyState: "py-14 text-center text-[15px] text-[#78857a]",
  errorState: "flex flex-col items-center gap-3 [&>p]:m-0",
  outlineButton: "cursor-pointer rounded-full border border-[#bdcbbd] bg-white/60 px-5 py-3 text-[12px] text-[#4d6753] shadow-sm backdrop-blur transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#78927d] hover:bg-white/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#91a995] active:translate-y-0 active:scale-[0.98]",
  productGrid: "grid grid-cols-4 gap-5 max-[1024px]:grid-cols-3 max-[1024px]:gap-4 max-[700px]:grid-cols-2 max-[700px]:gap-x-3 max-[700px]:gap-y-5",
  productCard: "min-w-0 rounded-[22px] border border-white/75 bg-white/50 p-2.5 shadow-[0_8px_28px_rgba(76,92,76,0.06)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:bg-white/75 hover:shadow-[0_14px_32px_rgba(76,92,76,0.1)] max-[620px]:rounded-[18px] max-[620px]:p-2",
  productImage: "relative aspect-[0.86] overflow-hidden rounded-[16px] bg-[#e9e4da] max-[620px]:aspect-[0.78] max-[620px]:rounded-[13px]",
  productImg: "absolute inset-0 h-full w-full object-cover transition-transform duration-400 group-hover:scale-[1.035]",
  imagePlaceholder: "grid h-full w-full place-items-center rounded-[16px] bg-[linear-gradient(140deg,#e8e5dc,#d8d8ce)] text-[42px] tracking-[-0.1em] text-[#a7a99f] [font-family:Outfit,sans-serif]",
  productLabel: "absolute left-3 top-3 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-[9px] tracking-[0.08em] text-[#4d5a50] backdrop-blur-md max-[620px]:left-2 max-[620px]:top-2 max-[620px]:px-2 max-[620px]:text-[8px]",
  productInfo: "flex min-h-[126px] flex-col justify-between gap-3 px-1 pb-1 pt-4 text-[13px] max-[620px]:min-h-[138px] max-[620px]:gap-2 max-[620px]:pt-3",
  productNamePrice: "flex items-start justify-between gap-2",
  productName: "mb-1.5 text-[14px] font-medium text-[#354238] max-[620px]:text-[12px]",
  productDescription: "m-0 line-clamp-2 text-[12px] leading-relaxed text-[#7d887f] max-[620px]:text-[10px]",
  productPrice: "shrink-0 text-[13px] font-medium text-[#526c57] max-[620px]:text-[11px]",
  productStock: "m-0 text-[11px] text-[#78857a] max-[620px]:text-[10px]",
  productActions: "grid grid-cols-2 gap-2 px-1 pb-1",
  cardAction: "min-h-10 cursor-pointer rounded-full border px-2 text-[11px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91a995] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 max-[620px]:text-[10px]",
  cardActionPrimary: "border-[#91a995] bg-[#91a995] text-white hover:bg-[#7e9984]",
  cardActionSecondary: "border-[#cbd6ca] bg-white/65 text-[#526c57] hover:bg-white",
  siteFooter: "flex min-h-[92px] items-center justify-between border-t border-[#dfe4da] max-[620px]:flex-wrap max-[620px]:gap-3 max-[620px]:py-5",
  footerWordmark: "text-[17px]",
  footerText: "m-0 text-[12px] text-[#78857a] max-[620px]:order-1 max-[620px]:w-full",
  footerNote: "m-0 text-[10px] tracking-[0.08em] text-[#78857a]",
  overlay: "fixed inset-0 z-20 flex justify-end bg-[rgba(39,54,43,0.32)] backdrop-blur-sm",
  detailsOverlay: "fixed inset-0 z-30 flex items-center justify-center bg-[rgba(39,54,43,0.42)] p-4 backdrop-blur-sm",
  detailsPanel: "relative max-h-[calc(100dvh-32px)] w-full max-w-[820px] overflow-auto rounded-[28px] border border-white/80 bg-[#f6f5f1]/95 p-6 shadow-[0_24px_80px_rgba(27,39,29,0.24)] backdrop-blur-2xl max-[620px]:rounded-[22px] max-[620px]:p-4",
  detailsHeading: "mb-5 flex items-start justify-between",
  detailsLayout: "grid grid-cols-2 gap-7 max-[620px]:grid-cols-1 max-[620px]:gap-5",
  detailsImage: "relative aspect-square overflow-hidden rounded-[20px] bg-[#e9e4da] max-[620px]:max-h-[34vh]",
  detailsImageElement: "h-full w-full object-cover",
  detailsCopy: "flex flex-col items-start",
  detailsProductName: "mb-2 mt-3 text-[clamp(28px,4vw,40px)] font-medium leading-tight tracking-[-0.04em] text-[#344137] [font-family:Outfit,sans-serif]",
  detailsMeta: "mb-5 text-[12px] leading-relaxed text-[#78857a]",
  detailsDescription: "mb-5 text-[14px] leading-[1.8] text-[#59675c]",
  detailsPrice: "mb-3 text-[22px] font-medium text-[#526c57]",
  detailsStock: "mb-6 text-[12px] text-[#78857a]",
  detailsAdd: "mt-auto min-h-[48px] w-full",
  sidePanel: "relative flex min-h-full w-full flex-col overflow-auto border-l border-white/70 bg-[#f6f5f1]/90 px-[clamp(22px,5vw,48px)] py-[34px] shadow-[-12px_0_40px_rgba(0,0,0,0.1)] backdrop-blur-2xl max-w-[520px]",
  panelHeading: "flex items-start justify-between border-b border-[#dfe4da] pb-6",
  panelTitle: "mt-[10px] text-[32px] font-medium tracking-[-0.04em] text-[#344137] [font-family:Outfit,sans-serif]",
  panelCount: "text-[18px] text-[#78857a]",
  closeButton: "grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#d5dfd5] bg-white/60 text-[23px] leading-none text-[#526458] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:rotate-3 hover:border-[#9eb29f] hover:bg-white/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91a995] active:scale-95",
  panelEmpty: "flex flex-1 flex-col items-center justify-center gap-[17px] text-center text-[#81857c] [&>p]:m-0 [&>p]:text-[13px] [&>svg]:w-[29px] [&>svg]:fill-none [&>svg]:stroke-[#8d9187] [&>svg]:stroke-[1.4] [&>svg]:[stroke-linecap:round] [&>svg]:[stroke-linejoin:round]",
  cartLines: "flex-1",
  cartLine: "grid grid-cols-[82px_minmax(0,1fr)_auto] gap-[15px] border-b border-[#dedfd8] py-5",
  cartImage: "h-[98px] w-[82px] rounded-xl object-cover",
  cartImagePlaceholder: "grid h-[98px] w-[82px] place-items-center rounded-xl bg-[linear-gradient(140deg,#e8e5dc,#d8d8ce)] text-[26px] tracking-[-0.1em] text-[#a7a99f] [font-family:Outfit,sans-serif]",
  cartLineInfo: "min-w-0 [&>h3]:mb-[6px] [&>h3]:mt-[2px] [&>h3]:text-[14px] [&>h3]:font-medium [&>p]:mb-[13px] [&>p]:text-[12px] [&>p]:text-[#78857a]",
  quantityControl: "inline-flex items-center overflow-hidden rounded-lg border border-[#dedfd8] [&>button]:h-[30px] [&>button]:w-8 [&>button]:cursor-pointer [&>button]:border-0 [&>button]:bg-transparent [&>button]:transition-all [&>button]:duration-150 [&>button:hover]:bg-[#e4ede3] [&>button:hover]:text-[#45634d] [&>button:focus-visible]:outline-2 [&>button:focus-visible]:outline-[#91a995] [&>button:active]:scale-95 [&>button]:disabled:cursor-wait [&>button]:disabled:opacity-55 [&>span]:min-w-5 [&>span]:text-center [&>span]:text-[11px]",
  lineEnd: "flex flex-col items-end justify-between py-[2px] [&>strong]:text-[13px] [&>strong]:font-medium",
  removeButton: "cursor-pointer border-0 bg-transparent p-0 text-[11px] text-[#68796c] underline decoration-1 underline-offset-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#52765d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91a995] active:scale-95 disabled:cursor-wait disabled:opacity-55",
  cartSummary: "pt-5 [&>div]:flex [&>div]:justify-between [&>div]:text-[14px] [&_strong]:text-[14px] [&_strong]:font-medium [&>p]:mb-[18px] [&>p]:mt-[9px] [&>p]:text-[12px] [&>p]:text-[#78857a]",
  checkoutButton: "min-h-[50px] w-full cursor-pointer rounded-full border border-white/40 bg-[#91a995] text-[14px] font-medium text-white shadow-[0_8px_20px_rgba(92,122,98,0.18)] transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-[#7e9984] hover:shadow-[0_12px_26px_rgba(92,122,98,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6f8d75] active:translate-y-0 active:scale-[0.99] disabled:cursor-wait disabled:opacity-55",
  authPanel: "relative m-auto max-h-[calc(100%-32px)] w-[min(calc(100%-32px),460px)] self-center overflow-auto rounded-[28px] border border-white/80 bg-[#f8f8f3]/85 p-11 shadow-[0_20px_70px_rgba(38,57,43,0.2)] backdrop-blur-2xl max-[620px]:rounded-[24px] max-[620px]:px-6 max-[620px]:pb-8 max-[620px]:pt-10",
  authClose: "absolute right-5 top-5",
  authTitle: "mt-4 text-[36px] font-medium tracking-[-0.04em] text-[#344137] [font-family:Outfit,sans-serif]",
  authDescription: "mb-6 mt-3 text-[13px] leading-[1.7] text-[#78857a]",
  authForm: "grid gap-[15px] [&>label]:grid [&>label]:gap-[7px] [&>label]:text-[10px] [&_input]:min-h-[42px] [&_input]:w-full [&_input]:border [&_input]:border-[#dedfd8] [&_input]:bg-[#fbfaf7] [&_input]:px-[11px] [&_input]:outline-[#68796e] [&>button]:mt-[5px]",
  authSwitch: "mt-5 text-center text-[12px] text-[#78857a] [&>button]:cursor-pointer [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-[#45634d] [&>button]:underline [&>button]:underline-offset-[3px] [&>button:hover]:text-[#52765d]",
  orderNotice: "mt-4 rounded-2xl border border-[#d4e2d5] bg-[#e5efe5]/75 px-4 py-3 text-[12px] text-[#45634d] backdrop-blur",
  ordersList: "flex-1",
  orderCard: "my-3 grid gap-3 rounded-2xl border border-white/80 bg-white/55 p-4 shadow-sm backdrop-blur-md [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&>div]:text-[13px] [&>div>span]:text-[12px] [&>div>span]:text-[#78857a] [&>p]:m-0 [&>p]:text-[12px] [&>p]:leading-[1.6] [&>p]:text-[#78857a] [&>strong]:text-[14px] [&>strong]:font-medium",
};

function ArrowIcon() {
  return <svg className={styles.iconArrow} viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>;
}

function BagIcon() {
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
}

function ThemeIcon({ darkMode }) {
  return darkMode ? (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
      <path d="M20.2 15.1A8.3 8.3 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === "/shop" ? "shop" :
      path === "/checkout" ? "checkout" :
        path === "/admin/products" ? "admin" : "home";
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(PRODUCT_CATEGORIES);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortControlRef = useRef(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersBusy, setOrdersBusy] = useState(false);
  const [orderNotice, setOrderNotice] = useState("");
  const [busyItem, setBusyItem] = useState(null);
  const [cartError, setCartError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [checkoutAddressId, setCheckoutAddressId] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod");
  const [paymentDemoDetails, setPaymentDemoDetails] = useState({});
  const [buyNowProduct, setBuyNowProduct] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportNotice, setSupportNotice] = useState("");
  const [accountError, setAccountError] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("living_space_theme") === "dark");

  const navigateTo = useCallback((page, category = null, product = null) => {
    if (category) setSelectedCategory(category);
    const path = page === "checkout"
      ? `/checkout${product ? `?buyNow=${encodeURIComponent(product.id)}` : ""}`
      : page === "shop" ? "/shop" : page === "admin" ? "/admin/products" : "/";
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    else if (window.location.href !== new URL(path, window.location.origin).href) {
      window.history.pushState({}, "", path);
    }
    setCurrentPage(page);
    setBuyNowProduct(product);
    setCompletedOrder(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const data = await api("/api/products/");
      setProducts(unwrapList(data, ["products"]).map(asProduct).filter((product) => product.is_active !== false));
      const categoryData = await api("/api/categories/");
      const loadedCategories = unwrapList(categoryData, ["categories"]);
      if (loadedCategories.length) setCategories(loadedCategories);
    } catch (error) {
      setProductsError(error.message);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadCart = useCallback(async (activeToken = token) => {
    if (!activeToken) {
      setCart({ items: [], total: 0 });
      return;
    }
    const data = await api("/api/cart/", {}, activeToken);
    const cartData = data?.cart ?? data;
    const rawItems = cartData?.items ?? cartData?.cart_items ?? cartData?.cartItems ?? [];
    const items = (Array.isArray(rawItems) ? rawItems : []).map((entry) => {
      const rawProduct = entry?.product ?? entry?.item ?? entry;
      const product = asProduct(rawProduct);
      const productId = idOf(rawProduct) ?? idOf(entry);
      return {
        ...entry,
        product: { ...product, id: productId },
        quantity: Math.max(1, Number(entry?.quantity ?? entry?.qty ?? 1)),
      };
    });
    const total = Number(cartData?.total ?? items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
    setCart({ items, total });
  }, [token]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    if (!sortMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!sortControlRef.current?.contains(event.target)) setSortMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
        sortControlRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [sortMenuOpen]);

  useEffect(() => {
    let active = true;
    api("/api/payment-methods/")
      .then((methods) => {
        if (active && Array.isArray(methods)) {
          setPaymentMethods(methods);
          setPaymentMethodsError("");
        }
      })
      .catch((error) => {
        if (active) setPaymentMethodsError(error.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleHistoryChange = () => {
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      const page = path === "/shop" ? "shop" : path === "/checkout" ? "checkout" :
        path === "/admin/products" ? "admin" : "home";
      setCurrentPage(page);
      if (page === "checkout") {
        const productId = new URLSearchParams(window.location.search).get("buyNow");
        setBuyNowProduct(products.find((product) => String(product.id) === productId) ?? null);
      } else {
        setBuyNowProduct(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, [products]);

  useEffect(() => {
    if (currentPage !== "checkout" || !products.length) return;
    const productId = new URLSearchParams(window.location.search).get("buyNow");
    setBuyNowProduct(products.find((product) => String(product.id) === productId) ?? null);
  }, [currentPage, products]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setCart({ items: [], total: 0 });
      return;
    }
    let active = true;
    api("/api/auth/me/", {}, token)
      .then(async (me) => {
        if (!active) return;
        setUser(me?.user ?? me);
        try {
          await loadCart(token);
          if (active) setCartError("");
        } catch (error) {
          if (active) setCartError(error.message);
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken("");
          setUser(null);
        }
      });
    return () => { active = false; };
  }, [token, loadCart]);

  useEffect(() => {
    if (!token) {
      setAddresses([]);
      setWishlistIds([]);
      return;
    }
    let active = true;
    Promise.all([
      api("/api/addresses/", {}, token),
      api("/api/wishlist/", {}, token),
    ]).then(([savedAddresses, wishlist]) => {
      if (!active) return;
      setAddresses(unwrapList(savedAddresses, ["addresses"]));
      setWishlistIds(unwrapList(wishlist, ["items"]).map((item) => String(item.product?.id ?? item.product_id)));
      setAccountError("");
    }).catch((error) => {
      if (active) setAccountError(error.message);
    });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (currentPage !== "checkout" || !addresses.length || addresses.some((address) => String(address.id) === checkoutAddressId)) return;
    const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0];
    setCheckoutAddressId(String(defaultAddress.id));
  }, [addresses, checkoutAddressId, currentPage]);

  useEffect(() => {
    localStorage.setItem("living_space_theme", darkMode ? "dark" : "light");
    document.documentElement.style.backgroundColor = darkMode ? "#1c2620" : "#f0f2eb";
  }, [darkMode]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) =>
      (selectedCategory === "All" || product.category === selectedCategory) &&
      (!query || `${product.name} ${product.description ?? ""} ${product.sku ?? ""} ${product.category ?? ""}`.toLowerCase().includes(query)) &&
      (minPrice === "" || product.price >= Number(minPrice)) &&
      (maxPrice === "" || product.price <= Number(maxPrice)) &&
      (!inStockOnly || product.stock > 0),
    ).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price || a.name.localeCompare(b.name);
      if (sortBy === "price_desc") return b.price - a.price || a.name.localeCompare(b.name);
      if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return a.name.localeCompare(b.name);
    });
  }, [products, search, selectedCategory, sortBy, minPrice, maxPrice, inStockOnly]);
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const money = (amount) => `₱${Number(amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const displayedCategories = selectedCategory === "All" ? PRODUCT_CATEGORIES : [selectedCategory];
  const productsByCategory = displayedCategories
    .map((category) => ({
      category,
      products: visibleProducts.filter((product) => product.category === category),
    }))
    .filter((group) => group.products.length > 0);

  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setAuthError("");
    setAuthOpen(true);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const body = { password };
    if (authMode === "register") {
      body.name = String(form.get("name") || "").trim();
      body.username = username;
      body.email = email;
    } else {
      body.username = username;
    }
    try {
      if (authMode === "login") {
        try {
          const adminResult = await api("/api/admin/auth/login/", {
            method: "POST",
            body: JSON.stringify({ username, password }),
          });
          if (!adminResult?.access) {
            throw new Error("The server did not return an admin token.");
          }
          localStorage.setItem("living_space_admin_token", adminResult.access);
          setAuthOpen(false);
          navigateTo("admin");
          return;
        } catch (error) {
          if (error.status !== 401) throw error;
        }
      }

      let result = await api(`/api/auth/${authMode === "register" ? "register" : "login"}/`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (authMode === "register" && !(result?.token ?? result?.access ?? result?.key)) {
        result = await api("/api/auth/login/", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
      }
      const nextToken = result?.token ?? result?.access ?? result?.key;
      if (!nextToken) throw new Error("The server did not return an authentication token.");
      localStorage.setItem(TOKEN_KEY, nextToken);
      setUser(result?.user ?? null);
      setToken(nextToken);
      setAuthOpen(false);
      setCartError("");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const addToCart = async (product) => {
    if (!token) {
      openAuth();
      return;
    }
    setBusyItem(product.id);
    setCartError("");
    try {
      await api("/api/cart/items/", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      }, token);
      await loadCart(token);
      setCartOpen(true);
    } catch (error) {
      setCartError(error.message);
      setCartOpen(true);
    } finally {
      setBusyItem(null);
    }
  };

  const toggleWishlist = async (product) => {
    if (!token) {
      openAuth();
      return;
    }
    setBusyItem(product.id);
    try {
      if (wishlistIds.includes(String(product.id))) {
        await api(`/api/wishlist/${encodeURIComponent(product.id)}/`, { method: "DELETE" }, token);
        setWishlistIds((current) => current.filter((id) => id !== String(product.id)));
      } else {
        await api("/api/wishlist/", {
          method: "POST",
          body: JSON.stringify({ product_id: product.id }),
        }, token);
        setWishlistIds((current) => [...new Set([...current, String(product.id)])]);
      }
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setBusyItem(null);
    }
  };

  const beginCheckout = async (product = null) => {
    setCheckoutError("");
    setCheckoutAddressId("");
    setCompletedOrder(null);
    setCartOpen(false);
    navigateTo("checkout", null, product);
    if (!token) {
      openAuth();
      return;
    }
    try {
      const saved = await api("/api/addresses/", {}, token);
      const list = unwrapList(saved, ["addresses"]);
      setAddresses(list);
      setCheckoutAddressId(String(list.find((address) => address.is_default)?.id ?? list[0]?.id ?? ""));
    } catch (error) {
      setCheckoutError(error.message);
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setProfileError("");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    form.is_default = addresses.length === 0;
    try {
      const address = await api("/api/addresses/", {
        method: "POST",
        body: JSON.stringify(form),
      }, token);
      setAddresses((current) => [address, ...current]);
      setCheckoutAddressId(String(address.id));
      setAddressFormOpen(false);
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const deleteAddress = async (address) => {
    try {
      await api(`/api/addresses/${address.id}/`, { method: "DELETE" }, token);
      setAddresses((current) => current.filter((entry) => entry.id !== address.id));
      if (String(address.id) === checkoutAddressId) setCheckoutAddressId("");
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const updateAddress = async (event, address) => {
    event.preventDefault();
    setProfileError("");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const updated = await api(`/api/addresses/${address.id}/`, {
        method: "PATCH",
        body: JSON.stringify(form),
      }, token);
      setAddresses((current) => current.map((entry) => entry.id === address.id ? updated : entry));
      setEditingAddressId(null);
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const markDefaultAddress = async (address) => {
    try {
      const updated = await api(`/api/addresses/${address.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_default: true }),
      }, token);
      setAddresses((current) => current.map((entry) => ({
        ...entry,
        is_default: entry.id === address.id ? true : false,
      })));
      return updated;
    } catch (error) {
      setProfileError(error.message);
      return null;
    }
  };

  const changeQuantity = async (item, quantity) => {
    const productId = item.product.id;
    setBusyItem(productId);
    setCartError("");
    try {
      if (quantity <= 0) {
        await api(`/api/cart/items/${encodeURIComponent(productId)}/`, { method: "DELETE" }, token);
      } else {
        await api(`/api/cart/items/${encodeURIComponent(productId)}/`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        }, token);
      }
      await loadCart(token);
    } catch (error) {
      setCartError(error.message);
    } finally {
      setBusyItem(null);
    }
  };

  const loadOrders = async () => {
    if (!token) {
      openAuth();
      return;
    }
    setOrdersOpen(true);
    setOrdersBusy(true);
    setOrderNotice("");
    try {
      setOrders(unwrapList(await api("/api/orders/", {}, token), ["orders"]));
    } catch (error) {
      setOrderNotice(error.message);
    } finally {
      setOrdersBusy(false);
    }
  };

  const checkout = async () => {
    if (!token) {
      openAuth();
      return;
    }
    if (!buyNowProduct && !cart.items.length) {
      setCheckoutError("Your bag is empty. Add a product before placing your order.");
      return;
    }
    if (!checkoutAddressId) {
      setCheckoutError("Add or choose a saved delivery address in Account before placing your order.");
      return;
    }
    if (!selectedPaymentMethodInfo?.enabled) {
      setCheckoutError("Payment methods are still loading or unavailable. Please try again.");
      return;
    }
    const requiredDemoFields = paymentDemoFields[selectedPaymentMethod] ?? [];
    const invalidDemoField = requiredDemoFields.find((field) => {
      const value = paymentDemoDetails[field.name]?.trim() ?? "";
      return !value || (field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(value));
    });
    if (invalidDemoField) {
      setCheckoutError(`Check the ${invalidDemoField.label} field to place your order.`);
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      const endpoint = buyNowProduct ? "/api/checkout/buy-now/" : "/api/checkout/";
      const payload = {
        address_id: Number(checkoutAddressId),
        payment_method: selectedPaymentMethod,
      };
      if (buyNowProduct) {
        payload.product_id = buyNowProduct.id;
        payload.quantity = 1;
      }
      const order = await api(endpoint, { method: "POST", body: JSON.stringify(payload) }, token);
      setOrderNotice(`Order ${order?.order_number ?? order?.id ?? order?.UniqueID ?? ""} placed successfully.`);
      if (!buyNowProduct) await loadCart(token);
      setCompletedOrder(order);
      setBuyNowProduct(null);
      window.history.replaceState({}, "", "/checkout");
      setCartOpen(false);
      setOrders([order, ...orders]);
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        setToken("");
        setUser(null);
        setAuthMode("login");
        setAuthError("Your session expired or was reset. Please sign in again, then place your order.");
        setAuthOpen(true);
        setCheckoutError("Please sign in again to continue checkout.");
        return;
      }
      setCheckoutError(error.message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const simulateDemoPayment = async (result) => {
    if (!token || !completedOrder?.order_number) return;
    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      const updated = await api(
        `/api/orders/${encodeURIComponent(completedOrder.order_number)}/demo-payment/`,
        { method: "POST", body: JSON.stringify({ result }) },
        token,
      );
      setCompletedOrder(updated);
      setOrders((current) => current.map((order) => order.order_number === updated.order_number ? updated : order));
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await api("/api/auth/logout/", { method: "POST" }, token);
    } catch (error) {
      setAccountError(`Signed out locally; server token revocation failed: ${error.message}`);
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setCart({ items: [], total: 0 });
    setOrders([]);
    setAddresses([]);
    setWishlistIds([]);
    setProfileOpen(false);
    setWishlistOpen(false);
    setOrdersOpen(false);
    setCartOpen(false);
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    const name = String(new FormData(event.currentTarget).get("name") || "").trim();
    try {
      const response = await api("/api/auth/me/", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }, token);
      setUser(response.user);
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setProfileError("");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await api("/api/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      }, token);
      localStorage.setItem(TOKEN_KEY, response.access);
      setToken(response.access);
      event.currentTarget.reset();
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const submitSupportMessage = async (event) => {
    event.preventDefault();
    setSupportNotice("");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api("/api/support/messages/", {
        method: "POST",
        body: JSON.stringify(form),
      }, token);
      setSupportNotice("Your message has been sent to our store team.");
      event.currentTarget.reset();
    } catch (error) {
      setSupportNotice(error.message);
    }
  };

  const selectedPaymentMethodInfo = paymentMethods.find((method) => method.id === selectedPaymentMethod);

  return currentPage === "admin" ? <AdminProducts /> : (
    <div className={`${styles.siteShell} store-shell ${darkMode ? "store-dark" : ""}`}>
      <div className={styles.announcement}>
        <span>Thoughtful essentials for every Filipino home</span>
        <span className={styles.announcementNote}>MADE FOR EVERYDAY LIVING</span>
      </div>
      <header className={styles.siteHeader}>
        <a className={styles.wordmark} href="/" aria-label="Living Space home">LIVING SPACE<span className="text-[#91a995]">.</span></a>
        <nav className={styles.mainNav} aria-label="Main navigation">
          <button aria-current={currentPage === "home" ? "page" : undefined} className={currentPage === "home" ? "text-[#344b3b] max-[760px]:bg-[#dce8df]" : ""} onClick={() => navigateTo("home")} type="button">Home</button>
          <button aria-current={currentPage === "shop" ? "page" : undefined} className={currentPage === "shop" ? "text-[#344b3b] max-[760px]:bg-[#dce8df]" : ""} onClick={() => navigateTo("shop")} type="button">Shop</button>
        </nav>
        <div className={styles.headerActions}>
          <label className={styles.searchBox}>
            <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8" /><path d="m13.2 13.2 4 4" /></svg>
            <input className={styles.searchInput} aria-label="Search products" onChange={(event) => { setSearch(event.target.value); if (currentPage !== "shop") navigateTo("shop"); }} placeholder="Search" type="search" value={search} />
          </label>
          {user ? (
            <>
            <div className={`${styles.accountActions} max-[620px]:hidden`}>
              <button className={styles.textButton} onClick={loadOrders} type="button">Orders</button>
              <button className={styles.textButton} onClick={() => setWishlistOpen(true)} type="button">Saved</button>
              <button className={styles.textButton} onClick={() => { setProfileError(""); setProfileOpen(true); }} type="button">Account</button>
              <button className={styles.textButton} onClick={signOut} type="button">Sign out</button>
            </div>
            <button className={`${styles.textButton} hidden max-[620px]:inline`} onClick={() => { setProfileError(""); setProfileOpen(true); }} type="button">Account</button>
            </>
          ) : <button className={styles.textButton} onClick={() => openAuth()} type="button">Log in</button>}
          <button
            className="grid h-8 w-8 cursor-pointer place-items-center border-0 bg-transparent p-0 text-[#526c57] transition-transform duration-200 hover:scale-110 focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91a995] active:scale-95"
            onClick={() => setDarkMode((value) => !value)}
            type="button"
            aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
            title={`Switch to ${darkMode ? "light" : "dark"} mode`}
          >
            <ThemeIcon darkMode={darkMode} />
          </button>
          <button className={styles.bagButton} onClick={() => token ? setCartOpen(true) : openAuth()} type="button" aria-label={`Shopping bag, ${cartCount} items`}>
            <BagIcon /><span className={styles.bagLabel}>Bag</span><span className={styles.bagCount}>{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        {currentPage === "home" ? (
          <div className="py-8 pb-16 max-[620px]:py-5 max-[620px]:pb-24">
            <section className="grid min-h-[min(72vh,720px)] grid-cols-[0.85fr_1.15fr] gap-5 max-[760px]:min-h-0 max-[760px]:grid-cols-1">
              <div className={`${styles.heroCopy} min-h-[470px] max-[760px]:min-h-[350px]`}>
                <p className={styles.eyebrow}>THOUGHTFUL FINDS FOR EVERY ROOM</p>
                <h1 className={`${styles.heroTitle} text-[clamp(54px,7vw,94px)]`}>A softer<br />kind of home.</h1>
                <p className={`${styles.heroDescription} max-w-[410px]`}>Everyday pieces that make your space feel a little more like you. Curated for real homes, chosen to be lived in.</p>
                <a className={styles.primaryLink} href="/shop">Discover the collection <ArrowIcon /></a>
                <div className={styles.heroFootnote}><span className={styles.footnoteLine} />Useful things. Considered carefully.</div>
              </div>
              <div className={`${styles.heroImage} min-h-[470px] max-[760px]:min-h-[340px]`} role="img" aria-label="A thoughtfully styled everyday living room">
                <div className={styles.imageCaption}><span>LIVING SPACE, FOR EVERYDAY</span><span>EST. WITH CARE</span></div>
                <div className={styles.heroStamp}>LIVE<br />WELL<br />AT HOME</div>
              </div>
            </section>

            <section className="py-16 max-[620px]:py-10">
              <div className="mb-7 flex items-end justify-between gap-4 max-[620px]:block">
                <div><p className={styles.eyebrow}>FIND YOUR ROOM</p><h2 className={styles.collectionTitle}>A little something<br className={styles.mobileBreak} /> for every corner.</h2></div>
                <button className={styles.textLink} onClick={() => { setSelectedCategory("All"); navigateTo("shop"); }} type="button">Shop all categories <ArrowIcon /></button>
              </div>
              <div className="grid grid-cols-3 gap-4 max-[760px]:grid-cols-2 max-[460px]:grid-cols-1">
                {categories.slice(0, 6).map((category, index) => {
                  const images = [
                    "photo-1556911220-bff31c812dba", "photo-1600210492486-724fe5c67fb0",
                    "photo-1616486338812-3dadae4b4ace", "photo-1600566753086-00f18fb6b3ea",
                    "photo-1584622650111-993a426fbf0a", "photo-1600607687939-ce8a6c25118c",
                  ];
                  const categoryProduct = products.find((product) => product.category === category);
                  return <button className="group relative min-h-[190px] overflow-hidden rounded-[22px] border border-white/75 bg-[#e7e5dc] text-left shadow-[0_8px_28px_rgba(76,92,76,0.07)] max-[460px]:min-h-[150px]" key={category} onClick={() => navigateTo("shop", category)} type="button">
                    <img alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" src={categoryProduct?.thumbnail || `https://images.unsplash.com/${images[index % images.length]}?auto=format&fit=crop&w=800&q=80`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1f2c22]/75 via-[#1f2c22]/10 to-transparent" />
                    <span className="absolute bottom-5 left-5 right-5 text-lg font-medium text-white">{category}</span>
                  </button>;
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#dfe4da] bg-white/40 px-8 py-12 max-[620px]:rounded-[22px] max-[620px]:px-5 max-[620px]:py-8">
              <div className="mb-7 flex items-end justify-between gap-4">
                <div><p className={styles.eyebrow}>A FEW FAVORITES</p><h2 className={styles.categoryTitle}>Everyday, made better.</h2></div>
                <button className={styles.textLink} onClick={() => navigateTo("shop")} type="button">View the shop <ArrowIcon /></button>
              </div>
              {productsLoading ? <p className={styles.emptyState}>Finding thoughtful favorites…</p> : productsError ? <p className={styles.inlineError}>{productsError}</p> : (
                <div className={styles.productGrid}>
                  {products.slice(0, 4).map((product) => <article className={`group ${styles.productCard}`} key={product.id}>
                    <button className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left" onClick={() => setSelectedProduct(product)} type="button">
                      <div className={styles.productImage}><div className={styles.imagePlaceholder}>LS.</div>{product.thumbnail && <img alt={product.name} className={styles.productImg} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} src={product.thumbnail} />}</div>
                      <div className={styles.productInfo}><div className={styles.productNamePrice}><h3 className={styles.productName}>{product.name}</h3><span className={styles.productPrice}>{money(product.price)}</span></div><p className={styles.productDescription}>{product.description}</p></div>
                    </button>
                    <div className={styles.productActions}><button className={`${styles.cardAction} ${styles.cardActionPrimary} col-span-2`} disabled={product.stock <= 0 || busyItem === product.id} onClick={() => addToCart(product)} type="button">{busyItem === product.id ? "Adding…" : "Add to bag"}</button></div>
                  </article>)}
                </div>
              )}
            </section>

            <section className="my-14 grid grid-cols-3 gap-5 border-y border-[#dfe4da] py-8 text-center max-[620px]:grid-cols-1 max-[620px]:gap-7">
              <div><p className={styles.eyebrow}>MADE FOR DAILY LIFE</p><p className="mt-2 text-sm text-[#657368]">Useful essentials for the way you live.</p></div>
              <div><p className={styles.eyebrow}>A HOME FOR EVERYONE</p><p className="mt-2 text-sm text-[#657368]">Thoughtful finds across nine home categories.</p></div>
              <div><p className={styles.eyebrow}>SHOP WITH CONFIDENCE</p><p className="mt-2 text-sm text-[#657368]">Secure accounts and Cash on Delivery checkout.</p></div>
            </section>
          </div>
        ) : currentPage === "shop" ? (
        <section className={styles.collection} id="shop">
          <div className={styles.collectionHeading}>
            <div><p className={styles.eyebrow}>THE LIVING SPACE COLLECTION</p><h1 className={styles.collectionTitle}>Find your everyday<br className={styles.mobileBreak} /> favorites.</h1><p className={styles.heroDescription}>Browse thoughtful essentials for every room, at your own pace.</p></div>
            <button className={styles.textLink} onClick={() => { setSelectedCategory("All"); setSearch(""); }} type="button">Clear filters <ArrowIcon /></button>
          </div>
          <div className={styles.collectionTools}>
            <span className={styles.productTotal}>{productsLoading ? "LOADING" : `${visibleProducts.length.toString().padStart(2, "0")} PRODUCTS`}</span>
            <div className="flex items-center gap-2 text-[12px] text-[#78857a]">
              <span>Sort</span>
              <div className="sort-control" ref={sortControlRef}>
                <button
                  aria-expanded={sortMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Sort products"
                  className="sort-trigger"
                  onClick={() => setSortMenuOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      setSortMenuOpen(true);
                      requestAnimationFrame(() => sortControlRef.current?.querySelector('[role="menuitemradio"]')?.focus());
                    }
                  }}
                  type="button"
                >
                  <span>{sortOptions.find((option) => option.value === sortBy)?.label}</span>
                  <svg aria-hidden="true" className={`sort-chevron ${sortMenuOpen ? "is-open" : ""}`} viewBox="0 0 16 16" fill="none">
                    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </button>
                <div aria-label="Sort products" className="sort-menu" hidden={!sortMenuOpen} role="menu">
                  {sortOptions.map((option) => (
                    <button
                      aria-checked={sortBy === option.value}
                      className="sort-option"
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setSortMenuOpen(false);
                        sortControlRef.current?.querySelector("button")?.focus();
                      }}
                      onKeyDown={(event) => {
                        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                        event.preventDefault();
                        const options = [...sortControlRef.current.querySelectorAll('[role="menuitemradio"]')];
                        const index = options.indexOf(event.currentTarget);
                        const nextIndex = event.key === "Home" ? 0
                          : event.key === "End" ? options.length - 1
                            : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
                        options[nextIndex]?.focus();
                      }}
                      role="menuitemradio"
                      tabIndex={0}
                      type="button"
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && <span aria-hidden="true" className="sort-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <label className={styles.mobileSearch}>
            <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8" /><path d="m13.2 13.2 4 4" /></svg>
            <input className={styles.searchInput} aria-label="Search products" onChange={(event) => setSearch(event.target.value)} placeholder="Search household essentials" type="search" value={search} />
          </label>
          <div className={styles.categoryFilters} aria-label="Product categories" role="group">
            {["All", ...categories].map((category) => (
              <button
                aria-pressed={selectedCategory === category}
                className={`${styles.categoryChip} ${selectedCategory === category ? styles.categoryChipActive : ""}`}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category === "All" ? "All categories" : category}
              </button>
            ))}
          </div>
          <div className="mb-6 flex flex-wrap items-end gap-3 text-[12px] text-[#68796c]">
            <label className="grid gap-1">Min price<input aria-label="Minimum price" className="w-28 rounded-xl border border-[#d6dfd5] bg-white/70 px-3 py-2" min="0" onChange={(event) => setMinPrice(event.target.value)} type="number" value={minPrice} /></label>
            <label className="grid gap-1">Max price<input aria-label="Maximum price" className="w-28 rounded-xl border border-[#d6dfd5] bg-white/70 px-3 py-2" min="0" onChange={(event) => setMaxPrice(event.target.value)} type="number" value={maxPrice} /></label>
            <label className="flex items-center gap-2 pb-2"><input checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} type="checkbox" /> In stock only</label>
          </div>
          {cartError && !cartOpen && <p className={styles.inlineError} role="alert">{cartError}</p>}
          {accountError && <p className={styles.inlineError} role="alert">{accountError}</p>}
          {productsLoading ? <p className={styles.emptyState} role="status">Loading the collection…</p> : productsError ? (
            <div className={`${styles.emptyState} ${styles.errorState}`} role="alert"><p>{productsError}</p><button className={styles.outlineButton} onClick={loadProducts} type="button">Try again</button></div>
          ) : productsByCategory.length ? (
            productsByCategory.map(({ category, products: categoryProducts }) => (
              <section className={styles.categorySection} key={category} aria-label={category}>
                <div className={styles.categoryHeading}>
                  <h3 className={styles.categoryTitle}>{category}</h3>
                  <span className={styles.categoryCount}>{categoryProducts.length} items</span>
                </div>
                <div className={styles.productGrid}>
                  {categoryProducts.map((product) => (
                    <article className={`group ${styles.productCard}`} key={product.id}>
                      <div className={styles.productImage}>
                        <div className={styles.imagePlaceholder} aria-hidden="true">LS.</div>
                        {product.thumbnail && <img className={styles.productImg} alt={product.name} decoding="async" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} src={product.thumbnail} />}
                        {product.stock <= 0 && <span className={styles.productLabel}>SOLD OUT</span>}
                        <button aria-label={`${wishlistIds.includes(String(product.id)) ? "Remove from" : "Add to"} wishlist: ${product.name}`} aria-pressed={wishlistIds.includes(String(product.id))} className="absolute right-2 top-2 z-[2] grid h-9 w-9 place-items-center rounded-full border border-white/80 bg-white/85 text-lg text-[#526c57] shadow-sm" onClick={() => toggleWishlist(product)} type="button">{wishlistIds.includes(String(product.id)) ? "♥" : "♡"}</button>
                      </div>
                      <div className={styles.productInfo}>
                        <div className={styles.productNamePrice}>
                          <h4 className={styles.productName}>{product.name}</h4>
                          <span className={styles.productPrice}>{money(product.price)}</span>
                        </div>
                        <p className={styles.productDescription}>{product.description || "Everyday household essential."}</p>
                        <p className={styles.productStock}>{product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}</p>
                      </div>
                      <div className={styles.productActions}>
                        <button className={`${styles.cardAction} ${styles.cardActionPrimary}`} disabled={product.stock <= 0 || busyItem === product.id} onClick={() => addToCart(product)} type="button">
                          {busyItem === product.id ? "Adding…" : "Add to cart"}
                        </button>
                        <button className={`${styles.cardAction} ${styles.cardActionSecondary}`} onClick={() => setSelectedProduct(product)} type="button">View details</button>
                        <button className={`${styles.cardAction} ${styles.cardActionSecondary} col-span-2`} disabled={product.stock <= 0} onClick={() => beginCheckout(product)} type="button">Buy now</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : <p className={styles.emptyState}>{search ? "No products match your search. Try another term." : selectedCategory !== "All" ? "No products are available in this category right now." : "No products are available right now."}</p>}
        </section>
        ) : (
          <section className="mx-auto max-w-[920px] px-4 py-12 max-[620px]:px-0 max-[620px]:py-7">
            {completedOrder ? (
              <div className="rounded-[28px] border border-[#dfe4da] bg-white/65 p-8 text-center shadow-[0_12px_36px_rgba(76,92,76,0.06)] backdrop-blur-lg max-[620px]:p-5">
                <p className={styles.eyebrow}>ORDER CONFIRMED</p>
                <h1 className={styles.collectionTitle}>Thank you for your order.</h1>
                <p className="mt-4 text-sm text-[#718074]">Order <strong>{completedOrder.order_number}</strong> is confirmed with {paymentMethods.find((method) => method.id === completedOrder.payment_method)?.label ?? completedOrder.payment_method}.</p>
                <p className="mt-2 text-sm text-[#718074]">Payment status: <strong>{String(completedOrder.payment_status ?? "pending").replaceAll("_", " ")}</strong></p>
                {completedOrder.payment_demo_result && <p className="mt-2 text-sm font-medium text-[#718074]">Demo: simulated {completedOrder.payment_demo_result}. No real payment was processed.</p>}
                {completedOrder.payment_method !== "cod" && <div className="mx-auto mt-5 max-w-[500px] rounded-2xl bg-[#f7f7f1] p-5 text-left">
                  <p className={styles.eyebrow}>DEMO PAYMENT</p>
                  <p className="text-sm text-[#718074]">No real payment is processed. Payment status stays Pending.</p>
                  {!completedOrder.payment_demo_result && <div className="flex flex-wrap gap-3">
                    <button className={styles.checkoutButton} disabled={checkoutBusy} onClick={() => simulateDemoPayment("success")} type="button">Simulate successful payment</button>
                    <button className={styles.outlineButton} disabled={checkoutBusy} onClick={() => simulateDemoPayment("failed")} type="button">Simulate failed payment</button>
                  </div>}
                </div>}
                <p className="mt-2 text-sm text-[#718074]">You can check status and delivery details in your order history.</p>
                <div className="mx-auto mt-7 flex max-w-[420px] gap-3 max-[460px]:flex-col">
                  <button className={styles.outlineButton} onClick={loadOrders} type="button">View my orders</button>
                  <button className={styles.checkoutButton} onClick={() => navigateTo("shop")} type="button">Continue shopping</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div><p className={styles.eyebrow}>YOUR ORDER</p><h1 className={styles.collectionTitle}>Checkout</h1><p className="mt-2 text-sm text-[#78857a]">Review your delivery details and payment before placing your order.</p></div>
                  <button className={styles.outlineButton} onClick={() => navigateTo("shop")} type="button">Back to shop</button>
                </div>
                {checkoutError && <p className={styles.inlineError} role="alert">{checkoutError}</p>}
                {!token ? (
                  <div className="rounded-[24px] border border-[#dfe4da] bg-white/55 p-6 text-center">
                    <p className="text-sm text-[#78857a]">Log in or create an account to continue to checkout.</p>
                    <button className={styles.checkoutButton} onClick={() => openAuth()} type="button">Log in to continue</button>
                  </div>
                ) : completedOrder ? null : (
                  <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 max-[760px]:grid-cols-1">
                    <div className="grid content-start gap-6">
                      <section className="rounded-[24px] border border-[#dfe4da] bg-white/55 p-6 max-[620px]:p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div><p className={styles.eyebrow}>DELIVERY</p><h2 className="mb-0 mt-2 text-xl font-medium">Saved address</h2></div>
                          {addresses.length > 0 && <button className={styles.textButton} onClick={() => { setProfileError(""); setAddressFormOpen(true); setProfileOpen(true); }} type="button">Manage addresses</button>}
                        </div>
                        {addresses.length ? addresses.map((address) => (
                          <label className="my-2 flex cursor-pointer gap-3 rounded-2xl border border-[#dfe4da] bg-white/65 p-4 text-sm" key={address.id}>
                            <input checked={checkoutAddressId === String(address.id)} name="delivery-address" onChange={() => setCheckoutAddressId(String(address.id))} type="radio" />
                            <span><strong>{address.label} · {address.recipient_name}</strong><br />{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}, {address.city}, {address.province} {address.postal_code}<br />{address.phone}{address.is_default ? " · Default" : ""}</span>
                          </label>
                        )) : <div className="rounded-2xl bg-[#f7f7f1] p-5 text-center">
                          <p className="text-sm text-[#78857a]">Wala ka pang naka-save na address. Magdagdag muna nito sa Account bago mag-checkout.</p>
                          <button className={styles.outlineButton} onClick={() => { setProfileError(""); setAddressFormOpen(true); setProfileOpen(true); }} type="button">Set up an address in Account</button>
                        </div>}
                      </section>
                      <section className="rounded-[24px] border border-[#dfe4da] bg-white/55 p-6 max-[620px]:p-4">
                        <p className={styles.eyebrow}>PAYMENT</p><h2 className="mb-4 mt-2 text-xl font-medium">Payment method</h2>
                        {paymentMethodsError && <p className={styles.inlineError} role="alert">Payment options could not be loaded: {paymentMethodsError}</p>}
                        <div className="grid gap-2">
                          {paymentMethods.map((method) => <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm transition-colors ${selectedPaymentMethod === method.id ? "border-[#91a995] bg-[#dce8df]/55" : "border-[#dfe4da] bg-white/55"} ${!method.enabled ? "opacity-75" : ""}`} key={method.id}>
                            <input checked={selectedPaymentMethod === method.id} disabled={!method.enabled} name="payment-method" onChange={() => { setSelectedPaymentMethod(method.id); setPaymentDemoDetails({}); setCheckoutError(""); }} type="radio" value={method.id} />
                            <span className="min-w-0 flex-1"><strong>{method.label}</strong></span>
                            {selectedPaymentMethod === method.id && <span className="text-xs font-medium text-[#52765d]">Selected</span>}
                          </label>)}
                        </div>
                        {selectedPaymentMethod !== "cod" && selectedPaymentMethodInfo?.enabled && <div className="mt-4 rounded-2xl bg-[#f7f7f1] p-4">
                          <h3 className="mb-1 text-sm font-medium">{selectedPaymentMethodInfo.label} demo details</h3>
                          <p className="mb-3 text-xs leading-5 text-[#78857a]">Use sample information only. Do not enter a wallet PIN, password, OTP, full card number, CVV, or real banking credentials. These demo fields are not saved.</p>
                          <div className="grid gap-3">
                            {(paymentDemoFields[selectedPaymentMethod] ?? []).map((field) => <label className="grid gap-1 text-xs text-[#68796c]" key={field.name}>
                              {field.label}
                              {field.type === "select" ? <select className="rounded-xl border border-[#d6dfd5] bg-white/80 px-3 py-2 text-sm" onChange={(event) => setPaymentDemoDetails((current) => ({ ...current, [field.name]: event.target.value }))} value={paymentDemoDetails[field.name] ?? ""}>
                                <option value="">Select a bank</option>
                                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                              </select> : <input autoComplete="off" className="rounded-xl border border-[#d6dfd5] bg-white/80 px-3 py-2 text-sm" inputMode={field.inputMode} maxLength={field.maxLength} onChange={(event) => setPaymentDemoDetails((current) => ({ ...current, [field.name]: event.target.value }))} pattern={field.pattern} placeholder={field.placeholder} type={field.type} value={paymentDemoDetails[field.name] ?? ""} />}
                            </label>)}
                          </div>
                        </div>}
                        <p className="mb-0 mt-3 text-xs text-[#78857a]">Demo only — online payments are simulated; no real payment is processed.</p>
                      </section>
                    </div>
                    <aside className="h-fit rounded-[24px] border border-[#dfe4da] bg-white/65 p-6 shadow-sm max-[620px]:p-4">
                      <p className={styles.eyebrow}>ORDER SUMMARY</p><h2 className="mb-4 mt-2 text-xl font-medium">{buyNowProduct ? "Buy now" : `Your bag (${cartCount})`}</h2>
                      <div className="mb-4 grid gap-3">
                        {(buyNowProduct ? [{ product: buyNowProduct, quantity: 1 }] : cart.items).map((item) => <div className="flex justify-between gap-3 text-sm" key={item.product.id}><span>{item.product.name} × {item.quantity}</span><strong>{money(item.product.price * item.quantity)}</strong></div>)}
                        {!buyNowProduct && !cart.items.length && <p className="text-sm text-[#78857a]">Your bag is empty. Add products before checking out.</p>}
                      </div>
                      <div className="my-4 border-t border-[#dfe4da] pt-4">
                        <p className="flex justify-between text-sm"><span>Subtotal</span><strong>{money(buyNowProduct ? buyNowProduct.price : cart.total)}</strong></p>
                        <p className="flex justify-between text-sm"><span>Payment method</span><strong>{selectedPaymentMethodInfo?.label ?? "Loading…"}</strong></p>
                        <p className="mb-0 text-xs text-[#78857a]">Shipping fee, if any, will be confirmed by the store.</p>
                      </div>
                      <button className={styles.checkoutButton} disabled={checkoutBusy || !selectedPaymentMethodInfo?.enabled} onClick={checkout} type="button">{checkoutBusy ? "Placing order…" : "Place order"}</button>
                    </aside>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
      <footer className={styles.siteFooter}>
        <a className={`${styles.wordmark} ${styles.footerWordmark}`} href="/" aria-label="Living Space home">LIVING SPACE<span className="text-[#91a995]">.</span></a>
        <p className={styles.footerText}>Everyday essentials, chosen with care.</p>
        <button className={styles.textButton} onClick={() => user ? setSupportOpen(true) : openAuth()} type="button">Contact support</button>
        <span className={styles.footerNote}>© 2026 LIVING SPACE STUDIO</span>
      </footer>

      {selectedProduct && <div className={styles.detailsOverlay} onMouseDown={(event) => event.target === event.currentTarget && setSelectedProduct(null)}>
        <section className={styles.detailsPanel} role="dialog" aria-modal="true" aria-labelledby="product-details-title">
          <div className={styles.detailsHeading}>
            <p className={styles.eyebrow}>PRODUCT DETAILS</p>
            <button className={styles.closeButton} onClick={() => setSelectedProduct(null)} aria-label="Close product details" type="button">×</button>
          </div>
          <div className={styles.detailsLayout}>
            <div className={styles.detailsImage}>
              <div className={styles.imagePlaceholder} aria-hidden="true">LS.</div>
              {selectedProduct.thumbnail && <img className={`${styles.detailsImageElement} absolute inset-0`} alt={selectedProduct.name} decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} src={selectedProduct.thumbnail} />}
            </div>
            <div className={styles.detailsCopy}>
              <p className={styles.eyebrow}>{selectedProduct.category}</p>
              <h2 className={styles.detailsProductName} id="product-details-title">{selectedProduct.name}</h2>
              <p className={styles.detailsMeta}>Product ID: {selectedProduct.id}<br />SKU: {selectedProduct.sku}</p>
              <p className={styles.detailsDescription}>{selectedProduct.description}</p>
              <p className={styles.detailsPrice}>{money(selectedProduct.price)}</p>
              <p className={styles.detailsStock}>{selectedProduct.stock > 0 ? `${selectedProduct.stock} available in stock` : "Currently unavailable"}</p>
              <button
                className={`${styles.checkoutButton} ${styles.detailsAdd}`}
                disabled={selectedProduct.stock <= 0 || busyItem === selectedProduct.id}
                onClick={() => {
                  const product = selectedProduct;
                  setSelectedProduct(null);
                  addToCart(product);
                }}
                type="button"
              >
                {busyItem === selectedProduct.id ? "Adding…" : "Add to cart"}
              </button>
              <button
                className={`${styles.outlineButton} mt-3 w-full`}
                disabled={selectedProduct.stock <= 0}
                onClick={() => {
                  const product = selectedProduct;
                  setSelectedProduct(null);
                  beginCheckout(product);
                }}
                type="button"
              >
                Buy now
              </button>
            </div>
          </div>
        </section>
      </div>}

      {cartOpen && <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
        <section className={styles.sidePanel} role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>YOUR EVERYDAY EDIT</p><h2 className={styles.panelTitle} id="cart-title">Your bag <span className={styles.panelCount}>({cartCount})</span></h2></div><button className={styles.closeButton} onClick={() => setCartOpen(false)} aria-label="Close bag" type="button">×</button></div>
          {cartError && <p className={styles.inlineError} role="alert">{cartError}</p>}
          {!cart.items.length ? <div className={styles.panelEmpty}><BagIcon /><p>Your bag is waiting for something good.</p><button className={styles.outlineButton} onClick={() => setCartOpen(false)} type="button">Continue shopping</button></div> : <>
            <div className={styles.cartLines}>{cart.items.map((item) => <article className={styles.cartLine} key={item.product.id}>
              {item.product.thumbnail ? <img className={styles.cartImage} src={item.product.thumbnail} alt="" /> : <div className={styles.cartImagePlaceholder}>N.</div>}
              <div className={styles.cartLineInfo}><h3>{item.product.name}</h3><p>{money(item.product.price)}</p><div className={styles.quantityControl}>
                <button aria-label={`Decrease ${item.product.name} quantity`} disabled={busyItem === item.product.id} onClick={() => changeQuantity(item, item.quantity - 1)} type="button">−</button>
                <span>{item.quantity}</span>
                <button aria-label={`Increase ${item.product.name} quantity`} disabled={busyItem === item.product.id || item.quantity >= item.product.stock || item.quantity >= 99} onClick={() => changeQuantity(item, item.quantity + 1)} type="button">+</button>
              </div></div>
              <div className={styles.lineEnd}><strong>{money(item.product.price * item.quantity)}</strong><button className={styles.removeButton} disabled={busyItem === item.product.id} onClick={() => changeQuantity(item, 0)} type="button">Remove</button></div>
            </article>)}</div>
            <div className={styles.cartSummary}><div><span>Subtotal</span><strong>{money(cart.total)}</strong></div><p>Cash on Delivery. No online payment is collected.</p><button className={styles.checkoutButton} disabled={checkoutBusy} onClick={() => beginCheckout()} type="button">Continue to checkout</button></div>
          </>}
        </section>
      </div>}

      {authOpen && <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}>
        <section className={styles.authPanel} role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className={`${styles.closeButton} ${styles.authClose}`} onClick={() => setAuthOpen(false)} aria-label="Close" type="button">×</button>
          <p className={styles.eyebrow}>WELCOME TO LIVING SPACE</p><h2 className={styles.authTitle} id="auth-title">{authMode === "login" ? "Good to see you." : "Create your account."}</h2>
          <p className={styles.authDescription}>{authMode === "login" ? "Sign in to manage your bag and orders." : "Join us for considered everyday essentials."}</p>
          {authError && <p className={styles.inlineError} role="alert">{authError}</p>}
          <form className={styles.authForm} onSubmit={submitAuth}>
            {authMode === "register" && <label>Full name<input name="name" autoComplete="name" required maxLength={100} /></label>}
            {authMode === "register" ? (
              <>
                <label>Username<input name="username" autoComplete="username" required maxLength={150} /></label>
                <label>Email<input name="email" type="email" autoComplete="email" required /></label>
              </>
            ) : (
              <label>Username<input name="username" autoComplete="username" required /></label>
            )}
            <label>Password<input name="password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} required minLength={authMode === "register" ? 8 : undefined} /></label>
            <button className={styles.checkoutButton} disabled={authBusy} type="submit">{authBusy ? "Please wait…" : authMode === "login" ? "Log in" : "Create account"}</button>
          </form>
          <p className={styles.authSwitch}>{authMode === "login" ? "New here?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }} type="button">{authMode === "login" ? "Create an account" : "Log in"}</button></p>
        </section>
      </div>}

      {profileOpen && <div className={styles.detailsOverlay} onMouseDown={(event) => event.target === event.currentTarget && setProfileOpen(false)}>
        <section className={styles.detailsPanel} role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <div className={styles.detailsHeading}><div><p className={styles.eyebrow}>YOUR ACCOUNT</p><h2 className={styles.panelTitle} id="profile-title">Profile & security</h2></div><button className={styles.closeButton} onClick={() => setProfileOpen(false)} aria-label="Close account" type="button">×</button></div>
          {profileError && <p className={styles.inlineError} role="alert">{profileError}</p>}
          <form className={`${styles.authForm} mb-8`} onSubmit={updateProfile}>
            <label>Name<input name="name" defaultValue={user?.name ?? ""} maxLength={100} required /></label>
            <label>Email<input value={user?.email ?? ""} readOnly /></label>
            <button className={styles.checkoutButton} type="submit">Save profile</button>
          </form>
          <div className="mb-8 grid grid-cols-3 gap-2">
            <button className={styles.outlineButton} onClick={() => { setProfileOpen(false); loadOrders(); }} type="button">Orders</button>
            <button className={styles.outlineButton} onClick={() => { setProfileOpen(false); setWishlistOpen(true); }} type="button">Wishlist</button>
            <button className={styles.outlineButton} onClick={signOut} type="button">Sign out</button>
          </div>
          <h3 className="mb-3 text-sm font-medium">Change password</h3>
          <form className={`${styles.authForm} mb-8`} onSubmit={changePassword}>
            <label>Current password<input autoComplete="current-password" name="current_password" required type="password" /></label>
            <label>New password<input autoComplete="new-password" minLength={8} name="new_password" required type="password" /></label>
            <button className={styles.checkoutButton} type="submit">Update password</button>
          </form>
          <h3 className="mb-3 text-sm font-medium">Saved delivery addresses</h3>
          <button className={`${styles.outlineButton} mb-3`} onClick={() => { setProfileError(""); setEditingAddressId(null); setAddressFormOpen((value) => !value); }} type="button">{addressFormOpen ? "Cancel adding address" : "Add an address"}</button>
          {addressFormOpen && <form className={`${styles.authForm} mb-5 rounded-xl border border-[#dfe4da] bg-white/45 p-4`} onSubmit={saveAddress}>
            <label>Address label<input name="label" defaultValue="Home" maxLength={40} required /></label>
            <label>Recipient name<input autoComplete="name" name="recipient_name" defaultValue={user?.name ?? ""} maxLength={100} required /></label>
            <label>Phone<input autoComplete="tel" name="phone" maxLength={30} required /></label>
            <label>Address line 1<input autoComplete="address-line1" name="address_line1" maxLength={200} required /></label>
            <label>Address line 2 (optional)<input autoComplete="address-line2" name="address_line2" maxLength={200} /></label>
            <label>City / municipality<input autoComplete="address-level2" name="city" maxLength={100} required /></label>
            <label>Province<input autoComplete="address-level1" name="province" maxLength={100} required /></label>
            <label>Postal code<input autoComplete="postal-code" name="postal_code" maxLength={12} required /></label>
            <label>Delivery notes (optional)<input name="delivery_notes" maxLength={300} /></label>
            <button className={styles.checkoutButton} type="submit">Save address</button>
          </form>}
          {addresses.map((address) => <div className="my-2 rounded-xl border border-[#dfe4da] bg-white/55 p-3 text-xs" key={address.id}>
            {editingAddressId === address.id ? <form className={styles.authForm} onSubmit={(event) => updateAddress(event, address)}>
              <label>Label<input name="label" defaultValue={address.label} required maxLength={40} /></label>
              <label>Recipient<input name="recipient_name" defaultValue={address.recipient_name} required maxLength={100} /></label>
              <label>Phone<input name="phone" defaultValue={address.phone} required maxLength={30} /></label>
              <label>Address line 1<input name="address_line1" defaultValue={address.address_line1} required maxLength={200} /></label>
              <label>Address line 2<input name="address_line2" defaultValue={address.address_line2} maxLength={200} /></label>
              <label>City<input name="city" defaultValue={address.city} required maxLength={100} /></label>
              <label>Province<input name="province" defaultValue={address.province} required maxLength={100} /></label>
              <label>Postal code<input name="postal_code" defaultValue={address.postal_code} required maxLength={12} /></label>
              <label>Delivery notes<input name="delivery_notes" defaultValue={address.delivery_notes} maxLength={300} /></label>
              <div className="flex gap-3"><button className={styles.checkoutButton} type="submit">Save address</button><button className={styles.outlineButton} onClick={() => setEditingAddressId(null)} type="button">Cancel</button></div>
            </form> : <div className="flex items-center justify-between gap-3"><span>{address.label}: {address.address_line1}, {address.city}, {address.province}{address.is_default ? " · Default" : ""}</span><span className="flex gap-3">{!address.is_default && <button className={styles.removeButton} onClick={() => markDefaultAddress(address)} type="button">Make default</button>}<button className={styles.removeButton} onClick={() => setEditingAddressId(address.id)} type="button">Edit</button><button className={styles.removeButton} onClick={() => deleteAddress(address)} type="button">Remove</button></span></div>}
          </div>)}
        </section>
      </div>}

      {wishlistOpen && <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setWishlistOpen(false)}>
        <section className={styles.sidePanel} role="dialog" aria-modal="true" aria-labelledby="wishlist-title">
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>YOUR SAVED FINDS</p><h2 className={styles.panelTitle} id="wishlist-title">Wishlist</h2></div><button className={styles.closeButton} onClick={() => setWishlistOpen(false)} aria-label="Close wishlist" type="button">×</button></div>
          {products.filter((product) => wishlistIds.includes(String(product.id))).map((product) => <article className={styles.cartLine} key={product.id}>
            {product.thumbnail ? <img className={styles.cartImage} src={product.thumbnail} alt="" /> : <div className={styles.cartImagePlaceholder}>LS.</div>}
            <div className={styles.cartLineInfo}><h3>{product.name}</h3><p>{money(product.price)}</p><button className={styles.removeButton} onClick={() => toggleWishlist(product)} type="button">Remove from wishlist</button></div>
            <button className={styles.removeButton} disabled={product.stock <= 0} onClick={() => { setWishlistOpen(false); addToCart(product); }} type="button">Add to bag</button>
          </article>)}
          {!wishlistIds.length && <div className={styles.panelEmpty}><p>Your saved products will show up here.</p><button className={styles.outlineButton} onClick={() => setWishlistOpen(false)} type="button">Continue shopping</button></div>}
        </section>
      </div>}

      {supportOpen && <div className={styles.detailsOverlay} onMouseDown={(event) => event.target === event.currentTarget && setSupportOpen(false)}>
        <section className={styles.authPanel} role="dialog" aria-modal="true" aria-labelledby="support-title">
          <button className={`${styles.closeButton} ${styles.authClose}`} onClick={() => setSupportOpen(false)} aria-label="Close support" type="button">×</button>
          <p className={styles.eyebrow}>WE’RE HERE TO HELP</p><h2 className={styles.authTitle} id="support-title">Contact our team.</h2>
          <p className={styles.authDescription}>Send a support request and our store team can review it in the admin dashboard.</p>
          {supportNotice && <p className={supportNotice.startsWith("Your message") ? styles.orderNotice : styles.inlineError} role="status">{supportNotice}</p>}
          <form className={styles.authForm} onSubmit={submitSupportMessage}>
            <label>Subject<input name="subject" required maxLength={120} /></label>
            <label>How can we help?<textarea className="min-h-28 rounded-xl border border-[#dedfd8] bg-[#fbfaf7] p-3" name="message" required maxLength={2000} /></label>
            <button className={styles.checkoutButton} type="submit">Send message</button>
          </form>
        </section>
      </div>}

      {ordersOpen && <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setOrdersOpen(false)}>
        <section className={styles.sidePanel} role="dialog" aria-modal="true" aria-labelledby="orders-title">
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>YOUR LIVING SPACE ACCOUNT</p><h2 className={styles.panelTitle} id="orders-title">Order history</h2></div><button className={styles.closeButton} onClick={() => setOrdersOpen(false)} aria-label="Close orders" type="button">×</button></div>
          {orderNotice && <p className={styles.orderNotice} role="status">{orderNotice}</p>}
          {ordersBusy ? <p className={`${styles.emptyState} m-auto`}>Loading your orders…</p> : orders.length ? <div className={styles.ordersList}>{orders.map((order, index) => {
            const orderId = idOf(order) ?? order?.order_number ?? `order-${index}`;
            const orderItems = order?.items ?? order?.order_items ?? [];
            return <article className={styles.orderCard} key={orderId}><div><strong>Order #{order?.order_number ?? order?.id ?? order?.UniqueID ?? index + 1}</strong><span>{order?.created_at ? new Date(order.created_at).toLocaleDateString() : "Placed"}</span></div>
              {orderItems.length > 0 && <p>{orderItems.map((item) => `${item?.product?.name ?? item?.name ?? "Item"} × ${item?.quantity ?? 1}`).join(", ")}</p>}
              <p>Order status: <strong>{String(order?.status ?? "pending").replaceAll("_", " ")}</strong></p>
              <p>Payment: <strong>{paymentMethods.find((method) => method.id === order?.payment_method)?.label ?? order?.payment_method}</strong> · <strong>{String(order?.payment_status ?? "pending").replaceAll("_", " ")}</strong></p>
              {order?.payment_demo_result && <p>Demo only: simulated {order.payment_demo_result === "success" ? "success" : "failure"}; no payment was verified.</p>}
              {order?.recipient_name && <p>Deliver to: {order.recipient_name}, {order.shipping_address} · {order.recipient_phone}</p>}
              {order?.tracking_code && <p>Tracking: {order.tracking_code}</p>}
              <strong>{money(order?.total ?? order?.total_amount)}</strong></article>;
          })}</div> : <div className={styles.panelEmpty}><p>{orderNotice ? "Orders could not be loaded." : "No orders yet. Your next favorite is waiting."}</p><button className={styles.outlineButton} onClick={() => setOrdersOpen(false)} type="button">Continue shopping</button></div>}
        </section>
      </div>}
    </div>
  );
}

export default App;
