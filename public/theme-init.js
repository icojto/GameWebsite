// Parser-blocking, self-hosted initialization precedes styles and application boot.
// The same resolver is used by the portal when preferences change.
(function () {
  const valid = value => value === 'light' || value === 'dark';
  const resolve = (read, dark) => {
    const current = read('odesos.theme');
    const legacy = valid(current) ? current : read('studioArcade.theme');
    return valid(legacy) ? legacy : dark ? 'dark' : 'light';
  };
  const apply = theme => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = theme === 'dark' ? '#060a12' : '#f4f7fb';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#060a12' : '#f4f7fb');
  };
  const scope = document.querySelector('meta[name="theme-storage-prefix"]');
  const prefix = scope && new URLSearchParams(location.search).get(scope.dataset.queryKey) === scope.dataset.session ? scope.content : '';
  const read = key => { try { return localStorage.getItem(prefix + key); } catch { return null; } };
  window.odesosTheme = { resolve, apply };
  apply(resolve(read, matchMedia('(prefers-color-scheme: dark)').matches));
}());
