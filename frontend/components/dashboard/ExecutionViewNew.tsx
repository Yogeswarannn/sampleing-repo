"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Info, AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { usePlaceBid, useSubmitWork } from "@/lib/contracts/hooks"

type Agent = { name: string, role: string, roleColor: string, cost: string, address?: string }

const agents: Agent[] = [
  { name: "DataMiner Pro", role: "Data Analysis", roleColor: "text-blue-400", cost: "0.030", address: "0x1234...5678" },
  { name: "CodeCraft AI", role: "Code Generation", roleColor: "text-green-400", cost: "0.050", address: "0x2345...6789" },
  { name: "DesignSynth", role: "UI Design", roleColor: "text-pink-400", cost: "0.060", address: "0x3456...7890" },
  { name: "DocuBot", role: "Documentation", roleColor: "text-orange-400", cost: "0.020", address: "0x4567...8901" },
  { name: "TestRunner X", role: "Testing", roleColor: "text-cyan-400", cost: "0.040", address: "0x5678...9012" },
]

interface ExecutionViewNewProps {
  currentStep: string
  logs: any[]
  taskId?: number
  onBidPlaced?: (bidder: string, amount: string) => void
  onWorkSubmitted?: (outputCID: string) => void
}

export default function ExecutionViewNew({ 
  currentStep, 
  logs, 
  taskId,
  onBidPlaced,
  onWorkSubmitted
}: ExecutionViewNewProps) {
  const { address } = useAccount()
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [outputCID, setOutputCID] = useState("")
  const [isBiddingOpen, setIsBiddingOpen] = useState(false)
  const [isSubmittingWork, setIsSubmittingWork] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { placeBid, isPending: isBidding } = usePlaceBid()
  const { submitWork, isPending: isSubmitting } = useSubmitWork()

  const getStatus = (index: number) => {
    if (currentStep === "payment" || currentStep === "verifying" || currentStep === "completed") return "Completed"
    if (currentStep === "executing") {
      const progress = Math.min(100, logs.length * 10)
      if (progress > index * 20 + 20) return "Completed"
      if (progress > index * 20) return "Processing"
    }
    return "Idle"
  }

  const handlePlaceBid = async (agentIndex: number) => {
    if (!address || !taskId || !bidAmount) {
      setError("Please connect wallet and enter bid amount")
      return
    }

    const agent = agents[agentIndex]
    setError(null)

    try {
      await placeBid(taskId, bidAmount, agent.address || "0x" + agentIndex.toString().padStart(40, "0"))
      onBidPlaced?.(agent.name, bidAmount)
      setBidAmount("")
      setSelectedAgent(null)
    } catch (err) {
      setError(`Bid placement failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSubmitWork = async () => {
    if (!address || !taskId || !outputCID) {
      setError("Please connect wallet and enter output CID")
      return
    }

    setError(null)

    try {
      await submitWork(taskId, outputCID)
      onWorkSubmitted?.(outputCID)
      setOutputCID("")
      setIsSubmittingWork(false)
    } catch (err) {
      setError(`Work submission failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">

      <div className="flex-1 bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white text-lg font-semibold mb-6">Assigned Agents & Bidding</h3>
        
        {isBiddingOpen && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-500 text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Bidding round open! Agents can place bids on this task.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent, i) => {
            const status = getStatus(i)
            const isSelected = selectedAgent === i
            
            return (
              <motion.div 
                key={i}
                layout
                className={`bg-black/40 border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected ? 'border-[#00FFB2]/50 bg-[#00FFB2]/5' : 'border-white/5 hover:border-white/10'
                }`}
                onClick={() => setSelectedAgent(isSelected ? null : i)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <svg className={`w-4 h-4 ${status === 'Completed' ? 'text-[#00FFB2]' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{agent.name}</div>
                      <div className={`text-[10px] ${agent.roleColor}`}>{agent.role}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/60 text-xs">Initial Quote</span>
                  <span className={`text-sm font-semibold ${status === 'Completed' ? 'text-[#00FFB2]' : 'text-white'}`}>
                    ${agent.cost} USDC
                  </span>
                </div>

                {isSelected && isBiddingOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/5 pt-3 mt-3 space-y-2"
                  >
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Bid amount (USDC)"
                      className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#00FFB2]/30"
                      step="0.01"
                    />
                    <button
                      onClick={() => handlePlaceBid(i)}
                      disabled={isBidding || !bidAmount}
                      className="w-full bg-[#00FFB2]/20 hover:bg-[#00FFB2]/30 text-[#00FFB2] text-xs py-1.5 rounded disabled:opacity-50 transition-colors"
                    >
                      {isBidding ? "Bidding..." : "Place Bid"}
                    </button>
                  </motion.div>
                )}

                <span className={`text-[10px] px-2 py-1 rounded-full self-start ${
                  status === "Completed" ? "bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20" :
                  status === "Processing" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                  "bg-white/5 text-white/40 border border-white/10"
                }`}>
                  {status}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Bidding Controls */}
        {currentStep === "executing" && (
          <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
            <button
              onClick={() => setIsBiddingOpen(!isBiddingOpen)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isBiddingOpen 
                  ? 'bg-[#00FFB2] text-black hover:bg-[#00FFB2]/90' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isBiddingOpen ? "Close Bidding" : "Open Bidding Round"}
            </button>
          </div>
        )}
      </div>

      {/* Work Submission Section */}
      {currentStep === "executing" && (
        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Submit Work Output</h3>
          <div className="space-y-3">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Output IPFS CID</label>
              <input
                type="text"
                value={outputCID}
                onChange={(e) => setOutputCID(e.target.value)}
                placeholder="QmXxxx... (IPFS CID of completed work)"
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00FFB2]/30 font-mono text-sm"
              />
            </div>
            <button
              onClick={handleSubmitWork}
              disabled={!outputCID || isSubmitting || !address}
              className="w-full bg-[#00FFB2] text-black py-3 rounded-lg font-semibold hover:bg-[#00FFB2]/90 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Work
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Terminal Logs */}
      <div className="flex-1 bg-[#050505] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative font-mono text-[11px] h-[300px]">
        <div className="bg-[#1A1A20] border-b border-white/5 h-10 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2 text-white/60 font-sans text-xs">
            <span className="text-[#00FFB2]">&gt;_</span> Execution Terminal
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-white/70 font-mono text-[13px]">
          {logs.map((log, i) => {
            const [prefix, ...rest] = log.message.split(": ")
            const content = rest.join(": ")
            
            return (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                key={i} 
                className="flex items-start gap-3"
              >
                <span className="text-white/40 shrink-0">{log.time}</span>
                {log.type === "info" ? (
                  <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-white/60 shrink-0 mt-0.5 text-[10px] font-sans italic">i</div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#00FFB2] flex items-center justify-center text-[#00FFB2] shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="flex-1 break-words leading-tight">
                  <span className="text-indigo-400 mr-2">{log.agent}</span>
                  {log.type === "success" ? (
                    <span className="text-[#00FFB2]">
                      {prefix}: {content}
                    </span>
                  ) : (
                    <span className="text-white/60">
                      {prefix}: <span className="text-white/60">{content}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
          {currentStep === "executing" && (
            <div className="text-[#00FFB2] mt-4 flex items-center font-mono text-[13px]">
              $ <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-[1em] bg-[#00FFB2] inline-block align-middle ml-1.5" />
            </div>
          )}
        </div>

        <div className="bg-[#1A1A20] border-t border-white/5 h-8 flex items-center px-4 justify-between text-white/40 font-sans text-xs">
          <span>{logs.length} log entries</span>
          <span>{currentStep === "executing" ? "Processing..." : "Ready"}</span>
        </div>
      </div>
    </div>
  )
}
