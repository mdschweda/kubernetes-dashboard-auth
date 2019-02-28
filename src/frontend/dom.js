function element(el) {
    return typeof el === "string" ?
        document.getElementById(el): el;
}

/**
 * Determines if an element has a class.
 * @param {HTMLElement | string} el The element or the id of the element to check.
 * @param {string} cl The class to check.
 * @returns {boolean} `true` if the element has the passed class. Otherwise `false`.
 */
export function hasClass(el, cl) {
    el = element(el);
    return el && el.classList.contains(cl);
}

/**
 * Adds a class to an element.
 * @param {HTMLElement | string} el The element or the id of the element to modify.
 * @param {string} cl The class to add.
 */
export function addClass(el, cl) {
    el = element(el);
    if (el && !hasClass(el, cl))
        el.classList.add(cl);
}

/**
 * Removes a class from an element.
 * @param {HTMLElement | string} el The element or the id of the element to modify.
 * @param {string} cl The class to remove.
 */
export function removeClass(el, cl) {
    el = element(el);
    if (el && hasClass(el, cl))
        el.classList.remove(cl);
}

/**
 * Adds or removes a class from an element.
 * @param {HTMLElement | string} el The element or the id of the element to modify.
 * @param {string} cl The class to toggle.
 */
export function toggleClass(el, cl) {
    el = element(el);
    if (el)
        (hasClass(el, cl) ? removeClass : addClass)(el, cl);
}

/**
 * Adds or removes a class to or from an element depending on a given condition.
 * @param {any} check The predicate to check.
 * @param {HTMLElement | string} el The element to modify.
 * @param {string} cl The class to add when `check`is truthy or to remove is `check` is falsy.
 */
export function classIf(check, el, cl) {
    (check ? addClass : removeClass)(el, cl);
}

/**
 * Retrieves the value of an input element.
 * @param {HTMLInputElement | string} el The element or the id of the element to check.
 * @return {string} The value of the element.
 */
export function value(el) {
    el = element(el);
    return el && el.value && el.value.trim();
}

/**
 * Short form for `document.getElementById`.
 * @param {string} elementId The id of the element.
 * @returns {HTMLElement} The matching element.
 */
export function id(elementId) {
    return document.getElementById(elementId);
}

/**
 * Short form for `document.querySelector`.
 * @param {string} selector The CSS selector used to query the element.
 * @returns {HTMLElement} The matching element.
 */
export function q(selector) {
    return document.querySelector(selector);
}
