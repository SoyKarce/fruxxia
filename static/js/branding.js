(function () {
    "use strict";

    const BRAND_PATTERNS = [
        [/\bPylaAI\b/gi, "FruxX AI"],
        [/\bPyla\b/gi, "FruxX AI"],
    ];
    const TEXT_SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);
    const BRAND_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt", "data-tooltip"];

    function rebrand(value) {
        return BRAND_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
    }

    function removeDiscordLinks(root) {
        if (!(root instanceof Element)) return;
        const anchors = [];
        if (root.matches("a")) anchors.push(root);
        anchors.push(...root.querySelectorAll("a"));
        anchors.forEach((anchor) => {
            const label = [anchor.href, anchor.textContent, ...BRAND_ATTRIBUTES.map((attribute) => anchor.getAttribute(attribute) || "")].join(" ");
            if (/discord/i.test(label)) anchor.remove();
        });
    }

    function updateTextNode(node) {
        if (!node || !node.parentElement || TEXT_SKIP.has(node.parentElement.tagName)) return;
        const updated = rebrand(node.nodeValue || "");
        if (updated !== node.nodeValue) node.nodeValue = updated;
    }

    function updateElement(element) {
        if (!(element instanceof Element) || TEXT_SKIP.has(element.tagName)) return;
        BRAND_ATTRIBUTES.forEach((attribute) => {
            if (!element.hasAttribute(attribute)) return;
            const current = element.getAttribute(attribute);
            const updated = rebrand(current);
            if (updated !== current) element.setAttribute(attribute, updated);
        });
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) updateTextNode(node);
    }

    function applyBranding(root = document.body) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            updateTextNode(root);
            return;
        }
        if (root.nodeType === Node.ELEMENT_NODE) {
            updateElement(root);
            removeDiscordLinks(root);
        }
        if (root.querySelectorAll) root.querySelectorAll("*").forEach(updateElement);
    }

    function start() {
        document.title = rebrand(document.title);
        applyBranding();
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "characterData") updateTextNode(mutation.target);
                if (mutation.type === "attributes") {
                    const current = mutation.target.getAttribute(mutation.attributeName) || "";
                    const updated = rebrand(current);
                    if (updated !== current) mutation.target.setAttribute(mutation.attributeName, updated);
                }
                mutation.addedNodes.forEach((node) => applyBranding(node));
            });
        });
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: BRAND_ATTRIBUTES,
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
