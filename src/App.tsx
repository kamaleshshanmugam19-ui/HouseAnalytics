import { useEffect, useState, type FormEvent } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  BarChart3,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Compass,
  Download,
  House,
  MapPin,
  Menu,
  Ruler,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Bar,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Property = {
  id: number
  address: string
  city: string
  zipcode: string
  type: string
  beds: number
  baths: number
  sqft: number
  year_built: number
  price: number
  grade: number
  sale_date: string
}

type MarketSummary = {
  records_analyzed: number
  median_sale_price: number
  median_price_per_sqft: number
  median_year_built: number
  monthly: { month: string; median: number; volume: number }[]
  top_areas: { name: string; zipcode: string; price: number; sales: number }[]
  grade_mix: { name: string; value: number; color: string }[]
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const apiUrl = (path: string) => `${API_BASE_URL}${path}`

type Prediction = {
  predicted_price: number
  lower_bound: number
  upper_bound: number
  model_name: string
}

const navItems = [
  { to: '/', label: 'Market overview', icon: House, end: true },
  { to: '/explore', label: 'Explore data', icon: Compass },
  { to: '/predictor', label: 'Price predictor', icon: Sparkles },
  { to: '/dataset', label: 'Dataset', icon: BarChart3 },
]

const currency = (amount: number, compact = false) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  ...(compact ? { notation: 'compact', compactDisplay: 'short' } : {}),
}).format(amount)

function useMarketSummary() {
  const [summary, setSummary] = useState<MarketSummary | null>(null)
  useEffect(() => {
    fetch(apiUrl('/api/market-summary')).then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setSummary(data) }).catch(() => undefined)
  }, [])
  return summary
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="HouseAnalytics home">
          <span className="brand-mark"><Building2 size={19} strokeWidth={2.3} /></span>
          <span className="brand-name">House<span>Analytics</span></span>
        </NavLink>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="topbar-actions">
          <button className="icon-button help-button" title="Help center" aria-label="Help center"><CircleHelp size={18} /></button>
          <span className="topbar-divider" />
          <button className="profile-button" aria-label="Account menu"><span className="avatar">JD</span><span className="profile-name">Jordan Davis</span><ChevronDown size={14} /></button>
        </div>
        <button className="mobile-menu icon-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      <main className="page-frame">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/predictor" element={<Predictor />} />
          <Route path="/dataset" element={<Dataset />} />
        </Routes>
        <footer className="page-footer"><span>HouseAnalytics</span><span>Housing intelligence, made clear.</span><span>King County sales · 2014–2015</span></footer>
      </main>
    </div>
  )
}

