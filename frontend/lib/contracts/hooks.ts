import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import { SEPOLIA_ADDRESSES } from './addresses';
import { JobManagerABI, TaskContractABI, BiddingContractABI, VerificationContractABI, ERC20ABI } from './abis';

// USDC on Sepolia
const USDC_ADDRESS = '0x1c7D4B196Cb0C9BD997cF530D0F65B1b29A2994B';

/**
 * Hook for USDC approval
 */
export const useUSDCApproval = () => {
  const { writeContract, isPending } = useWriteContract();

  const approveUSDC = useCallback(
    async (spender: string, amount: string) => {
      writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseUnits(amount, 6)],
      });
    },
    [writeContract]
  );

  return { approveUSDC, isPending };
};

/**
 * Hook for posting a job
 */
export const usePostJob = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const postJob = useCallback(
    async (descriptionCID: string, budget: string, timeLimit: number = 86400) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.JobManager as `0x${string}`,
        abi: JobManagerABI,
        functionName: 'postJob',
        args: [descriptionCID, parseUnits(budget, 6), timeLimit],
      });
    },
    [writeContract]
  );

  return { postJob, isPending, txHash: hash };
};

/**
 * Hook for creating a task (planning phase)
 */
export const useCreateTask = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const createTask = useCallback(
    async (jobId: number, rubricesCID: string, budget: string) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.TaskContract as `0x${string}`,
        abi: TaskContractABI,
        functionName: 'createTask',
        args: [jobId, rubricesCID, parseUnits(budget, 6)],
      });
    },
    [writeContract]
  );

  return { createTask, isPending, txHash: hash };
};

/**
 * Hook for opening bid round
 */
export const useOpenBidRound = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const openBidRound = useCallback(
    async (taskId: number, minReputation: number, bondAmount: string) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.TaskContract as `0x${string}`,
        abi: TaskContractABI,
        functionName: 'openBidRound',
        args: [taskId, minReputation, parseUnits(bondAmount, 6)],
      });
    },
    [writeContract]
  );

  return { openBidRound, isPending, txHash: hash };
};

/**
 * Hook for placing a bid
 */
export const usePlaceBid = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const placeBid = useCallback(
    async (taskId: number, quotedPrice: string, credentials: string) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.BiddingContract as `0x${string}`,
        abi: BiddingContractABI,
        functionName: 'placeBid',
        args: [taskId, parseUnits(quotedPrice, 6), credentials],
      });
    },
    [writeContract]
  );

  return { placeBid, isPending, txHash: hash };
};

/**
 * Hook for submitting work
 */
export const useSubmitWork = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const submitWork = useCallback(
    async (taskId: number, outputCID: string) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.TaskContract as `0x${string}`,
        abi: TaskContractABI,
        functionName: 'submitWork',
        args: [taskId, outputCID],
      });
    },
    [writeContract]
  );

  return { submitWork, isPending, txHash: hash };
};

/**
 * Hook for opening verification round
 */
export const useOpenVerificationRound = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const openVerificationRound = useCallback(
    async (taskId: number, requiredQuorum: number) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.VerificationContract as `0x${string}`,
        abi: VerificationContractABI,
        functionName: 'openVerificationRound',
        args: [taskId, requiredQuorum],
      });
    },
    [writeContract]
  );

  return { openVerificationRound, isPending, txHash: hash };
};

/**
 * Hook for submitting verification scores
 */
export const useSubmitVerification = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const submitVerification = useCallback(
    async (taskId: number, scores: number[]) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.VerificationContract as `0x${string}`,
        abi: VerificationContractABI,
        functionName: 'submitVerificationRound',
        args: [taskId, scores],
      });
    },
    [writeContract]
  );

  return { submitVerification, isPending, txHash: hash };
};

/**
 * Hook for releasing payment
 */
export const useReleasePayment = () => {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const releasePayment = useCallback(
    async (taskId: number) => {
      writeContract({
        address: SEPOLIA_ADDRESSES.JobManager as `0x${string}`,
        abi: JobManagerABI,
        functionName: 'releasePayment',
        args: [taskId],
      });
    },
    [writeContract]
  );

  return { releasePayment, isPending, txHash: hash };
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
