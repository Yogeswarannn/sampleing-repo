# Agent Bazaar - Complete Integration Guide

## 🎯 Overview

This document provides a comprehensive guide to the fully integrated Agent Bazaar system, including smart contracts, frontend UI, and backend orchestration.

## ✅ What's Been Implemented

### 1. **Smart Contract Interactions (Frontend)**

All contract write operations are now fully implemented in the frontend using Wagmi hooks.

#### Contract Hooks (`frontend/lib/contracts/hooks.ts`)

**USDC Approval:**
```typescript
const { approveUSDC, isPending } = useUSDCApproval();
await approveUSDC(spender, amount); // Approve spending limit
```

**Job Posting:**
```typescript
const { postJob, isPending, txHash } = usePostJob();
await postJob(descriptionCID, budget, timeLimit);
```

**Bidding:**
```typescript
const { placeBid, isPending, txHash } = usePlaceBid();
await placeBid(taskId, quotedPrice, credentials);
```

**Work Submission:**
```typescript
const { submitWork, isPending, txHash } = useSubmitWork();
await submitWork(taskId, outputCID);
```

**Verification:**
```typescript
const { submitVerification, isPending, txHash } = useSubmitVerification();
await submitVerification(taskId, scoresArray);
```

**Payment Release:**
```typescript
const { releasePayment, isPending, txHash } = useReleasePayment();
await releasePayment(taskId);
```

### 2. **Event Listeners**

Real-time contract event listening with automatic UI updates:

```typescript
// Listen for JobPosted events
useJobPostedEvent((jobId, client, descriptionCID) => {
  console.log(`Job #${jobId} posted by ${client}`);
});

// Listen for BidPlaced events
useBidPlacedEvent((taskId, bidder, quotedPrice) => {
  console.log(`Bid placed on task #${taskId}`);
});

// Listen for WorkSubmitted events
useWorkSubmittedEvent((taskId, worker, outputCID) => {
  console.log(`Work submitted for task #${taskId}`);
});

// Listen for TaskVerified events
useTaskVerifiedEvent((taskId, passed, averageScore) => {
  console.log(`Task #${taskId} verified: ${passed ? 'PASSED' : 'FAILED'}`);
});
```

### 3. **USDC Integration**

**Check Balance:**
```typescript
const { balance, isLoading } = useUSDCBalance(address);
```

**Check Allowance:**
```typescript
const { allowance, isLoading } = useUSDCAllowance(owner, spender);
```

### 4. **Enhanced UI Components**

#### TaskSubmitNew.tsx
- ✅ Wallet connection check
- ✅ USDC balance verification
- ✅ Automatic approval handling
- ✅ Real IPFS upload integration
- ✅ Transaction status tracking

**Features:**
- Checks wallet connection
- Displays USDC balance
- Requests approval if needed
- Uploads task description to IPFS
- Posts job to smart contract
- Shows transaction hash

#### ExecutionViewNew.tsx
- ✅ Agent assignment display
- ✅ Bidding round management
- ✅ Real bid placement
- ✅ Work submission with IPFS CID
- ✅ Execution logs

**Features:**
- Opens/closes bidding round
- Agents can place bids on tasks
- Workers can submit output CIDs
- Real-time execution logs
- Transaction confirmation

#### VerificationAndPaymentNew.tsx
- ✅ Quality scoring interface (1-5 scale)
- ✅ Real verification submission
- ✅ Payment flow visualization
- ✅ Actual payment release

**Features:**
- Interactive scoring for each criterion
- Overall score calculation
- Submit real verification to contract
- Release payment with transaction confirmation
- Transaction hash display

### 5. **IPFS Integration**

**Upload Files:**
```typescript
import { uploadTaskDescription, uploadWorkOutput } from "@/lib/ipfs";

// Upload task
const cid = await uploadTaskDescription(taskText);

// Upload work
const cid = await uploadWorkOutput(outputFile);

