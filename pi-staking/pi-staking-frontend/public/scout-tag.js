(function(){
  try {
    console.log('Scout Tag loaded (stub)');
    window.ScoutTag = {
      track: function(e, d){ console.log('Scout track', e, d); },
      identify: function(id, t){ console.log('Scout identify', id, t); },
      page: function(n, p){ console.log('Scout page', n, p); }
    };
  } catch {}
})();