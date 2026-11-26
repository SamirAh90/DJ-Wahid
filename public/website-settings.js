// Standalone privacy pages use the same published settings as the main website.
void fetch('/api/index.php?action=content').then(response => {
  if (!response.ok) throw new Error('Settings unavailable');
  return response.json();
}).then(data => {
  const config = data.website?.config ?? {};
  const current = document.documentElement.lang === 'sv' ? 'sv' : 'en';
  if (config.languages) {
    const languageNavigation=document.querySelector('nav[aria-label="Language / Språk"]');
    if(languageNavigation){languageNavigation.hidden=['en','sv'].filter(code=>config.languages[code]!==false).length<2;languageNavigation.style.display=languageNavigation.hidden?'none':'flex';}
    document.querySelectorAll('a[lang]').forEach(link => {
      if (config.languages[link.lang] === false) link.hidden = true;
    });
    if (config.languages[current] === false) {
      const next = config.languages.default;
      try { localStorage.setItem('dj-language', next); } catch {}
      location.replace(next === 'sv' ? '/integritet/sv.html?lang=sv' : '/integritet/index.html?lang=en');
      return;
    }
  }
  const text = config.privacy?.[current];
  if (typeof config.privacyTitles?.[current] === 'string') document.querySelector('h1').textContent = config.privacyTitles[current];
  const target = document.getElementById('privacy-content');
  if (typeof text === 'string' && text.trim() && target) {
    const inline = (node,value) => {
      const pattern=/\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g;let offset=0;
      for (const match of value.matchAll(pattern)) {
        node.append(document.createTextNode(value.slice(offset,match.index)));
        if(match[3]) {const code=document.createElement('code');code.textContent=match[3];node.append(code);}
        else {const link=document.createElement('a');link.textContent=match[1];if(/^(https?:\/\/|tel:|\/(?!\/)|#)/i.test(match[2]))link.href=match[2];node.append(link);}
        offset=match.index+match[0].length;
      }
      node.append(document.createTextNode(value.slice(offset)));
    };
    const known={'Data controller':'ansvarig','Personuppgiftsansvarig':'ansvarig','Data and purposes':'uppgifter','Uppgifter och ändamål':'uppgifter','Recipients and hosting':'leverantorer','Mottagare och webbhotell':'leverantorer','Retention and security':'lagring','Lagring och säkerhet':'lagring','Cookies and local storage':'cookies','Cookies och lokal lagring':'cookies','Your rights':'rattigheter','Dina rättigheter':'rattigheter','Changes':'andringar','Ändringar':'andringar'};
    const blocks=text.split(/\n\s*\n/).map(paragraph=>{const heading=paragraph.startsWith('## ');const node=document.createElement(heading?'h2':'p');const value=heading?paragraph.slice(3):paragraph;inline(node,value);if(heading)node.id=known[value]??value.toLowerCase().replace(/[^a-z0-9]+/g,'-');return node;});
    const nav=document.createElement('nav');nav.setAttribute('aria-label',current==='sv'?'På denna sida':'On this page');const list=document.createElement('ul');for(const heading of blocks.filter(node=>node.tagName==='H2')){const item=document.createElement('li');const link=document.createElement('a');link.href='#'+heading.id;link.textContent=heading.textContent;item.append(link);list.append(item);}nav.append(list);
    target.replaceChildren(nav,...blocks);
  }
}).catch(() => { /* Keep the complete built-in policy if the API is unavailable. */ });
