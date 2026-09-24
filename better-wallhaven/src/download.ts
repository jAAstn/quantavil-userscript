import { GM_download, GM_xmlhttpRequest } from '$';

/** Filename from a URL with fallback — single source for all download call sites. */
export function fileNameOf(url: string, fallback: string): string {
  return url.split('/').pop() || fallback;
}

export function dlFile(url: string, name: string) {
  if (typeof GM_download === 'function') {
    GM_download({ url, name });
  } else {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      responseType: 'blob',
      onload(r) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(r.response);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(a.href);
          a.remove();
        }, 100);
      }
    });
  }
}
