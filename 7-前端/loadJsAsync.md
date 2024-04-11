# load js

```js
export const loadJsAsync = (src = originCdn, async, options) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    if (options) {
      for (const key in options) {
        script.setAttribute(key, options[key]);
      }
    }

    const onload = () => {
      /// 
      script.removeEventListener("load", onload);
      resolve();
    };

    script.addEventListener("load", onload);
    script.addEventListener("error", (err) => {
      script.removeEventListener("load", onload);
      // eslint-disable-next-line no-console
      
      reject(new Error(`Failed to load ${src}`));
    });

    (
      document.getElementsByTagName("head")[0] || document.documentElement
    ).appendChild(script);
  });
};

```