const ADMIN_USER = 'techvivanta';
const ADMIN_PASS = 'TeViva@social.9840';
const JSON_PATH = 'blogs.json';
const GITHUB_API = 'https://api.github.com';

let blogs = [];
let editingIndex = -1;
let ghRepo = '';
let ghToken = '';

function $(id) { return document.getElementById(id); }

/* Auth */
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const u = $('username').value.trim();
    const p = $('password').value.trim();
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      $('loginError').textContent = '';
      showScreen('dashboardScreen');
      loadSavedConfig();
    } else {
      $('loginError').textContent = 'Invalid username or password.';
    }
  });
});

function logout() {
  showScreen('loginScreen');
  $('username').value = '';
  $('password').value = '';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || '') + ' show';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.remove('show'), 3500);
}

/* GitHub Config persistence */
function loadSavedConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem('tv_gh_config') || '{}');
    if (cfg.repo) $('ghRepo').value = cfg.repo;
    if (cfg.token) $('ghToken').value = cfg.token;
    if (cfg.repo && cfg.token) connectGitHub();
  } catch (e) {}
}

function saveConfig(repo, token) {
  localStorage.setItem('tv_gh_config', JSON.stringify({ repo, token }));
}

/* GitHub Connection */
async function connectGitHub() {
  ghRepo = $('ghRepo').value.trim();
  ghToken = $('ghToken').value.trim();
  if (!ghRepo || !ghToken) { showToast('Please enter repo and token', 'error'); return; }
  if (!ghRepo.includes('/')) { showToast('Repo must be in format: owner/repo', 'error'); return; }
  saveConfig(ghRepo, ghToken);
  $('repoStatus').textContent = ghRepo;
  await loadBlogs();
}

async function apiCall(method, path, body) {
  const url = GITHUB_API + '/repos/' + ghRepo + path;
  const headers = {
    Authorization: 'Bearer ' + ghToken,
    Accept: 'application/vnd.github+json',
  };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}

async function loadBlogs() {
  showLoading(true);
  try {
    let content;
    try {
      const fileData = await apiCall('GET', '/contents/' + JSON_PATH);
      content = decodeBase64(fileData.content);
      window._ghFileSha = fileData.sha;
    } catch (e) {
      if (e.message.includes('Not Found')) {
        content = JSON.stringify({ blogs: [] });
        window._ghFileSha = null;
      } else { throw e; }
    }
    blogs = JSON.parse(content).blogs || [];
    renderBlogList();
    showToast('Loaded ' + blogs.length + ' blog posts', 'success');
  } catch (e) {
    showToast('Failed to load: ' + e.message, 'error');
  }
  showLoading(false);
}

function decodeBase64(str) {
  try {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) {
    return atob(str);
  }
}

function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function showLoading(v) {
  $('loadingIndicator').style.display = v ? 'flex' : 'none';
}

