// Configuração: destaques definidos conforme sua lista.
// Destaques atuais (máx 3): NossoSorteio, HospitalApp, APIIntegracaoReceita
// Se quiser trocar algum destaque, altere a ordem ou substitua o objeto correspondente.
const featuredConfig = [
  { owner: "edimar1315", name: "NossoSorteio", title: "NossoSorteio" },
  { owner: "edimar1315", name: "HospitalApp", title: "HospitalApp" },
  { owner: "edimar1315", name: "APIIntegracaoReceita", title: "APIIntegracaoReceita" },
];

const username = "edimar1315"; // usado para carregar lista geral
const reposEl = document.getElementById("repos");
const featuredEl = document.getElementById("featured");
const avatarEl = document.getElementById("avatar");
const nameEl = document.getElementById("name");
const bioEl = document.getElementById("bio");
const githubLinkEl = document.getElementById("github-link");

async function fetchProfile() {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error("Não foi possível obter perfil");
  return res.json();
}

async function fetchRepos() {
  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
  if (!res.ok) throw new Error("Não foi possível obter repositórios");
  return res.json();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}

function langColor(name){
  const map = {
    "JavaScript":"#f1e05a",
    "TypeScript":"#2b7489",
    "Python":"#3572A5",
    "HTML":"#e34c26",
    "CSS":"#563d7c",
    "Shell":"#89e051",
    "Go":"#00ADD8",
    "": "#6b7280"
  };
  return map[name] || "#6b7280";
}

function renderFeatured(reposByFullName) {
  featuredEl.innerHTML = "";
  featuredConfig.slice(0,3).forEach(cfg => {
    const full = `${cfg.owner}/${cfg.name}`;
    const repo = reposByFullName[full];

    const card = document.createElement("div");
    card.className = "featured";

    if (repo) {
      card.innerHTML = `
        <h3><a href="${repo.html_url}" target="_blank">${cfg.title || repo.name}</a></h3>
        <p>${cfg.descriptionOverride ?? repo.description ?? ""}</p>
        <div class="meta">
          ${repo.language ? `<span><span class="lang-dot" style="background:${langColor(repo.language)}"></span>${repo.language}</span>` : ""}
          <span>★ ${repo.stargazers_count}</span>
          <span>Última atualização: ${formatDate(repo.updated_at)}</span>
          ${cfg.demo || repo.homepage ? `<span><a href="${cfg.demo || repo.homepage}" target="_blank">Demo</a></span>` : ""}
        </div>
      `;
    } else {
      card.innerHTML = `
        <h3>${cfg.title || cfg.name}</h3>
        <p>Repositório <code>${full}</code> não encontrado na lista pública deste usuário.</p>
        <div class="meta"><a href="https://github.com/${full}" target="_blank">Ver no GitHub</a></div>
      `;
    }

    featuredEl.appendChild(card);
  });
}

function renderRepos(allRepos, featuredNames) {
  const others = allRepos.filter(r => !featuredNames.has(`${r.owner.login}/${r.name}`));
  if (!others.length) {
    reposEl.innerHTML = "<p>Nenhum repositório encontrado.</p>";
    return;
  }
  reposEl.innerHTML = "";
  others.forEach(r => {
    const div = document.createElement("div");
    div.className = "repo";
    div.innerHTML = `
      <h3><a href="${r.html_url}" target="_blank">${r.name}</a></h3>
      <p>${r.description || ""}</p>
      <div class="meta">
        ${r.language ? `<span><span class="lang-dot" style="background:${langColor(r.language)}"></span>${r.language}</span>` : ""}
        <span>★ ${r.stargazers_count}</span>
        <span>Última atualização: ${formatDate(r.updated_at)}</span>
        ${r.homepage ? `<span><a href="${r.homepage}" target="_blank">Demo</a></span>` : ""}
      </div>
    `;
    reposEl.appendChild(div);
  });
}

(async function init(){
  try {
    // Carrega perfil e repos do usuário principal
    const profile = await fetchProfile();
    avatarEl.src = profile.avatar_url;
    nameEl.textContent = profile.name || profile.login;
    bioEl.textContent = profile.bio || "Portfólio — projetos e repositórios";
    githubLinkEl.href = profile.html_url;

    const repos = await fetchRepos();

    // Organiza repos por "owner/name" para localizar facilmente os destaque
    const reposByFullName = {};
    repos.forEach(r => {
      reposByFullName[`${r.owner.login}/${r.name}`] = r;
    });

    // Para o caso de destaques serem de outros owners, tentamos buscar o repo remoto
    await Promise.all(featuredConfig.map(async cfg => {
      const full = `${cfg.owner}/${cfg.name}`;
      if (!reposByFullName[full]) {
        try {
          const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.name}`);
          if (res.ok) {
            const r = await res.json();
            reposByFullName[full] = r;
          }
        } catch (e) {
          // ignora erros individuais
        }
      }
    }));

    renderFeatured(reposByFullName);

    const featuredNames = new Set(featuredConfig.slice(0,3).map(c => `${c.owner}/${c.name}`));
    renderRepos(repos, featuredNames);

  } catch (err) {
    reposEl.innerHTML = `<p>Erro: ${err.message}</p>`;
    console.error(err);
  }
})();