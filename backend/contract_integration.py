"""
Backend Contract Integration
Connects the FastAPI backend to Ethereum smart contracts for event listening and orchestration
"""

from typing import Dict, List, Optional
import asyncio
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import os
import json

load_dotenv()

# Configuration
RPC_URL = os.getenv('RPC_URL', 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY')
PRIVATE_KEY = os.getenv('PRIVATE_KEY', '0x')
JOB_MANAGER_ADDRESS = os.getenv('JOB_MANAGER_ADDRESS', '0x96eD7B6727fadd8AbE1CC4C18Fa8ebb800E013B9')
TASK_CONTRACT_ADDRESS = os.getenv('TASK_CONTRACT_ADDRESS', '0x18A496C48cE8A36a1bf2F3697f387A29377C1C43')
BIDDING_CONTRACT_ADDRESS = os.getenv('BIDDING_CONTRACT_ADDRESS', '0x448a7d0Fd8e24a12647e0fa6C6e8A1748C7f4D97')
VERIFICATION_CONTRACT_ADDRESS = os.getenv('VERIFICATION_CONTRACT_ADDRESS', '0xc177FF86b37e90674509fA4B7ab6Cd3AD973d8a0')

# Initialize Web3
web3 = Web3(Web3.HTTPProvider(RPC_URL))

# Event handlers registry
event_handlers: Dict[str, List] = {
    'JobPosted': [],
    'BidPlaced': [],
    'WorkSubmitted': [],
    'TaskVerified': [],
    'PaymentReleased': []
}


def register_event_handler(event_name: str, handler):
    """Register a handler for contract events"""
    if event_name in event_handlers:
        event_handlers[event_name].append(handler)
    else:
        raise ValueError(f"Unknown event: {event_name}")


async def emit_event(event_name: str, event_data: Dict):
    """Emit an event to all registered handlers"""
    if event_name in event_handlers:
        for handler in event_handlers[event_name]:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event_data)
                else:
                    handler(event_data)
            except Exception as e:
                print(f"Error in event handler for {event_name}: {e}")