/* Render blog list */
function renderBlogList() {
  const list = $('blogList');
  if (!blogs.length) {
    list.innerHTML = '<div class="blog-card" style="justify-content:center;padding:40px;color:var(--text2)">No blog posts yet. Click "+ New Post" to create one.</div>';
    return;
  }
  list.innerHTML = blogs.map((b, i) => {
    const date = b.datePublished ? new Date(b.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    return '<div class="blog-card">' +
      '<div class="blog-card-info">' +
        '<div><span class="blog-status ' + (b.published ? 'published' : 'draft') + '"></span><span class="blog-card-title">' + escHtml(b.title) + '</span></div>' +
        '<div class="blog-card-meta">' + (b.category || 'Uncategorized') + ' &middot; ' + date + ' &middot; ' + (b.readingTime || '') + ' &middot; <code>' + escHtml(b.slug) + '</code></div>' +
      '</div>' +
      '<div class="blog-card-actions">' +
        '<button class="btn btn-sm btn-outline" onclick="openEditor(' + i + ')">Edit</button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteBlog(' + i + ')">Delete</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

/* Editor */
function openEditor(index) {
  editingIndex = index;
  if (index >= 0 && index < blogs.length) {
    const b = blogs[index];
    $('editorTitle').textContent = 'Edit: ' + b.title;
    $('editTitle').value = b.title || '';
    $('editSlug').value = b.slug || '';
    $('editCategory').value = b.category || '';
    $('editDate').value = b.datePublished || '';
    $('editReadingTime').value = b.readingTime || '';
    $('editDescription').value = b.description || '';
    $('editImage').value = b.image || '';
    $('editAlt').value = b.alt || '';
    $('editContent').value = b.content || '';
    $('editPrev').value = b.prev || '';
    $('editNext').value = b.next || '';
  } else {
    editingIndex = -1;
    $('editorTitle').textContent = 'New Blog Post';
    ['editTitle','editSlug','editCategory','editDate','editReadingTime','editDescription','editImage','editAlt','editContent','editPrev','editNext'].forEach(id => $(id).value = '');
    const today = new Date().toISOString().split('T')[0];
    $('editDate').value = today;
  }
  $('editorError').style.display = 'none';
  $('editorSuccess').style.display = 'none';
  showScreen('editorScreen');
  $('editTitle').focus();
}

function closeEditor() {
  if (editingIndex >= 0) showScreen('dashboardScreen');
  else showScreen('dashboardScreen');
}

async function saveBlog() {
  const title = $('editTitle').value.trim();
  const slug = $('editSlug').value.trim();
  if (!title || !slug) { showToast('Title and slug are required', 'error'); return; }

  // Auto-generate slug from title if not provided
  const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  $('editSlug').value = finalSlug;

  const blog = {
    slug: finalSlug,
    title: title,
    description: $('editDescription').value.trim(),
    content: $('editContent').value.trim(),
    image: $('editImage').value.trim(),
    alt: $('editAlt').value.trim(),
    category: $('editCategory').value.trim() || 'Uncategorized',
    author: 'TechVivanta',
    datePublished: $('editDate').value || new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
    readingTime: $('editReadingTime').value.trim() || Math.ceil(($('editContent').value.split(' ').length / 200)) + ' min read',
    prev: $('editPrev').value.trim() || null,
    next: $('editNext').value.trim() || null,
    published: true
  };

  if (blog.prev === '') blog.prev = null;
  if (blog.next === '') blog.next = null;

  if (editingIndex >= 0 && editingIndex < blogs.length) {
    blogs[editingIndex] = blog;
  } else {
    blogs.push(blog);
  }

  // Sort by date descending
  blogs.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));

  showLoading(true);
  try {
    await pushToGitHub();
    showToast('Blog saved to GitHub successfully!', 'success');
    $('editorSuccess').style.display = 'block';
    $('editorSuccess').textContent = 'Changes pushed to GitHub. The public site will reflect updates on next page load.';
    renderBlogList();
    showScreen('dashboardScreen');
  } catch (e) {
    showToast('Failed to save: ' + e.message, 'error');
    $('editorError').style.display = 'block';
    $('editorError').textContent = 'GitHub Error: ' + e.message;
  }
  showLoading(false);
}

async function deleteBlog(index) {
  if (index < 0 || index >= blogs.length) return;
  const b = blogs[index];
  if (!confirm('Delete "' + b.title + '"?')) return;
  blogs.splice(index, 1);
  showLoading(true);
  try {
    await pushToGitHub();
    showToast('Blog deleted from GitHub', 'success');
    renderBlogList();
  } catch (e) {
    showToast('Failed to delete: ' + e.message, 'error');
  }
  showLoading(false);
}

async function pushToGitHub() {
  const content = JSON.stringify({ blogs }, null, 2);
  const encoded = encodeBase64(content);
  const body = {
    message: 'Update blogs.json via admin panel',
    content: encoded,
    branch: 'main'
  };
  if (window._ghFileSha) body.sha = window._ghFileSha;
  try {
    const result = await apiCall('PUT', '/contents/' + JSON_PATH, body);
    window._ghFileSha = result.content.sha;
  } catch (e) {
    throw e;
  }
}
