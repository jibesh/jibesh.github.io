onmessage = (event) => {
    importScripts('scripts/prism.js');
    // console.log(event.data);

    const result = self.Prism.highlight(event.data || "...", Prism.languages["js"]);
    // (event.data);

    // console.log(result);
    // postMessage(result.value);
    postMessage(result);

};