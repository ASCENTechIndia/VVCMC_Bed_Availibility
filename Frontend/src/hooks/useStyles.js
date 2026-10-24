import { useLayoutEffect } from 'react';

/**
 * The public page and the admin module ship two different stylesheets that
 * share class names (.kpi, .bt, .btn ...). To keep them from clashing, each
 * layout injects its own CSS on mount and removes it on unmount.
 */
export default function useStyles(cssText, bodyClass) {
  useLayoutEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-scoped-style', '');
    el.textContent = cssText;
    document.head.appendChild(el);
    if (bodyClass) document.body.classList.add(bodyClass);
    return () => {
      el.remove();
      if (bodyClass) document.body.classList.remove(bodyClass);
    };
  }, [cssText, bodyClass]);
}