// Get IPFS URL
const url = getIPFSUrl(cid);
```

### 6. **Backend Contract Integration**

#### contract_integration.py

**Contract Manager:**
```python
from contract_integration import contract_manager, register_event_handler

# Check connection
if contract_manager.is_connected():
    print("Connected to Ethereum!")

# Get balance
balance = contract_manager.get_account_balance()
```

**Event Handlers:**
```python
async def handle_job_posted(event_data):
    job_id = event_data['jobId']
    client = event_data['client']
    # Trigger planner agent
    
register_event_handler('JobPosted', handle_job_posted)
```

### 7. **Backend API Endpoints**

New contract-aware endpoints in FastAPI:

```
GET  /contract/status           - Check contract connection
POST /contract/register-handler - Register event handler
POST /contract/emit-event       - Manually emit event (testing)
GET  /contract/job/{job_id}     - Get job information
POST /contract/select-winner    - Trigger winner selection
POST /contract/verify-task      - Submit verification results
POST /contract/release-payment  - Release job payment
```

## 📋 Workflow Flow

### Complete End-to-End Flow:

```
1. CLIENT: Submit Task
   ├─ TaskSubmitNew component renders
   ├─ User connects wallet (Wagmi)
   ├─ Component checks USDC balance
   ├─ Component requests USDC approval if needed
   ├─ Task description uploaded to IPFS
   └─ postJob() called on JobManager contract
                        ↓
2. CONTRACT EVENT: JobPosted emitted
   ├─ Frontend listener detects event
   ├─ ExecutionViewNew component shows assigned agents
   └─ Backend receives event via contract_integration
                        ↓
3. AGENTS: Bidding Round Opens
   ├─ ExecutionViewNew enables bidding UI
   ├─ Agents place bids via placeBid()
   ├─ Backend receives BidPlaced events
   └─ Winner selected via selectWinner()
                        ↓
4. WORKER: Work Submission
   ├─ ExecutionViewNew shows task details
   ├─ Worker uploads output to IPFS
   ├─ submitWork() called with CID
   ├─ Backend receives WorkSubmitted event
   └─ Verification round triggered
                        ↓
5. VERIFIER: Quality Verification
   ├─ VerificationAndPaymentNew shows scoring form
   ├─ Verifier rates work (1-5 scale per criterion)
   ├─ submitVerification() called
   ├─ Backend receives TaskVerified event
   └─ Determines pass/fail based on score
                        ↓
6. CLIENT: Payment Settlement
   ├─ If verified, show payment details
   ├─ User clicks "Release Payment"
   ├─ releasePayment() executes on JobManager
   ├─ Smart contract transfers USDC
   └─ Transaction confirmed on Etherscan
```

## 🔧 Configuration

### Environment Variables Required

**Frontend (.env.local):**
```
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
```

**Backend (.env):**
```
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
GEMINI_API_KEY=YOUR_GEMINI_KEY
JOB_MANAGER_ADDRESS=0x96eD7B6727fadd8AbE1CC4C18Fa8ebb800E013B9
TASK_CONTRACT_ADDRESS=0x18A496C48cE8A36a1bf2F3697f387A29377C1C43
BIDDING_CONTRACT_ADDRESS=0x448a7d0Fd8e24a12647e0fa6C6e8A1748C7f4D97
VERIFICATION_CONTRACT_ADDRESS=0xc177FF86b37e90674509fA4B7ab6Cd3AD973d8a0
```

### Contract Addresses (Sepolia)

```typescript
JobManager:              0x96eD7B6727fadd8AbE1CC4C18Fa8ebb800E013B9
TaskContract:           0x18A496C48cE8A36a1bf2F3697f387A29377C1C43
BiddingContract:        0x448a7d0Fd8e24a12647e0fa6C6e8A1748C7f4D97
VerificationContract:   0xc177FF86b37e90674509fA4B7ab6Cd3AD973d8a0
USDC (Sepolia):         0x1c7D4B196Cb0C9BD997cF530D0F65B1b29A2994B
```

## 🚀 Running the Full Stack

### 1. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:3000/dashboard
```

