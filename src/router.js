export class Router {
  constructor(routes) {
    this.routes = routes;
    this._onHashChange = () => this.resolve();
    window.addEventListener('hashchange', this._onHashChange);
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    for (const route of this.routes) {
      const match = this._match(route.path, hash);
      if (match) {
        route.handler(match.params);
        return;
      }
    }
    // Fallback
    this.navigate('/');
  }

  navigate(path) {
    window.location.hash = path;
  }

  _match(pattern, hash) {
    const patternParts = pattern.split('/').filter(Boolean);
    const hashParts = hash.split('/').filter(Boolean);

    if (patternParts.length !== hashParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = hashParts[i];
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return { params };
  }
}
