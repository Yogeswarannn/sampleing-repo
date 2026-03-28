"use client"
import { useState } from "react"
import { Copy, Download, AlertCircle } from "lucide-react"

interface TaskOutputProps {
  outputCID?: string
  taskDescription?: string
  status?: string
}

export default function TaskOutput({ outputCID, taskDescription, status }: TaskOutputProps) {
  const [output, setOutput] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchOutput = async () => {
    if (!outputCID) {
      setError("No output CID available")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch from IPFS via gateway
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${outputCID}`)
      if (!response.ok) throw new Error("Failed to fetch output")
      
      const data = await response.json()
      setOutput(data.content || JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load output")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadOutput = () => {
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(output))
    element.setAttribute("download", `task-output-${Date.now()}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!outputCID) {
    return (
      <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <p>No output available yet. Waiting for agents to complete work...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-lg font-semibold">Generated Solution</h3>
        {taskDescription && (
          <span className="text-xs bg-[#1a1a1e] px-3 py-1 rounded-lg text-gray-400">
            {taskDescription.substring(0, 40)}...
          </span>
        )}
      </div>

      {!output && (
        <button
          onClick={fetchOutput}
          disabled={loading}
          className="px-4 py-2 bg-[#00FFB2] text-black font-medium rounded-lg hover:bg-[#00FF99] disabled:opacity-50 w-fit"
        >
          {loading ? "Loading..." : "Load Solution"}
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {output && (
        <>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadOutput}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-words">
              {output}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}