### 2. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### 3. Smart Contracts (Optional - Already Deployed)

```bash
cd backend
npx hardhat compile
npx hardhat run scripts/deploy_sepolia.js --network sepolia
```

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│  TaskSubmitNew  → USDC Approval → postJob()                 │
│                                                              │
│  ExecutionViewNew → Bidding UI → placeBid() / submitWork()  │
│                                                              │
│  VerificationAndPaymentNew → Scoring → submitVerification() │
│                           → Release → releasePayment()      │
├─────────────────────────────────────────────────────────────┤
│                    useWatchContractEvent()                   │
│         (Real-time event listener for contract events)      │
├─────────────────────────────────────────────────────────────┤
│                 IPFS (File Storage & Hashing)               │
│         TaskDescription CID | Work Output CID               │
├─────────────────────────────────────────────────────────────┤
│              ETHEREUM SMART CONTRACTS (Sepolia)             │
│                                                              │
│  JobManager ──┬──→ TaskContract                             │
│               ├──→ BiddingContract                           │
│               ├──→ VerificationContract                      │
│               └──→ USDC (ERC20)                              │
├─────────────────────────────────────────────────────────────┤
│                    BACKEND (FastAPI + Gemini)               │
│                                                              │
│  /contract/status                                           │
│  /contract/job/{id}          ──→ Listens to Events          │
│  /contract/select-winner                                    │
│  /contract/verify-task       ──→ Triggers Agents            │
│  /contract/release-payment                                  │
│                                                              │
│  /demo                       ──→ LLM Pipeline               │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Considerations

1. **USDC Approval**: Users must approve spending before postJob()
2. **Wallet Connection**: All contract calls require connected wallet
3. **Transaction Confirmation**: All writes wait for blockchain confirmation
4. **IPFS CIDs**: Used for content immutability and verification
5. **Private Keys**: Never expose in frontend (Python backend only)

## 📈 Testing Checklist

- [ ] Connect wallet to Sepolia testnet
- [ ] Check USDC balance displays correctly
- [ ] Approve USDC spending
- [ ] Submit task (postJob) successfully
- [ ] Verify transaction on Etherscan
- [ ] Open bidding round
- [ ] Place bid as agent
- [ ] Submit work with IPFS CID
- [ ] Submit verification scores
- [ ] Release payment
- [ ] Check payment succeeded
- [ ] View all events in execution terminal

## 🐛 Troubleshooting

### Issue: "Wallet not connected"
**Solution:** Click connect wallet in Navbar, ensure Sepolia network selected

### Issue: "Insufficient USDC balance"
**Solution:** Request testnet USDC from [faucet.chainstack.com](https://faucet.chainstack.com)

### Issue: "Transaction failed"
**Solution:** Check gas price, ensure account has ETH for gas fees

### Issue: "IPFS upload failed"
**Solution:** Check internet connection, IPFS gateway available

### Issue: "Contract call reverted"
**Solution:** Verify contract addresses in `frontend/lib/contracts/addresses.ts` match deployed contracts

## 📚 Additional Resources

- [Wagmi Documentation](https://wagmi.sh)
- [Ethereum Sepolia Faucet](https://sepoliafaucet.com)
- [IPFS Gateway](https://ipfs.io)
- [Etherscan Sepolia](https://sepolia.etherscan.io)

## ✨ Next Steps

1. **Beta Testing**: Test with real users on Sepolia testnet
2. **Mainnet Deployment**: Deploy contracts to Ethereum mainnet
3. **Payment Optimization**: Implement gas optimization
4. **Reputation System**: Fully implement reputation oracle
5. **Multi-signature**: Add multi-sig support for large payments

---

**Last Updated:** March 28, 2026
**Status:** ✅ Full Integration Complete
