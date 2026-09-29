import { useState, useMemo } from 'react'

const TITLE_LIMIT = 60
const DESC_LIMIT = 160

function evaluate(title, description) {
  const issues = []

  if (title.length > TITLE_LIMIT) {
    issues.push({ level: 'warning', text: `Title is ${title.length} chars (over ${TITLE_LIMIT})` })
  }

  if (!description.trim()) {
    issues.push({ level: 'error', text: 'Meta description is missing' })
  } else if (description.length > DESC_LIMIT) {
    issues.push({ level: 'error', text: `Description is ${description.length} chars (over ${DESC_LIMIT})` })
  }

  if (issues.some((i) => i.level === 'error')) return { status: 'error', issues }
  if (issues.some((i) => i.level === 'warning')) return { status: 'warning', issues }
  return { status: 'good', issues: [] }
}

function StatusBadge({ status }) {
  const labels = { good: 'Good', warning: 'Warning', error: 'Error' }
  return <span className={`status-badge ${status}`}>{labels[status]}</span>
}

export default function MetaAuditor() {
  const [form, setForm] = useState({ url: '', title: '', description: '' })
  const [pages, setPages] = useState([])
  const [filter, setFilter] = useState('all')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const liveCheck = useMemo(() => evaluate(form.title, form.description), [form.title, form.description])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

    async function handleFetchUrl() {
    setFetchError('')
    const raw = form.url.trim()
    if (!raw) {
      setFetchError('Enter a URL first')
      return
    }

    let target
    try {
      target = new URL(raw).toString()
    } catch {
      setFetchError("That doesn't look like a valid URL (include https://)")
      return
    }

    // Public CORS proxies: browsers usually can't fetch other websites
    // directly (CORS security rule), so we route the request through a
    // free proxy service that fetches the page on our behalf and hands
    // back the raw HTML. This is the "automation" step: the app reads
    // the page itself instead of the user pasting values in.
    // Free proxies are unreliable individually, so we try a few in a
    // row and use whichever responds first — a small robustness layer
    // documented as a stand-in for a real backend fetch service.
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(target)}`,
      `https://thingproxy.freeboard.io/fetch/${target}`,
    ]

    setFetching(true)
    let html = null

    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl)
        if (!res.ok) continue
        const text = await res.text()
        if (text && text.length > 50) {
          html = text
          break
        }
      } catch {
        // try the next proxy
      }
    }

    if (!html) {
      setFetchError(
        'Could not fetch that page through any proxy — the page may block automated requests, or all free proxies are busy right now. You can still type the fields in manually.'
      )
      setFetching(false)
      return
    }

    const doc = new DOMParser().parseFromString(html, 'text/html')
    const title = doc.querySelector('title')?.textContent?.trim() || ''
    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || ''

    setForm((prev) => ({ ...prev, title, description }))

    if (!title && !description) {
      setFetchError('Fetched the page, but it has no <title> or meta description tag')
    }

    setFetching(false)
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!form.url.trim() || !form.title.trim()) return

    const result = evaluate(form.title, form.description)
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: form.url.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      ...result,
    }
    setPages((prev) => [entry, ...prev])
    setForm({ url: '', title: '', description: '' })
    setFetchError('')
  }

  function removePage(id) {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }

  const counts = useMemo(() => {
    return pages.reduce(
      (acc, p) => {
        acc[p.status] += 1
        return acc
      },
      { good: 0, warning: 0, error: 0 }
    )
  }, [pages])

  const visiblePages = filter === 'all' ? pages : pages.filter((p) => p.status === filter)
  const canSubmit = form.url.trim() && form.title.trim()

  const titleClass = form.title.length > TITLE_LIMIT ? 'warn' : ''
  const descClass = !form.description.trim()
    ? 'err'
    : form.description.length > DESC_LIMIT
    ? 'err'
    : ''

  return (
    <div className="workspace two-col">
      <section className="panel">
        <h2>Audit a page</h2>
        <p className="hint">
          Paste a page's URL and click Fetch to automatically pull its title and description — or
          type them in yourself. The badge below updates live as you type.
        </p>

        <form onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="url">Page URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="url"
                style={{ flex: 1 }}
                value={form.url}
                onChange={(e) => update('url', e.target.value)}
                placeholder="https://example.com/menu"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleFetchUrl}
                disabled={fetching}
              >
                {fetching ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
            {fetchError && <div className="char-count err">{fetchError}</div>}
          </div>

          <div className="field">
            <label htmlFor="title">Meta title</label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Menu — Abol Coffee House, Addis Ababa"
            />
            <div className={`char-count ${titleClass}`}>{form.title.length} / {TITLE_LIMIT}</div>
          </div>

          <div className="field">
            <label htmlFor="description">Meta description</label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Short, clear summary of the page for search results…"
            />
            <div className={`char-count ${descClass}`}>{form.description.length} / {DESC_LIMIT}</div>
          </div>

          <div className="field">
            <label>Result if added now</label>
            <StatusBadge status={liveCheck.status} />
          </div>

          <button className="btn-primary" type="submit" disabled={!canSubmit}>
            Add to audit log
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Page inventory</h2>
        <p className="hint">
          {pages.length} page{pages.length === 1 ? '' : 's'} audited · {counts.good} good ·{' '}
          {counts.warning} warning · {counts.error} error
        </p>

        <div className="filter-row">
          {['all', 'good', 'warning', 'error'].map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === 'all' ? `All (${pages.length})` : `${f[0].toUpperCase()}${f.slice(1)} (${counts[f]})`}
            </button>
          ))}
        </div>

        {visiblePages.length === 0 ? (
          <div className="empty-state">
            {pages.length === 0
              ? 'No pages audited yet — add one on the left.'
              : 'No pages match this filter.'}
          </div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Status</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visiblePages.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="page-url">{p.url}</div>
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    {p.issues.length === 0 ? '—' : p.issues.map((i) => i.text).join('; ')}
                  </td>
                  <td>
                    <button
                      className="remove-btn"
                      aria-label={`Remove ${p.url}`}
                      onClick={() => removePage(p.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}