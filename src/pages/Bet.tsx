
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { abi as predictionAbi } from "@/abi/abi";

const tokenAbi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export default function Bet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<"0" | "1">("0");
  const [optionA, setOptionA] = useState("Option A");
  const [optionB, setOptionB] = useState("Option B");
  const { toast } = useToast();
  const { address, chain } = useAccount();

  const BETTING_AMOUNT = parseEther("0.00001");
  const PREDICTION_CONTRACT = import.meta.env.VITE_PREDICTION_CONTRACT_ADDRESS as `0x${string}`;
  const BETTING_TOKEN = import.meta.env.VITE_TOKEN_ADDRESS as `0x${string}`;

  const { data: marketData } = useReadContract({
    address: PREDICTION_CONTRACT,
    abi: predictionAbi,
    functionName: "getMarketInfo",
    args: [BigInt(id)],
  });

  useEffect(() => {
    if (marketData) {
      setOptionA(marketData[1]); // Assuming optionA is at index 1
      setOptionB(marketData[2]); // Assuming optionB is at index 2
    }
  }, [marketData]);

  const { data: approvalHash, writeContract: approveToken } = useWriteContract();
  const { isSuccess: isApprovalConfirmed, isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approvalHash });

  const { data: purchaseHash, writeContract: buyShares } = useWriteContract();
  const { isSuccess: isPurchaseConfirmed, isLoading: isPurchasing } = useWaitForTransactionReceipt({ hash: purchaseHash });

  useEffect(() => {
    if (isApprovalConfirmed) {
      buyShares({
        address: PREDICTION_CONTRACT,
        abi: predictionAbi,
        functionName: "buyShares",
        args: [BigInt(id), prediction === "0", BETTING_AMOUNT],
        chain,
        account: address,
      });
    }
  }, [isApprovalConfirmed]);

  useEffect(() => {
    if (isPurchaseConfirmed) {
      alert("Success ✅ Shares purchased successfully!");
      navigate("/markets");
    }
  }, [isPurchaseConfirmed]);

  const handleApproval = async () => {
    try {
      await approveToken({
        address: BETTING_TOKEN,
        abi: tokenAbi,
        functionName: "approve",
        args: [PREDICTION_CONTRACT, BETTING_AMOUNT],
        chain,
        account: address,
      });
    } catch (error) {
      toast({
        title: "Approval Failed ❌",
        description: "Failed to approve token. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      toast({
        title: "Error ❌",
        description: "Market ID is required",
        variant: "destructive",
      });
      return;
    }
    await handleApproval();
  };

  const isProcessing = isApproving || isPurchasing;

  return (
    <div className="px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
        <div className="border-black border-4 rounded-2xl p-6">
          <h1 className="font-brice-semibold text-2xl mb-6">Purchase Shares</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block mb-2 font-medium">Amount (ETN)</label>
              <input
                type="text"
                value="0.001"
                className="w-full p-3 border-2 border-black rounded-xl bg-gray-100"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">BTC TO THE MOON !</p>
            </div>
            <div>
              <label className="block mb-2 font-medium">Choose Option</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPrediction("0")}
                  className={`p-3 border-2 border-black rounded-xl font-medium ${prediction === "0" ? "bg-[#99ff88]" : "bg-white"}`}
                  disabled={isProcessing}
                >
                  {optionA}
                </button>
                <button
                  type="button"
                  onClick={() => setPrediction("1")}
                  className={`p-3 border-2 border-black rounded-xl font-medium ${prediction === "1" ? "bg-[#ff6961]" : "bg-white"}`}
                  disabled={isProcessing}
                >
                  {optionB}
                </button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              type="submit"
              disabled={isProcessing}
              className="mt-4 w-full bg-[#99ff88] text-black py-4 px-6 rounded-xl border-black border-2 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isApproving ? "Approving Token..." : "Purchasing Shares..."}
                </div>
              ) : (
                "Purchase Shares"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
