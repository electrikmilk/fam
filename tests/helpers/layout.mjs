// Runs in the page. Lists elements inside `main` whose box crosses the right or left edge of main's content box
// (inside its border and padding), which is where a leather frame's stitched border sits.
export const OFFENDERS_SOURCE = `() => {
  const main = document.querySelector('main');
  const bounds = main.getBoundingClientRect();
  const style = getComputedStyle(main);
  const left = bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
  const right = bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
  return [...main.querySelectorAll('*')]
    .filter((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && (box.right > right + 0.5 || box.left < left - 0.5);
    })
    .map((element) => element.tagName.toLowerCase() + '.' + element.className);
}`;
