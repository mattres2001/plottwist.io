import { useEffect, useRef, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios.js'

const Gallery = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken()
        const { data } = await api.get('/api/session/gallery', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data.success) setSessions(data.scripts)
      } catch (err) {
        console.error('Failed to load gallery:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [sessions])

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="relative h-screen w-screen flex items-center overflow-hidden bg-sky-200">

      <a
        onClick={() => navigate(-1)}
        className="absolute top-10 left-5 z-20 bg-white/80 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 cursor-pointer"
      >
        Go Back
      </a>

      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-black text-4xl font-mono uppercase tracking-widest font-bold">
        Script Gallery
      </div>

      {loading ? (
        <div className="w-full flex items-center justify-center text-white/40 text-sm font-mono">
          Loading scripts...
        </div>
      ) : sessions.length === 0 ? (
        <div className="w-full flex items-center justify-center text-white/30 text-sm font-mono">
          No completed sessions yet.
        </div>
      ) : (
        <div ref={scrollRef} className="w-full overflow-x-auto px-10 hide-scrollbar">
          <div className="flex gap-6 py-4" style={{ width: 'max-content' }}>
            {sessions.map((session) => (
              <div
                key={session._id}
                onClick={() => setSelected(session)}
                className="flex-shrink-0 w-80 h-[560px] rounded-2xl flex flex-col cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'rgba(10,10,20,0.88)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="px-5 py-4 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="text-white font-bold font-mono tracking-widest text-sm">
                    {session.sessionId?.code ?? '—'}
                  </p>
                  <p className="text-white/40 text-xs mt-1 font-mono">
                    {formatDate(session.createdAt)} · {session.players.length} player{session.players.length !== 1 ? 's' : ''}
                  </p>
                  {session.prompt && (
                    <p className="text-sky-300/70 text-xs mt-2 italic">
                      "{session.prompt}"
                    </p>
                  )}
                </div>

                <div
                  className="flex-1 overflow-y-auto px-5 py-4 text-xs text-white/70 font-mono leading-relaxed screenplay-preview"
                  dangerouslySetInnerHTML={{ __html: session.content || '<p class="text-white/30 italic">No content recorded.</p>' }}
                />

                <div
                  className="px-5 py-3 flex-shrink-0 flex items-center justify-between"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-white/30 text-xs font-mono">Click to read full script</span>
                  {session.averageRating !== null && session.averageRating !== undefined ? (
                    <span className="text-amber-400 text-xs font-mono flex items-center gap-1">
                      ★ {session.averageRating.toFixed(1)}
                      <span className="text-white/20">({session.ratingCount})</span>
                    </span>
                  ) : (
                    <span className="text-white/20 text-xs font-mono">No ratings</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[680px] max-h-[80vh] rounded-2xl flex flex-col"
            style={{
              background: 'rgba(10,10,20,0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-8 py-5 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div>
                <p className="text-white font-bold font-mono tracking-widest">{selected.sessionId?.code ?? '—'}</p>
                <p className="text-white/40 text-xs mt-0.5 font-mono">
                  {formatDate(selected.createdAt)} · {selected.players.length} player{selected.players.length !== 1 ? 's' : ''}
                </p>
                {selected.prompt && (
                  <p className="text-sky-300/80 text-sm mt-2 italic">"{selected.prompt}"</p>
                )}
                {selected.averageRating !== null && selected.averageRating !== undefined && (
                  <p className="text-amber-400 text-sm mt-1 font-mono">
                    ★ {selected.averageRating.toFixed(1)} <span className="text-white/30 text-xs">({selected.ratingCount} rating{selected.ratingCount !== 1 ? 's' : ''})</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white/40 hover:text-white text-xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-10 py-6 text-sm text-white/80 font-mono leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selected.content || '<p class="text-white/30 italic">No content recorded.</p>' }}
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default Gallery
