// Configuração: destaques definidos conforme sua lista.
const featuredConfig = [
  {
    owner: "edimar1315",
    name: "SalesWebMvc",
    title: "SalesWebMvc",
    tags: ["C#", ".NET", "SQL Server"]
  },
  {
    owner: "edimar1315",
    name: "HospitalApp",
    title: "HospitalApp",
    tags: ["ASP.NET Core", "Entity Framework"]
  },
  {
    owner: "edimar1315",
    name: "APIIntegracaoReceita",
    title: "API Receita Federal",
    tags: ["API REST", "Python", "Automation"]
  },
];

const username = "edimar1315";
const reposEl = document.getElementById("repos");
const featuredEl = document.getElementById("featured");
const avatarEl = document.getElementById("avatar");

// Cores para linguagens
const langColors = {
  "JavaScript": "#f1e05a",
  "TypeScript": "#2b7489",
  "Python": "#3572A5",
  "HTML": "#e34c26",
  "CSS": "#563d7c",
  "Shell": "#89e051",
  "Go": "#00ADD8",
  "C#": "#178600",
  "C++": "#f34b7d",
  "Java": "#b07219",
  "PowerShell": "#012456"
};

function getLangColor(name) {
  return langColors[name] || "#6b7280";
}

async function fetchProfile() {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) throw new Error("Erro ao carregar perfil");
    const data = await res.json();

    if (avatarEl) {
      avatarEl.src = data.avatar_url;
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    if (!res.ok) throw new Error("Erro ao carregar repositórios");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

function createCardHTML(repo, config = {}) {
  const title = config.title || repo.name;
  const desc = config.descriptionOverride || repo.description || "Sem descrição definida.";
  const url = repo.html_url;
  const stars = repo.stargazers_count;
  const lang = repo.language;


  let tagsHTML = '';
  if (config.tags && config.tags.length) {
    tagsHTML = `<div class="tags" style="margin-top:auto; margin-bottom:16px;">
      ${config.tags.map(t => `<span>${t}</span>`).join('')}
    </div>`;
  }

  return `
    <h3><a href="${url}" target="_blank">${title}</a></h3>
    <p>${desc}</p>
    ${tagsHTML}
    <div class="meta">
      ${lang ? `<span><span class="lang-dot" style="background:${getLangColor(lang)}"></span>${lang}</span>` : ""}
      <span>★ ${stars}</span>
      <span>Atualizado: ${formatDate(repo.updated_at)}</span>
    </div>
  `;
}

function renderFeatured(reposByFullName) {
  if (!featuredEl) return;
  featuredEl.innerHTML = "";

  featuredConfig.forEach(cfg => {
    const full = `${cfg.owner}/${cfg.name}`;
    const repo = reposByFullName[full];

    const card = document.createElement("div");
    card.className = "featured";

    if (repo) {
      card.innerHTML = createCardHTML(repo, cfg);
    } else {
      // Fallback para repo não encontrado
      card.innerHTML = `
        <h3>${cfg.title}</h3>
        <p>Projeto não encontrado ou privado.</p>
        <div class="tags" style="margin-top:auto; margin-bottom:16px;">
            ${(cfg.tags || []).map(t => `<span>${t}</span>`).join('')}
        </div>
        <div class="meta">
            <a href="https://github.com/${cfg.owner}" target="_blank">Ver GitHub</a>
        </div>
      `;
    }
    featuredEl.appendChild(card);
  });
}

function renderRepos(allRepos, featuredNames) {
  if (!reposEl) return;

  const others = allRepos.filter(r =>
    !featuredNames.has(`${r.owner.login}/${r.name}`) &&
    !r.fork && // Opcional: esconder forks
    !r.archived // Opcional: esconder arquivados
  );

  if (!others.length) {
    reposEl.innerHTML = "<p>Nenhum outro repositório público encontrado.</p>";
    return;
  }

  reposEl.innerHTML = "";
  others.forEach(r => {
    const div = document.createElement("div");
    div.className = "repo";
    div.innerHTML = createCardHTML(r);
    reposEl.appendChild(div);
  });
}

async function init() {
  await fetchProfile();
  const repos = await fetchRepos();

  const reposByFullName = {};
  repos.forEach(r => {
    reposByFullName[r.full_name] = r;
  });

  const featuredNames = new Set(featuredConfig.map(c => `${c.owner}/${c.name}`));

  renderFeatured(reposByFullName);
  renderRepos(repos, featuredNames);
}

init();