function PageTitle({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="page-title-row"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{detail}</p></div>{action}</div>
}

function Metric({ label, value, icon: Icon, detail }: { label: string; value: string; icon: typeof TrendingUp; detail: string }) {
  return <article className="metric-card"><div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon"><Icon size={17} /></span></div><div className="metric-value">{value}</div><div className="metric-change"><span>{detail}</span></div></article>
}

function Dashboard() {
  const summary = useMarketSummary()
  const [range, setRange] = useState('12 months')
  const [properties, setProperties] = useState<Property[]>([])
  useEffect(() => {
    fetch(apiUrl('/api/properties?limit=4')).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.items) setProperties(data.items)
    }).catch(() => undefined)
  }, [])
  const monthlyData = summary?.monthly ?? []
  const areaData = summary?.top_areas ?? []
  const gradeData = summary?.grade_mix ?? []
  const areaScale = Math.max(...areaData.map((place) => place.price), 1)

  return <>
    <PageTitle eyebrow="MARKET OVERVIEW · KING COUNTY, WA" title="Seattle-area housing market" detail="A data-led view of recorded home sales across King County." action={<span className="button button-secondary"><CalendarDays size={16} /> May 2014 – May 2015</span>} />
    <section className="metrics-grid" aria-label="Market key performance indicators">
      <Metric label="Median sale price" value={summary ? currency(summary.median_sale_price) : '—'} detail="King County sales" icon={TrendingUp} />
      <Metric label="Sales analyzed" value={summary ? summary.records_analyzed.toLocaleString() : '—'} detail="Recorded transactions" icon={House} />
      <Metric label="Median price / sq ft" value={summary ? currency(summary.median_price_per_sqft) : '—'} detail="Living area" icon={Ruler} />
      <Metric label="Median year built" value={summary ? String(summary.median_year_built) : '—'} detail="Homes sold" icon={CalendarDays} />
    </section>

    <section className="dashboard-grid">
      <article className="panel trend-panel">
        <div className="panel-heading"><div><h2>Market activity</h2><p>Sale price and transaction volume over time</p></div><div className="select-wrap"><select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Chart time range"><option>12 months</option><option>6 months</option><option>3 months</option></select><ChevronDown size={14} /></div></div>
        <div className="chart-legend"><span><i className="legend-dot blue" /> Median sale price</span><span><i className="legend-dot pale" /> Homes sold</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={range === '3 months' ? monthlyData.slice(-3) : range === '6 months' ? monthlyData.slice(-6) : monthlyData.slice(-12)} margin={{ top: 10, right: 2, bottom: 0, left: 0 }}>
          <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2d72df" stopOpacity={0.16} /><stop offset="95%" stopColor="#2d72df" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#edf1f5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a96a6', fontSize: 11 }} dy={9} /><YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#8a96a6', fontSize: 11 }} tickFormatter={(value) => `$${value}`} width={44} /><YAxis yAxisId="right" orientation="right" hide /><Tooltip formatter={(value, name) => name === 'median' ? [`$${value}k`, 'Median price'] : [value, 'Homes sold']} contentStyle={{ borderRadius: 8, borderColor: '#e7ebf0', fontSize: 12 }} /><Bar yAxisId="right" dataKey="volume" fill="#e7f0fb" radius={[3, 3, 0, 0]} barSize={17} /><Area yAxisId="left" type="monotone" dataKey="median" stroke="#276de0" strokeWidth={2.5} fill="url(#priceFill)" activeDot={{ r: 4, strokeWidth: 0 }} /></ComposedChart></ResponsiveContainer></div>
      </article>
      <article className="panel neighborhood-panel">
        <div className="panel-heading"><div><h2>Highest-value ZIP codes</h2><p>Median sale price by area</p></div><NavLink to="/dataset" className="text-button">View data <ChevronRight size={14} /></NavLink></div>
        <div className="neighborhood-list">{areaData.map((place, index) => <div className="neighborhood-row" key={place.zipcode}><span className="rank">0{index + 1}</span><div className="neighborhood-main"><div className="neighborhood-top"><strong>{place.name} <span className="table-muted">{place.zipcode}</span></strong><span>{currency(place.price * 1000, true)}</span></div><div className="bar-track"><span style={{ width: `${place.price / areaScale * 100}%`, backgroundColor: ['#2369e8', '#55a3ef', '#8bc7e8', '#a7b8cf'][index] }} /></div></div><span className="mini-growth">{place.sales.toLocaleString()} sales</span></div>)}</div>
        <div className="insight-strip"><span className="insight-spark"><Sparkles size={15} /></span><p><strong>Historical snapshot.</strong> ZIP code medians are computed from recorded King County sales.</p></div>
      </article>
    </section>

    <section className="bottom-grid">
      <article className="panel recent-panel"><div className="panel-heading"><div><h2>Recent sales</h2><p>Latest recorded transactions</p></div><NavLink to="/dataset" className="text-button">Browse dataset <ChevronRight size={14} /></NavLink></div><PropertyTable properties={properties} compact /></article>
      <article className="panel type-panel"><div className="panel-heading"><div><h2>Home grade mix</h2><p>Share of recorded sales</p></div><span className="period-label">ALL SALES</span></div><div className="type-chart-wrap"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={gradeData} dataKey="value" innerRadius={47} outerRadius={67} paddingAngle={3} stroke="none">{gradeData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>{summary ? (summary.records_analyzed / 1000).toFixed(1) : '—'}k</strong><span>sales</span></div></div><div className="type-legend">{gradeData.map((item) => <div key={item.name}><span><i style={{ backgroundColor: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div></div></article>
    </section>
  </>
}

function Explore() {
  const summary = useMarketSummary()
  const [scatterData, setScatterData] = useState<{ sqft: number; price: number }[]>([])
  useEffect(() => {
    fetch(apiUrl('/api/properties?limit=150')).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.items) setScatterData(data.items.map((item: Property) => ({ sqft: item.sqft, price: item.price / 1000 })))
    }).catch(() => undefined)
  }, [])
  const monthlyData = summary?.monthly ?? []
  const gradeData = summary?.grade_mix ?? []
  return <>
    <PageTitle eyebrow="MARKET INTELLIGENCE" title="Explore the market" detail="Explore patterns in historical King County home sales." action={<span className="button button-secondary"><Download size={16} /> 2014–2015 dataset</span>} />
    <section className="metrics-grid explore-metrics"><Metric label="Properties analyzed" value={summary ? summary.records_analyzed.toLocaleString() : '—'} detail="Recorded sales" icon={Building2} /><Metric label="Median price / sq ft" value={summary ? currency(summary.median_price_per_sqft) : '—'} detail="Living area" icon={Ruler} /><Metric label="Median sale price" value={summary ? currency(summary.median_sale_price) : '—'} detail="All property records" icon={House} /><Metric label="Median year built" value={summary ? String(summary.median_year_built) : '—'} detail="Homes sold" icon={CalendarDays} /></section>
    <section className="dashboard-grid explore-charts">
      <article className="panel trend-panel"><div className="panel-heading"><div><h2>Price and volume trends</h2><p>Monthly median sale price with transaction volume</p></div><span className="period-label">MAY 2014 — MAY 2015</span></div><div className="chart-legend"><span><i className="legend-dot blue" /> Median sale price</span><span><i className="legend-dot pale" /> Homes sold</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthlyData} margin={{ top: 10, right: 2, bottom: 0, left: 0 }}><CartesianGrid stroke="#edf1f5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a96a6', fontSize: 11 }} dy={9} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a96a6', fontSize: 11 }} tickFormatter={(value) => `$${value}`} width={44} /><Tooltip formatter={(value, name) => name === 'median' ? [`$${value}k`, 'Median price'] : [value, 'Homes sold']} /><Bar dataKey="volume" fill="#e7f0fb" radius={[3, 3, 0, 0]} barSize={17} /><Area type="monotone" dataKey="median" stroke="#276de0" strokeWidth={2.5} fill="url(#exploreFill)" /><defs><linearGradient id="exploreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2d72df" stopOpacity={0.14} /><stop offset="100%" stopColor="#2d72df" stopOpacity={0} /></linearGradient></defs></ComposedChart></ResponsiveContainer></div></article>
      <article className="panel type-panel"><div className="panel-heading"><div><h2>Home grade mix</h2><p>Share of analyzed sales</p></div><span className="period-label">ALL SALES</span></div><div className="type-chart-wrap explore-type"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={gradeData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="none">{gradeData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>{summary ? (summary.records_analyzed / 1000).toFixed(1) : '—'}k</strong><span>homes</span></div></div><div className="type-legend">{gradeData.map((item) => <div key={item.name}><span><i style={{ backgroundColor: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div></div></article>
    </section>
    <section className="bottom-grid explore-bottom"><article className="panel scatter-panel"><div className="panel-heading"><div><h2>Living area vs. sale price</h2><p>Sample of recorded King County home sales</p></div><span className="correlation"><TrendingUp size={14} /> {scatterData.length.toLocaleString()} sales</span></div><div className="scatter-chart"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 2 }}><CartesianGrid stroke="#edf1f5" /><XAxis dataKey="sqft" type="number" name="Square feet" domain={[500, 4300]} tick={{ fill: '#8a96a6', fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'Square feet', position: 'insideBottom', offset: -2, fill: '#8a96a6', fontSize: 11 }} /><YAxis dataKey="price" type="number" name="Sale price" tickFormatter={(value) => `$${value}k`} tick={{ fill: '#8a96a6', fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => name === 'Sale price' ? [`$${value}k`, name] : [value, name]} /><Scatter data={scatterData} fill="#367ce4" fillOpacity={0.72} /></ScatterChart></ResponsiveContainer></div></article><article className="panel market-note"><div className="note-icon"><Sparkles size={17} /></div><p className="eyebrow">DATASET NOTE</p><h2>A historical market snapshot</h2><p className="note-copy">This view covers recorded residential sales from May 2014 through May 2015. ZIP code and home-grade summaries use the same source records.</p><div className="note-foot"><span>{summary?.records_analyzed.toLocaleString() ?? '—'} public sales</span><ArrowUpRight size={16} /></div></article></section>
  </>
}

function Predictor() {
  const [form, setForm] = useState({ sqft: '2100', bedrooms: '3', bathrooms: '2', year_built: '2005', lot_sqft: '5000', zipcode: '98103' })
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiUrl('/api/predict'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)]))),
      })
      if (!response.ok) throw new Error('The prediction service could not process this home. Check that the API is running and try again.')
      setPrediction(await response.json())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to connect to the prediction service.')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <PageTitle eyebrow="MACHINE-LEARNING ESTIMATE" title="What’s this home worth?" detail="Get an instant estimate powered by real housing data and machine learning." />
    <section className="predictor-layout">
      <article className="panel predictor-form-panel"><div className="form-heading"><span className="form-icon"><Sparkles size={18} /></span><div><h2>Property details</h2><p>Tell us a little about the home.</p></div></div><form onSubmit={handleSubmit} className="predictor-form">
        <label className="field full-field"><span>Square footage</span><span className="input-wrap"><Ruler size={16} /><input type="number" min="300" max="15000" required value={form.sqft} onChange={(event) => setForm({ ...form, sqft: event.target.value })} /><em>sq ft</em></span></label>
        <div className="field-row"><label className="field"><span>Bedrooms</span><span className="input-wrap"><BedDouble size={16} /><select value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'bedroom' : 'bedrooms'}</option>)}</select><ChevronDown size={14} /></span></label><label className="field"><span>Bathrooms</span><span className="input-wrap"><span className="bath-icon">◌</span><select value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })}>{['1', '1.5', '2', '2.5', '3', '3.5', '4'].map((value) => <option key={value} value={value}>{value} bathrooms</option>)}</select><ChevronDown size={14} /></span></label></div>
        <div className="field-row"><label className="field"><span>Year built</span><span className="input-wrap"><CalendarDays size={16} /><input type="number" min="1850" max="2026" required value={form.year_built} onChange={(event) => setForm({ ...form, year_built: event.target.value })} /></span></label><label className="field"><span>Lot size</span><span className="input-wrap"><MapPin size={16} /><input type="number" min="500" max="100000" required value={form.lot_sqft} onChange={(event) => setForm({ ...form, lot_sqft: event.target.value })} /><em>sq ft</em></span></label></div>
        <label className="field full-field"><span>Market area</span><span className="input-wrap"><MapPin size={16} /><select value={form.zipcode} onChange={(event) => setForm({ ...form, zipcode: event.target.value })}><option value="98103">Seattle · 98103</option><option value="98115">Seattle · 98115</option><option value="98004">Bellevue · 98004</option><option value="98033">Kirkland · 98033</option><option value="98052">Redmond · 98052</option><option value="98055">Renton · 98055</option></select><ChevronDown size={14} /></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button button-primary estimate-button" disabled={loading}>{loading ? <span className="loading-dot" /> : <Sparkles size={16} />}{loading ? 'Analyzing property...' : 'Estimate property value'}<ArrowUpRight size={15} /></button>
        <p className="form-disclaimer">Estimates are generated by a machine-learning model and should not replace a professional appraisal.</p>
      </form></article>
      <article className={`panel estimate-panel ${prediction ? 'has-estimate' : ''}`}>
        {!prediction ? <div className="empty-estimate"><div className="estimate-illustration"><span><House size={29} /></span><i className="sparkle-one">✦</i><i className="sparkle-two">✦</i></div><p className="eyebrow">YOUR PROPERTY ESTIMATE</p><h2>Your estimate will appear here</h2><p>Enter the property details to see an estimated market value and price range.</p><div className="estimate-factors"><span><Check size={14} /> Local market data</span><span><Check size={14} /> Property characteristics</span><span><Check size={14} /> 500+ comparable homes</span></div></div> : <div className="result-content"><p className="eyebrow">ESTIMATED MARKET VALUE</p><h2>{currency(prediction.predicted_price)}</h2><p className="result-range">Likely range <strong>{currency(prediction.lower_bound)} – {currency(prediction.upper_bound)}</strong></p><div className="confidence-meter"><div className="confidence-title"><span>Model confidence</span><strong>Good</strong></div><div className="confidence-track"><i /></div><p>Estimate based on the property details and Seattle market patterns.</p></div><div className="result-breakdown"><div><span>Price per sq ft</span><strong>{currency(prediction.predicted_price / Number(form.sqft))}</strong></div><div><span>Model</span><strong>{prediction.model_name}</strong></div></div><button className="button button-secondary new-estimate" onClick={() => setPrediction(null)}>Edit property details</button></div>}
      </article>
    </section>
    <section className="predictor-footnote"><span className="footnote-icon"><CircleHelp size={17} /></span><p><strong>How it works</strong><span>Our Random Forest model learns from thousands of Seattle-area property records to find homes with similar characteristics.</span></p><span className="model-status"><i /> Model ready</span></section>
  </>
}

