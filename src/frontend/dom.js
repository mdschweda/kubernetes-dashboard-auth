function element(el) {
    return typeof el === "string" ?
        document.getElementById(el): el;
}

/**
 * 
 * @param {HTMLElement | string} el 
 * @param {string} cl 
 */
export function hasClass(el, cl) {
    el = element(el);
    return el && el.classList.contains(cl);
}

/**
 * 
 * @param {HTMLElement | string} el 
 * @param {string} cl 
 */
export function addClass(el, cl) {
    el = element(el);
    if (el && !hasClass(el, cl))
        el.classList.add(cl);
}

/**
 * 
 * @param {HTMLElement | string} el 
 * @param {string} cl 
 */
export function removeClass(el, cl) {
    el = element(el);
    if (el && hasClass(el, cl))
        el.classList.remove(cl);
}

/**
 * 
 * @param {HTMLElement | string} el 
 * @param {string} cl 
 */
export function toggleClass(el, cl) {
    el = element(el);
    if (el)
        (hasClass(el, cl) ? removeClass : addClass)(el, cl);
}

/**
 * 
 * @param {any} check 
 * @param {HTMLElement | string} el 
 * @param {string} cl 
 */
export function classIf(check, el, cl) {
    (check ? addClass : removeClass)(el, cl);
}

/**
 * 
 * @param {HTMLElement | string} id 
 * @return {string}
 */
export function value(el) {
    el = element(el);
    return el && el.value && el.value.trim();
}

/**
 * @function
 * @param {string} elementId
 * @returns {HTMLElement}
 */
export function id(elementId) {
    return document.getElementById(elementId);
}

/**
 * @function
 * @param {any} selectors
 * @returns {HTMLElement}
 */
export function q(selectors) {
    return document.querySelector(selectors);
}
