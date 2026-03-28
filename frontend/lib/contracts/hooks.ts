import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { useCallback, useState, useRef } from 'react';
import { parseUnits } from 'viem';
import { SEPOLIA_ADDRESSES } from './addresses';
import { JobManagerABI, TaskContractABI, BiddingContractABI, VerificationContractABI, ERC20ABI } from './abis';

// USDC on Sepolia
const USDC_ADDRESS = '0x1c7D4B196Cb0C9BD997cF530D0F65B1b29A2994B';

/**
 * Hook for USDC approval
 */
export const useUSDCApproval = () => {
  const { writeContractAsync, isPending } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const approveUSDC = useCallback(
    async (spender: string, amount: string) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [spender as `0x${string}`, parseUnits(amount, 6)],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Approval failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { approveUSDC, isPending, error };
};

/**
 * Hook for posting a job
 */
export const usePostJob = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const postJob = useCallback(
    async (descriptionCID: string, budget: string) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.JobManager as `0x${string}`,
          abi: JobManagerABI,
          functionName: 'postJob',
          args: [descriptionCID, parseUnits(budget, 6)],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Job posting failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { postJob, isPending, txHash: hash, error };
};

/**
 * Hook for creating a task (planning phase)
 */
export const useCreateTask = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(
    async (jobId: number, title: string, rubricCID: string, budget: string, deadline: number = 604800) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.TaskContract as `0x${string}`,
          abi: TaskContractABI,
          functionName: 'createTask',
          args: [jobId, title, rubricCID, parseUnits(budget, 6), deadline],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Task creation failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { createTask, isPending, txHash: hash, error };
};

/**
 * Hook for opening bid round
 */
export const useOpenBidRound = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const openBidRound = useCallback(
    async (taskId: number, minReputation: number, bondAmount: string) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.TaskContract as `0x${string}`,
          abi: TaskContractABI,
          functionName: 'openBidRound',
          args: [taskId, minReputation, parseUnits(bondAmount, 6)],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Bid round opening failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { openBidRound, isPending, txHash: hash, error };
};

/**
 * Hook for placing a bid
 */
export const usePlaceBid = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const placeBid = useCallback(
    async (taskId: number, quotedPrice: string, credentialsCID: string) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.BiddingContract as `0x${string}`,
          abi: BiddingContractABI,
          functionName: 'placeBid',
          args: [taskId, parseUnits(quotedPrice, 6), credentialsCID],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Bid placement failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { placeBid, isPending, txHash: hash, error };
};

/**
 * Hook for submitting work
 */
export const useSubmitWork = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const submitWork = useCallback(
    async (taskId: number, outputCID: string) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.TaskContract as `0x${string}`,
          abi: TaskContractABI,
          functionName: 'submitWork',
          args: [taskId, outputCID],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Work submission failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { submitWork, isPending, txHash: hash, error };
};

/**
 * Hook for opening verification round
 */
export const useOpenVerificationRound = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const openVerificationRound = useCallback(
    async (taskId: number, requiredQuorum: number) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.VerificationContract as `0x${string}`,
          abi: VerificationContractABI,
          functionName: 'openVerificationRound',
          args: [taskId, requiredQuorum],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Verification round opening failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { openVerificationRound, isPending, txHash: hash, error };
};

/**
 * Hook for submitting verification scores
 */
export const useSubmitVerification = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const submitVerification = useCallback(
    async (taskId: number, score: number, evidenceCID: string = "") => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.VerificationContract as `0x${string}`,
          abi: VerificationContractABI,
          functionName: 'submitScore',
          args: [taskId, score, evidenceCID],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Verification submission failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { submitVerification, isPending, txHash: hash, error };
};

/**
 * Hook for releasing payment
 */
export const useReleasePayment = () => {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const releasePayment = useCallback(
    async (taskId: number) => {
      try {
        setError(null);
        const result = await writeContractAsync({
          address: SEPOLIA_ADDRESSES.JobManager as `0x${string}`,
          abi: JobManagerABI,
          functionName: 'releasePayment',
          args: [taskId],
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Payment release failed';
        setError(errorMsg);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { releasePayment, isPending, txHash: hash, error };
};

/**
 * Hook to read USDC balance
 */
export const useUSDCBalance = (address?: string) => {
  const { data: balance, isLoading } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
  });

  return { balance: balance as bigint | undefined, isLoading };
};

/**
 * Hook to read USDC allowance
 */
export const useUSDCAllowance = (owner?: string, spender?: string) => {
  const { data: allowance, isLoading } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner as `0x${string}`, spender as `0x${string}`] : undefined,
  });

  return { allowance: allowance as bigint | undefined, isLoading };
};

/**
 * Hook to get next job ID
 */
export const useNextJobId = () => {
  const { data: jobId, isLoading } = useReadContract({
    address: SEPOLIA_ADDRESSES.JobManager as `0x${string}`,
    abi: JobManagerABI,
    functionName: 'nextJobId',
  });

  return { jobId: jobId as bigint | undefined, isLoading };
};

/**
 * Hook to listen to JobPosted events
 */
export const useJobPostedEvent = (
  onEventReceived: (jobId: bigint, client: string, descriptionCID: string) => void
) => {
  useWatchContractEvent({
    address: SEPOLIA_ADDRESSES.JobManager as `0x${string}`,
    abi: JobManagerABI,
    eventName: 'JobPosted',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event = log as any;
        if (event.args) {
          onEventReceived(
            event.args.jobId,
            event.args.client,
            event.args.descriptionCID
          );
        }
      });
    },
  });
};

/**
 * Hook to listen to BidPlaced events
 */
export const useBidPlacedEvent = (
  onEventReceived: (taskId: bigint, bidder: string, quotedPrice: bigint) => void
) => {
  useWatchContractEvent({
    address: SEPOLIA_ADDRESSES.BiddingContract as `0x${string}`,
    abi: BiddingContractABI,
    eventName: 'BidPlaced',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event = log as any;
        if (event.args) {
          onEventReceived(
            event.args.taskId,
            event.args.bidder,
            event.args.quotedPrice
          );
        }
      });
    },
  });
};

/**
 * Hook to listen to WorkSubmitted events
 */
export const useWorkSubmittedEvent = (
  onEventReceived: (taskId: bigint, worker: string, outputCID: string) => void
) => {
  useWatchContractEvent({
    address: SEPOLIA_ADDRESSES.TaskContract as `0x${string}`,
    abi: TaskContractABI,
    eventName: 'WorkSubmitted',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event = log as any;
        if (event.args) {
          onEventReceived(
            event.args.taskId,
            event.args.worker,
            event.args.outputCID
          );
        }
      });
    },
  });
};

/**
 * Hook to listen to TaskVerified events
 */
export const useTaskVerifiedEvent = (
  onEventReceived: (taskId: bigint, passed: boolean, averageScore: number) => void
) => {
  useWatchContractEvent({
    address: SEPOLIA_ADDRESSES.VerificationContract as `0x${string}`,
    abi: VerificationContractABI,
    eventName: 'TaskVerified',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event = log as any;
        if (event.args) {
          onEventReceived(
            event.args.taskId,
            event.args.passed,
            event.args.averageScore
          );
        }
      });
    },
  });
};
