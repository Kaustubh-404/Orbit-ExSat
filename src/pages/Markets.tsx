import React from "react";
import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useReadContract } from "wagmi";
import { abi } from "@/abi/abi";
import { useState, useEffect } from "react";

interface Market {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  endTime: number;
  outcome: number;
  totalOptionAShares: number;
  totalOptionBShares: number;
  totalPool: number;
  resolved: boolean;
  image?: string;
}

const useMarket = (marketId: number) => {
  return useReadContract({
    address: import.meta.env.VITE_PREDICTION_CONTRACT_ADDRESS,
    abi: abi,
    functionName: "getMarketInfo",
    args: [BigInt(marketId)],
  });
};

const useMarketsData = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const market1 = useMarket(1);
  const market2 = useMarket(2);
  const market3 = useMarket(3);
  const market4 = useMarket(4);
  const market5 = useMarket(5);

  useEffect(() => {
    const processMarketData = () => {
      setIsLoading(true);
      const marketResults = [
        { result: market1, id: 1 },
        { result: market2, id: 2 },
        { result: market3, id: 3 },
        { result: market4, id: 4 },
        { result: market5, id: 5 },
      ];
      const newMarkets: Market[] = [];

      marketResults.forEach(({ result, id }) => {
        if (result.data) {
          const [
            question,
            optionA,
            optionB,
            endTime,
            outcome,
            totalOptionAShares,
            totalOptionBShares,
            resolved,
          ] = result.data as [
            string,
            string,
            string,
            bigint,
            number,
            bigint,
            bigint,
            boolean
          ];

          const totalOptionA = Number(totalOptionAShares);
          const totalOptionB = Number(totalOptionBShares);

          newMarkets.push({
            id,
            question,
            optionA,
            optionB,
            endTime: Number(endTime),
            outcome: Number(outcome),
            totalOptionAShares: totalOptionA,
            totalOptionBShares: totalOptionB,
            totalPool: totalOptionA + totalOptionB,
            resolved,
            image: "cards.jpeg",
          });
        }
      });

      if (newMarkets.length > 0) {
        setMarkets(newMarkets.sort((a, b) => a.id - b.id));
      }

      const hasError = marketResults.some(({ result }) => result.isError);
      if (hasError) {
        setError("Error fetching market data");
      } else {
        setError(null);
      }

      setIsLoading(false);
    };

    processMarketData();
  }, [
    market1.data,
    market2.data,
    market3.data,
    market4.data,
    market5.data,
    market1.isError,
    market2.isError,
    market3.isError,
    market4.isError,
    market5.isError,
  ]);

  return { markets, isLoading, error };
};

const MarketCard = ({ market, index }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border-black border-4 rounded-2xl mb-6 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/bet/${market.id}`)}
    >
      <div className="relative">
        <img
          src={market.image}
          alt={market.question}
          className="w-full h-48 object-cover"
          draggable="false"
        />
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        <div className="absolute top-4 right-4 flex space-x-2">
          <div className="bg-[#ff6961] p-2 rounded-full border-2 border-black">
            <X color="white" size={20} />
          </div>
          <div className="bg-[#99ff88] p-2 rounded-full border-2 border-black">
            <Check color="black" size={20} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h2 className="font-brice-semibold text-xl mb-2">
            {market.question}
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span>{market.optionA}</span>
              <span>vs</span>
              <span>{market.optionB}</span>
            </div>
            <Progress
              value={(market.totalOptionAShares / market.totalPool) * 100}
              className="h-2"
            />
            <div className="flex justify-between text-sm">
              <span>
                {((market.totalOptionAShares / market.totalPool) * 100).toFixed(
                  1
                )}
                % Chance
              </span>
              <span>{market.resolved ? "Ended" : "Active"}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Explore() {
  const { markets, isLoading, error } = useMarketsData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">No markets available</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-brice-semibold text-2xl mb-6">Explore Markets</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {markets.map((market, index) => (
            <MarketCard key={market.id} market={market} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}