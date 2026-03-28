"use client"
import { useState } from "react"
import { Check, AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { useReleasePayment, useSubmitVerification } from "@/lib/contracts/hooks"

interface VerificationAndPaymentNewProps {
  currentStep: string
  onReleasePayment?: () => void
  taskId?: number
  onPaymentReleased?: (txHash: string) => void
}

export default function VerificationAndPaymentNew({ 
  currentStep, 
  onReleasePayment,
  taskId,
  onPaymentReleased
}: VerificationAndPaymentNewProps) {
  const { address } = useAccount()
  const [verificationScores, setVerificationScores] = useState<number[]>([5, 4, 5])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  
  const { releasePayment, isPending: isReleasingPayment, txHash: paymentTxHash } = useReleasePayment()
  const { submitVerification, isPending: isSubmittingVerification, txHash: verificationTxHash } = useSubmitVerification()
  
  const showVerification = currentStep === "verifying" || currentStep === "payment" || currentStep === "completed"
  const showPayment = currentStep === "payment" || currentStep === "completed"

  const overallScore = verificationScores.length > 0 
    ? Math.round(verificationScores.reduce((a, b) => a + b, 0) / verificationScores.length * 10) 
    : 0

  const handleSubmitVerification = async () => {
    if (!address || !taskId) {
      setError("Please connect wallet")
      return
    }

    setError(null)
    setVerificationStatus("Submitting verification scores...")
    setIsVerifying(true)

    try {
      await submitVerification(taskId, verificationScores)
      setVerificationStatus("Verification submitted! Waiting for confirmation...")
    } catch (err) {
      setError(`Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsVerifying(false)
    }
  }

  const handleReleasePayment = async () => {
    if (!address || !taskId) {
      setError("Please connect wallet")
      return
    }

    setError(null)

    try {
      await releasePayment(taskId)
      onPaymentReleased?.(paymentTxHash || "")
      onReleasePayment?.()
    } catch (err) {
      setError(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-[family-name:var(--font-outfit)]">
      
      {/* Verification Results */}
      {showVerification && (
        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-[#00FFB2]">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-white text-lg font-semibold">Verification & Scoring</h3>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {verificationStatus && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3 mb-6">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
              <p className="text-blue-500 text-sm">{verificationStatus}</p>
            </div>
          )}

          {currentStep === "verifying" && !verificationStatus && (
            <div className="bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20 rounded-xl p-6 mb-6">
              <h4 className="text-white/80 text-sm font-medium mb-4">Verify Work Quality (1-5 scale)</h4>
              
              <div className="space-y-4">
                {["Code Quality", "Documentation", "Testing Coverage"].map((criterion, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white text-sm">{criterion}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={verificationScores[i]}
                          onChange={(e) => {
                            const newScores = [...verificationScores]
                            newScores[i] = Math.max(1, Math.min(5, parseInt(e.target.value) || 0))
                            setVerificationScores(newScores)
                          }}
                          className="w-12 bg-black/40 border border-white/5 rounded p-1 text-white text-center text-sm"
                        />
                        <span className="text-white/40 text-sm">/5</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" 
                        style={{ width: `${(verificationScores[i] / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white text-sm font-medium">Overall Score</span>
                  <span className="text-[#00FFB2] text-2xl font-bold">{overallScore}%</span>
                </div>
                <button
                  onClick={handleSubmitVerification}
                  disabled={isSubmittingVerification || !address}
                  className="w-full bg-[#00FFB2] text-black py-3 rounded-lg font-semibold hover:bg-[#00FFB2]/90 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingVerification ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Submitting Scores...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Submit Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep !== "verifying" && (
            <>
              <div className="bg-gradient-to-br from-[#00FFB2]/5 to-transparent border border-[#00FFB2]/20 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-[#00FFB2]" />
                </div>
                <div className="text-[#00FFB2] text-xl font-bold mb-1">Verified</div>
                <div className="text-white/60 text-sm">Work passed quality verification</div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-white/40 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Overall Score
                  </div>
                  <div className="text-[#00FFB2] font-semibold">{overallScore}%</div>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[95%] h-full bg-[#00FFB2]" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Smart Contract Payment */}
      {showPayment && (
        <div className="bg-[#0F0F12] border border-[#00FFB2]/20 rounded-2xl p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-8 text-[#00FFB2]">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-white text-lg font-semibold">Smart Contract Payment</h3>
          </div>

          <div className="bg-black/60 border border-white/5 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between px-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <span className="text-white/60 text-[11px] uppercase tracking-wider">Escrowed</span>
              </div>
              
              <div className="w-8 h-[1px] bg-white/20" />
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <div className="w-8 h-[1px] bg-[#00FFB2]/50" />

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center text-[#00FFB2] mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-white text-[11px] uppercase tracking-wider">Verified</span>
              </div>

              <div className="w-8 h-[1px] bg-white/20" />
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <div className="w-8 h-[1px] bg={currentStep === "completed" ? '#00FFB2' : 'white/20'}" />

              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep === "completed" ? 'bg-[#00FFB2]/10 border border-[#00FFB2]/30' : 'bg-white/5'}`}>
                  <svg className={`w-5 h-5 ${currentStep === "completed" ? 'text-[#00FFB2]' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
                <span className={`text-[11px] uppercase tracking-wider ${currentStep === "completed" ? 'text-[#00FFB2]' : 'text-white/40'}`}>Released</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="text-white/50 text-xs mb-1">Total Payment</div>
            <div className="text-[#00FFB2] text-4xl font-bold tracking-tight mb-2">0.200 USDC</div>
            <div className="text-white/30 text-sm">~$500.00 USD</div>
          </div>

          <div className="mb-8">
            <h4 className="text-white/80 text-sm font-medium mb-3">Payment Recipients</h4>
            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <div className="w-5 h-5 rounded bg-green-500/20 text-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  CodeCraft AI
                </div>
                <span className="text-[#00FFB2] font-mono">0.050 USDC</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <div className="w-5 h-5 rounded bg-green-500/20 text-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  DesignSynth
                </div>
                <span className="text-[#00FFB2] font-mono">0.060 USDC</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <div className="w-5 h-5 rounded bg-green-500/20 text-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  TestRunner X
                </div>
                <span className="text-[#00FFB2] font-mono">0.040 USDC</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            {currentStep === "completed" ? (
              <div className="text-center">
                <div className="text-[#00FFB2] font-semibold mb-2">✓ Payment Released</div>
                {paymentTxHash && (
                  <p className="text-white/40 text-xs font-mono">Tx: {paymentTxHash.slice(0, 15)}...</p>
                )}
                <a 
                  href="/"
                  className="w-full bg-white/10 text-white font-semibold flex items-center gap-2 justify-center py-4 rounded-xl hover:bg-white/20 transition-colors mt-4"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Return to Landing Page
                </a>
              </div>
            ) : (
              <button 
                onClick={handleReleasePayment}
                disabled={isReleasingPayment || !address}
                className="w-full bg-[#00FFB2] text-black font-semibold py-4 rounded-xl flex items-center gap-2 justify-center hover:bg-[#00FFB2]/90 shadow-[0_0_20px_rgba(0,255,178,0.2)] disabled:opacity-30 transition-all"
              >
                {isReleasingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Releasing Payment...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Release Payment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