function Dataset() {
  const [properties, setProperties] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All property types')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(21613)
  const [apiOnline, setApiOnline] = useState(false)
  const pageSize = 8

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) })
    if (search) params.set('search', search)
    if (type !== 'All property types') params.set('property_type', type)
    fetch(apiUrl(`/api/properties?${params}`)).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data) { setProperties(data.items); setTotal(data.total); setApiOnline(true) }
    }).catch(() => { setApiOnline(false) })
  }, [page, search, type])

  const visible = properties.filter((property) => `${property.address} ${property.city}`.toLowerCase().includes(search.toLowerCase()))
  return <>
    <PageTitle eyebrow="PROPERTY RECORDS" title="Dataset browser" detail="Search and explore recorded King County home sales." action={<button className="button button-secondary" onClick={() => window.location.href = apiUrl('/api/properties/export')}><Download size={16} /> Export CSV</button>} />
    <section className="dataset-summary"><div><span className="dataset-summary-icon"><Building2 size={17} /></span><p><strong>{total.toLocaleString()}</strong><span>property records · 2014–2015</span></p></div><span className={`api-status ${apiOnline ? 'online' : ''}`}><i />{apiOnline ? 'API connected' : 'API unavailable'}</span></section>
    <section className="panel dataset-panel"><div className="dataset-toolbar"><label className="search-box"><Search size={17} /><input placeholder="Search sale ID, city, or ZIP..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /><kbd>⌘ K</kbd></label><label className="filter-select"><SlidersHorizontal size={15} /><select value={type} onChange={(event) => { setType(event.target.value); setPage(1) }}><option>All property types</option><option>Single family</option></select><ChevronDown size={14} /></label></div>
      <div className="table-scroll"><PropertyTable properties={visible} /></div>
      <div className="pagination"><span>Showing <strong>{Math.min((page - 1) * pageSize + (visible.length ? 1 : 0), total)}–{Math.min((page - 1) * pageSize + visible.length, total)}</strong> of <strong>{total.toLocaleString()}</strong> properties</span><div><button aria-label="Previous page" disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}><ChevronLeft size={16} /></button><span className="page-number">{page}</span><button aria-label="Next page" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button></div></div>
    </section>
    <section className="data-note"><span><CircleHelp size={16} /></span><p>Historical public King County sales data (May 2014–May 2015), distributed via Kaggle. Not current listings or financial advice.</p></section>
  </>
}

function PropertyTable({ properties, compact = false }: { properties: Property[]; compact?: boolean }) {
  return <table className={`property-table ${compact ? 'compact-table' : ''}`}><thead><tr><th>Property</th><th>Type</th><th>Beds / baths</th><th>Sq ft</th><th>Sale price</th><th>Sale date</th></tr></thead><tbody>{properties.length ? properties.map((property) => <tr key={property.id}><td><div className="property-cell"><span className="property-thumb"><House size={16} /></span><span><strong>{property.address}</strong><small>{property.city}, WA · {property.zipcode}</small></span></div></td><td><span className="type-label">{property.type}</span></td><td>{property.beds} bd <span className="table-muted">/</span> {property.baths} ba</td><td>{property.sqft.toLocaleString()}</td><td className="price-cell">{currency(property.price)}</td><td><span className="days-cell">{new Date(`${property.sale_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></td></tr>) : <tr><td colSpan={6} className="no-results">No properties match your search.</td></tr>}</tbody></table>
}

export default App