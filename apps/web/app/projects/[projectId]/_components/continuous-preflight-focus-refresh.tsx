"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** No polling. Recheck after an external approval/edit only when user returns. */
export function ContinuousPreflightFocusRefresh() {
  const router=useRouter();
  const last=useRef(0);
  useEffect(()=>{
    const refresh=()=>{
      if (document.visibilityState!=="visible") return;
      const now=Date.now();
      if (now-last.current<15000) return;
      last.current=now;
      router.refresh();
    };
    // Do not force an extra request at initial render: SSR already read truth.
    last.current=Date.now();
    window.addEventListener("focus",refresh);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{
      window.removeEventListener("focus",refresh);
      document.removeEventListener("visibilitychange",refresh);
    };
  },[router]);
  return null;
}
