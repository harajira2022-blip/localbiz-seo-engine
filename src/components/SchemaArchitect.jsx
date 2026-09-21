import { useState, useMemo } from 'react'

const BUSINESS_TYPES = [
  'LocalBusiness',
  'Restaurant',
  'CafeOrCoffeeShop',
  'Bakery',
  'HairSalon',
  'AutoRepair',
  'Dentist',
  'Electrician',
  'Plumber',
  'ClothingStore',
  'Gym',
]

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const initialState = {
  name: '',
  type: 'LocalBusiness',
  address: '',
  phone: '',
  logoUrl: '',
  opens: '09:00',
  closes: '18:00',
  days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
}

function toDomainGuess(name) {
  if (!name) return 'yourbusiness.com'
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '')
  return `${slug || 'yourbusiness'}.com`
}

function buildJsonLd(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.name || 'Your Business Name',
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address || 'Street address',
    },
    telephone: data.phone || '+1-000-000-0000',
    ...(data.logoUrl ? { image: data.logoUrl } : {}),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: data.days,
        opens: data.opens,
        closes: data.closes,
      },
    ],
  }
  return JSON.stringify(schema, null, 2)
}

export default function SchemaArchitect() {
  const [data, setData] = useState(initialState)
  const [copied, setCopied] = useState(false)

  const jsonLd = useMemo(() => buildJsonLd(data), [data])
  const scriptTag = `<script type="application/ld+json">\n${jsonLd}\n</script>`

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }))
    setCopied(false)
  }

  function toggleDay(day) {
    setData((prev) => {
      const has = prev.days.includes(day)
      const days = has ? prev.days.filter((d) => d !== day) : [...prev.days, day]
      return { ...prev, days }
    })
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(scriptTag)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const hoursLabel = `${data.days.length ? data.days.join(', ') : 'No days set'} · ${data.opens}–${data.closes}`

  return (
    <div className="workspace two-col">
      <section className="panel">
        <h2>Business details</h2>
        <p className="hint">
          Fill this in once — it drives both the search preview and the JSON-LD code on the right.
        </p>

        <div className="field">
          <label htmlFor="name">Business name</label>
          <input
            id="name"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Abol Coffee House"
          />
        </div>

        <div className="field">
          <label htmlFor="type">Business type</label>
          <select id="type" value={data.type} onChange={(e) => update('type', e.target.value)}>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="e.g. Bole Road, Addis Ababa"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+251 9xx xxx xxx"
            />
          </div>
          <div className="field">
            <label htmlFor="logo">Logo URL</label>
            <input
              id="logo"
              value={data.logoUrl}
              onChange={(e) => update('logoUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="field">
          <label>Opening hours</label>
          <div className="filter-row" style={{ marginBottom: 10 }}>
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                className={`filter-chip ${data.days.includes(d) ? 'active' : ''}`}
                onClick={() => toggleDay(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="field-row">
            <input type="time" value={data.opens} onChange={(e) => update('opens', e.target.value)} />
            <input type="time" value={data.closes} onChange={(e) => update('closes', e.target.value)} />
          </div>
        </div>
      </section>

      <div className="workspace">
        <section className="panel">
          <h2>Live Google preview</h2>
          <p className="hint">This is a simulation of how the result could look on a search page as you type.</p>

          <div className="serp-frame">
            <div className="serp-frame__chrome">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="serp-frame__body">
              <div className="serp-result__breadcrumb">
                <span className="serp-result__favicon">
                  {(data.name || 'Y').trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="serp-result__site">{data.name || 'Your Business Name'}</div>
                  <div className="serp-result__path">
                    {toDomainGuess(data.name)} › {data.type.toLowerCase()}
                  </div>
                </div>
              </div>
              <div className="serp-result__title">
                {data.name || 'Your Business Name'} — {data.type}
              </div>
              <div className="serp-result__desc">
                {data.address || 'Street address'} · {data.phone || '+1-000-000-0000'}. Open{' '}
                {hoursLabel}.
              </div>
              <div className="serp-result__rich">
                <span className="serp-chip">★ Rich result eligible</span>
                <span className="serp-chip">{data.type}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>JSON-LD output</h2>
          <p className="hint">Paste this into the <code>&lt;head&gt;</code> of the business's website.</p>
          <div className="code-block">
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
              {copied ? 'Copied ✓' : 'Copy to clipboard'}
            </button>
            <pre>{scriptTag}</pre>
          </div>
        </section>
      </div>
    </div>
  )
}