class ContractManager:
    """Manages interactions with smart contracts"""
    
    def __init__(self):
        self.web3 = web3
        self.account = Account.from_key(PRIVATE_KEY) if PRIVATE_KEY != '0x' else None
        self.job_manager_address = Web3.to_checksum_address(JOB_MANAGER_ADDRESS)
        self.task_contract_address = Web3.to_checksum_address(TASK_CONTRACT_ADDRESS)
        self.bidding_contract_address = Web3.to_checksum_address(BIDDING_CONTRACT_ADDRESS)
        self.verification_contract_address = Web3.to_checksum_address(VERIFICATION_CONTRACT_ADDRESS)
        
    def get_job_manager_contract(self, abi: List):
        """Get Job Manager contract instance"""
        return self.web3.eth.contract(
            address=self.job_manager_address,
            abi=abi
        )
    
    def get_task_contract(self, abi: List):
        """Get Task contract instance"""
        return self.web3.eth.contract(
            address=self.task_contract_address,
            abi=abi
        )
    
    def get_bidding_contract(self, abi: List):
        """Get Bidding contract instance"""
        return self.web3.eth.contract(
            address=self.bidding_contract_address,
            abi=abi
        )
    
    def get_verification_contract(self, abi: List):
        """Get Verification contract instance"""
        return self.web3.eth.contract(
            address=self.verification_contract_address,
            abi=abi
        )
    
    async def listen_to_job_posted_events(self, job_manager_abi: List, from_block: int = 'latest'):
        """Listen for JobPosted events"""
        contract = self.get_job_manager_contract(job_manager_abi)
        
        event_filter = contract.events.JobPosted.create_filter(from_block=from_block)
        
        while True:
            try:
                for event in event_filter.get_new_entries():
                    event_data = {
                        'jobId': event.args.jobId,
                        'client': event.args.client,
                        'descriptionCID': event.args.descriptionCID,
                        'budget': event.args.budget,
                        'timestamp': event.args.timestamp,
                        'txHash': event.transactionHash.hex()
                    }
                    await emit_event('JobPosted', event_data)
                    print(f"JobPosted event: Job #{event.args.jobId}")
                
                await asyncio.sleep(5)  # Poll every 5 seconds
            except Exception as e:
                print(f"Error listening to JobPosted: {e}")
                await asyncio.sleep(10)
    
    async def listen_to_bid_placed_events(self, bidding_abi: List, from_block: int = 'latest'):
        """Listen for BidPlaced events"""
        contract = self.get_bidding_contract(bidding_abi)
        
        event_filter = contract.events.BidPlaced.create_filter(from_block=from_block)
        
        while True:
            try:
                for event in event_filter.get_new_entries():
                    event_data = {
                        'taskId': event.args.taskId,
                        'bidder': event.args.bidder,
                        'quotedPrice': event.args.quotedPrice,
                        'timestamp': event.args.timestamp,
                        'txHash': event.transactionHash.hex()
                    }
                    await emit_event('BidPlaced', event_data)
                    print(f"BidPlaced event: Task #{event.args.taskId}")
                
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Error listening to BidPlaced: {e}")
                await asyncio.sleep(10)
    
    async def listen_to_work_submitted_events(self, task_abi: List, from_block: int = 'latest'):
        """Listen for WorkSubmitted events"""
        contract = self.get_task_contract(task_abi)
        
        event_filter = contract.events.WorkSubmitted.create_filter(from_block=from_block)
        
        while True:
            try:
                for event in event_filter.get_new_entries():
                    event_data = {
                        'taskId': event.args.taskId,
                        'worker': event.args.worker,
                        'outputCID': event.args.outputCID,
                        'timestamp': event.args.timestamp,
                        'txHash': event.transactionHash.hex()
                    }
                    await emit_event('WorkSubmitted', event_data)
                    print(f"WorkSubmitted event: Task #{event.args.taskId}")
                
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Error listening to WorkSubmitted: {e}")
                await asyncio.sleep(10)
    
    async def listen_to_task_verified_events(self, verification_abi: List, from_block: int = 'latest'):
        """Listen for TaskVerified events"""
        contract = self.get_verification_contract(verification_abi)
        
        event_filter = contract.events.TaskVerified.create_filter(from_block=from_block)
        
        while True:
            try:
                for event in event_filter.get_new_entries():
                    event_data = {
                        'taskId': event.args.taskId,
                        'passed': event.args.passed,
                        'averageScore': event.args.averageScore,
                        'timestamp': event.args.timestamp,
                        'txHash': event.transactionHash.hex()
                    }
                    await emit_event('TaskVerified', event_data)
                    print(f"TaskVerified event: Task #{event.args.taskId} - {'Passed' if event.args.passed else 'Failed'}")
                
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Error listening to TaskVerified: {e}")
                await asyncio.sleep(10)
    
    def is_connected(self) -> bool:
        """Check if connected to Ethereum network"""
        try:
            return self.web3.is_connected()
        except:
            return False
    
    def get_account_balance(self) -> Optional[float]:
        """Get account balance in ETH"""
        if not self.account:
            return None
        try:
            balance_wei = self.web3.eth.get_balance(self.account.address)
            return self.web3.from_wei(balance_wei, 'ether')
        except Exception as e:
            print(f"Error getting balance: {e}")
            return None


# Global contract manager instance
contract_manager = ContractManager()


def get_contract_manager() -> ContractManager:
    """Get the contract manager instance"""
    return contract_manager


# Example event handlers
async def handle_job_posted(event_data: Dict):
    """Handle JobPosted events"""
    print(f"Handling JobPosted: {event_data}")
    # Trigger planner agent here
    pass


async def handle_bid_placed(event_data: Dict):
    """Handle BidPlaced events"""
    print(f"Handling BidPlaced: {event_data}")
    # Update bid ranking, trigger bid selection if needed
    pass


async def handle_work_submitted(event_data: Dict):
    """Handle WorkSubmitted events"""
    print(f"Handling WorkSubmitted: {event_data}")
    # Trigger verification process
    pass


async def handle_task_verified(event_data: Dict):
    """Handle TaskVerified events"""
    print(f"Handling TaskVerified: {event_data}")
    # If passed, trigger payment release
    # If failed, trigger retry mechanism
    pass


# Register default handlers
register_event_handler('JobPosted', handle_job_posted)
register_event_handler('BidPlaced', handle_bid_placed)
register_event_handler('WorkSubmitted', handle_work_submitted)
register_event_handler('TaskVerified', handle_task_verified)
