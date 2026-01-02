import React, { useMemo } from 'react'

export const SimpleLineChart = ({ data }) => {
  const points = useMemo(() => {
    const w = 300, h = 100, max = Math.max(...data), min = Math.min(...data)
    const xStep = w / (data.length - 1)
    return data
      .map((d, i) => {
        const x = i * xStep
        const y = h - ((d - min) / (max - min || 1)) * h
        return `${x},${y}`
      })
      .join(' ')
  }, [data])
  return (
    <svg viewBox="0 0 300 100" className="w-full h-24">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400" />
    </svg>
  )
}

export const SimpleBarChart = ({ data }) => {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="w-6 bg-indigo-500/70" style={{ height: `${(d / (max || 1)) * 100}%` }} />
      ))}
    </div>
  )
}

export const ChartsPanel = ({ seriesA, seriesB }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
      <div className="text-sm text-gray-200 font-medium mb-2">Tendencia de actividad</div>
      <SimpleLineChart data={seriesA} />
    </div>
    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
      <div className="text-sm text-gray-200 font-medium mb-2">Distribución por departamentos</div>
      <SimpleBarChart data={seriesB} />
    </div>
  </div>
)

export default ChartsPanel
