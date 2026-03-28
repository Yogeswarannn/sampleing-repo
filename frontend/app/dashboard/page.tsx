"use client"
import { useState, useEffect } from "react"
import DashboardNavbar from "@/components/dashboard/DashboardNavbar"
import TaskSubmitNew from "@/components/dashboard/TaskSubmitNew"
import WorkflowProgress from "@/components/dashboard/WorkflowProgress"
import TaskPlan from "@/components/dashboard/TaskPlan"
import ExecutionViewNew from "@/components/dashboard/ExecutionViewNew"
import VerificationAndPaymentNew from "@/components/dashboard/VerificationAndPaymentNew"
import { CheckCircle2 } from "lucide-react"
import { useJobPostedEvent, useBidPlacedEvent, useWorkSubmittedEvent, useTaskVerifiedEvent } from "@/lib/contracts/hooks"

type WorkflowState = "idle" | "submitting" | "planning" | "executing" | "verifying" | "payment" | "completed";

export default function DashboardPage() {
  const [currentState, setCurrentState] = useState<WorkflowState>("idle");
  const [taskText, setTaskText] = useState("");
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [logs, setLogs] = useState<{time: string, agent: string, message: string, type: 'info'|'success'}[]>([]);
  const [contractEvents, setContractEvents] = useState<{type: string, timestamp: string}[]>([]);

  const formatTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // Listen for contract events
  useJobPostedEvent((jobId, client, descriptionCID) => {
    setContractEvents(prev => [...prev, { type: `JobPosted: ID ${jobId.toString()}`, timestamp: formatTime() }]);
    setLogs(prev => [...prev, { 
      time: formatTime(), 
      agent: "[Contract]", 
      message: `Job Posted: ID ${jobId.toString()}`, 
      type: 'success' 
    }]);
  });

  useBidPlacedEvent((taskId, bidder, quotedPrice) => {
    setContractEvents(prev => [...prev, { type: `BidPlaced: Task ${taskId.toString()}`, timestamp: formatTime() }]);
    setLogs(prev => [...prev, { 
      time: formatTime(), 
      agent: "[Agent]", 
      message: `Bid Placed: ${bidder.slice(0, 10)}... bids ${quotedPrice.toString()}`, 
      type: 'success' 
    }]);
  });

  useWorkSubmittedEvent((taskId, worker, outputCID) => {
    setContractEvents(prev => [...prev, { type: `WorkSubmitted: Task ${taskId.toString()}`, timestamp: formatTime() }]);
    setLogs(prev => [...prev, { 
      time: formatTime(), 
      agent: "[Worker]", 
      message: `Work Submitted: ${outputCID.slice(0, 20)}...`, 
      type: 'success' 
    }]);
  });

  useTaskVerifiedEvent((taskId, passed, averageScore) => {
    setContractEvents(prev => [...prev, { type: `TaskVerified: ID ${taskId.toString()}`, timestamp: formatTime() }]);
    setLogs(prev => [...prev, { 
      time: formatTime(), 
      agent: "[Verifier]", 
      message: `Task ${passed ? 'Passed' : 'Failed'} - Score: ${averageScore}`, 
      type: passed ? 'success' : 'info' 
    }]);
  });

  const runSimulation = () => {
    setCurrentState("submitting");
    setLogs([]);
    
    // Submitting -> Planning
    setTimeout(() => {
      setCurrentState("planning");
      
      // Planning -> Executing
      setTimeout(() => {
        setCurrentState("executing");
        
        const mockLogSequence = [
          { delay: 500, agent: "CodeCraft AI", message: "Processing: Create the base code architecture and scaffolding", type: 'info' },
          { delay: 2000, agent: "CodeCraft AI", message: "Completed: Generate Code Structure", type: 'success' },
          { delay: 3000, agent: "DesignSynth", message: "Starting: Design UI Components", type: 'info' },
          { delay: 4000, agent: "DesignSynth", message: "Processing: Create visual components and user interface elements", type: 'info' },
          { delay: 6000, agent: "DesignSynth", message: "Completed: Design UI Components", type: 'success' },
          { delay: 7000, agent: "DocuBot", message: "Starting: Create Documentation", type: 'info' },
          { delay: 7500, agent: "DocuBot", message: "Processing: Generate comprehensive documentation for the solution", type: 'info' },
          { delay: 9000, agent: "DocuBot", message: "Completed: Create Documentation", type: 'success' },
          { delay: 9500, agent: "TestRunner X", message: "Starting: Run Tests", type: 'info' },
          { delay: 10000, agent: "TestRunner X", message: "Processing: Execute test suite and validate functionality", type: 'info' },
          { delay: 12000, agent: "TestRunner X", message: "Completed: Run Tests", type: 'success' },
        ];
        
        mockLogSequence.forEach(logStep => {
          setTimeout(() => {
            setLogs(prev => [...prev, { time: formatTime(), agent: `[${logStep.agent}]`, message: logStep.message, type: logStep.type as 'info'|'success' }]);
          }, logStep.delay);
        });

        // Executing -> Verifying
        setTimeout(() => {
          setCurrentState("verifying");
          
          // Verifying -> Payment
          setTimeout(() => {
            setCurrentState("payment");
          }, 3000);
          
        }, 13000);
        
      }, 3000);
      
    }, 1500);
  };

  const handleTaskSubmit = (task: string, jobId?: number) => {
    setTaskText(task);
    if (jobId) setCurrentJobId(jobId);
    runSimulation();
  };

  const handleReleasePayment = () => {
    setCurrentState("completed");
  };

  return (
    <>
      <DashboardNavbar />
      
      <div className="w-full flex-1 flex flex-col items-center">
        
        {/* Hero Header for Dashboard */}
        {currentState === "idle" && (
          <div className="text-center mt-6 md:mt-12 mb-10 md:mb-16 max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-raleway)] font-bold tracking-tight text-white mb-6">
              Agent Control Center
            </h1>
            <p className="text-lg md:text-xl text-white/50 font-light leading-relaxed">
              Post a task, enable bidding, verify quality, and release payments via smart contracts.
            </p>
          </div>
        )}

        <div className="w-full">
          {/* State: Idle or Submitting */}
          <TaskSubmitNew onSubmit={handleTaskSubmit} isProcessing={currentState !== "idle"} />

        {/* Workflow Progress (visible after submitting) */}
        <WorkflowProgress currentState={currentState} />

        {/* Dashboard Grid Details */}
        {currentState !== "idle" && currentState !== "submitting" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pb-20">
            
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              <TaskPlan task={taskText} currentStep={currentState} />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {(currentState === "planning" || currentState === "executing") && (
                <ExecutionViewNew 
                  currentStep={currentState} 
                  logs={logs}
                  taskId={currentJobId || undefined}
                  onBidPlaced={(agent, amount) => {
                    setLogs(prev => [...prev, { 
                      time: formatTime(), 
                      agent: "[Bidding]", 
                      message: `${agent} placed bid: ${amount} USDC`, 
                      type: 'success' 
                    }]);
                  }}
                  onWorkSubmitted={(cid) => {
                    setLogs(prev => [...prev, { 
                      time: formatTime(), 
                      agent: "[Submission]", 
                      message: `Work submitted: ${cid.slice(0, 15)}...`, 
                      type: 'success' 
                    }]);
                  }}
                />
              )}
              
              {(currentState === "verifying" || currentState === "payment" || currentState === "completed") && (
                <VerificationAndPaymentNew 
                  currentStep={currentState} 
                  onReleasePayment={handleReleasePayment}
                  taskId={currentJobId || undefined}
                  onPaymentReleased={(txHash) => {
                    setLogs(prev => [...prev, { 
                      time: formatTime(), 
                      agent: "[Payment]", 
                      message: `Payment released: ${txHash.slice(0, 15)}...`, 
                      type: 'success' 
                    }]);
                  }}
                />
              )}
            </div>
            
          </div>
        )}
        </div>

      </div>
    </>
  )
}
