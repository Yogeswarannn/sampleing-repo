"use client"
import { useState } from "react"
import { useAccount } from "wagmi"
import { usePostJob } from "@/lib/contracts/hooks"

export default function SimpleTaskTest() {
  const { address } = useAccount()
  const [taskInput, setTaskInput] = useState("")
  const [budgetInput, setBudgetInput] = useState("50")
  const [testStatus, setTestStatus] = useState<string>("")
  const [testError, setTestError] = useState<string>("")
  
  const { postJob, isPending } = usePostJob()

  const handleSimpleTest = async () => {
    setTestStatus("")
    setTestError("")
    
    console.log("Test started")
    console.log("Address:", address)
    console.log("Task:", taskInput)
    console.log("Budget:", budgetInput)

    if (!address) {
      setTestError("❌ Wallet not connected")
      console.error("Wallet not connected")
      return
    }

    if (!taskInput.trim()) {
      setTestError("❌ Task description is empty")
      return
    }

    setTestStatus("⏳ Attempting to post job...")
    console.log("Calling postJob with CID and budget...")

    try {
      // Test with a simple CID
      const testCID = "QmTesting123456789012345678901234567890"
      console.log("postJob called with:", testCID, budgetInput)
      
      const result = await postJob(testCID, budgetInput)
      console.log("postJob result:", result)
      
      setTestStatus("✅ Transaction sent! Hash: " + (result?.toString().slice(0, 20) || "processing..."))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setTestError("❌ " + errorMsg)
      console.error("Test error:", err)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-black/80 border border-white/10 rounded-lg p-4 z-50">
      <h3 className="text-white font-bold mb-3">🧪 Simple Test</h3>
      
      <div className="mb-3">
        <p className="text-xs text-white/60 mb-1">Wallet: {address ? address.slice(0, 10) + "..." : "Not connected"}</p>
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="Task description"
          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs mb-2"
        />
        <input
          type="number"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          placeholder="Budget"
          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs mb-2"
        />
      </div>

      {testStatus && <p className="text-green-500 text-xs mb-2">{testStatus}</p>}
      {testError && <p className="text-red-500 text-xs mb-2">{testError}</p>}

      <button
        onClick={handleSimpleTest}
        disabled={isPending || !address}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-xs font-bold py-1 rounded"
      >
        {isPending ? "Pending..." : "Test Post Job"}
      </button>
      
      <p className="text-white/40 text-xs mt-3">
        Opens browser console (F12) to see logs
      </p>
    </div>
  )
}
