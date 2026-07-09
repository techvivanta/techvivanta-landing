(function () {
  'use strict';

  let blogs = [];
  const PER_PAGE = 9;

  function init() {
    const root = document.getElementById('blog-root');
    if (!root) return;
    fetchBlogs().then(function () {
      var params = new URLSearchParams(window.location.search);
      var slug = params.get('slug');
      if (slug) {
        renderSinglePost(slug);
      } else {
        renderListing();
      }
    }).catch(function (err) {
      console.error('Blog load error:', err);
      document.getElementById('blog-root').innerHTML = '<div class="text-center py-5"><p class="text-body-secondary">Unable to load blog posts. Please try again later.</p></div>';
    });
  }

  function fetchBlogs() {
    return fetch('./blogs.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) { blogs = (data.blogs || []).filter(function (b) { return b.published; }); })
      .catch(function () {
        return fetch('https://raw.githubusercontent.com/' + getRepoPath() + '/main/blogs.json?t=' + Date.now())
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function (data) { blogs = (data.blogs || []).filter(function (b) { return b.published; }); });
      });
  }

  function getRepoPath() {
    return document.querySelector('meta[name="gh-repo"]')
      ? document.querySelector('meta[name="gh-repo"]').getAttribute('content')
      : 'techvivanta/techvivanta-landing';
  }

  /* ── Listing ────────────────────────────────── */
  function renderListing() {
    var root = document.getElementById('blog-root');
    var page = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
    var totalPages = Math.max(1, Math.ceil(blogs.length / PER_PAGE));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    var start = (page - 1) * PER_PAGE;
    var pageBlogs = blogs.slice(start, start + PER_PAGE);

    var html = '<div class="row g-4" id="blogGrid">';
    pageBlogs.forEach(function (b) {
      html += '<div class="col-sm-6 col-lg-4">' +
        '<article class="card border-0 shadow-sm h-100 blog-card">' +
        '<img src="' + escAttr(b.image) + '" class="card-img-top" loading="lazy" decoding="async" alt="' + escAttr(b.alt || b.title) + '" onerror="this.style.display=\'none\'" />' +
        '<div class="card-body pb-0">' +
        '<h2 class="h5 card-title"><a href="?slug=' + encodeURIComponent(b.slug) + '" class="text-decoration-none stretched-link">' + escHtml(b.title) + '</a></h2>' +
        '<p class="card-text fs-sm text-body-secondary">' + escHtml(b.description) + '</p>' +
        '</div>' +
        '<div class="card-footer border-0 pt-0 pb-3">' +
        '<div class="d-flex align-items-center fs-xs text-body-secondary">' +
        '<i class="bi bi-calendar3 me-1"></i><span class="me-3">' + formatDate(b.datePublished) + '</span>' +
        '<i class="bi bi-clock me-1"></i><span>' + escHtml(b.readingTime) + '</span>' +
        '</div></div></article></div>';
    });
    html += '</div>';

    /* Pagination */
    if (totalPages > 1) {
      html += '<nav class="pt-4 mt-2 mt-md-3" aria-label="Blog pagination"><ul class="pagination justify-content-center">';
      html += '<li class="page-item' + (page <= 1 ? ' disabled' : '') + '">' +
        (page <= 1 ? '<span class="page-link"><i class="ai-arrow-left"></i></span>' : '<a class="page-link" href="?page=' + (page - 1) + '"><i class="ai-arrow-left"></i></a>') +
        '</li>';
      for (var p = 1; p <= totalPages; p++) {
        html += '<li class="page-item' + (p === page ? ' active' : '') + '">' +
          (p === page ? '<span class="page-link">' + p + '</span>' : '<a class="page-link" href="?page=' + p + '">' + p + '</a>') +
          '</li>';
      }
      html += '<li class="page-item' + (page >= totalPages ? ' disabled' : '') + '">' +
        (page >= totalPages ? '<span class="page-link"><i class="ai-arrow-right"></i></span>' : '<a class="page-link" href="?page=' + (page + 1) + '"><i class="ai-arrow-right"></i></a>') +
        '</li>';
      html += '</ul></nav>';
    }

    root.innerHTML = html;
    updateMeta('Blog | TechVivanta – Software Development Insights & Industry Trends', 'Explore TechVivanta\'s blog for expert insights on web development, mobile apps, AI, blockchain, UI/UX design, and digital transformation.');
  }

  /* ── Single Post ────────────────────────────── */
  function renderSinglePost(slug) {
    var blog = null;
    for (var i = 0; i < blogs.length; i++) {
      if (blogs[i].slug === slug) { blog = blogs[i]; break; }
    }
    if (!blog) {
      document.getElementById('blog-root').innerHTML = '<div class="text-center py-5"><h2>Post Not Found</h2><p class="text-body-secondary">The requested blog post could not be found.</p><a href="./blog.html" class="btn btn-primary mt-3">&larr; Back to Blog</a></div>';
      return;
    }

    var prevBlog = null;
    var nextBlog = null;
    if (blog.prev) { for (var j = 0; j < blogs.length; j++) { if (blogs[j].slug === blog.prev) { prevBlog = blogs[j]; break; } } }
    if (blog.next) { for (var k = 0; k < blogs.length; k++) { if (blogs[k].slug === blog.next) { nextBlog = blogs[k]; break; } } }

    /* Format the content — replace hardcoded ../contact.html with ./contact.html for root-relative linking */
    var content = (blog.content || '').replace(/href="\.\.\/contact\.html/g, 'href="./contact.html');

    var html = '<div class="row justify-content-center">' +
      '<div class="col-lg-8">' +
      '<nav aria-label="breadcrumb" class="pt-4 mt-3"><ol class="breadcrumb">' +
      '<li class="breadcrumb-item"><a href="./blog.html">Blog</a></li>' +
      '<li class="breadcrumb-item active" aria-current="page">' + escHtml(blog.category) + '</li>' +
      '</ol></nav>' +
      '<article>' +
      '<h1 class="display-5 fw-bold mb-3">' + escHtml(blog.title) + '</h1>' +
      '<div class="d-flex align-items-center text-body-secondary mb-4">' +
      '<i class="bi bi-calendar3 me-1"></i><span class="me-3">' + formatDate(blog.datePublished) + '</span>' +
      '<i class="bi bi-clock me-1"></i><span>' + escHtml(blog.readingTime) + '</span>' +
      '</div>' +
      '<div class="blog-content">' + content + '</div>' +
      '</article>' +
      '<hr class="my-5" />' +
      '<div class="row mb-5">' +
      '<div class="col-sm-6 mb-3 mb-sm-0">' +
      '<small class="text-body-secondary d-block mb-1">Previous Article</small>' +
      (prevBlog ? '<a href="?slug=' + encodeURIComponent(prevBlog.slug) + '" class="text-decoration-none fw-semibold">&larr; ' + escHtml(prevBlog.title) + '</a>' : '<span class="text-body-secondary opacity-50"><i>First article</i></span>') +
      '</div>' +
      '<div class="col-sm-6 text-sm-end">' +
      '<small class="text-body-secondary d-block mb-1">Next Article</small>' +
      (nextBlog ? '<a href="?slug=' + encodeURIComponent(nextBlog.slug) + '" class="text-decoration-none fw-semibold">' + escHtml(nextBlog.title) + ' &rarr;</a>' : '<span class="text-body-secondary opacity-50"><i>Last article</i></span>') +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';

    document.getElementById('blog-root').innerHTML = html;

    /* Update page meta */
    updateMeta(
      escHtml(blog.title) + ' | TechVivanta Blog',
      escHtml(blog.description)
    );

    /* Update canonical URL */
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = 'https://techvivanta.com/blog.html?slug=' + encodeURIComponent(slug);

    /* Scroll to top */
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Helpers ────────────────────────────────── */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escHtml(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function escAttr(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function updateMeta(title, desc) {
    document.title = title;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', desc);
    var ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute('content', title);
    var ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute('content', desc);
    var twt = document.querySelector('meta[name="twitter:title"]');
    if (twt) twt.setAttribute('content', title);
    var twd = document.querySelector('meta[name="twitter:description"]');
    if (twd) twd.setAttribute('content', desc);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
