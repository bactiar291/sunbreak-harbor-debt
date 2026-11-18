export function rng(seed=7){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}export function pick(r,a){return a[Math.floor(r()*a.length)]}
