"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Send, AlertCircle, CheckCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { 
  usePostJob, 
  useUSDCApproval, 
  useUSDCBalance, 
  useUSDCAllowance 
} from "@/lib/contracts/hooks"
import { SEPOLIA_ADDRESSES } from "@/lib/contracts"
import { formatUnits } from "viem"
import { uploadTaskDescription } from "@/lib/ipfs"

interface TaskSubmitProps {
  onSubmit: (task: string, jobId?: number) => void
  isProcessing: boolean
}

export default function TaskSubmit({ onSubmit, isProcessing }: TaskSubmitProps) {
  const { address } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [task, setTask] = useState("")
  const [budget, setBudget] = useState("100") // Default USDC amount
  const [isApproving, setIsApproving] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { approveUSDC, isPending: isApprovingTx } = useUSDCApproval()
  const { postJob, isPending: isPostingJob, txHash } = usePostJob()
  const { balance } = useUSDCBalance(address)
  const { allowance } = useUSDCAllowance(address, SEPOLIA_ADDRESSES.JobManager)

  // Ensure hydration matches by only rendering wallet-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if approval is needed
  const needsApproval = allowance && allowance < BigInt(budget) * BigInt(10 ** 6)
  const hasEnoughBalance = balance && balance >= BigInt(budget) * BigInt(10 ** 6)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleApproveAndSubmit()
    }
  }

  const handleApproveAndSubmit = async () => {
    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    if (!task.trim()) {
      setError("Please describe a task")
      return
    }

    if (!budget || parseFloat(budget) <= 0) {
      setError("Please set a valid budget")
      return
    }

    if (!hasEnoughBalance) {
      setError("Insufficient USDC balance")
      return
    }

    setError(null)
    setTransactionStatus("Preparing transaction...")

    if (needsApproval) {
      setTransactionStatus("Requesting USDC approval...")
      setIsApproving(true)
      try {
        await approveUSDC(SEPOLIA_ADDRESSES.JobManager, budget)
        setTransactionStatus("Approval requested, waiting for confirmation...")
      } catch (err) {
        setError(`Approval failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsApproving(false)
        return
      }
    }

    // Upload task description to IPFS
    setTransactionStatus("Uploading task to IPFS...")
    let taskCID: string
    try {
      taskCID = await uploadTaskDescription(task)
      setTransactionStatus("Task uploaded to IPFS. Posting to contract...")
    } catch (err) {
      setError(`IPFS upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return
    }

    setTransactionStatus("Posting job to contract...")
    try {
      await postJob(taskCID, budget)
      setTransactionStatus("Job posted! Waiting for confirmation...")
      onSubmit(task)
    } catch (err) {
      setError(`Job posting failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="w-full bg-[#0F0F12] border border-white/5 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00FFB2]/50 to-transparent opacity-50" />
      
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#00FFB2]" />
        <h2 className="text-white text-lg font-semibold tracking-wide">Post a Task</h2>
      </div>

      {/* Wallet Connection Status */}
      {mounted && !address && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-500 text-sm font-medium">Wallet Not Connected</p>
            <p className="text-amber-500/60 text-xs mt-1">Please connect your wallet to post a task on-chain</p>
          </div>
        </div>
      )}

      {/* USDC Balance Info */}
      {mounted && address && balance && (
        <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-[#00FFB2] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">USDC Balance: {formatUnits(balance, 6)} USDC</p>
            {needsApproval && (
              <p className="text-white/50 text-xs mt-1">Approval needed for {budget} USDC</p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Transaction Status */}
      {transactionStatus && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
          <p className="text-blue-500 text-sm">{transactionStatus}</p>
        </div>
      )}

      <div className="relative">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing || isApprovingTx || isPostingJob}
          placeholder="Describe the task you want AI agents to complete..."
          className="w-full h-32 bg-black/40 border border-white/5 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#00FFB2]/30 focus:ring-1 focus:ring-[#00FFB2]/30 resize-none disabled:opacity-50 transition-all font-mono text-sm"
        />
        
        {/* Prompts chips */}
        {!task && !isProcessing && !isApprovingTx && !isPostingJob && (
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <button 
              onClick={() => setTask("Build a REST API for user authentication with JWT tokens")}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 text-xs border border-white/5 transition-colors"
            >
              Build a REST API...
            </button>
            <button 
              onClick={() => setTask("Create a data pipeline to analyze customer churn")}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 text-xs border border-white/5 transition-colors hidden sm:block"
            >
              Create a data pipeline...
            </button>
          </div>
        )}
      </div>

      {/* Budget Input */}
      <div className="mt-4 mb-4">
        <label className="block text-white/60 text-sm font-medium mb-2">Budget (USDC)</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          disabled={isProcessing || isApprovingTx || isPostingJob}
          placeholder="Enter budget in USDC"
          className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00FFB2]/30 focus:ring-1 focus:ring-[#00FFB2]/30 disabled:opacity-50 transition-all font-mono text-sm"
          min="1"
          step="0.01"
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-white/30 text-xs flex items-center gap-1 font-mono">
          Press <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-sans">Cmd</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-sans">Enter</kbd> to submit
        </div>
        
        <button
          onClick={handleApproveAndSubmit}
          disabled={!address || !task.trim() || !budget || isProcessing || isApprovingTx || isPostingJob || !hasEnoughBalance}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
            isApprovingTx || isPostingJob
              ? "bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20 shadow-[0_0_15px_rgba(0,255,178,0.2)]"
              : "bg-[#00FFB2] text-black hover:bg-[#00FFB2]/90 disabled:opacity-30 disabled:hover:bg-[#00FFB2]"
          }`}
        >
          {isApprovingTx ? (
            <>
              <div className="w-4 h-4 border-2 border-[#00FFB2] border-t-transparent rounded-full animate-spin" />
              Approving...
            </>
          ) : isPostingJob ? (
            <>
              <div className="w-4 h-4 border-2 border-[#00FFB2] border-t-transparent rounded-full animate-spin" />
              Posting Job...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {needsApproval ? "Approve & Post" : "Post Task"}
            </>
          )}
        </button>
      </div>

      {txHash && (
        <p className="text-center text-[#00FFB2] text-xs mt-4 font-mono">
          Transaction: {txHash.slice(0, 10)}...
        </p>
      )}
    </div>
  )
}
