(function ()
{
  'use strict';

  // Boot sequence.
  var BOOT_LINES = [
    { text: 'initializing file system...  OK', delay: 1000 },
    { text: 'mounting /posts...  OK', delay: 1500 },
    { text: 'fetching latest...  OK', delay: 1000 },
    { text: '', delay: 0 },
    { text: 'NOTE(saeb): I write about things and occasionally get them right. no warranty :)', delay: 3500 }
  ];

  function runBoot()
  {
    var overlay = document.getElementById('bootScreen');
    var output = document.getElementById('bootText');

    if (!overlay || !output)
      return;

    if (sessionStorage.getItem('sn_booted'))
    {
      overlay.remove();
      return;
    }

    var i = 0;

    function nextLine()
    {
      if (i >= BOOT_LINES.length)
      {
        setTimeout(dismiss, 900);
        return;
      }

      var el = document.createElement('div');
      el.className = 'boot-line';
      var line = BOOT_LINES[i].text;

      if (line.trim() === '')
      {
        el.innerHTML = '&nbsp;';
      } else {
        el.textContent = line;
      }

      output.appendChild(el);
      var wait = BOOT_LINES[i].delay;
      i++;
      setTimeout(nextLine, wait);
    }

    function dismiss()
    {
      overlay.classList.add('boot-fade');
      overlay.addEventListener('animationend', function ()
        {
          overlay.remove();
          sessionStorage.setItem('sn_booted', '1');
        }, { once: true }
      );
    }

    setTimeout(nextLine, 500);
  }

  // Status bar clock.
  function startClock() {
    var el = document.getElementById('statusClock');
    if (!el)
      return;

    function tick()
    {
      var d = new Date();
      var h = String(d.getHours()).padStart(2, '0');
      var m = String(d.getMinutes()).padStart(2, '0');
      var s = String(d.getSeconds()).padStart(2, '0');
      el.textContent = h + ':' + m + ':' + s;
    }

    tick();
    setInterval(tick, 1000);
  }

  // Power toggle.
  function initPower()
  {
    var led = document.getElementById('monitorLed');
    var screen = document.querySelector('.screen');

    if (!led || !screen)
      return;

    var on = true;

    led.addEventListener('click', function ()
      {
        if (on)
        {
          screen.classList.add('crt-off');
          led.classList.add('led-dim');
          on = false;
        } else {
          screen.classList.remove('crt-off');
          screen.classList.add('crt-on');
          led.classList.remove('led-dim');
          on = true;
          
          setTimeout(function () {
            screen.classList.remove('crt-on');
          }, 500);
        }
      }
    );
  }

  document.addEventListener('DOMContentLoaded', function ()
    {
      runBoot();
      startClock();
      initPower();
    }
  );
}());