(() => {
  const { mouse, touch } = Site;

  function frame(now){
    mouse.sx += (mouse.x - mouse.sx) * .18;
    mouse.sy += (mouse.y - mouse.sy) * .18;
    touch.sx += (touch.x - touch.sx) * .22;
    touch.sy += (touch.y - touch.sy) * .22;
    touch.k += ((touch.on ? 1 : 0) - touch.k) * .1;

    Site.drawBackground(now);
    Site.nameStep();
    Site.cursorStep(now);
    Site.mobileStep(now);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
